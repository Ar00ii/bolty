'use client';

import { api } from '@/lib/api/client';

declare global {
  interface Window {
    solana?: {
      connect: () => Promise<{ publicKey: { toString: () => string; toBytes: () => Uint8Array } }>;
      disconnect: () => Promise<void>;
      signMessage: (msg: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
      isPhantom?: boolean;
      publicKey?: { toString: () => string };
    };
  }
}

// Convert Uint8Array to base58
function toBase58(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(0);
  for (const byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }
  let encoded = '';
  while (num > 0n) {
    encoded = ALPHABET[Number(num % 62n)] + encoded;
    num = num / 62n;
  }
  for (const byte of bytes) {
    if (byte === 0) encoded = '1' + encoded;
    else break;
  }
  return encoded;
}

export async function connectPhantom(): Promise<void> {
  if (!window.solana?.isPhantom) {
    throw new Error('Phantom wallet not detected. Please install Phantom.');
  }

  const resp = await window.solana.connect();
  const address = resp.publicKey.toString();

  // Get nonce from backend
  const { nonce, message } = await api.post<{ nonce: string; message: string }>(
    '/auth/nonce/solana',
    { address },
  );

  // Sign message bytes
  const encoded = new TextEncoder().encode(message);
  const { signature } = await window.solana.signMessage(encoded, 'utf8');

  // Convert signature to base58
  const signatureBase58 = toBase58(signature);

  // Verify on backend
  await api.post('/auth/verify/solana', { address, signature: signatureBase58, nonce });
}

export function isPhantomInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.solana?.isPhantom;
}
