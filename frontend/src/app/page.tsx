'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BoltyLogoSVG } from '@/components/ui/BoltyLogo';
import { RenderHero } from '@/components/ui/RenderHero';
import { ScrollVelocityRow } from '@/components/ui/ScrollVelocity';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { GradientText } from '@/components/ui/GradientText';
import { Spotlight } from '@/components/ui/Spotlight';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { HexagonPattern } from '@/components/ui/HexagonPattern';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, GitBranch, ArrowRight, Shield,
  Key, Star, TrendingUp,
  MessageSquare, UserPlus, Upload, Rocket, CheckCircle2,
  Search, Menu, X, ChevronDown, LogOut, Settings, User as UserIcon,
  Bell, Code2, Zap, Plus, Circle, Globe, Mail,
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

const TESTIMONIALS = [
  { name: 'Alex R.', role: 'Senior Full-Stack Dev', text: 'Published three repos in my first week and earned ETH without crypto complexity.' },
  { name: 'Yuki T.', role: 'AI/ML Engineer', text: 'The AI agent marketplace is exactly what I needed. Deployed my toolkit and it has buyers.' },
  { name: 'Sara M.', role: 'Indie Developer', text: 'The built-in AI assistant saves me hours every week.' },
];

const FAQ = [
  {
    question: 'How do I publish my AI agent?',
    answer: 'Simply connect your GitHub repository or upload your agent files directly. Our platform handles deployment, versioning, and scaling automatically.'
  },
  {
    question: 'How do I get paid?',
    answer: 'Earnings are processed directly to your Ethereum wallet. We handle payment processing through smart contracts with zero middleman fees.'
  },
  {
    question: 'What programming languages are supported?',
    answer: 'We support any language and framework. Just containerize it with Docker, and our platform handles the rest.'
  },
  {
    question: 'How does the reputation system work?',
    answer: 'Your reputation grows with positive transactions, community contributions, and uptime. Higher reputation unlocks premium features and visibility.'
  },
  {
    question: 'Can I test my agent before publishing?',
    answer: 'Yes! Use our sandbox environment to test API endpoints, chat interactions, and integrations before going live.'
  },
  {
    question: 'What are the fees?',
    answer: 'We take a 5% commission on transactions. No setup fees, no hidden charges. Transparent pricing for everyone.'
  },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simple nav for unauthenticated users (landing page)
  const simpleNavLinks = [
    { href: '/market', label: 'Marketplace' },
    { href: '/market/agents', label: 'Agents' },
    { href: '/market/repos', label: 'Repos' },
    { href: '/services', label: 'Services' },
    { href: '/docs/agent-protocol', label: 'Docs' },
  ];

  // Organized sections for authenticated users
  const navSections = {
    OVERVIEW: [
      { href: '/market', label: 'Marketplace', icon: Bot },
      { href: '/market/agents', label: 'AI Agents', icon: Zap },
      { href: '/market/repos', label: 'Repositories', icon: GitBranch },
    ],
    COMMUNITY: [
      { href: '/chat', label: 'Global Chat', icon: MessageSquare },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
      { href: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
    ],
    ACCOUNT: [
      { href: '/orders', label: 'Orders', icon: CheckCircle2 },
      { href: '/api-keys', label: 'API Keys', icon: Key },
      { href: '/profile', label: 'Profile', icon: UserIcon },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
    RESOURCES: [
      { href: '/docs/agent-protocol', label: 'Documentation', icon: Code2 },
      { href: '#how-it-works', label: 'How It Works', icon: Rocket },
    ],
  };

  return (
    <div className="min-h-screen relative pt-16" style={{ background: 'var(--bg)' }}>
      {/* Navbar - Clean and Simple */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 border-b border-zinc-800 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <BoltyLogoSVG size={24} />
            <span className="text-white font-light text-sm md:text-base hidden sm:inline">BoltyNetwork</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {simpleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Auth Buttons */}
          <div className="flex items-center gap-4 md:gap-6">
            <button className="md:hidden text-zinc-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>

            {!isAuthenticated ? (
              <>
                <Link href="/auth" className="hidden sm:block text-sm text-gray-300 hover:text-white transition-colors">
                  Sign in
                </Link>
                <ShimmerButton
                  as={Link}
                  href="/auth?tab=register"
                  className="text-white text-xs md:text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-all"
                >
                  Get started
                </ShimmerButton>
              </>
            ) : (
              <>
                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-2 py-1"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="profile"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-light">
                        {(user?.displayName || user?.username || 'u')[0]?.toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50">
                      <div className="p-3 border-b border-zinc-700">
                        <p className="text-sm font-light text-white">{user?.displayName || user?.username}</p>
                        <p className="text-xs text-zinc-400">{user?.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50">
                        Profile
                      </Link>
                      <Link href="/api-keys" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50">
                        API Keys
                      </Link>
                      <Link href="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50">
                        Settings
                      </Link>
                      <button className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 border-t border-zinc-700">
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO (RENDER STYLE) ── */}
      <RenderHero isAuthenticated={isAuthenticated} />

      {/* ── TECHNOLOGIES (SCROLL MARQUEE) ── */}
      <section className="py-12 border-t relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <ScrollVelocityRow duration={50}>
          {[
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', alt: 'React' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', alt: 'TypeScript' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', alt: 'Python' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg', alt: 'Node.js' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg', alt: 'Docker' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg', alt: 'PostgreSQL' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg', alt: 'Git' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg', alt: 'Tailwind' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg', alt: 'MongoDB' },
            { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-original.svg', alt: 'Redis' },
          ].map((icon) => (
            <div key={icon.alt} className="w-28 flex items-center justify-start pl-2 flex-shrink-0">
              <img
                src={icon.src}
                alt={icon.alt}
                loading="lazy"
                className="w-14 h-14 opacity-50 hover:opacity-100 transition-opacity"
                style={{ objectFit: 'contain', objectPosition: 'left' }}
                title={icon.alt}
              />
            </div>
          ))}
          <div className="flex-shrink-0" style={{ width: '64px' }} />
        </ScrollVelocityRow>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10" style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10" style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }} />
      </section>

      {/* ── FEATURES (PERFECT RENDER STYLE) ── */}
      <section className="py-24 px-4 border-t relative overflow-hidden" style={{
        borderColor: 'var(--border)',
        background: '#000000'
      }}>
        {/* Hexagon Pattern Background */}
        <div className="absolute inset-0 pointer-events-none">
          <HexagonPattern className="w-full h-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Main Container with Corner Brackets */}
          <div className="relative overflow-visible">
            {/* Corner Brackets */}
            <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 pointer-events-none" style={{ zIndex: 20 }} />
            <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 pointer-events-none" style={{ zIndex: 20 }} />
            <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 pointer-events-none" style={{ zIndex: 20 }} />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 pointer-events-none" style={{ zIndex: 20 }} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-light text-white leading-tight">
                Deploy apps and agents<br />with <GradientText gradient="purple" animated={false}>zero ops</GradientText>
              </h2>
            </motion.div>

            {/* Grid Layout with Dividers */}
            <div
              className="relative overflow-visible rounded-lg"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Noise texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="400" height="400" filter="url(%23noiseFilter)" opacity="0.15"/%3E%3C/svg%3E")',
                  backgroundSize: '200px 200px',
                }}
              />

              {/* Grid Container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 auto-rows-max gap-0 relative z-10">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                const accentColors = ['cyan', 'emerald', 'pink', 'yellow', 'blue', 'purple'];
                const accentColor = accentColors[i % accentColors.length];
                const accentTextColors = ['text-cyan-400', 'text-emerald-400', 'text-pink-400', 'text-yellow-400', 'text-blue-400', 'text-purple-400'];
                const accentTextColor = accentTextColors[i % accentTextColors.length];

                const accentBgMap: { [key: string]: string } = {
                  cyan: 'rgba(34, 211, 238, 0.1)',
                  emerald: 'rgba(16, 185, 129, 0.1)',
                  pink: 'rgba(236, 72, 153, 0.1)',
                  yellow: 'rgba(234, 179, 8, 0.1)',
                  blue: 'rgba(59, 130, 246, 0.1)',
                  purple: 'rgba(168, 85, 247, 0.1)',
                };

                const accentBorderMap: { [key: string]: string } = {
                  cyan: 'rgba(255, 255, 255, 0.2)',
                  emerald: 'rgba(255, 255, 255, 0.2)',
                  pink: 'rgba(255, 255, 255, 0.2)',
                  yellow: 'rgba(255, 255, 255, 0.2)',
                  blue: 'rgba(255, 255, 255, 0.2)',
                  purple: 'rgba(255, 255, 255, 0.2)',
                };

                // Reputation System (index 5) spans 2 rows AND 2 columns (full width)
                const isReputationCard = i === 5;
                const gridClass = isReputationCard ? 'lg:col-span-2 lg:row-span-2' : f.featured ? 'lg:col-span-2' : '';

                return (
                  <motion.div
                    key={f.href}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`group relative ${gridClass}`}
                    style={{
                      borderRight: !f.featured && !isReputationCard && i > 0 && (i - 1) % 2 === 0 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                      borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                    }}
                  >
                    {/* Card Background with Gradient */}
                    <div
                      className="relative h-full backdrop-blur-sm overflow-hidden p-8 md:p-12"
                      style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        boxShadow: `inset 0 1px 1px ${accentBorderMap[accentColor]}, inset 0 -1px 1px rgba(0, 0, 0, 0.3)`,
                        minHeight: isReputationCard ? 'auto' : 'auto',
                      }}
                    >
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        {/* Header with Icon */}
                        <div>
                          <div className="flex items-start gap-4 mb-6">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${accentTextColor}`}
                              style={{
                                background: accentBgMap[accentColor],
                                boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(255, 255, 255, 0.1)`,
                              }}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                          </div>
                          <h3 className="text-xl font-light text-white mb-4 leading-snug">{f.title}</h3>
                          <p className="text-gray-300 text-sm leading-relaxed font-light">{f.description}</p>
                        </div>

                        {/* Visual Content - Different for each card */}
                        {i === 0 && (
                          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">Active Agents</span>
                              <span className="text-cyan-400 font-semibold">2,847</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">Total Revenue</span>
                              <span className="text-cyan-400 font-semibold">$243K ETH</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400">Success Rate</span>
                              <span className="text-cyan-400 font-semibold">98.7%</span>
                            </div>
                          </div>
                        )}

                        {i === 2 && (
                          <div className="mt-6 pt-6 border-t border-white/10">
                            <div className="space-y-2">
                              {['Production', 'Development', 'Testing'].map((env, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{
                                    background: ['#06b6d4', '#10b981', '#f97316'][idx]
                                  }} />
                                  <span className="text-xs text-gray-400">{env}</span>
                                  <div className="flex-1 h-1 bg-white/5 rounded-full ml-2">
                                    <div className="h-full rounded-full" style={{
                                      width: ['65%', '42%', '28%'][idx],
                                      background: ['#06b6d4', '#10b981', '#f97316'][idx],
                                      opacity: 0.6
                                    }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {i === 4 && (
                          <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                            <div className="flex gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400">A</div>
                              <div className="flex-1 bg-white/5 rounded-lg p-2 text-xs text-gray-300">
                                Connected to WebSocket
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <div className="flex-1 max-w-xs bg-blue-500/20 rounded-lg p-2 text-xs text-blue-300 text-right">
                                Real-time sync enabled
                              </div>
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400">U</div>
                            </div>
                          </div>
                        )}

                        {i === 5 && (
                          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-400">Your Rank</span>
                                <span className="text-purple-400 font-semibold">#342</span>
                              </div>
                              <div className="flex gap-1 mt-3">
                                {[...Array(7)].map((_, idx) => (
                                  <div key={idx} className="flex-1 h-8 bg-white/5 rounded-sm overflow-hidden">
                                    <div className="h-full bg-purple-500/40" style={{
                                      height: `${[45, 60, 70, 85, 75, 65, 55][idx]}%`
                                    }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
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
            <h2 className="text-4xl lg:text-5xl font-light mb-8">Three steps to <GradientText gradient="purple">get started</GradientText></h2>

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
                    <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center flex-shrink-0 text-purple-400 font-light">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-light text-white">{item.title}</h3>
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
                <span className={i === 1 ? 'text-green-400 font-light' : 'text-gray-300'}>{service}</span>
              </div>
            ))}
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
            <h2 className="text-5xl font-light text-white">What developers say</h2>
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
                  <p className="font-light text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Questions</p>
            <h2 className="text-5xl font-light text-white">Frequently asked</h2>
          </motion.div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border rounded-lg transition-all"
                style={{
                  borderColor: openFaqIndex === i ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  background: openFaqIndex === i ? 'rgba(168, 85, 247, 0.05)' : 'transparent'
                }}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                  aria-expanded={openFaqIndex === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <h3 className="text-lg font-light text-white">{item.question}</h3>
                  <motion.div
                    animate={{ rotate: openFaqIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRight className="w-5 h-5 text-purple-400" />
                  </motion.div>
                </button>
                <motion.div
                  id={`faq-answer-${i}`}
                  initial={false}
                  animate={{
                    height: openFaqIndex === i ? 'auto' : 0,
                    opacity: openFaqIndex === i ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-4 text-gray-400">{item.answer}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER SIGNUP ── */}
      <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-light text-white mb-2">Stay updated</h2>
            <p className="text-gray-400 mb-8">Get the latest news about new agents, features, and opportunities.</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                aria-label="Email address for newsletter"
              />
              <button className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-light transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
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
            <h2 className="text-5xl font-light mb-4">Ready to <GradientText gradient="purple">start building</GradientText>?</h2>
            <p className="text-lg text-gray-400 mb-8">
              Join the platform where code meets commerce. Publish, sell, and earn — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <ShimmerButton
                    as={Link}
                    href="/auth?tab=register"
                    className="text-white text-sm px-8 py-3 rounded-lg flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    Create free account <ArrowRight className="w-4 h-4" />
                  </ShimmerButton>
                  <Link href="/docs/agent-protocol" className="text-gray-300 text-sm px-8 py-3 rounded-lg border border-gray-600 hover:border-gray-400 hover:text-white transition-all">
                    Read the docs
                  </Link>
                </>
              ) : (
                <ShimmerButton
                  as={Link}
                  href="/market"
                  className="text-white text-sm px-8 py-3 rounded-lg inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-all shadow-lg hover:shadow-xl"
                >
                  Go to dashboard <ArrowRight className="w-4 h-4" />
                </ShimmerButton>
              )}
            </div>
          </motion.div>
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
              <p className="text-sm text-gray-500">The fastest path to production for AI agents and apps.</p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-light mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/market" className="text-gray-400 hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/market/agents" className="text-gray-400 hover:text-white transition-colors">Agents</Link></li>
                <li><Link href="/market/repos" className="text-gray-400 hover:text-white transition-colors">Repositories</Link></li>
                <li><Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-light mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs/agent-protocol" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-light mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t pt-8" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-500">© 2026 Bolty. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm" aria-label="GitHub">GitHub</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm" aria-label="Twitter">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm" aria-label="Discord">Discord</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
