'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { useState } from 'react';
import { ReactNode } from 'react';

interface EnhancedTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function EnhancedTooltip({
  content,
  children,
  side = 'top',
  delay = 0.2,
  className = '',
}: EnhancedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const offsetMap = {
    top: { x: 0, y: -40 },
    bottom: { x: 0, y: 40 },
    left: { x: -40, y: 0 },
    right: { x: 40, y: 0 },
  };

  const arrowMap = {
    top: 'bottom-full translate-y-1',
    bottom: 'top-full translate-y-1',
    left: 'right-full translate-x-1',
    right: 'left-full translate-x-1',
  };

  const offset = offsetMap[side];
  const arrowPos = arrowMap[side];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, ...offset }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, ...offset }}
            transition={{ delay, duration: 0.2 }}
            className={`absolute z-50 px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-lg whitespace-nowrap pointer-events-none ${className}`}
            style={{
              left: side === 'right' ? '100%' : side === 'left' ? 'auto' : '50%',
              right: side === 'left' ? '100%' : 'auto',
              top: side === 'bottom' ? '100%' : side === 'top' ? 'auto' : '50%',
              bottom: side === 'top' ? '100%' : 'auto',
              transform:
                side === 'left' || side === 'right'
                  ? `translate${side === 'left' ? 'X' : 'X'}(-${side === 'left' ? 'calc(100% + 8px)' : 'calc(-100% - 8px)'}) translateY(-50%)`
                  : 'translateX(-50%)',
            }}
          >
            <div className="text-zinc-300">{content}</div>

            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-zinc-900 border border-zinc-700 transform rotate-45 ${arrowPos}`}
              style={{
                left: side === 'left' || side === 'right' ? 'auto' : '50%',
                right: side === 'left' ? '-6px' : 'auto',
                marginLeft: side === 'left' || side === 'right' ? 0 : '-4px',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
