'use client';

import React from 'react';
import { ReactNode, Children } from 'react';

interface ScrollVelocityRowProps {
  children: ReactNode;
  duration?: number;
}

export function ScrollVelocityRow({ children, duration = 30 }: ScrollVelocityRowProps) {
  const childrenArray = Children.toArray(children);
  const lastChild = childrenArray[childrenArray.length - 1];

  return (
    <div className="flex overflow-hidden w-full">
      <div
        className="flex flex-shrink-0 animate-scroll"
        style={{
          animationDuration: `${duration}s`,
          animation: `scroll-x ${duration}s linear infinite`,
          gap: '64px',
        }}
      >
        {children}
      </div>
      <div
        className="flex flex-shrink-0 animate-scroll"
        style={{
          animationDuration: `${duration}s`,
          animation: `scroll-x ${duration}s linear infinite`,
          gap: '64px',
        }}
        aria-hidden
      >
        {children}
      </div>
    </div>
  );
}
