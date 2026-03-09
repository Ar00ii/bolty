import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  username?: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly NONCE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly usersService: UsersService,
  ) {}

  // ── Nonce generation (wallet auth) ────────────────────────────────────────

  async generateNonce(address: string): Promise<string> {
    const nonce = uuidv4();
    const key = `nonce:${address.toLowerCase()}`;
    await this.redis.set(key, nonce, this.NONCE_TTL);
    this.logger.log(`Nonce generated for ${address.slice(0, 8)}...`);
    return nonce;
  }

  async verifyAndConsumeNonce(address: string, nonce: string): Promise<boolean> {
    const key = `nonce:${address.toLowerCase()}`;
    const stored = await this.redis.get(key);

    if (!stored || stored !== nonce) {
      return false;
    }

    // Delete immediately after use (replay attack prevention)
    await this.redis.del(key);
    return true;
  }

  // ── JWT Token Management ─────────────────────────────────────────────────

  async generateTokens(userId: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username ?? undefined,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = uuidv4();
    const hashed = await bcrypt.hash(refreshToken, 12);

    // Store hashed refresh token
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });

    // Also cache for fast lookup
    await this.redis.set(
      `refresh:${userId}`,
      hashed,
      7 * 24 * 60 * 60, // 7 days
    );

    this.logger.log(`Tokens generated for user ${userId}`);
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      // Possible token theft — invalidate everything
      await this.revokeAllTokens(userId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(userId);
  }

  async revokeAllTokens(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    await this.redis.del(`refresh:${userId}`);
    this.logger.warn(`All tokens revoked for user ${userId}`);
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // ── GitHub OAuth ──────────────────────────────────────────────────────────

  async handleGitHubCallback(githubProfile: {
    id: string;
    login: string;
    avatar_url: string;
    bio?: string;
  }): Promise<AuthTokens> {
    let user = await this.prisma.user.findUnique({
      where: { githubId: githubProfile.id },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          githubId: githubProfile.id,
          githubLogin: githubProfile.login,
          username: githubProfile.login,
          avatarUrl: githubProfile.avatar_url,
          bio: githubProfile.bio,
        },
      });
      this.logger.log(`New GitHub user created: ${githubProfile.login}`);
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          githubLogin: githubProfile.login,
          avatarUrl: githubProfile.avatar_url,
          lastLoginAt: new Date(),
        },
      });
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Account is banned');
    }

    return this.generateTokens(user.id);
  }

  // ── Audit Log Helper ──────────────────────────────────────────────────────

  async createAuditLog(params: {
    action: string;
    resource: string;
    resourceId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });
  }
}
