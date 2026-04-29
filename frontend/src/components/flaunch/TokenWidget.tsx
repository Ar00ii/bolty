'use client';

import { ArrowDownUp, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { buyLaunchpadToken, sellLaunchpadToken } from '@/lib/flaunch/launchpad';
import type { TokenInfo, TradeResult } from '@/lib/flaunch/types';

type Mode = 'buy' | 'sell';

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

export function TokenWidget({ token }: { token: TokenInfo }) {
  const [mode, setMode] = useState<Mode>('buy');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [last, setLast] = useState<TradeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // naive preview based on fake price
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
      className="rounded-xl p-4 space-y-3"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
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
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-white font-light truncate">
            {token.name} <span className="text-zinc-500">· ${token.symbol}</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono tabular-nums">
            {formatEth(token.priceEth)} ETH · mcap {formatEth(token.marketCapEth)} ETH
          </div>
        </div>
        <Link
          href={token.flaunchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10.5px] text-zinc-400 hover:text-white transition px-2 py-1 rounded-md"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          Flaunch <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 text-[11px] font-light">
        <Stat label="24h vol" value={`${formatEth(token.volume24hEth)} ETH`} />
        <Stat label="Holders" value={token.holders.toLocaleString()} />
        <Stat label="Launched" value={timeAgo(token.launchedAt)} />
      </div>

      {/* Mode switch */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.4)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
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
            className="flex-1 px-2 py-1.5 rounded-md text-[11.5px] uppercase tracking-[0.12em] transition"
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

      {/* Input */}
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
              background: 'rgba(255,255,255,0.04)',
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
            <ArrowDownUp className="w-3 h-3" />
            ≈ {previewOut ? previewOut.toLocaleString(undefined, { maximumFractionDigits: mode === 'buy' ? 0 : 6 }) : '0'}{' '}
            {mode === 'buy' ? token.symbol : 'ETH'}
          </span>
          <span>Slippage 1%</span>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!amount || Number(amount) <= 0 || status === 'pending'}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-light text-white transition disabled:opacity-40"
        style={{
          background:
            mode === 'buy'
              ? 'linear-gradient(180deg, rgba(34,197,94,0.45) 0%, rgba(34,197,94,0.2) 100%)'
              : 'linear-gradient(180deg, rgba(239,68,68,0.45) 0%, rgba(239,68,68,0.2) 100%)',
          boxShadow:
            mode === 'buy'
              ? '0 0 0 1px rgba(34,197,94,0.4)'
              : '0 0 0 1px rgba(239,68,68,0.4)',
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="text-[9.5px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="text-zinc-200 font-mono tabular-nums">{value}</div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
