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
