'use client';

/**
 * Legacy EVM shim. The platform is on Solana now — wallet connection
 * goes through `@solana/wallet-adapter-react`. Returning a permissive
 * interface (with `request`) so the dozen places that still gate UI
 * on the EVM provider compile; at runtime the provider is always null
 * so the code path falls through to the disabled state.
 */

export interface LegacyEthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export function getMetaMaskProvider(): LegacyEthereumProvider | null {
  return null;
}

export async function connectMetaMask(): Promise<never> {
  throw new Error(
    'MetaMask sign-in is no longer supported. Connect a Solana wallet (Phantom / Solflare) at /auth.',
  );
}
