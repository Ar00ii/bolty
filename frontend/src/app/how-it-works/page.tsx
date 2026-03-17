'use client';

import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Percent, Coins, Zap, Shield, TrendingUp,
  CheckCircle2, Clock, Wallet, BarChart3, Rocket, Star,
  ArrowDownToLine, ArrowUpFromLine, RefreshCw, Lock,
} from 'lucide-react';

/* ─── Fade-up animation helper ──────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Roadmap Step Card ──────────────────────────────────────────────────── */
interface RoadmapStep {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
  tag?: string;
  color: string;
  glow: string;
}

function RoadmapCard({ item, index }: { item: RoadmapStep; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50, y: 20 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="roadmap-card group"
      style={{ '--card-glow': item.glow, '--card-color': item.color } as React.CSSProperties}
    >
      <div className="roadmap-card-inner">
        {/* Step number */}
        <span className="roadmap-step-num">
          {String(item.step).padStart(2, '0')}
        </span>

        {/* Icon */}
        <div className="roadmap-icon-wrap" style={{ background: item.glow }}>
          <Icon className="roadmap-icon" style={{ color: item.color }} strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="roadmap-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 className="roadmap-title">{item.title}</h3>
            {item.tag && (
              <span className="roadmap-tag" style={{ color: item.color, borderColor: item.color, background: item.glow }}>
                {item.tag}
              </span>
            )}
          </div>
          <p className="roadmap-desc">{item.description}</p>
        </div>

        {/* Connector arrow */}
        <ArrowRight className="roadmap-arrow" strokeWidth={1.5} />
      </div>
    </motion.div>
  );
}

/* ─── Fee Card ───────────────────────────────────────────────────────────── */
function FeeCard({
  icon: Icon,
  title,
  value,
  description,
  highlight,
  delay,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
  delay?: number;
  badge?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: delay ?? 0, ease: [0.22, 1, 0.36, 1] }}
      className={`fee-card ${highlight ? 'fee-card--highlight' : ''}`}
    >
      {badge && <span className="fee-badge">{badge}</span>}
      <div className="fee-icon-wrap">
        <Icon strokeWidth={1.5} className="fee-icon" />
      </div>
      <div className="fee-value">{value}</div>
      <div className="fee-title">{title}</div>
      <p className="fee-desc">{description}</p>
    </motion.div>
  );
}

/* ─── Page data ──────────────────────────────────────────────────────────── */

const ROADMAP_STEPS: RoadmapStep[] = [
  {
    step: 1,
    icon: Wallet,
    title: 'Connect Your Wallet',
    description: 'Link your crypto wallet to Bolty. We support MetaMask, WalletConnect, and more. Your keys, your assets — always.',
    color: '#836EF9',
    glow: 'rgba(131,110,249,0.12)',
  },
  {
    step: 2,
    icon: BarChart3,
    title: 'Find a Trade',
    description: 'Browse the marketplace, filter by asset, price, and reputation. Our AI agents surface the best opportunities in real time.',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.12)',
  },
  {
    step: 3,
    icon: Shield,
    title: 'Secure Escrow',
    description: 'Funds are locked in a smart-contract escrow before the trade executes. Neither party can move assets until conditions are met.',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.12)',
  },
  {
    step: 4,
    icon: RefreshCw,
    title: 'Trade Executes',
    description: 'Once both parties confirm, the swap settles on-chain automatically. No middlemen, no delays, fully transparent on the ledger.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.12)',
  },
  {
    step: 5,
    icon: Percent,
    title: '2.5% Platform Fee',
    description: 'A flat 2.5% fee is deducted from the trade value. This sustains platform development, security audits, and community rewards.',
    tag: 'Current',
    color: '#f87171',
    glow: 'rgba(248,113,113,0.12)',
  },
  {
    step: 6,
    icon: ArrowDownToLine,
    title: 'Receive Your Assets',
    description: 'Assets are released from escrow directly to your wallet. Settlement happens in seconds — verify everything on-chain.',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.12)',
  },
];

const TOKEN_BENEFITS = [
  { icon: Zap,          title: '0% Trading Fee',       text: 'Pay zero platform fee on every trade when using $BOLTY',  color: '#836EF9', glow: 'rgba(131,110,249,0.1)' },
  { icon: Star,         title: 'Priority Access',       text: 'First in line for new features, beta drops, and launches', color: '#f59e0b', glow: 'rgba(245,158,11,0.1)' },
  { icon: Lock,         title: 'Governance Rights',     text: 'Vote on platform decisions and shape the future of Bolty', color: '#60a5fa', glow: 'rgba(96,165,250,0.1)' },
  { icon: TrendingUp,   title: 'Staking Rewards',       text: 'Earn yield from platform revenue share by staking $BOLTY', color: '#34d399', glow: 'rgba(52,211,153,0.1)' },
  { icon: CheckCircle2, title: 'Verified Trader Badge', text: 'Get a verified badge and boosted listing visibility',       color: '#a78bfa', glow: 'rgba(167,139,250,0.1)' },
  { icon: Rocket,       title: 'AI Agent Early Access', text: 'Be first to access new AI agent launches on the platform',  color: '#f87171', glow: 'rgba(248,113,113,0.1)' },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function HowItWorksPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="hiw-page">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="hiw-hero">
        <motion.div className="hiw-hero-bg" style={{ y: heroY, opacity: heroOpacity }} aria-hidden="true">
          <div className="hiw-hero-orb hiw-hero-orb--1" />
          <div className="hiw-hero-orb hiw-hero-orb--2" />
          <div className="hiw-hero-grid" />
        </motion.div>

        <div className="hiw-container hiw-hero-content">
          <FadeUp>
            <span className="hiw-eyebrow">
              <Zap className="hiw-eyebrow-icon" strokeWidth={1.5} />
              Platform Guide
            </span>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="hiw-hero-title">
              How <span className="hiw-brand-text">Trades</span> Work
              <br />on Bolty
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="hiw-hero-subtitle">
              Transparent, on-chain trades with smart-contract escrow, a flat 2.5%
              platform fee, and zero-tax trading coming soon with{' '}
              <strong className="hiw-brand-text">$BOLTY</strong>.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="hiw-hero-stats">
              {[
                { label: 'Platform Fee', value: '2.5%',     icon: Percent },
                { label: '$BOLTY Tax',   value: '0%',       icon: Coins },
                { label: 'Settlement',   value: '~2s',      icon: Clock },
                { label: 'Escrow',       value: 'On-chain', icon: Shield },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="hiw-stat">
                  <Icon className="hiw-stat-icon" strokeWidth={1.5} />
                  <span className="hiw-stat-value">{value}</span>
                  <span className="hiw-stat-label">{label}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── ROADMAP ──────────────────────────────────────────────────────── */}
      <section className="hiw-section" id="roadmap">
        <div className="hiw-container">
          <FadeUp className="hiw-section-header">
            <span className="hiw-section-tag">Step by Step</span>
            <h2 className="hiw-section-title">Transaction Roadmap</h2>
            <p className="hiw-section-sub">
              Every trade follows the same secure, transparent path from wallet connection to final settlement.
            </p>
          </FadeUp>

          <div className="hiw-roadmap">
            <div className="hiw-roadmap-line" aria-hidden="true" />
            <div className="hiw-roadmap-steps">
              {ROADMAP_STEPS.map((step, i) => (
                <RoadmapCard key={step.step} item={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEES ─────────────────────────────────────────────────────────── */}
      <section className="hiw-section hiw-section--alt" id="fees">
        <div className="hiw-container">
          <FadeUp className="hiw-section-header">
            <span className="hiw-section-tag">Fee Structure</span>
            <h2 className="hiw-section-title">Simple & Transparent Pricing</h2>
            <p className="hiw-section-sub">
              No hidden fees. One flat rate today, zero fees with $BOLTY tomorrow.
            </p>
          </FadeUp>

          <div className="hiw-fee-grid">
            <FeeCard
              icon={Percent}
              title="Current Platform Fee"
              value="2.5%"
              description="Applied to every trade. Funds platform security, development, and community incentives. Calculated on the final trade value and deducted automatically."
              delay={0}
            />
            <FeeCard
              icon={ArrowUpFromLine}
              title="Seller Receives"
              value="97.5%"
              description="After the 2.5% fee, 97.5% of the agreed trade value is transferred directly to the seller's wallet via smart contract."
              delay={0.1}
            />
            <FeeCard
              icon={Coins}
              title="$BOLTY Token Fee"
              value="0%"
              description="Once $BOLTY launches, holders who pay fees in $BOLTY enjoy zero platform tax. Full value, zero cuts — the future of trading on Bolty."
              highlight
              badge="Coming Soon"
              delay={0.2}
            />
          </div>

          {/* Fee breakdown visual */}
          <FadeUp delay={0.15} className="hiw-fee-breakdown">
            <div className="hiw-breakdown-label">
              <span>Trade Value — Example: 100 USDC</span>
            </div>
            <div className="hiw-breakdown-bar">
              <motion.div
                className="hiw-bar-seller"
                initial={{ width: 0 }}
                whileInView={{ width: '97.5%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <span>Seller — 97.5 USDC</span>
              </motion.div>
              <motion.div
                className="hiw-bar-fee"
                initial={{ width: 0 }}
                whileInView={{ width: '2.5%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <span>Fee</span>
              </motion.div>
            </div>
            <p className="hiw-breakdown-note">
              With <strong className="hiw-brand-text">$BOLTY</strong>: 100% goes to seller. 0% platform fee.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── BOLTY TOKEN ──────────────────────────────────────────────────── */}
      <section className="hiw-section" id="bolty-token">
        <div className="hiw-container">
          <FadeUp className="hiw-section-header">
            <span className="hiw-section-tag">Coming Soon</span>
            <h2 className="hiw-section-title">
              The <span className="hiw-brand-text">$BOLTY</span> Token
            </h2>
            <p className="hiw-section-sub">
              $BOLTY is the native utility token of the Bolty platform. Designed for the
              community, by the community — with zero tax on every transaction.
            </p>
          </FadeUp>

          <div className="hiw-token-grid">
            {TOKEN_BENEFITS.map(({ icon: Icon, title, text, color, glow }, i) => (
              <motion.div
                key={title}
                className="hiw-token-feature"
                style={{ '--feat-glow': glow, '--feat-color': color } as React.CSSProperties}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="hiw-token-feat-icon" style={{ background: glow, borderColor: `${color}30` }}>
                  <Icon strokeWidth={1.5} style={{ width: 20, height: 20, color }} />
                </div>
                <div>
                  <div className="hiw-token-feat-title">{title}</div>
                  <div className="hiw-token-feat-desc">{text}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <FadeUp delay={0.2} className="hiw-token-footer">
            <span className="hiw-token-cta-label">
              <Clock strokeWidth={1.5} style={{ width: 14, height: 14 }} />
              Launch details coming soon — stay tuned
            </span>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="hiw-section hiw-section--alt hiw-cta-section">
        <div className="hiw-container hiw-cta-inner">
          <FadeUp>
            <h2 className="hiw-cta-title">Ready to start trading?</h2>
            <p className="hiw-cta-sub">
              Connect your wallet, browse the marketplace, and trade securely on Bolty.
            </p>
            <div className="hiw-cta-buttons">
              <a href="/market" className="hiw-btn-primary">
                <BarChart3 strokeWidth={1.5} style={{ width: 16, height: 16 }} />
                Explore Marketplace
              </a>
              <a href="/auth" className="hiw-btn-secondary">
                Get Started Free
                <ArrowRight strokeWidth={1.5} style={{ width: 16, height: 16 }} />
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── PAGE STYLES ──────────────────────────────────────────────────── */}
      <style jsx>{`

        /* ── Layout ── */
        .hiw-page {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          overflow-x: hidden;
        }
        .hiw-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .hiw-section {
          padding: 6rem 0;
        }
        .hiw-section--alt {
          background: var(--bg-elevated);
        }

        /* ── Hero ── */
        .hiw-hero {
          position: relative;
          min-height: 88vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: 8rem 0 5rem;
        }
        .hiw-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .hiw-hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.35;
        }
        .hiw-hero-orb--1 {
          width: 520px; height: 520px;
          top: -120px; left: -80px;
          background: radial-gradient(circle, #836EF9 0%, transparent 70%);
        }
        .hiw-hero-orb--2 {
          width: 400px; height: 400px;
          bottom: -80px; right: -60px;
          background: radial-gradient(circle, #4c2fcf 0%, transparent 70%);
        }
        .hiw-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(131,110,249,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(131,110,249,0.05) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }
        .hiw-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .hiw-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #836EF9;
          border: 1px solid rgba(131,110,249,0.25);
          background: rgba(131,110,249,0.08);
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
        }
        .hiw-eyebrow-icon { width: 13px; height: 13px; }
        .hiw-hero-title {
          font-size: clamp(2.6rem, 6vw, 4.8rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.03em;
        }
        .hiw-brand-text {
          background: linear-gradient(135deg, #836EF9, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hiw-hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: var(--text-muted);
          max-width: 580px;
          line-height: 1.65;
        }
        .hiw-hero-subtitle strong { -webkit-text-fill-color: unset; }
        .hiw-hero-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .hiw-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1rem 1.4rem;
          min-width: 100px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .hiw-stat:hover {
          border-color: rgba(131,110,249,0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(131,110,249,0.12);
        }
        .hiw-stat-icon { width: 18px; height: 18px; color: #836EF9; margin-bottom: 0.1rem; }
        .hiw-stat-value { font-size: 1.35rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
        .hiw-stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

        /* ── Section headers ── */
        .hiw-section-header { text-align: center; margin-bottom: 3.5rem; }
        .hiw-section-tag {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #836EF9;
          border: 1px solid rgba(131,110,249,0.25);
          background: rgba(131,110,249,0.08);
          padding: 0.25rem 0.7rem;
          border-radius: 999px;
          margin-bottom: 0.75rem;
        }
        .hiw-section-title {
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .hiw-section-sub {
          font-size: 1rem;
          color: var(--text-muted);
          max-width: 520px;
          margin: 0.75rem auto 0;
          line-height: 1.65;
        }

        /* ── Roadmap ── */
        .hiw-roadmap {
          position: relative;
        }
        .hiw-roadmap-line {
          display: none;
        }
        @media (min-width: 768px) {
          .hiw-roadmap-line {
            display: block;
            position: absolute;
            left: 50%;
            top: 24px;
            bottom: 24px;
            width: 1px;
            background: linear-gradient(180deg, transparent, rgba(131,110,249,0.4) 10%, rgba(131,110,249,0.4) 90%, transparent);
            transform: translateX(-50%);
          }
        }
        .hiw-roadmap-steps {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ── Roadmap Card ── */
        .roadmap-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.4rem 1.6rem;
          cursor: default;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
          position: relative;
          overflow: hidden;
        }
        .roadmap-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--card-glow, transparent);
          opacity: 0;
          transition: opacity 0.25s;
        }
        .roadmap-card:hover {
          border-color: rgba(131,110,249,0.3);
          transform: translateY(-3px);
          box-shadow: 0 12px 36px var(--card-glow, rgba(131,110,249,0.08));
        }
        .roadmap-card:hover::before { opacity: 1; }

        .roadmap-card-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          gap: 1.1rem;
        }
        .roadmap-step-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          font-weight: 700;
          color: #836EF9;
          opacity: 0.7;
          min-width: 24px;
          padding-top: 2px;
        }
        .roadmap-icon-wrap {
          width: 42px; height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .roadmap-icon { width: 20px; height: 20px; }
        .roadmap-content { flex: 1; }
        .roadmap-title {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 0.35rem;
        }
        .roadmap-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .roadmap-tag {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          border: 1px solid;
        }
        .roadmap-arrow {
          width: 16px; height: 16px;
          color: var(--text-muted);
          opacity: 0;
          flex-shrink: 0;
          margin-top: 4px;
          transform: translateX(-6px);
          transition: opacity 0.2s, transform 0.2s;
        }
        .roadmap-card:hover .roadmap-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Fees ── */
        .hiw-fee-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }
        .fee-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem 1.6rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .fee-card:hover {
          border-color: rgba(131,110,249,0.3);
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(131,110,249,0.1);
        }
        .fee-card--highlight {
          border-color: rgba(131,110,249,0.35);
          background: linear-gradient(135deg, rgba(131,110,249,0.07) 0%, var(--bg-card) 100%);
        }
        .fee-card--highlight::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #836EF9, transparent);
        }
        .fee-card--highlight:hover {
          box-shadow: 0 16px 40px rgba(131,110,249,0.18);
        }
        .fee-badge {
          position: absolute;
          top: 1rem; right: 1rem;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #836EF9;
          border: 1px solid rgba(131,110,249,0.3);
          background: rgba(131,110,249,0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
        }
        .fee-icon-wrap {
          width: 52px; height: 52px;
          background: rgba(131,110,249,0.1);
          border: 1px solid rgba(131,110,249,0.2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.2rem;
        }
        .fee-icon { width: 22px; height: 22px; color: #836EF9; }
        .fee-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 2.4rem;
          font-weight: 800;
          color: #836EF9;
          line-height: 1;
          margin-bottom: 0.4rem;
        }
        .fee-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        .fee-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.65;
        }

        /* ── Fee breakdown bar ── */
        .hiw-fee-breakdown {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.8rem 2rem;
        }
        .hiw-breakdown-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
        }
        .hiw-breakdown-bar {
          display: flex;
          height: 44px;
          border-radius: 10px;
          overflow: hidden;
          gap: 2px;
          margin-bottom: 0.8rem;
        }
        .hiw-bar-seller {
          background: linear-gradient(90deg, #836EF9, #a78bfa);
          height: 100%;
          display: flex;
          align-items: center;
          padding: 0 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #fff;
          border-radius: 8px 0 0 8px;
          white-space: nowrap;
          overflow: hidden;
        }
        .hiw-bar-fee {
          background: rgba(248,113,113,0.3);
          border: 1px solid rgba(248,113,113,0.4);
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: #f87171;
          border-radius: 0 8px 8px 0;
          white-space: nowrap;
          min-width: 32px;
        }
        .hiw-breakdown-note {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        /* ── Token section ── */
        .hiw-token-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        .hiw-token-feature {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.4rem;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .hiw-token-feature:hover {
          border-color: var(--feat-color, rgba(131,110,249,0.3));
          transform: translateY(-3px);
          box-shadow: 0 12px 32px var(--feat-glow, rgba(131,110,249,0.08));
        }
        .hiw-token-feat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hiw-token-feat-title {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 0.3rem;
        }
        .hiw-token-feat-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.55;
        }
        .hiw-token-footer {
          display: flex;
          justify-content: center;
        }
        .hiw-token-cta-label {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          color: var(--text-muted);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0.35rem 1rem;
        }

        /* ── CTA ── */
        .hiw-cta-section { text-align: center; }
        .hiw-cta-inner { display: flex; flex-direction: column; align-items: center; }
        .hiw-cta-title {
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-bottom: 0.75rem;
        }
        .hiw-cta-sub {
          font-size: 1rem;
          color: var(--text-muted);
          max-width: 420px;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .hiw-cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }
        .hiw-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #836EF9, #6b4fe0);
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(131,110,249,0.3);
        }
        .hiw-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(131,110,249,0.4);
        }
        .hiw-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          color: var(--text);
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          text-decoration: none;
          border: 1px solid var(--border);
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .hiw-btn-secondary:hover {
          border-color: rgba(131,110,249,0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(131,110,249,0.08);
        }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .hiw-hero { padding-top: 7rem; min-height: auto; }
          .hiw-section { padding: 4rem 0; }
          .hiw-breakdown-bar { height: 36px; }
          .hiw-bar-seller { font-size: 0.72rem; }
          .hiw-token-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
