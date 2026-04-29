import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { WalletProvider } from '@prisma/client';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { PrismaService } from '../../common/prisma/prisma.service';

import { AuthService } from './auth.service';
import { AuthTokens } from './auth.service';
import { invalidateUserCache } from './strategies/jwt.strategy';

const VALID_PROVIDERS = new Set<WalletProvider>([
  'PHANTOM',
  'SOLFLARE',
  'BACKPACK',
  'GLOW',
  'COINBASE',
  'OTHER',
]);

const SOLANA_BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

@Injectable()
export class WalletAuthService {
  private readonly logger = new Logger(WalletAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ── Solana wallet auth ────────────────────────────────────────────────────

  async getNonce(address: string): Promise<{ nonce: string; message: string }> {
    if (!isSolanaAddress(address)) {
      throw new UnauthorizedException('Invalid Solana address');
    }
    const nonce = await this.authService.generateNonce(address);
    const message = this.buildSignMessage(address, nonce);
    return { nonce, message };
  }

  async verifySolana(
    address: string,
    signature: string,
    nonce: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    if (!isSolanaAddress(address)) {
      throw new UnauthorizedException('Invalid Solana address');
    }

    const nonceValid = await this.authService.verifyAndConsumeNonce(address, nonce);
    if (!nonceValid) {
      throw new UnauthorizedException('Invalid or expired nonce');
    }

    const message = this.buildSignMessage(address, nonce);
    if (!verifySolanaSignature(address, message, signature)) {
      throw new UnauthorizedException('Signature verification failed');
    }

    const user = await this.findOrCreateWalletUser(address);

    await this.authService.createAuditLog({
      action: 'LOGIN',
      resource: 'AUTH',
      userId: user.id,
      ipAddress,
      metadata: { method: 'solana', address: address.slice(0, 6) + '…' + address.slice(-4) },
    });

    return this.authService.generateTokens(user.id);
  }

  // ── Link wallet to existing account ──────────────────────────────────────

  async linkWalletToUser(
    userId: string,
    address: string,
    signature: string,
    nonce: string,
  ): Promise<void> {
    if (!userId) throw new UnauthorizedException('Authentication required');
    if (!isSolanaAddress(address)) throw new UnauthorizedException('Invalid Solana address');

    const nonceValid = await this.authService.verifyAndConsumeNonce(address, nonce);
    if (!nonceValid) throw new UnauthorizedException('Invalid or expired nonce');

    const message = this.buildSignMessage(address, nonce);
    if (!verifySolanaSignature(address, message, signature)) {
      throw new UnauthorizedException('Signature verification failed');
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { walletAddress: address } });
      if (existing && existing.id !== userId) {
        const isWalletOnly = !existing.email && !existing.githubId;
        if (!isWalletOnly) {
          throw new ConflictException('This wallet is already linked to another account');
        }
        await tx.user.update({ where: { id: existing.id }, data: { walletAddress: null } });
        await tx.userWallet.deleteMany({
          where: { userId: existing.id, address },
        });
        this.logger.log(
          `Transferred wallet ${address.slice(0, 6)}… from wallet-only account ${existing.id} to user ${userId}`,
        );
      }
      await tx.user.update({ where: { id: userId }, data: { walletAddress: address } });

      await tx.userWallet.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
      await tx.userWallet.upsert({
        where: { userId_address: { userId, address } },
        create: { userId, address, provider: 'PHANTOM', isPrimary: true },
        update: { isPrimary: true },
      });
    });
    invalidateUserCache(userId);
    this.logger.log(`Wallet linked: ${address.slice(0, 6)}… → user ${userId}`);
  }

  async linkAdditionalWallet(
    userId: string,
    address: string,
    signature: string,
    nonce: string,
    provider?: string,
    label?: string,
  ) {
    if (!userId) throw new UnauthorizedException('Authentication required');
    if (!isSolanaAddress(address)) throw new UnauthorizedException('Invalid Solana address');

    const nonceValid = await this.authService.verifyAndConsumeNonce(address, nonce);
    if (!nonceValid) throw new UnauthorizedException('Invalid or expired nonce');

    const message = this.buildSignMessage(address, nonce);
    if (!verifySolanaSignature(address, message, signature)) {
      throw new UnauthorizedException('Signature verification failed');
    }

    const owningUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ walletAddress: address }, { linkedWallets: { some: { address } } }],
        NOT: { id: userId },
      },
      select: { id: true },
    });
    if (owningUser) {
      throw new ConflictException('This wallet is already linked to another account');
    }

    const existing = await this.prisma.userWallet.findUnique({
      where: { userId_address: { userId, address } },
    });
    if (existing) {
      throw new ConflictException('This wallet is already linked to your account');
    }

    const providerEnum: WalletProvider =
      provider && VALID_PROVIDERS.has(provider.toUpperCase() as WalletProvider)
        ? (provider.toUpperCase() as WalletProvider)
        : 'PHANTOM';

    const wallet = await this.prisma.userWallet.create({
      data: {
        userId,
        address,
        provider: providerEnum,
        label: label?.slice(0, 60) || null,
        isPrimary: false,
      },
    });
    invalidateUserCache(userId);
    this.logger.log(`Additional wallet linked: ${address.slice(0, 6)}… → user ${userId}`);
    return wallet;
  }

  async unlinkWallet(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletAddress: true },
      });
      await tx.user.update({ where: { id: userId }, data: { walletAddress: null } });
      if (user?.walletAddress) {
        await tx.userWallet.deleteMany({
          where: { userId, address: user.walletAddress },
        });
      }
    });
    invalidateUserCache(userId);
  }

  // ── Helper Methods ────────────────────────────────────────────────────────

  private async generateUserTag(): Promise<string> {
    for (let i = 0; i < 20; i++) {
      const tag = String(Math.floor(1000 + Math.random() * 9000));
      const existing = await this.prisma.user.findUnique({ where: { userTag: tag } });
      if (!existing) return tag;
    }
    for (let i = 0; i < 10; i++) {
      const tag = String(Math.floor(10000 + Math.random() * 90000));
      const existing = await this.prisma.user.findUnique({ where: { userTag: tag } });
      if (!existing) return tag;
    }
    throw new ConflictException('Unable to generate user tag — please try again');
  }

  private buildSignMessage(address: string, nonce: string): string {
    return `Welcome to Bolty!\n\nSign this message to authenticate.\n\nChain: solana\nWallet: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a transaction.`;
  }

  private async findOrCreateWalletUser(address: string) {
    let user = await this.prisma.user.findUnique({
      where: { walletAddress: address },
    });

    if (!user) {
      const userTag = await this.generateUserTag();
      user = await this.prisma.user.create({
        data: {
          walletAddress: address,
          username: `sol_${address.slice(0, 6)}`,
          lastLoginAt: new Date(),
          userTag,
        },
      });
      this.logger.log(`New solana wallet user: ${address.slice(0, 6)}…`);
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Account is banned');
    }

    return user;
  }
}

function isSolanaAddress(address: string): boolean {
  if (!SOLANA_BASE58.test(address)) return false;
  try {
    const bytes = bs58.decode(address);
    return bytes.length === 32;
  } catch {
    return false;
  }
}

function verifySolanaSignature(address: string, message: string, signatureBase58: string): boolean {
  try {
    const pubkey = bs58.decode(address);
    const sig = bs58.decode(signatureBase58);
    if (pubkey.length !== 32) return false;
    if (sig.length !== 64) return false;
    const msg = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msg, sig, pubkey);
  } catch {
    return false;
  }
}
