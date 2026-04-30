'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, AlertTriangle, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
  feeUsdForBase,
  grossUsdForBase,
  platformLamportsForSeller,
  grossLamportsForSeller,
} from '@/lib/payments/fees';
import { useSolanaPayment } from '@/lib/hooks/useSolanaPayment';
import { lamportsToSol, shortenSolanaAddress } from '@/lib/wallet/solana';

interface PaymentConsentModalProps {
  listingTitle: string;
  /** Seller's Solana wallet (base58). */
  sellerAddress: string;
  /** USD amount the seller takes home. Used for headline display. */
  baseUsd: number;
  /** Lamports the seller will receive. = priceSol × 1e9 (caller computes). */
  sellerLamports: bigint;
  /** Buyer's connected wallet (base58) — display only. */
  buyerAddress: string;
  /** Optional fee recipient (base58). When unset, no fee is collected. */
  feeRecipient?: string | null;
  /**
   * Called with the confirmed Solana tx signature once the buyer has
   * approved + the chain has confirmed. The caller then POSTs the
   * signature to the backend purchase endpoint.
   */
  onPaid: (txSignature: string, sellerLamports: bigint, totalLamports: bigint) => void;
  onCancel: () => void;
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 100) return n.toFixed(2);
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(3);
}

function fmtSol(lamports: bigint): string {
  return lamportsToSol(Number(lamports)).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

export function PaymentConsentModal({
  listingTitle,
  sellerAddress,
  baseUsd,
  sellerLamports,
  buyerAddress,
  feeRecipient = null,
  onPaid,
  onCancel,
}: PaymentConsentModalProps) {
  const [paying, setPaying] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const { pay, ready } = useSolanaPayment();

  // 5% protocol fee on top of the seller's net price (only collected if a
  // fee recipient is configured at deploy time — otherwise the buyer just
  // pays the seller's net price).
  const feeLamports = feeRecipient ? platformLamportsForSeller(sellerLamports) : 0n;
  const totalLamports = feeRecipient
    ? grossLamportsForSeller(sellerLamports)
    : sellerLamports;

  const grossUsd = feeRecipient ? grossUsdForBase(baseUsd) : baseUsd;
  const platformFeeUsd = feeRecipient ? feeUsdForBase(baseUsd) : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !paying) onCancel();
    };
    window.addEventListener('keydown', handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = previous;
    };
  }, [onCancel, paying]);

  const handlePay = async () => {
    if (!checked) {
      setError('You must accept the terms first');
      return;
    }
    if (!ready) {
      setError('Connect a Solana wallet first.');
      return;
    }
    setPaying(true);
    setError('');

    try {
      const sig = await pay({
        recipient: sellerAddress,
        lamports: Number(sellerLamports),
        feeRecipient: feeRecipient || null,
        feeLamports: Number(feeLamports),
      });
      onPaid(sig, sellerLamports, totalLamports);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('rejected') || msg.includes('User rejected')) {
        setError('Payment cancelled.');
      } else {
        setError(msg.slice(0, 160));
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: '#06060f',
            border: '1px solid rgba(20, 241, 149,0.3)',
            boxShadow: '0 0 80px rgba(20, 241, 149,0.08)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(20, 241, 149,0.55) 50%, transparent 100%)',
            }}
          />
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-bolty-400" />
              <span className="font-semibold text-white text-sm">Confirm payment</span>
              <span className="text-[10px] font-mono text-cyan-300/80 border border-cyan-400/25 px-1.5 py-0.5 rounded">
                SOLANA
              </span>
            </div>
            <motion.button
              onClick={onCancel}
              whileTap={{ scale: 0.88 }}
              whileHover={{ rotate: 90 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          <div
            className="mx-5 mt-5 flex gap-3 p-3.5 rounded-xl"
            style={{
              background: 'rgba(234,179,8,0.06)',
              border: '1px solid rgba(234,179,8,0.2)',
            }}
          >
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-300/80 leading-relaxed">
              <strong>Direct on-chain payment.</strong> Solana transactions are final and
              irreversible once confirmed. The platform does not hold or escrow funds.
            </p>
          </div>

          <div
            className="mx-5 mt-4 p-4 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
              Transaction breakdown
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Listing (to seller)</span>
                <span className="text-white font-mono">
                  {fmtSol(sellerLamports)} SOL
                  <span className="text-zinc-500 text-xs ml-1.5">${fmtUsd(baseUsd)}</span>
                </span>
              </div>
              {feeRecipient && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">
                    Platform fee <span className="text-zinc-600 font-mono text-xs">(5%)</span>
                  </span>
                  <span className="text-white font-mono">
                    + {fmtSol(feeLamports)} SOL
                    <span className="text-zinc-500 text-xs ml-1.5">${fmtUsd(platformFeeUsd)}</span>
                  </span>
                </div>
              )}
              <div
                className="flex justify-between pt-2 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-zinc-200 font-semibold">You pay (1 transaction)</span>
                <span className="text-bolty-300 font-mono font-semibold">
                  {fmtSol(totalLamports)} SOL
                  <span className="text-zinc-500 text-xs ml-1.5">${fmtUsd(grossUsd)}</span>
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex flex-col gap-1 text-[10.5px] font-mono text-zinc-500" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between">
                <span>Listing</span>
                <span className="text-zinc-300 truncate max-w-[60%] text-right">{listingTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Seller</span>
                <span className="text-zinc-300">{shortenSolanaAddress(sellerAddress)}</span>
              </div>
              <div className="flex justify-between">
                <span>Buyer</span>
                <span className="text-zinc-300">{shortenSolanaAddress(buyerAddress)}</span>
              </div>
            </div>
          </div>

          <div className="mx-5 mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="consent-check"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 cursor-pointer accent-bolty-500 flex-shrink-0"
            />
            <label
              htmlFor="consent-check"
              className="text-xs text-zinc-400 cursor-pointer leading-relaxed"
            >
              I understand Solana transactions are final and irreversible. I have verified the
              seller and listing, and accept full responsibility for this payment.
            </label>
          </div>

          {error && <p className="mx-5 mt-3 text-xs text-red-400 font-mono">{error}</p>}

          <div className="px-5 py-5 mt-1 flex gap-3">
            <motion.button
              onClick={onCancel}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className="flex-1 py-2.5 text-sm text-zinc-400 rounded-xl border border-zinc-800 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handlePay}
              disabled={!checked || paying || !ready}
              whileHover={!checked || paying || !ready ? undefined : { y: -1 }}
              whileTap={!checked || paying || !ready ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
              style={{
                background: 'rgba(20, 241, 149,0.18)',
                border: '1px solid rgba(20, 241, 149,0.45)',
              }}
            >
              {paying ? 'Confirming…' : `Pay ${fmtSol(totalLamports)} SOL`}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
