'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
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

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="cursor-help"
      >
        {children ||
          (showIcon && (
            <HelpCircle className="w-4 h-4 text-zinc-500 hover:text-zinc-300 transition-colors inline" />
          ))}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg whitespace-nowrap text-xs text-zinc-200 font-light pointer-events-none ${positionClasses[side]}`}
          >
            {content}
            <div
              className="absolute w-2 h-2 bg-zinc-900 border border-zinc-700 rotate-45 pointer-events-none"
              style={
                side === 'top'
                  ? { bottom: '-5px', left: '50%', transform: 'translateX(-50%)' }
                  : side === 'bottom'
                    ? { top: '-5px', left: '50%', transform: 'translateX(-50%)' }
                    : side === 'left'
                      ? { right: '-5px', top: '50%', transform: 'translateY(-50%)' }
                      : { left: '-5px', top: '50%', transform: 'translateY(-50%)' }
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
