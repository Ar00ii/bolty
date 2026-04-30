'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function BackToTop({ threshold = 500 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label="Back to top"
          title="Back to top"
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.92 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="group fixed bottom-6 right-6 z-[80] w-11 h-11 rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
          style={{
            background: 'linear-gradient(180deg, rgba(24,24,30,0.95) 0%, rgba(12,12,16,0.95) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow:
              '0 10px 30px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background:
                'radial-gradient(circle at 50% 20%, rgba(20, 241, 149,0.35) 0%, transparent 70%)',
            }}
          />
          <ArrowUp
            className="relative w-4 h-4 transition-transform group-hover:-translate-y-0.5"
            strokeWidth={2}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
