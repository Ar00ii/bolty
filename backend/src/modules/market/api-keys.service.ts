import * as crypto from 'crypto';

import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
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
   * TODO: Implement verification code storage (requires adding verificationCode table to Prisma schema)
   */
  async requestDeleteVerification(userId: string, keyId: string, userEmail: string) {
    // Verify that the key belongs to the user
    const apiKey = await this.prisma.userApiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new BadRequestException('API key not found or does not belong to you');
    }

    // Generate verification code
    const code = this.generateVerificationCode();

    // TODO: Delete old codes for this purpose/email/key
    // await this.prisma.verificationCode.deleteMany({...})

    // TODO: Create new verification code (valid for 10 minutes)
    // const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // await this.prisma.verificationCode.create({...})

    // Send verification code email
    await this.email.sendApiKeyDeleteCode(userEmail, code);

    return {
      success: true,
      message: 'Verification code sent to your email',
    };
  }

  /**
   * Verify code and delete API key
   * TODO: Implement verification code validation (requires adding verificationCode table to Prisma schema)
   */
  async verifyAndDeleteApiKey(userId: string, keyId: string, _code: string) {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      throw new BadRequestException('User email not found');
    }

    // TODO: Find verification code
    // const verificationCode = await this.prisma.verificationCode.findUnique({...})

    // Verify the key belongs to user
    const apiKey = await this.prisma.userApiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new BadRequestException('API key not found or does not belong to you');
    }

    // Delete the key
    await this.prisma.userApiKey.delete({
      where: { id: keyId },
    });

    // TODO: Mark code as verified and delete it
    // await this.prisma.verificationCode.delete({...})

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
