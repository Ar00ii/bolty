'use client';

import { Crown, Gem, Hammer, Medal, Star, Trophy, type LucideIcon } from 'lucide-react';
import React from 'react';

export interface ReputationInfo {
  points: number;
  label: string;
  icon: LucideIcon;
  color: string;
  tier: number; // 0–7 for bar fill
  description?: string;
  threshold: number;
}

export interface RankDefinition {
  rank:
    | 'HIERRO'
    | 'BRONCE'
    | 'PLATA'
    | 'ORO'
    | 'PLATINO'
    | 'DIAMANTE'
    | 'MAESTRIA'
    | 'CAMPEON'
    | 'LEYENDA';
  label: string;
  icon: LucideIcon;
  color: string;
  threshold: number;
  description: string;
}

// New 8-tier rank system, in ascending order (matches backend rays.service.ts).
// Note: `rank` enum keys stay in Spanish because they mirror the backend Prisma
// schema and DB migrations — only the user-facing `label` is localized.
export const RANK_TIERS: RankDefinition[] = [
  {
    rank: 'HIERRO',
    label: 'Iron',
    icon: Hammer,
    color: '#78716c',
    threshold: 0,
    description: 'Just getting started on the platform',
  },
  {
    rank: 'BRONCE',
    label: 'Bronze',
    icon: Medal,
    color: '#cd7f32',
    threshold: 25,
    description: 'Actively contributing to the community',
  },
  {
    rank: 'PLATA',
    label: 'Silver',
    icon: Medal,
    color: '#9ca3af',
    threshold: 50,
    description: 'Established developer with proven contributions',
  },
  {
    rank: 'ORO',
    label: 'Gold',
    icon: Medal,
    color: '#f59e0b',
    threshold: 120,
    description: 'Highly respected community member',
  },
  {
    rank: 'PLATINO',
    label: 'Platinum',
    icon: Star,
    color: '#a855f7',
    threshold: 250,
    description: 'Elite developer with exceptional track record',
  },
  {
    rank: 'DIAMANTE',
    label: 'Diamond',
    icon: Gem,
    color: '#38bdf8',
    threshold: 500,
    description: 'Top-tier contributor trusted by thousands',
  },
  {
    rank: 'MAESTRIA',
    label: 'Master',
    icon: Crown,
    color: '#ec4899',
    threshold: 1000,
    description: 'Master of the craft — exceptional standing',
  },
  {
    rank: 'CAMPEON',
    label: 'Champion',
    icon: Trophy,
    color: '#836ef9',
    threshold: 2000,
    description: 'Champion — reserved for the top 5 of the ecosystem',
  },
  {
    rank: 'LEYENDA',
    label: 'Legend',
    icon: Crown,
    color: '#fbbf24',
    threshold: 5000,
    description: 'Legend — only a handful of builders ever reach this rank',
  },
];

export function getReputationRank(rays: number): ReputationInfo {
  let current = RANK_TIERS[0];
  let tier = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (rays >= RANK_TIERS[i].threshold) {
      current = RANK_TIERS[i];
      tier = i;
    }
  }
  return {
    points: rays,
    label: current.label,
    icon: current.icon,
    color: current.color,
    tier,
    description: current.description,
    threshold: current.threshold,
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
  const Icon = rank.icon;

  const sizes = {
    sm: { container: 'gap-1 px-1.5 py-0.5', label: 'text-[10px]', icon: 'w-3 h-3' },
    md: { container: 'gap-1 px-2 py-1', label: 'text-[10px]', icon: 'w-3.5 h-3.5' },
    lg: { container: 'gap-1.5 px-2.5 py-1', label: 'text-xs', icon: 'w-4 h-4' },
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
      title={`${rank.label} · ${points.toLocaleString()} rays`}
    >
      <Icon
        className={`${s.icon} flex-shrink-0`}
        strokeWidth={1.75}
        style={{ color: rank.color }}
        aria-hidden="true"
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
