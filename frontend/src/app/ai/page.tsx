'use client';

import React from 'react';
import Link from 'next/link';
import { TerminalCard } from '@/components/ui/TerminalCard';

export default function AiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <TerminalCard className="text-center py-16 px-8">
        <div className="text-yellow-400 font-mono text-4xl mb-6">&#9888;</div>
        <h1 className="text-monad-400 font-mono font-light text-2xl mb-3 tracking-widest">
          BOLTY_AI TERMINAL
        </h1>
        <div
          className="inline-block rounded-xl px-5 py-3 mb-6"
          style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}
        >
          <p className="text-yellow-400 font-mono text-sm font-light">
            // STATUS: INACTIVE — MAINTENANCE
          </p>
        </div>
        <p className="text-zinc-400 text-sm font-mono leading-relaxed max-w-md mx-auto mb-2">
          The AI assistant is temporarily offline while we perform scheduled maintenance
          and upgrade our systems.
        </p>
        <p className="text-zinc-500 text-xs font-mono mb-8">
          We&apos;ll be back online soon. Thank you for your patience.
        </p>
        <Link href="/" className="btn-neon px-6 py-2 text-sm">
          back to home
        </Link>
      </TerminalCard>
    </div>
  );
}
