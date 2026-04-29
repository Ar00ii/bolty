'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';

import { sendSolPayment } from '@/lib/wallet/solana';

interface PayOpts {
  recipient: string;
  /** Amount the seller receives, in lamports (integer). */
  lamports: number;
  /** Optional protocol-fee recipient. Wallet base58. */
  feeRecipient?: string | null;
  /** Optional protocol-fee amount in lamports. */
  feeLamports?: number;
}

/**
 * Drop-in hook for any "Buy" / "Boost" / "Tip" button on the platform.
 * Returns a `pay` callback that asks the connected Solana wallet to
 * sign + send a SystemProgram.transfer (plus an optional protocol-fee
 * transfer in the same tx so it's a single approval). Resolves with
 * the confirmed tx signature; throws on user-rejection or chain
 * failure with a human-readable message.
 */
export function useSolanaPayment() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();

  const pay = useCallback(
    async (opts: PayOpts): Promise<string> => {
      if (!connected || !publicKey) {
        throw new Error('Connect a Solana wallet first.');
      }
      if (!signTransaction) {
        throw new Error('Wallet does not support signing transactions.');
      }
      return sendSolPayment({
        connection,
        payer: publicKey,
        recipient: opts.recipient,
        lamports: opts.lamports,
        feeRecipient: opts.feeRecipient ?? null,
        feeLamports: opts.feeLamports ?? 0,
        signTransaction,
      });
    },
    [connected, publicKey, signTransaction, connection],
  );

  return { pay, ready: connected && !!publicKey };
}
