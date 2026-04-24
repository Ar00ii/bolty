'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Info,
  Rocket,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { CreatorProfileModal } from '@/components/flaunch/CreatorProfileModal';
import { FeaturedCarousel } from '@/components/flaunch/FeaturedCarousel';
import { LaunchYoursModal } from '@/components/flaunch/LaunchYoursModal';
import { TokenLeaderboard } from '@/components/flaunch/TokenLeaderboard';
import { TokenMiniSparkline } from '@/components/flaunch/TokenMiniSparkline';
import { TrendingGrid } from '@/components/flaunch/TrendingGrid';
import { EmptyState } from '@/components/ui/app';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  BOLTY_PROTOCOL_FEE_PERCENT,
  FLAUNCH_LAUNCHPAD_ENABLED,
} from '@/lib/flaunch/feature';
import { listLaunchedTokens } from '@/lib/flaunch/launchpad';
import type { TokenInfo } from '@/lib/flaunch/types';

type Sort = 'recent' | 'volume' | 'mcap' | 'gainers';
type SectionFilter = 'ALL' | 'AGENTS' | 'REPOS';

function isSort(v: string | null): v is Sort {
  return v === 'recent' || v === 'volume' || v === 'mcap' || v === 'gainers';
}
function isSection(v: string | null): v is SectionFilter {
  return v === 'ALL' || v === 'AGENTS' || v === 'REPOS';
}

export default function LaunchpadPage() {
  // useSearchParams forces the page onto the client-rendered path;
  // Suspense boundary keeps the build output sane.
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#000' }} />}>
      <LaunchpadPageContent />
    </Suspense>
  );
}

function LaunchpadPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [tokens, setTokens] = useState<TokenInfo[] | null>(null);
  const [sort, setSort] = useState<Sort>(() => {
    const s = searchParams.get('sort');
    return isSort(s) ? s : 'recent';
  });
  const [section, setSection] = useState<SectionFilter>(() => {
    const s = searchParams.get('section');
    return isSection(s) ? s : 'ALL';
  });
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [launchOpen, setLaunchOpen] = useState(false);
  const [creator, setCreator] = useState<string | null>(null);

  // Click a token card → full-page route. No more side panel; trading
  // happens on /launchpad/{address} which has the chart + trade UI in
  // a real layout instead of a sidebar squeeze.
  const openToken = React.useCallback(
    (t: TokenInfo) => {
      router.push(`/launchpad/${t.tokenAddress}`);
    },
    [router],
  );

  // Mirror filter state to the URL so /launchpad?sort=gainers is
  // shareable + survives a reload. `replace` (not `push`) avoids
  // polluting browser history on every keystroke.
  useEffect(() => {
    const p = new URLSearchParams();
    if (sort !== 'recent') p.set('sort', sort);
    if (section !== 'ALL') p.set('section', section);
    if (search.trim()) p.set('q', search.trim());
    const qs = p.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    router.replace(next, { scroll: false });
  }, [sort, section, search, pathname, router]);

  const refresh = React.useCallback(() => {
    if (!FLAUNCH_LAUNCHPAD_ENABLED) {
      setTokens([]);
      return;
    }
    listLaunchedTokens().then(setTokens);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll for updates every 10s so prices + new launches trickle in.
  // Pauses when the tab is backgrounded to avoid hammering the RPC
  // while the user isn't looking.
  useEffect(() => {
    if (!FLAUNCH_LAUNCHPAD_ENABLED) return;
    let id: ReturnType<typeof setInterval> | null = null;
    function start() {
      if (id) return;
      id = setInterval(refresh, 10_000);
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
  }, [refresh]);

  // The picker modal fires this when a launch succeeds so the grid
  // picks up the new coin without requiring a full reload.
  useEffect(() => {
    function onRefresh() {
      refresh();
    }
    window.addEventListener('launchpad:refresh', onRefresh);
    return () => window.removeEventListener('launchpad:refresh', onRefresh);
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!tokens) return [];
    const q = search.trim().toLowerCase();
    let list = tokens;
    if (section === 'AGENTS') {
      list = list.filter((t) => t.listingPath.includes('/agents/'));
    } else if (section === 'REPOS') {
      list = list.filter((t) => t.listingPath.includes('/repos/'));
    }
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          (t.creatorUsername ?? '').toLowerCase().includes(q),
      );
    }
    const out = [...list];
    if (sort === 'volume') out.sort((a, b) => b.volume24hEth - a.volume24hEth);
    else if (sort === 'mcap') out.sort((a, b) => b.marketCapEth - a.marketCapEth);
    else if (sort === 'gainers')
      out.sort((a, b) => b.priceChange24hPercent - a.priceChange24hPercent);
    // 'recent' keeps client order
    return out;
  }, [tokens, sort, section, search]);

  const totals = useMemo(() => {
    if (!tokens) return { count: 0, volume: 0, mcap: 0, holders: 0 };
    return tokens.reduce(
      (acc, t) => ({
        count: acc.count + 1,
        volume: acc.volume + t.volume24hEth,
        mcap: acc.mcap + t.marketCapEth,
        holders: acc.holders + t.holders,
      }),
      { count: 0, volume: 0, mcap: 0, holders: 0 },
    );
  }, [tokens]);

  const loading = tokens === null;
  const hasAny = (tokens?.length ?? 0) > 0;

  // Featured / trending / leaderboard are hidden when the user is
  // actively searching/filtering. Keeps the browse experience clean.
  const defaultView =
    !search.trim() && sort === 'recent' && section === 'ALL';

  return (
    <div
      className="mk-app-page mx-auto max-w-7xl px-4 sm:px-6 py-8"
      style={{ maxWidth: '80rem' }}
    >
      {/* Compact top bar — just a small launch button since the carousel
          and leaderboard below speak for themselves. No hero, no stats
          strip, no ticker — the page starts with the banners. */}
      {FLAUNCH_LAUNCHPAD_ENABLED && (
        <div className="flex items-center justify-end">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setLaunchOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-light text-white transition hover:brightness-110"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.55) 0%, rgba(131,110,249,0.4) 100%)',
                boxShadow:
                  '0 0 0 1px rgba(131,110,249,0.5), 0 0 20px -8px rgba(131,110,249,0.6)',
              }}
            >
              <Rocket className="w-3 h-3" />
              Launch yours
            </button>
          ) : (
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-light text-white transition hover:brightness-110"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.55) 0%, rgba(131,110,249,0.4) 100%)',
                boxShadow:
                  '0 0 0 1px rgba(131,110,249,0.5), 0 0 20px -8px rgba(131,110,249,0.6)',
              }}
            >
              <Rocket className="w-3 h-3" />
              Sign in to launch
            </Link>
          )}
        </div>
      )}

      {/* Top banner carousel + leaderboard side-by-side at the very
          top. Carousel takes almost full width; leaderboard keeps a
          280-300px sidebar. Below this, the page flows normally. */}
      {hasAny && tokens && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <FeaturedCarousel tokens={tokens} />
          <TokenLeaderboard tokens={tokens} />
        </div>
      )}

      {/* ── Browse area (trending + filters + grid) ──────────────────── */}
      <div className="mt-8">
        {/* LEFT column was previously mixed with the sidebar. Now that the
            leaderboard moved up top, this is a single wide column below. */}
        <div className="min-w-0 space-y-6">
          {defaultView && hasAny && tokens && <TrendingGrid tokens={tokens} />}

          {/* Filters bar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 flex-1 lg:max-w-md">
              <div
                className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Search className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tokens, tickers, creators…"
                  className="flex-1 bg-transparent border-none outline-none text-[13px] font-light text-white placeholder-zinc-500 min-w-0"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-zinc-500 hover:text-white text-[11px]"
                  >
                    clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SectionFilterTabs value={section} onChange={setSection} />
              <div className="h-5 w-px bg-white/[0.08] hidden sm:block" />
              <SortChips sort={sort} onChange={setSort} />
            </div>
          </div>

          {/* Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TokenCardSkeleton key={i} />
                ))}
              </div>
            ) : !hasAny ? (
              <EmptyState
                icon={Rocket}
                title="No tokens launched yet"
                description={
                  !FLAUNCH_LAUNCHPAD_ENABLED
                    ? 'The launchpad is currently in private beta. Flip the feature flag to try it locally.'
                    : isAuthenticated
                      ? 'Be the first — pick one of your listings and mint its token.'
                      : 'Sign in to launch a token for one of your listings and kick off the market.'
                }
                action={
                  !FLAUNCH_LAUNCHPAD_ENABLED
                    ? undefined
                    : isAuthenticated
                      ? { label: 'Launch yours', onClick: () => setLaunchOpen(true) }
                      : { label: 'Sign in', href: '/auth' }
                }
              />
            ) : filtered.length === 0 ? (
              <div
                className="rounded-xl px-6 py-10 text-center"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              >
                <div className="text-[13px] text-zinc-300 font-light">
                  No matches
                </div>
                <div className="text-[11.5px] text-zinc-500 mt-1 font-light">
                  Try a different search or clear the filters.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSection('ALL');
                  }}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11.5px] text-zinc-300 hover:text-white transition"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
              >
                <AnimatePresence initial={false}>
                  {filtered.map((t, i) => (
                    <motion.div
                      key={t.tokenAddress}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                    >
                      <TokenCard
                        token={t}
                        rank={i + 1}
                        onOpen={openToken}
                        onCreatorClick={setCreator}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <HowItWorksStrip />
          <FAQ />
        </div>
      </div>

      <LaunchYoursModal open={launchOpen} onClose={() => setLaunchOpen(false)} />

      <CreatorProfileModal
        open={!!creator}
        username={creator}
        allTokens={tokens ?? []}
        onClose={() => setCreator(null)}
        onOpenToken={openToken}
      />
    </div>
  );
}

// ── Controls ──────────────────────────────────────────────────────────

function SectionFilterTabs({
  value,
  onChange,
}: {
  value: SectionFilter;
  onChange: (v: SectionFilter) => void;
}) {
  const tabs: Array<[SectionFilter, string]> = [
    ['ALL', 'All'],
    ['AGENTS', 'Agents'],
    ['REPOS', 'Repos'],
  ];
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{
        background: 'rgba(0,0,0,0.4)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {tabs.map(([k, label]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className="px-2.5 py-1 text-[12px] font-light rounded-md transition"
          style={{
            color: value === k ? '#ffffff' : '#a1a1aa',
            background: value === k ? 'rgba(131,110,249,0.2)' : 'transparent',
            boxShadow: value === k ? 'inset 0 0 0 1px rgba(131,110,249,0.35)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SortChips({
  sort,
  onChange,
}: {
  sort: Sort;
  onChange: (v: Sort) => void;
}) {
  const sorts: Array<[Sort, string, React.ReactNode]> = [
    ['recent', 'Recent', <Sparkles key="s" className="w-3 h-3" strokeWidth={1.75} />],
    ['volume', 'Volume', <TrendingUp key="v" className="w-3 h-3" strokeWidth={1.75} />],
    ['mcap', 'Mcap', <Rocket key="m" className="w-3 h-3" strokeWidth={1.75} />],
    ['gainers', 'Gainers', <TrendingUp key="g" className="w-3 h-3" strokeWidth={1.75} />],
  ];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sorts.map(([k, label, icon]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-light transition"
          style={{
            color: sort === k ? '#ffffff' : '#a1a1aa',
            background: sort === k ? 'rgba(131,110,249,0.18)' : 'rgba(255,255,255,0.03)',
            boxShadow:
              sort === k
                ? 'inset 0 0 0 1px rgba(131,110,249,0.4)'
                : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Token card ─────────────────────────────────────────────────────────

function TokenCard({
  token,
  rank,
  onOpen,
  onCreatorClick,
}: {
  token: TokenInfo;
  rank: number;
  onOpen: (t: TokenInfo) => void;
  onCreatorClick?: (username: string) => void;
}) {
  const up = token.priceChange24hPercent >= 0;
  const changeAbs = Math.abs(token.priceChange24hPercent);
  const isAgent = token.listingPath.includes('/agents/');

  // Flash green/red when price moves between polls.
  const prevPrice = React.useRef(token.priceEth);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    if (prevPrice.current === token.priceEth) return;
    const direction: 'up' | 'down' =
      token.priceEth > prevPrice.current ? 'up' : 'down';
    prevPrice.current = token.priceEth;
    setFlash(direction);
    const id = setTimeout(() => setFlash(null), 1100);
    return () => clearTimeout(id);
  }, [token.priceEth]);

  return (
    <button
      type="button"
      data-flash={flash ?? undefined}
      onClick={() => onOpen(token)}
      className="group block w-full text-left rounded-xl p-3 transition hover:brightness-110"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* top row: rank + type + external */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums text-zinc-500">
          <span>#{rank}</span>
          <span className="text-zinc-700">·</span>
          <span
            className="uppercase tracking-[0.14em]"
            style={{ color: isAgent ? '#a78bfa' : '#38bdf8' }}
          >
            {isAgent ? 'Agent' : 'Repo'}
          </span>
        </div>
        <a
          href={token.flaunchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-zinc-500 hover:text-white transition"
          title="Open on Flaunch"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* identity row */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl overflow-hidden shrink-0"
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
              ${token.symbol}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13.5px] text-white font-light truncate">{token.name}</span>
            <ArrowUpRight
              className="w-3 h-3 text-zinc-500 group-hover:text-white transition opacity-0 group-hover:opacity-100"
              strokeWidth={1.75}
            />
          </div>
          <div className="text-[11px] font-mono tabular-nums text-zinc-500 truncate">
            ${token.symbol} · by{' '}
            {token.creatorUsername && onCreatorClick ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatorClick(token.creatorUsername as string);
                }}
                className="text-zinc-400 hover:text-white transition"
              >
                @{token.creatorUsername}
              </button>
            ) : (
              <span className="text-zinc-400">@{token.creatorUsername ?? 'anon'}</span>
            )}
          </div>
        </div>
      </div>

      {/* price row */}
      <div className="flex items-end justify-between mt-3">
        <div>
          <div className="text-[11px] text-zinc-500 font-light">Price</div>
          <div className="text-[14px] text-white font-mono tabular-nums">
            {formatEth(token.priceEth)} <span className="text-[10px] text-zinc-500">ETH</span>
          </div>
        </div>
        <div className="text-right">
          <span
            className="inline-flex items-center gap-0.5 text-[11.5px] font-mono tabular-nums px-1.5 py-0.5 rounded-md"
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
          <div className="mt-1">
            <TokenMiniSparkline data={token.sparkline7d || []} width={96} height={22} />
          </div>
        </div>
      </div>

      {/* stats row */}
      <div className="grid grid-cols-3 gap-1.5 mt-3 text-[11px] font-light">
        <Cell label="Mcap" value={`${formatEth(token.marketCapEth)} ETH`} />
        <Cell label="24h vol" value={`${formatEth(token.volume24hEth)} ETH`} />
        <Cell
          label="Holders"
          value={
            <span className="inline-flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5 text-zinc-500" strokeWidth={2} />
              {token.holders.toLocaleString()}
            </span>
          }
        />
      </div>
    </button>
  );
}

function TokenCardSkeleton() {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.5) 0%, rgba(10,10,14,0.5) 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <Shimmer className="w-14 h-2.5 rounded" />
        <Shimmer className="w-3 h-3 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <Shimmer className="w-11 h-11 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Shimmer className="w-2/3 h-3 rounded" />
          <Shimmer className="w-1/3 h-2.5 rounded" />
        </div>
      </div>
      <div className="flex items-end justify-between mt-3">
        <div className="space-y-1">
          <Shimmer className="w-8 h-2 rounded" />
          <Shimmer className="w-16 h-3 rounded" />
        </div>
        <Shimmer className="w-24 h-6 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        <Shimmer className="h-9 rounded-md" />
        <Shimmer className="h-9 rounded-md" />
        <Shimmer className="h-9 rounded-md" />
      </div>
    </div>
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

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="text-[9.5px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="text-zinc-200 font-mono tabular-nums truncate">{value}</div>
    </div>
  );
}

// ── How it works + FAQ ────────────────────────────────────────────────

function HowItWorksStrip() {
  return (
    <div
      className="mt-6 rounded-xl p-4 flex items-start gap-3"
      style={{
        background:
          'linear-gradient(135deg, rgba(131,110,249,0.08) 0%, rgba(6,182,212,0.05) 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.2)',
      }}
    >
      <div
        className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
        style={{
          background: 'rgba(131,110,249,0.18)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
        }}
      >
        <Info className="w-4 h-4 text-[#b4a7ff]" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1 space-y-1 text-[12px] text-zinc-300 font-light">
        <div className="text-[12.5px] text-white">How it works</div>
        <p>
          Any listing owner can launch a token from their listing page. Flaunch handles the
          fair-launch, liquidity pool, and progressive bid-wall on Base.
        </p>
        <p>
          Every swap routes a <span className="text-white">1%</span> protocol fee; Bolty takes{' '}
          <span className="text-white">{BOLTY_PROTOCOL_FEE_PERCENT}%</span> of that and the rest
          splits between the creator and the token&apos;s community treasury.
        </p>
      </div>
      <Link
        href="https://docs.flaunch.gg"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition px-2 py-1 rounded-md shrink-0 self-start"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        Flaunch docs <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}

const FAQ_ITEMS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'Who can launch a token?',
    a: 'Any listing owner on Bolty — agents, bots, scripts or repos. Open the listing page and click "Launch token". The fee split, ticker and supply become permanent once on-chain.',
  },
  {
    q: 'What do I pay to launch?',
    a: 'Base gas only (typically under $0.05) plus an optional premine in ETH if you want to seed your own stack. Bolty does not sponsor launches.',
  },
  {
    q: 'How do fees work?',
    a: (
      <>
        Flaunch charges a 1% fee on every swap. Of that 1%, Bolty takes{' '}
        <span className="text-white">{BOLTY_PROTOCOL_FEE_PERCENT}%</span> for running the
        launchpad, and the remainder splits between you and your token&apos;s community
        treasury according to the slider you set at launch.
      </>
    ),
  },
  {
    q: "What's the fair-launch period?",
    a: 'The first 30 minutes use a fixed-price format. Max buy per wallet is 0.25% of supply, and tokens bought during this window can\'t be sold until it ends — this prevents snipers.',
  },
  {
    q: 'Where does trading happen?',
    a: 'All secondary trading runs on a Uniswap v4 pool on Base, with Flaunch\'s Progressive Bid Wall providing a rising price floor as volume accumulates.',
  },
  {
    q: 'Is this a security?',
    a: 'These are community memecoins tied to marketplace items. The utility is the buyback/bid-wall mechanic, not a claim on Bolty or the creator\'s revenue. We do not offer financial or legal advice; do your own research.',
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mt-10 mb-4">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-medium mb-3">
        Frequently asked
      </h2>
      <div className="space-y-1.5">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="rounded-lg overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.02]"
              >
                <span className="text-[13px] text-white font-light">{item.q}</span>
                <ChevronDown
                  className="w-4 h-4 text-zinc-500 transition"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                  strokeWidth={1.75}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-[12px] text-zinc-400 font-light leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

/**
 * Animated count-up. Plain rAF + easeOutCubic, no framer-motion
 * dependency so it stays fast on server-rendered stats. Call-site
 * picks the formatter so it works for integers + floats.
 */
function CountUp({
  value,
  format = (v) => Math.floor(v).toLocaleString(),
  duration = 900,
}: {
  value: number;
  format?: (v: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const startValue = from.current;
    const change = value - startValue;
    if (Math.abs(change) < 1e-9) {
      from.current = value;
      setDisplay(value);
      return;
    }
    let raf = 0;
    function step(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startValue + change * eased;
      setDisplay(current);
      from.current = current;
      if (t < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(display)}</>;
}
