'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BoltyLogo } from '@/components/ui/BoltyLogo';
import { GeometricBg } from '@/components/ui/GeometricBg';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';

// ── Scroll reveal ─────────────────────────────────────────────────────────────
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

// ── Icons ─────────────────────────────────────────────────────────────────────
function AgentIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}
function MarketIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 2.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: AgentIcon,
    color: 'text-monad-400',
    bg: 'bg-monad-500/10',
    border: 'border-monad-500/20',
    hoverBorder: 'hover:border-monad-400/50',
    glowColor: 'rgba(131,110,249,0.15)',
    title: 'AI Assistant',
    desc: 'Powered by Google Gemini. Instant answers on code reviews, architecture decisions, and debugging — without leaving the platform.',
    href: '#ai',
    tag: 'Powered by Gemini',
  },
  {
    Icon: CodeIcon,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    hoverBorder: 'hover:border-blue-400/50',
    glowColor: 'rgba(59,130,246,0.12)',
    title: 'Code Repos',
    desc: 'Publish your GitHub repositories to the Bolty community. Offer free or paid access, get votes, and build your reputation.',
    href: '/repos',
    tag: 'GitHub integrated',
  },
  {
    Icon: MarketIcon,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-400/50',
    glowColor: 'rgba(251,191,36,0.10)',
    title: 'AI Agents',
    desc: 'Publish and discover AI agents, bots, and automation tools. Share your agent with the world — upload directly, no GitHub needed.',
    href: '/market',
    tag: 'Agents, bots, automation',
  },
  {
    Icon: UsersIcon,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    hoverBorder: 'hover:border-green-400/50',
    glowColor: 'rgba(74,222,128,0.10)',
    title: 'Community',
    desc: 'Real-time global chat, direct messages, and social features. Connect with developers, share ideas, find collaborators.',
    href: '/chat',
    tag: 'Real-time WebSocket',
  },
];

const STEPS = [
  { n: '01', title: 'Create your account', desc: 'Sign up with email, GitHub, or a Web3 wallet. Your profile is your developer identity on Bolty.' },
  { n: '02', title: 'Publish your work',   desc: 'Connect GitHub to publish repos. Create market listings for bots, scripts, or AI agents you built.' },
  { n: '03', title: 'Grow and earn',       desc: 'Get upvotes, build reputation, sell locked repos for ETH, and connect with buyers and collaborators.' },
];

const STATS = [
  { value: 'AI',        label: 'Google Gemini assistant' },
  { value: 'WebSocket', label: 'Real-time messaging' },
  { value: 'GitHub',    label: 'Native integration' },
  { value: 'ETH',       label: 'On-chain payments' },
];

const FAQ = [
  { q: 'Is Bolty free to use?',            a: 'Yes, creating an account and publishing free repositories is completely free. You only pay if you want to purchase a locked repository from another developer.' },
  { q: 'How does the marketplace work?',   a: 'Developers list their bots, scripts, AI agents, and tools. Buyers browse listings and purchase access directly through the platform using ETH payments.' },
  { q: 'What is a locked repository?',     a: 'A locked repo is a GitHub repository where the developer has set a price. Buyers pay in ETH to unlock full access to clone or download it.' },
  { q: 'Can I use Bolty without a wallet?', a: 'Yes. You can sign up with email or GitHub and use all community features without a wallet. A wallet is only needed for on-chain transactions.' },
];

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{ borderColor: open ? 'rgba(131,110,249,0.35)' : 'var(--border)', background: 'var(--bg-card)' }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{q}</span>
        <svg className={`w-4 h-4 text-monad-400 flex-shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      {open && (
        <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
          <p className="pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Section reveal wrapper ────────────────────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="bg-page-community overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-black overflow-hidden">
        <Spotlight className="-top-40 left-0 md:left-80 md:-top-20" fill="white" />
        <div className="max-w-7xl mx-auto px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left content */}
            <div className="relative z-10 flex flex-col justify-center py-24">
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-6">
                Built for developers
              </p>
              <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight mb-6">
                Publish.<br />Collaborate.<br />Earn.
              </h1>
              <p className="text-neutral-400 max-w-md text-base leading-relaxed mb-10">
                Bolty brings together code, AI agents, and community in one developer-first platform.
                Share your work and grow your audience.
              </p>
              <div>
                <Link href="/auth" className="btn-primary px-8 py-3.5 rounded-xl inline-flex items-center gap-2">
                  Get started <ArrowIcon />
                </Link>
              </div>
            </div>
            {/* Right — 3D robot */}
            <div className="relative h-[600px] hidden md:block">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <Section>
          <div className="text-center mb-14">
            <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-3">Platform features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              Everything you need to build
            </h2>
            <p className="text-base mt-3 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              From AI assistance to code markets — Bolty brings together the tools developers reach for daily.
            </p>
          </div>
        </Section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <Section key={f.href} className={`reveal-d${i + 1}`}>
              <Link href={f.href} className="block h-full">
                <div className={`feature-card h-full ${f.hoverBorder} group cursor-pointer relative overflow-hidden`}>
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                    style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${f.glowColor} 0%, transparent 70%)` }} />
                  <div className={`feature-icon-wrap ${f.bg} border ${f.border} relative z-10`}>
                    <span className={f.color}><f.Icon /></span>
                  </div>
                  <div className={`text-xs font-mono ${f.color} mb-2 opacity-70 relative z-10`}>{f.tag}</div>
                  <h3 className={`font-semibold text-sm mb-2 ${f.color} relative z-10`}>{f.title}</h3>
                  <p className="text-xs leading-relaxed mb-4 relative z-10" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                  <div className={`text-xs ${f.color} opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1 relative z-10`}>
                    <span>Explore</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </Section>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px]"
            style={{ background: 'radial-gradient(ellipse, rgba(131,110,249,0.06) 0%, transparent 70%)' }} />
        </div>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <Section>
            <div className="text-center mb-14">
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
                Up and running in minutes
              </h2>
            </div>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(131,110,249,0.3), rgba(131,110,249,0.3), transparent)' }} />
            {STEPS.map((step, i) => (
              <Section key={step.n} className={`reveal-d${i + 1}`}>
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid rgba(131,110,249,0.2)' }}>
                    <div className="absolute inset-0 rounded-2xl opacity-50"
                      style={{ background: 'radial-gradient(circle, rgba(131,110,249,0.1) 0%, transparent 70%)' }} />
                    <span className="text-2xl font-black text-monad-400 font-mono relative z-10">{step.n}</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── CODE SHOWCASE ────────────────────────────────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Section>
            <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Code marketplace</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5" style={{ color: 'var(--text)' }}>
              Monetize your GitHub repositories
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
              Publish any repository — public or private — with a free or paid price tag.
              Buyers pay in ETH directly to your wallet to unlock full access.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Connect GitHub with one click',
                'Set free or paid price per repo',
                'Automatic on-chain ETH payments',
                'Community voting and discovery',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-monad-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/repos" className="btn-primary px-6 py-2.5 rounded-xl inline-flex items-center gap-2">
              Browse repos <ArrowIcon />
            </Link>
          </Section>

          <Section className="reveal-d2">
            {/* Code card with glow */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500"
                style={{ background: 'linear-gradient(135deg, rgba(131,110,249,0.2), rgba(99,91,255,0.1))' }} />
              <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                {/* Window header */}
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                  </div>
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-muted)' }}>repo_showcase.ts</span>
                </div>
                {/* Code content */}
                <div className="p-5 font-mono text-xs space-y-1.5" style={{ lineHeight: '1.8' }}>
                  <div><span className="text-blue-400">const</span> <span className="text-monad-400">repo</span> <span style={{ color: 'var(--text-muted)' }}>= await</span> <span className="text-green-400">bolty.repos.publish</span><span style={{ color: 'var(--text-muted)' }}>{'({'}</span></div>
                  <div className="pl-4"><span className="text-amber-400">name</span><span style={{ color: 'var(--text-muted)' }}>:</span> <span className="text-green-400">'my-ai-agent'</span><span style={{ color: 'var(--text-muted)' }}>,</span></div>
                  <div className="pl-4"><span className="text-amber-400">price</span><span style={{ color: 'var(--text-muted)' }}>:</span> <span className="text-blue-400">0.05</span><span style={{ color: 'var(--text-muted)' }}>, </span><span className="text-zinc-600">// ETH</span></div>
                  <div className="pl-4"><span className="text-amber-400">access</span><span style={{ color: 'var(--text-muted)' }}>:</span> <span className="text-green-400">'locked'</span><span style={{ color: 'var(--text-muted)' }}>,</span></div>
                  <div className="pl-4"><span className="text-amber-400">visibility</span><span style={{ color: 'var(--text-muted)' }}>:</span> <span className="text-green-400">'public'</span><span style={{ color: 'var(--text-muted)' }}>,</span></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{'}'}</span><span style={{ color: 'var(--text-muted)' }}>);</span></div>
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-green-400">✓ </span>
                    <span className="text-monad-400">Published</span>
                    <span style={{ color: 'var(--text-muted)' }}> · </span>
                    <span style={{ color: 'var(--text-muted)' }}>0x3f8a...buyers can unlock</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── AI SECTION ───────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse, rgba(131,110,249,0.07) 0%, transparent 65%)' }} />
        </div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Section>
            <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Built-in AI</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5" style={{ color: 'var(--text)' }}>
              Ask, build, ship — faster
            </h2>
            <p className="text-base leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-muted)' }}>
              The Bolty AI assistant, powered by Google Gemini, is always one click away.
              Ask code questions, get architecture advice, or debug issues — without leaving the platform.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { title: 'Code review',       desc: 'Get instant feedback on your code quality, bugs, and best practices.' },
                { title: 'Architecture',      desc: 'Design system architecture with an AI that understands modern stacks.' },
                { title: 'Debug assistance',  desc: 'Paste an error, get a clear explanation and fix suggestion immediately.' },
              ].map(item => (
                <div key={item.title} className="rounded-xl p-4 text-left group hover:border-monad-500/30 transition-all duration-200"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-lg bg-monad-500/10 border border-monad-500/20 flex items-center justify-center mb-3">
                    <span className="w-2 h-2 rounded-full bg-monad-400" />
                  </div>
                  <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{item.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-3xl mx-auto px-4">
        <Section>
          <div className="text-center mb-12">
            <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => <FAQItem key={item.q} {...item} />)}
          </div>
        </Section>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden" style={{ borderTop: '1px solid var(--border)' }}>
        <GeometricBg />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]"
            style={{
              background: 'radial-gradient(ellipse, rgba(131,110,249,0.12) 0%, transparent 65%)',
              animation: 'hero-glow-pulse 5s ease-in-out infinite',
            }} />
        </div>
        <Section>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            {/* Big logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-3xl opacity-40"
                  style={{ background: 'rgba(131,110,249,0.5)', animation: 'logo-pulse 3s ease-in-out infinite' }} />
                <BoltyLogo size={72} color="#836EF9" className="relative z-10" style={{ filter: 'drop-shadow(0 0 12px rgba(131,110,249,0.5))' } as React.CSSProperties} />
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
              <span style={{
                background: 'linear-gradient(135deg, #836EF9 0%, #a78bfa 50%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Start building today.
              </span>
            </h2>
            <p className="text-lg mb-10" style={{ color: 'var(--text-muted)' }}>
              Join developers who are already publishing code, deploying agents, and growing their audience on Bolty.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth" className="btn-primary px-10 py-4 rounded-xl text-base inline-flex items-center gap-2">
                Create free account <ArrowIcon />
              </Link>
              <Link href="/market" className="btn-secondary px-10 py-4 rounded-xl text-base">
                Explore marketplace
              </Link>
            </div>
            <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
              No credit card required. Connect with email or GitHub.
            </p>
          </div>
        </Section>
      </section>

    </div>
  );
}
