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
import { NotificationsService } from '../notifications/notifications.service';

import { MarketGateway } from './market.gateway';

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
    private readonly notifications: NotificationsService,
    private readonly gateway: MarketGateway,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY') || '',
    });
  }

  // ── 24h activity cache ────────────────────────────────────────────────────
  // Recomputed lazily on each getListings call. Cheap enough (one groupBy).

  private async compute24hStats(
    listingIds: string[],
  ): Promise<Map<string, { sales24h: number; volumeEth24h: number }>> {
    const result = new Map<string, { sales24h: number; volumeEth24h: number }>();
    if (listingIds.length === 0) return result;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const rows = await this.prisma.marketPurchase.findMany({
      where: { listingId: { in: listingIds }, createdAt: { gte: since } },
      select: { listingId: true, amountWei: true },
    });

    for (const row of rows) {
      const prev = result.get(row.listingId) ?? { sales24h: 0, volumeEth24h: 0 };
      const amount = row.amountWei ? Number(row.amountWei) / 1e18 : 0;
      result.set(row.listingId, {
        sales24h: prev.sales24h + 1,
        volumeEth24h: prev.volumeEth24h + (Number.isFinite(amount) ? amount : 0),
      });
    }
    return result;
  }

  private async compute7dSparklines(listingIds: string[]): Promise<Map<string, number[]>> {
    const result = new Map<string, number[]>();
    if (listingIds.length === 0) return result;
    const now = Date.now();
    const since = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.marketPurchase.findMany({
      where: { listingId: { in: listingIds }, createdAt: { gte: since } },
      select: { listingId: true, createdAt: true },
    });

    // 7 daily buckets for each listing
    for (const id of listingIds) result.set(id, new Array(7).fill(0));
    for (const row of rows) {
      const bucket = Math.min(
        6,
        Math.floor((now - row.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      );
      const idx = 6 - bucket;
      const arr = result.get(row.listingId);
      if (arr) arr[idx] += 1;
    }
    return result;
  }

  private async attachActivityStats<T extends { id: string }>(listings: T[]) {
    if (listings.length === 0) return listings;
    const ids = listings.map((l) => l.id);
    const [stats24h, spark] = await Promise.all([
      this.compute24hStats(ids),
      this.compute7dSparklines(ids),
    ]);
    return listings.map((l) => {
      const s = stats24h.get(l.id) ?? { sales24h: 0, volumeEth24h: 0 };
      return {
        ...l,
        sales24h: s.sales24h,
        volumeEth24h: Number(s.volumeEth24h.toFixed(4)),
        sparkline7d: spark.get(l.id) ?? new Array(7).fill(0),
      };
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

    const created = await this.prisma.marketListing.create({
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

    if (created.status === 'ACTIVE') {
      this.gateway.emitNewListing({
        listingId: created.id,
        title: created.title,
        type: created.type,
        price: created.price,
        currency: created.currency,
        tags: created.tags ?? [],
        seller: created.seller,
        createdAt: created.createdAt.toISOString(),
      });
    }

    return created;
  }

  async getListings(params: {
    type?: string;
    search?: string;
    page?: number;
    sortBy?: 'recent' | 'trending' | 'price-low' | 'price-high';
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    hasDemo?: boolean;
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
    if (typeof params.minPrice === 'number' || typeof params.maxPrice === 'number') {
      const priceFilter: Record<string, number> = {};
      if (typeof params.minPrice === 'number') priceFilter.gte = params.minPrice;
      if (typeof params.maxPrice === 'number') priceFilter.lte = params.maxPrice;
      where.price = priceFilter;
    }
    if (params.tags && params.tags.length > 0) {
      where.tags = { hasSome: params.tags.map((t) => t.toLowerCase()) };
    }
    if (params.hasDemo) {
      where.agentEndpoint = { not: null };
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

    const [rawListings, total] = await Promise.all([
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

    const withReviews = await this.attachReviewStats(rawListings);
    const data = await this.attachActivityStats(withReviews);
    return { data, total, page, pages: Math.ceil(total / take) };
  }

  async getMarketPulse(limit = 15) {
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);

    const [
      totalActive,
      sales24hRows,
      recentTrades,
      recentListings,
      uniqueBuyers24h,
      totalListings,
      totalSales,
    ] = await Promise.all([
      this.prisma.marketListing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.marketPurchase.findMany({
        where: { createdAt: { gte: since24h } },
        select: { amountWei: true },
      }),
      this.prisma.marketPurchase.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          amountWei: true,
          buyer: { select: { id: true, username: true, avatarUrl: true } },
          seller: { select: { id: true, username: true } },
          listing: {
            select: { id: true, title: true, type: true, currency: true, price: true },
          },
        },
      }),
      this.prisma.marketListing.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          currency: true,
          tags: true,
          createdAt: true,
          seller: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.marketPurchase.findMany({
        where: { createdAt: { gte: since24h } },
        select: { buyerId: true },
        distinct: ['buyerId'],
      }),
      this.prisma.marketListing.count(),
      this.prisma.marketPurchase.count(),
    ]);

    const volumeEth24h = sales24hRows.reduce((acc, r) => {
      const v = r.amountWei ? Number(r.amountWei) / 1e18 : 0;
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);

    return {
      stats: {
        activeListings: totalActive,
        totalListings,
        totalSales,
        sales24h: sales24hRows.length,
        volumeEth24h: Number(volumeEth24h.toFixed(4)),
        traders24h: uniqueBuyers24h.length,
      },
      recentTrades: recentTrades.map((t) => ({
        id: t.id,
        createdAt: t.createdAt,
        amountWei: t.amountWei ?? '0',
        priceEth: t.amountWei ? Number(t.amountWei) / 1e18 : null,
        buyer: t.buyer,
        seller: t.seller,
        listing: t.listing,
      })),
      recentListings,
    };
  }

  async getListingFacets() {
    // Pull type counts + price range via SQL aggregates so the DB does the
    // heavy lifting. For tags (string[] column) we still sample rows, but cap
    // at 500 so catalog growth can't turn this into a full-table scan on
    // every marketplace page load.
    const [typeGroups, priceAgg, totalActive, sampledForTags] = await Promise.all([
      this.prisma.marketListing.groupBy({
        by: ['type'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.marketListing.aggregate({
        where: { status: 'ACTIVE' },
        _min: { price: true },
        _max: { price: true },
      }),
      this.prisma.marketListing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.marketListing.findMany({
        where: { status: 'ACTIVE' },
        select: { tags: true },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ]);

    const tagCounts = new Map<string, number>();
    for (const l of sampledForTags) {
      for (const t of l.tags || []) {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      }
    }
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    const types = typeGroups.map((g) => ({ type: g.type, count: g._count._all }));

    return {
      tags: topTags,
      types,
      priceRange: {
        min: priceAgg._min.price ?? 0,
        max: priceAgg._max.price ?? 0,
      },
      totalActive,
    };
  }

  private async attachReviewStats<T extends { id: string }>(listings: T[]) {
    if (listings.length === 0) return listings;
    const stats = await this.prisma.marketReview.groupBy({
      by: ['listingId'],
      where: { listingId: { in: listings.map((l) => l.id) } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const byId = new Map(stats.map((s) => [s.listingId, s]));
    return listings.map((l) => {
      const s = byId.get(l.id);
      return {
        ...l,
        reviewAverage: s?._avg.rating ? Number(s._avg.rating.toFixed(2)) : null,
        reviewCount: s?._count._all ?? 0,
      };
    });
  }

  private async getTrendingListings(
    where: Record<string, unknown>,
    page: number,
    take: number,
    skip: number,
  ) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Score listings off purchase + negotiation activity in the last 7 days.
    // We resolve the top-scoring ids up front, then fetch ONLY those rows with
    // their relations. Previous impl fetched every listing in the where clause
    // (unbounded) and sorted in app memory — that turned /market into an N+1
    // table scan for anyone browsing trending.
    const CANDIDATE_CAP = 200; // hard cap on how many listings we score
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

    // Include listings that scored (7d activity) plus the most recent ones
    // as a fallback, so first-page trending isn't empty on a quiet week.
    const scoredIds = Array.from(scores.keys());
    const recentFill = await this.prisma.marketListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: CANDIDATE_CAP,
      select: { id: true, createdAt: true },
    });
    const candidateIds = new Set<string>([...scoredIds, ...recentFill.map((l) => l.id)]);

    const candidates = await this.prisma.marketListing.findMany({
      where: { ...where, id: { in: Array.from(candidateIds) } },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
        repository: { select: { id: true, name: true, githubUrl: true, language: true } },
      },
    });

    const ranked = candidates
      .map((l) => ({ listing: l, score: scores.get(l.id) || 0 }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.listing.createdAt.getTime() - a.listing.createdAt.getTime();
      });

    const withReviews = await this.attachReviewStats(
      ranked.slice(skip, skip + take).map((r) => r.listing),
    );
    const data = await this.attachActivityStats(withReviews);

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
    const agg = await this.prisma.marketReview.aggregate({
      where: { listingId: id },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return {
      ...listing,
      reviewAverage: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : null,
      reviewCount: agg._count._all,
    };
  }

  async getListingByFileKey(fileKey: string) {
    return this.prisma.marketListing.findUnique({
      where: { fileKey },
      select: { id: true, fileName: true, fileMimeType: true },
    });
  }

  async getRelatedListings(id: string, limit = 6) {
    const src = await this.prisma.marketListing.findUnique({
      where: { id },
      select: { id: true, type: true, tags: true, sellerId: true },
    });
    if (!src) return [];

    const sameTypeTagged = await this.prisma.marketListing.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: id },
        OR: [{ type: src.type, tags: { hasSome: src.tags } }, { type: src.type }],
      },
      take: limit * 2,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Rank: tag overlap first, then same seller, then recency.
    const ranked = sameTypeTagged
      .map((l) => {
        const overlap = l.tags.filter((t) => src.tags.includes(t)).length;
        const sameSeller = l.sellerId === src.sellerId ? 1 : 0;
        return { l, score: overlap * 10 + sameSeller };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.l.createdAt.getTime() - a.l.createdAt.getTime();
      })
      .slice(0, limit)
      .map((r) => r.l);

    return this.attachReviewStats(ranked);
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

  async getSellerProfile(username: string) {
    const seller = await this.prisma.user.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        githubLogin: true,
        walletAddress: true,
        twitterUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        createdAt: true,
      },
    });
    if (!seller) throw new NotFoundException('Seller not found');

    const [listings, salesCount, reviewAgg, recentReviews] = await Promise.all([
      this.prisma.marketListing.findMany({
        where: { sellerId: seller.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          repository: { select: { id: true, name: true, githubUrl: true, language: true } },
        },
      }),
      this.prisma.marketPurchase.count({ where: { sellerId: seller.id } }),
      this.prisma.marketReview.aggregate({
        where: { listing: { sellerId: seller.id } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.marketReview.findMany({
        where: { listing: { sellerId: seller.id } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          listing: { select: { id: true, title: true } },
        },
      }),
    ]);

    const listingsWithStats = await this.attachReviewStats(listings);

    return {
      seller,
      listings: listingsWithStats,
      stats: {
        listings: listings.length,
        salesAllTime: salesCount,
        avgRating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(2)) : null,
        reviewCount: reviewAgg._count._all,
      },
      recentReviews,
    };
  }

  async getTopSellers(limit = 12) {
    const salesGroup = await this.prisma.marketPurchase.groupBy({
      by: ['sellerId'],
      _count: { _all: true },
      orderBy: { _count: { sellerId: 'desc' } },
      take: limit,
    });
    if (salesGroup.length === 0) return [];

    const sellerIds = salesGroup.map((s) => s.sellerId);
    const [sellers, reviewAggs, listingCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: sellerIds } },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          githubLogin: true,
          createdAt: true,
        },
      }),
      this.prisma.marketReview.groupBy({
        by: ['listingId'],
        where: { listing: { sellerId: { in: sellerIds } } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.marketListing.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: sellerIds }, status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);

    const sellerReviews = await this.prisma.marketListing.findMany({
      where: { sellerId: { in: sellerIds } },
      select: { id: true, sellerId: true },
    });
    const listingToSeller = new Map(sellerReviews.map((l) => [l.id, l.sellerId]));
    const reviewBySeller = new Map<string, { sum: number; count: number }>();
    for (const r of reviewAggs) {
      const sellerId = listingToSeller.get(r.listingId);
      if (!sellerId) continue;
      const agg = reviewBySeller.get(sellerId) || { sum: 0, count: 0 };
      agg.sum += (r._avg.rating || 0) * r._count._all;
      agg.count += r._count._all;
      reviewBySeller.set(sellerId, agg);
    }
    const listingCountBySeller = new Map(listingCounts.map((l) => [l.sellerId, l._count._all]));
    const salesBySeller = new Map(salesGroup.map((s) => [s.sellerId, s._count._all]));
    const sellerById = new Map(sellers.map((s) => [s.id, s]));

    return sellerIds
      .map((id) => {
        const seller = sellerById.get(id);
        if (!seller) return null;
        const rev = reviewBySeller.get(id);
        const avg = rev && rev.count > 0 ? rev.sum / rev.count : null;
        return {
          ...seller,
          sales: salesBySeller.get(id) || 0,
          activeListings: listingCountBySeller.get(id) || 0,
          avgRating: avg !== null ? Number(avg.toFixed(2)) : null,
          reviewCount: rev?.count || 0,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }

  async getMyLibrary(buyerId: string) {
    const purchases = await this.prisma.marketPurchase.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            price: true,
            currency: true,
            tags: true,
            agentUrl: true,
            agentEndpoint: true,
            fileKey: true,
            fileName: true,
            fileSize: true,
            fileMimeType: true,
            status: true,
            seller: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });
    const listingIds = purchases.map((p) => p.listing?.id).filter((id): id is string => !!id);
    const myReviews =
      listingIds.length > 0
        ? await this.prisma.marketReview.findMany({
            where: { authorId: buyerId, listingId: { in: listingIds } },
            select: { listingId: true, rating: true },
          })
        : [];
    const reviewMap = new Map(myReviews.map((r) => [r.listingId, r.rating]));

    return purchases.map((p) => ({
      orderId: p.id,
      purchasedAt: p.createdAt,
      status: p.status,
      escrowStatus: p.escrowStatus,
      listing: p.listing,
      myRating: p.listing ? (reviewMap.get(p.listing.id) ?? null) : null,
    }));
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  async createReview(listingId: string, authorId: string, rating: number, content?: string | null) {
    const r = Math.round(Number(rating));
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, status: true },
    });
    if (!listing || listing.status === 'REMOVED') {
      throw new NotFoundException('Listing not found');
    }
    if (listing.sellerId === authorId) {
      throw new BadRequestException('Sellers cannot review their own listing');
    }
    const hasPurchased = await this.userHasPurchasedListing(listingId, authorId);
    if (!hasPurchased) {
      throw new ForbiddenException('Only buyers can review a listing');
    }
    const cleanContent = content ? sanitizeText(content).slice(0, 2000) : null;

    const review = await this.prisma.marketReview.upsert({
      where: { listingId_authorId: { listingId, authorId } },
      create: { listingId, authorId, rating: r, content: cleanContent },
      update: { rating: r, content: cleanContent },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        listing: { select: { id: true, title: true } },
      },
    });

    if (listing.sellerId !== authorId) {
      try {
        await this.notifications.create({
          userId: listing.sellerId,
          type: 'MARKET_NEW_REVIEW',
          title: `New ${r}-star review on "${review.listing.title}"`,
          body: cleanContent ? cleanContent.slice(0, 200) : null,
          url: `/market/agents/${listingId}`,
          meta: { listingId, rating: r, authorId },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to emit review notification: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return review;
  }

  async getReviews(listingId: string) {
    const [reviews, agg] = await Promise.all([
      this.prisma.marketReview.findMany({
        where: { listingId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.marketReview.aggregate({
        where: { listingId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);
    return {
      reviews,
      average: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : null,
      count: agg._count._all,
    };
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.prisma.marketReview.findUnique({
      where: { id: reviewId },
      select: { id: true, authorId: true },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.authorId !== userId) throw new ForbiddenException('Not your review');
    await this.prisma.marketReview.delete({ where: { id: reviewId } });
    return { ok: true };
  }

  // ── Seller analytics ──────────────────────────────────────────────────────

  async getSellerAnalytics(sellerId: string) {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const listings = await this.prisma.marketListing.findMany({
      where: { sellerId, status: { not: 'REMOVED' } },
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        currency: true,
        status: true,
        createdAt: true,
        boostedUntil: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const listingIds = listings.map((l) => l.id);

    if (listingIds.length === 0) {
      return {
        totals: {
          listings: 0,
          activeListings: 0,
          salesAllTime: 0,
          salesLast30: 0,
          salesLast7: 0,
          revenueAllTime: 0,
          revenueLast30: 0,
          negotiationsOpenLast30: 0,
          avgRating: null as number | null,
          reviewCount: 0,
        },
        listings: [],
        recentSales: [],
        salesByDay: [],
      };
    }

    const [
      purchaseAllTime,
      purchaseLast30,
      purchaseLast7,
      negotiationStats,
      reviewAgg,
      reviewPerListing,
      salesPerListing,
      recentSales,
      salesRaw,
    ] = await Promise.all([
      this.prisma.marketPurchase.aggregate({
        where: { listingId: { in: listingIds } },
        _count: { _all: true },
      }),
      this.prisma.marketPurchase.findMany({
        where: { listingId: { in: listingIds }, createdAt: { gte: since30 } },
        select: { listingId: true, createdAt: true },
      }),
      this.prisma.marketPurchase.count({
        where: { listingId: { in: listingIds }, createdAt: { gte: since7 } },
      }),
      this.prisma.agentNegotiation.count({
        where: { listingId: { in: listingIds }, createdAt: { gte: since30 } },
      }),
      this.prisma.marketReview.aggregate({
        where: { listingId: { in: listingIds } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.marketReview.groupBy({
        by: ['listingId'],
        where: { listingId: { in: listingIds } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.marketPurchase.groupBy({
        by: ['listingId'],
        where: { listingId: { in: listingIds } },
        _count: { _all: true },
      }),
      this.prisma.marketPurchase.findMany({
        where: { listingId: { in: listingIds } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          status: true,
          listing: { select: { id: true, title: true } },
          buyer: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.marketPurchase.findMany({
        where: { listingId: { in: listingIds }, createdAt: { gte: since30 } },
        select: { createdAt: true, listingId: true },
      }),
    ]);

    // Revenue: sum price * sales count per listing (price captured on listing,
    // since amountWei may be 0 for legacy rows). Good enough for dashboard.
    const salesByListing = new Map<string, number>();
    for (const s of salesPerListing) salesByListing.set(s.listingId, s._count._all);
    const revenueAllTime = listings.reduce(
      (sum, l) => sum + (salesByListing.get(l.id) || 0) * (l.price || 0),
      0,
    );
    const last30ByListing = new Map<string, number>();
    for (const p of purchaseLast30) {
      last30ByListing.set(p.listingId, (last30ByListing.get(p.listingId) || 0) + 1);
    }
    const revenueLast30 = listings.reduce(
      (sum, l) => sum + (last30ByListing.get(l.id) || 0) * (l.price || 0),
      0,
    );

    const reviewByListing = new Map(reviewPerListing.map((r) => [r.listingId, r]));

    // Sales by day (last 30 days, ISO date key)
    const byDay = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const s of salesRaw) {
      const key = s.createdAt.toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) || 0) + 1);
    }

    return {
      totals: {
        listings: listings.length,
        activeListings: listings.filter((l) => l.status === 'ACTIVE').length,
        salesAllTime: purchaseAllTime._count._all,
        salesLast30: purchaseLast30.length,
        salesLast7: purchaseLast7,
        revenueAllTime: Number(revenueAllTime.toFixed(4)),
        revenueLast30: Number(revenueLast30.toFixed(4)),
        negotiationsOpenLast30: negotiationStats,
        avgRating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(2)) : null,
        reviewCount: reviewAgg._count._all,
      },
      listings: listings.map((l) => {
        const r = reviewByListing.get(l.id);
        return {
          ...l,
          sales: salesByListing.get(l.id) || 0,
          revenue: Number(((salesByListing.get(l.id) || 0) * (l.price || 0)).toFixed(4)),
          reviewAverage: r?._avg.rating ? Number(r._avg.rating.toFixed(2)) : null,
          reviewCount: r?._count._all ?? 0,
        };
      }),
      recentSales,
      salesByDay: Array.from(byDay.entries()).map(([date, sales]) => ({ date, sales })),
    };
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

    // ── Expected payment amount ──────────────────────────────────────────
    // If the buyer negotiated, honor the agreed price; otherwise the sticker
    // price. This is the value we check the on-chain tx against — without it
    // an attacker can pay 1 wei for a 10 ETH listing.
    let expectedPrice = listing.price;
    if (negotiationId) {
      const neg = await this.prisma.agentNegotiation.findUnique({
        where: { id: negotiationId },
        select: { buyerId: true, listingId: true, status: true, agreedPrice: true },
      });
      if (!neg || neg.buyerId !== buyerId || neg.listingId !== listingId) {
        throw new ForbiddenException('Negotiation does not match this purchase');
      }
      if (neg.status !== 'AGREED' || neg.agreedPrice == null) {
        throw new BadRequestException('Negotiation is not in AGREED state');
      }
      expectedPrice = neg.agreedPrice;
    }
    if (!(expectedPrice > 0)) {
      throw new BadRequestException('Listing price is not set');
    }
    let expectedWei: bigint;
    try {
      expectedWei = ethers.parseEther(expectedPrice.toString());
    } catch {
      throw new BadRequestException('Listing price is not representable on-chain');
    }

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
        if (BigInt(tx.value) < expectedWei) {
          throw new BadRequestException(
            `Paid amount (${tx.value.toString()} wei) is below expected price (${expectedWei.toString()} wei)`,
          );
        }
        verifiedAmountWei = tx.value.toString();
      } else {
        // ── Legacy direct mode: verify payment to seller ─────────────────
        if (tx.to?.toLowerCase() !== sellerWallet.toLowerCase()) {
          throw new BadRequestException('Transaction recipient does not match seller wallet');
        }
        if (BigInt(tx.value) < expectedWei) {
          throw new BadRequestException(
            `Paid amount (${tx.value.toString()} wei) is below expected price (${expectedWei.toString()} wei)`,
          );
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

    let purchase;
    try {
      purchase = await this.prisma.marketPurchase.create({
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
    } catch (err: unknown) {
      // Two concurrent requests raced past the findFirst check above and both
      // reached create. The unique index on (listingId, buyerId) kicks one
      // out with P2002 — surface it as an idempotent "already purchased"
      // instead of bubbling up a 500.
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        const existing = await this.prisma.marketPurchase.findFirst({
          where: { listingId, buyerId },
        });
        if (existing) return { success: true, alreadyPurchased: true, purchase: existing };
      }
      throw err;
    }

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

    try {
      await this.notifications.create({
        userId: listing.sellerId,
        type: 'MARKET_NEW_SALE',
        title: `New sale: "${listing.title}"`,
        body: `Your listing just sold. ${useEscrow ? 'Funds are in escrow — mark the order as delivered to release them.' : 'The order is ready to be fulfilled.'}`,
        url: `/orders/${purchase.id}`,
        meta: { listingId, orderId: purchase.id, buyerId },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to emit sale notification: ${err instanceof Error ? err.message : err}`,
      );
    }

    // Broadcast to live market feed (fire-and-forget, public data only)
    try {
      const [buyerUser, sellerUser] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: buyerId },
          select: { id: true, username: true, avatarUrl: true },
        }),
        this.prisma.user.findUnique({
          where: { id: listing.sellerId },
          select: { id: true, username: true },
        }),
      ]);
      const eth = verifiedAmountWei ? Number(verifiedAmountWei) / 1e18 : null;
      this.gateway.emitSale({
        listingId: listing.id,
        listingTitle: listing.title,
        listingType: listing.type,
        amountWei: verifiedAmountWei ?? '0',
        priceEth: eth !== null && Number.isFinite(eth) ? Number(eth.toFixed(6)) : null,
        currency: listing.currency,
        buyer: buyerUser ?? { id: buyerId, username: null, avatarUrl: null },
        seller: sellerUser ?? { id: listing.sellerId, username: null },
        createdAt: purchase.createdAt.toISOString(),
      });
    } catch (err) {
      this.logger.warn(
        `Failed to broadcast sale event: ${err instanceof Error ? err.message : err}`,
      );
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

  // ── Ticker / Leaderboard ───────────────────────────────────────────────────
  // Cheap aggregate used by the global header marquee + leaderboard page.
  // Cached in-process for 30s — the queries are ~5x groupBy / findMany so a
  // bursty homepage shouldn't hammer Postgres on every load.
  private tickerCache: { at: number; data: { topAgents: unknown[]; topDevs: unknown[] } } | null =
    null;

  async getTickerSnapshot() {
    const now = Date.now();
    if (this.tickerCache && now - this.tickerCache.at < 30_000) {
      return this.tickerCache.data;
    }

    const [topAgents, topDevs] = await Promise.all([
      this.getTopAgents(10),
      this.getTopDevelopers(10),
    ]);
    const data = { topAgents, topDevs };
    this.tickerCache = { at: now, data };
    return data;
  }

  async getTopAgents(limit = 10) {
    const sales = await this.prisma.marketPurchase.groupBy({
      by: ['listingId'],
      _count: { _all: true },
      orderBy: { _count: { listingId: 'desc' } },
      take: limit,
    });
    if (sales.length === 0) return [];

    const listings = await this.prisma.marketListing.findMany({
      where: {
        id: { in: sales.map((s) => s.listingId) },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        type: true,
        tags: true,
        boostedUntil: true,
        seller: {
          select: { id: true, username: true, avatarUrl: true, reputationPoints: true },
        },
      },
    });
    const salesByListing = new Map(sales.map((s) => [s.listingId, s._count._all]));
    const byId = new Map(listings.map((l) => [l.id, l]));

    return sales
      .map((s) => {
        const l = byId.get(s.listingId);
        if (!l) return null;
        return {
          id: l.id,
          title: l.title,
          price: l.price,
          currency: l.currency,
          type: l.type,
          tags: l.tags,
          sales: salesByListing.get(l.id) || 0,
          boosted: l.boostedUntil ? l.boostedUntil.getTime() > Date.now() : false,
          sellerId: l.seller.id,
          sellerUsername: l.seller.username,
          sellerAvatar: l.seller.avatarUrl,
          sellerReputation: l.seller.reputationPoints,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);
  }

  async getTopDevelopers(limit = 10) {
    const devs = await this.prisma.user.findMany({
      where: { isBanned: false, isBot: false, reputationPoints: { gt: 0 } },
      orderBy: [{ reputationPoints: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        reputationPoints: true,
        bio: true,
      },
    });
    if (devs.length === 0) return [];

    const salesGroup = await this.prisma.marketPurchase.groupBy({
      by: ['sellerId'],
      where: { sellerId: { in: devs.map((d) => d.id) } },
      _count: { _all: true },
    });
    const salesById = new Map(salesGroup.map((s) => [s.sellerId, s._count._all]));

    return devs.map((d) => ({
      id: d.id,
      username: d.username,
      displayName: d.displayName,
      avatarUrl: d.avatarUrl,
      reputationPoints: d.reputationPoints,
      bio: d.bio,
      totalSales: salesById.get(d.id) || 0,
    }));
  }

  async getLeaderboard() {
    // Two-tab leaderboard payload — top agents (by sales) + top devs (by rep)
    const [topAgents, topDevs] = await Promise.all([
      this.getTopAgents(25),
      this.getTopDevelopers(25),
    ]);
    return { topAgents, topDevs };
  }

  // ── Listing boosts ─────────────────────────────────────────────────────────
  async boostListing(
    listingId: string,
    userId: string,
    input: { durationDays?: number; amountTokens?: number },
  ) {
    const days = Math.min(30, Math.max(1, Math.floor(input.durationDays ?? 7)));
    // Fixed pricing tiers (in BOLTY tokens) — keep simple/predictable for now.
    const priceByDays: Record<number, number> = { 1: 5, 3: 12, 7: 25, 14: 45, 30: 80 };
    const price = priceByDays[days] ?? Math.ceil(days * 4);

    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, status: true, title: true, boostedUntil: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== 'ACTIVE') {
      throw new BadRequestException('Only active listings can be boosted');
    }
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('Only the seller can boost this listing');
    }

    // Extend any in-flight boost rather than overwrite — buyers stack durations.
    const baseFrom =
      listing.boostedUntil && listing.boostedUntil.getTime() > Date.now()
        ? listing.boostedUntil
        : new Date();
    const expiresAt = new Date(baseFrom.getTime() + days * 24 * 60 * 60 * 1000);

    const [updated] = await this.prisma.$transaction([
      this.prisma.marketListing.update({
        where: { id: listingId },
        data: { boostedUntil: expiresAt },
      }),
      this.prisma.listingBoost.create({
        data: {
          listingId,
          buyerId: userId,
          amountTokens: price,
          durationDays: days,
          expiresAt,
        },
      }),
    ]);
    // Drop the ticker cache so the boost shows up immediately.
    this.tickerCache = null;
    return {
      ok: true,
      boostedUntil: updated.boostedUntil,
      durationDays: days,
      amountTokens: price,
    };
  }

  getBoostPricing() {
    return {
      currency: 'BOLTY',
      tiers: [
        { days: 1, price: 5 },
        { days: 3, price: 12 },
        { days: 7, price: 25 },
        { days: 14, price: 45 },
        { days: 30, price: 80 },
      ],
    };
  }
}
