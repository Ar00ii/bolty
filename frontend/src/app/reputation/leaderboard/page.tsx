'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { ReputationBadge } from '@/components/ui/reputation-badge';
import { Trophy, Star, GitBranch, Package } from 'lucide-react';

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
  { rank: 'NEWCOMER', label: 'Newcomer', badge: '◎', color: '#71717a', threshold: 0, points: {} },
  { rank: 'BRONZE', label: 'Bronze', badge: '🥉', color: '#cd7f32', threshold: 50 },
  { rank: 'SILVER', label: 'Silver', badge: '🥈', color: '#9ca3af', threshold: 200 },
  { rank: 'GOLD', label: 'Gold', badge: '🥇', color: '#f59e0b', threshold: 600 },
  { rank: 'PLATINUM', label: 'Platinum', badge: '💎', color: '#a855f7', threshold: 1500 },
  { rank: 'DIAMOND', label: 'Diamond', badge: '💠', color: '#38bdf8', threshold: 4000 },
  { rank: 'LEGEND', label: 'Legend', badge: '⚡', color: '#836ef9', threshold: 10000 },
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
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(131,110,249,0.15)', border: '1px solid rgba(131,110,249,0.25)' }}>
          <Trophy className="w-6 h-6 text-monad-400" strokeWidth={1.5} />
        </div>
        <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-2">Hall of Fame</p>
        <h1 className="text-2xl font-bold text-white mb-1">Reputation Leaderboard</h1>
        <p className="text-sm text-zinc-500">
          The most trusted and respected developers in the Bolty ecosystem.
        </p>
      </div>

      {/* Rank System */}
      <div className="border border-white/06 rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Rank System</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {RANK_INFO.map(r => (
            <div key={r.rank} className="flex items-center gap-2.5 p-2.5 rounded-xl"
              style={{ background: `${r.color}08`, border: `1px solid ${r.color}20` }}>
              <span className="text-lg flex-shrink-0">{r.badge}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: r.color }}>{r.label}</p>
                <p className="text-xs" style={{ color: 'rgba(161,161,170,0.4)', fontSize: '0.65rem' }}>
                  {r.threshold >= 1000 ? `${(r.threshold / 1000).toFixed(0)}k` : r.threshold}+ pts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to earn points */}
      <div className="border border-white/06 rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">How to Earn Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {POINTS_INFO.map(p => (
            <div key={p.reason} className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-xs text-zinc-400">{p.label}</span>
              <span className="text-xs font-mono font-bold text-monad-400">+{p.points} pts</span>
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
        <div className="text-center py-16 border border-dashed border-white/06 rounded-2xl">
          <p className="text-zinc-600 font-mono text-sm">No rankings yet. Be the first to earn reputation!</p>
        </div>
      ) : (
        <div className="border border-white/06 rounded-2xl overflow-hidden">
          {leaderboard.map((entry, idx) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 px-5 py-4 border-b border-white/04 hover:bg-monad-500/3 transition-colors last:border-0"
            >
              {/* Position */}
              <div className="w-8 flex-shrink-0 text-center">
                {idx === 0 ? (
                  <span className="text-xl">🥇</span>
                ) : idx === 1 ? (
                  <span className="text-xl">🥈</span>
                ) : idx === 2 ? (
                  <span className="text-xl">🥉</span>
                ) : (
                  <span className="text-sm font-mono text-zinc-600">{entry.position}</span>
                )}
              </div>

              {/* Avatar */}
              <Link href={`/u/${entry.username}`} className="flex-shrink-0">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/08" />
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: `${entry.rankMeta.color}15`, border: `1px solid ${entry.rankMeta.color}30`, color: entry.rankMeta.color }}>
                    {(entry.displayName || entry.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link href={`/u/${entry.username}`} className="text-sm font-medium text-white hover:text-monad-400 transition-colors truncate">
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
                <div className="text-sm font-bold font-mono" style={{ color: entry.rankMeta.color }}>
                  {entry.reputationPoints.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-700 font-mono">pts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
