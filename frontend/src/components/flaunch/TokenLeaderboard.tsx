'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import type { TokenInfo } from '@/lib/flaunch/types';

/**
 * Sticky right-column leaderboard — OpenSea-style. Header has a
 * timeframe switcher (1d / 7d / 30d) plus a Tokens label. List of
 * top 10 ranked by market cap. Each row is clickable and routes to
 * the detail page.
 */

type Timeframe = '1d' | '7d' | '30d';

function formatUsd(n: number): string {
  if (!n || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.0001) return `$${n.toPrecision(3)}`;
  const expOf10 = Math.floor(Math.log10(n));
  const leadingZeros = -expOf10 - 1;
  if (leadingZeros < 4) return `$${n.toFixed(8)}`;
  const sig =
    (n * Math.pow(10, -expOf10))
      .toPrecision(2)
      .replace('.', '')
      .replace(/0+$/, '') || '1';
  const subChars = '₀₁₂₃₄₅₆₇₈₉';
  const sub = String(leadingZeros)
    .split('')
    .map((d) => subChars[Number(d)])
    .join('');
  return `$0.0${sub}${sig}`;
}

export function TokenLeaderboard({ tokens }: { tokens: TokenInfo[] }) {
  const [tf, setTf] = useState<Timeframe>('1d');

  const top = useMemo(() => {
    if (!tokens?.length) return [];
    return [...tokens]
      .sort((a, b) => {
        if (b.marketCapUsd !== a.marketCapUsd) return b.marketCapUsd - a.marketCapUsd;
        return b.holders - a.holders;
      })
      .slice(0, 10);
  }, [tokens]);

  return (
    <div
      className="h-full overflow-hidden rounded-xl flex flex-col"
      style={{
        background: '#050507',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Header — bigger title + timeframe tabs. */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[13px] text-white font-medium tracking-tight">
            Top tokens
          </span>
        </div>
        <div
          className="inline-flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {(['1d', '7d', '30d'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTf(t)}
              className="px-2.5 py-1 text-[11px] rounded-md font-mono transition"
              style={{
                color: tf === t ? '#ffffff' : '#a1a1aa',
                background: tf === t ? 'rgba(131,110,249,0.22)' : 'transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Columns header */}
      <div
        className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,auto)] items-center gap-3 px-4 py-2 text-[10.5px] uppercase tracking-[0.16em] text-zinc-500 font-medium"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span>#</span>
        <span>Token</span>
        <span className="text-right">Mcap</span>
      </div>

      {/* Rows */}
      {top.length === 0 ? (
        <div className="px-4 py-12 text-center text-[12.5px] text-zinc-500 font-light">
          No tokens launched yet.
        </div>
      ) : (
        <ul className="flex-1">
          {top.map((t, i) => (
            <li key={t.tokenAddress}>
              <LeaderboardRow token={t} rank={i + 1} timeframe={tf} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeaderboardRow({
  token,
  rank,
  timeframe,
}: {
  token: TokenInfo;
  rank: number;
  timeframe: Timeframe;
}) {
  const up = token.priceChange24hPercent >= 0;
  const abs = Math.abs(token.priceChange24hPercent);
  // We only have 24h change from the SDK; 7d / 30d fall back to it
  // until we wire a longer-range data source.
  const changeLabel =
    timeframe === '1d' ? `${up ? '+' : '-'}${abs.toFixed(1)} %` : '—';
  const isTop = rank === 1;

  return (
    <Link
      href={`/launchpad/${token.tokenAddress}`}
      className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,auto)] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: isTop ? 'rgba(251,191,36,0.04)' : 'transparent',
      }}
    >
      <span
        className="text-[12px] font-mono tabular-nums"
        style={{ color: isTop ? '#fbbf24' : '#71717a' }}
      >
        {rank}
      </span>
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-full overflow-hidden shrink-0"
          style={{
            background: 'rgba(131,110,249,0.1)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
          }}
        >
          {token.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={token.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-[10px] text-[#b4a7ff] font-mono">
              ${token.symbol.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] text-white font-medium tracking-tight truncate">
            {token.name}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 truncate">
            ${token.symbol}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13px] text-white font-mono tabular-nums">
          {formatUsd(token.marketCapUsd)}
        </div>
        <div
          className="mt-0.5 inline-flex items-center gap-0.5 text-[10.5px] font-mono tabular-nums"
          style={{
            color:
              timeframe !== '1d' ? '#71717a' : up ? '#22c55e' : '#ef4444',
          }}
        >
          {timeframe === '1d' &&
            (up ? (
              <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.5} />
            ))}
          {changeLabel}
        </div>
      </div>
    </Link>
  );
}
