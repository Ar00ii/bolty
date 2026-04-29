'use client';

import { ChevronRight, TrendingDown, TrendingUp, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import type { TokenInfo } from '@/lib/flaunch/types';

import { TokenMiniSparkline } from './TokenMiniSparkline';

/**
 * Horizontal editorial strip — a title + icon + a scroll-snap row
 * of compact token cards. Used to pre-curate views ("Top gainers
 * 24h", "Top volume") above the generic flat grid so the launchpad
 * feels hand-picked instead of "sort-and-page".
 *
 * Cards here are deliberately smaller than the main grid card to
 * fit 5+ across even on medium viewports.
 */

interface Props {
  title: string;
  icon: React.ReactNode;
  accent: string;
  tokens: TokenInfo[];
  onOpen: (t: TokenInfo) => void;
}

export function CuratedRow({ title, icon, accent, tokens, onOpen }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function update() {
      if (!el) return;
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }
    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [tokens.length]);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  if (tokens.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2
          className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] font-medium"
          style={{ color: accent }}
        >
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{
              background: `${accent}14`,
              boxShadow: `inset 0 0 0 1px ${accent}38`,
            }}
          >
            {icon}
          </span>
          {title}
        </h2>
        <div className="flex items-center gap-1">
          <ScrollButton disabled={!canLeft} dir="left" onClick={() => scrollBy(-360)} />
          <ScrollButton dir="right" disabled={!canRight} onClick={() => scrollBy(360)} />
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto pb-1.5 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        {tokens.map((t, i) => (
          <MiniCard key={t.tokenAddress} token={t} rank={i + 1} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function ScrollButton({
  dir,
  onClick,
  disabled,
}: {
  dir: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'left' ? 'Scroll left' : 'Scroll right'}
      className="grid place-items-center w-6 h-6 rounded-md text-zinc-400 hover:text-white transition disabled:opacity-30"
      style={{
        background: 'rgba(255,255,255,0.03)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <ChevronRight
        className="w-3 h-3"
        strokeWidth={1.75}
        style={{ transform: dir === 'left' ? 'rotate(180deg)' : 'rotate(0)' }}
      />
    </button>
  );
}

function MiniCard({
  token,
  rank,
  onOpen,
}: {
  token: TokenInfo;
  rank: number;
  onOpen: (t: TokenInfo) => void;
}) {
  const up = token.priceChange24hPercent >= 0;
  const changeAbs = Math.abs(token.priceChange24hPercent);
  return (
    <button
      type="button"
      onClick={() => onOpen(token)}
      className="snap-start shrink-0 w-[240px] text-left rounded-xl p-2.5 transition hover:brightness-110"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-9 h-9 rounded-lg overflow-hidden shrink-0"
          style={{
            background: 'rgba(20,241,149,0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(20,241,149,0.25)',
          }}
        >
          {token.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={token.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-[9px] text-[#b4a7ff] font-mono">
              ${token.symbol}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-white font-light truncate">{token.name}</div>
          <div className="text-[10px] font-mono tabular-nums text-zinc-500 truncate">
            #{rank} · ${token.symbol}
          </div>
        </div>
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10.5px] font-mono tabular-nums shrink-0"
          style={{
            color: up ? '#22c55e' : '#ef4444',
            background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            boxShadow: up
              ? 'inset 0 0 0 1px rgba(34,197,94,0.3)'
              : 'inset 0 0 0 1px rgba(239,68,68,0.3)',
          }}
        >
          {up ? (
            <TrendingUp className="w-2.5 h-2.5" strokeWidth={2} />
          ) : (
            <TrendingDown className="w-2.5 h-2.5" strokeWidth={2} />
          )}
          {up ? '+' : '-'}
          {changeAbs.toFixed(1)}%
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[9.5px] uppercase tracking-[0.14em] text-zinc-500">Vol 24h</div>
          <div className="text-[11px] font-mono tabular-nums text-zinc-200 inline-flex items-center gap-1">
            {formatEth(token.volume24hEth)} ETH
            <span className="text-zinc-600">·</span>
            <Users className="w-2.5 h-2.5 text-zinc-500" strokeWidth={2} />
            {token.holders.toLocaleString()}
          </div>
        </div>
        <TokenMiniSparkline data={token.sparkline7d || []} width={72} height={20} />
      </div>
    </button>
  );
}

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}
