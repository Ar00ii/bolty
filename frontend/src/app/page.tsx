'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BoltyLogo } from '@/components/ui/BoltyLogo';
import { Navbar } from '@/components/layout/Navbar';
import {
  Bot, Code2, Users, GitBranch, ArrowRight, Shield,
  Zap, Globe, Key, Terminal, Star, TrendingUp, ChevronRight,
  Cpu, Lock, Coins, CheckCircle, MessageSquare,
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
  { step: '01', title: 'Create your account', desc: 'Sign up with GitHub, email, or a Web3 wallet. Your profile is your developer identity.' },
  { step: '02', title: 'Publish your work', desc: 'Connect GitHub to sync repos, or upload AI agents and automation tools to the marketplace.' },
  { step: '03', title: 'Earn and grow', desc: 'Set prices in ETH, negotiate with buyers, build reputation, and grow your developer brand.' },
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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Homepage Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto h-14 px-4 lg:px-6 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <BoltyLogo size={32} color="#836EF9" />
            <span className="text-white font-semibold text-[15px] tracking-tight">Bolty</span>
          </Link>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-6 mr-6">
            <Link href="/market" className="text-[13px] text-zinc-400 hover:text-white transition-colors">Marketplace</Link>
            <Link href="/docs/agent-protocol" className="text-[13px] text-zinc-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/how-it-works" className="text-[13px] text-zinc-400 hover:text-white transition-colors">How It Works</Link>
          </div>
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/auth" className="text-[13px] text-zinc-400 hover:text-white px-3 py-1.5 transition-colors">Sign in</Link>
              <Link href="/auth?tab=register" className="btn-primary text-[13px] px-4 py-1.5">Get started</Link>
            </div>
          ) : (
            <Link href="/market" className="btn-primary text-[13px] px-4 py-1.5">Go to Dashboard</Link>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-monad-500/20 bg-monad-500/5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-monad-400 animate-pulse" />
            <span className="text-xs font-medium text-monad-400">Now in Beta — Open for developers</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            Build, ship, and earn<br />
            <span className="hero-gradient">with AI agents</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
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
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
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
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Everything you need to build and sell</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <Link key={f.href} href={f.href} className="group card-interactive p-5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--brand-dim)', border: '1px solid rgba(131,110,249,0.15)' }}>
                      <Icon className="w-5 h-5 text-monad-400" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-white mb-1.5 group-hover:text-monad-300 transition-colors">{f.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
                  </Link>
                );
              })}
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
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Three steps to get started</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step} className="relative">
                  <span className="text-5xl font-bold text-monad-500/10">{s.step}</span>
                  <h3 className="text-base font-semibold text-white mt-2 mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
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
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Works with your stack</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {INTEGRATIONS.map((i) => (
                <div key={i.name} className="card text-center py-5 px-3">
                  <p className="text-sm font-semibold text-white mb-1">{i.name}</p>
                  <p className="text-xs text-zinc-500">{i.desc}</p>
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
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">What developers are saying</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="card p-5">
                  <p className="text-sm text-zinc-300 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">Ready to start building?</h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
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
