import Anthropic from '@anthropic-ai/sdk';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ethers } from 'ethers';

import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeText, isSafeUrl } from '../../common/sanitize/sanitize.util';

interface CreateListingDto {
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency?: string;
  minPrice?: number;
  tags?: string[];
  repositoryId?: string;
  agentUrl?: string;
  agentEndpoint?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY') || '',
    });
  }

  private parseJson(text: string): { safe: boolean; reason: string } | null {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return { safe: Boolean(parsed.safe), reason: String(parsed.reason || '') };
    } catch {
      return null;
    }
  }

  /**
   * Two-tier Claude security scan:
   *  Tier 1 — Haiku: fast initial analysis
   *  Tier 2 — Sonnet: deep analysis only when Haiku flags something suspicious
   */
  async scanContent(
    title: string,
    description: string,
  ): Promise<{ safe: boolean; reason: string }> {
    const basePrompt = `You are a content safety moderator for a developer marketplace.
Analyze the following listing and determine if it is safe and legitimate.

REJECT if it contains:
- Malware, spyware, ransomware, trojans, keyloggers
- Phishing tools, credential stealers
- DDoS / network attack tools
- Crypto drainers or wallet stealers
- Illegal hacking tools or exploits for production systems
- Scams or fraudulent services
- Adult or illegal content

ACCEPT if it is:
- A legitimate code repository, bot, or script
- A developer tool, automation script, or utility
- Trading bots, monitoring tools, analytics

Title: ${title.slice(0, 200)}
Description: ${description.slice(0, 1000)}

Respond with ONLY a JSON object: {"safe": true|false, "reason": "one sentence explanation"}`;

    try {
      // ── Tier 1: Haiku — fast scan ──────────────────────────────────────────
      const haikuRes = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{ role: 'user', content: basePrompt }],
      });
      const haikuText = (haikuRes.content[0] as { type: string; text: string }).text ?? '';
      const haikuResult = this.parseJson(haikuText);

      if (haikuResult?.safe) {
        return { safe: true, reason: haikuResult.reason };
      }

      // ── Tier 2: Sonnet — deep analysis when suspicious ─────────────────────
      this.logger.warn(`Haiku flagged listing "${title}" — escalating to Sonnet`);
      const sonnetRes = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `${basePrompt}

NOTE: A preliminary scan flagged this as potentially suspicious. Perform a thorough analysis before making a final decision.`,
          },
        ],
      });
      const sonnetText = (sonnetRes.content[0] as { type: string; text: string }).text ?? '';
      const sonnetResult = this.parseJson(sonnetText);
      if (sonnetResult) return sonnetResult;
    } catch (err) {
      this.logger.error('Content scan failed', err);
    }
    // Default to requiring manual review on scan error
    return { safe: false, reason: 'Scan service unavailable — manual review required' };
  }

  async createListing(sellerId: string, dto: CreateListingDto) {
    const title = sanitizeText(dto.title.trim().slice(0, 200));
    const description = sanitizeText(dto.description.trim().slice(0, 5000));

    if (title.length < 3) throw new ForbiddenException('Title too short');
    if (description.length < 10) throw new ForbiddenException('Description too short');
    if (dto.price < 0 || dto.price > 1_000_000) throw new ForbiddenException('Invalid price');
    if (
      dto.minPrice !== null &&
      dto.minPrice !== undefined &&
      (dto.minPrice < 0 || dto.minPrice > dto.price)
    ) {
      throw new ForbiddenException('Minimum price must be between 0 and asking price');
    }

    // SSRF protection: validate webhook and agent URLs point to safe external hosts
    if (dto.agentEndpoint && !isSafeUrl(dto.agentEndpoint)) {
      throw new ForbiddenException('Invalid agent endpoint URL');
    }
    if (dto.agentUrl && !isSafeUrl(dto.agentUrl)) {
      throw new ForbiddenException('Invalid agent URL');
    }

    // Check seller is not banned
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { isBanned: true },
    });
    if (!seller || seller.isBanned) throw new ForbiddenException('Account restricted');

    // AI security scan
    const scan = await this.scanContent(title, description);

    return this.prisma.marketListing.create({
      data: {
        title,
        description,
        type: dto.type,
        price: dto.price,
        currency: dto.currency || 'SOL',
        tags: (dto.tags || []).map((t) => sanitizeText(t.slice(0, 50))).slice(0, 10),
        sellerId,
        repositoryId: dto.repositoryId || null,
        agentUrl: dto.agentUrl ? dto.agentUrl.trim().slice(0, 500) : null,
        agentEndpoint: dto.agentEndpoint ? dto.agentEndpoint.trim().slice(0, 500) : null,
        minPrice: dto.minPrice !== null && dto.minPrice !== undefined ? dto.minPrice : null,
        fileKey: dto.fileKey || null,
        fileName: dto.fileName ? sanitizeText(dto.fileName.slice(0, 255)) : null,
        fileSize: dto.fileSize || null,
        fileMimeType: dto.fileMimeType ? dto.fileMimeType.slice(0, 100) : null,
        status: scan.safe ? 'ACTIVE' : 'PENDING_REVIEW',
        scanPassed: scan.safe,
        scanNote: scan.reason,
      },
      include: { seller: { select: { id: true, username: true, avatarUrl: true } } },
    });
  }

  async getListings(params: {
    type?: string;
    search?: string;
    page?: number;
    sortBy?: 'recent' | 'trending' | 'price-low' | 'price-high';
  }) {
    const page = Math.max(1, params.page || 1);
    const take = 20;
    const skip = (page - 1) * take;
    const sortBy = params.sortBy || 'recent';

    const where: Record<string, unknown> = { status: 'ACTIVE' };
    if (params.type && params.type !== 'ALL') where.type = params.type;
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { tags: { has: params.search.toLowerCase() } },
      ];
    }

    if (sortBy === 'trending') {
      return this.getTrendingListings(where, page, take, skip);
    }

    const orderBy =
      sortBy === 'price-low'
        ? { price: 'asc' as const }
        : sortBy === 'price-high'
          ? { price: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.marketListing.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          seller: { select: { id: true, username: true, avatarUrl: true } },
          repository: { select: { id: true, name: true, githubUrl: true, language: true } },
        },
      }),
      this.prisma.marketListing.count({ where }),
    ]);

    return { data, total, page, pages: Math.ceil(total / take) };
  }

  private async getTrendingListings(
    where: Record<string, unknown>,
    page: number,
    take: number,
    skip: number,
  ) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [purchaseStats, negotiationStats, total] = await Promise.all([
      this.prisma.marketPurchase.groupBy({
        by: ['listingId'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.agentNegotiation.groupBy({
        by: ['listingId'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.marketListing.count({ where }),
    ]);

    const scores = new Map<string, number>();
    for (const p of purchaseStats) {
      scores.set(p.listingId, (scores.get(p.listingId) || 0) + p._count._all * 3);
    }
    for (const n of negotiationStats) {
      scores.set(n.listingId, (scores.get(n.listingId) || 0) + n._count._all * 1);
    }

    const listings = await this.prisma.marketListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        repository: { select: { id: true, name: true, githubUrl: true, language: true } },
      },
    });

    const ranked = listings
      .map((l) => ({ listing: l, score: scores.get(l.id) || 0 }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.listing.createdAt.getTime() - a.listing.createdAt.getTime();
      });

    const data = ranked.slice(skip, skip + take).map((r) => r.listing);

    return { data, total, page, pages: Math.ceil(total / take) };
  }

  async getListing(id: string) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true, walletAddress: true } },
        repository: {
          select: { id: true, name: true, githubUrl: true, language: true, stars: true },
        },
      },
    });
    if (!listing || listing.status === 'REMOVED') throw new NotFoundException('Listing not found');
    return listing;
  }

  async getListingByFileKey(fileKey: string) {
    return this.prisma.marketListing.findUnique({
      where: { fileKey },
      select: { id: true, fileName: true, fileMimeType: true },
    });
  }

  async invokeAgent(listingId: string, prompt: string): Promise<{ reply: string }> {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true, agentEndpoint: true },
    });
    if (!listing || listing.status === 'REMOVED') {
      throw new NotFoundException('Listing not found');
    }
    if (!listing.agentEndpoint || !isSafeUrl(listing.agentEndpoint)) {
      throw new BadRequestException('This listing has no live endpoint');
    }
    const cleanPrompt = String(prompt || '')
      .trim()
      .slice(0, 1000);
    if (!cleanPrompt) {
      throw new BadRequestException('Prompt required');
    }
    try {
      const resp = await axios.post(
        listing.agentEndpoint,
        { event: 'demo_invoke', prompt: cleanPrompt },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Bolty-Event': 'demo_invoke',
          },
          maxBodyLength: 8192,
          maxContentLength: 8192,
        },
      );
      const raw = resp.data;
      const reply =
        typeof raw === 'string' ? raw : String(raw?.reply ?? raw?.output ?? raw?.message ?? '');
      const trimmed = reply.trim();
      return { reply: trimmed ? trimmed.slice(0, 4000) : 'Agent responded with no content.' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Demo invoke failed for ${listingId}: ${msg}`);
      throw new BadRequestException('Agent endpoint did not respond. Try again later.');
    }
  }

  async userHasPurchasedListing(listingId: string, buyerId: string): Promise<boolean> {
    const purchase = await this.prisma.marketPurchase.findFirst({
      where: { listingId, buyerId },
    });
    return !!purchase;
  }

  async purchaseListing(
    listingId: string,
    buyerId: string,
    txHash: string,
    amountWei: string,
    negotiationId?: string,
    platformFeeTxHash?: string,
    consentSignature?: string,
    consentMessage?: string,
    escrowContract?: string,
  ) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { id: true, walletAddress: true } } },
    });
    if (!listing || listing.status === 'REMOVED') throw new NotFoundException('Listing not found');
    if (listing.sellerId === buyerId)
      throw new ForbiddenException('Cannot purchase your own listing');

    // Check not already purchased
    const existing = await this.prisma.marketPurchase.findFirst({ where: { listingId, buyerId } });
    if (existing) return { success: true, alreadyPurchased: true, purchase: existing };

    // Check tx hash not duplicate
    const dupTx = await this.prisma.marketPurchase.findUnique({ where: { txHash } });
    if (dupTx) throw new ForbiddenException('Transaction already recorded');

    const rpcUrl = this.config.get<string>('ETH_RPC_URL', 'https://eth.llamarpc.com');
    const platformWallet = this.config.get<string>('PLATFORM_WALLET', '');
    const configuredEscrow = this.config.get<string>('ESCROW_CONTRACT', '');
    const sellerWallet = listing.seller.walletAddress;

    if (!sellerWallet) {
      throw new BadRequestException('Seller has no wallet address configured');
    }

    // ── Consent signature verification ──────────────────────────────────
    if (consentSignature && consentMessage) {
      try {
        const signerAddress = ethers.verifyMessage(consentMessage, consentSignature);
        const buyer = await this.prisma.user.findUnique({
          where: { id: buyerId },
          select: { walletAddress: true },
        });
        if (
          !buyer?.walletAddress ||
          signerAddress.toLowerCase() !== buyer.walletAddress.toLowerCase()
        ) {
          throw new BadRequestException('Consent signature does not match buyer wallet');
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('Invalid consent signature');
      }
    }

    const useEscrow = !!(escrowContract && configuredEscrow);
    let verifiedAmountWei = amountWei;
    let platformFeeWei = '0';

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        throw new BadRequestException('Transaction failed or not found');
      }
      const tx = await provider.getTransaction(txHash);
      if (!tx) throw new BadRequestException('Transaction not found');

      if (useEscrow) {
        // ── Escrow mode: verify deposit was sent to the escrow contract ──
        if (escrowContract.toLowerCase() !== configuredEscrow.toLowerCase()) {
          throw new BadRequestException('Escrow contract address mismatch');
        }
        if (tx.to?.toLowerCase() !== escrowContract.toLowerCase()) {
          throw new BadRequestException('Transaction was not sent to escrow contract');
        }
        verifiedAmountWei = tx.value.toString();
      } else {
        // ── Legacy direct mode: verify payment to seller ─────────────────
        if (tx.to?.toLowerCase() !== sellerWallet.toLowerCase()) {
          throw new BadRequestException('Transaction recipient does not match seller wallet');
        }
        verifiedAmountWei = tx.value.toString();

        // Verify platform commission (legacy only — escrow handles split automatically)
        if (platformWallet && platformFeeTxHash) {
          try {
            const feeReceipt = await provider.getTransactionReceipt(platformFeeTxHash);
            const feeTx = await provider.getTransaction(platformFeeTxHash);
            if (!feeReceipt || feeReceipt.status !== 1) {
              throw new BadRequestException('Platform fee transaction failed or not found');
            }
            if (!feeTx || feeTx.to?.toLowerCase() !== platformWallet.toLowerCase()) {
              throw new BadRequestException('Platform fee recipient does not match Bolty wallet');
            }
            platformFeeWei = feeTx.value.toString();
          } catch (err) {
            if (err instanceof BadRequestException) throw err;
            this.logger.error(
              `Platform fee verification error: ${err instanceof Error ? err.message : err}`,
            );
            throw new BadRequestException('Could not verify platform fee transaction');
          }
        }
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Tx verification error: ${err instanceof Error ? err.message : err}`);
      throw new BadRequestException('Could not verify transaction on-chain');
    }

    const purchase = await this.prisma.marketPurchase.create({
      data: {
        txHash,
        amountWei: verifiedAmountWei,
        buyerId,
        sellerId: listing.sellerId,
        listingId,
        negotiationId: negotiationId || null,
        verified: true,
        status: 'PENDING_DELIVERY',
        platformFeeTxHash: useEscrow ? null : platformFeeTxHash || null,
        platformFeeWei: useEscrow ? null : platformFeeWei || null,
        consentSignature: consentSignature || null,
        consentMessage: consentMessage || null,
        escrowContract: useEscrow ? escrowContract : null,
        escrowStatus: useEscrow ? 'FUNDED' : 'NONE',
      },
    });

    // Auto-create welcome message in order chat
    try {
      const escrowNote = useEscrow
        ? ' Funds are held in escrow and will be released when you confirm delivery.'
        : '';
      await this.prisma.orderMessage.create({
        data: {
          orderId: purchase.id,
          senderId: listing.sellerId,
          content: `Order created! Payment confirmed on-chain.${escrowNote} I'm ready to fulfill your order for "${listing.title}". Feel free to message me here with any questions.`,
        },
      });
    } catch (err) {
      this.logger.error('Failed to create order welcome message', err);
    }

    return { success: true, purchase, orderId: purchase.id, escrow: useEscrow };
  }

  async deleteListing(id: string, userId: string) {
    const listing = await this.prisma.marketListing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (listing.sellerId !== userId && !['ADMIN', 'MODERATOR'].includes(user?.role || '')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    await this.prisma.marketListing.update({ where: { id }, data: { status: 'REMOVED' } });
  }
}
