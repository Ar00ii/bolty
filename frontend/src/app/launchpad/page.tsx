'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

/**
 * Launchpad placeholder while we port off Flaunch.
 *
 * Bolty's previous launchpad was wired to the @flaunch/sdk on Base,
 * but the platform moved to Ethereum mainnet — Flaunch has no ETH
 * deployment. The full launch flow (token mint + paired liquidity
 * via Uniswap v4) is being rebuilt against ETH-mainnet contracts; in
 * the meantime the route stays live so deep-links don't 404 and so
 * the navigation tile in the dashboard has somewhere to land.
 */
export default function LaunchpadComingSoon() {
  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-6"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(98,126,234,0.18), rgba(98,126,234,0) 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md text-center"
      >
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5"
          style={{
            background:
              'linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)',
            boxShadow: 'var(--shadow-brand)',
          }}
        >
          <Rocket className="w-6 h-6 text-white" />
        </div>

        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-light mb-4"
          style={{
            background: 'var(--brand-dim)',
            color: 'var(--brand)',
            boxShadow: 'inset 0 0 0 1px var(--brand-dim)',
          }}
        >
          <Sparkles className="w-3 h-3" />
          Coming to Ethereum mainnet
        </span>

        <h1
          className="font-light"
          style={{
            fontSize: 'clamp(28px, 3vw, 36px)',
            color: 'var(--text)',
            letterSpacing: '-0.5px',
            lineHeight: 1.15,
          }}
        >
          Launchpad is being rebuilt for ETH.
        </h1>

        <p
          className="mt-3 font-light"
          style={{
            fontSize: '14.5px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          The previous launchpad was wired to a Base-only protocol.
          We&apos;re re-deploying the token + liquidity stack against ETH
          mainnet (Uniswap v4) so every launch settles on the same chain
          as the rest of Bolty. The auto-tweet pipeline + agent X
          autonomous mode are unaffected and stay live.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-light transition"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text)',
              boxShadow: 'inset 0 0 0 1px var(--border)',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to dashboard
          </Link>
          <Link
            href="/market/agents"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-light text-white transition hover:brightness-110"
            style={{
              background:
                'linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)',
              boxShadow: 'var(--shadow-brand)',
            }}
          >
            Browse agents
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
