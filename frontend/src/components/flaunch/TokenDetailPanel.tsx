'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownUp,
  Copy,
  ExternalLink,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { buyLaunchpadToken, sellLaunchpadToken } from '@/lib/flaunch/launchpad';
import type { TokenInfo, TradeResult } from '@/lib/flaunch/types';

import { TokenPriceChart } from './TokenPriceChart';

type Mode = 'buy' | 'sell';

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

function shortAddr(a: string): string {
  if (!a || a.length < 14) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function TokenDetailPanel({
  token,
  onClose,
}: {
  token: TokenInfo | null;
  onClose: () => void;
}) {
  const open = !!token;

  // Lock body scroll while the panel is open
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && token && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          />
          <motion.aside
            key="panel"
            // Desktop slides from right, mobile from bottom
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 bottom-0 z-[61] w-full sm:max-w-[440px] overflow-y-auto"
            style={{
              background: '#0a0a0e',
              boxShadow: '-24px 0 60px -20px rgba(0,0,0,0.6)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <PanelBody token={token} onClose={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function PanelBody({ token, onClose }: { token: TokenInfo; onClose: () => void }) {
  const up = token.priceChange24hPercent >= 0;
  const changeAbs = Math.abs(token.priceChange24hPercent);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3"
        style={{
          background: 'rgba(10,10,14,0.85)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
            style={{
              background: 'rgba(20,241,149,0.08)',
              boxShadow: 'inset 0 0 0 1px rgba(20,241,149,0.25)',
            }}
          >
            {token.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={token.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-[10px] text-[#b4a7ff] font-mono">
                ${token.symbol}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] text-white font-light truncate">{token.name}</div>
            <CopyableAddr addr={token.tokenAddress} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid place-items-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white transition"
          style={{
            background: 'rgba(255,255,255,0.04)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </header>

      {/* Price block */}
      <section className="px-4 pt-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-zinc-500 font-medium">
              Price
            </div>
            <div className="text-[22px] font-mono tabular-nums text-white">
              {formatEth(token.priceEth)} <span className="text-[11px] text-zinc-500">ETH</span>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-mono tabular-nums"
            style={{
              color: up ? '#22c55e' : '#ef4444',
              background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              boxShadow: up
                ? 'inset 0 0 0 1px rgba(34,197,94,0.3)'
                : 'inset 0 0 0 1px rgba(239,68,68,0.3)',
            }}
          >
            {up ? (
              <TrendingUp className="w-3 h-3" strokeWidth={2} />
            ) : (
              <TrendingDown className="w-3 h-3" strokeWidth={2} />
            )}
            {up ? '+' : '-'}
            {changeAbs.toFixed(2)}% · 24h
          </span>
        </div>
      </section>

      {/* Chart */}
      <section className="px-4 mt-3">
        <TokenPriceChart data={token.sparkline7d || []} />
      </section>

      {/* Stats grid */}
      <section className="px-4 mt-3 grid grid-cols-3 gap-1.5">
        <Stat label="Mcap" value={`${formatEth(token.marketCapEth)} ETH`} />
        <Stat label="24h vol" value={`${formatEth(token.volume24hEth)} ETH`} />
        <Stat
          label="Holders"
          value={
            <span className="inline-flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-zinc-500" strokeWidth={2} />
              {token.holders.toLocaleString()}
            </span>
          }
        />
      </section>

      {/* Trade widget */}
      <section className="px-4 mt-4">
        <TradeBox token={token} />
      </section>

      {/* About */}
      <section className="px-4 mt-5">
        <h3 className="text-[10.5px] uppercase tracking-[0.14em] text-zinc-500 font-medium mb-1.5">
          About
        </h3>
        <div className="text-[12.5px] text-zinc-300 font-light leading-relaxed">
          ${token.symbol} — launched{' '}
          <span className="text-zinc-500">{timeAgo(token.launchedAt)}</span>
          {token.creatorUsername && (
            <>
              {' '}
              by{' '}
              <Link
                href={`/u/${token.creatorUsername}`}
                className="text-[#b4a7ff] hover:underline"
              >
                @{token.creatorUsername}
              </Link>
            </>
          )}
          .
        </div>
      </section>

      {/* External links */}
      <section className="px-4 mt-5 space-y-1.5">
        <LinkRow href={token.listingPath} label="Open source listing" external={false} />
        <LinkRow href={token.flaunchUrl} label="View on Flaunch" external />
        <LinkRow
          href={`https://basescan.org/address/${token.tokenAddress}`}
          label="View on Basescan"
          external
        />
      </section>

      <div className="flex-1" />
      <div className="h-6" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="rounded-lg px-2.5 py-2"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="text-[9.5px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="text-[12.5px] text-zinc-200 font-mono tabular-nums truncate">{value}</div>
    </div>
  );
}

function CopyableAddr({ addr }: { addr: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(addr).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1100);
          },
          () => {},
        );
      }}
      className="inline-flex items-center gap-1 text-[10.5px] font-mono text-zinc-500 hover:text-white transition"
    >
      <span className="truncate max-w-[200px]">{shortAddr(addr)}</span>
      <Copy className="w-2.5 h-2.5" strokeWidth={1.75} />
      {copied && <span className="text-[#86efac] text-[10px]">copied</span>}
    </button>
  );
}

function LinkRow({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external: boolean;
}) {
  const common = {
    className:
      'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12.5px] text-zinc-300 hover:text-white transition',
    style: {
      background: 'rgba(255,255,255,0.02)',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
    },
  };
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" {...common}>
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 text-zinc-500" strokeWidth={1.75} />
    </a>
  ) : (
    <Link href={href} {...common}>
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 text-zinc-500 rotate-180" strokeWidth={1.75} />
    </Link>
  );
}

function TradeBox({ token }: { token: TokenInfo }) {
  const [mode, setMode] = useState<Mode>('buy');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [last, setLast] = useState<TradeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const previewOut =
    mode === 'buy'
      ? (Number(amount) || 0) / (token.priceEth || 1e-9)
      : (Number(amount) || 0) * token.priceEth;

  async function submit() {
    if (!amount || Number(amount) <= 0) return;
    setStatus('pending');
    setErr(null);
    try {
      const result =
        mode === 'buy'
          ? await buyLaunchpadToken({
              tokenAddress: token.tokenAddress,
              ethAmount: amount,
              slippagePercent: 1,
            })
          : await sellLaunchpadToken({
              tokenAddress: token.tokenAddress,
              tokenAmount: amount,
              slippagePercent: 1,
            });
      setLast(result);
      setStatus('success');
      setAmount('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Trade failed');
      setStatus('error');
    }
  }

  return (
    <div
      className="rounded-xl p-3 space-y-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="flex items-center gap-1 p-0.5 rounded-lg"
        style={{
          background: 'rgba(0,0,0,0.4)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {(['buy', 'sell'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setAmount('');
              setStatus('idle');
            }}
            className="flex-1 px-2 py-1.5 rounded-md text-[12px] uppercase tracking-[0.12em] transition font-light"
            style={{
              color: mode === m ? '#ffffff' : '#a1a1aa',
              background: mode === m ? 'rgba(20,241,149,0.2)' : 'transparent',
              boxShadow: mode === m ? 'inset 0 0 0 1px rgba(20,241,149,0.35)' : 'none',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={mode === 'buy' ? 0.001 : 1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-[13px] font-mono text-white placeholder:text-zinc-600 focus:outline-none"
            style={{
              background: 'rgba(0,0,0,0.4)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            }}
            placeholder={mode === 'buy' ? '0.01' : '0'}
          />
          <span className="text-[11.5px] text-zinc-500 w-10 text-right shrink-0">
            {mode === 'buy' ? 'ETH' : token.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10.5px] text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <ArrowDownUp className="w-3 h-3" />≈{' '}
            {previewOut
              ? previewOut.toLocaleString(undefined, {
                  maximumFractionDigits: mode === 'buy' ? 0 : 6,
                })
              : '0'}{' '}
            {mode === 'buy' ? token.symbol : 'ETH'}
          </span>
          <span>Slippage 1%</span>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!amount || Number(amount) <= 0 || status === 'pending'}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[13px] font-light text-white transition disabled:opacity-40"
        style={{
          background:
            mode === 'buy'
              ? 'linear-gradient(180deg, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0.25) 100%)'
              : 'linear-gradient(180deg, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.25) 100%)',
          boxShadow:
            mode === 'buy'
              ? '0 0 0 1px rgba(34,197,94,0.42)'
              : '0 0 0 1px rgba(239,68,68,0.42)',
        }}
      >
        {status === 'pending' ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirming…
          </>
        ) : (
          <>{mode === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}</>
        )}
      </button>

      {status === 'success' && last && (
        <div className="text-[11px] text-[#86efac] font-light text-center">
          Got {last.received} {last.receivedSymbol}
        </div>
      )}
      {status === 'error' && err && (
        <div className="text-[11px] text-red-300 font-light text-center">{err}</div>
      )}
    </div>
  );
}
