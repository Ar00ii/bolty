'use client';

import { motion } from 'framer-motion';
import { ArrowRight, GitBranch, ShoppingCart, Trophy, Upload, Zap } from 'lucide-react';
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
  boxShadow: `inset 0 0 0 1px ${color}30`,
});

function StepBadge({ n }: { n: number }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-light text-lg tabular-nums flex-shrink-0"
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

function DeployCard() {
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden" style={STEP_CARD_STYLE}>
      <SectionTopLine />

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-zinc-500">
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
          <div className="block text-[10px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
            AI Negotiation Webhook
          </div>
          <div
            className="px-3 py-2 rounded-lg text-[12px] font-mono text-[#b4a7ff] tracking-[0.005em] truncate"
            style={INPUT_STYLE}
          >
            https://your-api.com/webhook
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5 tracking-[0.005em]">
            Endpoint where buyers can negotiate with your agent
          </p>
        </div>

        <div>
          <div className="block text-[10px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
            Agent File
          </div>
          <div
            className="rounded-lg p-5 text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(8,8,12,0.6) 0%, rgba(4,4,8,0.6) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl mx-auto mb-2.5 flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
              }}
            >
              <Upload className="w-3.5 h-3.5 text-[#b4a7ff]" strokeWidth={1.75} />
            </div>
            <p className="text-[12.5px] text-zinc-300 tracking-[0.005em]">
              Click to upload agent file
            </p>
            <p className="text-[10.5px] text-zinc-500 mt-1 tracking-[0.005em]">
              .js, .ts, .zip, .json, .yaml, .yml · max 10 MB
            </p>
          </div>
        </div>
      </div>

      <button
        className="w-full mt-5 py-2.5 rounded-lg text-[12.5px] text-white font-light transition-all hover:brightness-110 flex items-center justify-center gap-2 tracking-[0.005em]"
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
  );
}

function ReputationCard() {
  const tiers: { label: string; color: string }[] = [
    { label: 'Newcomer', color: '#a1a1aa' },
    { label: 'Bronze', color: '#cd7f32' },
    { label: 'Silver', color: '#cbd5e1' },
    { label: 'Gold', color: '#f59e0b' },
  ];
  const points = [
    { label: 'Publish a repository', pts: 15 },
    { label: 'Sell a locked repository', pts: 75 },
    { label: 'Complete your profile', pts: 10 },
  ];

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden" style={STEP_CARD_STYLE}>
      <SectionTopLine />

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-3.5 h-3.5 text-[#b4a7ff]" strokeWidth={1.75} />
          <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-zinc-500">
            Rank Tiers
          </span>
        </div>
        <div className="space-y-1.5">
          {tiers.map((tier) => (
            <div
              key={tier.label}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={RANK_CHIP_STYLE(tier.color)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: tier.color,
                  boxShadow: `0 0 8px ${tier.color}aa`,
                }}
              />
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
          <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-zinc-500">
            How to Earn Points
          </span>
        </div>
        <div className="space-y-1.5">
          {points.map((p) => (
            <div
              key={p.label}
              className="flex justify-between items-center px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.02)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              <span className="text-[12px] text-zinc-300 tracking-[0.005em]">{p.label}</span>
              <span className="text-[11.5px] font-mono text-[#b4a7ff] tabular-nums">
                +{p.pts} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketplaceCard() {
  const items = [
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
  ];

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden" style={STEP_CARD_STYLE}>
      <SectionTopLine />

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl p-4 cursor-pointer transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(180deg, rgba(8,8,12,0.6) 0%, rgba(4,4,8,0.6) 100%)',
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
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13.5px] font-light text-white mb-0.5 tracking-[0.005em]">
                    {item.title}
                  </h4>
                  <p className="text-[11.5px] text-zinc-400 mb-2 tracking-[0.005em]">
                    {item.description}
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-light tracking-[0.005em]"
                    style={{ color: item.textColor }}
                  >
                    {item.cta}
                    <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-5 pt-4 text-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-[12px] text-zinc-500 tracking-[0.005em]">
          Ready to list your first agent? <span className="text-[#b4a7ff]">Get started →</span>
        </p>
      </div>
    </div>
  );
}

export const ClickClickDone = memo(() => {
  const steps = [
    {
      number: 1,
      title: 'Deploy New Agent',
      description: 'Connect your repository and configure your agent deployment settings.',
      Card: DeployCard,
    },
    {
      number: 2,
      title: 'Build Reputation',
      description: 'The most trusted and respected developers in the Bolty ecosystem.',
      Card: ReputationCard,
    },
    {
      number: 3,
      title: 'Earn & Grow',
      description: 'AI agents, automation tools, and code repositories. Get instant revenue.',
      Card: MarketplaceCard,
    },
  ];

  return (
    <section className="relative py-24 px-4 overflow-hidden">
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
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#b4a7ff] mb-3">
            Publish, earn, grow
          </p>
          <h2 className="text-5xl lg:text-6xl font-light text-white tracking-[-0.02em]">
            Click, click, done.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => {
            const Card = step.Card;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <StepBadge n={step.number} />
                  <h3 className="text-2xl font-light text-white tracking-[-0.01em]">
                    {step.title}
                  </h3>
                </div>
                <p className="text-[13.5px] text-zinc-400 mb-5 tracking-[0.005em] leading-relaxed">
                  {step.description}
                </p>
                <Card />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

ClickClickDone.displayName = 'ClickClickDone';
