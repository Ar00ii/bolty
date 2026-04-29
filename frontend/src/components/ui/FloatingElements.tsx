'use client';

import { motion } from 'framer-motion';
import React from 'react';

const elements = [
  { delay: 0, x: '10%', y: '20%', size: 120, duration: 6 },
  { delay: 0.5, x: '80%', y: '30%', size: 80, duration: 7 },
  { delay: 1, x: '15%', y: '70%', size: 100, duration: 8 },
  { delay: 1.5, x: '85%', y: '75%', size: 90, duration: 6.5 },
  { delay: 2, x: '50%', y: '10%', size: 70, duration: 7.5 },
  { delay: 2.5, x: '70%', y: '60%', size: 110, duration: 8.5 },
];

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: el.x,
            top: el.y,
            width: el.size,
            height: el.size,
            background:
              'radial-gradient(circle, rgba(20, 241, 149, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)',
            filter: 'blur(40px)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            delay: el.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
