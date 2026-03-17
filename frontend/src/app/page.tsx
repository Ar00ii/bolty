'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { motion, useReducedMotion } from 'framer-motion';
import { BoltyLogo } from '@/components/ui/BoltyLogo';
import { GeometricBg } from '@/components/ui/GeometricBg';
import { Spotlight } from '@/components/ui/spotlight';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';
import { SplineScene } from '@/components/ui/splite';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { FeatureCard, GridPattern, genRandomPattern } from '@/components/ui/grid-feature-cards';
import { InteractiveHoverLinkInner } from '@/components/ui/interactive-hover-button';
import {
  Code2,
  Bot,
  Users,
  Coins,
  GitBranch,
  UserPlus,
  Upload,
  TrendingUp,
  MessageSquare,
  Layers,
  Zap,
  HelpCircle,
  ShoppingBag,
  Lock,
  Wallet,
  Star,
  Activity,
  Terminal,
  CheckCircle,
  Globe,
  Shield,
  Cpu,
  Hash,
} from 'lucide-react';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';

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

// ── Animated container (framer-motion, scroll-triggered) ──────────────────────
type ViewAnimationProps = {
  delay?: number;
  className?: string;
  children: React.ReactNode;
};
function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <>{children}</>;
  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function AgentIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5M4.5 15.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
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

// ── Orbital timeline data ─────────────────────────────────────────────────────
const ORBITAL_DATA = [
  {
    id: 1,
    title: 'AI Assistant',
    date: 'Live',
    content: 'Intelligent code assistance built directly into the platform. Ask questions, get instant answers on code reviews, architecture decisions, and debugging.',
    category: 'AI',
    icon: Bot,
    relatedIds: [2, 3],
    status: 'completed' as const,
    energy: 95,
  },
  {
    id: 2,
    title: 'Code Repos',
    date: 'Live',
    content: 'Publish your code repositories to the Bolty community. Offer free or paid access, earn reputation, and grow your developer profile.',
    category: 'Dev',
    icon: Code2,
    relatedIds: [1, 5],
    status: 'completed' as const,
    energy: 90,
  },
  {
    id: 3,
    title: 'AI Agents',
    date: 'Beta',
    content: 'Publish and discover AI agents, bots, and automation tools. Share your creations with the community — upload directly from the platform.',
    category: 'Agents',
    icon: Bot,
    relatedIds: [1, 4],
    status: 'in-progress' as const,
    energy: 75,
  },
  {
    id: 4,
    title: 'Community',
    date: 'Live',
    content: 'Real-time global chat, direct messages, and social features. Connect with developers, share ideas, and find collaborators worldwide.',
    category: 'Social',
    icon: Users,
    relatedIds: [3, 5],
    status: 'completed' as const,
    energy: 85,
  },
  {
    id: 5,
    title: 'ETH Payments',
    date: 'Live',
    content: 'On-chain payments for locked repos and agent listings. Buyers pay directly to your wallet in ETH — no middleman, no fees.',
    category: 'Payments',
    icon: Coins,
    relatedIds: [2, 6],
    status: 'completed' as const,
    energy: 80,
  },
  {
    id: 6,
    title: 'Repo Sync',
    date: 'Live',
    content: 'Connect your version control account with one click. Sync repositories, track activity, and publish projects directly to the marketplace.',
    category: 'Integration',
    icon: GitBranch,
    relatedIds: [2, 5],
    status: 'completed' as const,
    energy: 88,
  },
];

// ── Feature cards data ─────────────────────────────────────────────────────────
const PLATFORM_FEATURES: Array<{ title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; description: string; href: string }> = [
  { title: 'AI Assistant', icon: AgentIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Built-in AI assistant. Instant answers on code reviews, architecture decisions, and debugging — without leaving the platform.', href: '#ai' },
  { title: 'Code Repos', icon: CodeIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Publish your code repositories to the Bolty community. Offer free or paid access, earn votes, and build your developer reputation.', href: '/repos' },
  { title: 'AI Agents', icon: MarketIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Publish and discover AI agents, bots, and automation tools. Share your creations with the world — upload directly from the platform.', href: '/market' },
  { title: 'Community', icon: UsersIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Real-time global chat, direct messages, and social features. Connect with developers, share ideas, find collaborators.', href: '/chat' },
];

// ── Steps data ─────────────────────────────────────────────────────────────────
const STEPS: Array<{ title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; description: string }> = [
  { title: 'Create your account', icon: UserPlus as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Sign up with email, GitHub, or a Web3 wallet. Your profile is your developer identity on Bolty.' },
  { title: 'Publish your work', icon: Upload as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Connect GitHub to publish repos. Create market listings for bots, scripts, or AI agents you built.' },
  { title: 'Grow and earn', icon: TrendingUp as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Get upvotes, build reputation, sell locked repos for ETH, and connect with buyers and collaborators.' },
];

// ── AI features data ────────────────────────────────────────────────────────────
const AI_FEATURES: Array<{ title: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; description: string }> = [
  { title: 'Code review', icon: MessageSquare as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Get instant feedback on your code quality, bugs, and best practices.' },
  { title: 'Architecture', icon: Layers as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Design system architecture with an AI that understands modern stacks.' },
  { title: 'Debug assistance', icon: Zap as React.ComponentType<React.SVGProps<SVGSVGElement>>, description: 'Paste an error, get a clear explanation and fix suggestion immediately.' },
];

// ── New data ───────────────────────────────────────────────────────────────────
const STATS = [
  { value: '1,200+', label: 'Developers joined' },
  { value: '3,400+', label: 'Repos published' },
  { value: '240+', label: 'AI agents deployed' },
  { value: '18.4 ETH', label: 'Earned by creators' },
];

const INTEGRATIONS = [
  { name: 'GitHub', icon: GitBranch, desc: 'Sync repos in one click' },
  { name: 'Ethereum', icon: Coins, desc: 'On-chain ETH payments' },
  { name: 'Solana', icon: Zap, desc: 'Multi-chain support' },
  { name: 'Any language', icon: Code2, desc: 'All stacks welcome' },
  { name: 'AI models', icon: Bot, desc: 'GPT, Claude & more' },
  { name: 'Terminal', icon: Terminal, desc: 'CLI toolkit coming soon' },
];

const COMMUNITY_STATS = [
  { value: '40+', label: 'Countries represented' },
  { value: '890+', label: 'Active this week' },
  { value: '12K+', label: 'Messages sent' },
  { value: '99.9%', label: 'Platform uptime' },
];

const RECENT_ACTIVITY = [
  { time: '2m ago', action: 'alex_dev published a new AI agent', icon: Bot },
  { time: '5m ago', action: 'sara_k locked a TypeScript repo for 0.02 ETH', icon: Lock },
  { time: '9m ago', action: 'mikato joined Bolty', icon: UserPlus },
  { time: '14m ago', action: 'jrd_builds published react-hooks-lib', icon: Code2 },
  { time: '21m ago', action: 'nullbyte earned 0.08 ETH from 4 purchases', icon: Coins },
  { time: '28m ago', action: 'yanira_dev shared in global chat', icon: MessageSquare },
];

const TESTIMONIALS = [
  {
    name: 'Alex R.',
    role: 'Senior Full-Stack Dev',
    text: 'I published three locked repos in my first week on Bolty and earned my first ETH without any crypto complexity. The GitHub sync made it incredibly simple.',
  },
  {
    name: 'Yuki T.',
    role: 'AI/ML Engineer',
    text: 'The AI agent marketplace is exactly what I needed. I deployed my automation toolkit and it already has dozens of buyers — all handled through the platform.',
  },
  {
    name: 'Sara M.',
    role: 'Indie Developer',
    text: 'The built-in AI assistant saves me hours every week. It understands context across my projects and gives me real code-level feedback, not generic advice.',
  },
];

const EXTENDED_FAQ = [
  { q: 'Is Bolty free to use?', a: 'Yes, creating an account and publishing free repositories is completely free. You only pay if you want to purchase a locked repository from another developer.', icon: HelpCircle },
  { q: 'How does the marketplace work?', a: 'Developers list their bots, scripts, AI agents, and tools. Buyers browse listings and purchase access directly through the platform using ETH payments.', icon: ShoppingBag },
  { q: 'What is a locked repository?', a: 'A locked repo is a GitHub repository where the developer has set a price. Buyers pay in ETH to unlock full access to clone or download it.', icon: Lock },
  { q: 'Can I use Bolty without a wallet?', a: 'Yes. You can sign up with email or GitHub and use all community features without a wallet. A wallet is only needed for on-chain transactions.', icon: Wallet },
  { q: 'How does community voting work?', a: 'Every published repo and agent can be upvoted by the community. Higher votes increase visibility in search and discovery — there is no cost to vote.', icon: TrendingUp },
  { q: 'What programming languages are supported?', a: 'Bolty supports any language you can push to GitHub — from JavaScript and Python to Rust, Go, Solidity, and beyond. The AI assistant is fully language-agnostic.', icon: Code2 },
  { q: 'Can I earn without cryptocurrency?', a: 'Currently, payouts are settled in ETH on-chain. You need a compatible wallet address to receive payments, but you can explore and use all community features without one.', icon: Coins },
  { q: 'How do AI agents work on the platform?', a: 'You upload your agent code, set a description and pricing, and it becomes discoverable in the marketplace. Buyers can purchase and integrate it into their own workflows instantly.', icon: Bot },
];

const AI_CHAT_PREVIEW = [
  { role: 'user', text: 'How do I optimize this React re-render?' },
  { role: 'ai', text: 'The issue is likely in your useEffect dependency array. Wrap your callback with useCallback and memoize expensive computations with useMemo to prevent unnecessary renders.' },
  { role: 'user', text: 'Should I use useMemo or React.memo here?' },
  { role: 'ai', text: 'Use React.memo to memoize the component itself when its props rarely change. Use useMemo for expensive in-component calculations. In your case, both would help — apply React.memo to the child first.' },
];

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{ borderColor: open ? 'rgba(131,110,249,0.35)' : 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-sm font-medium text-zinc-200">{q}</span>
        <svg className={`w-4 h-4 text-monad-400 flex-shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      {open && (
        <div className="px-5 pb-4 text-sm leading-relaxed" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="pt-4 text-zinc-400">{a}</p>
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

// ── DashedCard: generic dashed-border + grid-pattern card ─────────────────────
function DashedCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const squares = genRandomPattern();
  return (
    <div className={`relative overflow-hidden border border-dashed border-white/10 p-5 ${className}`}>
      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
          <GridPattern
            width={20}
            height={20}
            x="-12"
            y="4"
            squares={squares}
            className="fill-white/5 stroke-white/10 absolute inset-0 h-full w-full mix-blend-overlay"
          />
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="bg-black overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative h-screen bg-black overflow-hidden">
        <Spotlight className="-top-40 left-0 md:left-80 md:-top-20" fill="white" />
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto px-8 w-full">
            <div className="relative z-10 flex flex-col max-w-lg pointer-events-auto">
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
              {!isAuthenticated && (
                <div>
                  <Link href="/auth">
                    <InteractiveHoverLinkInner text="Get started" className="text-sm" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/2 h-full hidden md:block">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </section>

      {/* ── STATS — asymmetric left/right ──────────────────────────────── */}
      <section className="py-20 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 right-0 w-[400px] h-[300px] -translate-y-1/2"
            style={{ background: 'radial-gradient(ellipse at right, rgba(131,110,249,0.07) 0%, transparent 70%)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedContainer>
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Platform overview</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                The platform,<br />by the numbers
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                A growing ecosystem of developers publishing code, deploying agents, and earning on-chain — from 40+ countries.
              </p>
            </AnimatedContainer>
            <div className="grid grid-cols-2 gap-px bg-white/06 border border-white/06">
              {STATS.map((s, i) => (
                <AnimatedContainer key={s.label} delay={i * 0.08}>
                  <div className="px-8 py-7 bg-black hover:bg-monad-500/4 transition-colors">
                    <div className="text-4xl font-black mb-2 tabular-nums"
                      style={{ background: 'linear-gradient(135deg,#836EF9 0%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {s.value}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">{s.label}</div>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES — feature list left + orbital right ──────────────── */}
      <section className="relative w-full py-24 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <BackgroundPaths />
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <AnimatedContainer delay={0.3} className="lg:w-5/12 w-full flex flex-col">
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Platform features</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                Everything you need to build
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
                From AI assistance to code markets — Bolty brings together the tools developers reach for daily.
              </p>
              {PLATFORM_FEATURES.map((f, i) => {
                const isCommunity = f.title === 'Community';
                return (
                  <Link key={f.href} href={f.href} className={`block group ${i > 0 ? '-mt-px' : ''}`}>
                    <div className={`relative overflow-hidden border border-dashed transition-colors duration-200 hover:bg-monad-500/5 hover:border-monad-500/30 ${isCommunity ? 'border-monad-400/30' : 'border-white/20'}`}>
                      {isCommunity && (
                        <div className="absolute inset-0 opacity-30">
                          <AnimatedShaderBackground />
                        </div>
                      )}
                      <FeatureCard feature={f} className="border-0 relative z-10" />
                    </div>
                  </Link>
                );
              })}
            </AnimatedContainer>
            <AnimatedContainer delay={0.2} className="lg:w-7/12 w-full flex items-center justify-center">
              <RadialOrbitalTimeline timelineData={ORBITAL_DATA} />
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS — left title + right grid ────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Left: title */}
            <AnimatedContainer className="lg:sticky lg:top-24">
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Integrations</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                Works with<br />your stack
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-xs">
                Bolty connects with the tools and chains you already use — no complicated setup required.
              </p>
              <Link href="/auth">
                <span className="text-xs font-mono text-monad-400 hover:text-monad-300 transition-colors">
                  Get early access →
                </span>
              </Link>
            </AnimatedContainer>
            {/* Right: integration tiles 2x3 */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              {INTEGRATIONS.map((item, i) => (
                <AnimatedContainer key={item.name} delay={i * 0.07}>
                  <div className="border rounded-2xl p-5 hover:border-monad-500/30 hover:bg-monad-500/5 transition-all duration-200 group cursor-default h-full"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
                      style={{ background: 'rgba(131,110,249,0.1)' }}>
                      <item.icon className="w-5 h-5 text-monad-400" strokeWidth={1.5} />
                    </div>
                    <div className="text-sm font-medium text-zinc-300 mb-1">{item.name}</div>
                    <div className="text-xs text-zinc-600">{item.desc}</div>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — vertical numbered steps ────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <AnimatedContainer className="mb-16">
            <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white max-w-sm">
              Up and running in minutes
            </h2>
          </AnimatedContainer>

          <div className="space-y-0">
            {STEPS.map((step, i) => (
              <AnimatedContainer key={step.title} delay={0.15 * i}>
                <div className="grid grid-cols-12 gap-6 py-10 border-b border-dashed border-white/08 group hover:bg-monad-500/2 transition-colors px-2">
                  {/* Big step number */}
                  <div className="col-span-2 flex items-start justify-end pt-1">
                    <span className="text-6xl font-black tabular-nums leading-none select-none"
                      style={{ color: 'rgba(131,110,249,0.12)', fontVariantNumeric: 'tabular-nums' }}>
                      0{i + 1}
                    </span>
                  </div>
                  {/* Icon + content */}
                  <div className="col-span-8 md:col-span-7">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.2)' }}>
                        <step.icon className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-base font-semibold text-zinc-200">{step.title}</h3>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed max-w-md">{step.description}</p>
                  </div>
                  {/* Metric */}
                  <div className="col-span-2 md:col-span-3 flex items-center justify-end">
                    {i === 0 && <span className="text-xs font-mono text-monad-400/60 text-right hidden md:block">email · GitHub<br />or Web3 wallet</span>}
                    {i === 1 && <span className="text-xs font-mono text-monad-400/60 text-right hidden md:block">{'< 5 min'}<br />to go live</span>}
                    {i === 2 && <span className="text-xs font-mono text-monad-400/60 text-right hidden md:block">instant<br />ETH payout</span>}
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* ── CODE SHOWCASE — code left, text right ─────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Code card first on desktop */}
          <Section className="order-2 lg:order-1 reveal-d2">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500"
                style={{ background: 'linear-gradient(135deg, rgba(131,110,249,0.2), rgba(99,91,255,0.1))' }} />
              <DashedCard className="rounded-2xl">
                <div className="flex items-center gap-2 px-4 py-3 mb-2" style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
                  <Code2 className="w-3.5 h-3.5 text-monad-400 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-zinc-500">repo_showcase.ts</span>
                </div>
                <div className="p-5 font-mono text-xs space-y-1.5" style={{ lineHeight: '1.8' }}>
                  <div><span className="text-blue-400">const</span> <span className="text-monad-400">repo</span> <span className="text-zinc-500">= await</span> <span className="text-green-400">bolty.repos.publish</span><span className="text-zinc-500">{'({'}</span></div>
                  <div className="pl-4"><span className="text-amber-400">name</span><span className="text-zinc-500">:</span> <span className="text-green-400">'my-ai-agent'</span><span className="text-zinc-500">,</span></div>
                  <div className="pl-4"><span className="text-amber-400">price</span><span className="text-zinc-500">:</span> <span className="text-blue-400">0.05</span><span className="text-zinc-500">, </span><span className="text-zinc-700">// ETH</span></div>
                  <div className="pl-4"><span className="text-amber-400">access</span><span className="text-zinc-500">:</span> <span className="text-green-400">'locked'</span><span className="text-zinc-500">,</span></div>
                  <div className="pl-4"><span className="text-amber-400">visibility</span><span className="text-zinc-500">:</span> <span className="text-green-400">'public'</span><span className="text-zinc-500">,</span></div>
                  <div><span className="text-zinc-500">{'}'}</span><span className="text-zinc-500">);</span></div>
                  <div className="mt-2 pt-2" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                    <span className="text-green-400">✓ </span>
                    <span className="text-monad-400">Published</span>
                    <span className="text-zinc-500"> · </span>
                    <span className="text-zinc-500">0x3f8a...buyers can unlock</span>
                  </div>
                </div>
              </DashedCard>
            </div>
          </Section>

          {/* Text second on desktop */}
          <Section className="order-1 lg:order-2">
            <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Code marketplace</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5 text-white">
              Monetize your GitHub repositories
            </h2>
            <p className="text-base leading-relaxed mb-6 text-zinc-400">
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
                <li key={item} className="flex items-center gap-3 text-sm text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-monad-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/repos">
              <InteractiveHoverLinkInner text="Browse repos" className="text-sm" />
            </Link>
          </Section>
        </div>
      </section>

      {/* ── COMMUNITY — 2-col text+stats / activity feed ──────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#000' }}>
        <AnimatedShaderBackground />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <AnimatedContainer>
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Community</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-5">
                Built by developers,<br />for developers
              </h2>
              <p className="text-zinc-400 mb-8 leading-relaxed text-base">
                Connect with a global community of developers, share your projects, collaborate
                on ideas, and find the next person who needs exactly what you built.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {COMMUNITY_STATS.map(s => (
                  <div key={s.label} className="border border-white/06 rounded-xl p-4 hover:border-monad-500/20 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-2xl font-bold text-monad-400 mb-1">{s.value}</div>
                    <div className="text-xs text-zinc-500 font-mono">{s.label}</div>
                  </div>
                ))}
              </div>
              <Link href="/chat">
                <InteractiveHoverLinkInner text="Join the community" className="text-sm" />
              </Link>
            </AnimatedContainer>
            <AnimatedContainer delay={0.2}>
              <div className="border border-white/08 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Activity className="w-3.5 h-3.5 text-monad-400" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-zinc-400">platform activity</span>
                  <span className="text-xs text-zinc-700 ml-auto font-mono">live</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-1 animate-pulse flex-shrink-0" />
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {RECENT_ACTIVITY.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-white/02 transition-colors">
                      <span className="text-zinc-700 font-mono text-xs w-14 flex-shrink-0">{item.time}</span>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(131,110,249,0.1)' }}>
                        <item.icon className="w-3 h-3 text-monad-400/80" strokeWidth={1.5} />
                      </div>
                      <span className="text-zinc-400 text-xs leading-relaxed">{item.action}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <Link href="/chat" className="text-xs text-monad-400 hover:text-monad-300 font-mono transition-colors">
                    Open global chat →
                  </Link>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* ── AI SECTION — full header top, chat left + features right ──── */}
      <section id="ai" className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse, rgba(131,110,249,0.07) 0%, transparent 65%)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Header row — left aligned */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <AnimatedContainer>
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-3">Built-in AI</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Ask, build, ship — faster
              </h2>
            </AnimatedContainer>
            <AnimatedContainer delay={0.2}>
              <p className="text-sm leading-relaxed text-zinc-400 max-w-sm md:text-right">
                The Bolty AI assistant is always one click away.
                Ask code questions, get architecture advice, or debug issues.
              </p>
            </AnimatedContainer>
          </div>

          {/* Content: chat preview LEFT, features RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Chat preview */}
            <AnimatedContainer delay={0.1}>
              <div className="border border-white/08 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Bot className="w-3.5 h-3.5 text-monad-400" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-zinc-400">Bolty AI</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ background: 'rgba(131,110,249,0.15)', color: '#836EF9' }}>Live</span>
                </div>
                <div className="p-4 space-y-4">
                  {AI_CHAT_PREVIEW.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        msg.role === 'user' ? 'bg-zinc-800 text-zinc-400' : 'text-monad-400'
                      }`} style={msg.role === 'ai' ? { background: 'rgba(131,110,249,0.15)' } : {}}>
                        {msg.role === 'user' ? 'U' : <Bot className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      </div>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === 'user' ? 'bg-zinc-800/70 text-zinc-300 rounded-tr-none' : 'text-zinc-400 rounded-tl-none'
                      }`} style={msg.role === 'ai' ? { background: 'rgba(131,110,249,0.08)', border: '1px solid rgba(131,110,249,0.15)' } : {}}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 border"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-xs text-zinc-700 flex-1 font-mono">Ask anything about your code...</span>
                    <Zap className="w-3.5 h-3.5 text-monad-400/50" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </AnimatedContainer>

            {/* Features + CTA */}
            <div>
              <AnimatedContainer delay={0.3}
                className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 divide-x-0 lg:divide-x lg:divide-y-0 divide-y divide-dashed border border-dashed border-white/10 text-left mb-6">
                {AI_FEATURES.map((item) => (
                  <FeatureCard key={item.title} feature={item} />
                ))}
              </AnimatedContainer>
              <AnimatedContainer delay={0.4}>
                <Link href="/ai">
                  <InteractiveHoverLinkInner text="Try AI assistant" className="text-sm" />
                </Link>
              </AnimatedContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS — featured large quote + 2 smaller ──────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <AnimatedContainer>
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-3">From the community</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                What developers say
              </h2>
            </AnimatedContainer>
            <AnimatedContainer delay={0.1}>
              <p className="text-sm text-zinc-500 max-w-xs md:text-right">
                Real feedback from developers who publish, build, and earn on Bolty.
              </p>
            </AnimatedContainer>
          </div>

          {/* Featured quote full-width */}
          <AnimatedContainer delay={0.1} className="mb-6">
            <div className="border rounded-2xl p-8 md:p-10 relative overflow-hidden hover:border-monad-500/25 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="absolute top-6 right-8 text-7xl font-black leading-none select-none"
                style={{ color: 'rgba(131,110,249,0.08)' }}>"</div>
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-monad-400 fill-monad-400" />)}
              </div>
              <p className="text-zinc-300 text-lg md:text-xl leading-relaxed mb-8 max-w-3xl">
                &ldquo;{TESTIMONIALS[0].text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-monad-400"
                  style={{ background: 'rgba(131,110,249,0.15)' }}>
                  {TESTIMONIALS[0].name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{TESTIMONIALS[0].name}</div>
                  <div className="text-xs text-zinc-600">{TESTIMONIALS[0].role}</div>
                </div>
                <CheckCircle className="w-4 h-4 text-monad-400/50 ml-auto" strokeWidth={1.5} />
              </div>
            </div>
          </AnimatedContainer>

          {/* 2 smaller cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {TESTIMONIALS.slice(1).map((t, i) => (
              <AnimatedContainer key={t.name} delay={0.2 + i * 0.1}>
                <div className="border rounded-2xl p-6 h-full flex flex-col hover:border-monad-500/25 transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-monad-400 fill-monad-400" />)}
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-5 flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-monad-400"
                      style={{ background: 'rgba(131,110,249,0.15)' }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">{t.name}</div>
                      <div className="text-xs text-zinc-600">{t.role}</div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-monad-400/50 ml-auto" strokeWidth={1.5} />
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>

          {/* Social proof strip */}
          <AnimatedContainer delay={0.4}>
            <div className="border border-dashed border-white/08 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left"
              style={{ background: 'rgba(131,110,249,0.03)' }}>
              <div className="flex -space-x-2 flex-shrink-0">
                {['A','B','C','D','E'].map((l, i) => (
                  <div key={l} className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-monad-400"
                    style={{ background: `rgba(131,110,249,${0.1 + i * 0.04})` }}>{l}</div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-zinc-500"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>+</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-200">Join 1,200+ developers already on the platform</div>
                <div className="text-xs text-zinc-500 mt-1">From 40+ countries — free to start, no credit card required.</div>
              </div>
              {!isAuthenticated && (
                <Link href="/auth" className="sm:ml-auto flex-shrink-0">
                  <InteractiveHoverLinkInner text="Get started free" className="text-sm" />
                </Link>
              )}
            </div>
          </AnimatedContainer>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <Section>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div>
                <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-3">FAQ</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Common questions</h2>
              </div>
              <p className="text-sm text-zinc-600 max-w-xs md:text-right">
                Can&apos;t find the answer? Chat with us in the community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXTENDED_FAQ.map(item => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm text-zinc-600 mb-4">Still have questions?</p>
              <Link href="/chat">
                <InteractiveHoverLinkInner text="Ask in community" className="text-sm" />
              </Link>
            </div>
          </Section>
        </div>
      </section>

      {/* ── PLATFORM HIGHLIGHTS — horizontal strip ────────────────────── */}
      <section className="py-16 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-dashed border border-dashed border-white/08">
            {[
              { icon: Shield, title: 'Security first', desc: 'End-to-end encrypted, OWASP compliant, 2FA supported. Your code and payments are safe.' },
              { icon: Cpu,    title: 'Developer-native', desc: 'Built by developers for developers. No fluff, no bloat — just the tools you actually need.' },
              { icon: Hash,   title: 'Truly decentralized', desc: 'Payments go directly on-chain. No middleman takes a cut from your hard-earned ETH.' },
            ].map((item, i) => (
              <AnimatedContainer key={item.title} delay={i * 0.1}>
                <div className="flex items-start gap-5 p-8 hover:bg-monad-500/4 transition-colors h-full">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(131,110,249,0.1)' }}>
                    <item.icon className="w-5 h-5 text-monad-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-2">{item.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <GeometricBg />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse, rgba(131,110,249,0.12) 0%, transparent 65%)', animation: 'hero-glow-pulse 5s ease-in-out infinite' }} />
        </div>
        <Section>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-3xl opacity-40"
                  style={{ background: 'rgba(131,110,249,0.5)', animation: 'logo-pulse 3s ease-in-out infinite' }} />
                <BoltyLogo size={72} className="relative z-10" style={{ filter: 'drop-shadow(0 0 18px rgba(131,110,249,0.6))' } as React.CSSProperties} />
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
              <span style={{ background: 'linear-gradient(135deg, #836EF9 0%, #a78bfa 50%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Start building today.
              </span>
            </h2>
            <p className="text-lg mb-10 text-zinc-400">
              Join developers who are already publishing code, deploying agents, and growing their audience on Bolty.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isAuthenticated ? (
                <>
                  <Link href="/auth">
                    <InteractiveHoverLinkInner text="Create free account" />
                  </Link>
                  <Link href="/market">
                    <InteractiveHoverLinkInner text="Explore marketplace" className="border-zinc-600/40" />
                  </Link>
                </>
              ) : (
                <Link href="/market">
                  <InteractiveHoverLinkInner text="Explore marketplace" />
                </Link>
              )}
            </div>
            <p className="text-xs mt-6 text-zinc-600">
              No credit card required. Connect with email or GitHub.
            </p>
          </div>
        </Section>
      </section>

    </div>
  );
}
