'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { ReactNode } from 'react';
import { useState } from 'react';

interface BentoCardProps {
  children: ReactNode;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  delay?: number;
}

export function BentoCard({ children, colSpan = 1, rowSpan = 1, delay = 0 }: BentoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const colClass = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
  }[colSpan];

  const rowClass = {
    1: 'row-span-1',
    2: 'row-span-2',
  }[rowSpan];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${colClass} ${rowClass} relative group`}
    >
      {/* Card container with border */}
      <div
        className="h-full rounded-lg border transition-all duration-300 p-6 overflow-hidden"
        style={{
          borderColor: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0)',
          backdropFilter: 'blur(0px)',
        }}
      >
        {/* Glow effect on hover */}
        {isHovered && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              boxShadow:
                'inset 0 0 30px rgba(20, 241, 149, 0.1), 0 0 30px rgba(20, 241, 149, 0.05)',
            }}
          />
        )}

        {/* 3D Tilt effect */}
        <motion.div
          animate={
            isHovered
              ? {
                  rotateX: 5,
                  rotateY: -5,
                }
              : {
                  rotateX: 0,
                  rotateY: 0,
                }
          }
          transition={{ duration: 0.3 }}
          style={{
            perspective: '1000px',
          }}
          className="h-full relative z-10"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}
