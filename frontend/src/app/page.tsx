'use client';

import { motion } from 'framer-motion';
import {
  Bot,
  GitBranch,
  ArrowRight,
  Shield,
  Key,
  Star,
  TrendingUp,
  MessageSquare,
  UserPlus,
  Upload,
  Rocket,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { ClickClickDone } from '@/components/ClickClickDone';
import { EliteBoost } from '@/components/EliteBoost';
import { FeaturesGrid } from '@/components/FeaturesGrid';
import { AvatarCircles } from '@/components/ui/AvatarCircles';
import { BoltyLogoSVG } from '@/components/ui/BoltyLogo';
import { GradientText } from '@/components/ui/GradientText';
import { RenderHero } from '@/components/ui/RenderHero';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
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

const FAQ = [
  {
    question: 'How do I publish my AI agent?',
    answer:
      'Simply connect your GitHub repository or upload your agent files directly. Our platform handles deployment, versioning, and scaling automatically.',
  },
  {
    question: 'How do I get paid?',
    answer:
      'Earnings are processed directly to your Ethereum wallet. We handle payment processing through smart contracts with zero middleman fees.',
  },
  {
    question: 'What programming languages are supported?',
    answer:
      'We support any language and framework. Just containerize it with Docker, and our platform handles the rest.',
  },
  {
    question: 'How does the reputation system work?',
    answer:
      'Your reputation grows with positive transactions, community contributions, and uptime. Higher reputation unlocks premium features and visibility.',
  },
  {
    question: 'Can I test my agent before publishing?',
    answer:
      'Yes! Use our sandbox environment to test API endpoints, chat interactions, and integrations before going live.',
  },
  {
    question: 'What are the fees?',
    answer:
      'We take a 5% commission on transactions. No setup fees, no hidden charges. Transparent pricing for everyone.',
  },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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
            Share your work with{' '}
            <span className="text-white/70 font-normal">millions</span>{' '}
            of developers worldwide.
          </p>
        </motion.div>
      </div>

      {/* ── CLICK CLICK DONE ── */}
      <ClickClickDone />

      {/* ── DEPLOY APPS WITH ZERO OPS ── */}
      <section
        className="flex flex-col gap-2 py-20 px-[7%] max-w-[1810px] mx-auto relative"
        style={{ background: '#0d0d0d' }}
      >
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white"
          style={{
            fontSize: '64px',
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: '-1.28px',
          }}
        >
          Deploy apps and agents
          <br />
          with zero ops.
        </motion.h2>

        <p
          className="text-white/60"
          style={{
            fontSize: '20px',
            lineHeight: '1.5',
            maxWidth: '520px',
            marginTop: '16px',
          }}
        >
          Ship to production in seconds. No servers, no config, no headaches.
        </p>

        {/* Feature cards grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ paddingTop: '60px' }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group flex flex-col gap-5 rounded-lg border p-6 cursor-pointer transition-all duration-500 hover:border-purple-600/50 hover:shadow-[0_0_40px_rgba(147,51,234,0.12)]"
                style={{
                  borderColor: '#272727',
                  background: '#1a1a1a',
                }}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] group-hover:scale-110"
                  style={{ background: '#9333ea' }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Title */}
                <h3
                  className="text-white font-normal transition-colors duration-300 group-hover:text-purple-200"
                  style={{
                    fontSize: '22px',
                    lineHeight: 1.2,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {f.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: '#a0a0a0',
                  }}
                >
                  {f.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <FeaturesGrid />

      {/* ── ELITE BOOST ── */}
      <EliteBoost />

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4" style={{ borderColor: 'var(--border)' }}>
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
                <p className="text-gray-300 mb-4">&quot;{t.text}&quot;</p>
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
      <section className="py-20 px-4" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto">
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
                  borderColor:
                    openFaqIndex === i ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  background: openFaqIndex === i ? 'rgba(168, 85, 247, 0.05)' : 'transparent',
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
                    opacity: openFaqIndex === i ? 1 : 0,
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
      <section className="py-20 px-4" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-light text-white mb-2">Stay updated</h2>
            <p className="text-gray-400 mb-8">
              Get the latest news about new agents, features, and opportunities.
            </p>
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
      <section className="py-20 px-4" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl font-light mb-4">
              Ready to <GradientText gradient="purple">start building</GradientText>?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join the platform where code meets commerce. Publish, sell, and earn — all in one
              place.
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
                  <Link
                    href="/docs/agent-protocol"
                    className="text-gray-300 text-sm px-8 py-3 rounded-lg border border-gray-600 hover:border-gray-400 hover:text-white transition-all"
                  >
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
