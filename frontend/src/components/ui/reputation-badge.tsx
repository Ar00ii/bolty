'use client';

import React from 'react';

export interface ReputationInfo {
  points: number;
  label: string;
  color: string;
  badge: string;
  description?: string;
}

export function getReputationRank(points: number): ReputationInfo {
  if (points >= 10000) return { points, label: 'Legend', color: '#836ef9', badge: '⚡', description: 'Hall of fame — the pinnacle of the Bolty ecosystem' };
  if (points >= 4000) return { points, label: 'Diamond', color: '#38bdf8', badge: '💠', description: 'Top-tier contributor trusted by thousands' };
  if (points >= 1500) return { points, label: 'Platinum', color: '#a855f7', badge: '💎', description: 'Elite developer with exceptional track record' };
  if (points >= 600) return { points, label: 'Gold', color: '#f59e0b', badge: '🥇', description: 'Highly respected community member' };
  if (points >= 200) return { points, label: 'Silver', color: '#9ca3af', badge: '🥈', description: 'Established developer with proven contributions' };
  if (points >= 50) return { points, label: 'Bronze', color: '#cd7f32', badge: '🥉', description: 'Actively contributing to the community' };
  return { points, label: 'Newcomer', color: '#71717a', badge: '◎', description: 'Just getting started on the platform' };
}

interface ReputationBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
  showLabel?: boolean;
}

export function ReputationBadge({ points, size = 'md', showPoints = false, showLabel = false }: ReputationBadgeProps) {
  const rank = getReputationRank(points);

  const sizes = {
    sm: { badge: 'text-xs', label: 'text-xs', container: 'gap-0.5 px-1.5 py-0.5', text: 'text-xs' },
    md: { badge: 'text-sm', label: 'text-xs', container: 'gap-1 px-2 py-1', text: 'text-xs' },
    lg: { badge: 'text-base', label: 'text-sm', container: 'gap-1.5 px-2.5 py-1.5', text: 'text-sm' },
  };

  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center ${s.container} rounded-full font-mono`}
      style={{
        background: `${rank.color}18`,
        border: `1px solid ${rank.color}40`,
        color: rank.color,
      }}
      title={`${rank.label} · ${points.toLocaleString()} reputation points`}
    >
      <span className={s.badge}>{rank.badge}</span>
      {showLabel && <span className={s.label}>{rank.label}</span>}
      {showPoints && <span className={s.text}>{points >= 1000 ? `${(points / 1000).toFixed(1)}k` : points}</span>}
    </span>
  );
}
