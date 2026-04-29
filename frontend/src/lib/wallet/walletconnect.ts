/**
 * Legacy WalletConnect (EVM) shim. Solana wallets ship via the
 * `@solana/wallet-adapter-*` providers — see `SolanaWalletProvider`.
 */

export function isWalletConnectConfigured(): boolean {
  return false;
}

export async function getWalletConnectProvider(): Promise<never> {
  throw new Error('WalletConnect is no longer used. Connect a Solana wallet at /auth.');
}

export interface WalletConnectLinkOptions {
  forceLogin?: boolean;
  additional?: boolean;
}

export async function linkWalletConnect(_opts?: WalletConnectLinkOptions): Promise<never> {
  throw new Error('WalletConnect is no longer used. Connect a Solana wallet at /auth.');
}

export async function disconnectWalletConnect(): Promise<void> {
  /* no-op */
}
