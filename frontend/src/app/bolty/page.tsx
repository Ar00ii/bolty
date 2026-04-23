'use client';

import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Copy,
  Droplets,
  ExternalLink,
  Rocket,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BoltySwapCard } from '@/components/token/BoltySwapCard';
import { BoltyTradesFeed } from '@/components/token/BoltyTradesFeed';
import { GradientText } from '@/components/ui/GradientText';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { api } from '@/lib/api/client';

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
// Short enough to feel live without hammering the upstream API — the
// backend caches DexScreener for 60s so hitting this from every tab
// every few seconds is cheap.
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
          // Cache ETH/USD on window so the swap widget can price ETH
          // without duplicating the fetch.
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
  // GeckoTerminal renders reliably in an iframe and auto-refreshes —
  // swaps out the DexScreener iframe that was showing the broken-image
  // placeholder for this token.
  const chartSrc = stats?.pairAddress
    ? `https://www.geckoterminal.com/base/pools/${stats.pairAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0&chart_type=price&resolution=1m&trades=1`
    : null;

  const mcap = stats?.marketCapUsd ?? stats?.fdvUsd ?? null;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(1100px 650px at 20% -10%, rgba(131,110,249,0.18), transparent 60%), radial-gradient(900px 560px at 90% 10%, rgba(6,182,212,0.10), transparent 60%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{
            background:
              'linear-gradient(180deg, rgba(24,22,40,0.7) 0%, rgba(10,10,14,0.7) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 60px -30px rgba(131,110,249,0.55)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2"
            style={{ borderColor: 'rgba(131,110,249,0.4)' }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2"
            style={{ borderColor: 'rgba(131,110,249,0.4)' }}
          />

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(131,110,249,0.18), rgba(6,182,212,0.12))',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 40px -10px #836EF9',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/LogoNew.png"
                  alt="Bolty"
                  className="h-12 w-12 rounded-xl object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/50">
                  <Zap className="h-3.5 w-3.5 text-[#836EF9]" />
                  <span>Bolty Token</span>
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-[1px] text-[9px] uppercase text-emerald-300">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                    Live
                  </span>
                </div>
                <h1 className="mt-1 text-3xl font-light tracking-tight sm:text-4xl">
                  <GradientText gradient="purple">$BOLTY</GradientText>
                  <span className="ml-2 text-white/40">/ Base</span>
                </h1>
                <p className="mt-1 text-sm font-light text-white/60">
                  {stats?.name ?? 'Bolty'} — the native token powering the Bolty
                  marketplace.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShimmerButton
                as="a"
                href={flaunchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm"
              >
                <Rocket className="h-4 w-4" />
                Trade on Flaunch
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </ShimmerButton>
            </div>
          </div>

          {/* Headline: Market cap is now the big number */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                Market cap
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <div className="text-4xl font-light tracking-tight sm:text-5xl">
                  {loading ? '…' : formatUsd(mcap, 0)}
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-normal ${priceChangeColor}`}
                >
                  {stats?.priceChange24h != null && stats.priceChange24h >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : stats?.priceChange24h != null ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : null}
                  {formatPct(stats?.priceChange24h)}
                  <span className="text-white/30">24h</span>
                </div>
              </div>
              <div className="mt-1 text-[12px] text-white/40">
                Price{' '}
                <span className="tabular-nums text-white/70">
                  {stats?.priceUsd != null ? formatUsd(stats.priceUsd, 6) : '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:justify-self-end">
              <PriceDelta label="1h" value={stats?.priceChange1h ?? null} />
              <PriceDelta label="6h" value={stats?.priceChange6h ?? null} />
              <PriceDelta label="24h" value={stats?.priceChange24h ?? null} />
            </div>
          </div>

          {/* Contract row */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4 text-xs text-white/60">
            <span className="uppercase tracking-[0.22em] text-white/40">
              Contract
            </span>
            <code className="rounded-lg bg-white/5 px-2 py-1 font-mono text-white/80">
              {shortAddr(BOLTY_CONTRACT)}
            </code>
            <button
              onClick={copyContract}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 transition hover:border-white/30 hover:text-white"
            >
              <Copy className="h-3 w-3" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a
              href={`https://basescan.org/token/${BOLTY_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-white/60 transition hover:text-white"
            >
              BaseScan <ExternalLink className="h-3 w-3" />
            </a>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-white/40">
              <Sparkles className="h-3 w-3 text-[#836EF9]" />
              Powered by{' '}
              <a
                href="https://flaunch.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 underline decoration-white/20 underline-offset-2 transition hover:text-white hover:decoration-white/60"
              >
                Flaunch
              </a>
            </span>
          </div>
        </motion.header>

        {/* ── Stats grid ───────────────────────────────────────────────── */}
        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Market cap"
            value={formatUsd(mcap, 0)}
            accent="#836EF9"
          />
          <StatTile
            label="24h volume"
            value={formatUsd(stats?.volume24hUsd, 0)}
            accent="#06B6D4"
          />
          <StatTile
            label="Liquidity"
            value={formatUsd(stats?.liquidityUsd, 0)}
            accent="#10B981"
          />
          <StatTile
            label="FDV"
            value={formatUsd(stats?.fdvUsd, 0)}
            accent="#EC4899"
          />
        </section>

        {/* ── Chart + Swap panel ───────────────────────────────────────── */}
        <section className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          <div
            className="relative overflow-hidden rounded-3xl"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-normal tracking-wide text-white/70">
                  Chart
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-[1px] text-[10px] text-white/50">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-[#06B6D4]" />
                  Real-time · 1m
                </span>
              </div>
              {stats?.pairUrl && (
                <a
                  href={stats.pairUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-white/50 transition hover:text-white"
                >
                  Open on DexScreener
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="h-[500px] w-full">
              {chartSrc ? (
                <iframe
                  src={chartSrc}
                  className="h-full w-full border-0"
                  title="BOLTY price chart"
                  loading="lazy"
                  allow="clipboard-write"
                />
              ) : (
                <ChartPlaceholder flaunchUrl={flaunchUrl} />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <BoltySwapCard priceUsd={stats?.priceUsd ?? null} />
            <div
              className="rounded-2xl p-3 text-[11px] font-light text-white/60"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#836EF9]" />
                Swaps route through Flaunch &amp; Uniswap V4 on Base. Your
                MetaMask wallet stays in control — Bolty never touches your
                keys.
              </div>
            </div>
          </div>
        </section>

        {/* ── Live trades ──────────────────────────────────────────────── */}
        <section className="mt-5">
          <BoltyTradesFeed />
        </section>

        {/* ── Coming soon card ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative mt-5 overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{
            background:
              'linear-gradient(135deg, rgba(131,110,249,0.14) 0%, rgba(6,182,212,0.08) 50%, rgba(236,72,153,0.08) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(131,110,249,0.35), transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 bottom-3 h-5 w-5 border-b-2 border-r-2"
            style={{ borderColor: 'rgba(131,110,249,0.4)' }}
          />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#836EF9]/40 bg-[#836EF9]/10 px-3 py-1 text-[10.5px] uppercase tracking-[0.24em] text-[#C9BEFF]">
                <Sparkles className="h-3 w-3" />
                Coming soon
              </div>
              <h3 className="mt-3 text-2xl font-light tracking-tight sm:text-3xl">
                Launch your own AI agents on{' '}
                <GradientText gradient="purple">Flaunch</GradientText>
              </h3>
              <p className="mt-2 text-sm font-light text-white/70">
                We&apos;re building the first AI-agent launchpad on top of Flaunch.
                Publish your agent, attach a fair-launch coin, and let the
                community price its intelligence — all in one click.
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-white/60 sm:grid-cols-2">
                <Bullet icon={Rocket}>One-click fair launch per agent</Bullet>
                <Bullet icon={Shield}>Escrow &amp; reputation baked in</Bullet>
                <Bullet icon={Droplets}>Automatic Uniswap V4 liquidity</Bullet>
                <Bullet icon={Zap}>Revenue-share to agent creators</Bullet>
              </ul>
            </div>

            <div className="flex flex-col gap-2 sm:w-56">
              <Link
                href="/market/seller/publish"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#836EF9] to-[#6B4FE8] px-4 py-2.5 text-sm font-normal text-white shadow-[0_0_30px_-8px_#836EF9] transition hover:brightness-110"
              >
                Publish an agent
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href="https://flaunch.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-light text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Learn about Flaunch
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.section>
      </div>
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
      className="rounded-lg px-2 py-1.5 text-center text-[11px] font-light"
      style={{ background: tone.bg }}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </div>
      <div className="mt-0.5 font-normal" style={{ color: tone.color }}>
        {formatPct(value)}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 font-light"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-[2px]"
        style={{ background: accent, opacity: 0.5 }}
      />
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
        {label}
      </div>
      <div className="mt-1 text-lg font-normal text-white">{value}</div>
    </div>
  );
}

function Bullet({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9BEFF]" />
      <span>{children}</span>
    </li>
  );
}

function ChartPlaceholder({ flaunchUrl }: { flaunchUrl: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(131,110,249,0.25), rgba(6,182,212,0.18))',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
        }}
      >
        <Rocket className="h-6 w-6 text-[#C9BEFF]" />
      </div>
      <h3 className="text-base font-light">Chart syncing with Flaunch</h3>
      <p className="max-w-sm text-sm font-light text-white/60">
        The pair is still being indexed. Jump to Flaunch for the live order book
        and to trade $BOLTY directly.
      </p>
      <a
        href={flaunchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#836EF9] to-[#6B4FE8] px-4 py-2 text-sm font-normal text-white transition hover:brightness-110"
      >
        Open on Flaunch
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
