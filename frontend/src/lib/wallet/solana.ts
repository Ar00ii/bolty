'use client';

import { api } from '@/lib/api/client';

declare global {
  interface Window {
    solana?: {
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string; toBytes: () => Uint8Array } }>;
      disconnect: () => Promise<void>;
      signMessage: (msg: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
      isPhantom?: boolean;
      publicKey?: { toString: () => string };
    };
  }
}

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

function parsePhantomError(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: number }).code;
    if (code === 4001) return 'Connection rejected. You cancelled the request in Phantom.';
    if (err.message.includes('User rejected')) return 'Connection rejected. You cancelled the request in Phantom.';
    if (err.message.includes('Cannot connect')) return err.message;
    return err.message;
  }
  return 'Unknown Phantom error.';
}

export async function connectPhantom(): Promise<void> {
  if (!isPhantomInstalled()) {
    throw new Error('Phantom is not installed.');
  }

  let resp: { publicKey: { toString: () => string; toBytes: () => Uint8Array } };
  try {
    resp = await window.solana!.connect();
  } catch (err) {
    throw new Error(parsePhantomError(err));
  }

  const address = resp.publicKey.toString();
  if (!address) {
    throw new Error('No Solana account found. Create an account in Phantom first.');
  }

  let nonceData: { nonce: string; message: string };
  try {
    nonceData = await api.post<{ nonce: string; message: string }>(
      '/auth/nonce/solana',
      { address },
    );
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to get nonce from server.');
  }

  const encoded = new TextEncoder().encode(nonceData.message);
  let signature: Uint8Array;
  try {
    const result = await window.solana!.signMessage(encoded, 'utf8');
    signature = result.signature;
  } catch (err) {
    throw new Error(parsePhantomError(err));
  }

  const signatureBase58 = toBase58(signature);

  try {
    await api.post('/auth/verify/solana', {
      address,
      signature: signatureBase58,
      nonce: nonceData.nonce,
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Signature verification failed.');
  }
}

export function isPhantomInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.solana?.isPhantom;
}
