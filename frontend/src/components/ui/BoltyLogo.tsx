import React from 'react';

interface BoltyLogoProps {
  className?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function BoltyLogo({ className = '', size = 40, color = 'currentColor', style }: BoltyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* ── Lightning bolt (filled) ── */}
      <path
        d="M30 7 L10 50 L25 50 L14 91 L53 38 L37 38 Z"
        fill={color}
      />

      {/* ── Git branch lines — junction at (61, 44) ── */}
      {/* Vertical: junction → top circle */}
      <line x1="61" y1="44" x2="61" y2="28" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      {/* Diagonal up-right: junction → upper-right circle */}
      <line x1="61" y1="44" x2="79" y2="30" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      {/* Diagonal down-right: junction → lower-right circle */}
      <line x1="61" y1="44" x2="78" y2="67" stroke={color} strokeWidth="4.5" strokeLinecap="round" />

      {/* ── Git circles (hollow) ── */}
      {/* Top circle */}
      <circle cx="61" cy="19" r="7" fill="none" stroke={color} strokeWidth="4.5" />
      {/* Upper-right circle */}
      <circle cx="82" cy="24" r="7" fill="none" stroke={color} strokeWidth="4.5" />
      {/* Lower-right circle */}
      <circle cx="81" cy="72" r="7" fill="none" stroke={color} strokeWidth="4.5" />
    </svg>
  );
}

export function BoltyLogoGlow({ size = 40 }: { size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full opacity-60 blur-md"
        style={{ background: 'radial-gradient(circle, rgba(131,110,249,0.6) 0%, transparent 70%)' }}
      />
      <BoltyLogo size={size} color="#836EF9" className="relative z-10" />
    </div>
  );
}
