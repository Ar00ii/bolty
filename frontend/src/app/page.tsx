'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BoltyLogoSVG } from '@/components/ui/BoltyLogo';
import { RenderHero } from '@/components/ui/RenderHero';
import { ScrollVelocityRow } from '@/components/ui/ScrollVelocity';
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

      {/* ── TECHNOLOGIES (SCROLL MARQUEE) ── */}
      <section className="py-10 border-t relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <ScrollVelocityRow duration={40}>
          {[
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg', alt: 'JavaScript' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', alt: 'TypeScript' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', alt: 'React' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg', alt: 'Next.js' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg', alt: 'Node.js' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', alt: 'Python' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg', alt: 'PostgreSQL' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-original.svg', alt: 'Redis' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg', alt: 'Docker' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg', alt: 'Git' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg', alt: 'TailwindCSS' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg', alt: 'GitHub' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/prisma/prisma-original.svg', alt: 'Prisma' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg', alt: 'Express' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/fastapi/fastapi-original.svg', alt: 'FastAPI' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg', alt: 'MongoDB' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-original.svg', alt: 'Kubernetes' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ethereum/ethereum-original.svg', alt: 'Ethereum' },
          ].map((icon) => (
            <img
              key={icon.alt}
              src={icon.src}
              alt={icon.alt}
              className="w-8 h-8 opacity-60 hover:opacity-100 transition-opacity brightness-0 invert flex-shrink-0"
              title={icon.alt}
            />
          ))}
        </ScrollVelocityRow>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10" style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10" style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }} />
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
