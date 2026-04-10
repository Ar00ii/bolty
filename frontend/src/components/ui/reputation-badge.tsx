'use client';

import React from 'react';

export interface ReputationInfo {
  points: number;
  label: string;
  color: string;
  tier: number; // 0–6 for bar fill
  description?: string;
}

export function getReputationRank(points: number): ReputationInfo {
  if (points >= 10000)
    return {
      points,
      label: 'Legend',
      color: '#836ef9',
      tier: 6,
      description: 'Hall of fame — the pinnacle of the Bolty ecosystem',
    };
  if (points >= 4000)
    return {
      points,
      label: 'Diamond',
      color: '#38bdf8',
      tier: 5,
      description: 'Top-tier contributor trusted by thousands',
    };
  if (points >= 1500)
    return {
      points,
      label: 'Platinum',
      color: '#a855f7',
      tier: 4,
      description: 'Elite developer with exceptional track record',
    };
  if (points >= 600)
    return {
      points,
      label: 'Gold',
      color: '#f59e0b',
      tier: 3,
      description: 'Highly respected community member',
    };
  if (points >= 200)
    return {
      points,
      label: 'Silver',
      color: '#9ca3af',
      tier: 2,
      description: 'Established developer with proven contributions',
    };
  if (points >= 50)
    return {
      points,
      label: 'Bronze',
      color: '#cd7f32',
      tier: 1,
      description: 'Actively contributing to the community',
    };
  return {
    points,
    label: 'Newcomer',
    color: '#71717a',
    tier: 0,
    description: 'Just getting started on the platform',
  };
}

interface ReputationBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
  showLabel?: boolean;
}

export function ReputationBadge({
  points,
  size = 'md',
  showPoints = false,
  showLabel = false,
}: ReputationBadgeProps) {
  const rank = getReputationRank(points);

  const sizes = {
    sm: { container: 'gap-1 px-1.5 py-0.5', label: 'text-[10px]', dot: 'w-1.5 h-1.5' },
    md: { container: 'gap-1 px-2 py-1', label: 'text-[10px]', dot: 'w-2 h-2' },
    lg: { container: 'gap-1.5 px-2.5 py-1', label: 'text-xs', dot: 'w-2 h-2' },
  };

  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center ${s.container} rounded-full font-mono`}
      style={{
        background: `${rank.color}14`,
        border: `1px solid ${rank.color}35`,
        color: rank.color,
      }}
      title={`${rank.label} · ${points.toLocaleString()} reputation points`}
    >
      {/* Tier indicator: filled dots */}
      <span
        className={`${s.dot} rounded-full flex-shrink-0`}
        style={{ background: rank.color, opacity: 0.85 }}
      />
      {showLabel && <span className={s.label}>{rank.label}</span>}
      {showPoints && (
        <span className={s.label}>
          {points >= 1000 ? `${(points / 1000).toFixed(1)}k` : points}
        </span>
      )}
    </span>
  );
}
