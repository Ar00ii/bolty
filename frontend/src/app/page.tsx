'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { motion, useReducedMotion } from 'framer-motion';
import { BoltyLogo } from '@/components/ui/BoltyLogo';
import { FeatureCard } from '@/components/ui/grid-feature-cards';
import { InteractiveHoverLinkInner } from '@/components/ui/interactive-hover-button';
import GridMotion from '@/components/ui/GridMotion';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { NumberTicker } from '@/components/ui/number-ticker';
import { AnimatedList } from '@/components/ui/animated-list';
import { AvatarCircles } from '@/components/ui/avatar-circles';
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
  Rocket,
  ArrowRight,
} from 'lucide-react';

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
    date: 'Maintenance',
    content: 'Intelligent code assistance built directly into the platform. Currently undergoing scheduled maintenance — will be back online soon.',
    category: 'AI',
    icon: Bot,
    relatedIds: [2, 3],
    status: 'in-progress' as const,
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
  { value: 'Beta', label: 'Current version', numeric: null },
  { value: '3', label: 'Planned releases', numeric: 3 },
  { value: 'ETH', label: 'On-chain payments', numeric: null },
  { value: '100%', label: 'Open to devs', numeric: 100, suffix: '%' },
];

const LIVE_NOTIFICATIONS = [
  { title: 'Payment received',  desc: 'Solidity Auditor · 1.2 ETH',   time: '2m ago',  Icon: Coins,        bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.15)',  iconColor: '#34d399' },
  { title: 'New sale',          desc: 'React Hooks Lib sold',          time: '5m ago',  Icon: ShoppingBag,  bg: 'rgba(131,110,249,0.08)', border: 'rgba(131,110,249,0.18)', iconColor: '#836ef9' },
  { title: 'New message',       desc: 'Negotiation on NLP Pipeline',   time: '7m ago',  Icon: MessageSquare,bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.15)',  iconColor: '#fb923c' },
  { title: 'New developer',     desc: 'Joined Bolty',                  time: '11m ago', Icon: UserPlus,     bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.15)',  iconColor: '#60a5fa' },
  { title: 'Agent deployed',    desc: 'Price Predictor v2 live',       time: '14m ago', Icon: Bot,          bg: 'rgba(131,110,249,0.08)', border: 'rgba(131,110,249,0.18)', iconColor: '#836ef9' },
  { title: 'Payment received',  desc: 'GPT Summarizer · 0.2 ETH',     time: '18m ago', Icon: Coins,        bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.15)',  iconColor: '#34d399' },
];

const INTEGRATIONS: Array<{ name: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | null; desc: string; isBase?: boolean }> = [
  { name: 'GitHub', icon: GitBranch, desc: 'Sync repos in one click' },
  { name: 'Ethereum', icon: Coins, desc: 'On-chain ETH payments' },
  { name: 'Base', icon: null, desc: 'Layer 2 by Coinbase', isBase: true },
  { name: 'BOLTY Token', icon: Zap, desc: '0 tax — pay with BOLTY' },
  { name: 'Any language', icon: Code2, desc: 'All stacks welcome' },
  { name: 'AI models', icon: Bot, desc: 'GPT, Claude & more' },
];

const COMMUNITY_STATS = [
  { value: 'Global', label: 'Open to all devs' },
  { value: 'Live', label: 'Real-time chat' },
  { value: 'Free', label: 'No cost to join' },
  { value: '24/7', label: 'Platform available' },
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

// ── DashedCard: generic card ───────────────────────────────────────────────────
function DashedCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden border border-white/[0.07] p-5 ${className}`}>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO — Monad layout: left top-aligned + right stats sidebar ── */}
      <section className="flex h-screen overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

        {/* LEFT COLUMN: text at top, animation at bottom */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Text block — starts at the top */}
          <div className="px-10 lg:px-16 pt-16 pb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <AnimatedGradientText className="mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-monad-400 animate-pulse mr-2" />
              <span className="text-xs font-mono text-monad-400 uppercase tracking-widest">Built for developers</span>
            </AnimatedGradientText>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-6 tracking-tight">
              <span className="block text-white">Publish.</span>
              <span className="block" style={{ background: 'linear-gradient(135deg,#836EF9 0%,#c4b5fd 50%,#836EF9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Collaborate.</span>
              <span className="block text-white">Earn.</span>
            </h1>
            <p className="text-zinc-400 max-w-lg text-base leading-relaxed mb-8">
              Bolty brings together code, AI agents, and community in one developer-first platform.
              Share your work, grow your audience, and earn on-chain.
            </p>
            {!isAuthenticated && (
              <div className="flex items-center gap-4">
                <Link href="/auth">
                  <InteractiveHoverLinkInner text="Get started" className="text-sm" />
                </Link>
                <Link href="#features" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Animation block — fills remaining height */}
          <div className="flex-1 relative overflow-hidden">
            <GridMotion
              gradientColor="rgba(0,0,0,0.5)"
              items={[
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              ]}
            />
          </div>

        </div>

        {/* RIGHT COLUMN: stats sidebar — full height with left border */}
        <div className="hidden lg:flex flex-col shrink-0 w-72 xl:w-80" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { value: '500+', label: 'Developers' },
            { value: 'ETH', label: 'On-chain payments' },
            { value: '100%', label: 'EVM compatible' },
            { value: 'Base', label: 'Supported chain', isBase: true },
            { value: 'Beta', label: 'Current phase' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 flex flex-col justify-center px-8"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                {stat.isBase && (
                  <svg width="32" height="32" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
                    <path d="M55.7 82.7c15.1 0 27.3-12.2 27.3-27.3S70.8 28.1 55.7 28.1c-14.1 0-25.7 10.7-27.2 24.4h36v6.1h-36C30 72 41.6 82.7 55.7 82.7z" fill="white"/>
                  </svg>
                )}
                <div>
                  <div className="text-4xl xl:text-5xl font-black tabular-nums text-white leading-none mb-1">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ── ONCHAIN PAYMENTS — GridMotion fullscreen ───────────────────── */}
      <section className="relative h-screen overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* GridMotion background */}
        <div className="absolute inset-0 z-0">
          <GridMotion
            gradientColor="rgba(0,0,0,0.7)"
            items={[
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1748370987492-eb390a61dcda?q=80&w=3464&auto=format&fit=crop',
            ]}
          />
        </div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)' }} />
        {/* Content overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="max-w-3xl mx-auto px-8 text-center">
            <AnimatedContainer>
              <p className="text-xs font-mono uppercase tracking-widest mb-6"
                style={{ color: 'rgba(131,110,249,0.9)' }}>Onchain payments</p>
              <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-none">
                Pay. Sell. Earn.<br />
                <span style={{ background: 'linear-gradient(135deg,#836EF9 0%,#c4b5fd 50%,#0052FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  On Base.
                </span>
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed mb-10 max-w-lg mx-auto">
                Every transaction on Bolty is settled on-chain. No middlemen, no fees, no trust required.
                Buy locked repos or AI agents and pay directly to the developer&apos;s wallet.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <svg width="18" height="18" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
                    <path d="M55.7 82.7c15.1 0 27.3-12.2 27.3-27.3S70.8 28.1 55.7 28.1c-14.1 0-25.7 10.7-27.2 24.4h36v6.1h-36C30 72 41.6 82.7 55.7 82.7z" fill="white"/>
                  </svg>
                  <span className="text-sm text-zinc-300 font-mono">Base Network</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <Coins className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
                  <span className="text-sm text-zinc-300 font-mono">ETH payments</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <Shield className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
                  <span className="text-sm text-zinc-300 font-mono">Non-custodial</span>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* ── STATS — asymmetric left/right ──────────────────────────────── */}
      <section className="py-20 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedContainer>
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Platform overview</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                The platform,<br />by the numbers
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                Bolty is launching in Beta. Three planned releases — Beta, Gamma, and Alpha — each expanding the platform with new capabilities.
              </p>
            </AnimatedContainer>
            <div className="grid grid-cols-2 gap-px bg-white/06 border border-white/06">
              {STATS.map((s, i) => (
                <AnimatedContainer key={s.label} delay={i * 0.08}>
                  <div className="px-8 py-7 hover:bg-monad-500/5 transition-colors">
                    <div className="text-4xl font-black mb-2 tabular-nums"
                      style={{ background: 'linear-gradient(135deg,#836EF9 0%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {s.numeric != null
                        ? <NumberTicker value={s.numeric} suffix={s.suffix ?? ''} delay={i * 0.15} />
                        : s.value}
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Left: text + feature list */}
            <AnimatedContainer delay={0.1} className="lg:w-5/12 w-full flex flex-col">
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Platform features</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                Everything you need to build
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
                From AI assistance to code markets — Bolty brings together the tools developers reach for daily.
              </p>
              {PLATFORM_FEATURES.map((f, i) => (
                <Link key={f.href} href={f.href} className={`block group ${i > 0 ? '-mt-px' : ''}`}>
                  <div className="border border-white/[0.07] transition-colors duration-200 hover:bg-monad-500/5 hover:border-monad-500/25">
                    <FeatureCard feature={f} />
                  </div>
                </Link>
              ))}
            </AnimatedContainer>
            {/* Right: clean orbital feature grid */}
            <AnimatedContainer delay={0.2} className="lg:w-7/12 w-full">
              <div className="grid grid-cols-2 gap-3">
                {ORBITAL_DATA.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.06] hover:border-monad-500/20 hover:bg-monad-500/3 transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.015)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.18)' }}>
                      <item.icon className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200 mb-0.5">{item.title}</div>
                      <div className="text-xs text-zinc-500 leading-relaxed">{item.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedContainer className="mb-12">
            <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Integrations</p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Works with<br />your stack
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm md:text-right">
                Bolty connects with the tools and chains you already use — no complicated setup required.
              </p>
            </div>
          </AnimatedContainer>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {INTEGRATIONS.map((item, i) => (
              <AnimatedContainer key={item.name} delay={i * 0.07}>
                <div className="border rounded-xl p-5 flex items-center gap-4 hover:border-monad-500/30 hover:bg-monad-500/5 transition-all duration-200 cursor-default"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: item.isBase ? '#0052FF' : 'rgba(131,110,249,0.12)', border: item.isBase ? 'none' : '1px solid rgba(131,110,249,0.15)' }}>
                    {item.isBase ? (
                      <svg width="20" height="20" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M55.7 82.7c15.1 0 27.3-12.2 27.3-27.3S70.8 28.1 55.7 28.1c-14.1 0-25.7 10.7-27.2 24.4h36v6.1h-36C30 72 41.6 82.7 55.7 82.7z" fill="white"/>
                      </svg>
                    ) : item.icon ? (
                      <item.icon className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
                    ) : null}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{item.name}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              </AnimatedContainer>
            ))}
          </div>
          <AnimatedContainer delay={0.4}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/08"
              style={{ background: 'rgba(131,110,249,0.04)' }}>
              <Globe className="w-4 h-4 text-monad-400 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-zinc-500">Public API & more integrations coming in Gamma</span>
            </div>
          </AnimatedContainer>
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

      {/* ── LIVE ACTIVITY ──────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedContainer>
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-4">Real-time platform</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                Live platform<br />activity
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-sm">
                Sales, messages, and sign-ups happening across the ecosystem in real time.
              </p>
              <AvatarCircles
                numPeople={97}
                avatarUrls={[
                  { imageUrl: 'https://avatars.githubusercontent.com/u/16860528' },
                  { imageUrl: 'https://avatars.githubusercontent.com/u/20110627' },
                  { imageUrl: 'https://avatars.githubusercontent.com/u/106103625' },
                  { imageUrl: 'https://avatars.githubusercontent.com/u/59228569' },
                ]}
              />
              <p className="text-xs text-zinc-600 mt-2 font-mono">100+ developers already building</p>
            </AnimatedContainer>
            <div className="relative h-[320px] overflow-hidden rounded-2xl border border-white/[0.06]"
              style={{ background: 'rgba(10,10,18,0.8)' }}>
              <div className="absolute inset-x-0 top-0 h-12 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, rgba(10,10,18,0.8), transparent)' }} />
              <div className="absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(10,10,18,0.95), transparent)' }} />
              <div className="p-4 pt-6">
                <AnimatedList delay={1200}>
                  {LIVE_NOTIFICATIONS.map((n, i) => (
                    <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-0"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: n.bg, border: `1px solid ${n.border}` }}>
                        <n.Icon className="w-3.5 h-3.5" style={{ color: n.iconColor }} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-zinc-200 truncate">{n.title}</div>
                        <div className="text-[10px] text-zinc-600 truncate">{n.desc}</div>
                      </div>
                      <div className="text-[9px] font-mono text-zinc-700 flex-shrink-0">{n.time}</div>
                    </div>
                  ))}
                </AnimatedList>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROADMAP ──────────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="mb-16">
            <AnimatedContainer>
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-3">Step by step</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                Platform Roadmap
              </h2>
              <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
                Bolty is built in three phases. Each version expands the platform with new capabilities and deeper infrastructure.
              </p>
            </AnimatedContainer>
          </div>

          {/* Phase label: Beta */}
          <AnimatedContainer>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs font-mono text-monad-400 uppercase tracking-widest">Version 1 — Beta</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-monad-400 animate-pulse" />
                <span className="text-xs font-mono text-monad-400">Current</span>
              </div>
            </div>
          </AnimatedContainer>

          {/* Step 01 — full width */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mb-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="py-7">
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-monad-400 w-7 shrink-0 pt-1">01</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Code2 className="w-4 h-4 text-monad-400 shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(131,110,249,0.6), transparent)' }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Code Repository Publishing</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-xl mb-3">Publish and monetize code repositories directly on-chain. Set prices, manage access, and earn from every download.</p>
                  <ArrowRight className="w-4 h-4 text-monad-400/50" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 02 — indented */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}
            className="border-t pl-6" style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="py-7">
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-monad-400 w-7 shrink-0 pt-1">02</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Bot className="w-4 h-4 text-monad-400 shrink-0" strokeWidth={1.5} />
                    <div className="w-3/4 h-px" style={{ background: 'linear-gradient(to right, rgba(131,110,249,0.5), transparent)' }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">AI Assistant</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-lg mb-3">An intelligent assistant built into the platform. Ask questions, get code suggestions, and navigate the ecosystem seamlessly.</p>
                  <ArrowRight className="w-4 h-4 text-monad-400/50" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 03 — wide */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="py-7">
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-monad-400 w-7 shrink-0 pt-1">03</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="w-4 h-4 text-monad-400 shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(131,110,249,0.55), rgba(131,110,249,0.1), transparent)' }} />
                  </div>
                  <div className="flex items-start justify-between gap-8">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">Global Community Chat</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed max-w-md mb-3">Real-time community hub for builders. Connect, collaborate, and share with developers worldwide.</p>
                      <ArrowRight className="w-4 h-4 text-monad-400/50" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 04 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.12 }}
            className="border-t pl-12" style={{ borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="py-7">
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-monad-400 w-7 shrink-0 pt-1">04</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Wallet className="w-4 h-4 text-monad-400 shrink-0" strokeWidth={1.5} />
                    <div className="w-2/3 h-px" style={{ background: 'linear-gradient(to right, rgba(131,110,249,0.45), transparent)' }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">ETH On-chain Payments</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-lg mb-3">Trustless payments settled directly on Ethereum. No intermediaries, no delays — your keys, your assets, always.</p>
                  <ArrowRight className="w-4 h-4 text-monad-400/50" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 05 — current highlight */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.14 }}
            className="border-t border-b" style={{ borderColor: 'rgba(131,110,249,0.2)' }}
          >
            <div className="py-7" style={{ background: 'rgba(131,110,249,0.03)' }}>
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-monad-400 w-7 shrink-0 pt-1">05</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <ShoppingBag className="w-4 h-4 text-monad-400 shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #836EF9, rgba(131,110,249,0.2), transparent)' }} />
                    <span className="text-xs font-mono text-monad-400 shrink-0">Current</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-1">Agent Marketplace</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-xl mb-3">Publish AI agents with a price. Buyers&apos; agents negotiate autonomously. When they agree — confirm to open a DM and close the deal on-chain.</p>
                  <ArrowRight className="w-4 h-4 text-monad-400/70" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phase label: Gamma */}
          <AnimatedContainer delay={0.1}>
            <div className="flex items-center gap-3 mt-14 mb-8">
              <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">Version 2 — Gamma</span>
              <span className="text-xs font-mono text-zinc-600 px-2 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Upcoming</span>
            </div>
          </AnimatedContainer>

          {/* Step 06 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}
            className="border-t opacity-50" style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="py-7">
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-zinc-600 w-7 shrink-0 pt-1">06</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="w-4 h-4 text-zinc-600 shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(131,110,249,0.25), transparent)' }} />
                  </div>
                  <h3 className="text-zinc-400 font-bold text-lg mb-1">Public REST API</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed max-w-xl mb-3">Open Bolty infrastructure to third-party builders. Programmatic access to repositories, agents, and all platform data.</p>
                  <ArrowRight className="w-4 h-4 text-zinc-700" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 07 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 }}
            className="border-t pl-8 opacity-50" style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="py-7">
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-zinc-600 w-7 shrink-0 pt-1">07</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-4 h-4 text-zinc-600 shrink-0" strokeWidth={1.5} />
                    <div className="w-1/2 h-px" style={{ background: 'linear-gradient(to right, rgba(131,110,249,0.2), transparent)' }} />
                  </div>
                  <h3 className="text-zinc-400 font-bold text-lg mb-1">Developer SDK &amp; Webhooks</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed max-w-lg mb-3">First-class SDK for building on top of Bolty. Real-time webhooks, event subscriptions, and automation tooling.</p>
                  <ArrowRight className="w-4 h-4 text-zinc-700" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phase label: Alpha */}
          <AnimatedContainer delay={0.1}>
            <div className="flex items-center gap-3 mt-14 mb-8">
              <span className="text-xs font-mono text-zinc-700 uppercase tracking-widest">Version 3 — Alpha</span>
              <span className="text-xs font-mono text-zinc-700 px-2 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>Future</span>
            </div>
          </AnimatedContainer>

          {/* Step 08 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}
            className="border-t opacity-25" style={{ borderColor: 'rgba(255,255,255,0.04)' }}
          >
            <div className="py-7">
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-zinc-700 w-7 shrink-0 pt-1">08</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-4 h-4 text-zinc-700 shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(131,110,249,0.12), transparent)' }} />
                  </div>
                  <h3 className="text-zinc-600 font-bold text-lg mb-1">DAO Governance</h3>
                  <p className="text-zinc-700 text-sm leading-relaxed max-w-xl mb-3">Community-driven decisions on platform direction, fees, and upgrades. Token holders vote on proposals on-chain.</p>
                  <ArrowRight className="w-4 h-4 text-zinc-800" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 09 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 }}
            className="border-t border-b opacity-25" style={{ borderColor: 'rgba(255,255,255,0.04)' }}
          >
            <div className="py-7">
              <div className="flex items-start gap-5">
                <span className="font-mono text-xs font-bold text-zinc-700 w-7 shrink-0 pt-1">09</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Hash className="w-4 h-4 text-zinc-700 shrink-0" strokeWidth={1.5} />
                    <div className="w-2/3 h-px" style={{ background: 'linear-gradient(to right, rgba(131,110,249,0.1), transparent)' }} />
                  </div>
                  <h3 className="text-zinc-600 font-bold text-lg mb-1">Open Protocol &amp; Native Token</h3>
                  <p className="text-zinc-700 text-sm leading-relaxed max-w-lg mb-3">Bolty becomes a fully open, decentralized protocol. Cross-chain support, on-chain reputation, and the native $BOLTY token at the core.</p>
                  <ArrowRight className="w-4 h-4 text-zinc-800" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>
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
      <section className="py-24 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4">
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
        <div className="max-w-7xl mx-auto px-4">
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
                    style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>Maintenance</span>
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
                className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 divide-x-0 lg:divide-x lg:divide-y-0 divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden text-left mb-6">
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
                <div className="text-sm font-semibold text-zinc-200">Be part of the first wave of developers on Bolty</div>
                <div className="text-xs text-zinc-500 mt-1">Launching in Beta — free to start, no credit card required.</div>
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
        <Section>
          <div className="max-w-3xl mx-auto text-center">
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
