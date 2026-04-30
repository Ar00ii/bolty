'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'white' | 'gray';
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const colorClasses = {
  purple: 'text-[#7DFFBF]',
  white: 'text-white',
  gray: 'text-zinc-400',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'purple',
  fullPage = false,
}) => {
  const spinner = (
    <div className={`relative ${sizeClasses[size]}`}>
      <div
        className={`absolute inset-0 rounded-full border-2 border-white/5 ${colorClasses[color]}`}
      />
      <div
        className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${colorClasses[color]}`}
        style={{
          borderTopColor: 'currentColor',
          borderRightColor: 'currentColor',
          filter: color === 'purple' ? 'drop-shadow(0 0 6px rgba(20, 241, 149,0.55))' : undefined,
        }}
      />
    </div>
  );

  if (fullPage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
      >
        <motion.div
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          className="flex flex-col items-center gap-4"
        >
          {spinner}
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[13px] text-zinc-400 tracking-[0.005em]"
          >
            Loading
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return spinner;
};

LoadingSpinner.displayName = 'LoadingSpinner';
