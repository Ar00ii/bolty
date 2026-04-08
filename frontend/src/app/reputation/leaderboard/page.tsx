'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { ReputationBadge } from '@/components/ui/reputation-badge';
import { Trophy, GitBranch, Package } from 'lucide-react';

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
  { rank: 'BRONZE',   label: 'Bronze',   color: '#cd7f32', threshold: 50 },
  { rank: 'SILVER',   label: 'Silver',   color: '#9ca3af', threshold: 200 },
  { rank: 'GOLD',     label: 'Gold',     color: '#f59e0b', threshold: 600 },
  { rank: 'PLATINUM', label: 'Platinum', color: '#a855f7', threshold: 1500 },
  { rank: 'DIAMOND',  label: 'Diamond',  color: '#38bdf8', threshold: 4000 },
  { rank: 'LEGEND',   label: 'Legend',   color: '#836ef9', threshold: 10000 },
];

const POINTS_INFO = [
  { reason: 'REPO_PUBLISHED',       label: 'Publish a repository',           points: 15 },
  { reason: 'REPO_UPVOTE_RECEIVED', label: 'Receive an upvote on a repo',    points: 5 },
  { reason: 'REPO_SOLD',            label: 'Sell a locked repository',        points: 75 },
  { reason: 'LISTING_SOLD',         label: 'Sell a market listing',           points: 100 },
  { reason: 'FIRST_SALE',           label: 'First ever sale bonus',           points: 150 },
  { reason: 'SERVICE_COMPLETED',    label: 'Complete a service contract',     points: 50 },
  { reason: 'PROFILE_COMPLETED',    label: 'Complete your profile',           points: 10 },
  { reason: 'COLLABORATOR_ADDED',   label: 'Add a collaborator to a repo',    points: 10 },
];

function PositionBadge({ idx }: { idx: number }) {
  if (idx === 0) return (
    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-light font-mono"
      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
      1
    </span>
  );
  if (idx === 1) return (
    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-light font-mono"
      style={{ background: 'rgba(156,163,175,0.12)', border: '1px solid rgba(156,163,175,0.25)', color: '#9ca3af' }}>
      2
    </span>
  );
  if (idx === 2) return (
    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-light font-mono"
      style={{ background: 'rgba(205,127,50,0.12)', border: '1px solid rgba(205,127,50,0.25)', color: '#cd7f32' }}>
      3
    </span>
  );
  return (
    <span className="w-7 h-7 flex items-center justify-center text-xs font-mono text-zinc-600">
      {idx + 1}
    </span>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<LeaderboardEntry[]>('/reputation/leaderboard?limit=50')
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <DottedSurface />

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.2)' }}>
            <Trophy className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
          </div>
          <p className="text-xs font-mono text-monad-400 uppercase tracking-widest">Hall of Fame</p>
        </div>
        <h1 className="text-2xl font-light text-white mb-1.5">Reputation Leaderboard</h1>
        <p className="text-sm text-zinc-500 max-w-lg">
          The most trusted and respected developers in the Bolty ecosystem.
        </p>
      </div>

      {/* Rank System */}
      <div className="border border-white/[0.06] rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <h2 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4">Rank Tiers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RANK_INFO.map(r => (
            <div key={r.rank} className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: `${r.color}08`, border: `1px solid ${r.color}20` }}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
              <div>
                <p className="text-xs font-light leading-none mb-0.5" style={{ color: r.color }}>{r.label}</p>
                <p className="font-mono" style={{ color: 'rgba(161,161,170,0.4)', fontSize: '0.6rem' }}>
                  {r.threshold >= 1000 ? `${(r.threshold / 1000).toFixed(0)}k` : r.threshold}+ pts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to earn points */}
      <div className="border border-white/[0.06] rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <h2 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4">How to Earn Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {POINTS_INFO.map(p => (
            <div key={p.reason} className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-xs text-zinc-400">{p.label}</span>
              <span className="text-xs font-mono font-light text-monad-400 ml-4 flex-shrink-0">+{p.points} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-monad-400 animate-spin mx-auto" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-2xl">
          <p className="text-zinc-600 font-mono text-sm">No rankings yet. Be the first to earn reputation.</p>
        </div>
      ) : (
        <div className="border border-white/[0.06] rounded-2xl overflow-hidden">
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors last:border-0"
            >
              {/* Position */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                <PositionBadge idx={idx} />
              </div>

              {/* Avatar */}
              <Link href={`/u/${entry.username}`} className="flex-shrink-0">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-xl object-cover border border-white/[0.08]" />
                ) : (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-light text-xs"
                    style={{ background: `${entry.rankMeta.color}15`, border: `1px solid ${entry.rankMeta.color}25`, color: entry.rankMeta.color }}>
                    {(entry.displayName || entry.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link href={`/u/${entry.username}`} className="text-sm font-medium text-zinc-200 hover:text-white transition-colors truncate">
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
                <div className="text-sm font-light font-mono" style={{ color: entry.rankMeta.color }}>
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
