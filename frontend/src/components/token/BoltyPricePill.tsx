'use client';

import { TrendingDown, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

/**
 * Compact live $BOLTY price pill for the top nav. Pulls its own data
 * so each mount decides independently when to refresh. Hidden on narrow
 * viewports to keep the mobile navbar clean.
 */

interface TokenStats {
  priceUsd: number | null;
  priceChange24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
}

/**
 * Compact USD formatter — the navbar has no room for full numbers, so
 * anything over $1K gets suffixed (K/M/B). Sub-dollar values fall back
 * to 2–4 decimals.
 */
function formatMcap(n: number | null): string {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  if (n < 0.0001) return `$${n.toPrecision(2)}`;
  return `$${n.toFixed(4)}`;
}

export function BoltyPricePill({ compact = false }: { compact?: boolean }) {
  const [stats, setStats] = useState<TokenStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.get<TokenStats>('/token/bolty');
        if (!cancelled) setStats(data);
      } catch {
        /* silent — pill just stays dashed */
      }
    };
    load();
    // 15s so the market cap feels alive — backend caches DexScreener
    // for 60s so this is cheap.
    const t = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const mcap = stats?.marketCapUsd ?? stats?.fdvUsd ?? null;
  const change = stats?.priceChange24h ?? null;
  const positive = change != null && change >= 0;
  const accent = change == null ? '#a1a1aa' : positive ? '#4ADE80' : '#FB7185';

  return (
    <Link
      href="/bolty"
      className="group hidden items-center gap-2 rounded-lg transition-colors md:inline-flex"
      style={{
        padding: compact ? '5px 9px' : '6px 10px',
        background: 'rgba(131,110,249,0.08)',
        border: '1px solid rgba(131,110,249,0.22)',
        color: '#e4e4e7',
        fontSize: compact ? '11.5px' : '12px',
      }}
      title="Open $BOLTY token page"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(131,110,249,0.14)';
        e.currentTarget.style.borderColor = 'rgba(131,110,249,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(131,110,249,0.08)';
        e.currentTarget.style.borderColor = 'rgba(131,110,249,0.22)';
      }}
    >
      <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: '#C9BEFF' }} strokeWidth={2} />
      <span className="font-medium tracking-tight" style={{ color: '#C9BEFF' }}>
        $BOLTY
      </span>
      <span className="text-[9.5px] uppercase tracking-[0.18em] text-white/40">MC</span>
      <span className="tabular-nums" style={{ color: '#ffffff' }}>
        {formatMcap(mcap)}
      </span>
      {change != null && (
        <span
          className="inline-flex items-center gap-0.5 tabular-nums"
          style={{ color: accent }}
        >
          {positive ? (
            <TrendingUp className="h-3 w-3" strokeWidth={2} />
          ) : (
            <TrendingDown className="h-3 w-3" strokeWidth={2} />
          )}
          {change.toFixed(1)}%
        </span>
      )}
    </Link>
  );
}

export default BoltyPricePill;
