'use client';

import { BrowserProvider } from 'ethers';
import { api } from '@/lib/api/client';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export async function connectMetaMask(): Promise<void> {
  if (!window.ethereum?.isMetaMask) {
    throw new Error('MetaMask not detected. Please install MetaMask.');
  }

  const provider = new BrowserProvider(window.ethereum);

  // Request account access
  const accounts = await provider.send('eth_requestAccounts', []);
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }

  const address = accounts[0] as string;

  // Get nonce from backend
  const { nonce, message } = await api.post<{ nonce: string; message: string }>(
    '/auth/nonce/ethereum',
    { address },
  );

  // Sign message (never sign transaction data directly)
  const signer = await provider.getSigner();
  const signature = await signer.signMessage(message);

  // Verify on backend — backend sets HttpOnly cookies
  await api.post('/auth/verify/ethereum', { address, signature, nonce });
}

export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
}
