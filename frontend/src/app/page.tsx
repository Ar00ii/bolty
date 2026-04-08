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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const [docsOpen, setDocsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (docsRef.current && !docsRef.current.contains(e.target as Node)) {
        setDocsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isScrolled = scrollY > 20;
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="min-h-screen relative pt-16" style={{ background: 'var(--bg)' }}>
      {/* Navbar - Sticky with scroll effect */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
        style={{
          background: isScrolled ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)',
          borderColor: isScrolled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          boxShadow: isScrolled ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
          backdropFilter: isScrolled ? 'blur(12px)' : 'blur(8px)',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Mobile menu toggle */}
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Toggle menu"
            whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mobileMenuOpen ? 'close' : 'menu'}
                initial={!prefersReducedMotion ? { rotate: -90, opacity: 0 } : {}}
                animate={!prefersReducedMotion ? { rotate: 0, opacity: 1 } : {}}
                exit={!prefersReducedMotion ? { rotate: 90, opacity: 0 } : {}}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Logo - Desktop */}
          <div className="hidden md:flex items-center gap-3 mr-auto">
            <BoltyLogoSVG size={28} />
            <span className="text-white font-bold text-lg">Bolty</span>
          </div>

          {/* Left Links - Main Nav Menu - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-1">
            <div ref={docsRef} className="relative">
              <motion.button
                onClick={() => setDocsOpen(!docsOpen)}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all relative group text-gray-400 hover:text-white flex items-center gap-1"
                title="Navigation"
              >
                Navigation
                <motion.div animate={{ rotate: docsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-400 group-hover:w-full transition-all duration-300" />
              </motion.button>

              <AnimatePresence>
                {docsOpen && (
                  <motion.div
                    initial={!prefersReducedMotion ? { opacity: 0, y: -8 } : {}}
                    animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                    exit={!prefersReducedMotion ? { opacity: 0, y: -8 } : {}}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 w-80 rounded-lg border border-zinc-700/80 overflow-hidden shadow-xl z-50 bg-zinc-900"
                  >
                    {Object.entries(navSections).map(([section, items]) => (
                      <div key={section}>
                        <div className="px-4 py-2 text-xs uppercase tracking-widest text-zinc-500 font-semibold bg-black/40">
                          {section}
                        </div>
                        {items.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDocsOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                              <IconComponent className="w-4 h-4 flex-shrink-0" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Logo - Only visible on mobile */}
          <div className="md:hidden">
            <BoltyLogoSVG size={24} />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            {/* Quick Actions - Authenticated only */}
            {isAuthenticated && (
              <motion.button
                whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
                whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all"
                title="Create new agent"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}

            {/* Search */}
            <div className="relative hidden sm:flex">
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.div
                    key="search-open"
                    initial={!prefersReducedMotion ? { opacity: 0, width: 0 } : {}}
                    animate={!prefersReducedMotion ? { opacity: 1, width: 'auto' } : {}}
                    exit={!prefersReducedMotion ? { opacity: 0, width: 0 } : {}}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search agents, repos..."
                        className="w-48 pl-8 pr-3 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500/50 transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setSearchOpen(false);
                        }}
                      />
                    </div>
                    <motion.button
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="text-zinc-500 hover:text-zinc-300 p-1"
                      whileHover={!prefersReducedMotion ? { rotate: 90 } : {}}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-closed"
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 text-xs transition-all group"
                    whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
                    title="Search"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications - Authenticated only */}
            {isAuthenticated && (
              <motion.button
                whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
                whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <motion.span
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                  animate={!prefersReducedMotion ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </motion.button>
            )}

            {isAuthenticated ? (
              <>
                {/* Status Indicator */}
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-green-400 bg-green-500/10">
                  <motion.div
                    className="w-1.5 h-1.5 bg-green-400 rounded-full"
                    animate={!prefersReducedMotion ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  Online
                </div>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <motion.button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
                    whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
                    title="Open profile menu"
                  >
                    <motion.div
                      animate={!prefersReducedMotion ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: profileOpen ? Infinity : 0, duration: 2 }}
                    >
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user?.displayName || user?.username || 'user'}
                          className="w-7 h-7 rounded-full border border-zinc-700 hover:border-purple-500/50 transition-colors"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-semibold hover:bg-purple-500/30 transition-colors">
                          {(user?.displayName || user?.username || 'u')[0]?.toUpperCase()}
                        </div>
                      )}
                    </motion.div>
                    <span className="text-sm text-zinc-300 hidden sm:block max-w-[100px] truncate">
                      {user?.displayName || user?.username || 'User'}
                    </span>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={!prefersReducedMotion ? { opacity: 0, y: -8 } : {}}
                        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                        exit={!prefersReducedMotion ? { opacity: 0, y: -8 } : {}}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-zinc-700/80 overflow-hidden shadow-xl z-50 bg-zinc-900 max-h-96 overflow-y-auto"
                      >
                        <div className="p-3 border-b border-zinc-700/50">
                          <p className="text-sm font-medium text-white truncate">{user?.displayName || user?.username || 'User'}</p>
                          <p className="text-xs text-zinc-500 truncate">{user?.email || user?.githubLogin || ''}</p>
                        </div>

                        {/* Account Section */}
                        <div>
                          <div className="px-3 py-2 text-xs uppercase tracking-widest text-zinc-600 font-semibold bg-black/40">
                            ACCOUNT
                          </div>
                          <Link
                            href="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <UserIcon className="w-4 h-4" /> Profile
                          </Link>
                          <Link
                            href="/api-keys"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <Key className="w-4 h-4" /> API Keys
                          </Link>
                          <Link
                            href="/profile?tab=security"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <Settings className="w-4 h-4" /> Settings
                          </Link>
                        </div>

                        <div className="py-1 border-t border-zinc-700/50">
                          <button
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-all w-full text-left"
                          >
                            <LogOut className="w-4 h-4" /> Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="hidden sm:block text-gray-400 text-sm font-normal hover:text-white transition-colors"
                  title="Sign in to your account"
                >
                  Sign in
                </Link>
                <ShimmerButton
                  as={Link}
                  href="/auth?tab=register"
                  className="text-white text-xs md:text-sm font-normal px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded transition-all shadow-lg hover:shadow-xl"
                >
                  Get started
                </ShimmerButton>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={!prefersReducedMotion ? { opacity: 0, height: 0 } : {}}
              animate={!prefersReducedMotion ? { opacity: 1, height: 'auto' } : {}}
              exit={!prefersReducedMotion ? { opacity: 0, height: 0 } : {}}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-zinc-700/50 bg-black/95 backdrop-blur-sm overflow-hidden max-h-96 overflow-y-auto"
            >
              <div className="px-4 py-4">
                {Object.entries(navSections).map(([section, items], sectionIdx) => (
                  <div key={section} className={sectionIdx > 0 ? 'mt-4' : ''}>
                    <motion.div
                      initial={!prefersReducedMotion ? { opacity: 0, x: -16 } : {}}
                      animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: sectionIdx * 0.05 }}
                      className="px-3 py-2 text-xs uppercase tracking-widest text-zinc-500 font-semibold"
                    >
                      {section}
                    </motion.div>
                    {items.map((item, itemIdx) => {
                      const IconComponent = item.icon;
                      return (
                        <motion.div
                          key={item.href}
                          initial={!prefersReducedMotion ? { opacity: 0, x: -16 } : {}}
                          animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                          transition={{ delay: (sectionIdx * 0.05) + (itemIdx * 0.02) }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                          >
                            <IconComponent className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}

                {!isAuthenticated && (
                  <motion.div
                    initial={!prefersReducedMotion ? { opacity: 0, x: -16 } : {}}
                    animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 }}
                    className="mt-4 pt-4 border-t border-zinc-700/50"
                  >
                    <Link
                      href="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                    >
                      Sign in
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <h2 className="text-5xl font-bold">Everything you <GradientText gradient="purple">need</GradientText></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Spotlight key={f.href} spotlightColor="rgba(168, 85, 247, 0.25)">
                  <AnimatedCard
                    index={i}
                    className={`rounded-lg border p-6 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 group ${f.featured ? 'md:col-span-2 md:row-span-1' : ''}`}
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0)',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-purple-500/20 group-hover:scale-110" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                        <Icon className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">{f.title}</h3>
                        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{f.description}</p>
                      </div>
                    </div>
                  </AnimatedCard>
                </Spotlight>
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
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">Three steps to <GradientText gradient="purple">get started</GradientText></h2>

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
            <h2 className="text-5xl font-bold text-white">Frequently asked</h2>
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
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
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
            <h2 className="text-3xl font-bold text-white mb-2">Stay updated</h2>
            <p className="text-gray-400 mb-8">Get the latest news about new agents, features, and opportunities.</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                aria-label="Email address for newsletter"
              />
              <button className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors">
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
            <h2 className="text-5xl font-bold mb-4">Ready to <GradientText gradient="purple">start building</GradientText>?</h2>
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
                <span className="text-white font-semibold">Bolty</span>
              </div>
              <p className="text-sm text-gray-500">The fastest path to production for AI agents and apps.</p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/market" className="text-gray-400 hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/market/agents" className="text-gray-400 hover:text-white transition-colors">Agents</Link></li>
                <li><Link href="/market/repos" className="text-gray-400 hover:text-white transition-colors">Repositories</Link></li>
                <li><Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs/agent-protocol" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
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
