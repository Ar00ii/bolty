'use client';

import { motion } from 'framer-motion';
import {
  Bot,
  GitBranch,
  Shield,
  Key,
  Star,
  TrendingUp,
  MessageSquare,
  UserPlus,
  Upload,
  Rocket,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { ClickClickDone } from '@/components/ClickClickDone';
import { EliteBoost } from '@/components/EliteBoost';
import { FeaturesGrid } from '@/components/FeaturesGrid';
import { AvatarCircles } from '@/components/ui/AvatarCircles';
import { BoltyLogoSVG } from '@/components/ui/BoltyLogo';
import { RenderHero } from '@/components/ui/RenderHero';
import { useAuth } from '@/lib/auth/AuthProvider';

// Data
const FEATURES = [
  {
    icon: Bot,
    title: 'AI Agent Marketplace',
    description:
      'Discover, publish, and sell AI agents. From GPT-powered tools to custom automation bots.',
    href: '/market/agents',
    featured: true,
  },
  {
    icon: GitBranch,
    title: 'Code Repositories',
    description:
      'Sync GitHub repos. Offer free or paid access, earn reputation, build your profile.',
    href: '/market/repos',
  },
  {
    icon: Key,
    title: 'API Key Management',
    description: 'Generate API keys for your agents to interact programmatically.',
    href: '/api-keys',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'On-chain ETH payments with smart contract escrow. No middleman.',
    href: '/how-it-works',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Global chat, DMs, and negotiation system built on WebSockets.',
    href: '/chat',
  },
  {
    icon: TrendingUp,
    title: 'Boost System',
    description:
      'Power up your agent and dominate the trending rankings with strategic visibility.',
    href: '/#boost-marketplace',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your account',
    desc: 'Sign up with GitHub, email, or Web3 wallet. Your profile is your identity.',
    icon: UserPlus,
  },
  {
    step: '02',
    title: 'Publish your work',
    desc: 'Connect GitHub or upload AI agents to the marketplace.',
    icon: Upload,
  },
  {
    step: '03',
    title: 'Earn and grow',
    desc: 'Set prices in ETH, negotiate, build reputation, grow your brand.',
    icon: Rocket,
  },
];

const TESTIMONIALS = [
  {
    name: 'Alex R.',
    role: 'Senior Full-Stack Dev',
    text: 'Published three repos in my first week and earned ETH without crypto complexity.',
  },
  {
    name: 'Yuki T.',
    role: 'AI/ML Engineer',
    text: 'The AI agent marketplace is exactly what I needed. Deployed my toolkit and it has buyers.',
  },
  {
    name: 'Sara M.',
    role: 'Indie Developer',
    text: 'The built-in AI assistant saves me hours every week.',
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      {/* ── HERO (RENDER STYLE) ── */}
      <RenderHero isAuthenticated={isAuthenticated} />

      {/* ── COMMUNITY SOCIAL PROOF ── */}
      <div className="py-8 px-[7%] max-w-[1810px] mx-auto border-b border-white/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-4"
        >
          <AvatarCircles
            numPeople={12400}
            avatarUrls={[
              { imageUrl: 'https://avatars.githubusercontent.com/u/16860528', profileUrl: '#' },
              { imageUrl: 'https://avatars.githubusercontent.com/u/20110627', profileUrl: '#' },
              { imageUrl: 'https://avatars.githubusercontent.com/u/106103625', profileUrl: '#' },
              { imageUrl: 'https://avatars.githubusercontent.com/u/59228569', profileUrl: '#' },
              { imageUrl: 'https://avatars.githubusercontent.com/u/89768406', profileUrl: '#' },
              { imageUrl: 'https://avatars.githubusercontent.com/u/3084745', profileUrl: '#' },
            ]}
          />
          <p className="text-white/40" style={{ fontSize: '14px', fontWeight: 300 }}>
            Share your work with <span className="text-white/70 font-normal">millions</span> of
            developers worldwide.
          </p>
        </motion.div>
      </div>

      {/* ── CLICK CLICK DONE ── */}
      <ClickClickDone />

      {/* ── DEPLOY APPS WITH ZERO OPS ── */}
      <section className="relative py-24 px-[7%] max-w-[1810px] mx-auto overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
            style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-2xl"
          >
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#b4a7ff] mb-3">
              Zero ops
            </p>
            <h2 className="text-5xl lg:text-6xl font-light text-white tracking-[-0.02em] leading-[1.05]">
              Deploy apps and agents
              <br />
              with zero ops.
            </h2>
            <p className="mt-5 text-[15px] text-zinc-400 font-light tracking-[0.005em] leading-relaxed max-w-lg">
              Ship to production in seconds. No servers, no config, no headaches.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.a
                  key={f.href}
                  href={f.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="group relative flex flex-col gap-4 rounded-2xl p-6 cursor-pointer transition-all hover:brightness-110 overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
                    }}
                  />

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
                    }}
                  >
                    <Icon className="w-4 h-4 text-[#b4a7ff]" strokeWidth={1.75} />
                  </div>

                  <h3 className="text-[18px] font-light text-white tracking-[-0.005em] leading-tight">
                    {f.title}
                  </h3>

                  <p className="text-[13px] text-zinc-400 font-light tracking-[0.005em] leading-relaxed">
                    {f.description}
                  </p>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <FeaturesGrid />

      {/* ── ELITE BOOST ── */}
      <EliteBoost />

      {/* ── TESTIMONIALS ── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/4 w-[420px] h-[420px] rounded-full blur-3xl opacity-15 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#b4a7ff] mb-3">
              Developers
            </p>
            <h2 className="text-5xl lg:text-6xl font-light text-white tracking-[-0.02em]">
              What developers say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="relative rounded-2xl p-6 overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
                  boxShadow:
                    '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.35) 50%, transparent 100%)',
                  }}
                />

                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-3.5 h-3.5 text-[#b4a7ff]"
                      fill="#b4a7ff"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>

                <p className="text-[13.5px] text-zinc-300 font-light tracking-[0.005em] leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div
                  className="pt-4 flex items-center gap-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium text-white flex-shrink-0"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(131,110,249,0.35) 0%, rgba(131,110,249,0.12) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.4), 0 0 12px -4px rgba(131,110,249,0.4)',
                    }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-light text-white tracking-[0.005em]">{t.name}</p>
                    <p className="text-[11px] text-zinc-500 tracking-[0.005em]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t px-4 py-12" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BoltyLogoSVG size={24} />
                <span className="text-white font-light">Bolty</span>
              </div>
              <p className="text-sm text-gray-500">
                The fastest path to production for AI agents and apps.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-light mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/market" className="text-gray-400 hover:text-white transition-colors">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link
                    href="/market/agents"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Agents
                  </Link>
                </li>
                <li>
                  <Link
                    href="/market/repos"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Repositories
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-light mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/docs/agent-protocol"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-light mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500">© 2026 Bolty. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  aria-label="GitHub"
                >
                  GitHub
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  aria-label="Twitter"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                  aria-label="Discord"
                >
                  Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
