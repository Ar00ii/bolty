/**
 * Legacy EVM connect helper. Solana auth lives in `solana.ts` and the
 * `useWallet()` hook from `@solana/wallet-adapter-react`.
 */

export interface ConnectedAccount {
  address: string;
  chainId: number;
}

export async function connectWallet(): Promise<never> {
  throw new Error('EVM sign-in is no longer supported. Connect a Solana wallet at /auth.');
}

export async function switchToBase(): Promise<boolean> {
  return false;
}

export async function sendTransaction(): Promise<never> {
  throw new Error('EVM transactions are migrating to Solana. Coming back online soon.');
}
