import React from 'react';

interface BoltyLogoProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  /** @deprecated colors are built into the new logo mark */
  color?: string;
}

/**
 * Bolty logo — lightning bolt + neon "B"
 * Matches the brand mark: diagonal bolt on left, outlined B on right.
 */
export function BoltyLogo({ className = '', size = 40, style }: BoltyLogoProps) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        {/* Outer glow */}
        <filter id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Subtle mid glow */}
        <filter id={`glow2-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Lightning bolt gradient */}
        <linearGradient id={`boltG-${id}`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%"   stopColor="#d8b4fe" />
          <stop offset="35%"  stopColor="#836ef9" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        {/* Highlight gradient on bolt */}
        <linearGradient id={`boltH-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ede9fe" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Lightning bolt glow halo ── */}
      <path
        d="M 55,10 L 85,10 L 57,72 L 86,72 L 24,158 L 52,90 L 24,90 Z"
        fill="#836ef9"
        opacity="0.35"
        filter={`url(#glow-${id})`}
      />

      {/* ── Lightning bolt main body ── */}
      <path
        d="M 55,10 L 85,10 L 57,72 L 86,72 L 24,158 L 52,90 L 24,90 Z"
        fill={`url(#boltG-${id})`}
      />

      {/* ── Lightning bolt highlight facet (right face) ── */}
      <path
        d="M 68,10 L 85,10 L 57,72 L 64,72 Z"
        fill={`url(#boltH-${id})`}
      />

      {/* ── B letter — outer glow layer ── */}
      <g filter={`url(#glow-${id})`} opacity="0.45">
        <line x1="102" y1="18" x2="102" y2="152" stroke="#836ef9" strokeWidth="14" strokeLinecap="round" />
        <path d="M 102,18 Q 158,18 158,50 Q 158,82 102,82" stroke="#836ef9" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 102,82 Q 168,82 168,114 Q 168,152 102,152" stroke="#836ef9" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* ── B letter — mid glow layer ── */}
      <g filter={`url(#glow2-${id})`}>
        <line x1="102" y1="18" x2="102" y2="152" stroke="#a78bfa" strokeWidth="9" strokeLinecap="round" />
        <path d="M 102,18 Q 158,18 158,50 Q 158,82 102,82" stroke="#a78bfa" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 102,82 Q 168,82 168,114 Q 168,152 102,152" stroke="#a78bfa" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* ── B letter — sharp outer outline ── */}
      <line x1="102" y1="18" x2="102" y2="152" stroke="#ede9fe" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 102,18 Q 158,18 158,50 Q 158,82 102,82" stroke="#ede9fe" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 102,82 Q 168,82 168,114 Q 168,152 102,152" stroke="#ede9fe" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* ── B letter — inner outline (creates neon double-stroke effect) ── */}
      <line x1="102" y1="18" x2="102" y2="152" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" />
      <path d="M 102,18 Q 158,18 158,50 Q 158,82 102,82" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 102,82 Q 168,82 168,114 Q 168,152 102,152" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Full-size logo with drop-shadow glow */
export function BoltyLogoGlow({ size = 40 }: { size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full opacity-50 blur-lg"
        style={{ background: 'radial-gradient(circle, rgba(131,110,249,0.7) 0%, transparent 70%)' }}
      />
      <BoltyLogo size={size} className="relative z-10" />
    </div>
  );
}
