'use client';

import {
  ArrowUpRight,
  Crown,
  Flame,
  GitBranch,
  Info,
  Package,
  Search,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { getReputationRank, RANK_TIERS } from '@/components/ui/reputation-badge';
import { api } from '@/lib/api/client';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  reputationPoints: number;
  occupation: string | null;
  position: number;
  _count: { repositories: number; marketListings: number };
}

const RAYS_INFO = [
  { reason: 'REPO_PUBLISHED', label: 'Publish a repository', rays: 15 },
  { reason: 'REPO_UPVOTE_RECEIVED', label: 'Receive an upvote', rays: 5 },
  { reason: 'REPO_SOLD', label: 'Sell a locked repository', rays: 75 },
  { reason: 'LISTING_SOLD', label: 'Sell a market listing', rays: 100 },
  { reason: 'FIRST_SALE', label: 'First ever sale bonus', rays: 150 },
  { reason: 'PROFILE_COMPLETED', label: 'Complete your profile', rays: 10 },
  { reason: 'COLLABORATOR_ADDED', label: 'Add a collaborator', rays: 10 },
];

function formatNumber(n: number) {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toString();
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [showHelp, setShowHelp] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>('/reputation/leaderboard?limit=50')
      .then((data) => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const annotated = useMemo(() => {
    return leaderboard.map((e, idx) => {
      const rays = e.reputationPoints;
      const base = getReputationRank(rays);
      const position = e.position || idx + 1;
      const qualifiesForCampeon = rays >= 2000 && position <= 5;
      const tier = base.tier === 7 && !qualifiesForCampeon ? 6 : base.tier;
      const rank = RANK_TIERS[tier];
      return {
        ...e,
        position,
        rankKey: rank.rank,
        rankLabel: rank.label,
        rankColor: rank.color,
      };
    });
  }, [leaderboard]);

  const rankCounts = useMemo(() => {
    return annotated.reduce<Record<string, number>>((acc, e) => {
      acc[e.rankKey] = (acc[e.rankKey] || 0) + 1;
      return acc;
    }, {});
  }, [annotated]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return annotated.filter((e) => {
      if (rankFilter !== 'ALL' && e.rankKey !== rankFilter) return false;
      if (!q) return true;
      const hay = [e.username ?? '', e.displayName ?? '', e.occupation ?? '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [annotated, query, rankFilter]);

  const totalRays = useMemo(
    () => annotated.reduce((sum, e) => sum + e.reputationPoints, 0),
    [annotated],
  );
  const topRays = annotated[0]?.reputationPoints || 0;
  const champions = rankCounts['CAMPEON'] || 0;

  return (
    <div className="min-h-screen pb-20">
      <header className="px-6 pt-8 pb-4 md:px-10 md:pt-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-medium text-zinc-500 uppercase tracking-[0.18em] mb-2">
                <Trophy className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Hall of Fame</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white">
                Rays Leaderboard
              </h1>
              <p className="text-[12.5px] text-zinc-500 font-light mt-1">
                The most trusted builders in Bolty — ranked by rays earned.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12px] text-zinc-300 hover:text-white transition"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
              aria-expanded={showHelp}
            >
              <Info className="w-3.5 h-3.5" strokeWidth={1.75} />
              {showHelp ? 'Hide rays guide' : 'How rays work'}
            </button>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <section className="px-6 md:px-10 mb-4">
        <div className="mx-auto max-w-[1200px] grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatTile
            label="Ranked builders"
            value={formatNumber(annotated.length)}
            sub="in the top 50"
            accent="#836EF9"
          />
          <StatTile
            label="Top rays"
            value={formatNumber(topRays)}
            sub={annotated[0]?.displayName || annotated[0]?.username || '—'}
            accent="#f59e0b"
          />
          <StatTile
            label="Total rays"
            value={formatNumber(totalRays)}
            sub="combined"
            accent="#06B6D4"
          />
          <StatTile
            label="Champions"
            value={formatNumber(champions)}
            sub="Top 5 · 2k+ rays"
            accent="#EC4899"
          />
        </div>
      </section>

      {/* Rank tiers strip */}
      <section className="px-6 md:px-10 mb-4">
        <div className="mx-auto max-w-[1200px]">
          <div
            className="relative rounded-xl overflow-hidden px-3 py-2"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.55) 50%, transparent 100%)',
              }}
            />
            <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap">
              <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-medium flex-shrink-0">
                Tiers
              </span>
              {RANK_TIERS.map((r) => (
                <div key={r.rank} className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: r.color,
                      boxShadow: `0 0 6px ${r.color}`,
                    }}
                  />
                  <span className="text-[11px] font-light" style={{ color: r.color }}>
                    {r.label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600">
                    {r.rank === 'CAMPEON'
                      ? 'Top 5'
                      : r.threshold >= 1000
                        ? `${(r.threshold / 1000).toFixed(0)}k+`
                        : `${r.threshold}+`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rays guide (collapsible) */}
      {showHelp && (
        <section className="px-6 md:px-10 mb-4">
          <div className="mx-auto max-w-[1200px]">
            <div
              className="relative rounded-xl overflow-hidden p-4"
              style={{
                background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.55) 50%, transparent 100%)',
                }}
              />
              <div className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-zinc-500 mb-3 flex items-center gap-1.5">
                <Zap className="w-3 h-3" strokeWidth={2} style={{ color: '#06B6D4' }} />
                How to earn rays
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {RAYS_INFO.map((p) => (
                  <div
                    key={p.reason}
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                    }}
                  >
                    <span className="text-[12px] text-zinc-400 font-light">{p.label}</span>
                    <span className="text-[11.5px] font-mono tabular-nums text-[#b4a7ff] ml-4 flex-shrink-0">
                      +{p.rays}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      {!loading && annotated.length > 0 && (
        <section className="px-6 md:px-10 mb-3">
          <div className="mx-auto max-w-[1200px] flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-1 flex-1 min-w-[220px] max-w-md px-3 py-1.5 rounded-lg"
              style={{
                background: 'rgba(0,0,0,0.4)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search developers, roles…"
                className="flex-1 bg-transparent border-none outline-none text-[12.5px] font-light text-white placeholder-zinc-600"
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-200"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center justify-center text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                  /
                </kbd>
              )}
            </div>

            <div className="flex items-center gap-1 ml-auto flex-wrap">
              <RankChip
                label="All"
                count={annotated.length}
                active={rankFilter === 'ALL'}
                onClick={() => setRankFilter('ALL')}
              />
              {RANK_TIERS.slice()
                .reverse()
                .map((r) => {
                  const count = rankCounts[r.rank] || 0;
                  if (count === 0) return null;
                  return (
                    <RankChip
                      key={r.rank}
                      label={r.label}
                      count={count}
                      active={rankFilter === r.rank}
                      onClick={() => setRankFilter(r.rank)}
                      accent={r.color}
                    />
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* Table */}
      <section className="px-6 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          {loading ? (
            <div
              className="rounded-xl px-6 py-16 text-center text-sm text-zinc-500 font-light"
              style={{
                background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              Loading leaderboard…
            </div>
          ) : visible.length === 0 ? (
            <div
              className="rounded-xl px-6 py-12 text-center"
              style={{
                background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <Trophy className="w-6 h-6 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[13px] text-zinc-300 font-light">
                {annotated.length === 0
                  ? 'No rankings yet. Be the first to earn rays.'
                  : 'No developers match your filters.'}
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="grid grid-cols-[40px_minmax(0,1fr)_110px_70px_70px_90px_28px] items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500 font-medium border-b border-white/5">
                <span className="text-center">#</span>
                <span>Builder</span>
                <span>Rank</span>
                <span className="text-right hidden md:block">Repos</span>
                <span className="text-right hidden md:block">Listings</span>
                <span className="text-right">Rays</span>
                <span />
              </div>
              <ul>
                {visible.map((entry) => (
                  <LeaderboardRow key={entry.id} entry={entry} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="relative rounded-xl px-4 py-3 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
        }}
      />
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 mb-1">
        {label}
      </div>
      <div className="font-mono text-xl md:text-2xl font-light text-white tabular-nums truncate">
        {value}
      </div>
      <div className="text-[10.5px] text-zinc-500 font-light mt-0.5 truncate">{sub}</div>
    </div>
  );
}

function RankChip({
  label,
  count,
  active,
  onClick,
  accent,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) {
  const c = accent || '#836EF9';
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-light transition"
      style={{
        color: active ? '#ffffff' : '#a1a1aa',
        background: active ? `${c}22` : 'rgba(255,255,255,0.02)',
        boxShadow: active ? `inset 0 0 0 1px ${c}5a` : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {label}
      <span
        className="text-[10px] font-mono tabular-nums"
        style={{ color: active ? `${c}ee` : '#71717a' }}
      >
        {count}
      </span>
    </button>
  );
}

function LeaderboardRow({
  entry,
}: {
  entry: LeaderboardEntry & { rankKey: string; rankLabel: string; rankColor: string };
}) {
  const pos = entry.position;
  const medal = pos === 1 ? '#f59e0b' : pos === 2 ? '#cbd5e1' : pos === 3 ? '#cd7f32' : null;
  const isTop = pos <= 5;

  return (
    <li>
      <Link
        href={`/u/${entry.username}`}
        className="group relative grid grid-cols-[40px_minmax(0,1fr)_110px_70px_70px_90px_28px] items-center gap-3 px-3 py-2.5 border-b border-white/[0.04] transition-all hover:bg-white/[0.02]"
      >
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: entry.rankColor, opacity: isTop ? 0.9 : 0.45 }}
        />

        <span className="flex items-center justify-center">
          {medal ? (
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-mono tabular-nums font-semibold"
              style={{
                color: medal,
                background: `${medal}14`,
                boxShadow: `inset 0 0 0 1px ${medal}55, 0 0 12px -4px ${medal}66`,
              }}
            >
              {pos === 1 ? <Crown className="w-3 h-3" strokeWidth={2} /> : pos}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-600 font-mono tabular-nums">{pos}</span>
          )}
        </span>

        <div className="min-w-0 flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: `${entry.rankColor}18`,
              boxShadow: `inset 0 0 0 1px ${entry.rankColor}40`,
            }}
          >
            {entry.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-light" style={{ color: entry.rankColor }}>
                {(entry.displayName || entry.username || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-normal text-white truncate">
              {entry.displayName || entry.username || 'Unknown'}
            </div>
            <div className="text-[10.5px] text-zinc-500 font-light truncate">
              @{entry.username || 'anon'}
              {entry.occupation && (
                <>
                  <span className="text-zinc-700 mx-1">·</span>
                  <span className="text-zinc-500">{entry.occupation}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              color: entry.rankColor,
              background: `${entry.rankColor}14`,
              boxShadow: `inset 0 0 0 1px ${entry.rankColor}44`,
            }}
          >
            {entry.rankKey === 'CAMPEON' && <Flame className="w-2.5 h-2.5" strokeWidth={2} />}
            {entry.rankLabel}
          </span>
        </div>

        <div className="hidden md:flex items-center justify-end gap-1 text-[11.5px] text-zinc-400 font-mono tabular-nums">
          <GitBranch className="w-3 h-3 text-zinc-600" strokeWidth={1.5} />
          {entry._count.repositories}
        </div>

        <div className="hidden md:flex items-center justify-end gap-1 text-[11.5px] text-zinc-400 font-mono tabular-nums">
          <Package className="w-3 h-3 text-zinc-600" strokeWidth={1.5} />
          {entry._count.marketListings}
        </div>

        <div className="text-right">
          <div
            className="font-mono tabular-nums text-[13px] font-light"
            style={{ color: entry.rankColor }}
          >
            {entry.reputationPoints.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-700 font-mono tracking-[0.08em] uppercase">
            rays
          </div>
        </div>

        <ArrowUpRight
          className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-300 transition"
          strokeWidth={1.75}
        />
      </Link>
    </li>
  );
}
