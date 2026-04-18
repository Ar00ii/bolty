'use client';

import { Trophy, GitBranch, Package, Search, X } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useMemo, useRef } from 'react';

import { DottedSurface } from '@/components/ui/dotted-surface';
import { ReputationBadge } from '@/components/ui/reputation-badge';
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
  rank: string;
  rankMeta: { label: string; color: string; badge: string; description: string };
  _count: { repositories: number; marketListings: number };
}

const RANK_INFO = [
  { rank: 'NEWCOMER', label: 'Newcomer', color: '#71717a', threshold: 0 },
  { rank: 'BRONZE', label: 'Bronze', color: '#cd7f32', threshold: 50 },
  { rank: 'SILVER', label: 'Silver', color: '#9ca3af', threshold: 200 },
  { rank: 'GOLD', label: 'Gold', color: '#f59e0b', threshold: 600 },
  { rank: 'PLATINUM', label: 'Platinum', color: '#a855f7', threshold: 1500 },
  { rank: 'DIAMOND', label: 'Diamond', color: '#38bdf8', threshold: 4000 },
  { rank: 'LEGEND', label: 'Legend', color: '#836ef9', threshold: 10000 },
];

const POINTS_INFO = [
  { reason: 'REPO_PUBLISHED', label: 'Publish a repository', points: 15 },
  { reason: 'REPO_UPVOTE_RECEIVED', label: 'Receive an upvote on a repo', points: 5 },
  { reason: 'REPO_SOLD', label: 'Sell a locked repository', points: 75 },
  { reason: 'LISTING_SOLD', label: 'Sell a market listing', points: 100 },
  { reason: 'FIRST_SALE', label: 'First ever sale bonus', points: 150 },
  { reason: 'SERVICE_COMPLETED', label: 'Complete a service contract', points: 50 },
  { reason: 'PROFILE_COMPLETED', label: 'Complete your profile', points: 10 },
  { reason: 'COLLABORATOR_ADDED', label: 'Add a collaborator to a repo', points: 10 },
];

function PositionBadge({ idx }: { idx: number }) {
  const tiers: Record<number, string> = { 0: '#f59e0b', 1: '#9ca3af', 2: '#cd7f32' };
  const color = tiers[idx];
  if (color) {
    return (
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-light font-mono"
        style={{
          background: `linear-gradient(135deg, ${color}2e 0%, ${color}08 100%)`,
          boxShadow: `inset 0 0 0 1px ${color}50, inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px -4px ${color}55`,
          color,
        }}
      >
        {idx + 1}
      </span>
    );
  }
  return (
    <span className="w-7 h-7 flex items-center justify-center text-xs font-mono text-zinc-600">
      {idx + 1}
    </span>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);

  useEffect(() => {
    api
      .get<LeaderboardEntry[]>('/reputation/leaderboard?limit=50')
      .then((data) => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rankCounts = useMemo(() => {
    return leaderboard.reduce<Record<string, number>>((acc, e) => {
      acc[e.rank] = (acc[e.rank] || 0) + 1;
      return acc;
    }, {});
  }, [leaderboard]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leaderboard.filter((e) => {
      if (rankFilter !== 'ALL' && e.rank !== rankFilter) return false;
      if (!q) return true;
      const hay = [e.username ?? '', e.displayName ?? '', e.occupation ?? '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [leaderboard, query, rankFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <DottedSurface />

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(131,110,249,0.24) 0%, rgba(131,110,249,0.06) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 22px -4px rgba(131,110,249,0.5)',
            }}
          >
            <Trophy className="w-4 h-4 text-[#b4a7ff]" strokeWidth={1.75} />
          </div>
          <p className="text-[10.5px] font-medium text-[#b4a7ff] uppercase tracking-[0.18em]">
            Hall of Fame
          </p>
        </div>
        <h1 className="text-2xl font-light text-white mb-1.5">Reputation Leaderboard</h1>
        <p className="text-sm text-zinc-500 max-w-lg">
          The most trusted and respected developers in the Bolty ecosystem.
        </p>
      </div>

      {/* Rank System */}
      <div
        className="relative rounded-2xl p-5 mb-6 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
          }}
        />
        <h2 className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-[0.18em] mb-4">
          Rank Tiers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RANK_INFO.map((r) => (
            <div
              key={r.rank}
              className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{
                background: `linear-gradient(180deg, ${r.color}12 0%, ${r.color}03 100%)`,
                boxShadow: `inset 0 0 0 1px ${r.color}28, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: r.color }}
              />
              <div>
                <p className="text-xs font-light leading-none mb-0.5" style={{ color: r.color }}>
                  {r.label}
                </p>
                <p
                  className="font-mono"
                  style={{ color: 'rgba(161,161,170,0.4)', fontSize: '0.6rem' }}
                >
                  {r.threshold >= 1000 ? `${(r.threshold / 1000).toFixed(0)}k` : r.threshold}+ pts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to earn points */}
      <div
        className="relative rounded-2xl p-5 mb-8 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
          }}
        />
        <h2 className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-[0.18em] mb-4">
          How to Earn Points
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {POINTS_INFO.map((p) => (
            <div
              key={p.reason}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              <span className="text-[12.5px] text-zinc-400 tracking-[0.005em]">{p.label}</span>
              <span className="text-[11.5px] font-mono font-light text-[#b4a7ff] ml-4 flex-shrink-0">
                +{p.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search + rank filter */}
      {!loading && leaderboard.length > 0 && (
        <div
          className="relative rounded-xl overflow-hidden p-4 mb-4 space-y-3"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search developers…"
              className="w-full rounded-lg pl-9 pr-14 py-2 text-[13px] text-white placeholder-zinc-600 outline-none transition-all focus:shadow-[0_0_0_3px_rgba(131,110,249,0.12)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <kbd
                  className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-medium text-zinc-500 leading-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  /
                </kbd>
              )}
            </div>
          </div>
          <div className="relative flex flex-wrap gap-1.5">
            <button
              onClick={() => setRankFilter('ALL')}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors tracking-[0.005em]"
              style={
                rankFilter === 'ALL'
                  ? {
                      color: '#fff',
                      background:
                        'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
                    }
                  : {
                      color: '#a1a1aa',
                      background: 'rgba(255,255,255,0.04)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }
              }
            >
              All
              <span className="text-[10px] opacity-70">{leaderboard.length}</span>
            </button>
            {RANK_INFO.slice()
              .reverse()
              .map((r) => {
                const count = rankCounts[r.rank] || 0;
                if (count === 0) return null;
                const active = rankFilter === r.rank;
                return (
                  <button
                    key={r.rank}
                    onClick={() => setRankFilter(r.rank)}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors tracking-[0.005em]"
                    style={
                      active
                        ? {
                            color: '#fff',
                            background: `linear-gradient(180deg, ${r.color}38 0%, ${r.color}0f 100%)`,
                            boxShadow: `inset 0 0 0 1px ${r.color}5a, 0 0 14px -4px ${r.color}70`,
                          }
                        : {
                            color: '#a1a1aa',
                            background: 'rgba(255,255,255,0.04)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                          }
                    }
                  >
                    {r.label}
                    <span className="text-[10px] opacity-70">{count}</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-monad-400 animate-spin mx-auto" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div
          className="relative rounded-2xl overflow-hidden p-14 text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          <p className="text-zinc-500 text-[13px]">
            No rankings yet. Be the first to earn reputation.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div
          className="relative rounded-2xl overflow-hidden p-14 text-center"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <p className="text-zinc-500 text-[13px]">No developers match your filter.</p>
        </div>
      ) : (
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          {visible.map((entry) => (
            <div
              key={entry.id}
              className="relative flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors last:border-0"
            >
              {/* Position */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                <PositionBadge idx={(entry.position || 1) - 1} />
              </div>

              {/* Avatar */}
              <Link href={`/u/${entry.username}`} className="flex-shrink-0">
                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-xl object-cover border border-white/[0.08]"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-light text-xs"
                    style={{
                      background: `${entry.rankMeta.color}15`,
                      border: `1px solid ${entry.rankMeta.color}25`,
                      color: entry.rankMeta.color,
                    }}
                  >
                    {(entry.displayName || entry.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link
                    href={`/u/${entry.username}`}
                    className="text-sm font-light text-zinc-200 hover:text-white transition-colors truncate"
                  >
                    {entry.displayName || entry.username}
                  </Link>
                  <ReputationBadge points={entry.reputationPoints} size="sm" showLabel />
                </div>
                {entry.occupation && (
                  <p className="text-xs text-zinc-600 truncate">{entry.occupation}</p>
                )}
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                <span className="flex items-center gap-1 text-xs text-zinc-600 font-mono">
                  <GitBranch className="w-3 h-3" strokeWidth={1.5} />
                  {entry._count.repositories}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-600 font-mono">
                  <Package className="w-3 h-3" strokeWidth={1.5} />
                  {entry._count.marketListings}
                </span>
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right">
                <div
                  className="text-sm font-light font-mono"
                  style={{ color: entry.rankMeta.color }}
                >
                  {entry.reputationPoints.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-700 font-mono">pts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
