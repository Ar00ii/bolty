'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { ReactNode } from 'react';

interface AnimatedHeadingProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  gradient?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  delay?: number;
  className?: string;
}

export function AnimatedHeading({
  children,
  as: Component = 'h1',
  gradient = true,
  gradientFrom = '#a78bfa',
  gradientTo = '#06b6d4',
  delay = 0,
  className = '',
}: AnimatedHeadingProps) {
  const gradientStyle = gradient
    ? {
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <Component className={`font-light ${className}`} style={gradientStyle}>
        {children}
      </Component>
    </motion.div>
  );
}

// Word-by-word reveal animation
interface WordRevealProps {
  text: string;
  delay?: number;
  className?: string;
  gradient?: boolean;
  highlightWords?: string[];
}

export function WordReveal({
  text,
  delay = 0,
  className = '',
  gradient = false,
  highlightWords = [],
}: WordRevealProps) {
  const words = text.split(' ');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.6 }}
      className={className}
    >
      {words.map((word, idx) => {
        const isHighlight = highlightWords.some((hw) => hw.toLowerCase() === word.toLowerCase());

        return (
          <motion.span
            key={`${word}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: delay + idx * 0.05,
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={
              isHighlight
                ? 'font-light text-transparent bg-clip-text bg-gradient-to-r from-atlas-400 to-cyan-400'
                : ''
            }
          >
            {word}{' '}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

// Char-by-char reveal animation
interface CharRevealProps {
  text: string;
  delay?: number;
  className?: string;
  duration?: number;
}

export function CharReveal({ text, delay = 0, className = '', duration = 0.02 }: CharRevealProps) {
  const chars = text.split('');

  return (
    <span className={className}>
      {chars.map((char, idx) => (
        <motion.span
          key={`${char}-${idx}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: delay + idx * duration,
            duration: 0.3,
            ease: 'easeOut',
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
