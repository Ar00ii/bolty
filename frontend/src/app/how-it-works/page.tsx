'use client';

import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Coins,
  FileCode,
  GitBranch,
  Globe,
  Lock,
  MessageSquare,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

// ── Types ──────────────────────────────────────────────────────────────────

interface PulseStats {
  activeListings: number;
  totalListings: number;
  totalSales: number;
  sales24h: number;
  volumeEth24h: number;
  traders24h: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number | undefined): string {
  if (!n || !Number.isFinite(n)) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
}

function formatEth(n: number | undefined): string {
  if (!n || !Number.isFinite(n)) return '0';
  if (n < 0.01) return n.toFixed(4);
  if (n < 100) return n.toFixed(3);
  return n.toFixed(2);
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  const [stats, setStats] = useState<PulseStats | null>(null);

  useEffect(() => {
    api
      .get<{ stats: PulseStats }>('/market/pulse?limit=1')
      .then((p) => setStats(p?.stats ?? null))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <Hero stats={stats} />
      <Flow />
      <Features />
      <Changelog />
      <CtaFooter />
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────

function Hero({ stats }: { stats: PulseStats | null }) {
  return (
    <header className="relative overflow-hidden px-6 md:px-10 pt-12 pb-10">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(131,110,249,0.14), transparent 70%)',
        }}
      />
      <div className="mx-auto max-w-[1400px] relative">
        <div className="flex items-center gap-2 text-[10.5px] font-medium text-zinc-500 uppercase tracking-[0.18em] mb-4">
          <Radio className="w-3.5 h-3.5" strokeWidth={1.75} />
          Product overview
        </div>

        <h1 className="text-3xl md:text-5xl font-light tracking-tight text-white leading-[1.08]">
          The marketplace for
          <br />
          <span style={{ color: '#b4a7ff' }}>AI agents, bots & code.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm md:text-[15px] font-light text-zinc-400 leading-relaxed">
          Publish a repo, deploy an agent, or list a script — Bolty handles escrow, reputation,
          delivery and payments on chain so you can focus on building.
        </p>

        <div className="mt-7 flex items-center gap-2 flex-wrap">
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-normal text-white transition"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.9) 0%, rgba(131,110,249,0.7) 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 14px -6px rgba(131,110,249,0.5)',
            }}
          >
            Browse marketplace
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
          <Link
            href="/market/seller/publish"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-normal text-zinc-200 transition"
            style={{
              background: 'rgba(255,255,255,0.03)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            Start selling
          </Link>
          <Link
            href="/docs/agent-protocol"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-light text-zinc-400 hover:text-zinc-200 transition"
          >
            Developer docs
            <ArrowUpRight className="w-3 h-3" strokeWidth={1.75} />
          </Link>
        </div>

        {/* Live stats */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-2">
          <HeroStat
            label="Active listings"
            value={formatNumber(stats?.activeListings)}
            accent="#06B6D4"
          />
          <HeroStat
            label="All-time sales"
            value={formatNumber(stats?.totalSales)}
            accent="#836EF9"
          />
          <HeroStat
            label="24h volume"
            value={`${formatEth(stats?.volumeEth24h)} ETH`}
            accent="#22c55e"
          />
          <HeroStat label="24h traders" value={formatNumber(stats?.traders24h)} accent="#EC4899" />
        </div>
      </div>
    </header>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="relative rounded-xl px-4 py-3 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.7,
        }}
      />
      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-medium mb-1">
        {label}
      </div>
      <div className="font-mono text-xl md:text-2xl font-light text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}

// ── Flow (replaces the "5 pasos") ─────────────────────────────────────────

function Flow() {
  const nodes: { icon: LucideIcon; label: string; sub: string; accent: string }[] = [
    { icon: FileCode, label: 'List', sub: 'Repo · Bot · Agent · Script', accent: '#06B6D4' },
    { icon: MessageSquare, label: 'Buy', sub: 'One-click direct purchase', accent: '#836EF9' },
    { icon: Lock, label: 'Escrow', sub: 'Funds locked on chain', accent: '#f59e0b' },
    { icon: CheckCircle2, label: 'Deliver', sub: 'Buyer confirms', accent: '#22c55e' },
    { icon: Coins, label: 'Release', sub: 'Seller paid automatically', accent: '#EC4899' },
  ];

  return (
    <section className="px-6 md:px-10 mt-4 mb-10">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          kicker="How a trade flows"
          title="From listing to payout, every step is on chain."
          subtitle="No invoices, no escrow services, no chargebacks. The BoltyEscrow contract enforces the entire flow."
        />

        <div
          className="mt-8 rounded-xl p-5 md:p-7 overflow-hidden relative"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-1 relative">
            {nodes.map((n, i) => (
              <FlowNode key={n.label} node={n} index={i} last={i === nodes.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowNode({
  node,
  index,
  last,
}: {
  node: { icon: LucideIcon; label: string; sub: string; accent: string };
  index: number;
  last: boolean;
}) {
  const Icon = node.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="relative flex flex-col items-center text-center"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center relative z-10"
        style={{
          background: `${node.accent}12`,
          boxShadow: `inset 0 0 0 1px ${node.accent}45, 0 0 24px -6px ${node.accent}60`,
        }}
      >
        <Icon className="w-5 h-5" strokeWidth={1.6} style={{ color: node.accent }} />
      </div>
      <div className="mt-3 text-[12.5px] font-normal text-white">{node.label}</div>
      <div className="text-[10.5px] text-zinc-500 font-light mt-0.5">{node.sub}</div>

      {!last && (
        <span
          aria-hidden
          className="hidden md:block absolute top-[22px] left-[calc(50%+32px)] right-[-50%] h-px"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 100%)',
          }}
        />
      )}
    </motion.div>
  );
}

// ── Features grid ─────────────────────────────────────────────────────────

function Features() {
  const features: {
    icon: LucideIcon;
    title: string;
    body: string;
    accent: string;
    href?: string;
  }[] = [
    {
      icon: Bot,
      title: 'Autonomous agents',
      body: 'Register an HTTPS endpoint, and buyers can invoke your agent live from the listing. Bolty handles sandboxing and rate limiting.',
      accent: '#836EF9',
      href: '/docs/agent-protocol',
    },
    {
      icon: Lock,
      title: 'On-chain escrow',
      body: 'Every payment goes through the BoltyEscrow contract. Buyers release on delivery, sellers get paid, disputes resolved by admin.',
      accent: '#f59e0b',
      href: '/market',
    },
    {
      icon: TrendingUp,
      title: 'Live market screener',
      body: 'Watch sales happen in real time, track 24h volume, 24h traders, and trending agents — same idea as DexScreener, for builders.',
      accent: '#22c55e',
      href: '/market',
    },
    {
      icon: ShieldCheck,
      title: 'Reputation that travels',
      body: 'Earn rays on every sale, climb 8 tiers from Iron to Champion. Your rank follows you into every new listing you publish.',
      accent: '#EC4899',
      href: '/reputation/leaderboard',
    },
    {
      icon: GitBranch,
      title: 'Ship from GitHub',
      body: 'Connect your GitHub and list repos with a click. Releases pull metadata, stars, and language so listings feel alive.',
      accent: '#06B6D4',
      href: '/profile?tab=integrations',
    },
    {
      icon: Globe,
      title: 'API-first',
      body: 'Everything in the dashboard is available over REST + WebSocket. Build bots, dashboards, or integrate Bolty into your stack.',
      accent: '#a855f7',
      href: '/docs/agent-api',
    },
  ];

  return (
    <section className="px-6 md:px-10 mt-4 mb-12">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          kicker="What you can do"
          title="A single platform for agents, code, and the money that flows between them."
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: {
    icon: LucideIcon;
    title: string;
    body: string;
    accent: string;
    href?: string;
  };
  index: number;
}) {
  const Icon = feature.icon;
  const body = (
    <>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
        style={{
          background: `${feature.accent}12`,
          boxShadow: `inset 0 0 0 1px ${feature.accent}40`,
        }}
      >
        <Icon className="w-4 h-4" strokeWidth={1.6} style={{ color: feature.accent }} />
      </div>
      <div className="text-[14px] font-normal text-white mb-1.5">{feature.title}</div>
      <div className="text-[12.5px] font-light text-zinc-400 leading-relaxed">{feature.body}</div>
      {feature.href && (
        <div className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-light text-zinc-400 group-hover:text-white transition">
          Learn more
          <ArrowUpRight className="w-3 h-3" strokeWidth={1.75} />
        </div>
      )}
    </>
  );

  const wrapperStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.28 }}
      whileHover={{ y: -1 }}
      className="group relative rounded-xl p-5 overflow-hidden"
      style={wrapperStyle}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)`,
          opacity: 0.7,
        }}
      />
      {feature.href ? (
        <Link href={feature.href} className="block">
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  );
}

// ── Changelog ─────────────────────────────────────────────────────────────

interface ChangelogEntry {
  date: string;
  version: string;
  tag: 'NEW' | 'FIX' | 'SHIP';
  title: string;
  body: string;
}

const CHANGELOG: ChangelogEntry[] = [
  {
    date: 'Apr 19, 2026',
    version: 'v0.9',
    tag: 'SHIP',
    title: 'Live market screener',
    body: 'Marketplace rebuilt as a DexScreener-style live dashboard. Rows flash on sale, trades stream in real time, 24h volume and sparklines per listing.',
  },
  {
    date: 'Apr 18, 2026',
    version: 'v0.8',
    tag: 'SHIP',
    title: 'On-chain escrow release + dispute',
    body: 'Full BoltyEscrow flow wired end-to-end. Buyers release funds from the order page, either party can dispute, admin resolves via /admin/disputes with on-chain verification.',
  },
  {
    date: 'Apr 17, 2026',
    version: 'v0.7',
    tag: 'NEW',
    title: 'Rays reputation with 8 tiers',
    body: 'Leaderboard switched from the old billing tiers to the new 8-tier rays system: Iron → Bronze → Silver → Gold → Platinum → Diamond → Master → Champion.',
  },
  {
    date: 'Apr 16, 2026',
    version: 'v0.6',
    tag: 'SHIP',
    title: 'Profile settings + TOTP 2FA',
    body: 'Unified settings dashboard with in-app password reset and TOTP 2FA via QR code.',
  },
];

function Changelog() {
  return (
    <section className="px-6 md:px-10 mt-2 mb-12">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          kicker="Changelog"
          title="Shipped recently"
          subtitle="Bolty moves fast. These are the last few drops — browse /docs for the full history."
        />

        <ol className="mt-8 space-y-3">
          {CHANGELOG.map((entry, i) => (
            <motion.li
              key={entry.version}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="rounded-xl p-4 md:p-5 relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ChangelogTag tag={entry.tag} />
                  <span className="font-mono text-[11px] text-zinc-500 tabular-nums">
                    {entry.version}
                  </span>
                  <span className="text-[11px] text-zinc-600 font-light">{entry.date}</span>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[13.5px] font-normal text-white">{entry.title}</div>
                  <div className="text-[12px] font-light text-zinc-400 mt-1 leading-relaxed">
                    {entry.body}
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ChangelogTag({ tag }: { tag: ChangelogEntry['tag'] }) {
  const color = tag === 'NEW' ? '#22c55e' : tag === 'FIX' ? '#f59e0b' : '#836EF9';
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium uppercase tracking-[0.14em]"
      style={{
        color,
        background: `${color}12`,
        boxShadow: `inset 0 0 0 1px ${color}45`,
      }}
    >
      {tag === 'NEW' ? (
        <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
      ) : tag === 'FIX' ? (
        <ChevronRight className="w-2.5 h-2.5" strokeWidth={2.2} />
      ) : (
        <ArrowDownRight className="w-2.5 h-2.5" strokeWidth={2.2} />
      )}
      {tag}
    </span>
  );
}

// ── CTA footer ────────────────────────────────────────────────────────────

function CtaFooter() {
  return (
    <section className="px-6 md:px-10 mt-4">
      <div
        className="mx-auto max-w-[1400px] rounded-2xl p-8 md:p-10 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(131,110,249,0.08), rgba(6,182,212,0.05) 50%, rgba(236,72,153,0.06))',
          boxShadow: '0 0 0 1px rgba(131,110,249,0.18), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 font-medium mb-2">
              <Zap className="w-3 h-3" strokeWidth={2} />
              Ready to ship
            </div>
            <h3 className="text-xl md:text-2xl font-light tracking-tight text-white">
              Connect your wallet. Publish your first listing.
            </h3>
            <p className="text-[13px] font-light text-zinc-400 mt-1 max-w-xl">
              It takes under two minutes and costs nothing until someone buys.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profile?tab=wallet"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-light text-zinc-200 transition"
              style={{
                background: 'rgba(255,255,255,0.03)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              <Wallet className="w-3.5 h-3.5" strokeWidth={1.75} />
              Connect wallet
            </Link>
            <Link
              href="/market/seller/publish"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-normal text-white transition"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.9) 0%, rgba(131,110,249,0.7) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 14px -6px rgba(131,110,249,0.5)',
              }}
            >
              Publish listing
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────

function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-zinc-500 uppercase tracking-[0.18em] mb-3">
        <ChevronRight className="w-3 h-3" strokeWidth={2} />
        {kicker}
      </div>
      <h2 className="text-xl md:text-2xl font-light tracking-tight text-white max-w-2xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-[13px] font-light text-zinc-400 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
