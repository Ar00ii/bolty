'use client';

import React, { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface StaticWarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  perspective?: number;
  beamSize?: number;
  gridColor?: string;
}

export const StaticWarpBackground: React.FC<StaticWarpBackgroundProps> = ({
  children,
  perspective = 100,
  className,
  beamSize = 5,
  gridColor = 'rgba(255, 255, 255, 0.08)',
  ...props
}) => {
  return (
    <div className={cn('relative rounded-xl border overflow-hidden', className)} {...props}>
      <div
        className="pointer-events-none absolute top-0 left-0 size-full overflow-hidden [clipPath:inset(0)]"
        style={
          {
            '--perspective': `${perspective}px`,
            '--grid-color': gridColor,
            '--beam-size': `${beamSize}%`,
            perspective: `${perspective}px`,
          } as React.CSSProperties
        }
      >
        {/* top side - static grid */}
        <div
          className="absolute z-20 h-full w-full origin-[50%_0%]"
          style={{
            transform: 'rotateX(-90deg)',
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: 'center',
          }}
        />

        {/* bottom side - static grid */}
        <div
          className="absolute z-10 h-full w-full origin-[50%_100%]"
          style={{
            transform: 'rotateX(-90deg) translateZ(-100%)',
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: 'center',
            opacity: 0.5,
          }}
        />

        {/* left side - static grid */}
        <div
          className="absolute z-20 h-full w-full origin-[0%_0%]"
          style={{
            transform: 'rotateY(90deg)',
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: 'center',
            opacity: 0.6,
          }}
        />

        {/* right side - static grid */}
        <div
          className="absolute z-20 h-full w-full origin-[100%_0%]"
          style={{
            transform: 'rotateY(-90deg)',
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: 'center',
            opacity: 0.6,
          }}
        />

        {/* Fade effect */}
        <div
          className="absolute inset-0 z-30"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(10, 10, 10, 0.8) 100%)',
          }}
        />
      </div>

      <div className="relative z-40">{children}</div>
    </div>
  );
};
