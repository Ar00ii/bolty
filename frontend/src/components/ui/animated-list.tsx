'use client';

import React, { Children, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export function AnimatedList({
  children,
  className,
  delay = 900,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [index, setIndex] = useState(0);
  const childrenArray = Children.toArray(children);

  useEffect(() => {
    if (index < childrenArray.length - 1) {
      const timer = setTimeout(() => setIndex((prev) => prev + 1), delay);
      return () => clearTimeout(timer);
    }
  }, [index, delay, childrenArray.length]);

  const visible = childrenArray.slice(0, index + 1).reverse();

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {visible.map((item, i) => (
        <div
          key={(item as React.ReactElement).key ?? i}
          className="w-full"
          style={{ animation: 'listSlideIn 0.3s ease both' }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
