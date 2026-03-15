import React from 'react';

interface BoltyLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export function BoltyLogo({ className = '', size = 40, color = 'currentColor' }: BoltyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Lightning bolt — filled */}
      <path
        d="M29 3 L11 41 L24 41 L7 73 L46 30 L33 30 Z"
        fill={color}
      />
      {/* Git branch — vertical stem */}
      <line x1="52" y1="58" x2="52" y2="30" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      {/* Git branch — upper-right branch */}
      <line x1="52" y1="30" x2="67" y2="13" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      {/* Git branch — right branch */}
      <line x1="52" y1="42" x2="70" y2="42" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      {/* Git node circles */}
      <circle cx="68" cy="11" r="5.5" fill="none" stroke={color} strokeWidth="5" />
      <circle cx="73" cy="42" r="5.5" fill="none" stroke={color} strokeWidth="5" />
    </svg>
  );
}

export function BoltyLogoGlow({ size = 40 }: { size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-60 blur-md"
        style={{ background: 'radial-gradient(circle, rgba(131,110,249,0.6) 0%, transparent 70%)' }}
      />
      <BoltyLogo size={size} color="#836EF9" className="relative z-10" />
    </div>
  );
}
