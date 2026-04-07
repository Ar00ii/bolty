import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a new API key with the prefix "blt_"
   */
  private generateKey(): string {
    const random = crypto.randomBytes(24).toString('hex');
    return `blt_${random}`;
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
