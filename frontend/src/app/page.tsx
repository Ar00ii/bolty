'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BoltyLogoSVG, BoltyFloatingLogos } from '@/components/ui/BoltyLogo';
import { HighlightCard } from '@/components/ui/highlight-card';
import { GradientMeshBackground } from '@/components/ui/GradientMeshBackground';
import { FloatingElements } from '@/components/ui/FloatingElements';
import {
  Bot, GitBranch, ArrowRight, Shield,
  Key, Star, TrendingUp,
  MessageSquare, UserPlus, Upload, Rocket,
} from 'lucide-react';

// ── Scroll reveal ──────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Bot,
    title: 'AI Agent Marketplace',
    description: 'Discover, publish, and sell AI agents. From GPT-powered tools to custom automation bots.',
    href: '/market/agents',
  },
  {
    icon: GitBranch,
    title: 'Code Repositories',
    description: 'Sync GitHub repos. Offer free or paid access, earn reputation, build your developer profile.',
    href: '/market/repos',
  },
  {
    icon: Key,
    title: 'API Key Management',
    description: 'Generate API keys for your agents to interact with the platform programmatically.',
    href: '/api-keys',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'On-chain ETH payments with smart contract escrow. No middleman, no delays.',
    href: '/how-it-works',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Global chat, DMs, and negotiation system built on WebSockets. Connect instantly.',
    href: '/chat',
  },
  {
    icon: TrendingUp,
    title: 'Reputation System',
    description: 'Build your developer reputation. Earn points, climb the leaderboard, get recognized.',
    href: '/reputation/leaderboard',
  },
];

const STATS = [
  { value: 'Beta', label: 'Platform Status' },
  { value: 'ETH', label: 'On-chain Payments' },
  { value: 'Free', label: 'To Join' },
  { value: '24/7', label: 'Platform Available' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your account', desc: 'Sign up with GitHub, email, or a Web3 wallet. Your profile is your developer identity.', icon: UserPlus },
  { step: '02', title: 'Publish your work', desc: 'Connect GitHub to sync repos, or upload AI agents and automation tools to the marketplace.', icon: Upload },
  { step: '03', title: 'Earn and grow', desc: 'Set prices in ETH, negotiate with buyers, build reputation, and grow your developer brand.', icon: Rocket },
];

const INTEGRATIONS = [
  { name: 'GitHub', desc: 'Sync repos in one click' },
  { name: 'Ethereum', desc: 'On-chain ETH payments' },
  { name: 'Claude AI', desc: 'Built-in AI assistant' },
  { name: 'WebSockets', desc: 'Real-time everything' },
  { name: 'PostgreSQL', desc: 'Robust data layer' },
  { name: 'Any Language', desc: 'All stacks welcome' },
];

const TESTIMONIALS = [
  { name: 'Alex R.', role: 'Senior Full-Stack Dev', text: 'Published three locked repos in my first week and earned my first ETH without any crypto complexity.' },
  { name: 'Yuki T.', role: 'AI/ML Engineer', text: 'The AI agent marketplace is exactly what I needed. Deployed my automation toolkit and it already has buyers.' },
  { name: 'Sara M.', role: 'Indie Developer', text: 'The built-in AI assistant saves me hours every week. Real code-level feedback, not generic advice.' },
];

// ── Component ────────────────────────────────────────────────────
export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <GradientMeshBackground />
      {/* Homepage Navbar */}
      <nav className="nav-glass fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'var(--bg)', opacity: 1, backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto h-14 px-4 lg:px-6 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BoltyLogoSVG size={28} className="transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(131,110,249,0.4)]" />
            <span className="text-[15px] font-bold tracking-tight" style={{
              background: 'linear-gradient(135deg, #e0d4ff 0%, #836EF9 50%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>BoltyNetwork</span>
          </Link>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-6 mr-6">
            <Link href="/market" className="text-[13px] transition-colors" style={{ color: 'var(--text-muted)' }}>Marketplace</Link>
            <Link href="/docs/agent-protocol" className="text-[13px] transition-colors" style={{ color: 'var(--text-muted)' }}>Docs</Link>
            <Link href="/how-it-works" className="text-[13px] transition-colors" style={{ color: 'var(--text-muted)' }}>How It Works</Link>
          </div>
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/auth" className="text-[13px] px-3 py-1.5 transition-colors" style={{ color: 'var(--text-muted)' }}>Sign in</Link>
              <Link href="/auth?tab=register" className="btn-primary text-[13px] px-4 py-1.5">Get started</Link>
            </div>
          ) : (
            <Link href="/market" className="btn-primary text-[13px] px-4 py-1.5">Go to Dashboard</Link>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Animated floating elements */}
        <FloatingElements />
        {/* Subtle grid background */}
        <div className="hero-grid-bg">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--brand)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>
        <BoltyFloatingLogos />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-monad-500/20 bg-monad-500/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-monad-400 animate-pulse" />
            <span className="text-xs font-medium text-monad-400">Now in Beta — Open for developers</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-text-glow" style={{ color: 'var(--text)' }}>
            Build, ship, and earn<br />
            <span className="hero-gradient">with AI agents</span>
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            The developer platform for publishing code, deploying AI agents,
            and earning from your work. Connect your stack, reach buyers, get paid in ETH.
          </p>

          <div className="flex items-center justify-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link href="/auth?tab=register" className="btn-primary text-sm px-6 py-2.5 rounded-lg flex items-center gap-2">
                  Start building <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/market" className="btn-secondary text-sm px-6 py-2.5 rounded-lg">
                  Explore marketplace
                </Link>
              </>
            ) : (
              <Link href="/market" className="btn-primary text-sm px-6 py-2.5 rounded-lg flex items-center gap-2">
                Go to dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mini stats */}
          <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <Section>
        <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-medium text-monad-400 uppercase tracking-wider mb-3">Platform Features</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Everything you need to build and sell</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <div key={f.href} style={{ animation: `card-stagger 0.6s ease-out forwards`, animationDelay: `${i * 0.1}s` }}>
                  <HighlightCard
                    icon={f.icon}
                    title={f.title}
                    description={f.description}
                    href={f.href}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section>
        <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-medium text-monad-400 uppercase tracking-wider mb-3">Getting Started</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Three steps to get started</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {HOW_IT_WORKS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.step} className="step-card" style={{ animation: `card-stagger 0.6s ease-out forwards`, animationDelay: `${i * 0.15}s` }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="step-number">{s.step}</div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-dim)', border: '1px solid rgba(131,110,249,0.15)' }}>
                        <Icon className="w-5 h-5 text-monad-400" strokeWidth={1.75} />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </Section>

      {/* ── INTEGRATIONS ── */}
      <Section>
        <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-medium text-monad-400 uppercase tracking-wider mb-3">Ecosystem</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Works with your stack</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {INTEGRATIONS.map((i, idx) => (
                <div key={i.name} className="card-elevated text-center py-6 px-4" style={{ animation: `card-stagger 0.6s ease-out forwards`, animationDelay: `${idx * 0.08}s` }}>
                  <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{i.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{i.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section>
        <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-medium text-monad-400 uppercase tracking-wider mb-3">Developers</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>What developers are saying</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, idx) => (
                <div key={t.name} className="card-elevated p-6" style={{ animation: `card-stagger 0.6s ease-out forwards`, animationDelay: `${idx * 0.15}s` }}>
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 text-monad-400 fill-monad-400" />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>&ldquo;{t.text}&rdquo;</p>
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Section>

      {/* ── CTA ── */}
      <Section>
        <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--text)' }}>Ready to start building?</h2>
            <p className="mb-8 max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
              Join the developer platform where code meets commerce. Publish, sell, and earn — all in one place.
            </p>
            {!isAuthenticated ? (
              <div className="flex items-center justify-center gap-3">
                <Link href="/auth?tab=register" className="btn-primary text-sm px-6 py-2.5 rounded-lg flex items-center gap-2">
                  Create free account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/docs/agent-protocol" className="btn-secondary text-sm px-6 py-2.5 rounded-lg">
                  Read the docs
                </Link>
              </div>
            ) : (
              <Link href="/market" className="btn-primary text-sm px-6 py-2.5 rounded-lg inline-flex items-center gap-2">
                Go to dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </section>
      </Section>
    </div>
  );
}
