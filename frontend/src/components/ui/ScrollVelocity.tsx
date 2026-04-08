'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollVelocityRowProps {
  children: ReactNode;
  baseVelocity: number;
  direction: 1 | -1;
}

export function ScrollVelocityRow({
  children,
  baseVelocity,
  direction,
}: ScrollVelocityRowProps) {
  return (
    <motion.div
      className="flex whitespace-nowrap gap-8"
      initial={{ x: direction === 1 ? 0 : 0 }}
      animate={{ x: direction === 1 ? -2000 : 2000 }}
      transition={{
        duration: 80 / baseVelocity,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'linear',
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-8 flex-shrink-0">
          {children}
        </div>
      ))}
    </motion.div>
  );
}

interface ScrollVelocityContainerProps {
  children: ReactNode;
  className?: string;
}

export function ScrollVelocityContainer({
  children,
  className = '',
}: ScrollVelocityContainerProps) {
  return (
    <div className={`flex flex-col gap-6 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

