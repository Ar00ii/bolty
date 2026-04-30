'use client';

import React from 'react';

import { getReputationRank } from './reputation-badge';

interface AvatarWithRankProps {
  src?: string | null;
  name?: string | null;
  reputationPoints?: number | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showRank?: boolean;
  rounded?: 'full' | 'lg';
}

const SIZES = {
  xs: { box: 24, text: 'text-[10px]' },
  sm: { box: 32, text: 'text-xs' },
  md: { box: 40, text: 'text-sm' },
  lg: { box: 56, text: 'text-base' },
  xl: { box: 96, text: 'text-2xl' },
} as const;

export function AvatarWithRank({
  src,
  name,
  reputationPoints,
  size = 'md',
  showRank = true,
  rounded = 'full',
}: AvatarWithRankProps) {
  const s = SIZES[size];
  const rank = getReputationRank(reputationPoints ?? 0);
  const RankIcon = rank.icon;
  const radius = rounded === 'full' ? '9999px' : '12px';

  const initials = (name || 'U')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span className="relative inline-flex flex-col items-center" style={{ width: s.box }}>
      <span
        className="relative grid place-items-center overflow-hidden flex-shrink-0"
        style={{
          width: s.box,
          height: s.box,
          borderRadius: radius,
          border: '1px solid rgba(255,255,255,0.1)',
          background: src
            ? undefined
            : 'linear-gradient(135deg, rgba(236,72,153,0.45), rgba(20, 241, 149,0.55))',
          color: 'white',
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className={s.text}>{initials}</span>
        )}
        {showRank && reputationPoints !== undefined && reputationPoints !== null && (
          <span
            className="absolute"
            style={{
              right: -2,
              bottom: -2,
              width: Math.max(14, Math.round(s.box * 0.32)),
              height: Math.max(14, Math.round(s.box * 0.32)),
              borderRadius: '9999px',
              background: '#0a0a0e',
              border: `1.5px solid ${rank.color}`,
              boxShadow: `0 0 0 1.5px #0a0a0e, 0 0 8px -1px ${rank.color}88`,
              display: 'grid',
              placeItems: 'center',
            }}
            title={`${rank.label} · ${reputationPoints.toLocaleString()} rays`}
          >
            <RankIcon
              style={{
                color: rank.color,
                width: Math.max(8, Math.round(s.box * 0.18)),
                height: Math.max(8, Math.round(s.box * 0.18)),
              }}
              strokeWidth={2}
              aria-hidden="true"
            />
          </span>
        )}
      </span>
      {showRank && reputationPoints !== undefined && reputationPoints !== null && size !== 'xs' && (
        <span
          className="mt-1 px-1.5 py-[1px] rounded-full font-mono whitespace-nowrap"
          style={{
            fontSize: size === 'xl' ? 11 : 9.5,
            background: `${rank.color}12`,
            color: rank.color,
            border: `1px solid ${rank.color}38`,
            letterSpacing: '0.04em',
          }}
        >
          {rank.label.toUpperCase()}
        </span>
      )}
    </span>
  );
}

export default AvatarWithRank;
