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

function parseMetaMaskError(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: number }).code;
    if (code === 4001) return 'Connection rejected. You cancelled the request in MetaMask.';
    if (code === -32603) return 'MetaMask internal error. Make sure your wallet is unlocked.';
    if (code === 4100) return 'MetaMask is locked. Please unlock your wallet and try again.';
    if (err.message.includes('User rejected')) return 'Connection rejected. You cancelled the request in MetaMask.';
    if (err.message.includes('pending')) return 'MetaMask has a pending request. Open MetaMask and resolve it.';
    if (err.message.includes('Cannot connect')) return err.message;
    return err.message;
  }
  return 'Unknown MetaMask error.';
}

export async function connectMetaMask(): Promise<void> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed.');
  }

  const provider = new BrowserProvider(window.ethereum!);

  let accounts: string[];
  try {
    accounts = (await provider.send('eth_requestAccounts', [])) as string[];
  } catch (err) {
    throw new Error(parseMetaMaskError(err));
  }

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Create an account in MetaMask first.');
  }

  const address = accounts[0];

  let nonceData: { nonce: string; message: string };
  try {
    nonceData = await api.post<{ nonce: string; message: string }>(
      '/auth/nonce/ethereum',
      { address },
    );
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to get nonce from server.');
  }

  let signature: string;
  try {
    const signer = await provider.getSigner();
    signature = await signer.signMessage(nonceData.message);
  } catch (err) {
    throw new Error(parseMetaMaskError(err));
  }

  try {
    await api.post('/auth/verify/ethereum', {
      address,
      signature,
      nonce: nonceData.nonce,
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Signature verification failed.');
  }
}

export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
}
