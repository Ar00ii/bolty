import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { DmService } from '../dm/dm.service';
import { isSafeUrl, sanitizeAiPrompt } from '../../common/sanitize/sanitize.util';

interface AgentResponse {
  reply: string;
  proposedPrice?: number;
  action?: 'accept' | 'reject' | 'counter';
}

@Injectable()
export class NegotiationService {
  private readonly logger = new Logger(NegotiationService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly dmService: DmService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY') || '',
    });
  }

  // ── Start or resume a negotiation ─────────────────────────────────────────

  async startNegotiation(buyerId: string, listingId: string) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, sellerId: true, title: true, price: true, currency: true, agentEndpoint: true, minPrice: true },
    });
    if (!listing || listing.status !== 'ACTIVE') throw new NotFoundException('Listing not found');
    if (listing.sellerId === buyerId) throw new ForbiddenException('Cannot negotiate on your own listing');

    // Return existing active negotiation if one exists
    const existing = await this.prisma.agentNegotiation.findFirst({
      where: { listingId, buyerId, status: 'ACTIVE' },
      include: {
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true, minPrice: true } },
        buyer: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (existing) return existing;

    const neg = await this.prisma.agentNegotiation.create({
      data: { listingId, buyerId },
      include: {
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true, minPrice: true } },
        buyer: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Greet the buyer with an opening message from the seller agent
    const greeting = await this.sellerAgentGreet(neg);
    if (greeting) {
      await this.prisma.negotiationMessage.create({
        data: {
          negotiationId: neg.id,
          fromRole: 'seller_agent',
          content: greeting.reply,
          proposedPrice: greeting.proposedPrice ?? null,
        },
      });
    }

    return this.getNegotiation(neg.id, buyerId);
  }

  // ── Get a negotiation ─────────────────────────────────────────────────────

  async getNegotiation(id: string, userId: string) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true, minPrice: true } },
        buyer: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!neg) throw new NotFoundException();
    if (neg.buyerId !== userId && neg.listing.sellerId !== userId) throw new ForbiddenException();
    return neg;
  }

  async getMyNegotiations(userId: string) {
    return this.prisma.agentNegotiation.findMany({
      where: { OR: [{ buyerId: userId }, { listing: { sellerId: userId } }] },
      include: {
        listing: { select: { id: true, title: true, price: true, currency: true, type: true, minPrice: true } },
        buyer: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ── Send a message ────────────────────────────────────────────────────────

  async sendMessage(
    id: string,
    senderId: string,
    content: string,
    proposedPrice?: number,
  ) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true, minPrice: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!neg) throw new NotFoundException();
    if (neg.status !== 'ACTIVE') throw new BadRequestException('Negotiation is no longer active');
    if (neg.buyerId !== senderId && neg.listing.sellerId !== senderId) throw new ForbiddenException();

    const isBuyer = senderId === neg.buyerId;
    const safeContent = sanitizeAiPrompt(content.trim().slice(0, 1000));
    const safePrice = proposedPrice != null && proposedPrice > 0 ? proposedPrice : undefined;

    // Save the sender's message
    await this.prisma.negotiationMessage.create({
      data: {
        negotiationId: id,
        fromRole: isBuyer ? 'buyer' : 'seller',
        content: safeContent,
        proposedPrice: safePrice ?? null,
      },
    });

    // Re-fetch with the new message included
    const updated = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true, minPrice: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Trigger the opposite side's agent
    if (isBuyer) {
      const agentReply = await this.callSellerAgent(updated!, safeContent, safePrice);
      if (agentReply) {
        await this.prisma.negotiationMessage.create({
          data: {
            negotiationId: id,
            fromRole: 'seller_agent',
            content: agentReply.reply,
            proposedPrice: agentReply.proposedPrice ?? null,
          },
        });
        await this.applyAction(id, agentReply, updated!);
      }
    }

    return this.getNegotiation(id, senderId);
  }

  // ── Accept / reject ───────────────────────────────────────────────────────

  async acceptDeal(id: string, userId: string) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, sellerId: true, price: true, title: true, currency: true } },
        buyer: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!neg) throw new NotFoundException();
    // Allow accepting when ACTIVE or already AGREED (seller confirms agent-agreed deal)
    if (neg.status !== 'ACTIVE' && neg.status !== 'AGREED') throw new BadRequestException('Cannot accept this negotiation');
    if (neg.buyerId !== userId && neg.listing.sellerId !== userId) throw new ForbiddenException();

    const lastProposed = neg.messages.find((m) => m.proposedPrice != null);
    const agreedPrice = lastProposed?.proposedPrice ?? neg.listing.price;

    const updated = await this.prisma.agentNegotiation.update({
      where: { id },
      data: { status: 'AGREED', agreedPrice },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    // When the seller confirms/accepts, create an opening DM between buyer and seller
    const isSeller = userId === neg.listing.sellerId;
    if (isSeller) {
      await this.createDealDm(neg.listing.sellerId, neg.buyer.id, neg.listing.title, agreedPrice, neg.listing.currency);
    }

    return updated;
  }

  async rejectDeal(id: string, userId: string) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!neg || neg.status !== 'ACTIVE') throw new NotFoundException();
    if (neg.buyerId !== userId && neg.listing.sellerId !== userId) throw new ForbiddenException();

    return this.prisma.agentNegotiation.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  // ── Internal: call seller's webhook or fall back to Claude ───────────────

  private async sellerAgentGreet(neg: any): Promise<AgentResponse | null> {
    if (neg.listing.agentEndpoint && isSafeUrl(neg.listing.agentEndpoint)) {
      return this.callWebhook(neg.listing.agentEndpoint, {
        event: 'negotiation.start',
        negotiationId: neg.id,
        listingId: neg.listing.id,
        listing: { title: neg.listing.title, askingPrice: neg.listing.price, currency: neg.listing.currency, minPrice: neg.listing.minPrice },
        history: [],
      });
    }
    return this.claudeGreet(neg.listing);
  }

  private async callSellerAgent(neg: any, message: string, proposedPrice?: number): Promise<AgentResponse | null> {
    if (neg.listing.agentEndpoint && isSafeUrl(neg.listing.agentEndpoint)) {
      return this.callWebhook(neg.listing.agentEndpoint, {
        event: 'negotiation.message',
        negotiationId: neg.id,
        listingId: neg.listing.id,
        listing: { title: neg.listing.title, askingPrice: neg.listing.price, currency: neg.listing.currency, minPrice: neg.listing.minPrice },
        message,
        proposedPrice,
        history: neg.messages.map((m: any) => ({
          role: m.fromRole,
          content: m.content,
          proposedPrice: m.proposedPrice,
          timestamp: m.createdAt,
        })),
      });
    }
    return this.claudeNegotiate(neg, message, proposedPrice);
  }

  private async callWebhook(url: string, payload: unknown): Promise<AgentResponse | null> {
    try {
      const resp = await axios.post(url, payload, {
        timeout: 8000,
        headers: { 'Content-Type': 'application/json', 'X-Bolty-Event': (payload as any).event },
        maxBodyLength: 4096,
        maxContentLength: 4096,
      });
      const data = resp.data;
      return {
        reply: String(data?.reply || 'No response from agent.'),
        proposedPrice: data?.proposedPrice != null ? Number(data.proposedPrice) : undefined,
        action: ['accept', 'reject', 'counter'].includes(data?.action) ? data.action : 'counter',
      };
    } catch (err) {
      this.logger.warn(`Seller agent webhook failed (${url}): ${err.message}`);
      return null;
    }
  }

  private parseJson(text: string): any | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }

  private async claudeGreet(listing: { title: string; price: number; currency: string; minPrice?: number | null }): Promise<AgentResponse | null> {
    try {
      const floorNote = listing.minPrice != null
        ? ` (minimum I can accept: ${listing.minPrice} ${listing.currency})`
        : '';
      const prompt = `You are an AI sales agent for "${listing.title}" listed at ${listing.price} ${listing.currency}${floorNote}.
A potential buyer just opened a negotiation. Greet them, briefly mention the product, and state the asking price. Be friendly and concise (2-3 sentences max).
Respond with ONLY JSON: {"reply": "your greeting"}`;

      const res = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = this.parseJson((res.content[0] as { type: string; text: string }).text ?? '');
      if (parsed) return { reply: String(parsed.reply), action: 'counter' };
    } catch (err) {
      this.logger.error('Claude greet failed', err);
    }
    return { reply: `Hi! I'm the agent for "${listing.title}". Asking price is ${listing.price} ${listing.currency}. Make me an offer!`, action: 'counter' };
  }

  private async claudeNegotiate(
    neg: any,
    buyerMessage: string,
    proposedPrice?: number,
  ): Promise<AgentResponse | null> {
    try {
      const history = neg.messages
        .map((m: any) => `[${m.fromRole}]${m.proposedPrice != null ? ` (offer: ${m.proposedPrice} ${neg.listing.currency})` : ''}: ${m.content}`)
        .join('\n');

      const minPrice = neg.listing.minPrice;
      const floorRule = minPrice != null
        ? `- NEVER accept below ${minPrice} ${neg.listing.currency} — this is the seller's absolute floor.`
        : '';

      const prompt = `You are an AI sales agent for "${neg.listing.title}" (asking: ${neg.listing.price} ${neg.listing.currency}${minPrice != null ? `, minimum: ${minPrice} ${neg.listing.currency}` : ''}).
Negotiate on behalf of the seller. Rules:
- Accept if offer >= 80% of asking price (but never below the minimum floor).
- Counter-offer at midpoint between offer and asking if offer is 40–80%.
- Reject if offer < 40% of asking price or below the minimum floor.
${floorRule}
- Be brief, friendly, and business-like.

History:
${history}

Buyer: "${buyerMessage}"${proposedPrice != null ? `\nBuyer offer: ${proposedPrice} ${neg.listing.currency}` : ''}

Respond ONLY with JSON: {"reply": "...", "proposedPrice": number_or_null, "action": "accept|reject|counter"}`;

      const res = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = this.parseJson((res.content[0] as { type: string; text: string }).text ?? '');
      if (parsed) {
        let action: 'accept' | 'reject' | 'counter' = ['accept', 'reject', 'counter'].includes(parsed.action) ? parsed.action : 'counter';
        let finalPrice: number | undefined = parsed.proposedPrice != null ? Number(parsed.proposedPrice) : undefined;

        // Enforce minimum price floor
        if (minPrice != null && finalPrice != null && finalPrice < minPrice) {
          finalPrice = minPrice;
          action = 'counter';
        }
        if (minPrice != null && action === 'accept' && proposedPrice != null && proposedPrice < minPrice) {
          action = 'counter';
          finalPrice = minPrice;
        }

        return {
          reply: String(parsed.reply || 'Interesting offer.'),
          proposedPrice: finalPrice,
          action,
        };
      }
    } catch (err) {
      this.logger.error('Claude negotiation failed', err);
    }

    // Fallback: rule-based negotiation when Claude is unavailable
    const asking = neg.listing.price;
    const minPrice = neg.listing.minPrice;
    if (proposedPrice != null) {
      const ratio = proposedPrice / asking;
      if (ratio >= 0.8 && (minPrice == null || proposedPrice >= minPrice)) {
        return { reply: `Deal! I accept your offer of ${proposedPrice} ${neg.listing.currency}.`, proposedPrice, action: 'accept' };
      } else if (ratio >= 0.4 && (minPrice == null || proposedPrice >= minPrice)) {
        const counter = Math.round(((proposedPrice + asking) / 2) * 1e6) / 1e6;
        return { reply: `I appreciate the offer! How about we meet in the middle at ${counter} ${neg.listing.currency}?`, proposedPrice: counter, action: 'counter' };
      } else {
        const floor = minPrice ?? Math.round(asking * 0.7 * 1e6) / 1e6;
        return { reply: `That's below what I can accept. The lowest I can go is ${floor} ${neg.listing.currency}.`, proposedPrice: floor, action: 'counter' };
      }
    }
    return { reply: `Thanks for reaching out! My asking price is ${asking} ${neg.listing.currency}. What's your offer?`, action: 'counter' };
  }

  private async applyAction(negId: string, response: AgentResponse, neg: any) {
    if (response.action === 'accept') {
      const agreedPrice = response.proposedPrice ?? neg.listing.price;
      await this.prisma.agentNegotiation.update({
        where: { id: negId },
        data: { status: 'AGREED', agreedPrice },
      });

      // Notify seller by email that agent agreed a deal
      try {
        const seller = await this.prisma.user.findUnique({
          where: { id: neg.listing.sellerId },
          select: { email: true, username: true },
        });
        const buyer = await this.prisma.user.findUnique({
          where: { id: neg.buyerId },
          select: { username: true },
        });
        if (seller?.email) {
          const appUrl = this.config.get<string>('APP_URL') || 'https://bolty.dev';
          await this.emailService.sendAgentDealEmail(
            seller.email,
            seller.username || 'seller',
            neg.listing.title,
            agreedPrice,
            neg.listing.currency,
            buyer?.username || 'buyer',
            negId,
            appUrl,
          ).catch((err) => this.logger.error('Deal email failed', err));
        }
      } catch (err) {
        this.logger.error('Failed to send deal email', err);
      }
    } else if (response.action === 'reject') {
      await this.prisma.agentNegotiation.update({
        where: { id: negId },
        data: { status: 'REJECTED' },
      });
    }
  }

  // ── Create opening DM between buyer and seller after deal confirmed ────────

  private async createDealDm(sellerId: string, buyerId: string, listingTitle: string, agreedPrice: number, currency: string) {
    const dmContent = `🤖 Deal confirmed! Your agent agreed on "${listingTitle}" at ${agreedPrice} ${currency}. Use this chat to coordinate the transfer and payment.`;
    try {
      // Seller opens the DM to the buyer
      await this.dmService.sendSystemMessage(sellerId, buyerId, dmContent);
    } catch (err) {
      this.logger.error('Failed to create deal DM', err);
    }
  }
}
