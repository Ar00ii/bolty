'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BoltyLogoSVG } from '@/components/ui/BoltyLogo';
import { HighlightCard } from '@/components/ui/highlight-card';
import { DashboardPreview } from '@/components/ui/DashboardPreview';
import { StepShowcase } from '@/components/ui/StepShowcase';
import { IntegrationsShowcase } from '@/components/ui/IntegrationsShowcase';
import { StatusBar } from '@/components/ui/StatusBar';
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="space-y-6 relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
              Build, ship, and earn<br />
              <span className="hero-gradient">with AI agents</span>
            </h1>

            <p className="text-base md:text-lg" style={{ color: 'var(--text-muted)' }}>
              The developer platform for publishing code, deploying AI agents,
              and earning from your work. Connect your stack, reach buyers, get paid in ETH.
            </p>

            <div className="flex items-center gap-3 pt-4">
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
          </div>

          {/* Right side - Dashboard Preview */}
          <div className="relative z-10">
            <DashboardPreview />
          </div>
        </div>

        {/* Stats bar below */}
        <div className="max-w-7xl mx-auto mt-16">
          <StatusBar />
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
          <div className="max-w-6xl mx-auto">
            <StepShowcase
              title="Three steps to get started"
              steps={HOW_IT_WORKS.map((s) => ({
                number: s.step,
                title: s.title,
                description: s.desc,
              }))}
            />
          </div>
        </section>
      </Section>

      {/* ── INTEGRATIONS ── */}
      <Section>
        <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-6xl mx-auto">
            <IntegrationsShowcase
              title="Works with your stack"
              integrations={[
                { name: 'GitHub', icon: GitBranch },
                { name: 'Ethereum', icon: Shield },
                { name: 'Claude AI', icon: Bot },
                { name: 'WebSockets', icon: MessageSquare },
                { name: 'PostgreSQL', icon: Key },
                { name: 'Any Language', icon: TrendingUp },
              ]}
            />
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
