import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtPayload } from '../auth.service';

type CachedUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  isBanned: boolean;
  githubLogin: string | null;
  walletAddress: string | null;
  profileSetup: boolean;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  email: string | null;
  twoFactorEnabled: boolean;
  reputationPoints: number;
  userTag: string | null;
};

// In-memory LRU-ish cache for authenticated user rows. Every API call used to
// hit Postgres with User.findUnique — cumulative latency was noticeable on
// pages that fan out into many authed requests (chat, market, profile). A
// short TTL (10s) keeps the ban / role check fresh without the DB roundtrip.
const CACHE_TTL_MS = 10_000;
const CACHE_MAX = 5_000;
const userCache = new Map<string, { user: CachedUser; expiresAt: number }>();

function cacheGet(id: string): CachedUser | null {
  const hit = userCache.get(id);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    userCache.delete(id);
    return null;
  }
  return hit.user;
}

function cacheSet(id: string, user: CachedUser) {
  if (userCache.size >= CACHE_MAX) {
    // Evict oldest ~10% when we hit the cap.
    const drop = Math.ceil(CACHE_MAX / 10);
    let i = 0;
    for (const key of userCache.keys()) {
      if (i++ >= drop) break;
      userCache.delete(key);
    }
  }
  userCache.set(id, { user, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateUserCache(id: string) {
  userCache.delete(id);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error(
        'CRITICAL: JWT_SECRET must be set and at least 32 characters. Refusing to start with an insecure fallback.',
      );
    }
    super({
      // Extract JWT from HttpOnly cookie (preferred) or Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['access_token'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    const cached = cacheGet(payload.sub);
    if (cached) {
      if (cached.isBanned) throw new UnauthorizedException('User not found or banned');
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isBanned: true,
        githubLogin: true,
        walletAddress: true,
        profileSetup: true,
        twitterUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        email: true,
        twoFactorEnabled: true,
        reputationPoints: true,
        userTag: true,
      },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException('User not found or banned');
    }

    cacheSet(user.id, user as CachedUser);
    return user;
  }
}
