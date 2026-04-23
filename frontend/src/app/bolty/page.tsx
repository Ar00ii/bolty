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

import { BoltyCandleChart } from '@/components/token/BoltyCandleChart';
import { BoltySwapCard } from '@/components/token/BoltySwapCard';
import { BoltyTradesFeed } from '@/components/token/BoltyTradesFeed';
import { FlaunchLogo } from '@/components/token/FlaunchLogo';
import { GradientText } from '@/components/ui/GradientText';
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
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#07070A] text-white">
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
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/40">
                <Zap className="h-3 w-3 text-[#836EF9]" />
                <span>BOLTY TOKEN</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-[1px] text-[9px] text-emerald-300">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>
              <h1 className="mt-0.5 flex items-baseline gap-2 text-2xl font-light tracking-tight">
                <GradientText gradient="purple">$BOLTY</GradientText>
                <span className="text-sm text-white/30">/ Base</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://flaunch.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-normal transition"
              style={{
                background: 'rgba(201,255,65,0.06)',
                border: '1px solid rgba(201,255,65,0.18)',
                color: '#E6F7B4',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201,255,65,0.12)';
                e.currentTarget.style.borderColor = 'rgba(201,255,65,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(201,255,65,0.06)';
                e.currentTarget.style.borderColor = 'rgba(201,255,65,0.18)';
              }}
            >
              <FlaunchLogo size={14} />
              <span className="text-[10px] uppercase tracking-[0.14em] text-white/55">
                Powered by
              </span>
              <span className="font-semibold" style={{ color: '#C9FF41' }}>
                Flaunch
              </span>
            </a>
            <a
              href={flaunchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-normal text-white transition"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.95) 0%, rgba(107,79,232,0.85) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 22px -10px rgba(131,110,249,0.65)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              <Rocket className="h-3.5 w-3.5" />
              Trade on
              <FlaunchLogo size={14} monochrome />
              <ExternalLink className="h-3 w-3 opacity-75" />
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
            <div className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-[2px] text-[10px] text-white/40 backdrop-blur">
              <FlaunchLogo size={10} />
              Flaunch · Uniswap V4 · Base
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <BoltySwapCard priceUsd={stats?.priceUsd ?? null} />
            <div
              className="rounded-2xl px-3 py-2.5 text-[11px] font-light text-white/60"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#836EF9]" />
                Swaps route through{' '}
                <span className="inline-flex items-center gap-1">
                  <FlaunchLogo size={10} />
                  <span className="text-white/80">Flaunch</span>
                </span>{' '}
                &amp; Uniswap V4. Your wallet stays in control.
              </div>
            </div>
          </div>
        </section>

        {/* ── Live trades ──────────────────────────────────────────────── */}
        <section className="mt-4">
          <BoltyTradesFeed />
        </section>

        {/* ── Coming soon: agent launchpad ─────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative mt-4 overflow-hidden rounded-2xl p-5 sm:p-7"
          style={{
            background:
              'linear-gradient(135deg, rgba(131,110,249,0.14) 0%, rgba(201,255,65,0.06) 55%, rgba(236,72,153,0.08) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(131,110,249,0.32), transparent 70%)',
              filter: 'blur(20px)',
            }}
          />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#836EF9]/40 bg-[#836EF9]/10 px-3 py-1 text-[10.5px] uppercase tracking-[0.24em] text-[#C9BEFF]">
                <Sparkles className="h-3 w-3" />
                Coming soon
              </div>
              <h3 className="mt-3 text-2xl font-light tracking-tight sm:text-3xl">
                Launch your own AI agents on{' '}
                <span className="inline-flex items-center gap-2 align-middle">
                  <FlaunchLogo size={26} />
                  <GradientText gradient="purple">Flaunch</GradientText>
                </span>
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
                <FlaunchLogo size={14} />
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
