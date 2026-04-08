'use client';

import { ReactNode, Children } from 'react';

interface ScrollVelocityRowProps {
  children: ReactNode;
  duration?: number;
}

export function ScrollVelocityRow({
  children,
  duration = 30,
}: ScrollVelocityRowProps) {
  const childrenArray = Children.toArray(children);
  const lastChild = childrenArray[childrenArray.length - 1];

  return (
    <div className="flex overflow-hidden w-full">
      <div
        className="flex gap-32 flex-shrink-0 animate-scroll"
        style={{
          animationDuration: `${duration}s`,
          animation: `scroll-x ${duration}s linear infinite`
        }}
      >
        {children}
      </div>
      <div
        className="flex gap-32 flex-shrink-0 animate-scroll"
        style={{
          animationDuration: `${duration}s`,
          animation: `scroll-x ${duration}s linear infinite`
        }}
        aria-hidden
      >
        {children}
      </div>
    </div>
  );
}
