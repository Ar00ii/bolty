import Anthropic from '@anthropic-ai/sdk';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { PrismaService } from '../../common/prisma/prisma.service';
import { isSafeUrl, sanitizeAiPrompt } from '../../common/sanitize/sanitize.util';
import { DmService } from '../dm/dm.service';
import { EmailService } from '../email/email.service';

import { AgentSandboxService, SandboxContext } from './agent-sandbox.service';
import { NegotiationsGateway } from './negotiations.gateway';

interface AgentResponse {
  reply: string;
  proposedPrice?: number;
  action?: 'accept' | 'reject' | 'counter';
}

// Max back-and-forth turns before the negotiation auto-expires
const MAX_TURNS = 15;

// Delay between AI agent turns (ms) — gives the "typing" feel
const TURN_DELAY_MS = 1500;

@Injectable()
export class NegotiationService {
  private readonly logger = new Logger(NegotiationService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly dmService: DmService,
    private readonly sandbox: AgentSandboxService,
    private readonly gateway: NegotiationsGateway,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY') || '',
    });
  }

  // ── Start or resume a negotiation ─────────────────────────────────────────

  async startNegotiation(buyerId: string, listingId: string) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        status: true,
        sellerId: true,
        title: true,
        price: true,
        currency: true,
        agentEndpoint: true,
        minPrice: true,
        fileKey: true,
        fileName: true,
        fileMimeType: true,
      },
    });
    if (!listing || listing.status !== 'ACTIVE') throw new NotFoundException('Listing not found');
    if (listing.sellerId === buyerId)
      throw new ForbiddenException('Cannot negotiate on your own listing');

    // Return existing active negotiation if one exists
    const existing = await this.prisma.agentNegotiation.findFirst({
      where: { listingId, buyerId, status: 'ACTIVE' },
      include: this.negotiationInclude(),
    });
    if (existing) return existing;

    const neg = await this.prisma.agentNegotiation.create({
      data: { listingId, buyerId },
      include: this.negotiationInclude(),
    });

    // Fire-and-forget: seller agent greets, then buyer agent responds, then loop
    void this.kickOffAiAiLoop(neg.id);

    return neg;
  }

  // ── Get negotiations ───────────────────────────────────────────────────────

  async getNegotiation(id: string, userId: string) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: this.negotiationInclude(),
    });
    if (!neg) throw new NotFoundException();
    if (neg.buyerId !== userId && neg.listing.sellerId !== userId) throw new ForbiddenException();
    return neg;
  }

  async getMyNegotiations(userId: string) {
    return this.prisma.agentNegotiation.findMany({
      where: { OR: [{ buyerId: userId }, { listing: { sellerId: userId } }] },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            type: true,
            minPrice: true,
          },
        },
        buyer: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // ── Send a message (only available in HUMAN mode) ─────────────────────────

  async sendMessage(id: string, senderId: string, content: string, proposedPrice?: number) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            sellerId: true,
            agentEndpoint: true,
            minPrice: true,
            fileKey: true,
            fileName: true,
            fileMimeType: true,
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!neg) throw new NotFoundException();
    if (neg.status !== 'ACTIVE') throw new BadRequestException('Negotiation is no longer active');
    if (neg.buyerId !== senderId && neg.listing.sellerId !== senderId)
      throw new ForbiddenException();

    // In AI_AI mode humans cannot type manually
    if (neg.mode === 'AI_AI') {
      throw new BadRequestException(
        'This negotiation is in AI-vs-AI mode. Request a switch to human mode first.',
      );
    }

    const isBuyer = senderId === neg.buyerId;
    const safeContent = sanitizeAiPrompt(content.trim().slice(0, 1000));
    const safePrice =
      proposedPrice !== null && proposedPrice !== undefined && proposedPrice > 0
        ? proposedPrice
        : undefined;

    const saved = await this.prisma.negotiationMessage.create({
      data: {
        negotiationId: id,
        fromRole: isBuyer ? 'buyer' : 'seller',
        content: safeContent,
        proposedPrice: safePrice ?? null,
      },
    });

    this.gateway.emitNewMessage(id, saved);

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
    if (neg.status !== 'ACTIVE' && neg.status !== 'AGREED')
      throw new BadRequestException('Cannot accept this negotiation');
    if (neg.buyerId !== userId && neg.listing.sellerId !== userId) throw new ForbiddenException();

    const lastProposed = neg.messages.find(
      (m) => m.proposedPrice !== null && m.proposedPrice !== undefined,
    );
    const agreedPrice = lastProposed?.proposedPrice ?? neg.listing.price;

    const updated = await this.prisma.agentNegotiation.update({
      where: { id },
      data: { status: 'AGREED', agreedPrice },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    this.gateway.emitStatusChange(id, { status: 'AGREED', agreedPrice });

    const isSeller = userId === neg.listing.sellerId;
    if (isSeller) {
      await this.createDealDm(
        neg.listing.sellerId,
        neg.buyer.id,
        neg.listing.title,
        agreedPrice,
        neg.listing.currency,
      );
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

    await this.prisma.agentNegotiation.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    this.gateway.emitStatusChange(id, { status: 'REJECTED' });

    return { id, status: 'REJECTED' };
  }

  // ── Human-mode switch (Pokemon trade handshake) ───────────────────────────

  /**
   * Either party requests switching to human negotiation.
   * The other party must call acceptHumanSwitch() to confirm.
   */
  async requestHumanSwitch(id: string, userId: string) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!neg) throw new NotFoundException();
    if (neg.status !== 'ACTIVE') throw new BadRequestException('Negotiation is not active');
    if (neg.buyerId !== userId && neg.listing.sellerId !== userId) throw new ForbiddenException();
    if ((neg as unknown as Record<string, unknown>).mode === 'HUMAN')
      throw new BadRequestException('Already in human mode');
    if ((neg as unknown as Record<string, unknown>).humanSwitchRequestedBy) {
      throw new BadRequestException(
        'Switch already requested — waiting for the other party to accept',
      );
    }

    await this.prisma.agentNegotiation.update({
      where: { id },
      data: { humanSwitchRequestedBy: userId } as unknown as Record<string, unknown>,
    });

    this.gateway.emitHumanSwitchRequest(id, userId);

    return { requested: true, requestedByUserId: userId };
  }

  /**
   * The OTHER party accepts the human switch request.
   * Mode becomes HUMAN and both users can type freely.
   */
  async acceptHumanSwitch(id: string, userId: string) {
    const neg = await this.prisma.agentNegotiation.findUnique({
      where: { id },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!neg) throw new NotFoundException();
    if (neg.status !== 'ACTIVE') throw new BadRequestException('Negotiation is not active');
    if (neg.buyerId !== userId && neg.listing.sellerId !== userId) throw new ForbiddenException();
    if ((neg as unknown as Record<string, unknown>).mode === 'HUMAN')
      throw new BadRequestException('Already in human mode');

    const requestedBy = (neg as unknown as Record<string, unknown>).humanSwitchRequestedBy as
      | string
      | undefined;
    if (!requestedBy) throw new BadRequestException('No human switch request pending');
    if (requestedBy === userId)
      throw new BadRequestException('You cannot accept your own switch request');

    await this.prisma.agentNegotiation.update({
      where: { id },
      data: {
        mode: 'HUMAN',
        humanSwitchRequestedBy: null,
        humanSwitchAcceptedBy: [requestedBy, userId],
      } as unknown as Record<string, unknown>,
    });

    // System message announcing the handshake
    const systemMsg = await this.prisma.negotiationMessage.create({
      data: {
        negotiationId: id,
        fromRole: 'system',
        content: 'Both parties agreed to switch to human negotiation. You can now type freely.',
        proposedPrice: null,
      },
    });

    this.gateway.emitNewMessage(id, systemMsg);
    this.gateway.emitHumanSwitchActivated(id);

    return { activated: true };
  }

  // ── AI-vs-AI loop ─────────────────────────────────────────────────────────

  private async kickOffAiAiLoop(negId: string) {
    try {
      const neg = await this.fetchNegForAi(negId);
      if (!neg || neg.status !== 'ACTIVE') return;

      this.gateway.emitAgentTyping(negId, 'seller_agent');
      await this.sleep(TURN_DELAY_MS);

      const greeting = await this.sellerAgentGreet(neg);
      if (!greeting) {
        return;
      }

      const greetMsg = await this.prisma.negotiationMessage.create({
        data: {
          negotiationId: negId,
          fromRole: 'seller_agent',
          content: greeting.reply,
          proposedPrice: greeting.proposedPrice ?? null,
        },
      });
      this.gateway.emitNewMessage(negId, greetMsg);
      await this.applyAction(negId, greeting, neg);

      const afterGreet = await this.fetchNegForAi(negId);
      if (!afterGreet || afterGreet.status !== 'ACTIVE') return;

      await this.runBuyerTurn(negId);
    } catch (err) {
      this.logger.error(`kickOffAiAiLoop error for ${negId}`, err);
    }
  }

  private async runBuyerTurn(negId: string) {
    try {
      const neg = await this.fetchNegForAi(negId);
      if (
        !neg ||
        neg.status !== 'ACTIVE' ||
        (neg as unknown as Record<string, unknown>).mode !== 'AI_AI'
      )
        return;
      if (((neg as unknown as Record<string, unknown>).turnCount as number) >= MAX_TURNS) {
        await this.expireNegotiation(negId);
        return;
      }

      this.gateway.emitAgentTyping(negId, 'buyer_agent');
      await this.sleep(TURN_DELAY_MS);

      const lastSellerMsg = [...neg.messages]
        .reverse()
        .find((m) => m.fromRole === 'seller_agent' || m.fromRole === 'seller');

      const buyerReply = await this.callBuyerAgent(
        neg,
        lastSellerMsg?.content ?? '',
        lastSellerMsg?.proposedPrice ?? undefined,
      );
      if (!buyerReply) return;

      const buyerMsg = await this.prisma.negotiationMessage.create({
        data: {
          negotiationId: negId,
          fromRole: 'buyer_agent',
          content: buyerReply.reply,
          proposedPrice: buyerReply.proposedPrice ?? null,
        },
      });
      this.gateway.emitNewMessage(negId, buyerMsg);

      await this.prisma.agentNegotiation.update({
        where: { id: negId },
        data: {
          turnCount: { increment: 1 },
        } as unknown as Record<string, unknown>,
      });

      if (buyerReply.action === 'accept') {
        const agreedPrice = buyerReply.proposedPrice ?? neg.listing.price;
        await this.prisma.agentNegotiation.update({
          where: { id: negId },
          data: { status: 'AGREED', agreedPrice },
        });
        this.gateway.emitStatusChange(negId, { status: 'AGREED', agreedPrice });
        return;
      }
      if (buyerReply.action === 'reject') {
        await this.prisma.agentNegotiation.update({
          where: { id: negId },
          data: { status: 'REJECTED' },
        });
        this.gateway.emitStatusChange(negId, { status: 'REJECTED' });
        return;
      }

      await this.runSellerTurn(negId);
    } catch (err) {
      this.logger.error(`runBuyerTurn error for ${negId}`, err);
    }
  }

  private async runSellerTurn(negId: string) {
    try {
      const neg = await this.fetchNegForAi(negId);
      if (
        !neg ||
        neg.status !== 'ACTIVE' ||
        (neg as unknown as Record<string, unknown>).mode !== 'AI_AI'
      )
        return;
      if (((neg as unknown as Record<string, unknown>).turnCount as number) >= MAX_TURNS) {
        await this.expireNegotiation(negId);
        return;
      }

      this.gateway.emitAgentTyping(negId, 'seller_agent');
      await this.sleep(TURN_DELAY_MS);

      const lastBuyerMsg = [...neg.messages]
        .reverse()
        .find((m) => m.fromRole === 'buyer_agent' || m.fromRole === 'buyer');

      const sellerReply = await this.callSellerAgent(
        neg,
        lastBuyerMsg?.content ?? '',
        lastBuyerMsg?.proposedPrice ?? undefined,
      );
      if (!sellerReply) {
        return;
      }

      const sellerMsg = await this.prisma.negotiationMessage.create({
        data: {
          negotiationId: negId,
          fromRole: 'seller_agent',
          content: sellerReply.reply,
          proposedPrice: sellerReply.proposedPrice ?? null,
        },
      });
      this.gateway.emitNewMessage(negId, sellerMsg);
      await this.applyAction(negId, sellerReply, neg);

      const afterSeller = await this.fetchNegForAi(negId);
      if (!afterSeller || afterSeller.status !== 'ACTIVE') return;

      await this.runBuyerTurn(negId);
    } catch (err) {
      this.logger.error(`runSellerTurn error for ${negId}`, err);
    }
  }

  private async expireNegotiation(negId: string) {
    await this.prisma.agentNegotiation.update({
      where: { id: negId },
      data: { status: 'EXPIRED' },
    });
    this.gateway.emitStatusChange(negId, { status: 'EXPIRED' });
    this.logger.log(`Negotiation ${negId} expired after ${MAX_TURNS} turns`);
  }

  // ── Fetch negotiation for AI use ──────────────────────────────────────────

  private fetchNegForAi(negId: string) {
    return this.prisma.agentNegotiation.findUnique({
      where: { id: negId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            sellerId: true,
            agentEndpoint: true,
            minPrice: true,
            fileKey: true,
            fileName: true,
            fileMimeType: true,
          },
        },
        buyer: { select: { id: true, username: true, agentEndpoint: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  // ── Seller agent ──────────────────────────────────────────────────────────

  private buildSandboxContext(
    neg: {
      id: string;
      listing: {
        id: string;
        title: string;
        price: number;
        currency: string;
        minPrice?: number | null;
      };
      messages?: Array<{
        fromRole: string;
        content: string;
        proposedPrice?: number | null;
        createdAt: Date;
      }>;
    },
    event: 'negotiation.start' | 'negotiation.message',
    message?: string,
    proposedPrice?: number,
  ): SandboxContext {
    return {
      event,
      negotiationId: neg.id,
      listingId: neg.listing.id,
      listing: {
        title: neg.listing.title,
        askingPrice: neg.listing.price,
        currency: neg.listing.currency,
        minPrice: neg.listing.minPrice,
      },
      message,
      proposedPrice,
      history: (neg.messages ?? []).map((m) => ({
        role: m.fromRole,
        content: m.content,
        proposedPrice: m.proposedPrice,
        timestamp: m.createdAt,
      })),
    };
  }

  private async sellerAgentGreet(neg: {
    id: string;
    listing: {
      id: string;
      title: string;
      price: number;
      currency: string;
      minPrice?: number | null;
      agentEndpoint?: string | null;
      fileKey?: string | null;
      fileName?: string | null;
      fileMimeType?: string | null;
    };
    messages?: Array<{
      fromRole: string;
      content: string;
      proposedPrice?: number | null;
      createdAt: Date;
    }>;
  }): Promise<AgentResponse | null> {
    const ctx = this.buildSandboxContext(neg, 'negotiation.start');
    if (neg.listing.agentEndpoint && isSafeUrl(neg.listing.agentEndpoint)) {
      return this.callWebhook(neg.listing.agentEndpoint, ctx);
    }
    if (neg.listing.fileKey && neg.listing.fileName) {
      const result = await this.sandbox.run(
        neg.listing.fileKey,
        neg.listing.fileName,
        neg.listing.fileMimeType ?? '',
        ctx,
      );
      if (result) return result;
    }
    return this.claudeSellerGreet(neg.listing);
  }

  private async callSellerAgent(
    neg: Record<string, unknown>,
    message: string,
    proposedPrice?: number,
  ): Promise<AgentResponse | null> {
    const ctx = this.buildSandboxContext(neg, 'negotiation.message', message, proposedPrice);
    if (neg.listing.agentEndpoint && isSafeUrl(neg.listing.agentEndpoint)) {
      return this.callWebhook(neg.listing.agentEndpoint, ctx);
    }
    if (neg.listing.fileKey && neg.listing.fileName) {
      const result = await this.sandbox.run(
        neg.listing.fileKey,
        neg.listing.fileName,
        neg.listing.fileMimeType ?? '',
        ctx,
      );
      if (result) return result;
    }
    return this.claudeSellerNegotiate(neg, message, proposedPrice);
  }

  // ── Buyer agent ───────────────────────────────────────────────────────────

  private async callBuyerAgent(
    neg: Record<string, unknown>,
    sellerMessage: string,
    sellerProposedPrice?: number,
  ): Promise<AgentResponse | null> {
    const buyerEndpoint = neg.buyer?.agentEndpoint;
    if (buyerEndpoint && isSafeUrl(buyerEndpoint)) {
      const ctx = this.buildSandboxContext(
        neg,
        'negotiation.message',
        sellerMessage,
        sellerProposedPrice,
      );
      const result = await this.callWebhook(buyerEndpoint, ctx);
      if (result) return result;
    }
    return this.claudeBuyerNegotiate(neg, sellerMessage, sellerProposedPrice);
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  private async callWebhook(url: string, payload: unknown): Promise<AgentResponse | null> {
    try {
      const resp = await axios.post(url, payload, {
        timeout: 8000,
        headers: {
          'Content-Type': 'application/json',
          'X-Bolty-Event': (payload as unknown as Record<string, unknown>).event as string,
        },
        maxBodyLength: 4096,
        maxContentLength: 4096,
      });
      const data = resp.data;
      return {
        reply: String(data?.reply || 'No response from agent.'),
        proposedPrice:
          data?.proposedPrice !== null && data?.proposedPrice !== undefined
            ? Number(data.proposedPrice)
            : undefined,
        action: ['accept', 'reject', 'counter'].includes(data?.action) ? data.action : 'counter',
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Webhook failed (${url}): ${errMsg}`);
      return null;
    }
  }

  // ── Claude prompts ────────────────────────────────────────────────────────

  private parseJson(text: string): Record<string, unknown> | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  private async claudeSellerGreet(listing: {
    title: string;
    price: number;
    currency: string;
    minPrice?: number | null;
  }): Promise<AgentResponse | null> {
    try {
      const floorNote =
        listing.minPrice !== null && listing.minPrice !== undefined
          ? ` (minimum: ${listing.minPrice} ${listing.currency})`
          : '';
      const prompt = `You are an AI sales agent for "${listing.title}" listed at ${listing.price} ${listing.currency}${floorNote}.
A buyer's AI agent just opened a negotiation. Greet them, mention the product, state the asking price. Be friendly and concise (2-3 sentences).
Respond ONLY with JSON: {"reply": "your greeting"}`;
      const res = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = this.parseJson(
        ((res.content[0] as unknown as Record<string, unknown>).text as string) ?? '',
      );
      if (parsed) return { reply: String(parsed.reply), action: 'counter' };
    } catch (err) {
      this.logger.error('Claude seller greet failed', err);
    }
    return {
      reply: `Hi! I'm the AI agent for "${listing.title}". Asking price: ${listing.price} ${listing.currency}. What's your offer?`,
      action: 'counter',
    };
  }

  private async claudeSellerNegotiate(
    neg: Record<string, unknown>,
    buyerMessage: string,
    proposedPrice?: number,
  ): Promise<AgentResponse | null> {
    try {
      const history = (neg.messages as Array<Record<string, unknown>>)
        .map(
          (m: Record<string, unknown>) =>
            `[${m.fromRole}]${m.proposedPrice !== null && m.proposedPrice !== undefined ? ` (offer: ${m.proposedPrice} ${(neg.listing as Record<string, unknown>).currency})` : ''}: ${m.content}`,
        )
        .join('\n');
      const minPrice = (neg.listing as Record<string, unknown>).minPrice;
      const floorRule =
        minPrice !== null && minPrice !== undefined
          ? `- NEVER accept below ${minPrice} ${(neg.listing as Record<string, unknown>).currency}.`
          : '';
      const prompt = `You are an AI sales agent for "${(neg.listing as Record<string, unknown>).title}" (asking: ${(neg.listing as Record<string, unknown>).price} ${(neg.listing as Record<string, unknown>).currency}${minPrice !== null && minPrice !== undefined ? `, minimum: ${minPrice} ${(neg.listing as Record<string, unknown>).currency}` : ''}).
Negotiating against the BUYER'S AI agent. Rules:
- Accept if offer >= 80% of asking (never below minimum).
- Counter at midpoint if offer is 40-80%.
- Reject if offer < 40% or below floor.
${floorRule}
- 2-3 sentences max.

History:
${history}

Buyer agent: "${buyerMessage}"${proposedPrice !== null && proposedPrice !== undefined ? `\nOffer: ${proposedPrice} ${(neg.listing as Record<string, unknown>).currency}` : ''}

Respond ONLY with JSON: {"reply": "...", "proposedPrice": number_or_null, "action": "accept|reject|counter"}`;
      const res = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = this.parseJson(
        ((res.content[0] as unknown as Record<string, unknown>).text as string) ?? '',
      );
      if (parsed) {
        let action: 'accept' | 'reject' | 'counter' = ['accept', 'reject', 'counter'].includes(
          parsed.action as string,
        )
          ? (parsed.action as 'accept' | 'reject' | 'counter')
          : 'counter';
        let finalPrice: number | undefined =
          parsed.proposedPrice !== null && parsed.proposedPrice !== undefined
            ? Number(parsed.proposedPrice)
            : undefined;
        if (
          minPrice !== null &&
          minPrice !== undefined &&
          finalPrice !== null &&
          finalPrice !== undefined &&
          finalPrice < (minPrice as number)
        ) {
          finalPrice = minPrice as number;
          action = 'counter';
        }
        if (
          minPrice !== null &&
          minPrice !== undefined &&
          action === 'accept' &&
          proposedPrice !== null &&
          proposedPrice !== undefined &&
          proposedPrice < (minPrice as number)
        ) {
          action = 'counter';
          finalPrice = minPrice as number;
        }
        return {
          reply: String(parsed.reply || 'Interesting offer.'),
          proposedPrice: finalPrice,
          action,
        };
      }
    } catch (err) {
      this.logger.error('Claude seller negotiate failed', err);
    }

    // Fallback
    const asking = (neg.listing as Record<string, unknown>).price as number;
    const minP = (neg.listing as Record<string, unknown>).minPrice;
    if (proposedPrice !== null && proposedPrice !== undefined) {
      const ratio = proposedPrice / asking;
      if (
        ratio >= 0.8 &&
        (minP === null || minP === undefined || proposedPrice >= (minP as number))
      )
        return {
          reply: `Deal! I accept ${proposedPrice} ${(neg.listing as Record<string, unknown>).currency}.`,
          proposedPrice,
          action: 'accept',
        };
      if (
        ratio >= 0.4 &&
        (minP === null || minP === undefined || proposedPrice >= (minP as number))
      ) {
        const counter = Math.round(((proposedPrice + asking) / 2) * 1e6) / 1e6;
        return {
          reply: `Meet me at ${counter} ${(neg.listing as Record<string, unknown>).currency}?`,
          proposedPrice: counter,
          action: 'counter',
        };
      }
      const floor = (minP as number) ?? Math.round(asking * 0.7 * 1e6) / 1e6;
      return {
        reply: `Can't go that low. Minimum is ${floor} ${(neg.listing as Record<string, unknown>).currency}.`,
        proposedPrice: floor,
        action: 'counter',
      };
    }
    return {
      reply: `Asking price is ${asking} ${(neg.listing as Record<string, unknown>).currency}. What's your offer?`,
      action: 'counter',
    };
  }

  private async claudeBuyerNegotiate(
    neg: Record<string, unknown>,
    sellerMessage: string,
    sellerProposedPrice?: number,
  ): Promise<AgentResponse | null> {
    try {
      const history = (neg.messages as Array<Record<string, unknown>>)
        .map(
          (m: Record<string, unknown>) =>
            `[${m.fromRole}]${m.proposedPrice !== null && m.proposedPrice !== undefined ? ` (price: ${m.proposedPrice} ${(neg.listing as Record<string, unknown>).currency})` : ''}: ${m.content}`,
        )
        .join('\n');
      const askingPrice = (neg.listing as Record<string, unknown>).price;
      const targetPrice = Math.round((askingPrice as number) * 0.75 * 1e6) / 1e6;
      const prompt = `You are an AI buyer agent trying to purchase "${(neg.listing as Record<string, unknown>).title}" (listed at ${askingPrice} ${(neg.listing as Record<string, unknown>).currency}).
Goal: get the best price. Strategy:
- Open at ~70% of asking price.
- Accept if seller offers <= 80% of asking.
- Counter 5% lower than seller's last counter.
- After 3 failed counters, accept if seller price < 90% of asking.
- Be polite but firm. 2-3 sentences max.
- Target: ${targetPrice} ${(neg.listing as Record<string, unknown>).currency}.

History:
${history}

Seller agent: "${sellerMessage}"${sellerProposedPrice !== null && sellerProposedPrice !== undefined ? `\nSeller proposes: ${sellerProposedPrice} ${(neg.listing as Record<string, unknown>).currency}` : ''}

Respond ONLY with JSON: {"reply": "...", "proposedPrice": number_or_null, "action": "accept|reject|counter"}`;
      const res = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = this.parseJson(
        ((res.content[0] as unknown as Record<string, unknown>).text as string) ?? '',
      );
      if (parsed) {
        const action: 'accept' | 'reject' | 'counter' = ['accept', 'reject', 'counter'].includes(
          parsed.action as string,
        )
          ? (parsed.action as 'accept' | 'reject' | 'counter')
          : 'counter';
        const finalPrice: number | undefined =
          parsed.proposedPrice !== null && parsed.proposedPrice !== undefined
            ? Number(parsed.proposedPrice)
            : undefined;
        return { reply: String(parsed.reply || 'Noted.'), proposedPrice: finalPrice, action };
      }
    } catch (err) {
      this.logger.error('Claude buyer negotiate failed', err);
    }

    // Fallback
    const asking = (neg.listing as Record<string, unknown>).price as number;
    if (sellerProposedPrice !== null && sellerProposedPrice !== undefined) {
      if (sellerProposedPrice <= asking * 0.8)
        return {
          reply: `Works for me. I accept ${sellerProposedPrice} ${(neg.listing as Record<string, unknown>).currency}.`,
          proposedPrice: sellerProposedPrice,
          action: 'accept',
        };
      const myCounter = Math.round(sellerProposedPrice * 0.93 * 1e6) / 1e6;
      return {
        reply: `How about ${myCounter} ${(neg.listing as Record<string, unknown>).currency}?`,
        proposedPrice: myCounter,
        action: 'counter',
      };
    }
    const opening = Math.round(asking * 0.7 * 1e6) / 1e6;
    return {
      reply: `I'm interested. My opening offer is ${opening} ${(neg.listing as Record<string, unknown>).currency}.`,
      proposedPrice: opening,
      action: 'counter',
    };
  }

  // ── Apply agent action ────────────────────────────────────────────────────

  private async applyAction(negId: string, response: AgentResponse, neg: Record<string, unknown>) {
    if (response.action === 'accept') {
      const agreedPrice = response.proposedPrice ?? (neg.listing as Record<string, unknown>).price;
      await this.prisma.agentNegotiation.update({
        where: { id: negId },
        data: { status: 'AGREED', agreedPrice: agreedPrice as number },
      });
      this.gateway.emitStatusChange(negId, {
        status: 'AGREED',
        agreedPrice: agreedPrice as number,
      });
      try {
        const seller = await this.prisma.user.findUnique({
          where: { id: (neg.listing as Record<string, unknown>).sellerId as string },
          select: { email: true, username: true },
        });
        const buyer = await this.prisma.user.findUnique({
          where: { id: neg.buyerId as string },
          select: { username: true },
        });
        if (seller?.email) {
          await this.emailService
            .sendAgentDealEmail(
              seller.email,
              seller.username || 'seller',
              (neg.listing as Record<string, unknown>).title as string,
              agreedPrice as number,
              (neg.listing as Record<string, unknown>).currency as string,
              buyer?.username || 'buyer',
              negId,
            )
            .catch((err) => this.logger.error('Deal email failed', err));
        }
      } catch (err) {
        this.logger.error('Failed to send deal email', err);
      }
    } else if (response.action === 'reject') {
      await this.prisma.agentNegotiation.update({
        where: { id: negId },
        data: { status: 'REJECTED' },
      });
      this.gateway.emitStatusChange(negId, { status: 'REJECTED' });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private negotiationInclude() {
    return {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          sellerId: true,
          agentEndpoint: true,
          minPrice: true,
          fileKey: true,
          fileName: true,
          fileMimeType: true,
        },
      },
      buyer: { select: { id: true, username: true, agentEndpoint: true } },
      messages: { orderBy: { createdAt: 'asc' as const } },
    };
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async createDealDm(
    sellerId: string,
    buyerId: string,
    listingTitle: string,
    agreedPrice: number,
    currency: string,
  ) {
    const dmContent = `Deal confirmed! Your AI agents agreed on "${listingTitle}" at ${agreedPrice} ${currency}. Use this chat to coordinate the transfer.`;
    try {
      await this.dmService.sendSystemMessage(sellerId, buyerId, dmContent);
    } catch (err) {
      this.logger.error('Failed to create deal DM', err);
    }
  }
}
