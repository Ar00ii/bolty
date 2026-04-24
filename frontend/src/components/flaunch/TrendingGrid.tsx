'use client';

import { Flame, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo } from 'react';

import type { TokenInfo } from '@/lib/flaunch/types';

/**
 * OpenSea-style "tokens en tendencia" grid — 4 columns of compact
 * cards with icon + name + mcap + 24h change. Ranking blends volume
 * + change so it favors tokens with *momentum*, not just volume or
 * gainers alone.
 */

function formatUsd(n: number): string {
  if (!n || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
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

export function TrendingGrid({ tokens }: { tokens: TokenInfo[] }) {
  const trending = useMemo(() => {
    if (!tokens?.length) return [];
    // Momentum score: volume * (1 + |change|). A spike in volume AND
    // movement beats either alone, but any token with nonzero volume
    // still ranks above pure-gainers-with-no-volume.
    const withScore = tokens
      .map((t) => {
        const vol = Math.max(t.volume24hEth, 0);
        const chg = Math.abs(t.priceChange24hPercent) / 100;
        return { t, score: vol * (1 + chg) };
      })
      .filter((x) => x.score > 0 || x.t.holders > 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.t);
    // Fallback: if no activity anywhere yet, show newest launches so
    // the row never looks empty.
    if (withScore.length === 0) {
      return [...tokens]
        .sort(
          (a, b) =>
            new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime(),
        )
        .slice(0, 8);
    }
    return withScore;
  }, [tokens]);

  if (trending.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.18em] text-zinc-400 font-medium">
          <Flame className="w-3.5 h-3.5 text-[#fb7185]" strokeWidth={1.75} />
          Trending tokens
          <span className="text-[10px] text-zinc-600 font-mono normal-case tracking-normal">
            last 24h
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {trending.map((t) => (
          <TrendingCard key={t.tokenAddress} token={t} />
        ))}
      </div>
    </section>
  );
}

function TrendingCard({ token }: { token: TokenInfo }) {
  const up = token.priceChange24hPercent >= 0;
  const abs = Math.abs(token.priceChange24hPercent);
  return (
    <Link
      href={`/launchpad/${token.tokenAddress}`}
      className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition hover:brightness-110"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
        style={{
          background: 'rgba(131,110,249,0.08)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
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
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-white font-light truncate">
          {token.name}
        </div>
        <div className="mt-0.5 font-mono tabular-nums text-[11px] text-zinc-400 truncate inline-flex items-center gap-1.5">
          <span>{formatUsd(token.marketCapUsd)}</span>
          <span
            className="inline-flex items-center gap-0.5"
            style={{ color: up ? '#22c55e' : '#ef4444' }}
          >
            {up ? (
              <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.2} />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.2} />
            )}
            {up ? '+' : '-'}
            {abs.toFixed(1)}%
          </span>
        </div>
      </div>
    </Link>
  );
}
