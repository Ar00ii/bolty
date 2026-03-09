import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthTokens } from './auth.service';

@Injectable()
export class WalletAuthService {
  private readonly logger = new Logger(WalletAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ── MetaMask (Ethereum) Auth ──────────────────────────────────────────────

  async getNonce(address: string): Promise<{ nonce: string; message: string }> {
    const normalized = address.toLowerCase();

    // Validate Ethereum address format
    if (!ethers.isAddress(address)) {
      throw new UnauthorizedException('Invalid Ethereum address');
    }

    const nonce = await this.authService.generateNonce(normalized);
    const message = this.buildSignMessage(normalized, nonce, 'ethereum');

    return { nonce, message };
  }

  async verifyEthereum(
    address: string,
    signature: string,
    nonce: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    const normalized = address.toLowerCase();

    if (!ethers.isAddress(address)) {
      throw new UnauthorizedException('Invalid Ethereum address');
    }

    // Verify nonce (also deletes it — replay attack prevention)
    const nonceValid = await this.authService.verifyAndConsumeNonce(normalized, nonce);
    if (!nonceValid) {
      throw new UnauthorizedException('Invalid or expired nonce');
    }

    // Reconstruct the signed message
    const message = this.buildSignMessage(normalized, nonce, 'ethereum');

    // Verify signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      throw new UnauthorizedException('Invalid signature');
    }

    if (recoveredAddress.toLowerCase() !== normalized) {
      throw new UnauthorizedException('Signature verification failed');
    }

    // Find or create user
    const user = await this.findOrCreateWalletUser(normalized, 'ethereum');

    await this.authService.createAuditLog({
      action: 'LOGIN',
      resource: 'AUTH',
      userId: user.id,
      ipAddress,
      metadata: { method: 'metamask', address: normalized.slice(0, 8) + '...' },
    });

    return this.authService.generateTokens(user.id);
  }

  // ── Phantom (Solana) Auth ─────────────────────────────────────────────────

  async getSolanaNonce(address: string): Promise<{ nonce: string; message: string }> {
    // Basic Solana address validation (base58, ~32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      throw new UnauthorizedException('Invalid Solana address');
    }

    const nonce = await this.authService.generateNonce(address);
    const message = this.buildSignMessage(address, nonce, 'solana');

    return { nonce, message };
  }

  async verifySolana(
    address: string,
    signatureBase58: string,
    nonce: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      throw new UnauthorizedException('Invalid Solana address');
    }

    const nonceValid = await this.authService.verifyAndConsumeNonce(address, nonce);
    if (!nonceValid) {
      throw new UnauthorizedException('Invalid or expired nonce');
    }

    const message = this.buildSignMessage(address, nonce, 'solana');

    // Decode signature and public key
    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;
    try {
      signatureBytes = bs58.decode(signatureBase58);
      publicKeyBytes = bs58.decode(address);
    } catch {
      throw new UnauthorizedException('Invalid signature encoding');
    }

    const messageBytes = new TextEncoder().encode(message);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!isValid) {
      throw new UnauthorizedException('Signature verification failed');
    }

    const user = await this.findOrCreateWalletUser(address, 'solana');

    await this.authService.createAuditLog({
      action: 'LOGIN',
      resource: 'AUTH',
      userId: user.id,
      ipAddress,
      metadata: { method: 'phantom', address: address.slice(0, 8) + '...' },
    });

    return this.authService.generateTokens(user.id);
  }

  // ── Helper Methods ────────────────────────────────────────────────────────

  private buildSignMessage(address: string, nonce: string, chain: string): string {
    return `Welcome to Bolty!\n\nPlease sign this message to authenticate.\n\nChain: ${chain}\nAddress: ${address}\nNonce: ${nonce}\n\nThis request will not trigger any blockchain transaction.`;
  }

  private async findOrCreateWalletUser(address: string, chain: 'ethereum' | 'solana') {
    const field = chain === 'ethereum' ? 'walletAddress' : 'solanaAddress';

    const whereClause =
      chain === 'ethereum' ? { walletAddress: address } : { solanaAddress: address };

    let user = await this.prisma.user.findUnique({
      where: whereClause,
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          [field]: address,
          username: `${chain === 'ethereum' ? 'eth' : 'sol'}_${address.slice(0, 6)}`,
          lastLoginAt: new Date(),
        },
      });
      this.logger.log(`New ${chain} wallet user: ${address.slice(0, 8)}...`);
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
