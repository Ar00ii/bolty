'use client';

import bs58 from 'bs58';

import { api } from '@/lib/api/client';

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
