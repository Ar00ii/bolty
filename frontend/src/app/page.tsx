'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BoltyLogoSVG } from '@/components/ui/BoltyLogo';
import { RenderHero } from '@/components/ui/RenderHero';
import { ScrollVelocityContainer, ScrollVelocityRow } from '@/components/ui/ScrollVelocity';
import { motion } from 'framer-motion';
import {
  Bot, GitBranch, ArrowRight, Shield,
  Key, Star, TrendingUp,
  MessageSquare, UserPlus, Upload, Rocket, CheckCircle2,
} from 'lucide-react';

// Data
const FEATURES = [
  {
    icon: Bot,
    title: 'AI Agent Marketplace',
    description: 'Discover, publish, and sell AI agents. From GPT-powered tools to custom automation bots.',
    href: '/market/agents',
    featured: true,
  },
  {
    icon: GitBranch,
    title: 'Code Repositories',
    description: 'Sync GitHub repos. Offer free or paid access, earn reputation, build your profile.',
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
    title: 'Reputation System',
    description: 'Build your developer reputation. Earn points, climb leaderboards.',
    href: '/reputation/leaderboard',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your account', desc: 'Sign up with GitHub, email, or Web3 wallet. Your profile is your identity.', icon: UserPlus },
  { step: '02', title: 'Publish your work', desc: 'Connect GitHub or upload AI agents to the marketplace.', icon: Upload },
  { step: '03', title: 'Earn and grow', desc: 'Set prices in ETH, negotiate, build reputation, grow your brand.', icon: Rocket },
];

const INTEGRATIONS = [
  { name: 'GitHub', icon: GitBranch },
  { name: 'Ethereum', icon: Shield },
  { name: 'Claude AI', icon: Bot },
  { name: 'WebSockets', icon: MessageSquare },
  { name: 'PostgreSQL', icon: Key },
  { name: 'Any Language', icon: TrendingUp },
];

const TESTIMONIALS = [
  { name: 'Alex R.', role: 'Senior Full-Stack Dev', text: 'Published three repos in my first week and earned ETH without crypto complexity.' },
  { name: 'Yuki T.', role: 'AI/ML Engineer', text: 'The AI agent marketplace is exactly what I needed. Deployed my toolkit and it has buyers.' },
  { name: 'Sara M.', role: 'Indie Developer', text: 'The built-in AI assistant saves me hours every week.' },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      {/* Navbar - Render.com Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: '#000000', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <BoltyLogoSVG size={24} className="transition-transform group-hover:scale-110" />
            <span className="text-white font-semibold text-sm tracking-tight">Bolty</span>
          </Link>

          {/* Center Links - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/market" className="text-gray-300 text-sm font-normal hover:text-white transition-colors">Product</Link>
            <Link href="#pricing" className="text-gray-300 text-sm font-normal hover:text-white transition-colors">Pricing</Link>
            <Link href="#testimonials" className="text-gray-300 text-sm font-normal hover:text-white transition-colors">Customers</Link>
            <Link href="/docs/agent-protocol" className="text-gray-300 text-sm font-normal hover:text-white transition-colors">Docs</Link>
            <a href="#" className="text-gray-300 text-sm font-normal hover:text-white transition-colors">Changelog</a>
            <a href="#" className="text-gray-300 text-sm font-normal hover:text-white transition-colors">Community</a>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link href="/contact" className="hidden sm:block text-gray-300 text-sm font-normal hover:text-white transition-colors">Contact</Link>
            {!isAuthenticated ? (
              <Link href="/auth?tab=register" className="text-white text-sm font-normal px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors border border-gray-700">Dashboard</Link>
            ) : (
              <Link href="/market" className="text-white text-sm font-normal px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors border border-gray-700">Dashboard</Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO (RENDER STYLE) ── */}
      <RenderHero isAuthenticated={isAuthenticated} />

      {/* ── TECHNOLOGIES (SCROLL VELOCITY) ── */}
      <section className="py-32 px-4 border-t relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Technology Stack</p>
            <h2 className="text-4xl font-bold text-white">Built with modern tools</h2>
          </motion.div>

          <ScrollVelocityContainer className="text-2xl font-semibold tracking-[-0.02em] relative">
            {/* Row 1 - Left to right */}
            <ScrollVelocityRow baseVelocity={15} direction={1}>
              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#f0db4f' }}>
                    <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9.23.383.645.643 1.11.576.473-.06.879-.324 1.07-.65.148-.253.457-.465.576-.907.117-.462-.021-.69-.467-.933-.547-.338-1.668-.52-2.231-.278-.559.242-1.19.622-1.346 1.468-.156.847.051 1.718.707 2.338.653.614 1.86.886 2.042 2.265.046.383-.086.945-.664 1.185-.597.245-1.522.142-1.917-.932l-.715.714c.712 1.627 2.213 2.156 3.938 1.753 1.438-.35 2.486-1.236 2.582-2.181.052-.467-.037-.9-.337-1.335z" />
                  </svg>
                </div>
                <span className="text-white font-medium">JavaScript</span>
              </div>

              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#3178c6' }}>
                    <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.294a3.601 3.601 0 0 0-.616-.305 3.901 3.901 0 0 0-.278-.045A3.6 3.6 0 0 0 19.5 9.75h-2.633A3.63 3.63 0 0 0 13.04 6.724a3.63 3.63 0 0 0-3.69 3.876c0 1.036.335 2.001.954 2.844.685.968 1.888 1.594 3.877 1.594.868 0 1.533-.127 2.329-.779v2.294c-.779.601-2.171 1.271-3.654 1.271a5.141 5.141 0 0 1-4.663-2.513c-.822-1.316-1.233-2.845-1.233-4.779 0-2.15.674-4.167 2.013-5.74C6.954 4.402 8.74 3.424 10.777 3.424c2.035 0 3.763.922 4.882 2.023.333.229.603.632.796 1.297z" />
                  </svg>
                </div>
                <span className="text-white font-medium">TypeScript</span>
              </div>

              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#06B6D4' }}>
                    <path d="M12.001,4.8c-3.976,0-7.185,2.946-8.257,6.9c-.331,1.263-.408,2.608-.229,3.996c.468,3.632,2.973,6.788,6.479,7.824 c1.686.46,3.477.489,5.11.089c3.02-.731,5.634-2.904,6.923-5.839c.333-.823.589-1.746.745-2.724c.096-.603.148-1.22.148-1.847 C20.186,7.746,16.977,4.8,12.001,4.8z M12.001,6.968c-2.211,0-4.004,1.793-4.004,4.004c0,2.211,1.793,4.004,4.004,4.004 c2.211,0,4.004-1.793,4.004-4.004C16.005,8.761,14.212,6.968,12.001,6.968z" />
                  </svg>
                </div>
                <span className="text-white font-medium">React</span>
              </div>

              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#000000' }}>
                    <path d="M18.5 9.51a4.22 4.22 0 0 1 1.91-1.34A5.77 5.77 0 0 0 12 2a5.77 5.77 0 0 0-8.41 8.51 4.22 4.22 0 0 1 1.91 1.34A5.77 5.77 0 0 1 12 4.77a5.77 5.77 0 0 1 6.5 4.74z M2 12a5.77 5.77 0 0 0 8.41 5.49 4.22 4.22 0 0 1-1.91-1.34A5.77 5.77 0 0 1 12 19.23a5.77 5.77 0 0 1-6.5-4.74 4.22 4.22 0 0 1-1.91-1.34A5.77 5.77 0 0 0 2 12zm10 5.77a5.77 5.77 0 0 0 8.41-5.49 4.22 4.22 0 0 1-1.91 1.34A5.77 5.77 0 0 1 12 19.23zm8.41-8.51A5.77 5.77 0 0 0 12 2a5.77 5.77 0 0 0-8.41 8.51 4.22 4.22 0 0 1 1.91-1.34A5.77 5.77 0 0 1 12 4.77a5.77 5.77 0 0 1 6.5 4.74 4.22 4.22 0 0 1 1.91 1.34z" />
                  </svg>
                </div>
                <span className="text-white font-medium">Next.js</span>
              </div>

              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#336791' }}>
                    <path d="M15.898 4.045c-7.969 0-15.75 3.082-15.75 10.744 0 2.098.661 4.063 1.964 5.735.553 1.487 1.98 3.268 4.1 5.279 1.331 1.301 1.assertions 2.556 1.902 3.676.349 1.038.649 1.945.649 2.783 0 .968.471 1.47 1.315 1.47.794 0 1.927-.369 4.105-2.packages.427-.288.749-.484 1.058-.484.468 0 .703.299 1.058.484 2.178 2.053 3.311 2.package 4.105 2.package.844 0 1.315-.502 1.315-1.47 0-.838.3-1.745.649-2.783.533-1.12.571-2.375 1.902-3.676 2.12-2.011 3.547-3.792 4.1-5.279 1.303-1.672 1.964-3.637 1.964-5.735 0-7.662-7.781-10.744-15.75-10.744z" />
                  </svg>
                </div>
                <span className="text-white font-medium">PostgreSQL</span>
              </div>
            </ScrollVelocityRow>

            {/* Row 2 - Right to left */}
            <ScrollVelocityRow baseVelocity={12} direction={-1}>
              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#627EEA' }}>
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 1.8c5.597 0 10.2 4.603 10.2 10.2s-4.603 10.2-10.2 10.2S1.8 17.597 1.8 12 6.403 1.8 12 1.8zm0 3.6c-3.656 0-6.6 2.944-6.6 6.6s2.944 6.6 6.6 6.6 6.6-2.944 6.6-6.6-2.944-6.6-6.6-6.6z" />
                  </svg>
                </div>
                <span className="text-white font-medium">Ethereum</span>
              </div>

              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#181717' }}>
                    <path d="M12 0c6.627 0 12 5.373 12 12 0 5.302-3.438 9.8-8.207 11.387-.599.111-.793-.261-.793-.577v-2.234c3.338.726 4.033-1.416 4.033-1.416.546-1.387 1.333-1.756 1.333-1.756 1.089-.745.083-.729-.083-.729-1.205.084-1.839 1.237-1.839 1.237-1.07 1.834-2.807 1.304-3.495.997-.107-.775-.418-1.305-.762-1.604 2.665-.305 5.467-1.334 5.467-5.931 0-1.311-.469-2.381-1.236-3.221.124-.303.535-1.524-.117-3.176 0 0-1.008-.322-3.301 1.23-.957-.266-1.983-.399-3.003-.404-1.02.005-2.047.138-3.006.404-2.291-1.552-3.297-1.23-3.297-1.23-.653 1.653-.242 2.874-.118 3.176-.77.84-1.235 1.911-1.235 3.221 0 4.609 2.807 5.624 5.479 5.921-.342.297-.646.966-.756 1.81-.68.305-2.466.998-3.552-1.215 0 0-.646-1.17-1.87-1.25 0 0-1.19-.015-.083.742 0 0 .798.6 1.35 1.788 0 0 .711 2.328 4.171 1.881v2.947c0 .319-.192.694-.801.576C3.437 21.794 0 17.295 0 12c0-6.627 5.373-12 12-12z" />
                  </svg>
                </div>
                <span className="text-white font-medium">GitHub</span>
              </div>

              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#00D9FF' }}>
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm6.6 9.6c0 .6 0 1.2-.6 1.8 0 0-.6 2.4-3.6 4.2v1.8c0 .6-.6 1.2-1.2 1.2h-.6c-.6 0-1.2-.6-1.2-1.2v-1.2l-.6.6c-.6.6-1.8 1.2-2.4 1.2-2.4 0-4.2-2.4-4.2-4.8 0-2.4 1.8-4.8 4.2-4.8.6 0 1.8.6 2.4 1.2l.6.6v-1.2c0-.6.6-1.2 1.2-1.2h.6c.6 0 1.2.6 1.2 1.2v1.8c3 1.8 3.6 4.2 3.6 4.2.6.6.6 1.2.6 1.8z" />
                  </svg>
                </div>
                <span className="text-white font-medium">Claude AI</span>
              </div>

              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#236192' }}>
                    <path d="M5.8 0h12.4c3.2 0 5.8 2.6 5.8 5.8v12.4c0 3.2-2.6 5.8-5.8 5.8H5.8C2.6 24 0 21.4 0 18.2V5.8C0 2.6 2.6 0 5.8 0zm6.6 4.8c-3.1 0-5.6 2.5-5.6 5.6s2.5 5.6 5.6 5.6 5.6-2.5 5.6-5.6-2.5-5.6-5.6-5.6zm6.6-.4c-.7 0-1.3.6-1.3 1.3s.6 1.3 1.3 1.3 1.3-.6 1.3-1.3-.6-1.3-1.3-1.3z" />
                  </svg>
                </div>
                <span className="text-white font-medium">WebSockets</span>
              </div>

              <div className="flex items-center gap-4 px-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/10">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#3776ab' }}>
                    <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm-1.5 4.8h3c.828 0 1.5.672 1.5 1.5v9c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-9c0-.828.672-1.5 1.5-1.5zm-6 0h3c.828 0 1.5.672 1.5 1.5v5.4c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-5.4c0-.828.672-1.5 1.5-1.5zm12 0h3c.828 0 1.5.672 1.5 1.5v5.4c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-5.4c0-.828.672-1.5 1.5-1.5z" />
                  </svg>
                </div>
                <span className="text-white font-medium">Python</span>
              </div>
            </ScrollVelocityRow>
          </ScrollVelocityContainer>

          <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r" style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }}></div>
          <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l" style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }}></div>
        </div>
      </section>

      {/* ── FEATURES (BENTO GRID) ── */}
      <section className="py-20 px-4 border-t relative" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Platform Features</p>
            <h2 className="text-5xl font-bold text-white">Everything you need</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`group rounded-lg border p-6 transition-all duration-300 ${f.featured ? 'md:col-span-2 md:row-span-1' : ''}`}
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    background: 'rgba(0, 0, 0, 0)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                      <p className="text-sm text-gray-400">{f.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (SPLIT LAYOUT) ── */}
      <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Getting Started</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">Three steps to get started</h2>

            <div className="space-y-6">
              {HOW_IT_WORKS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center flex-shrink-0 text-purple-400 font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right: Visual (List of services) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            {['Web service', 'API Layer', 'Database', 'Queue Worker', 'Cache Layer', 'Auth Service'].map((service, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-lg border transition-all"
                style={{
                  borderColor: i === 1 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                  background: i === 1 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0, 0, 0, 0)',
                }}
              >
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${i === 1 ? 'text-green-400' : 'text-gray-500'}`} />
                <span className={i === 1 ? 'text-green-400 font-medium' : 'text-gray-300'}>{service}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── INTEGRATIONS (SPLIT) ── */}
      <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Stack</p>
            <h2 className="text-5xl font-bold text-white">Works with your stack</h2>
          </motion.div>

          <motion.div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {INTEGRATIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group"
                >
                  <div
                    className="aspect-square rounded-lg border p-4 flex items-center justify-center transition-all duration-300 group-hover:border-purple-500/40"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      background: 'rgba(168, 85, 247, 0.05)',
                    }}
                  >
                    <Icon className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-2 group-hover:text-gray-400">{item.name}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Developers</p>
            <h2 className="text-5xl font-bold text-white">What developers say</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border p-6"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  background: 'rgba(0, 0, 0, 0)',
                }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-purple-400 fill-purple-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{t.text}"</p>
                <div className="pt-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold text-white mb-4">Ready to start building?</h2>
            <p className="text-lg text-gray-400 mb-8">
              Join the platform where code meets commerce. Publish, sell, and earn — all in one place.
            </p>
            <div className="flex gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link href="/auth?tab=register" className="btn-primary text-sm px-8 py-3 rounded-lg flex items-center gap-2">
                    Create free account <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/docs/agent-protocol" className="btn-secondary text-sm px-8 py-3 rounded-lg">
                    Read the docs
                  </Link>
                </>
              ) : (
                <Link href="/market" className="btn-primary text-sm px-8 py-3 rounded-lg inline-flex items-center gap-2">
                  Go to dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
