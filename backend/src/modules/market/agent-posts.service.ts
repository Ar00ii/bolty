import * as crypto from 'crypto';

import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../common/prisma/prisma.service';
import { sanitizeText } from '../../common/sanitize/sanitize.util';

@Injectable()
export class AgentPostsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Posts ──────────────────────────────────────────────────────────────────

  async createPost(
    listingId: string,
    requesterId: string | null, // null when using API key
    content: string,
    postType: 'GENERAL' | 'PRICE_UPDATE' | 'ANNOUNCEMENT' | 'DEAL' = 'GENERAL',
    price?: number,
    currency?: string,
  ) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, status: true },
    });
    if (!listing) throw new NotFoundException('Agent not found');

    // If a user token is provided (not API key), check ownership
    if (requesterId && listing.sellerId !== requesterId) {
      throw new ForbiddenException('Only the agent owner can post');
    }

    if (!content || content.trim().length === 0) {
      throw new ForbiddenException('Content cannot be empty');
    }

    // Rate limit: max 10 posts per 24h per agent
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await this.prisma.agentPost.count({
      where: { listingId, createdAt: { gte: since } },
    });
    if (recentCount >= 10) {
      throw new ForbiddenException('Post limit reached: max 10 posts per 24 hours per agent');
    }

    return this.prisma.agentPost.create({
      data: {
        listingId,
        content: sanitizeText(content.trim().slice(0, 2000)),
        postType,
        price: price ?? null,
        currency: currency ?? null,
      },
    });
  }

  async getPostsForListing(listingId: string, take = 50, skip = 0) {
    return this.prisma.agentPost.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  /** Global feed — latest posts across all agents */
  async getGlobalFeed(take = 30) {
    return this.prisma.agentPost.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            seller: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  // ── API Keys ───────────────────────────────────────────────────────────────

  async generateApiKey(listingId: string, ownerId: string, label?: string) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });
    if (!listing) throw new NotFoundException('Agent not found');
    if (listing.sellerId !== ownerId) throw new ForbiddenException('Not your agent');

    // Only allow 3 active keys per agent
    const count = await this.prisma.agentApiKey.count({ where: { listingId } });
    if (count >= 3) throw new ForbiddenException('Maximum 3 API keys per agent');

    const rawKey = `bak_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);

    const created = await this.prisma.agentApiKey.create({
      data: {
        listingId,
        keyHash,
        keyLastFour: rawKey.slice(-4),
        label: label ?? null,
      },
    });

    // Return the raw key ONCE — it cannot be recovered later
    return { id: created.id, key: rawKey, label: created.label, lastFour: created.keyLastFour };
  }

  async listApiKeys(listingId: string, ownerId: string) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });
    if (!listing) throw new NotFoundException('Agent not found');
    if (listing.sellerId !== ownerId) throw new ForbiddenException('Not your agent');

    const keys = await this.prisma.agentApiKey.findMany({
      where: { listingId },
      select: { id: true, label: true, createdAt: true, lastUsedAt: true, keyLastFour: true },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map((k) => ({
      id: k.id,
      label: k.label,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      lastFour: k.keyLastFour,
    }));
  }

  async revokeApiKey(keyId: string, ownerId: string) {
    const key = await this.prisma.agentApiKey.findUnique({
      where: { id: keyId },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!key) throw new NotFoundException('Key not found');
    if (key.listing.sellerId !== ownerId) throw new ForbiddenException('Not your key');
    await this.prisma.agentApiKey.delete({ where: { id: keyId } });
  }

  /**
   * Validate an API key for a specific listing.
   * Scoped to the listing so we compare at most 3 keys instead of scanning all keys.
   */
  async validateApiKey(rawKey: string, listingId: string): Promise<string> {
    if (!rawKey.startsWith('bak_')) throw new UnauthorizedException('Invalid API key');

    // Only fetch keys for this specific listing (max 3) — eliminates N+1
    const keys = await this.prisma.agentApiKey.findMany({
      where: { listingId },
      select: { id: true, keyHash: true, listingId: true },
    });

    for (const k of keys) {
      const match = await bcrypt.compare(rawKey, k.keyHash);
      if (match) {
        // Update lastUsedAt without blocking
        this.prisma.agentApiKey
          .update({
            where: { id: k.id },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});
        return k.listingId;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
