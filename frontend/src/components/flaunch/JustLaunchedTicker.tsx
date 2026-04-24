'use client';

import { Rocket, Sparkles } from 'lucide-react';
import React from 'react';

import type { TokenInfo } from '@/lib/flaunch/types';

/**
 * Thin strip at the top of /launchpad showing tokens launched in
 * the last hour. Auto-marquee when there's 4+ items so the strip
 * feels alive even when the grid below hasn't changed. Clicks open
 * the detail panel via the parent's onOpen callback.
 */

const RECENT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

function minutesAgo(iso: string): string {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m === 0) return 'now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function JustLaunchedTicker({
  tokens,
  onOpen,
}: {
  tokens: TokenInfo[];
  onOpen: (t: TokenInfo) => void;
}) {
  const now = Date.now();
  const recent = tokens.filter(
    (t) => now - new Date(t.launchedAt).getTime() < RECENT_WINDOW_MS,
  );
  if (recent.length === 0) return null;

  const shouldMarquee = recent.length >= 4;
  const loop = shouldMarquee ? [...recent, ...recent] : recent;

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        background:
          'linear-gradient(90deg, rgba(34,197,94,0.04), rgba(131,110,249,0.04))',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {/* Left sticky label */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 text-[10.5px] uppercase tracking-[0.16em] text-[#86efac] font-medium whitespace-nowrap absolute left-0 top-0 bottom-0 z-10 pr-4"
        style={{
          background: 'linear-gradient(90deg, rgba(10,10,14,0.96) 72%, transparent)',
        }}
      >
        <span className="relative inline-flex items-center justify-center w-2 h-2">
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: '#22c55e' }}
          />
          <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
        </span>
        Just launched
      </div>

      <div
        className="flex items-center gap-7 whitespace-nowrap py-2 pl-[140px] pr-4"
        style={
          shouldMarquee
            ? {
                animation: `mk-ticker-scroll ${Math.max(20, loop.length * 5)}s linear infinite`,
                willChange: 'transform',
              }
            : undefined
        }
      >
        {loop.map((t, i) => (
          <button
            key={`${t.tokenAddress}-${i}`}
            type="button"
            onClick={() => onOpen(t)}
            className="inline-flex items-center gap-2 text-[12px] font-light text-zinc-300 hover:text-white transition"
          >
            <Rocket className="w-3 h-3 text-[#b4a7ff]" strokeWidth={1.75} />
            <span className="text-white">{t.name}</span>
            <span className="text-zinc-500 font-mono">${t.symbol}</span>
            <span className="text-zinc-700">·</span>
            <span className="font-mono tabular-nums text-zinc-400">
              {formatEth(t.priceEth)} ETH
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-500 inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
              {minutesAgo(t.launchedAt)}
            </span>
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes mk-ticker-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
