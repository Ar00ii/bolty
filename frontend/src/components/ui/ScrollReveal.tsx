'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.5,
  className = '',
}: ScrollRevealProps) {
  const directionMap = {
    up: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } },
    down: { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } },
  };

  const variants = directionMap[direction];

  return (
    <motion.div
      initial={variants.initial}
      whileInView={variants.animate}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for animating multiple children
interface ScrollStaggerProps {
  children: ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

export function ScrollStagger({
  children,
  delay = 0,
  staggerDelay = 0.1,
  className = '',
}: ScrollStaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual item for use inside ScrollStagger
interface ScrollItemProps {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function ScrollItem({ children, direction = 'up', className = '' }: ScrollItemProps) {
  const directionMap = {
    up: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
    down: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
  };

  const variants = directionMap[direction];

  return (
    <motion.div
      variants={{
        hidden: variants.initial,
        visible: {
          ...variants.animate,
          transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
