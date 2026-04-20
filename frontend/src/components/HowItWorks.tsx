/**
 * HowItWorks Component
 *
 * Displays a 3-step "Click, click, done" workflow section showcasing the main features:
 * 1. Deploy New Agent - Form for deploying AI agents
 * 2. Build Reputation - Reputation system with rank tiers
 * 3. Earn & Grow - Marketplace for agents and repositories
 */
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShoppingCart, Upload, Zap, Trophy, GitBranch } from 'lucide-react';
import React, { memo } from 'react';

const STEP_CARD_STYLE = {
  background: 'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
  boxShadow:
    '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 48px -24px rgba(0,0,0,0.6)',
};

const INPUT_STYLE = {
  background: 'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
};

const RANK_CHIP_STYLE = (color: string) => ({
  background: `linear-gradient(180deg, ${color}14 0%, ${color}03 100%)`,
  boxShadow: `inset 0 0 0 1px ${color}28`,
});

function StepNumber({ n }: { n: number }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-light text-lg tabular-nums"
      style={{
        background:
          'linear-gradient(135deg, rgba(131,110,249,0.42) 0%, rgba(131,110,249,0.18) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(131,110,249,0.55), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 24px -4px rgba(131,110,249,0.6)',
      }}
    >
      {n}
    </div>
  );
}

function SectionTopLine() {
  return (
    <div
      className="absolute inset-x-0 top-0 h-px"
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
      }}
    />
  );
}

export const HowItWorks = memo(() => {
  return (
    <section
      className="py-24 px-4 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(88,28,135,0.06) 0%, rgba(20,20,30,0.4) 50%, rgba(30,10,60,0.06) 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 right-1/4 w-[420px] h-[420px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-40 -left-20 w-[380px] h-[380px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20"
          role="region"
          aria-label="How it works section"
        >
          <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#b4a7ff] mb-3">
            How it works
          </p>
          <h2 className="text-5xl lg:text-6xl font-light text-white tracking-[-0.02em]">
            Click, click, done.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
          {/* Column 1: Deploy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="relative"
          >
            <div className="absolute -top-5 left-0 flex items-center gap-3">
              <StepNumber n={1} />
              <h3 className="text-xl font-light text-white tracking-[-0.005em]">
                Deploy New Agent
              </h3>
            </div>

            <div className="relative mt-12 rounded-2xl p-6 overflow-hidden" style={STEP_CARD_STYLE}>
              <SectionTopLine />
              <p className="text-[13px] text-zinc-400 mb-5 tracking-[0.005em] leading-relaxed">
                Connect your repository and configure your agent deployment settings.
              </p>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                    Step 3 of 6
                  </span>
                  <span className="text-[11px] font-mono text-[#b4a7ff] tabular-nums">57%</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{
                    background: 'rgba(8,8,12,0.6)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '57%',
                      background:
                        'linear-gradient(90deg, rgba(131,110,249,0.85) 0%, rgba(131,110,249,1) 100%)',
                      boxShadow: '0 0 10px rgba(131,110,249,0.55)',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
                    AI Negotiation Webhook
                  </label>
                  <input
                    type="text"
                    placeholder="https://your-api.com/webhook"
                    className="w-full px-3 py-2.5 rounded-lg text-[13px] font-mono text-white placeholder-zinc-600 outline-none tracking-[0.005em]"
                    style={INPUT_STYLE}
                  />
                  <p className="text-[11px] text-zinc-500 mt-1.5 tracking-[0.005em]">
                    Endpoint where buyers can negotiate with your agent
                  </p>
                </div>

                <div>
                  <label className="block text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
                    Agent File
                  </label>
                  <div
                    className="rounded-lg p-6 text-center"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(8,8,12,0.6) 0%, rgba(4,4,8,0.6) 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.2)',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                        boxShadow:
                          'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
                      }}
                    >
                      <Upload className="w-3.5 h-3.5 text-[#b4a7ff]" strokeWidth={1.75} />
                    </div>
                    <p className="text-[13px] text-zinc-300 tracking-[0.005em]">
                      Click to upload agent file
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 tracking-[0.005em]">
                      .js, .ts, .zip, .json, .yaml, .yml · max 10 MB
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="w-full mt-6 py-2.5 rounded-lg text-[13px] text-white font-light transition-all hover:brightness-110 flex items-center justify-center gap-2 tracking-[0.005em]"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
                }}
              >
                <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
                Setup Integrations
              </button>
            </div>
          </motion.div>

          {/* Column 2: Reputation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -top-5 left-0 flex items-center gap-3">
              <StepNumber n={2} />
              <h3 className="text-xl font-light text-white tracking-[-0.005em]">
                Build Reputation
              </h3>
            </div>

            <div className="relative mt-12 rounded-2xl p-6 overflow-hidden" style={STEP_CARD_STYLE}>
              <SectionTopLine />
              <p className="text-[13px] text-zinc-400 mb-5 tracking-[0.005em] leading-relaxed">
                The most trusted and respected developers in the Bolty ecosystem.
              </p>

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-3.5 h-3.5 text-[#b4a7ff]" strokeWidth={1.75} />
                  <span className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                    Rank Tiers
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Iron', icon: '🔩', color: '#78716c' },
                    { label: 'Bronze', icon: '🥉', color: '#cd7f32' },
                    { label: 'Silver', icon: '🥈', color: '#9ca3af' },
                    { label: 'Gold', icon: '🥇', color: '#f59e0b' },
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                      style={RANK_CHIP_STYLE(tier.color)}
                    >
                      <span className="text-[13px] leading-none flex-shrink-0" aria-hidden="true">
                        {tier.icon}
                      </span>
                      <span
                        className="text-[12px] font-light tracking-[0.005em]"
                        style={{ color: tier.color }}
                      >
                        {tier.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-[#b4a7ff]" strokeWidth={1.75} />
                  <span className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                    How to Earn Points
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Publish a repository', pts: 15 },
                    { label: 'Sell a locked repository', pts: 75 },
                    { label: 'Complete your profile', pts: 10 },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="flex justify-between items-center px-3 py-2 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                      }}
                    >
                      <span className="text-[12px] text-zinc-300 tracking-[0.005em]">
                        {p.label}
                      </span>
                      <span className="text-[11.5px] font-mono text-[#b4a7ff] tabular-nums">
                        +{p.pts} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Column 3: Marketplace */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-5 left-0 flex items-center gap-3">
              <StepNumber n={3} />
              <h3 className="text-xl font-light text-white tracking-[-0.005em]">Earn & Grow</h3>
            </div>

            <div className="relative mt-12 rounded-2xl p-6 overflow-hidden" style={STEP_CARD_STYLE}>
              <SectionTopLine />
              <p className="text-[13px] text-zinc-400 mb-5 tracking-[0.005em] leading-relaxed">
                AI agents, automation tools, and code repositories. Get instant revenue.
              </p>

              <div className="space-y-3">
                {[
                  {
                    icon: ShoppingCart,
                    title: 'AI Agents',
                    description: 'Discover and buy autonomous AI bots',
                    cta: 'Browse marketplace',
                    color: '6,182,212',
                    textColor: '#67e8f9',
                  },
                  {
                    icon: GitBranch,
                    title: 'Repositories',
                    description: 'Browse community code and locked projects',
                    cta: 'Browse repos',
                    color: '131,110,249',
                    textColor: '#b4a7ff',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-xl p-4 cursor-pointer transition-all hover:brightness-110"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(8,8,12,0.6) 0%, rgba(4,4,8,0.6) 100%)',
                        boxShadow: `inset 0 0 0 1px rgba(${item.color},0.25)`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, rgba(${item.color},0.22) 0%, rgba(${item.color},0.06) 100%)`,
                            boxShadow: `inset 0 0 0 1px rgba(${item.color},0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(${item.color},0.45)`,
                          }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: item.textColor }}
                            strokeWidth={1.75}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[14px] font-light text-white mb-1 tracking-[0.005em]">
                            {item.title}
                          </h4>
                          <p className="text-[12px] text-zinc-400 mb-2.5 tracking-[0.005em]">
                            {item.description}
                          </p>
                          <button
                            className="inline-flex items-center gap-1.5 text-[12px] font-light tracking-[0.005em] hover:brightness-110 transition-all"
                            style={{ color: item.textColor }}
                          >
                            {item.cta}
                            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="mt-5 pt-5 text-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[12px] text-zinc-500 tracking-[0.005em]">
                  Ready to list your first agent?{' '}
                  <span className="text-[#b4a7ff]">Get started →</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

HowItWorks.displayName = 'HowItWorks';
