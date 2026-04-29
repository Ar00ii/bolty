'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bot,
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
import { ConnectAgentXModal } from '@/components/social/ConnectAgentXModal';
import { TokenLeaderboard } from '@/components/flaunch/TokenLeaderboard';
import { TokenMiniSparkline } from '@/components/flaunch/TokenMiniSparkline';
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
    const s = searchParams?.get('sort') ?? null;
    return isSort(s) ? s : 'recent';
  });
  const [section, setSection] = useState<SectionFilter>(() => {
    const s = searchParams?.get('section') ?? null;
    return isSection(s) ? s : 'ALL';
  });
  const [search, setSearch] = useState(() => searchParams?.get('q') ?? '');
  const [launchOpen, setLaunchOpen] = useState(false);
  const [connectXOpen, setConnectXOpen] = useState(false);
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

  // Poll for updates every 1.5s so price + holder counts feel live.
  // Pauses when the tab is backgrounded to avoid hammering the RPC
  // while the user isn't looking. The SDK read paths are cheap reads
  // so the cadence is safe.
  useEffect(() => {
    if (!FLAUNCH_LAUNCHPAD_ENABLED) return;
    let id: ReturnType<typeof setInterval> | null = null;
    function start() {
      if (id) return;
      id = setInterval(refresh, 1_500);
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

  return (
    <>
      {/* Top banner carousel + leaderboard — nearly edge-to-edge with a
          hairline margin on each side so the blocks don't fuse into
          the sidebar / viewport edge. OUTSIDE the mk-app-page wrapper
          because that shell caps children at max-width: 1280px.
          When the launch form is open we hide the leaderboard so the
          user can focus on the form + banners only. */}
      {hasAny && tokens && (
        <div className="w-full font-light px-2 pt-4">
          <div
            className={
              launchOpen
                ? 'grid grid-cols-1 gap-2 items-stretch'
                : 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_500px] gap-3 items-stretch'
            }
          >
            <FeaturedCarousel tokens={tokens} />
            {!launchOpen && <TokenLeaderboard tokens={tokens} />}
          </div>
        </div>
      )}

      {/* Inline launch form — replaces the previous modal. Shown only
          when the user clicks "Launch yours" above. Wide horizontal
          layout so the form reads like a full-page app form; the rest
          of the page (browse area, filters, grid, FAQ) is suppressed
          until the user closes it. */}
      <AnimatePresence>
        {launchOpen && (
          <motion.div
            key="launch-inline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full px-2 pt-5 pb-10"
          >
            <div
              className="mx-auto max-w-[1100px] rounded-3xl p-6 md:p-8"
              style={{
                background: '#000000',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 30px 80px -30px rgba(0,0,0,0.9)',
              }}
            >
              <LaunchYoursModal
                inline
                open
                onClose={() => setLaunchOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Browse area (filters + grid) — uses mk-app-page shell.
          Hidden while the launch form is open so the user can focus. */}
      {!launchOpen && (
      <div className="mk-app-page">
        {/* Launch CTA + filters bar */}
        <div className="min-w-0 space-y-6">
          {FLAUNCH_LAUNCHPAD_ENABLED && (
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConnectXOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-light text-white transition hover:brightness-110"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    title="Pick one of your AI agents and link it to its own X account"
                  >
                    <Bot className="w-3 h-3" />
                    Connect X to an agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaunchOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-light text-white transition hover:brightness-110"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(20,241,149,0.55) 0%, rgba(20,241,149,0.4) 100%)',
                      boxShadow:
                        '0 0 0 1px rgba(20,241,149,0.5), 0 0 20px -8px rgba(20,241,149,0.6)',
                    }}
                  >
                    <Rocket className="w-3 h-3" />
                    Launch yours
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-light text-white transition hover:brightness-110"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,241,149,0.55) 0%, rgba(20,241,149,0.4) 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(20,241,149,0.5), 0 0 20px -8px rgba(20,241,149,0.6)',
                  }}
                >
                  <Rocket className="w-3 h-3" />
                  Sign in to launch
                </Link>
              )}
            </div>
          )}

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

          <LaunchpadDocsFooter />
        </div>
      </div>
      )}


      <CreatorProfileModal
        open={!!creator}
        username={creator}
        allTokens={tokens ?? []}
        onClose={() => setCreator(null)}
        onOpenToken={openToken}
      />
      <ConnectAgentXModal
        open={connectXOpen}
        onClose={() => setConnectXOpen(false)}
      />
    </>
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
            background: value === k ? 'rgba(20,241,149,0.2)' : 'transparent',
            boxShadow: value === k ? 'inset 0 0 0 1px rgba(20,241,149,0.35)' : 'none',
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
            background: sort === k ? 'rgba(20,241,149,0.18)' : 'rgba(255,255,255,0.03)',
            boxShadow:
              sort === k
                ? 'inset 0 0 0 1px rgba(20,241,149,0.4)'
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
            background: 'rgba(20,241,149,0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(20,241,149,0.25)',
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
            ${token.symbol}
            {token.creatorUsername && (
              <>
                {' · by '}
                {onCreatorClick ? (
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
                  <span className="text-zinc-400">@{token.creatorUsername}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* price row */}
      <div className="flex items-end justify-between mt-3">
        <div>
          <div className="text-[11px] text-zinc-500 font-light">Price</div>
          <div className="text-[14px] text-white font-mono tabular-nums">
            {token.priceUsd > 0 ? formatUsd(token.priceUsd) : '—'}
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
        <Cell
          label="Mcap"
          value={token.marketCapUsd > 0 ? formatUsd(token.marketCapUsd) : '—'}
        />
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

// ── Docs + Powered-by footer ─────────────────────────────────────────
//
// Replaces the old HowItWorks strip + FAQ accordion with a compact
// two-column docs row: on the left a short Atlas launchpad explainer,
// on the right a "Powered by Flaunch" card with a link to their SDK
// docs so builders can dig deeper without the FAQ clutter.

function LaunchpadDocsFooter() {
  return (
    <section className="mt-10 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        className="rounded-2xl p-5"
        style={{
          background: '#050507',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500 font-medium mb-2">
          <Info className="w-3.5 h-3.5" strokeWidth={1.75} />
          Atlas launchpad
        </div>
        <p className="text-[13px] text-white/85 font-light leading-relaxed">
          Any listing owner can mint a community token from their agent
          or repo. Every swap routes a <span className="text-white font-medium">1% protocol fee</span> —
          {' '}<span className="text-white font-medium">Atlas takes 0%</span>,
          so 100% splits between the creator and the token&apos;s
          community treasury. Fair-launch first 30 min, then a Uniswap v4
          pool on Base with a progressive bid-wall.
        </p>
        <Link
          href="/launchpad"
          className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] text-[#b4a7ff] hover:text-white transition font-medium"
        >
          Read the launchpad docs <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div
        className="rounded-2xl p-5"
        style={{
          background:
            'linear-gradient(135deg, rgba(20,241,149,0.1) 0%, #050507 100%)',
          border: '1px solid rgba(20,241,149,0.3)',
        }}
      >
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#b4a7ff] font-medium mb-2">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
          Powered by Flaunch
        </div>
        <p className="text-[13px] text-white/85 font-light leading-relaxed">
          Launches run through the{' '}
          <span className="font-mono text-white">@flaunch/sdk</span> on
          Base chain 8453 — IPFS-pinned metadata, fair-launch, auto LP
          seeding, and the progressive bid-wall mechanic. Open the SDK
          docs to integrate your own agent-powered launch flow.
        </p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Link
            href="https://docs.flaunch.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] text-white font-medium transition hover:brightness-125"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,241,149,0.55) 0%, rgba(20,241,149,0.35) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(20,241,149,0.55), 0 4px 20px -8px rgba(20,241,149,0.7)',
            }}
          >
            Flaunch docs <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href="https://github.com/flayerlabs/flaunchgg-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] text-zinc-300 transition hover:text-white"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            SDK on GitHub <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
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

// USD formatter for token cards. Matches the FeaturedCarousel one:
// k/M abbreviations above $1k, fixed decimals between, scientific
// fallback with subscript-zero notation for sub-cent prices so
// $0.000000 doesn't squash readability of micro-priced tokens.
function formatUsd(n: number): string {
  if (!n || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
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
