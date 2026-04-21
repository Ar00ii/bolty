import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';

import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

/**
 * Step-up authentication: requires the user to prove possession of their
 * second factor for sensitive actions (changing username, deleting an agent,
 * removing a repo, etc.). When 2FA is not enabled the request is allowed
 * through, so we never lock people out of their own account.
 */
@Injectable()
export class StepUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async assert(userId: string, code?: string | null): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      // Step-up is a no-op when the user has not enrolled.
      return;
    }

    if (!code || !/^\d{6}$/.test(code)) {
      throw new BadRequestException({
        code: 'STEP_UP_REQUIRED',
        message: 'Confirm with your authenticator code',
        source: 'totp',
      });
    }

    // Light rate-limit per code window
    const attemptsKey = `step_up_attempts:${userId}`;
    const attemptsRaw = await this.redis.get(attemptsKey);
    const attempts = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;
    if (attempts >= 6) {
      throw new UnauthorizedException('Too many attempts. Please wait a minute and retry.');
    }
    await this.redis.set(attemptsKey, String(attempts + 1), 60);

    const ok = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });
    if (!ok) {
      throw new BadRequestException({
        code: 'STEP_UP_INVALID',
        message: 'Invalid authenticator code',
        source: 'totp',
      });
    }

    await this.redis.del(attemptsKey);
  }
}
