'use client';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import React, { useMemo } from 'react';

import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Wraps the app with the Solana wallet adapter context. Phantom + Solflare
 * cover ~95% of the Solana userbase and ship the smallest bundle. Backpack
 * / Glow / others can be plugged in later via `wallets`.
 *
 * RPC defaults to mainnet-beta via clusterApiUrl; override at deploy time
 * with NEXT_PUBLIC_SOLANA_RPC for production traffic (the public endpoint
 * is fine for sign-in nonces but rate-limited for real workloads).
 */
export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl('mainnet-beta'),
    [],
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
