'use client';

import { motion } from 'motion/react';
import React, { HTMLAttributes, useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';

interface WarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  perspective?: number;
  beamsPerSide?: number;
  beamSize?: number;
  beamDelayMax?: number;
  beamDelayMin?: number;
  beamDuration?: number;
  gridColor?: string;
}

const Beam = ({
  width,
  x,
  delay,
  duration,
  hue,
  ar,
}: {
  width: string | number;
  x: string | number;
  delay: number;
  duration: number;
  hue: number;
  ar: number;
}) => {
  return (
    <motion.div
      style={
        {
          '--x': `${x}`,
          '--width': `${width}`,
          '--aspect-ratio': `${ar}`,
          '--background': `linear-gradient(hsl(${hue} 80% 60%), transparent)`,
        } as React.CSSProperties
      }
      className={
        'absolute top-0 left-[var(--x)] aspect-[1/var(--aspect-ratio)] w-[var(--width)] [background:var(--background)]'
      }
      initial={{ y: '100cqmax', x: '-50%' }}
      animate={{ y: '-100%', x: '-50%' }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

export const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 100,
  className,
  beamsPerSide = 3,
  beamSize = 5,
  beamDelayMax = 3,
  beamDelayMin = 0,
  beamDuration = 3,
  gridColor = 'rgba(255, 255, 255, 0.2)',
  ...props
}) => {
  const generateBeams = useCallback(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const beams = [];
    const cellsPerSide = Math.floor(100 / beamSize);
    const step = cellsPerSide / beamsPerSide;

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < beamsPerSide; i++) {
      const x = Math.floor(i * step);
      const delay = Math.random() * (beamDelayMax - beamDelayMin) + beamDelayMin;
      const hue = Math.floor(Math.random() * 360);
      const ar = Math.floor(Math.random() * 10) + 1;
      beams.push({ x, delay, hue, ar });
    }
    return beams;
  }, [beamsPerSide, beamSize, beamDelayMax, beamDelayMin]);

  const topBeams = useMemo(() => generateBeams(), [generateBeams]);
  const rightBeams = useMemo(() => generateBeams(), [generateBeams]);
  const bottomBeams = useMemo(() => generateBeams(), [generateBeams]);
  const leftBeams = useMemo(() => generateBeams(), [generateBeams]);

  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
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
        {/* top side */}
        <div
          className="@container absolute z-20 h-[100cqmax] w-[100cqi] origin-[50%_0%] overflow-hidden"
          style={{
            transform: 'rotateX(-90deg)',
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: '50% -0.5px',
          }}
        >
          {topBeams.map((beam, index) => (
            <Beam
              key={`top-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              hue={beam.hue}
              ar={beam.ar}
            />
          ))}
        </div>
        {/* bottom side */}
        <div
          className="@container absolute top-full z-20 h-[100cqmax] w-[100cqi] origin-[50%_0%] overflow-hidden"
          style={{
            transform: 'rotateX(-90deg)',
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: '50% -0.5px',
          }}
        >
          {bottomBeams.map((beam, index) => (
            <Beam
              key={`bottom-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              hue={beam.hue}
              ar={beam.ar}
            />
          ))}
        </div>
        {/* left side */}
        <div
          className="@container absolute top-0 left-0 z-20 h-[100cqmax] w-[100cqh] origin-[0%_0%] overflow-hidden"
          style={{
            transform: 'rotate(90deg) rotateX(-90deg)',
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: '50% -0.5px',
          }}
        >
          {leftBeams.map((beam, index) => (
            <Beam
              key={`left-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              hue={beam.hue}
              ar={beam.ar}
            />
          ))}
        </div>
        {/* right side */}
        <div
          className="@container absolute top-0 right-0 z-20 h-[100cqmax] w-[100cqh] origin-[100%_0%] overflow-hidden"
          style={{
            transform: 'rotate(-90deg) rotateX(-90deg)',
            backgroundImage: `
              linear-gradient(${gridColor} 0 1px, transparent 1px),
              linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px)
            `,
            backgroundSize: `${beamSize}% ${beamSize}%`,
            backgroundPosition: '50% -0.5px',
          }}
        >
          {rightBeams.map((beam, index) => (
            <Beam
              key={`right-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              hue={beam.hue}
              ar={beam.ar}
            />
          ))}
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};
