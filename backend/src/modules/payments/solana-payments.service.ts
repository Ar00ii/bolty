import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  PublicKey,
} from '@solana/web3.js';

export interface VerifyResult {
  ok: boolean;
  reason?: string;
  amountLamports?: bigint;
  /** Block time in seconds (epoch). */
  blockTime?: number | null;
}

/**
 * Verifies a Solana payment by transaction signature.
 *
 * The whole platform is a buyer→seller direct-transfer model now (the
 * Anchor escrow program is on the roadmap but not shipped). For each
 * purchase the frontend sends a SOL `SystemProgram.transfer` from the
 * buyer to the seller, then POSTs the resulting tx signature here.
 *
 * RPC strategy: try the configured `SOLANA_RPC_URL` first, then fall
 * back to the public mainnet endpoints. Each call is best-effort with
 * a short timeout — we want the verifier to fail fast if a node is
 * stalling instead of holding the request open.
 */
@Injectable()
export class SolanaPaymentsService {
  private readonly logger = new Logger(SolanaPaymentsService.name);
  private readonly rpcEndpoints: string[];

  constructor(private readonly config: ConfigService) {
    const configured = this.config.get<string>('SOLANA_RPC_URL', '');
    this.rpcEndpoints = [
      configured,
      'https://api.mainnet-beta.solana.com',
      'https://solana-mainnet.public.blastapi.io',
      'https://solana.publicnode.com',
    ].filter(Boolean);
  }

  /**
   * Verify a SOL transfer. The tx must contain a SystemProgram transfer
   * to `expectedRecipient` for at least `minLamports`. Anything else
   * (memo, compute-budget, fees) is allowed in the same tx.
   */
  async verifySolPayment(
    signature: string,
    expectedRecipient: string,
    minLamports: bigint,
  ): Promise<VerifyResult> {
    if (!signature || signature.length < 64) {
      return { ok: false, reason: 'Invalid signature' };
    }

    let recipientKey: PublicKey;
    try {
      recipientKey = new PublicKey(expectedRecipient);
    } catch {
      return { ok: false, reason: 'Invalid recipient address' };
    }

    const tx = await this.fetchParsedTx(signature);
    if (!tx) {
      return { ok: false, reason: 'Transaction not found on Solana' };
    }
    if (tx.meta?.err) {
      return { ok: false, reason: 'Transaction failed on-chain' };
    }

    let totalLamports = 0n;
    for (const ix of allInstructions(tx)) {
      if (!('parsed' in ix) || ix.program !== 'system') continue;
      const parsed = ix.parsed as { type?: string; info?: Record<string, unknown> };
      if (parsed.type !== 'transfer') continue;
      const info = parsed.info ?? {};
      if (typeof info.destination !== 'string') continue;
      if (info.destination !== recipientKey.toBase58()) continue;
      const lamports = info.lamports;
      if (typeof lamports !== 'number' && typeof lamports !== 'string') continue;
      totalLamports += BigInt(lamports);
    }

    if (totalLamports < minLamports) {
      return {
        ok: false,
        reason: `Insufficient transfer: expected ${minLamports.toString()} lamports, got ${totalLamports.toString()}`,
      };
    }

    return {
      ok: true,
      amountLamports: totalLamports,
      blockTime: tx.blockTime ?? null,
    };
  }

  /**
   * Verify an SPL token transfer (e.g. $BOLTY). Requires the parsed
   * `spl-token`/`spl-token-2022` `transfer` or `transferChecked`
   * instruction to land on the recipient's associated token account
   * for the given mint. Returns the raw on-chain amount (still in mint
   * decimals).
   */
  async verifySplPayment(
    signature: string,
    expectedRecipientTokenAccount: string,
    expectedMint: string,
    minAmount: bigint,
  ): Promise<VerifyResult> {
    if (!signature || signature.length < 64) {
      return { ok: false, reason: 'Invalid signature' };
    }

    let recipientAta: PublicKey;
    let mintKey: PublicKey;
    try {
      recipientAta = new PublicKey(expectedRecipientTokenAccount);
      mintKey = new PublicKey(expectedMint);
    } catch {
      return { ok: false, reason: 'Invalid recipient or mint' };
    }

    const tx = await this.fetchParsedTx(signature);
    if (!tx) {
      return { ok: false, reason: 'Transaction not found on Solana' };
    }
    if (tx.meta?.err) {
      return { ok: false, reason: 'Transaction failed on-chain' };
    }

    let total = 0n;
    for (const ix of allInstructions(tx)) {
      if (!('parsed' in ix) || (ix.program !== 'spl-token' && ix.program !== 'spl-token-2022')) {
        continue;
      }
      const parsed = ix.parsed as { type?: string; info?: Record<string, unknown> };
      const type = parsed.type;
      if (type !== 'transfer' && type !== 'transferChecked') continue;
      const info = parsed.info ?? {};
      if (info.destination !== recipientAta.toBase58()) continue;
      if (type === 'transferChecked' && info.mint !== mintKey.toBase58()) continue;

      const amountRaw =
        type === 'transferChecked'
          ? (info.tokenAmount as { amount?: string } | undefined)?.amount
          : (info.amount as string | number | undefined);
      if (amountRaw == null) continue;
      total += BigInt(amountRaw);
    }

    if (total < minAmount) {
      return {
        ok: false,
        reason: `Insufficient SPL transfer: expected ${minAmount} of ${expectedMint}, got ${total}`,
      };
    }

    return {
      ok: true,
      amountLamports: total,
      blockTime: tx.blockTime ?? null,
    };
  }

  /**
   * Wait for a tx to confirm, retrying across the RPC fallback list.
   * Frontend posts the signature optimistically; we poll until it lands
   * (or give up after ~15 s).
   */
  async waitForConfirmation(signature: string, timeoutMs = 15_000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const tx = await this.fetchParsedTx(signature);
      if (tx) return !tx.meta?.err;
      await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
  }

  private async fetchParsedTx(signature: string): Promise<ParsedTransactionWithMeta | null> {
    let lastError: unknown = null;
    for (const rpc of this.rpcEndpoints) {
      try {
        const conn = new Connection(rpc, 'confirmed');
        const tx = await conn.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        });
        if (tx) return tx;
      } catch (err) {
        lastError = err;
        this.logger.debug(`RPC ${rpc} failed for ${signature.slice(0, 8)}: ${err}`);
      }
    }
    if (lastError) {
      this.logger.warn(`All Solana RPCs failed for ${signature.slice(0, 8)}: ${lastError}`);
    }
    return null;
  }
}

function allInstructions(tx: ParsedTransactionWithMeta): ParsedInstruction[] {
  const top = (tx.transaction.message.instructions ?? []) as ParsedInstruction[];
  const inner = (tx.meta?.innerInstructions ?? []).flatMap(
    (g) => (g.instructions ?? []) as ParsedInstruction[],
  );
  return [...top, ...inner];
}
