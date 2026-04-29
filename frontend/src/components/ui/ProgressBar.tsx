'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { useEffect, useState } from 'react';

interface ProgressBarProps {
  isLoading: boolean;
  duration?: number;
  color?: string;
}

export function ProgressBar({
  isLoading,
  duration = 3,
  color = 'from-atlas-500 to-cyan-400',
}: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timer);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 30;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <motion.div
      className={`fixed top-0 left-0 h-[2px] bg-gradient-to-r ${color} z-[9999] pointer-events-none`}
      animate={{ width: `${progress}%`, opacity: isLoading || progress > 0 ? 1 : 0 }}
      transition={{ width: { duration: 0.35, ease: 'easeOut' }, opacity: { duration: 0.3 } }}
      style={{
        boxShadow: '0 0 10px rgba(20,241,149,0.55), 0 0 20px rgba(20,241,149,0.25)',
      }}
    >
      {/* Leading glow */}
      <div
        className="absolute right-0 top-0 h-full w-24 blur-xl opacity-70"
        style={{
          background: 'linear-gradient(90deg, transparent, currentColor)',
        }}
      />
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-y-0 w-24"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          mixBlendMode: 'overlay',
        }}
        animate={{ x: ['-100%', '400%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}
