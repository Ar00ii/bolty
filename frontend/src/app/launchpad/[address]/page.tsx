'use client';

import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

import { TokenActivityCards } from '@/components/flaunch/TokenActivityCards';
import {
  buyLaunchpadToken,
  getTokenByAddress,
  sellLaunchpadToken,
} from '@/lib/flaunch/launchpad';
import type { TokenInfo, TradeResult } from '@/lib/flaunch/types';

// Dynamic import — lightweight-charts is ~100KB and only needed on
// the detail page. Same pattern used on /bolty.
const LaunchpadCandleChart = dynamic(
  () =>
    import('@/components/flaunch/LaunchpadCandleChart').then((m) => ({
      default: m.LaunchpadCandleChart,
    })),
  { ssr: false },
);

type Mode = 'buy' | 'sell';

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

/**
 * Subscript-zero notation for tiny prices, the way DexScreener / GeckoTerminal
 * format microcap tokens. e.g. 0.0₂₈39 = 0.000…039 with 28 leading zeros.
 * Standard $X.XX for normal numbers.
 */
function formatUsd(n: number): string {
  if (!n || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  // Subscript notation
  const expOf10 = Math.floor(Math.log10(n));
  const leadingZeros = -expOf10 - 1;
  if (leadingZeros < 4) return `$${n.toFixed(8)}`;
  const sig = (n * Math.pow(10, -expOf10))
    .toPrecision(3)
    .replace('.', '')
    .replace(/0+$/, '') || '1';
  const subChars = '₀₁₂₃₄₅₆₇₈₉';
  const sub = String(leadingZeros)
    .split('')
    .map((d) => subChars[Number(d)])
    .join('');
  return `$0.0${sub}${sig}`;
}

function shortAddr(a: string): string {
  if (!a || a.length < 14) return a;
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TokenDetailPage() {
  const router = useRouter();
  const params = useParams<{ address: string }>();
  const address = params.address;

  const [token, setToken] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setNotFound(false);
    getTokenByAddress(address)
      .then((t) => {
        if (!t) setNotFound(true);
        else setToken(t);
      })
      .finally(() => setLoading(false));
  }, [address]);

  // Re-poll token metadata every 10s for header price/mcap refreshes.
  // Pauses when tab is hidden. The chart component handles its own
  // OHLCV polling internally.
  useEffect(() => {
    if (!address || notFound) return;
    let id: ReturnType<typeof setInterval> | null = null;
    function start() {
      if (id) return;
      id = setInterval(() => {
        getTokenByAddress(address).then((t) => {
          if (t) setToken(t);
        });
      }, 1_500);
    }
    function stop() {
      if (id) {
        clearInterval(id);
        id = null;
      }
    }
    function onVis() {
      if (document.visibilityState === 'visible') start();
      else stop();
    }
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [address, notFound]);

  if (loading) {
    return (
      <div className="mk-app-page mx-auto max-w-6xl px-4 sm:px-6 py-8" style={{ maxWidth: '72rem' }}>
        <PageBackLink />
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            <Shimmer className="h-20 rounded-xl" />
            <Shimmer className="h-[260px] rounded-xl" />
            <div className="grid grid-cols-4 gap-2">
              <Shimmer className="h-16 rounded-md" />
              <Shimmer className="h-16 rounded-md" />
              <Shimmer className="h-16 rounded-md" />
              <Shimmer className="h-16 rounded-md" />
            </div>
          </div>
          <Shimmer className="h-[320px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !token) {
    return (
      <div className="mk-app-page mx-auto max-w-6xl px-4 sm:px-6 py-8" style={{ maxWidth: '72rem' }}>
        <PageBackLink />
        <div className="mt-12 text-center">
          <div className="text-[14px] text-white font-light mb-1">Token not found</div>
          <div className="text-[12px] text-zinc-500 font-light">
            No coin at <span className="font-mono">{shortAddr(address)}</span> in our launchpad.
          </div>
          <button
            type="button"
            onClick={() => router.push('/launchpad')}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-zinc-300 hover:text-white transition"
            style={{
              background: 'rgba(255,255,255,0.04)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            <ArrowLeft className="w-3 h-3" /> Back to launchpad
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mk-app-page mx-auto max-w-6xl px-4 sm:px-6 py-8"
      style={{ maxWidth: '72rem' }}
    >
      <PageBackLink />
      <TokenHeader token={token} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* LEFT — chart + stats + about */}
        <div className="space-y-5 min-w-0">
          <ChartCard token={token} />
          <StatsRow token={token} />
          <TokenActivityCards
            tokenAddress={token.tokenAddress}
            symbol={token.symbol}
          />
          <AboutCard token={token} />
          <LinksCard token={token} />
        </div>

        {/* RIGHT — sticky trade panel */}
        <aside className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <TradePanel token={token} />
          <CreatorMini token={token} />
        </aside>
      </div>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────

function PageBackLink() {
  return (
    <Link
      href="/launchpad"
      className="inline-flex items-center gap-1.5 text-[11.5px] text-zinc-400 hover:text-white transition font-light"
    >
      <ArrowLeft className="w-3 h-3" strokeWidth={1.75} />
      Back to launchpad
    </Link>
  );
}

function TokenHeader({ token }: { token: TokenInfo }) {
  const up = token.priceChange24hPercent >= 0;
  const changeAbs = Math.abs(token.priceChange24hPercent);
  return (
    <header className="mt-3 flex items-start gap-4">
      <div
        className="w-14 h-14 rounded-2xl overflow-hidden shrink-0"
        style={{
          background: 'rgba(131,110,249,0.08)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
        }}
      >
        {token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={token.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-[11px] text-[#b4a7ff] font-mono">
            ${token.symbol}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl text-white font-light truncate">{token.name}</h1>
          <span className="text-[12px] font-mono text-zinc-500">${token.symbol}</span>
          <CopyableAddr addr={token.tokenAddress} />
        </div>
        <div className="mt-1 flex items-center gap-3 text-[12px] font-light text-zinc-400">
          <span className="font-mono tabular-nums text-white text-[18px]">
            {formatUsd(token.priceUsd)}
          </span>
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11.5px] font-mono tabular-nums"
            style={{
              color: up ? '#22c55e' : '#ef4444',
              background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              boxShadow: up
                ? 'inset 0 0 0 1px rgba(34,197,94,0.3)'
                : 'inset 0 0 0 1px rgba(239,68,68,0.3)',
            }}
          >
            {up ? (
              <TrendingUp className="w-3 h-3" strokeWidth={2} />
            ) : (
              <TrendingDown className="w-3 h-3" strokeWidth={2} />
            )}
            {up ? '+' : '-'}
            {changeAbs.toFixed(2)}%
          </span>
          <span className="text-zinc-600">·</span>
          <span>launched {timeAgo(token.launchedAt)}</span>
        </div>
      </div>
    </header>
  );
}

function CopyableAddr({ addr }: { addr: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(addr).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1100);
          },
          () => {},
        );
      }}
      className="inline-flex items-center gap-1 text-[10.5px] font-mono text-zinc-500 hover:text-white transition px-1.5 py-0.5 rounded-md"
      style={{ background: 'rgba(255,255,255,0.03)' }}
      title={addr}
    >
      <span>{shortAddr(addr)}</span>
      <Copy className="w-2.5 h-2.5" strokeWidth={1.75} />
      {copied && <span className="text-[#86efac]">copied</span>}
    </button>
  );
}

// ── Chart + stats ───────────────────────────────────────────────────

function ChartCard({ token }: { token: TokenInfo }) {
  // Use the same stack as /bolty — lightweight-charts + GeckoTerminal
  // OHLCV. The component renders its own toolbar with timeframes and
  // handles "no pool yet" + loading states internally.
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
        height: 520,
      }}
    >
      <LaunchpadCandleChart tokenAddress={token.tokenAddress} />
    </div>
  );
}

function StatsRow({ token }: { token: TokenInfo }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Stat label="Market cap" value={formatUsd(token.marketCapUsd)} />
      <Stat label="24h volume" value={`${formatEth(token.volume24hEth)} ETH`} />
      <Stat
        label="Holders"
        value={
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3 text-zinc-500" strokeWidth={2} />
            {token.holders.toLocaleString()}
          </span>
        }
      />
      <Stat label="Network" value="Base" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 font-medium">{label}</div>
      <div className="mt-0.5 text-[14px] text-white font-mono tabular-nums truncate">{value}</div>
    </div>
  );
}

// ── About + links + creator ─────────────────────────────────────────

function AboutCard({ token }: { token: TokenInfo }) {
  // Show whatever the creator pinned to IPFS in the wizard. The
  // attribution footer ("Launched on the Bolty Network launchpad —
  // {url}") is appended automatically inside the wizard, so we don't
  // need to add anything here.
  if (!token.description?.trim()) return null;
  return (
    <section
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <h2 className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 font-medium mb-2">
        About
      </h2>
      <p className="text-[13px] text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
        {token.description}
      </p>
    </section>
  );
}

function LinksCard({ token }: { token: TokenInfo }) {
  const links: Array<{ label: string; href: string; external: boolean }> = [
    { label: 'Source listing on Bolty', href: token.listingPath, external: false },
    { label: 'Open on Flaunch', href: token.flaunchUrl, external: true },
    {
      label: 'View on Basescan',
      href: `https://basescan.org/address/${token.tokenAddress}`,
      external: true,
    },
  ];
  return (
    <section
      className="rounded-xl p-4 space-y-1.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <h2 className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 font-medium mb-1">
        Links
      </h2>
      {links.map((l) =>
        l.external ? (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12.5px] text-zinc-300 hover:text-white transition"
            style={{
              background: 'rgba(255,255,255,0.02)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            <span>{l.label}</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" strokeWidth={1.75} />
          </a>
        ) : (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12.5px] text-zinc-300 hover:text-white transition"
            style={{
              background: 'rgba(255,255,255,0.02)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            <span>{l.label}</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-500" strokeWidth={1.75} />
          </Link>
        ),
      )}
    </section>
  );
}

function CreatorMini({ token }: { token: TokenInfo }) {
  if (!token.creatorUsername) return null;
  return (
    <Link
      href={`/u/${token.creatorUsername}`}
      className="flex items-center gap-3 rounded-xl p-3 transition hover:brightness-110"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="w-9 h-9 rounded-full overflow-hidden shrink-0"
        style={{
          background: 'rgba(131,110,249,0.12)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
        }}
      >
        {token.creatorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={token.creatorAvatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-[11px] text-[#b4a7ff] font-mono">
            {token.creatorUsername.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 font-medium">
          Launched by
        </div>
        <div className="text-[12.5px] text-white font-light truncate">
          @{token.creatorUsername}
        </div>
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
    </Link>
  );
}

// ── Trade panel ─────────────────────────────────────────────────────

function TradePanel({ token }: { token: TokenInfo }) {
  const [mode, setMode] = useState<Mode>('buy');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [last, setLast] = useState<TradeResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
    <section
      className="rounded-xl p-4 space-y-3"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <h2 className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 font-medium">
        Trade ${token.symbol}
      </h2>

      {/* Buy/Sell tabs */}
      <div
        className="flex items-center gap-1 p-0.5 rounded-lg"
        style={{
          background: 'rgba(0,0,0,0.4)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
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
            className="flex-1 px-2 py-2 rounded-md text-[12px] uppercase tracking-[0.12em] transition font-light"
            style={{
              color: mode === m ? '#ffffff' : '#a1a1aa',
              background: mode === m ? 'rgba(131,110,249,0.2)' : 'transparent',
              boxShadow: mode === m ? 'inset 0 0 0 1px rgba(131,110,249,0.35)' : 'none',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Input */}
      <div>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{
            background: 'rgba(0,0,0,0.4)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          <input
            type="number"
            min={0}
            step={mode === 'buy' ? 0.001 : 1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[16px] font-mono text-white placeholder:text-zinc-600 min-w-0"
            placeholder="0"
          />
          <span className="text-[12px] text-zinc-500 font-mono shrink-0">
            {mode === 'buy' ? 'ETH' : token.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 text-[10.5px] text-zinc-500">
          <span className="font-mono">
            ≈{' '}
            {previewOut
              ? previewOut.toLocaleString(undefined, {
                  maximumFractionDigits: mode === 'buy' ? 0 : 6,
                })
              : '0'}{' '}
            {mode === 'buy' ? token.symbol : 'ETH'}
          </span>
          <span>Slippage 1%</span>
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!amount || Number(amount) <= 0 || status === 'pending'}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[13px] font-light text-white transition disabled:opacity-40"
        style={{
          background:
            mode === 'buy'
              ? 'linear-gradient(180deg, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0.25) 100%)'
              : 'linear-gradient(180deg, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.25) 100%)',
          boxShadow:
            mode === 'buy'
              ? '0 0 0 1px rgba(34,197,94,0.42)'
              : '0 0 0 1px rgba(239,68,68,0.42)',
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
        <div
          className="rounded-md px-2 py-1.5 text-[11.5px] text-[#86efac] font-light text-center"
          style={{
            background: 'rgba(34,197,94,0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.25)',
          }}
        >
          Got {last.received} {last.receivedSymbol}
        </div>
      )}
      {status === 'error' && err && (
        <div
          className="rounded-md px-2 py-1.5 text-[11.5px] text-red-300 font-light text-center"
          style={{
            background: 'rgba(239,68,68,0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.25)',
          }}
        >
          {err}
        </div>
      )}
    </section>
  );
}

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={className}
      style={{
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
        animation: 'mk-shimmer 1.4s linear infinite',
      }}
    />
  );
}

