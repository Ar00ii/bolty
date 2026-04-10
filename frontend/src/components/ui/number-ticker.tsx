'use client';

import { useInView, useMotionValue, useSpring } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export function NumberTicker({
  value,
  suffix = '',
  prefix = '',
  direction = 'up',
  delay = 0,
  decimalPlaces = 0,
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  direction?: 'up' | 'down';
  delay?: number;
  decimalPlaces?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => {
      motionValue.set(direction === 'down' ? 0 : value);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent =
          prefix +
          Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces))) +
          suffix;
      }
    });
  }, [springValue, decimalPlaces, prefix, suffix]);

  return (
    <span ref={ref} className={cn('inline-block tabular-nums', className)}>
      {prefix}0{suffix}
    </span>
  );
}
