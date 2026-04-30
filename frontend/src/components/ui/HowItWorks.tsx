'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShoppingBag, Wallet, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Step {
  key: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  visual: React.ReactNode;
}

const STEPS: Step[] = [
  {
    key: 'connect',
    title: 'Connect a Solana wallet',
    body: 'One signed message. No email, no password. Your wallet is your account.',
    icon: Wallet,
    visual: <ConnectVisual />,
  },
  {
    key: 'browse',
    title: 'Browse agents and code',
    body: 'AI agents you can rent and code repos you can buy. Every listing scored for safety by BoltyGuard.',
    icon: ShoppingBag,
    visual: <BrowseVisual />,
  },
  {
    key: 'pay',
    title: 'Pay with SOL, instantly',
    body: 'One transaction. The seller gets paid on-chain, you get the asset. No middleman, no escrow waits.',
    icon: CheckCircle2,
    visual: <PayVisual />,
  },
];

interface HowItWorksProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 3-step interactive walkthrough. Mounted as a modal so the same
 * component works from the landing CTA, the global "?" header
 * button, and the first-time wallet tooltip.
 */
export function HowItWorks({ open, onClose }: HowItWorksProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: '#06060f',
              boxShadow:
                '0 0 0 1px rgba(20, 241, 149,0.3), 0 24px 80px rgba(20, 241, 149,0.18)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(20, 241, 149,0.6) 50%, transparent 100%)',
              }}
            />

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/5 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-7 pt-7 pb-2">
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em]">
                How it works · {step + 1} / {STEPS.length}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #14F195 0%, #008F55 100%)',
                    boxShadow: '0 4px 14px rgba(20, 241, 149,0.25)',
                  }}
                >
                  <current.icon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-[20px] font-semibold text-white tracking-[-0.3px]">
                  {current.title}
                </h2>
              </div>
            </div>

            <div className="px-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-[13.5px] font-semibold text-zinc-400 leading-relaxed">
                    {current.body}
                  </p>
                  <div
                    className="mt-5 rounded-xl p-5 min-h-[180px] flex items-center justify-center"
                    style={{
                      background: 'rgba(20, 241, 149,0.04)',
                      boxShadow: 'inset 0 0 0 1px rgba(20, 241, 149,0.18)',
                    }}
                  >
                    {current.visual}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="px-7 py-5 mt-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <button
                    key={s.key}
                    aria-label={`Step ${i + 1}`}
                    onClick={() => setStep(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === step ? 24 : 6,
                      height: 6,
                      background:
                        i === step
                          ? 'linear-gradient(90deg, #14F195, #7DFFBF)'
                          : 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => Math.max(s - 1, 0))}
                    className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                )}
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (isLast) {
                      onClose();
                    } else {
                      setStep((s) => s + 1);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white rounded-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(20, 241, 149,0.2) 0%, rgba(20, 241, 149,0.12) 100%)',
                    boxShadow: 'inset 0 0 0 1px rgba(20, 241, 149,0.45)',
                  }}
                >
                  {isLast ? "Got it" : "Next"}
                  {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Step visuals ──────────────────────────────────────────────────────────

function ConnectVisual() {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-3 rounded-xl flex items-center gap-3"
        style={{
          background: 'rgba(255,255,255,0.04)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <span className="text-2xl">👻</span>
        <div className="text-left">
          <div className="text-[12.5px] font-semibold text-white">Phantom</div>
          <div className="text-[10.5px] font-mono text-zinc-500">5XJ4…7nQa</div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 320 }}
          className="ml-2 w-5 h-5 rounded-full grid place-items-center"
          style={{ background: '#22c55e' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-black" strokeWidth={3} />
        </motion.div>
      </motion.div>
      <p className="text-[10.5px] font-mono text-zinc-500 uppercase tracking-widest">
        Sign once · no password
      </p>
    </div>
  );
}

function BrowseVisual() {
  return (
    <div className="grid grid-cols-2 gap-2 w-full max-w-[300px]">
      {[
        { title: 'CodeReviewer', price: '0.5', kind: 'AGENT' },
        { title: 'react-starter', price: '0.12', kind: 'REPO' },
        { title: 'TweetWriter', price: '0.25', kind: 'AGENT' },
        { title: 'solana-cli', price: '0.08', kind: 'REPO' },
      ].map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * i }}
          className="rounded-lg p-2.5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[8.5px] font-mono uppercase tracking-widest px-1 py-0.5 rounded"
              style={{
                background:
                  item.kind === 'AGENT'
                    ? 'rgba(20, 241, 149,0.16)'
                    : 'rgba(6,182,212,0.16)',
                color: item.kind === 'AGENT' ? '#7DFFBF' : '#67e8f9',
              }}
            >
              {item.kind}
            </span>
          </div>
          <div className="text-[11.5px] font-semibold text-white truncate">
            {item.title}
          </div>
          <div className="text-[10.5px] font-mono text-zinc-400 mt-0.5">
            {item.price} SOL
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PayVisual() {
  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[300px]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-lg p-3 space-y-2"
        style={{
          background: 'rgba(255,255,255,0.03)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex justify-between text-[11px]">
          <span className="text-zinc-500">Listing</span>
          <span className="text-white font-mono">0.50 SOL</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-zinc-500">Platform fee (5%)</span>
          <span className="text-white font-mono">0.025 SOL</span>
        </div>
        <div
          className="flex justify-between text-[11.5px] pt-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-zinc-300">You pay</span>
          <span className="font-mono" style={{ color: '#7DFFBF' }}>
            0.525 SOL
          </span>
        </div>
      </motion.div>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="px-3 py-1.5 rounded-md flex items-center gap-2"
        style={{
          background: 'rgba(34,197,94,0.1)',
          boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.4)',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </motion.div>
        <span className="text-[11px] font-mono text-emerald-300">
          Confirmed on-chain
        </span>
      </motion.div>
    </div>
  );
}
