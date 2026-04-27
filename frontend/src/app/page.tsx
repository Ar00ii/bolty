'use client';

import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bot,
  GitBranch,
  Rocket,
  ShoppingBag,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api/client';

/**
 * Home — wrapped in the new AppShell so visitors land in the same
 * left-rail navigation as the rest of the app, with a content layout
 * that prioritises CLARITY over marketing flourish.
 *
 * Information hierarchy was rebuilt from "what's pretty" to "what
 * does a first-time visitor need to understand in 5 seconds":
 *
 *  1. **Hero** — one sentence, plain language, what the platform is
 *     for.
 *  2. **Three "what you can do" cards** — Browse, Sell, Launch — each
 *     with a one-line teaser and a primary action. This is the part
 *     the previous iteration buried; it now sits right under the
 *     hero so the value prop is concrete.
 *  3. **Featured / live data** — actual listings, not abstract
 *     marketing tiles. Pulls from /market/listings on mount.
 *  4. **Stats strip** — small, secondary, just enough to signal the
 *     platform is alive.
 *
 * Everything sits on a white surface with soft shadows + 1px
 * hairline borders, matching the base.org aesthetic the user
 * requested.
 */
type Listing = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  price?: number | null;
  imageUrl?: string | null;
};

export default function HomePage() {
  return (
    <AppShell>
      <HomeContent />
    </AppShell>
  );
}

function HomeContent() {
  const [agents, setAgents] = useState<Listing[]>([]);
  const [repos, setRepos] = useState<Listing[]>([]);
  const [stats, setStats] = useState<{
    agents: number;
    repos: number;
    community: number;
  } | null>(null);

  useEffect(() => {
    let cancel = false;
    Promise.all([
      api
        .get<{ items?: Listing[] }>('/market/listings?type=AI_AGENT&limit=6')
        .catch(() => ({ items: [] as Listing[] })),
      api
        .get<{ items?: Listing[] }>('/market/listings?type=REPO&limit=6')
        .catch(() => ({ items: [] as Listing[] })),
      api
        .get<{ totalCount?: number }>('/users/community')
        .catch(() => ({ totalCount: 0 })),
    ]).then(([a, r, c]) => {
      if (cancel) return;
      setAgents(a.items ?? []);
      setRepos(r.items ?? []);
      setStats({
        agents: (a.items ?? []).length,
        repos: (r.items ?? []).length,
        community: c.totalCount ?? 0,
      });
    });
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="relative">
      {/* Soft top wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-[480px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,82,255,0.07), rgba(0,82,255,0) 60%)',
        }}
      />

      <div className="relative z-10 px-6 sm:px-10 py-8 max-w-6xl mx-auto">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="pt-6 pb-10"
        >
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium mb-5"
            style={{
              background: 'var(--brand-dim)',
              color: '#0052FF',
            }}
          >
            <Sparkles className="w-3 h-3" />
            Now live on Ethereum mainnet
          </span>
          <h1
            style={{
              fontSize: 'clamp(40px, 5.6vw, 68px)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-1.8px',
              color: 'var(--text)',
            }}
          >
            buy and sell{' '}
            <span style={{ color: '#0052FF' }}>AI agents</span>
            <br />
            that actually do work.
          </h1>
          <p
            className="mt-4 max-w-xl"
            style={{
              fontSize: '16.5px',
              fontWeight: 400,
              lineHeight: 1.55,
              color: 'var(--text-muted)',
            }}
          >
            A marketplace for autonomous agents — settled onchain,
            scanned for security on upload, and powered by your wallet.
            No accounts, no email, no middleman.
          </p>
        </motion.section>

        {/* ── 3-card "what you can do here" — the headline value prop ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
          <ActionCard
            icon={ShoppingBag}
            accent="#0052FF"
            label="Browse"
            title="Use an agent"
            body="Find an agent that fits your job. Pay once, run as much as you like."
            cta="Browse agents"
            href="/market/agents"
            delay={0.05}
          />
          <ActionCard
            icon={Upload}
            accent="#627EEA"
            label="Sell"
            title="Publish your agent"
            body="Upload a sandbox bundle or webhook. Get paid in ETH each time someone buys access."
            cta="Start selling"
            href="/profile?publish=1"
            delay={0.1}
          />
          <ActionCard
            icon={Rocket}
            accent="#00D4FF"
            label="Launch"
            title="Mint a token"
            body="Spin up a launch token for your agent's community. Powered by ETH liquidity."
            cta="Open launchpad"
            href="/launchpad"
            badge="Soon"
            delay={0.15}
          />
        </section>

        {/* ── How it works — 3 simple steps ─────────────────────── */}
        <section
          className="rounded-2xl p-6 mb-12"
          style={{
            background: 'var(--bg-muted)',
            boxShadow: 'inset 0 0 0 1px var(--border)',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
            className="mb-5"
          >
            How it works · 3 steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Step
              number="01"
              title="Connect your wallet"
              body="MetaMask or any EVM wallet. Sign one message — no email, no password."
            />
            <Step
              number="02"
              title="Pick or list"
              body="Buyers browse the catalog. Sellers upload an agent + a price."
            />
            <Step
              number="03"
              title="Settle onchain"
              body="ETH transfers between buyer and seller through escrow. Done in one block."
            />
          </div>
        </section>

        {/* ── Featured agents — actual listings, not abstract pitches ── */}
        {agents.length > 0 && (
          <section className="mb-12">
            <SectionHeader
              title="Featured agents"
              href="/market/agents"
              cta="See all agents →"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agents.slice(0, 6).map((a, i) => (
                <ListingCard key={a.id} listing={a} delay={i * 0.04} />
              ))}
            </div>
          </section>
        )}

        {/* ── Featured repos ─────────────────────────────────────── */}
        {repos.length > 0 && (
          <section className="mb-12">
            <SectionHeader
              title="Code repositories"
              href="/market/repos"
              cta="See all repos →"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {repos.slice(0, 6).map((r, i) => (
                <ListingCard key={r.id} listing={r} delay={i * 0.04} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state if no listings yet */}
        {stats && agents.length === 0 && repos.length === 0 && (
          <section
            className="rounded-2xl p-10 text-center mb-12"
            style={{
              background: '#ffffff',
              boxShadow: 'inset 0 0 0 1px var(--border), var(--shadow-xs)',
            }}
          >
            <Sparkles
              className="w-7 h-7 mx-auto mb-3"
              style={{ color: '#0052FF' }}
            />
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text)',
                letterSpacing: '-0.4px',
              }}
            >
              Be one of the first.
            </h3>
            <p
              className="mt-2 max-w-md mx-auto"
              style={{
                fontSize: '14px',
                fontWeight: 400,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              The marketplace is wide open. Connect your wallet and
              publish the first agent — your listing will be the first
              thing visitors see.
            </p>
            <Link
              href="/auth"
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-medium text-white transition hover:brightness-110"
              style={{ background: '#0052FF' }}
            >
              Connect wallet
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </section>
        )}

        {/* ── Stats strip — small, secondary, signals "alive" ────── */}
        <section
          className="grid grid-cols-3 gap-3 mb-12"
        >
          <Stat label="AI agents" value={stats?.agents ?? '—'} icon={Bot} />
          <Stat label="Code repos" value={stats?.repos ?? '—'} icon={GitBranch} />
          <Stat label="Community" value={stats?.community ?? '—'} icon={Users} />
        </section>

        {/* Footer */}
        <footer
          className="pt-6 pb-10 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="text-[11.5px] font-light text-[var(--text-muted)]">
            © 2026 — onchain marketplace for autonomous agents
          </div>
          <div className="flex items-center gap-4 text-[11.5px] font-light text-[var(--text-muted)]">
            <Link href="/docs" className="hover:text-[var(--text)] transition">
              Docs
            </Link>
            <Link href="/terms" className="hover:text-[var(--text)] transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--text)] transition">
              Privacy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  accent,
  label,
  title,
  body,
  cta,
  href,
  badge,
  delay,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  label: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  badge?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      <Link
        href={href}
        className="group relative block rounded-2xl p-6 h-full transition hover:translate-y-[-2px]"
        style={{
          background: '#ffffff',
          boxShadow: 'inset 0 0 0 1px var(--border), var(--shadow-xs)',
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}14` }}
          >
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          {badge && (
            <span
              className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${accent}14`, color: accent }}
            >
              {badge}
            </span>
          )}
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.16em] font-medium mb-1.5"
          style={{ color: accent }}
        >
          {label}
        </div>
        <div
          className="font-medium mb-1.5"
          style={{
            fontSize: '18px',
            color: 'var(--text)',
            letterSpacing: '-0.3px',
          }}
        >
          {title}
        </div>
        <div
          className="font-light mb-5"
          style={{
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: 'var(--text-muted)',
          }}
        >
          {body}
        </div>
        <span
          className="inline-flex items-center gap-1 text-[13px] font-medium transition group-hover:gap-1.5"
          style={{ color: accent }}
        >
          {cta}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </motion.div>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div
        className="font-medium mb-2"
        style={{
          fontSize: '32px',
          fontWeight: 400,
          color: '#0052FF',
          letterSpacing: '-1px',
          lineHeight: 1,
        }}
      >
        {number}
      </div>
      <div
        className="font-medium mb-1"
        style={{
          fontSize: '15px',
          color: 'var(--text)',
        }}
      >
        {title}
      </div>
      <div
        className="font-light"
        style={{
          fontSize: '13.5px',
          color: 'var(--text-muted)',
          lineHeight: 1.55,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  cta,
}: {
  title: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 500,
          color: 'var(--text)',
          letterSpacing: '-0.3px',
        }}
      >
        {title}
      </h2>
      <Link
        href={href}
        className="text-[12.5px] font-medium transition hover:underline"
        style={{ color: '#0052FF' }}
      >
        {cta}
      </Link>
    </div>
  );
}

function ListingCard({
  listing,
  delay,
}: {
  listing: Listing;
  delay: number;
}) {
  const isAgent = listing.type === 'AI_AGENT';
  const href = isAgent
    ? `/market/agents/${listing.id}`
    : `/market/repos/${listing.id}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link
        href={href}
        className="group block rounded-2xl p-5 h-full transition hover:translate-y-[-2px]"
        style={{
          background: '#ffffff',
          boxShadow: 'inset 0 0 0 1px var(--border), var(--shadow-xs)',
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isAgent ? 'rgba(0,82,255,0.08)' : 'rgba(98,126,234,0.08)',
              color: isAgent ? '#0052FF' : '#627EEA',
            }}
          >
            {isAgent ? (
              <Bot className="w-4 h-4" />
            ) : (
              <GitBranch className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] uppercase tracking-[0.16em] font-medium mb-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {isAgent ? 'AI Agent' : 'Repository'}
            </div>
            <div
              className="font-medium truncate"
              style={{
                fontSize: '14.5px',
                color: 'var(--text)',
              }}
            >
              {listing.title || 'Untitled'}
            </div>
          </div>
        </div>
        {listing.description && (
          <p
            className="font-light"
            style={{
              fontSize: '12.5px',
              lineHeight: 1.5,
              color: 'var(--text-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {listing.description}
          </p>
        )}
        <div
          className="mt-3 pt-3 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span
            className="text-[12.5px] font-medium"
            style={{ color: 'var(--text)' }}
          >
            {listing.price != null
              ? `${listing.price} ETH`
              : 'Free / open access'}
          </span>
          <ArrowUpRight
            className="w-3.5 h-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{
        background: '#ffffff',
        boxShadow: 'inset 0 0 0 1px var(--border)',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--bg-muted)' }}
      >
        <Icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="min-w-0">
        <div
          className="font-medium"
          style={{
            fontSize: '20px',
            color: 'var(--text)',
            letterSpacing: '-0.4px',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          className="text-[11.5px] font-light mt-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
