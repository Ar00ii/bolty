'use client';

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

/**
 * Per-route entry animation. Lives in `template.tsx` (not `layout.tsx`)
 * so it re-mounts on every navigation while the persistent shell
 * (sidebar, top bar, providers) stays put — gives the app a sheet/page
 * feel without re-running expensive layout work.
 *
 * Honours prefers-reduced-motion, so on accessibility settings the page
 * just renders synchronously.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ minHeight: '100%' }}
    >
      {children}
    </motion.div>
  );
}
