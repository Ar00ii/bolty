'use client';

import { ReactNode } from 'react';

interface ScrollVelocityRowProps {
  children: ReactNode;
  duration?: number;
}

export function ScrollVelocityRow({
  children,
  duration = 30,
}: ScrollVelocityRowProps) {
  return (
    <div className="flex overflow-hidden w-full">
      <div
        className="flex gap-24 flex-shrink-0 animate-scroll"
        style={{ animationDuration: `${duration}s` }}
      >
        {children}
      </div>
      <div
        className="flex gap-24 flex-shrink-0 animate-scroll"
        style={{ animationDuration: `${duration}s` }}
        aria-hidden
      >
        {children}
      </div>
    </div>
  );
}
