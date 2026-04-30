'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Bot, GitBranch, ShieldCheck, Sparkles, Wallet, Zap } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { useHowItWorks } from '@/components/providers/HowItWorksProvider';
import { GradientText } from '@/components/ui/GradientText';
import { ShimmerButton } from '@/components/ui/ShimmerButton';

/**
 * One-viewport landing. Three reasons it's not 454 lines of marketing
 * fluff: (1) decision-fatigue is the actual conversion killer for new
 * visitors, (2) the marketplace itself sells better than copy, (3) any
 * narrative can live in the interactive How-it-works modal.
 *
 * Layout: hero (one sentence + 2 CTAs) → 3 quick value-props → tiny
 * footer link strip. Done.
 */
export function HomeLanding() {
  const howItWorks = useHowItWorks();

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{ background: '#06060a', color: '#fff' }}
    >
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(131,110,249,0.25), rgba(131,110,249,0) 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(6,182,212,0.18), rgba(6,182,212,0) 70%)',
          filter: 'blur(60px)',
        }}
      />

      <header className="relative z-10 px-6 sm:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white/95">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LogoNew.png" alt="" className="w-7 h-7" />
          <span className="text-[15px] font-light tracking-tight">BoltyNetwork</span>
        </Link>
        <nav className="flex items-center gap-2">
          <button
            onClick={howItWorks.open}
            className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-light text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-md"
          >
            How it works
          </button>
          <Link
            href="/docs"
            className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-light text-zinc-400 hover:text-white transition px-3 py-1.5 rounded-md"
          >
            Docs
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-light px-3 py-1.5 rounded-md transition"
            style={{
              background: 'rgba(131,110,249,0.14)',
              boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4)',
              color: '#ede9fe',
            }}
          >
            <Wallet className="w-3.5 h-3.5" />
            Connect wallet
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex-1 px-6 sm:px-10 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <p
            className="text-[10.5px] font-mono uppercase tracking-[0.22em] mb-5"
            style={{ color: '#b4a7ff' }}
          >
            Solana · AI agents · Code repos
          </p>
          <h1
            className="font-light text-white tracking-[-0.02em] leading-[1.05]"
            style={{ fontSize: 'clamp(36px, 6.5vw, 68px)' }}
          >
            Buy and sell <GradientText>AI agents and code</GradientText>
            <br className="hidden sm:block" /> with one wallet, one signature.
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-[14.5px] sm:text-[15.5px] font-light text-zinc-400 leading-relaxed">
            A direct on-chain marketplace. Connect a Solana wallet, browse, pay in SOL.
            The seller is paid in the same transaction. No middleman, no escrow waits.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/market" className="w-full sm:w-auto">
              <ShimmerButton className="w-full sm:w-auto px-6 py-3 text-[14px] font-light">
                Browse the marketplace
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </ShimmerButton>
            </Link>
            <button
              onClick={howItWorks.open}
              className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-light text-zinc-200 rounded-xl transition hover:translate-y-[-1px]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#b4a7ff' }} />
              Watch how it works
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl w-full"
        >
          <ValueCard icon={Bot} title="AI agents" body="Rent autonomous agents that ship work." />
          <ValueCard icon={GitBranch} title="Code repos" body="Buy private code with a one-click wallet payment." />
          <ValueCard
            icon={ShieldCheck}
            title="Scanned by BoltyGuard"
            body="Every listing graded for safety before it goes live."
          />
        </motion.div>
      </main>

      <footer className="relative z-10 px-6 sm:px-10 py-5 flex flex-wrap items-center justify-between gap-3 text-[11.5px] font-light text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3" style={{ color: '#b4a7ff' }} />
          <span>Direct on-chain · 5% protocol fee</span>
        </div>
        <div className="flex gap-4">
          <Link href="/docs" className="hover:text-zinc-300 transition">
            Docs
          </Link>
          <Link href="/terms" className="hover:text-zinc-300 transition">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300 transition">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-xl p-4 text-left"
      style={{
        background: 'rgba(255,255,255,0.025)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center mb-3"
        style={{
          background: 'rgba(131,110,249,0.12)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
        }}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="text-[13px] font-light text-white mb-1">{title}</div>
      <p className="text-[11.5px] font-light text-zinc-500 leading-relaxed">{body}</p>
    </div>
  );
}
