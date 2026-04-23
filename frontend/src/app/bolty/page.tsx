'use client';

import { motion } from 'framer-motion';
import { Copy, ExternalLink, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { FlaunchLogo } from '@/components/token/FlaunchLogo';
import { GradientText } from '@/components/ui/GradientText';
import { api } from '@/lib/api/client';

// Chart (lightweight-charts ~100KB), swap card (@flaunch/sdk + viem
// ~150KB) and trades feed (axios polling) are all below the fold or
// click-gated. Dynamic import keeps them out of the first JS bundle
// so the hero + stats paint fast on cold navigations.
const BoltyCandleChart = dynamic(
  () =>
    import('@/components/token/BoltyCandleChart').then((m) => ({
      default: m.BoltyCandleChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-2xl bg-white/[0.03]" />
    ),
  },
);
const BoltySwapCard = dynamic(
  () =>
    import('@/components/token/BoltySwapCard').then((m) => ({
      default: m.BoltySwapCard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse rounded-2xl bg-white/[0.03]" />
    ),
  },
);
const BoltyTradesFeed = dynamic(
  () =>
    import('@/components/token/BoltyTradesFeed').then((m) => ({
      default: m.BoltyTradesFeed,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full animate-pulse rounded-2xl bg-white/[0.03]" />
    ),
  },
);

interface TokenStats {
  contract: string;
  chain: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  priceUsd: number | null;
  priceChange24h: number | null;
  priceChange1h: number | null;
  priceChange6h: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  marketCapUsd: number | null;
  pairAddress: string | null;
  pairUrl: string | null;
  dexId: string | null;
  flaunchUrl: string;
  ethPriceUsd: number | null;
  updatedAt: string;
}

const BOLTY_CONTRACT = '0xA383e85a626171edCB2727AEcAED4Fc5e27E42a7';
const STATS_REFRESH_MS = 4000;

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatUsd(value: number | null | undefined, digits = 2): string {
  if (value == null || !isFinite(value)) return '—';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value < 0.01 && value > 0) return `$${value.toPrecision(2)}`;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: 6,
  })}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export default function BoltyTokenPage() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.get<TokenStats>('/token/bolty');
        if (!cancelled) {
          setStats(data);
          setLoading(false);
          if (data.ethPriceUsd != null) {
            (window as unknown as { __BOLTY_ETH_USD?: number }).__BOLTY_ETH_USD =
              data.ethPriceUsd;
          }
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, STATS_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const copyContract = useCallback(() => {
    navigator.clipboard
      .writeText(BOLTY_CONTRACT)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => void 0);
  }, []);

  const priceChangeColor = useMemo(() => {
    const v = stats?.priceChange24h;
    if (v == null) return 'text-white/60';
    return v >= 0 ? 'text-emerald-400' : 'text-rose-400';
  }, [stats?.priceChange24h]);

  const flaunchUrl =
    stats?.flaunchUrl ?? `https://flaunch.gg/base/coin/${BOLTY_CONTRACT}`;

  const mcap = stats?.marketCapUsd ?? stats?.fdvUsd ?? null;

  return (
    <div className="mk-app-page relative min-h-[calc(100vh-4rem)] bg-[#07070A] text-white" style={{ maxWidth: 'none', padding: 0 }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(1100px 650px at 15% -10%, rgba(131,110,249,0.16), transparent 60%), radial-gradient(900px 560px at 95% 10%, rgba(6,182,212,0.10), transparent 60%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
        {/* ── Compact app-style header ─────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="relative flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(131,110,249,0.22), rgba(6,182,212,0.12))',
                boxShadow:
                  'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 30px -10px #836EF9',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/LogoNew.png"
                alt="Bolty"
                className="h-9 w-9 rounded-lg object-contain"
              />
            </div>
            <div>
              <h1 className="flex items-baseline gap-2 text-2xl font-light tracking-tight">
                <GradientText gradient="purple">$BOLTY</GradientText>
                <span className="text-sm text-white/30">/ Base</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={flaunchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-normal text-white transition"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.95) 0%, rgba(107,79,232,0.85) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.2), 0 10px 26px -10px rgba(131,110,249,0.65)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              <span className="text-white/80">Trade on</span>
              <FlaunchLogo size={28} />
              <span className="font-semibold tracking-tight">Flaunch</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70 transition group-hover:opacity-100" />
            </a>
          </div>
        </motion.header>

        {/* ── Info ribbon (market cap + deltas + contract) ─────────────── */}
        <section
          className="mt-4 flex flex-col gap-3 rounded-2xl px-5 py-4 md:flex-row md:items-center md:gap-6"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-baseline gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                Market cap
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <div className="text-2xl font-light tracking-tight sm:text-3xl">
                  {loading ? '…' : formatUsd(mcap, 0)}
                </div>
                <div
                  className={`inline-flex items-center gap-1 text-xs font-normal ${priceChangeColor}`}
                >
                  {stats?.priceChange24h != null && stats.priceChange24h >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : stats?.priceChange24h != null ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : null}
                  {formatPct(stats?.priceChange24h)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <RibbonStat label="Price" value={stats?.priceUsd != null ? formatUsd(stats.priceUsd, 6) : '—'} />
            <RibbonStat label="24h vol" value={formatUsd(stats?.volume24hUsd, 0)} />
            <RibbonStat label="Liquidity" value={formatUsd(stats?.liquidityUsd, 0)} />
            <RibbonStat label="FDV" value={formatUsd(stats?.fdvUsd, 0)} />
            <PriceDelta label="1h" value={stats?.priceChange1h ?? null} />
            <PriceDelta label="6h" value={stats?.priceChange6h ?? null} />
          </div>

          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <code className="rounded-lg bg-white/5 px-2 py-1 font-mono text-[11px] text-white/75">
              {shortAddr(BOLTY_CONTRACT)}
            </code>
            <button
              onClick={copyContract}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <Copy className="h-3 w-3" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a
              href={`https://basescan.org/token/${BOLTY_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-white/55 transition hover:text-white"
            >
              BaseScan <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>

        {/* ── Chart + Swap ─────────────────────────────────────────────── */}
        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              height: 520,
            }}
          >
            <BoltyCandleChart />
          </div>

          <div className="flex flex-col gap-3">
            <BoltySwapCard priceUsd={stats?.priceUsd ?? null} />
          </div>
        </section>

        {/* ── Live trades ──────────────────────────────────────────────── */}
        <section className="mt-4">
          <BoltyTradesFeed />
        </section>

      </div>
    </div>
  );
}

function RibbonStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </span>
      <span className="text-sm font-normal tabular-nums text-white/90">
        {value}
      </span>
    </div>
  );
}

function PriceDelta({ label, value }: { label: string; value: number | null }) {
  const tone =
    value == null
      ? { color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.05)' }
      : value >= 0
        ? { color: '#4ADE80', bg: 'rgba(16,185,129,0.12)' }
        : { color: '#FB7185', bg: 'rgba(244,63,94,0.12)' };
  return (
    <div
      className="rounded-md px-2 py-[3px] text-[10px] font-light"
      style={{ background: tone.bg }}
    >
      <span className="mr-1 uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
      <span className="font-normal tabular-nums" style={{ color: tone.color }}>
        {formatPct(value)}
      </span>
    </div>
  );
}
