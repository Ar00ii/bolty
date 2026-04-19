'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';

import { TerminalCard } from '@/components/ui/TerminalCard';

export default function AiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <TerminalCard className="text-center py-16 px-8">
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 260, damping: 18 }}
            className="text-yellow-400 font-mono text-4xl mb-6"
          >
            &#9888;
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            className="text-monad-400 font-mono font-light text-2xl mb-3 tracking-widest"
          >
            BOLTY_AI TERMINAL
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            className="inline-block rounded-xl px-5 py-3 mb-6"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}
          >
            <p className="text-yellow-400 font-mono text-sm font-light">
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 mr-2 align-middle"
              />
              {'// STATUS: INACTIVE — MAINTENANCE'}
            </p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34, duration: 0.32 }}
            className="text-zinc-400 text-sm font-mono leading-relaxed max-w-md mx-auto mb-2"
          >
            The AI assistant is temporarily offline while we perform scheduled maintenance and
            upgrade our systems.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.32 }}
            className="text-zinc-500 text-xs font-mono mb-8"
          >
            We&apos;ll be back online soon. Thank you for your patience.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46, duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Link href="/" className="btn-neon px-6 py-2 text-sm">
              back to home
            </Link>
          </motion.div>
        </TerminalCard>
      </motion.div>
    </div>
  );
}
