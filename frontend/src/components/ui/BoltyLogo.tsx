import React from 'react';

interface BoltyLogoProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  /** @deprecated – kept for backward compat, has no effect */
  color?: string;
}

export function BoltyLogo({ className = '', size = 40, style }: BoltyLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/bolty-logo.png"
      alt="Bolty"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain', ...style }}
    />
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

/** Badge-style logo like "Powered by Solana" - icon + BoltyNetwork text */
export function BoltyBrandBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(131,110,249,0.12) 0%, rgba(107,79,224,0.08) 100%)',
        border: '1px solid rgba(131,110,249,0.25)',
        boxShadow: '0 0 20px rgba(131,110,249,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo icon with glow */}
      <div className="relative flex-shrink-0">
        <div
          className="absolute inset-0 rounded-lg blur-md opacity-60"
          style={{ background: 'rgba(131,110,249,0.5)' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bolty-logo.png"
          alt="Bolty"
          width={28}
          height={28}
          className="relative z-10 rounded-lg"
          style={{ display: 'block', objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(131,110,249,0.5))' }}
        />
      </div>
      {/* Brand text */}
      <span
        className="text-[15px] font-bold tracking-tight"
        style={{
          background: 'linear-gradient(135deg, #c4b5fd 0%, #836EF9 50%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 8px rgba(131,110,249,0.3))',
        }}
      >
        BoltyNetwork
      </span>
    </div>
  );
}
