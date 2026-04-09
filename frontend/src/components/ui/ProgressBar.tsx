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
  color = 'from-purple-500 to-cyan-400',
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
      className="fixed top-0 left-0 h-1 bg-gradient-to-r z-[9999] pointer-events-none"
      style={{ width: `${progress}%` }}
      className={`fixed top-0 left-0 h-1 bg-gradient-to-r ${color} z-[9999] pointer-events-none`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow effect */}
      <div
        className="absolute right-0 top-0 h-full w-20 blur-xl opacity-50"
        style={{
          background: 'linear-gradient(90deg, transparent, currentColor)',
        }}
      />
    </motion.div>
  );
}
