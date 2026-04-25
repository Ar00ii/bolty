import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { invalidateUserCache } from '../auth/strategies/jwt.strategy';
import { ReputationService } from '../reputation/reputation.service';

interface UpdateProfileData {
  username?: string;
  displayName?: string;
  bio?: string;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  agentEndpoint?: string | null;
  avatarUrl?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reputation: ReputationService,
  ) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        githubLogin: true,
        walletAddress: true,
        role: true,
        profileSetup: true,
        twitterUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        agentEndpoint: true,
        userTag: true,
        email: true,
        twoFactorEnabled: true,
        createdAt: true,
        reputationPoints: true,
        _count: {
          select: { repositories: true, votes: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Search users by username (partial) or userTag exact (pass "#1234") */
  /**
   * Public community snapshot used by the landing page — a handful of real
   * members with avatars plus the total number of registered accounts.
   * Only surfaces users that have set a username and avatar so the result
   * looks populated instead of showing blank placeholders.
   */
  async getCommunityShowcase(limit = 6) {
    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          isBanned: false,
          avatarUrl: { not: null },
          username: { not: null },
        },
        orderBy: [{ reputationPoints: 'desc' }, { lastLoginAt: 'desc' }],
        take: Math.min(Math.max(limit, 1), 20),
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      }),
      this.prisma.user.count({ where: { isBanned: false } }),
    ]);
    return { users, totalCount };
  }

  async search(query: string) {
    const q = query.trim().slice(0, 50);
    if (!q) return [];

    // "#1234" → exact tag match
    if (q.startsWith('#')) {
      const tag = q.slice(1);
      return this.prisma.user.findMany({
        where: { userTag: tag },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          userTag: true,
          reputationPoints: true,
        },
        take: 10,
      });
    }

    // Otherwise search by username contains (strip leading @)
    const term = q.replace(/^@/, '');
    return this.prisma.user.findMany({
      where: { username: { contains: term, mode: 'insensitive' } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        userTag: true,
        reputationPoints: true,
      },
      take: 10,
      orderBy: { username: 'asc' },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    // Check the previous state so we only award PROFILE_COMPLETED once.
    const prior = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileSetup: true },
    });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username !== undefined && { username: data.username }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.twitterUrl !== undefined && { twitterUrl: data.twitterUrl || null }),
        ...(data.linkedinUrl !== undefined && { linkedinUrl: data.linkedinUrl || null }),
        ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl || null }),
        ...(data.agentEndpoint !== undefined && { agentEndpoint: data.agentEndpoint || null }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        profileSetup: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        twitterUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        agentEndpoint: true,
        profileSetup: true,
      },
    });
    invalidateUserCache(userId);

    if (!prior?.profileSetup) {
      this.reputation
        .awardPoints(userId, 'PROFILE_COMPLETED', userId, 'Profile setup')
        .catch((err) =>
          this.logger.warn(
            `PROFILE_COMPLETED award failed for ${userId}: ${err instanceof Error ? err.message : err}`,
          ),
        );
    }

    return updated;
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        githubLogin: true,
        walletAddress: true,
        twitterUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        role: true,
        occupation: true,
        reputationPoints: true,
        createdAt: true,
        repositories: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            name: true,
            fullName: true,
            description: true,
            language: true,
            stars: true,
            forks: true,
            githubUrl: true,
            topics: true,
            downloadCount: true,
            isLocked: true,
            lockedPriceUsd: true,
          },
        },
        _count: {
          select: { repositories: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─── Notification Preferences ──────────────────────────────────────────────

  async getNotificationPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default if doesn't exist
    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  async updateNotificationPreferences(
    userId: string,
    data: {
      emailOnErrors?: boolean;
      emailWeeklyReport?: boolean;
      emailMonthlyReport?: boolean;
      emailDeploymentAlerts?: boolean;
      emailOrderUpdates?: boolean;
      emailMessages?: boolean;
    },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  // ─── Privacy preferences ─────────────────────────────────────────────────

  async getPrivacy(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { friendRequestsEnabled: true, publicMessagesEnabled: true },
    });
    return {
      friendRequestsEnabled: u?.friendRequestsEnabled ?? true,
      publicMessagesEnabled: u?.publicMessagesEnabled ?? true,
    };
  }

  async updatePrivacy(
    userId: string,
    data: { friendRequestsEnabled?: boolean; publicMessagesEnabled?: boolean },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof data.friendRequestsEnabled === 'boolean'
          ? { friendRequestsEnabled: data.friendRequestsEnabled }
          : {}),
        ...(typeof data.publicMessagesEnabled === 'boolean'
          ? { publicMessagesEnabled: data.publicMessagesEnabled }
          : {}),
      },
      select: { friendRequestsEnabled: true, publicMessagesEnabled: true },
    });
    return updated;
  }

  // ─── Suggested users ─────────────────────────────────────────────────────

  /**
   * Friends → Suggested tab. Returns a tight, varied list:
   *   • a few high-reputation users (people worth knowing)
   *   • a few users active in the last 7 days (alive accounts)
   *   • a couple of recent joiners (fresh faces)
   * Always excludes the caller, banned/bot accounts, and anyone already
   * connected (friend or pending request either direction).
   */
  async getSuggested(userId: string, limit = 12) {
    // The Friendship model carries both pending and accepted edges,
    // distinguished by `status`. Pull every row that touches the caller
    // (either side) and turn them into a single set of "ids to skip"
    // so suggestions never include people the user already knows or
    // has pending traffic with.
    const friendshipRows = await this.prisma.friendship.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true },
    });
    const blocked = new Set<string>([userId]);
    for (const f of friendshipRows) {
      blocked.add(f.senderId === userId ? f.receiverId : f.senderId);
    }

    const baseFilter = {
      isBanned: false,
      isBot: false,
      friendRequestsEnabled: true,
      id: { notIn: Array.from(blocked) },
    } as const;

    const select = {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      reputationPoints: true,
      userTag: true,
      createdAt: true,
    } as const;

    // No `lastActiveAt` on the User table; use `updatedAt` as a proxy.
    // It bumps on most user-facing writes (profile edits, settings,
    // connections), so a high `updatedAt` is a reasonable signal of
    // "this account is alive".
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [topRep, recentlyActive, freshJoiners] = await Promise.all([
      this.prisma.user.findMany({
        where: baseFilter,
        orderBy: { reputationPoints: 'desc' },
        take: Math.ceil(limit * 0.5),
        select,
      }),
      this.prisma.user.findMany({
        where: { ...baseFilter, updatedAt: { gte: since7d } },
        orderBy: { updatedAt: 'desc' },
        take: Math.ceil(limit * 0.4),
        select,
      }),
      this.prisma.user.findMany({
        where: baseFilter,
        orderBy: { createdAt: 'desc' },
        take: Math.ceil(limit * 0.3),
        select,
      }),
    ]);

    // Merge by id, preserving the priority order: top-rep first, then
    // active, then fresh. Cap at requested limit.
    const seen = new Set<string>();
    const merged: typeof topRep = [];
    for (const list of [topRep, recentlyActive, freshJoiners]) {
      for (const u of list) {
        if (seen.has(u.id)) continue;
        seen.add(u.id);
        merged.push(u);
        if (merged.length >= limit) break;
      }
      if (merged.length >= limit) break;
    }
    return merged;
  }

  // ─── Activity Log ──────────────────────────────────────────────────────────

  async getActivityLog(userId: string, limit = 50) {
    // Cap the per-call limit so the controller can't blow up the response
    // by passing limit=10000.
    const safeLimit = Math.min(Math.max(1, limit), 200);
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
        ipAddress: true,
      },
    });
  }

  // ─── Usage Statistics ──────────────────────────────────────────────────────

  async getUsageStats(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      purchasesThisMonth,
      lastPurchase,
      activeListings,
      last24hPurchases,
      salesThisMonth,
      repoPurchasesThisMonth,
      lastApiUse,
      activeApiKeys,
      last30dPurchases,
    ] = await Promise.all([
      this.prisma.marketPurchase.count({
        where: { buyerId: userId, createdAt: { gte: monthStart } },
      }),
      this.prisma.marketPurchase.findFirst({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.marketListing.count({
        where: { sellerId: userId, status: 'ACTIVE' },
      }),
      this.prisma.marketPurchase.count({
        where: { buyerId: userId, createdAt: { gte: last24h } },
      }),
      this.prisma.marketPurchase.count({
        where: { sellerId: userId, verified: true, createdAt: { gte: monthStart } },
      }),
      this.prisma.repoPurchase.count({
        where: { buyerId: userId, createdAt: { gte: monthStart } },
      }),
      this.prisma.userApiKey.findFirst({
        where: { userId, lastUsedAt: { not: null } },
        orderBy: { lastUsedAt: 'desc' },
        select: { lastUsedAt: true },
      }),
      this.prisma.userApiKey.count({ where: { userId } }),
      this.prisma.marketPurchase.count({
        where: { buyerId: userId, createdAt: { gte: last30d } },
      }),
    ]);

    // ── Legacy compat ───────────────────────────────────────────────────────
    // Older UI reads `totalCallsThisMonth` / `last24hCalls` / `maxCallsAllowed`.
    // We keep those fields mapped to real data (combined purchases from market
    // + repos this month) and also surface the richer per-category breakdown
    // so the new UI can drop the misleading "API calls" label.
    const activityThisMonth = purchasesThisMonth + repoPurchasesThisMonth;

    return {
      // Legacy fields (preserved for backward compat)
      totalCallsThisMonth: activityThisMonth,
      maxCallsAllowed: 100000,
      activeAgents: activeListings,
      last24hCalls: last24hPurchases,
      lastResetDate: monthStart.toISOString(),
      lastUsedAt: lastPurchase?.createdAt || null,

      // New, honest breakdown
      purchasesThisMonth,
      repoPurchasesThisMonth,
      salesThisMonth,
      activeListings,
      last24hPurchases,
      last30dPurchases,
      apiKeysCount: activeApiKeys,
      lastApiUsedAt: lastApiUse?.lastUsedAt ?? null,
      lastPurchaseAt: lastPurchase?.createdAt ?? null,
    };
  }

  // ─── Integrations ──────────────────────────────────────────────────────────

  async getUserIntegrations(userId: string) {
    return this.prisma.userIntegration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async addIntegration(userId: string, provider: string, name: string, connectedAs?: string) {
    return this.prisma.userIntegration.upsert({
      where: { userId_provider_name: { userId, provider, name } },
      create: {
        userId,
        provider,
        name,
        connected: true,
        connectedAs,
        lastUsedAt: new Date(),
      },
      update: {
        connected: true,
        connectedAs,
        lastUsedAt: new Date(),
      },
    });
  }

  async removeIntegration(userId: string, integrationId: string) {
    return this.prisma.userIntegration.deleteMany({
      where: { id: integrationId, userId },
    });
  }
}
