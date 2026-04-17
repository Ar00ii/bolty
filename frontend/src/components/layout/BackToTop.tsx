'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

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

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          className="fixed bottom-6 right-6 z-[80] w-10 h-10 rounded-full border border-white/10 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white hover:border-purple-400/40 hover:bg-purple-500/10 transition-colors shadow-xl shadow-black/40"
        >
          <ArrowUp className="w-4 h-4" strokeWidth={1.75} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
