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
    <div className={`inline-flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(131,110,249,0.14) 0%, rgba(107,79,224,0.06) 100%)',
        border: '1px solid rgba(131,110,249,0.3)',
        boxShadow: '0 0 24px rgba(131,110,249,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo icon - big and prominent with glow */}
      <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
        <div
          className="absolute -inset-1 rounded-xl blur-lg opacity-50"
          style={{ background: 'rgba(131,110,249,0.6)' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bolty-logo.png"
          alt="Bolty"
          width={36}
          height={36}
          className="relative z-10"
          style={{
            display: 'block',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 8px rgba(131,110,249,0.6)) brightness(1.1)',
          }}
        />
      </div>
      {/* Brand text */}
      <span
        className="text-base font-bold tracking-tight"
        style={{
          background: 'linear-gradient(135deg, #e0d4ff 0%, #836EF9 40%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 10px rgba(131,110,249,0.35))',
        }}
      >
        BoltyNetwork
      </span>
    </div>
  );
}
