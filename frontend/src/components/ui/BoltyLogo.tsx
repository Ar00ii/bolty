import React from 'react';

interface BoltyLogoProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  /** @deprecated – kept for backward compat, has no effect */
  color?: string;
}

/** SVG logo — lightning bolt inside rounded square, always crisp */
function BoltyLogoSVG({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square outline */}
      <rect x="8" y="8" width="84" height="84" rx="22" ry="22"
        stroke="#836EF9" strokeWidth="5" fill="none" />
      {/* Lightning bolt */}
      <path
        d="M56 16 L36 52 L48 52 L42 84 L68 44 L54 44 L62 16 Z"
        fill="#836EF9"
      />
    </svg>
  );
}

export function BoltyLogo({ className = '', size = 40, style }: BoltyLogoProps) {
  return (
    <div className={className} style={{ width: size, height: size, display: 'inline-flex', ...style }}>
      <BoltyLogoSVG size={size} />
    </div>
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
      <BoltyLogo size={size} style={{ position: 'relative', zIndex: 10 }} />
    </div>
  );
}

/** Badge-style logo — icon + BoltyNetwork text */
export function BoltyBrandBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(131,110,249,0.12) 0%, rgba(107,79,224,0.05) 100%)',
        border: '1px solid rgba(131,110,249,0.3)',
        boxShadow: '0 0 20px rgba(131,110,249,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo icon with glow */}
      <div className="relative flex-shrink-0">
        <div
          className="absolute -inset-1.5 rounded-xl blur-md opacity-40"
          style={{ background: 'rgba(131,110,249,0.7)' }}
        />
        <BoltyLogoSVG size={32} className="relative z-10 drop-shadow-[0_0_8px_rgba(131,110,249,0.5)]" />
      </div>
      {/* Brand text */}
      <span
        className="text-[15px] font-bold tracking-tight"
        style={{
          background: 'linear-gradient(135deg, #e0d4ff 0%, #836EF9 50%, #a78bfa 100%)',
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
