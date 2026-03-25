import {
  Injectable,
  UnauthorizedException,
  Logger,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
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
    private readonly emailService: EmailService,
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

    // Refresh token is a signed JWT so userId is self-contained (no access_token needed at refresh time)
    const jti = uuidv4();
    const refreshSecret = this.config.get<string>('JWT_SECRET') || 'changeme';
    const refreshToken = this.jwtService.sign(
      { sub: userId, jti, type: 'refresh' },
      { secret: refreshSecret, expiresIn: '7d' },
    );
    const hashed = await bcrypt.hash(jti, 10);

    // Store hashed jti for rotation detection
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });

    this.logger.log(`Tokens generated for user ${userId}`);
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Decode the self-contained refresh JWT to get userId without needing the access_token cookie
    let payload: { sub: string; jti: string; type: string };
    try {
      const refreshSecret = this.config.get<string>('JWT_SECRET') || 'changeme';
      payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(payload.jti, user.refreshToken);
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
    this.logger.warn(`All tokens revoked for user ${userId}`);
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Generate a unique 4-digit user tag (#1000–#9999) */
  private async generateUserTag(): Promise<string> {
    for (let i = 0; i < 20; i++) {
      const tag = String(randomInt(1000, 10000));
      const existing = await this.prisma.user.findUnique({ where: { userTag: tag } });
      if (!existing) return tag;
    }
    // Fallback to 5 digits if pool is full
    return String(randomInt(10000, 100000));
  }

  // ── Email / Password Auth ─────────────────────────────────────────────────

  async registerWithEmail(data: {
    email: string;
    username: string;
    password: string;
    gender?: string;
    occupation?: string;
  }): Promise<AuthTokens> {
    const email = data.email.toLowerCase().trim();
    const username = data.username.toLowerCase().trim();

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new ConflictException('Email already in use');

    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) throw new ConflictException('Username already taken');

    const passwordHash = await bcrypt.hash(data.password, 12);
    const userTag = await this.generateUserTag();

    const user = await this.prisma.user.create({
      data: { email, username, passwordHash, displayName: username, userTag, gender: data.gender, occupation: data.occupation },
    });

    this.logger.log(`New email user registered: ${username}`);

    // Send welcome email (fire and forget — don't block registration)
    this.emailService.sendWelcomeEmail(email, username).catch((err: Error) =>
      this.logger.warn(`Welcome email failed for ${username}: ${err.message}`),
    );

    return this.generateTokens(user.id);
  }

  async loginWithEmail(
    data: { identifier: string; password: string },
  ): Promise<AuthTokens | { twoFactorRequired: true; tempToken: string }> {
    const identifier = data.identifier.toLowerCase().trim();
    const isEmail = identifier.includes('@');
    const user = await (isEmail
      ? this.prisma.user.findUnique({ where: { email: identifier } })
      : this.prisma.user.findUnique({ where: { username: identifier } }));

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.isBanned) throw new UnauthorizedException('Account is banned');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 2FA required
    if (user.twoFactorEnabled && user.email) {
      const code = randomInt(100000, 1000000).toString();
      await this.redis.set(`2fa:${user.id}`, code, 600); // 10 min
      await this.emailService.send2FACode(user.email, code);

      const tempToken = this.jwtService.sign(
        { sub: user.id, scope: 'pending_2fa' },
        { expiresIn: '10m' },
      );
      return { twoFactorRequired: true, tempToken };
    }

    return this.generateTokens(user.id);
  }

  async verifyLogin2FA(tempToken: string, code: string): Promise<AuthTokens> {
    let payload: { sub: string; scope: string };
    try {
      payload = this.jwtService.verify<{ sub: string; scope: string }>(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.scope !== 'pending_2fa') {
      throw new UnauthorizedException('Invalid token scope');
    }

    // Brute-force protection: max 5 attempts within the 10-minute code window
    const attemptsKey = `2fa_attempts:${payload.sub}`;
    const attemptsRaw = await this.redis.get(attemptsKey);
    const attempts = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;
    if (attempts >= 5) {
      throw new UnauthorizedException('Too many attempts. Request a new code.');
    }
    await this.redis.set(attemptsKey, String(attempts + 1), 600);

    const stored = await this.redis.get(`2fa:${payload.sub}`);
    if (!stored || stored !== code) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Clear attempts and code on success
    await Promise.all([
      this.redis.del(`2fa:${payload.sub}`),
      this.redis.del(attemptsKey),
    ]);
    return this.generateTokens(payload.sub);
  }

  // ── 2FA Management ────────────────────────────────────────────────────────

  async request2FAEnable(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) throw new BadRequestException('You need an email address to enable 2FA');
    if (user.twoFactorEnabled) throw new BadRequestException('2FA is already enabled');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`2fa_enable:${userId}`, code, 600); // 10 min
    try {
      await this.emailService.send2FAEnableCode(user.email, code);
    } catch (err) {
      await this.redis.del(`2fa_enable:${userId}`);
      throw new BadRequestException('Failed to send verification email. Verify a domain at resend.com/domains to send to any email address.');
    }
    this.logger.log(`2FA enable code sent for user ${userId}`);
  }

  async enable2FA(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) throw new BadRequestException('You need an email address to enable 2FA');
    if (user.twoFactorEnabled) throw new BadRequestException('2FA is already enabled');

    const stored = await this.redis.get(`2fa_enable:${userId}`);
    if (!stored || stored !== code) throw new UnauthorizedException('Invalid or expired verification code');

    await this.redis.del(`2fa_enable:${userId}`);
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    this.logger.log(`2FA enabled for user ${userId}`);
  }

  async disable2FA(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.twoFactorEnabled) throw new BadRequestException('2FA is not enabled');

    if (user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false } });
    this.logger.log(`2FA disabled for user ${userId}`);
  }

  // ── Email Change ──────────────────────────────────────────────────────────

  async requestEmailChange(userId: string, newEmail: string, password: string): Promise<void> {
    const email = newEmail.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid password');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('This email is already in use');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`email_change:${userId}`, JSON.stringify({ newEmail: email, code }), 900); // 15 min
    await this.emailService.sendEmailChangeConfirmation(email, code);
    this.logger.log(`Email change requested for user ${userId} → ${email}`);
  }

  async confirmEmailChange(userId: string, code: string): Promise<void> {
    const raw = await this.redis.get(`email_change:${userId}`);
    if (!raw) throw new BadRequestException('No email change pending or code expired');

    const { newEmail, code: stored } = JSON.parse(raw) as { newEmail: string; code: string };
    if (stored !== code) throw new UnauthorizedException('Invalid verification code');

    const existing = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) throw new ConflictException('This email is already in use');

    await this.prisma.user.update({ where: { id: userId }, data: { email: newEmail } });
    await this.redis.del(`email_change:${userId}`);
    this.logger.log(`Email changed for user ${userId} → ${newEmail}`);
  }

  // ── Delete Account ────────────────────────────────────────────────────────

  async requestDeleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.email) throw new BadRequestException('No email address on this account — contact support');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`delete_account:${userId}`, code, 600); // 10 min
    await this.emailService.sendDeleteAccountCode(user.email, code);
    this.logger.log(`Delete account code sent for user ${userId}`);
  }

  async deleteAccount(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Verify OTP
    const stored = await this.redis.get(`delete_account:${userId}`);
    if (!stored || stored !== code) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }
    await this.redis.del(`delete_account:${userId}`);

    await this.revokeAllTokens(userId);
    await this.prisma.user.delete({ where: { id: userId } });
    this.logger.warn(`Account deleted: ${userId}`);
  }

  // ── Password Reset ────────────────────────────────────────────────────────

  async requestPasswordReset(identifier: string): Promise<void> {
    const id = identifier.toLowerCase().trim();
    const isEmail = id.includes('@');
    const user = await (isEmail
      ? this.prisma.user.findUnique({ where: { email: id } })
      : this.prisma.user.findUnique({ where: { username: id } }));

    // Always return silently — don't reveal whether the account exists
    if (!user?.email || !user.passwordHash) return;

    const token = uuidv4();
    await this.redis.set(`pwd_reset:${token}`, user.id, 15 * 60); // 15 min

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    this.emailService.sendPasswordResetEmail(user.email, resetUrl).catch((err: Error) =>
      this.logger.warn(`Password reset email failed for ${user.email}: ${err.message}`),
    );
    this.logger.log(`Password reset requested for user ${user.id}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`pwd_reset:${token}`);
    if (!userId) throw new BadRequestException('Invalid or expired reset token');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.redis.del(`pwd_reset:${token}`);

    // Revoke all existing sessions so old tokens are invalidated
    await this.revokeAllTokens(userId);
    this.logger.log(`Password reset completed for user ${userId}`);
  }

  // ── GitHub Linking ────────────────────────────────────────────────────────

  async linkGitHubToUser(
    userId: string,
    githubProfile: { id: string; login: string; avatar_url: string; accessToken?: string },
  ): Promise<void> {
    const existing = await this.prisma.user.findUnique({
      where: { githubId: githubProfile.id },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('This GitHub account is already linked to another user');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        githubId: githubProfile.id,
        githubLogin: githubProfile.login,
        avatarUrl: githubProfile.avatar_url,
        githubToken: githubProfile.accessToken ?? undefined,
      },
    });
    this.logger.log(`GitHub linked for user ${userId}: @${githubProfile.login}`);
  }

  async unlinkGitHub(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { githubId: null, githubLogin: null, githubToken: null },
    });
    this.logger.log(`GitHub unlinked for user ${userId}`);
  }

  // ── GitHub OAuth ──────────────────────────────────────────────────────────

  async handleGitHubCallback(githubProfile: {
    id: string;
    login: string;
    avatar_url: string;
    bio?: string;
    accessToken?: string;
  }): Promise<AuthTokens> {
    let user = await this.prisma.user.findUnique({
      where: { githubId: githubProfile.id },
    });

    if (!user) {
      // Check if a user with this GitHub username already exists (e.g. registered by email)
      // If so, link GitHub to that existing account instead of creating a duplicate
      const existingByUsername = await this.prisma.user.findUnique({
        where: { username: githubProfile.login },
      });

      if (existingByUsername) {
        this.logger.log(`Linking GitHub to existing user: ${githubProfile.login}`);
        user = await this.prisma.user.update({
          where: { id: existingByUsername.id },
          data: {
            githubId: githubProfile.id,
            githubLogin: githubProfile.login,
            githubToken: githubProfile.accessToken ?? undefined,
            avatarUrl: existingByUsername.avatarUrl || githubProfile.avatar_url,
            lastLoginAt: new Date(),
          },
        });
      } else {
        const userTag = await this.generateUserTag();
        user = await this.prisma.user.create({
          data: {
            githubId: githubProfile.id,
            githubLogin: githubProfile.login,
            username: githubProfile.login,
            avatarUrl: githubProfile.avatar_url,
            bio: githubProfile.bio,
            githubToken: githubProfile.accessToken ?? null,
            userTag,
          },
        });
        this.logger.log(`New GitHub user created: ${githubProfile.login}`);
      }
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          githubLogin: githubProfile.login,
          avatarUrl: githubProfile.avatar_url,
          githubToken: githubProfile.accessToken ?? undefined,
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
