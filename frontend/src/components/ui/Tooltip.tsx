'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import React from 'react';
import { useState } from 'react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  showIcon?: boolean;
}

export function Tooltip({ content, children, side = 'top', showIcon = true }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const tooltipStyle = {
    background: 'linear-gradient(180deg, rgba(20,20,26,0.96) 0%, rgba(10,10,14,0.96) 100%)',
    boxShadow:
      '0 0 0 1px rgba(20, 241, 149,0.25), inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -8px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help"
      >
        {children ||
          (showIcon && (
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-[#7DFFBF] transition-colors inline" />
          ))}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: side === 'top' ? 4 : side === 'bottom' ? -4 : 0,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap text-[12px] text-zinc-200 font-semibold pointer-events-none tracking-[0.005em] ${positionClasses[side]}`}
            style={tooltipStyle}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
