'use client';
import React from 'react';

// Individual shape configs: top%, left%, size, animClass, opacity, rotate
const SHAPES: Array<{
  top: string;
  left: string;
  size: number;
  anim: string;
  opacity: number;
  delay: string;
  duration: string;
  type: 'hex' | 'tri' | 'diamond' | 'ring' | 'dot' | 'cross';
}> = [
  {
    top: '8%',
    left: '5%',
    size: 80,
    anim: 'geo-float-a',
    opacity: 0.07,
    delay: '0s',
    duration: '18s',
    type: 'hex',
  },
  {
    top: '15%',
    left: '88%',
    size: 60,
    anim: 'geo-float-b',
    opacity: 0.08,
    delay: '3s',
    duration: '22s',
    type: 'tri',
  },
  {
    top: '45%',
    left: '2%',
    size: 45,
    anim: 'geo-float-c',
    opacity: 0.06,
    delay: '6s',
    duration: '26s',
    type: 'diamond',
  },
  {
    top: '70%',
    left: '92%',
    size: 90,
    anim: 'geo-float-a',
    opacity: 0.05,
    delay: '1.5s',
    duration: '20s',
    type: 'hex',
  },
  {
    top: '85%',
    left: '12%',
    size: 55,
    anim: 'geo-float-b',
    opacity: 0.07,
    delay: '4.5s',
    duration: '24s',
    type: 'ring',
  },
  {
    top: '30%',
    left: '95%',
    size: 40,
    anim: 'geo-float-c',
    opacity: 0.09,
    delay: '2s',
    duration: '19s',
    type: 'tri',
  },
  {
    top: '60%',
    left: '50%',
    size: 120,
    anim: 'geo-float-a',
    opacity: 0.04,
    delay: '8s',
    duration: '30s',
    type: 'hex',
  },
  {
    top: '5%',
    left: '55%',
    size: 35,
    anim: 'geo-float-b',
    opacity: 0.08,
    delay: '5s',
    duration: '16s',
    type: 'dot',
  },
  {
    top: '92%',
    left: '60%',
    size: 50,
    anim: 'geo-float-c',
    opacity: 0.06,
    delay: '7s',
    duration: '21s',
    type: 'diamond',
  },
  {
    top: '38%',
    left: '20%',
    size: 30,
    anim: 'geo-float-a',
    opacity: 0.1,
    delay: '3.5s',
    duration: '14s',
    type: 'cross',
  },
  {
    top: '20%',
    left: '40%',
    size: 70,
    anim: 'geo-float-b',
    opacity: 0.05,
    delay: '9s',
    duration: '28s',
    type: 'ring',
  },
  {
    top: '75%',
    left: '35%',
    size: 42,
    anim: 'geo-float-c',
    opacity: 0.07,
    delay: '1s',
    duration: '17s',
    type: 'tri',
  },
  {
    top: '50%',
    left: '75%',
    size: 65,
    anim: 'geo-float-a',
    opacity: 0.06,
    delay: '10s',
    duration: '25s',
    type: 'hex',
  },
  {
    top: '10%',
    left: '72%',
    size: 28,
    anim: 'geo-float-b',
    opacity: 0.09,
    delay: '6.5s',
    duration: '15s',
    type: 'dot',
  },
  {
    top: '55%',
    left: '15%',
    size: 85,
    anim: 'geo-float-c',
    opacity: 0.04,
    delay: '11s',
    duration: '32s',
    type: 'hex',
  },
  {
    top: '25%',
    left: '62%',
    size: 38,
    anim: 'geo-float-a',
    opacity: 0.08,
    delay: '2.5s',
    duration: '20s',
    type: 'cross',
  },
];

function HexShape({ size, color }: { size: number; color: string }) {
  const r = size / 2;
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function TriShape({ size, color }: { size: number; color: string }) {
  const h = size * 0.866;
  return (
    <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`}>
      <polygon
        points={`${size / 2},0 ${size},${h} 0,${h}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function DiamondShape({ size, color }: { size: number; color: string }) {
  const h = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon
        points={`${h},0 ${size},${h} ${h},${size} 0,${h}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RingShape({ size, color }: { size: number; color: string }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={c}
        cy={c}
        r={c - 4}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
    </svg>
  );
}

function DotShape({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={size / 4} fill={color} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}

function CrossShape({ size, color }: { size: number; color: string }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <line x1={c} y1="0" x2={c} y2={size} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1={c} x2={size} y2={c} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={c} cy={c} r="3" fill={color} />
    </svg>
  );
}

const COLOR = 'rgba(131,110,249,1)';

export function GeometricBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {SHAPES.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            opacity: s.opacity,
            animation: `${s.anim} ${s.duration} ${s.delay} ease-in-out infinite`,
          }}
        >
          {s.type === 'hex' && <HexShape size={s.size} color={COLOR} />}
          {s.type === 'tri' && <TriShape size={s.size} color={COLOR} />}
          {s.type === 'diamond' && <DiamondShape size={s.size} color={COLOR} />}
          {s.type === 'ring' && <RingShape size={s.size} color={COLOR} />}
          {s.type === 'dot' && <DotShape size={s.size} color={COLOR} />}
          {s.type === 'cross' && <CrossShape size={s.size} color={COLOR} />}
        </div>
      ))}

      {/* Circuit-board connecting lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.03 }}>
        <defs>
          <pattern id="circuit" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <path
              d="M0 100 L60 100 L60 40 L140 40 L140 100 L200 100"
              fill="none"
              stroke="rgba(131,110,249,1)"
              strokeWidth="1"
            />
            <path
              d="M100 0 L100 60 L160 60"
              fill="none"
              stroke="rgba(131,110,249,1)"
              strokeWidth="1"
            />
            <circle cx="60" cy="100" r="3" fill="rgba(131,110,249,1)" />
            <circle cx="140" cy="40" r="3" fill="rgba(131,110,249,1)" />
            <circle cx="100" cy="60" r="3" fill="rgba(131,110,249,1)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>
    </div>
  );
}
