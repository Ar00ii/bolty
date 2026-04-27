'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  ArrowUpRight,
  Bot,
  GitBranch,
  Rocket,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BRAND_NAME_DISPLAY, BRAND_TAGLINE } from '@/lib/brand';

/**
 * Home dashboard — base.org-inspired light surface, app-flow content.
 *
 * Design language follows the base.org public site:
 *  - White background (#ffffff) as the dominant canvas, with a soft
 *    radial blue wash at the very top so the surface doesn't feel
 *    clinical.
 *  - Lowercase wordmark in the top-left (typographic logo, no icon
 *    glyph — same visual idiom as base.org's "base" wordmark).
 *  - Oversized hero typography (clamp 48-72px) with the brand word
 *    rendered in solid Coinbase blue (#0052FF) — no gradient because
 *    base.org doesn't use one in the hero.
 *  - Cards: pure white with a 1px hairline border (#E5EAF6) and a
 *    subtle 8/24 shadow on hover. No glow effects, no neon.
 *  - Pills: white pill with a 1px border and dot indicator. Live
 *    chain pill at the top sits in the same idiom.
 *  - Framer-motion entrance animations on every card so the first
 *    paint feels alive (the base.org site does this too on scroll).
 *
 * The information architecture (chain pill → hero → 4 metric tiles →
 * 4 nav tiles → recent activity feed) is unchanged from the prior
 * iteration so the user gets the same dashboard flow they liked,
 * just on the new aesthetic surface.
 */
type Metrics = {
  agents: number;
  repos: number;
  launches: number;
  activeUsers: number;
};

const NAV_TILES = [
  {
    icon: Bot,
    title: 'Agents',
    href: '/market/agents',
    teaser: 'Buy, sell, run autonomous agents.',
    accent: '#0052FF',
  },
  {
    icon: GitBranch,
    title: 'Repos',
    href: '/market/repos',
    teaser: 'GitHub-backed paid access.',
    accent: '#627EEA',
  },
  {
    icon: Rocket,
    title: 'Launchpad',
    href: '/launchpad',
    teaser: 'Mint a token for any agent.',
    accent: '#00D4FF',
    badge: 'Soon',
  },
  {
    icon: Shield,
    title: 'Guard',
    href: '/docs/boltyguard',
    teaser: 'Every listing scanned on upload.',
    accent: '#16A34A',
  },
];

export default function HomeDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recent, setRecent] = useState<
    Array<{ id: string; title: string; href: string; sub: string }>
  >([]);

  useEffect(() => {
    let cancel = false;
    Promise.all([
      api
        .get<{ totalCount?: number }>('/users/community')
        .catch(() => ({ totalCount: 0 })),
      api
        .get<{ items?: Array<{ id: string; title?: string; type?: string }> }>(
          '/market/listings?limit=12',
        )
        .catch(() => ({ items: [] })),
    ]).then(([community, listings]) => {
      if (cancel) return;
      const items = listings.items ?? [];
      const agentCount = items.filter((l) => l.type === 'AI_AGENT').length;
      const repoCount = items.filter((l) => l.type === 'REPO').length;
      setMetrics({
        agents: agentCount,
        repos: repoCount,
        launches: 0,
        activeUsers: community.totalCount ?? 0,
      });
      setRecent(
        items.slice(0, 6).map((l) => ({
          id: l.id,
          title: l.title ?? 'Untitled',
          href:
            l.type === 'AI_AGENT'
              ? `/market/agents/${l.id}`
              : `/market/repos/${l.id}`,
          sub: l.type === 'AI_AGENT' ? 'AI Agent' : 'Repository',
        })),
      );
    });
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: '#ffffff',
        color: 'var(--text)',
      }}
    >
      {/* Soft blue wash at the top — subtle, no neon. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-[600px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,82,255,0.08), rgba(0,82,255,0) 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 py-6">
        {/* ── Top bar: wordmark + chain + wallet ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between mb-16"
        >
          <Link
            href="/"
            className="font-light tracking-tight"
            style={{
              fontSize: '20px',
              color: 'var(--text)',
              letterSpacing: '-0.4px',
            }}
          >
            {BRAND_NAME_DISPLAY}
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-light"
              style={{
                background: '#ffffff',
                color: 'var(--text-secondary)',
                boxShadow: 'inset 0 0 0 1px var(--border)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#16A34A' }}
              />
              Ethereum Mainnet
            </span>
            {isAuthenticated ? (
              <button
                onClick={() => router.push('/profile')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12.5px] font-light transition hover:bg-[var(--bg-muted)]"
                style={{
                  background: '#ffffff',
                  color: 'var(--text)',
                  boxShadow: 'inset 0 0 0 1px var(--border)',
                }}
              >
                <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
                {user?.username ?? 'Profile'}
                <ArrowUpRight className="w-3 h-3 opacity-60" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/auth')}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12.5px] font-medium text-white transition hover:brightness-110"
                style={{
                  background: '#0052FF',
                }}
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect wallet
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Hero — base.org style: oversized lowercase, brand-blue word ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-14"
        >
          <h1
            style={{
              fontSize: 'clamp(44px, 6vw, 76px)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-2px',
              color: 'var(--text)',
            }}
          >
            the marketplace for{' '}
            <span style={{ color: '#0052FF' }}>autonomous</span>
            <br />
            agents on{' '}
            <span style={{ color: '#0052FF' }}>ethereum</span>.
          </h1>
          <p
            className="mt-5 max-w-xl"
            style={{
              fontSize: '17px',
              fontWeight: 400,
              lineHeight: 1.55,
              color: 'var(--text-muted)',
            }}
          >
            Buy AI agents, paid GitHub repos, mint launch tokens — all
            settled onchain on Ethereum mainnet, with every listing
            scanned before it goes live.
          </p>
          <div className="mt-7 flex items-center gap-3 flex-wrap">
            <Link
              href="/market/agents"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-medium text-white transition hover:brightness-110"
              style={{ background: '#0052FF' }}
            >
              Explore agents
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-medium transition hover:bg-[var(--bg-muted)]"
              style={{
                color: 'var(--text)',
                background: '#ffffff',
                boxShadow: 'inset 0 0 0 1px var(--border)',
              }}
            >
              Read the docs
            </Link>
          </div>
        </motion.section>

        {/* ── 4-up metric strip — live data ──────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            {
              label: 'AI agents',
              value: metrics?.agents ?? '—',
              icon: Bot,
              accent: '#0052FF',
            },
            {
              label: 'Repos',
              value: metrics?.repos ?? '—',
              icon: GitBranch,
              accent: '#627EEA',
            },
            {
              label: 'Token launches',
              value: metrics?.launches ?? '—',
              icon: Rocket,
              accent: '#00D4FF',
            },
            {
              label: 'Community',
              value: metrics?.activeUsers ?? '—',
              icon: Sparkles,
              accent: '#16A34A',
            },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                className="rounded-2xl p-5 transition hover:translate-y-[-2px]"
                style={{
                  background: '#ffffff',
                  boxShadow: 'inset 0 0 0 1px var(--border), var(--shadow-xs)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${m.accent}14` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: m.accent }} />
                  </div>
                  <Activity className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                </div>
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 500,
                    color: 'var(--text)',
                    letterSpacing: '-1px',
                    lineHeight: 1,
                  }}
                >
                  {m.value}
                </div>
                <div
                  className="mt-1.5 text-[12px] font-light"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {m.label}
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* ── Primary nav tiles — base.org card style ──────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {NAV_TILES.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.href}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 + i * 0.06 }}
              >
                <Link
                  href={t.href}
                  className="group relative block rounded-2xl p-5 h-full transition overflow-hidden hover:translate-y-[-2px]"
                  style={{
                    background: '#ffffff',
                    boxShadow: 'inset 0 0 0 1px var(--border), var(--shadow-xs)',
                  }}
                >
                  <div className="relative flex items-start justify-between mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${t.accent}14` }}
                    >
                      <Icon className="w-4.5 h-4.5" style={{ color: t.accent }} />
                    </div>
                    {t.badge && (
                      <span
                        className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: `${t.accent}14`,
                          color: t.accent,
                        }}
                      >
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <div
                    className="font-medium text-[16px] mb-1"
                    style={{ color: 'var(--text)' }}
                  >
                    {t.title}
                  </div>
                  <div
                    className="text-[13px] font-light"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.teaser}
                  </div>
                  <ArrowUpRight
                    className="absolute right-5 bottom-5 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition"
                    style={{ color: t.accent }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </section>

        {/* ── Live activity feed ─────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-3">
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text)',
                letterSpacing: '-0.3px',
              }}
            >
              Recent activity
            </h2>
            <Link
              href="/market"
              className="text-[12.5px] font-medium transition hover:underline"
              style={{ color: '#0052FF' }}
            >
              View all →
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#ffffff',
              boxShadow: 'inset 0 0 0 1px var(--border), var(--shadow-xs)',
            }}
          >
            {recent.length === 0 ? (
              <div className="p-8 text-center">
                <Zap
                  className="w-5 h-5 mx-auto mb-2.5 opacity-50"
                  style={{ color: '#0052FF' }}
                />
                <div className="text-[13px] font-light text-[var(--text-muted)]">
                  No listings yet — be the first to publish.{' '}
                  <Link
                    href="/auth"
                    className="font-medium hover:underline"
                    style={{ color: '#0052FF' }}
                  >
                    Connect wallet
                  </Link>
                </div>
              </div>
            ) : (
              <ul>
                {recent.map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.45 + i * 0.04 }}
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    <Link
                      href={r.href}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-muted)] transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: 'var(--brand-dim)',
                            color: 'var(--brand)',
                          }}
                        >
                          {r.sub === 'AI Agent' ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <GitBranch className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div
                            className="text-[13.5px] font-medium"
                            style={{ color: 'var(--text)' }}
                          >
                            {r.title}
                          </div>
                          <div
                            className="text-[10.5px] uppercase tracking-wider font-medium mt-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {r.sub}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </section>

        {/* ── Footer — minimal, base.org style ─────────────────────── */}
        <footer
          className="pt-8 mt-8 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-light tracking-tight"
              style={{ fontSize: '14px', color: 'var(--text)' }}
            >
              {BRAND_NAME_DISPLAY}
            </span>
            <span className="text-[11.5px] font-light text-[var(--text-muted)]">
              · {BRAND_TAGLINE}
            </span>
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
