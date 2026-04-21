'use client';

import React, { useCallback, useRef, useState } from 'react';

import { WalletPickerModal, PickableWallet } from '@/components/ui/WalletPickerModal';
import { api } from '@/lib/api/client';
import { getMetaMaskProvider } from '@/lib/wallet/ethereum';

type Resolver = { resolve: (addr: string) => void; reject: (err: Error) => void };

/**
 * Hook that picks the wallet to pay from.
 *
 * Behavior:
 *  - 0 or 1 linked wallets → returns the currently active MetaMask account
 *  - 2+ linked wallets     → shows a picker modal. When the user chooses an
 *    address that differs from MetaMask's active account, we prompt MetaMask
 *    to re-grant permissions so the user can switch. If the account still
 *    doesn't match, the promise rejects with a clear message.
 *
 * Usage:
 *   const { pickWallet, pickerElement } = useWalletPicker();
 *   // ... in JSX: {pickerElement}
 *   // ... in handler:
 *   const buyerAddress = await pickWallet();
 */
export function useWalletPicker() {
  const [pending, setPending] = useState<{
    wallets: PickableWallet[];
    active: string | null;
  } | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  const pickWallet = useCallback(async (): Promise<string> => {
    const eth = getMetaMaskProvider();
    if (!eth) throw new Error('MetaMask not found. Install it to continue.');

    const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
    const active = accounts?.[0] || '';
    if (!active) throw new Error('No account selected in MetaMask.');

    let wallets: PickableWallet[] = [];
    try {
      wallets = await api.get<PickableWallet[]>('/users/wallets');
    } catch {
      return active;
    }
    if (!Array.isArray(wallets) || wallets.length <= 1) return active;

    return new Promise<string>((resolve, reject) => {
      resolverRef.current = { resolve, reject };
      setPending({ wallets, active });
    });
  }, []);

  const finish = useCallback((addr: string | null, err?: Error) => {
    const r = resolverRef.current;
    resolverRef.current = null;
    setPending(null);
    if (!r) return;
    if (err) r.reject(err);
    else if (addr) r.resolve(addr);
    else r.reject(new Error('Wallet selection cancelled'));
  }, []);

  const handlePick = useCallback(
    async (addr: string) => {
      const eth = getMetaMaskProvider();
      if (!eth) {
        finish(null, new Error('MetaMask not found'));
        return;
      }
      let accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
      if ((accounts?.[0] || '').toLowerCase() === addr.toLowerCase()) {
        finish(addr);
        return;
      }
      // Active account mismatch — ask MetaMask to re-prompt so the user can switch.
      try {
        await eth.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
        accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
        if ((accounts?.[0] || '').toLowerCase() === addr.toLowerCase()) {
          finish(addr);
          return;
        }
        finish(
          null,
          new Error(
            `Active MetaMask account does not match the selected wallet (${addr.slice(0, 6)}…${addr.slice(-4)}). Switch account in MetaMask and try again.`,
          ),
        );
      } catch {
        finish(null, new Error('Could not switch MetaMask account.'));
      }
    },
    [finish],
  );

  const pickerElement = pending ? (
    <WalletPickerModal
      wallets={pending.wallets}
      selectedAddress={pending.active}
      onPick={handlePick}
      onCancel={() => finish(null)}
    />
  ) : null;

  return { pickWallet, pickerElement };
}
