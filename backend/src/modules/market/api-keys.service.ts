import * as crypto from 'crypto';

import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class ApiKeysService {
  private readonly VERIFICATION_CODE_TTL = 600; // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
  ) {}

  /**
   * Generate a new API key with the prefix "blt_"
   */
  private generateKey(): string {
    const random = crypto.randomBytes(24).toString('hex');
    return `blt_${random}`;
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Get all API keys for a user (without revealing the actual keys)
   */
  async getUserApiKeys(userId: string) {
    const keys = await this.prisma.userApiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        createdAt: true,
        lastUsedAt: true,
        keyLastFour: true,
      },
    });
    return keys.map((k) => ({
      id: k.id,
      label: k.label,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      lastFour: k.keyLastFour,
    }));
  }

  /**
   * Rename an API key label
   */
  async renameApiKey(userId: string, keyId: string, label: string | null) {
    const existing = await this.prisma.userApiKey.findUnique({ where: { id: keyId } });
    if (!existing || existing.userId !== userId) {
      throw new BadRequestException('API key not found or does not belong to you');
    }
    const trimmed = label?.trim() || null;
    if (trimmed && trimmed.length > 64) {
      throw new BadRequestException('Label must be 64 characters or fewer');
    }
    const updated = await this.prisma.userApiKey.update({
      where: { id: keyId },
      data: { label: trimmed },
    });
    return {
      id: updated.id,
      label: updated.label,
      createdAt: updated.createdAt,
      lastUsedAt: updated.lastUsedAt,
      lastFour: updated.keyLastFour,
    };
  }

  /**
   * Create a new API key for a user
   */
  async createApiKey(userId: string, label: string | null = null) {
    const plainKey = this.generateKey();
    const keyHash = await bcrypt.hash(plainKey, 10);

    const apiKey = await this.prisma.userApiKey.create({
      data: {
        userId,
        keyHash,
        keyPrefix: plainKey.slice(0, 12),
        keyLastFour: plainKey.slice(-4),
        label: label || null,
      },
    });

    return {
      id: apiKey.id,
      key: plainKey, // Return the plain key only on creation
      label: apiKey.label,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
      lastFour: apiKey.keyLastFour,
    };
  }

  /**
   * Delete an API key (revoke it)
   */
  async deleteApiKey(keyId: string, userId: string) {
    await this.prisma.userApiKey.deleteMany({
      where: {
        id: keyId,
        userId, // Ensure user can only delete their own keys
      },
    });
    return { success: true, message: 'API key revoked successfully' };
  }

  /**
   * Request a verification code to delete an API key
   * Code is sent via email and stored in Redis with 10-minute TTL
   */
  async requestDeleteVerification(userId: string, keyId: string, userEmail: string) {
    // Verify that the key belongs to the user
    const apiKey = await this.prisma.userApiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new BadRequestException('API key not found or does not belong to you');
    }

    // Generate verification code (6 digits)
    const code = this.generateVerificationCode();

    // Hash the code for storage (never store plaintext)
    const hashedCode = await bcrypt.hash(code, 10);

    // Store hashed code in Redis with TTL (key: `api-key-delete:${userId}:${keyId}`)
    const redisKey = `api-key-delete:${userId}:${keyId}`;
    await this.redis.set(redisKey, hashedCode);
    await this.redis.expire(redisKey, this.VERIFICATION_CODE_TTL);

    // Send verification code email
    await this.email.sendApiKeyDeleteCode(userEmail, code);

    return {
      success: true,
      message: 'Verification code sent to your email. Valid for 10 minutes.',
    };
  }

  /**
   * Verify code and delete API key
   * Code must match the one sent to user's email, valid for 10 minutes
   */
  async verifyAndDeleteApiKey(userId: string, keyId: string, code: string) {
    if (!code || code.trim().length !== 6) {
      throw new BadRequestException('Invalid verification code');
    }

    // Verify the key belongs to user
    const apiKey = await this.prisma.userApiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new BadRequestException('API key not found or does not belong to you');
    }

    // Retrieve stored hashed code from Redis
    const redisKey = `api-key-delete:${userId}:${keyId}`;
    const hashedCode = await this.redis.get(redisKey);

    if (!hashedCode) {
      throw new BadRequestException('Verification code expired or not found. Request a new one.');
    }

    // Verify code with timing-safe comparison
    const isValid = await bcrypt.compare(code, hashedCode);
    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Delete the API key
    await this.prisma.userApiKey.delete({
      where: { id: keyId },
    });

    // Clean up Redis (remove the used code)
    await this.redis.del(redisKey);

    return { success: true, message: 'API key revoked successfully' };
  }

  /**
   * Verify an API key and update last used timestamp.
   *
   * Filter by keyPrefix first so we only bcrypt-compare the (typically 0-1)
   * candidates whose prefix matches instead of every row in the table. Legacy
   * keys created before the migration have a null keyPrefix — for those we
   * still need to scan, but that set shrinks to zero as old keys are rotated.
   */
  async verifyApiKey(plainKey: string): Promise<{ userId: string; keyId: string } | null> {
    const prefix = plainKey.slice(0, 12);
    const candidates = await this.prisma.userApiKey.findMany({
      where: { OR: [{ keyPrefix: prefix }, { keyPrefix: null }] },
      select: { id: true, keyHash: true, userId: true, keyPrefix: true },
    });

    for (const keyRecord of candidates) {
      const isValid = await bcrypt.compare(plainKey, keyRecord.keyHash);
      if (isValid) {
        // Backfill the prefix on legacy rows so subsequent verifies hit the
        // fast path; also update lastUsedAt.
        await this.prisma.userApiKey.update({
          where: { id: keyRecord.id },
          data: {
            lastUsedAt: new Date(),
            ...(keyRecord.keyPrefix == null ? { keyPrefix: prefix } : {}),
          },
        });
        return { userId: keyRecord.userId, keyId: keyRecord.id };
      }
    }

    return null;
  }
}
