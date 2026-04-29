'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export function BorderBeam({
  size = 180,
  duration = 12,
  colorFrom = '#14F195',
  colorTo = '#a7f3d0',
  borderWidth = 1,
  delay = 0,
  className,
}: {
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      style={
        {
          '--size': size,
          '--duration': duration,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--border-width': borderWidth,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        '[border:calc(var(--border-width)*1px)_solid_transparent]',
        '![mask-clip:padding-box,border-box]',
        '![mask-composite:intersect]',
        '[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
        'after:absolute after:aspect-square',
        'after:w-[calc(var(--size)*1px)]',
        'after:animate-[borderBeam_calc(var(--duration)*1s)_linear_infinite]',
        'after:[animation-delay:var(--delay)]',
        'after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]',
        'after:[offset-anchor:90%_50%]',
        'after:[offset-path:rect(0_auto_auto_0_round_16px)]',
        className,
      )}
    />
  );
}
