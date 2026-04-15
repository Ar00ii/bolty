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
      },
    });
    return keys;
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
        label: label || null,
      },
    });

    return {
      id: apiKey.id,
      key: plainKey, // Return the plain key only on creation
      label: apiKey.label,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
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
   * Verify an API key and update last used timestamp
   */
  async verifyApiKey(plainKey: string): Promise<{ userId: string; keyId: string } | null> {
    // Get all keys and check them
    const allKeys = await this.prisma.userApiKey.findMany({
      select: {
        id: true,
        keyHash: true,
        userId: true,
      },
    });

    for (const keyRecord of allKeys) {
      const isValid = await bcrypt.compare(plainKey, keyRecord.keyHash);
      if (isValid) {
        // Update last used timestamp
        await this.prisma.userApiKey.update({
          where: { id: keyRecord.id },
          data: { lastUsedAt: new Date() },
        });
        return {
          userId: keyRecord.userId,
          keyId: keyRecord.id,
        };
      }
    }

    return null;
  }
}
