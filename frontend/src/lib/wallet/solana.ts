'use client';

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  type Commitment,
} from '@solana/web3.js';
import bs58 from 'bs58';

import { api } from '@/lib/api/client';

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function solToLamports(sol: number): number {
  if (!isFinite(sol) || sol < 0) throw new Error('Invalid SOL amount');
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export function lamportsToSol(lamports: number | bigint): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

interface NonceResponse {
  nonce: string;
  message: string;
}

/**
 * Solana wallet sign-in. The connected wallet's `signMessage` produces an
 * ed25519 signature over the bolty-issued nonce; backend verifies the
 * signature against the public key, mints a JWT, sets HttpOnly cookies.
 */
export async function signInWithSolana(opts: {
  publicKeyBase58: string;
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
}): Promise<void> {
  const { nonce, message } = await api.post<NonceResponse>('/auth/nonce/solana', {
    address: opts.publicKeyBase58,
  });

  const sigBytes = await opts.signMessage(new TextEncoder().encode(message));
  const signature = bs58.encode(sigBytes);

  await api.post('/auth/verify/solana', {
    address: opts.publicKeyBase58,
    signature,
    nonce,
  });
}

/**
 * Link a Solana wallet to the currently authenticated user. Same handshake
 * as sign-in but hits the protected /auth/link/wallet endpoints.
 */
export async function linkSolanaWallet(opts: {
  publicKeyBase58: string;
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
  provider?: string;
  label?: string;
  additional?: boolean;
}): Promise<void> {
  const { nonce, message } = await api.post<NonceResponse>('/auth/link/wallet/nonce', {
    address: opts.publicKeyBase58,
  });

  const sigBytes = await opts.signMessage(new TextEncoder().encode(message));
  const signature = bs58.encode(sigBytes);

  const path = opts.additional ? '/auth/link/wallet/additional' : '/auth/link/wallet';
  await api.post(path, {
    address: opts.publicKeyBase58,
    signature,
    nonce,
    provider: opts.provider,
    label: opts.label,
  });
}

export function shortenSolanaAddress(addr: string | null | undefined): string {
  if (!addr) return '';
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/**
 * Send SOL from the connected wallet to `recipient`. Returns the
 * confirmed tx signature (base58). The caller is expected to have a
 * `Connection` from `useConnection()` and a `signTransaction` from
 * `useWallet()` — passed in so this helper stays framework-agnostic.
 *
 * Optional `feeRecipient` / `feeLamports` adds a second SystemProgram
 * transfer in the same tx (single user approval) for the protocol fee.
 */
export async function sendSolPayment(opts: {
  connection: Connection;
  payer: PublicKey;
  recipient: string;
  lamports: number;
  feeRecipient?: string | null;
  feeLamports?: number;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  commitment?: Commitment;
}): Promise<string> {
  const {
    connection,
    payer,
    recipient,
    lamports,
    feeRecipient,
    feeLamports = 0,
    signTransaction,
    commitment = 'confirmed',
  } = opts;

  if (!Number.isInteger(lamports) || lamports <= 0) {
    throw new Error('Invalid lamports amount');
  }

  const tx = new Transaction();
  tx.feePayer = payer;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(commitment);
  tx.recentBlockhash = blockhash;

  tx.add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(recipient),
      lamports,
    }),
  );

  if (feeRecipient && feeLamports > 0) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: new PublicKey(feeRecipient),
        lamports: feeLamports,
      }),
    );
  }

  const signed = await signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: commitment,
  });

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    commitment,
  );

  return signature;
}
