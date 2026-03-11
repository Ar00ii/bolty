import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isSafeUrl, sanitizeAiPrompt } from '../../common/sanitize/sanitize.util';

interface AgentResponse {
  reply: string;
  proposedPrice?: number;
  action?: 'accept' | 'reject' | 'counter';
}

@Injectable()
export class NegotiationService {
  private readonly logger = new Logger(NegotiationService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(key);
  }

  // ── Start or resume a negotiation ─────────────────────────────────────────

  async startNegotiation(buyerId: string, listingId: string) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, sellerId: true, title: true, price: true, currency: true, agentEndpoint: true },
    });
    if (!listing || listing.status !== 'ACTIVE') throw new NotFoundException('Listing not found');
    if (listing.sellerId === buyerId) throw new ForbiddenException('Cannot negotiate on your own listing');

    // Return existing active negotiation if one exists
    const existing = await this.prisma.agentNegotiation.findFirst({
      where: { listingId, buyerId, status: 'ACTIVE' },
      include: {
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true } },
        buyer: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (existing) return existing;

    const neg = await this.prisma.agentNegotiation.create({
      data: { listingId, buyerId },
      include: {
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true } },
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
          fromRole: neg.listing.agentEndpoint ? 'seller_agent' : 'seller_agent',
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
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true } },
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
        listing: { select: { id: true, title: true, price: true, currency: true, type: true } },
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
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true } },
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
        listing: { select: { id: true, title: true, price: true, currency: true, sellerId: true, agentEndpoint: true } },
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
            fromRole: updated!.listing.agentEndpoint ? 'seller_agent' : 'seller_agent',
            content: agentReply.reply,
            proposedPrice: agentReply.proposedPrice ?? null,
          },
        });
        await this.applyAction(id, agentReply);
      }
    }

    return this.getNegotiation(id, senderId);
  }

  // ── Accept / reject ───────────────────────────────────────────────────────

  async acceptDeal(id: string, userId: string) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: {
        listing: { select: { sellerId: true, price: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!neg || neg.status !== 'ACTIVE') throw new NotFoundException();
    if (neg.buyerId !== userId && neg.listing.sellerId !== userId) throw new ForbiddenException();

    const lastProposed = neg.messages.find((m) => m.proposedPrice != null);
    const agreedPrice = lastProposed?.proposedPrice ?? neg.listing.price;

    return this.prisma.agentNegotiation.update({
      where: { id },
      data: { status: 'AGREED', agreedPrice },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
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

  // ── Internal: call seller's webhook or fall back to Gemini ───────────────

  private async sellerAgentGreet(neg: any): Promise<AgentResponse | null> {
    if (neg.listing.agentEndpoint && isSafeUrl(neg.listing.agentEndpoint)) {
      return this.callWebhook(neg.listing.agentEndpoint, {
        event: 'negotiation.start',
        negotiationId: neg.id,
        listingId: neg.listing.id,
        listing: { title: neg.listing.title, askingPrice: neg.listing.price, currency: neg.listing.currency },
        history: [],
      });
    }
    return this.geminiGreet(neg.listing);
  }

  private async callSellerAgent(neg: any, message: string, proposedPrice?: number): Promise<AgentResponse | null> {
    if (neg.listing.agentEndpoint && isSafeUrl(neg.listing.agentEndpoint)) {
      return this.callWebhook(neg.listing.agentEndpoint, {
        event: 'negotiation.message',
        negotiationId: neg.id,
        listingId: neg.listing.id,
        listing: { title: neg.listing.title, askingPrice: neg.listing.price, currency: neg.listing.currency },
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
    return this.geminiNegotiate(neg, message, proposedPrice);
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

  private async geminiGreet(listing: { title: string; price: number; currency: string }): Promise<AgentResponse | null> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `You are an AI sales agent for "${listing.title}" listed at ${listing.price} ${listing.currency}.
A potential buyer just opened a negotiation. Greet them, briefly mention the product, and state the asking price. Be friendly and concise (2-3 sentences max).
Respond with ONLY JSON: {"reply": "your greeting"}`;
      const result = await model.generateContent(prompt);
      const match = result.response.text().match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { reply: String(parsed.reply), action: 'counter' };
      }
    } catch (err) {
      this.logger.error('Gemini greet failed', err);
    }
    return { reply: `Hi! I'm the agent for "${listing.title}". Asking price is ${listing.price} ${listing.currency}. Make me an offer!`, action: 'counter' };
  }

  private async geminiNegotiate(
    neg: any,
    buyerMessage: string,
    proposedPrice?: number,
  ): Promise<AgentResponse | null> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const history = neg.messages
        .map((m: any) => `[${m.fromRole}]${m.proposedPrice != null ? ` (offer: ${m.proposedPrice} ${neg.listing.currency})` : ''}: ${m.content}`)
        .join('\n');

      const prompt = `You are an AI sales agent for "${neg.listing.title}" (asking: ${neg.listing.price} ${neg.listing.currency}).
Negotiate on behalf of the seller. Rules:
- Accept if offer >= 80% of asking price.
- Counter-offer at midpoint between offer and asking if offer is 40–80%.
- Reject if offer < 40% of asking price.
- Be brief, friendly, and business-like.

History:
${history}

Buyer: "${buyerMessage}"${proposedPrice != null ? `\nBuyer offer: ${proposedPrice} ${neg.listing.currency}` : ''}

Respond ONLY with JSON: {"reply": "...", "proposedPrice": number_or_null, "action": "accept|reject|counter"}`;

      const result = await model.generateContent(prompt);
      const match = result.response.text().trim().match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          reply: String(parsed.reply || 'Interesting offer.'),
          proposedPrice: parsed.proposedPrice != null ? Number(parsed.proposedPrice) : undefined,
          action: ['accept', 'reject', 'counter'].includes(parsed.action) ? parsed.action : 'counter',
        };
      }
    } catch (err) {
      this.logger.error('Gemini negotiation failed', err);
    }
    return null;
  }

  private async applyAction(negId: string, response: AgentResponse) {
    if (response.action === 'accept') {
      await this.prisma.agentNegotiation.update({
        where: { id: negId },
        data: { status: 'AGREED', agreedPrice: response.proposedPrice ?? undefined },
      });
    } else if (response.action === 'reject') {
      await this.prisma.agentNegotiation.update({
        where: { id: negId },
        data: { status: 'REJECTED' },
      });
    }
  }
}
