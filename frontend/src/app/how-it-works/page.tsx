'use client';

import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Percent, Coins, Zap, Shield, TrendingUp,
  CheckCircle2, Clock, Wallet, BarChart3, Rocket, Star,
  ArrowDownToLine, ArrowUpFromLine, RefreshCw, Lock,
} from 'lucide-react';

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      style={style}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const STEPS = [
  { step: 1, icon: Wallet,          title: 'Connect Your Wallet',  tag: null,      desc: 'Link your crypto wallet to Bolty. We support MetaMask, WalletConnect, and more. Your keys, your assets — always.' },
  { step: 2, icon: BarChart3,       title: 'Find a Trade',         tag: null,      desc: 'Browse the marketplace, filter by asset, price, and reputation. Our AI agents surface the best opportunities in real time.' },
  { step: 3, icon: Shield,          title: 'Secure Escrow',        tag: null,      desc: 'Funds are locked in a smart-contract escrow before the trade executes. Neither party can move assets until all conditions are met.' },
  { step: 4, icon: RefreshCw,       title: 'Trade Executes',       tag: null,      desc: 'Once both parties confirm, the swap settles on-chain automatically. No middlemen, no delays, fully transparent on the ledger.' },
  { step: 5, icon: Percent,         title: '2.5% Fee on Ethereum', tag: 'Current', desc: 'A flat 2.5% fee applies to trades made with Ethereum. Hold $BOLTY (Base) to drop this to 0%. Fee funds development, security audits, and community rewards.' },
  { step: 6, icon: ArrowDownToLine, title: 'Receive Your Assets',  tag: null,      desc: 'Assets are released from escrow directly to your wallet. Settlement happens in seconds — verify everything on-chain.' },
];

const BENEFITS = [
  { icon: Zap,          title: '0% Fee',                   desc: 'Pay zero platform fee on every trade when using $BOLTY (Base)' },
  { icon: Star,         title: 'Priority Access',          desc: 'First in line for new features, beta drops, and platform launches' },
  { icon: Lock,         title: 'Governance Rights',        desc: 'Vote on platform decisions and shape the future of Bolty' },
  { icon: TrendingUp,   title: 'Staking Rewards',          desc: 'Earn yield from platform revenue share by staking $BOLTY' },
  { icon: CheckCircle2, title: 'Verified Trader Badge',    desc: 'Verified badge and boosted listing visibility in the marketplace' },
  { icon: Rocket,       title: 'AI Agent Early Access',    desc: 'Be first to access new AI agent launches on the Bolty platform' },
];

const BRAND  = '#836EF9';
const BRANDDIM = 'rgba(131,110,249,0.1)';
const BRANDBORDER = 'rgba(131,110,249,0.22)';

const tag = (label: string) => ({
  display: 'inline-block' as const,
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: BRAND,
  border: `1px solid ${BRANDBORDER}`,
  background: BRANDDIM,
  padding: '0.22rem 0.65rem',
  borderRadius: 999,
});

export default function HowItWorksPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '85vh', display: 'flex', alignItems: 'center', padding: '8rem 0 5rem', overflow: 'hidden' }}>
        <motion.div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, y: heroY, opacity: heroOpacity }}>
          <div style={{ position: 'absolute', width: 500, height: 500, top: -120, left: -100, borderRadius: '50%', background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)', filter: 'blur(100px)', opacity: 0.28 }} />
          <div style={{ position: 'absolute', width: 350, height: 350, bottom: -60, right: -60, borderRadius: '50%', background: 'radial-gradient(circle, #4c2fcf 0%, transparent 70%)', filter: 'blur(90px)', opacity: 0.2 }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(131,110,249,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(131,110,249,0.04) 1px, transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 40%, transparent 100%)' }} />
        </motion.div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FadeUp>
            <span style={{ ...tag('Platform Guide'), display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap style={{ width: 12, height: 12 }} strokeWidth={2} />
              Platform Guide
            </span>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em' }}>
              How{' '}
              <span style={{ background: 'linear-gradient(135deg, #836EF9, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Trades</span>
              {' '}Work<br />on Bolty
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'var(--text-muted)', maxWidth: 560, lineHeight: 1.7 }}>
              Peer-to-peer trading secured by <strong style={{ color: 'var(--text)' }}>Ethereum</strong> smart-contract escrow with a flat 2.5% fee.
              Hold <strong style={{ background: 'linear-gradient(135deg, #836EF9, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>$BOLTY</strong> to trade completely fee-free.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {[
                { label: 'ETH Fee',      value: '2.5%',     icon: Percent },
                { label: '$BOLTY (Base)',value: '0%',       icon: Coins },
                { label: 'Settlement',   value: '~2s',      icon: Clock },
                { label: 'Escrow',       value: 'On-chain', icon: Shield },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '0.9rem 1.3rem', minWidth: 96 }}>
                  <Icon style={{ width: 16, height: 16, color: BRAND, marginBottom: 2 }} strokeWidth={1.5} />
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── ROADMAP ───────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1.5rem' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={tag('Step by Step')}>Step by Step</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0.75rem 0' }}>Transaction Roadmap</h2>
            <p style={{ fontSize: '0.975rem', color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
              Every Ethereum trade follows the same secure, transparent path from wallet connection to final settlement.
            </p>
          </FadeUp>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(131,110,249,0.09)', borderColor: BRANDBORDER } as any}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', fontWeight: 700, color: BRAND, opacity: 0.55, minWidth: 20, flexShrink: 0 }}>
                    {String(s.step).padStart(2, '0')}
                  </span>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: BRANDDIM, border: `1px solid ${BRANDBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 17, height: 17, color: BRAND }} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{s.title}</span>
                      {s.tag && <span style={tag(s.tag)}>{s.tag}</span>}
                    </div>
                    <p style={{ fontSize: '0.845rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEES ──────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={tag('Fee Structure')}>Fee Structure</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0.75rem 0' }}>Simple & Transparent Pricing</h2>
            <p style={{ fontSize: '0.975rem', color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto', lineHeight: 1.65 }}>
              No hidden fees. One flat rate on Ethereum today — zero fees with $BOLTY tomorrow.
            </p>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { icon: Percent,         value: '2.5%',  title: 'Fee on Ethereum Trades', desc: 'A flat 2.5% fee is applied to all trades made with Ethereum. Funds platform security, development, and community rewards.', highlight: false, badge: null, delay: 0 },
              { icon: ArrowUpFromLine, value: '97.5%', title: 'Seller Receives',         desc: 'After the 2.5% fee, 97.5% of the agreed trade value goes directly to the seller\'s wallet via smart contract.', highlight: false, badge: null, delay: 0.1 },
              { icon: Coins,           value: '0%',    title: '$BOLTY Token (Base)',     desc: '$BOLTY launches on Base. Holders who pay with $BOLTY enjoy zero platform fees — full value, zero cuts.', highlight: true, badge: 'Coming Soon', delay: 0.2 },
            ].map(({ icon: Icon, value, title, desc, highlight, badge, delay }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, boxShadow: highlight ? '0 16px 40px rgba(131,110,249,0.18)' : '0 10px 28px rgba(131,110,249,0.08)', borderColor: 'rgba(131,110,249,0.4)' } as any}
                style={{
                  background: highlight ? 'linear-gradient(145deg, rgba(131,110,249,0.08) 0%, var(--bg-card) 100%)' : 'var(--bg-card)',
                  border: `1px solid ${highlight ? 'rgba(131,110,249,0.35)' : 'var(--border)'}`,
                  borderRadius: 16, padding: '1.75rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                {highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #836EF9, transparent)' }} />}
                {badge && <span style={{ ...tag(badge), position: 'absolute', top: '1rem', right: '1rem' }}>{badge}</span>}
                <div style={{ width: 48, height: 48, background: BRANDDIM, border: `1px solid ${BRANDBORDER}`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
                  <Icon style={{ width: 20, height: 20, color: BRAND }} strokeWidth={1.5} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2rem', fontWeight: 800, color: BRAND, lineHeight: 1, marginBottom: '0.4rem' }}>{value}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.65rem' }}>{title}</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Fee bar */}
          <FadeUp delay={0.15}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem 1.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>
                Ethereum trade example — 100 USDC
              </div>

              <div style={{ display: 'flex', height: 38, borderRadius: 9, overflow: 'hidden', gap: 2, marginBottom: '0.7rem' }}>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '97.5%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: 'linear-gradient(90deg, #836EF9, #a78bfa)', height: '100%', display: 'flex', alignItems: 'center', paddingLeft: '1rem', fontSize: '0.76rem', fontWeight: 600, color: '#fff', borderRadius: '7px 0 0 7px', whiteSpace: 'nowrap', overflow: 'hidden' }}
                >
                  Seller — 97.5 USDC
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '2.5%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: 'rgba(131,110,249,0.15)', border: '1px solid rgba(131,110,249,0.3)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: '#a78bfa', borderRadius: '0 7px 7px 0', whiteSpace: 'nowrap', minWidth: 24 }}
                >
                  Fee
                </motion.div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                With <strong style={{ background: 'linear-gradient(135deg, #836EF9, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>$BOLTY (Base)</strong>: 100% goes to seller. 0% fee.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── TOKEN ─────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <FadeUp style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={tag('Coming Soon')}>Coming Soon</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0.75rem 0' }}>
              The{' '}
              <span style={{ background: 'linear-gradient(135deg, #836EF9, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>$BOLTY</span>
              {' '}Token
            </h2>
            <p style={{ fontSize: '0.975rem', color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
              $BOLTY is the native utility token of Bolty, launching on <strong style={{ color: 'var(--text)' }}>Base</strong>. Zero fee on every trade. Official announcement coming soon on our <strong style={{ color: 'var(--text)' }}>X (Twitter)</strong>.
            </p>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
            {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2, borderColor: BRANDBORDER, boxShadow: '0 8px 24px rgba(131,110,249,0.08)' } as any}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem 1.3rem', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 11, background: BRANDDIM, border: `1px solid ${BRANDBORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 17, height: 17, color: BRAND }} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.22rem' }}>{title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <FadeUp delay={0.2} style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.38rem 1rem' }}>
              <Clock style={{ width: 12, height: 12 }} strokeWidth={1.5} />
              Announcement coming soon on X — stay tuned
            </span>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <FadeUp>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>Ready to start trading?</h2>
            <p style={{ fontSize: '0.975rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 2rem', lineHeight: 1.6 }}>
              Connect your wallet, browse the marketplace, and trade securely on Ethereum with Bolty.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
              <a href="/market" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #836EF9, #6b4fe0)', color: '#fff', fontWeight: 600, fontSize: '0.9rem', padding: '0.72rem 1.5rem', borderRadius: 10, textDecoration: 'none', boxShadow: '0 4px 16px rgba(131,110,249,0.32)' }}>
                <BarChart3 style={{ width: 15, height: 15 }} strokeWidth={1.5} />
                Explore Marketplace
              </a>
              <a href="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem', padding: '0.72rem 1.5rem', borderRadius: 10, textDecoration: 'none', border: '1px solid var(--border)' }}>
                Get Started Free
                <ArrowRight style={{ width: 15, height: 15 }} strokeWidth={1.5} />
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

    </div>
  );
}
