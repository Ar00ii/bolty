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
}

function formatPrice(n: number | null): string {
  if (n == null || !isFinite(n)) return '—';
  if (n < 0.0001) return `$${n.toPrecision(2)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
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
    const t = setInterval(load, 45_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const price = stats?.priceUsd ?? null;
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
      <span className="tabular-nums" style={{ color: '#ffffff' }}>
        {formatPrice(price)}
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
