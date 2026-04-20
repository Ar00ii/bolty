'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  shape?: 'rect' | 'circle' | 'card' | 'text' | 'table-row';
  width?: string;
  height?: string;
  className?: string;
}

const FADE_EASE = [0.22, 0.61, 0.36, 1] as const;

export function SkeletonLoader({
  count = 1,
  shape = 'rect',
  width = '100%',
  height = '20px',
  className = '',
}: SkeletonLoaderProps) {
  const shapes = {
    circle: (
      <div
        key={0}
        className={`skeleton rounded-full ${className}`}
        style={{ width: height, height, minWidth: height }}
      />
    ),
    rect: <div key={0} className={`skeleton rounded-lg ${className}`} style={{ width, height }} />,
    text: Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className={`skeleton rounded-lg ${className}`}
        style={{ height: '16px', marginBottom: i < 2 ? '8px' : '0' }}
      />
    )),
    card: (
      <div
        key={0}
        className={`skeleton rounded-lg p-4 space-y-3 ${className}`}
        style={{ width, height: '200px' }}
      >
        <div className="skeleton rounded-lg h-12" />
        <div className="skeleton rounded-lg h-4" />
        <div className="skeleton rounded-lg h-4 w-3/4" />
      </div>
    ),
    'table-row': (
      <div
        key={0}
        className={`skeleton rounded-lg h-12 ${className}`}
        style={{ width, display: 'flex', gap: '16px' }}
      >
        <div className="skeleton rounded-lg flex-1 h-full" />
        <div className="skeleton rounded-lg flex-1 h-full" />
        <div className="skeleton rounded-lg flex-1 h-full" />
      </div>
    ),
  };

  const elements = [];
  for (let i = 0; i < count; i++) {
    const content =
      shape === 'text' || shape === 'card' ? (
        shapes[shape]
      ) : (
        <div className="mb-3">{shapes[shape]}</div>
      );
    elements.push(
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(i * 0.035, 0.25), duration: 0.24, ease: FADE_EASE }}
      >
        {content}
      </motion.div>,
    );
  }

  return <div className="space-y-2">{elements}</div>;
}

// Pre-built loaders for common use cases
export function CardSkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.28, ease: FADE_EASE }}
          className="skeleton rounded-lg h-64"
        />
      ))}
    </div>
  );
}

export function ListSkeletonLoader({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.22, ease: FADE_EASE }}
          className="skeleton rounded-lg h-12"
        />
      ))}
    </div>
  );
}

export function TableSkeletonLoader({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.035, 0.25), duration: 0.22, ease: FADE_EASE }}
          className="flex gap-3"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton rounded-lg flex-1 h-12" />
          ))}
        </motion.div>
      ))}
    </div>
  );
}
