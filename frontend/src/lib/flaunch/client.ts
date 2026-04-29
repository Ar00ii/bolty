'use client';

import { createFlaunch, type ReadFlaunchSDK, type ReadWriteFlaunchSDK } from '@flaunch/sdk';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { base } from 'viem/chains';

import { getMetaMaskProvider } from '@/lib/wallet/ethereum';

// The Flaunch SDK bundles its own copy of viem's type defs. This
// creates two structurally-identical PublicClient / WalletClient types
// that TS can't reconcile. We box everything as `unknown` inside this
// module and cast at the boundary — runtime shape is identical.
type AnyClient = unknown;

/**
 * Lightweight Flaunch SDK wiring. Atlas already uses ethers v6 + raw
 * window.ethereum for purchases — this module lives alongside that
 * stack and only spins up viem clients on demand for the /bolty swap
 * widget, so adding wagmi isn't required.
 */

const RPC_URLS = [
  process.env.NEXT_PUBLIC_BASE_RPC_URL,
  'https://mainnet.base.org',
  'https://base.publicnode.com',
  'https://base.llamarpc.com',
].filter((u): u is string => typeof u === 'string' && u.length > 0);

let cachedPublicClient: AnyClient = null;
let cachedReadSdk: ReadFlaunchSDK | null = null;

// Return type is `any` because the underlying viem type is ambient
// twice in the tree (SDK bundles its own copy). Callers use it for
// readContract/waitForTransactionReceipt — their types resolve fine
// at the call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPublicClient(): any {
  if (cachedPublicClient) return cachedPublicClient;
  cachedPublicClient = createPublicClient({
    chain: base,
    transport: http(RPC_URLS[0]),
  });
  return cachedPublicClient;
}

export function getReadSdk(): ReadFlaunchSDK {
  if (cachedReadSdk) return cachedReadSdk;
  // Cross-viem cast: the SDK's bundled viem types are structurally
  // identical but nominally distinct, so the compiler refuses a
  // direct assignment. The runtime shape matches exactly.
  cachedReadSdk = (createFlaunch as unknown as (
    p: { publicClient: AnyClient },
  ) => ReadFlaunchSDK)({ publicClient: getPublicClient() });
  return cachedReadSdk;
}

/**
 * Build a wallet client around the injected MetaMask provider. Throws
 * if the user hasn't connected MetaMask yet — callers should surface
 * a "Connect wallet" CTA in that case rather than calling this eagerly.
 */
export async function getWalletClient(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletClient: any;
  account: `0x${string}`;
}> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet requires a browser context');
  }
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error('MetaMask not detected. Install MetaMask to swap.');
  }

  // Make sure the user is on Base — Flaunch lives on chainId 8453.
  const current = (await provider.request({ method: 'eth_chainId' })) as string;
  if (current !== '0x2105') {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }],
      });
    } catch {
      throw new Error('Please switch your wallet to Base to swap.');
    }
  }

  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[];
  const account = accounts[0] as `0x${string}` | undefined;
  if (!account) throw new Error('No wallet account available');

  const walletClient = createWalletClient({
    chain: base,
    transport: custom(provider),
    account,
  });
  return { walletClient, account };
}

export async function getReadWriteSdk(): Promise<{
  sdk: ReadWriteFlaunchSDK;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletClient: any;
  account: `0x${string}`;
}> {
  const { walletClient, account } = await getWalletClient();
  const sdk = (createFlaunch as unknown as (
    p: { publicClient: AnyClient; walletClient: AnyClient },
  ) => ReadWriteFlaunchSDK)({
    publicClient: getPublicClient(),
    walletClient,
  });
  return { sdk, walletClient, account };
}
