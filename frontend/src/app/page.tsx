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

/**
 * Bolty home — radically rebuilt as an app dashboard, not a marketing
 * landing. The previous /page.tsx was a 454-line scroll-and-pitch
 * surface that buried the actual product behind hero headers; this
 * one drops the visitor straight into live data the platform is
 * generating right now.
 *
 * Design language:
 *  - Ethereum mainnet brand (deep blue #2535A8, primary blue #627EEA,
 *    cyan accent #00D4FF) instead of the old purple identity.
 *  - App grid layout: a top banner showing chain + wallet, then a
 *    4-up metric strip that fetches real numbers from the API on
 *    mount, then nav tiles, then a recent-activity feed.
 *  - Framer-motion entrance animations on every primary card so the
 *    first paint feels alive instead of static.
 *  - No more "Sign up free" CTA — accounts only exist with a wallet.
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
    accent: '#627EEA',
  },
  {
    icon: GitBranch,
    title: 'Repos',
    href: '/market/repos',
    teaser: 'GitHub-backed paid access.',
    accent: '#00D4FF',
  },
  {
    icon: Rocket,
    title: 'Launchpad',
    href: '/launchpad',
    teaser: 'Mint a token for any agent.',
    accent: '#8DA4F1',
    badge: 'Coming to ETH',
  },
  {
    icon: Shield,
    title: 'BoltyGuard',
    href: '/docs/boltyguard',
    teaser: 'Every listing scanned on upload.',
    accent: '#34D399',
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
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Ambient ETH-blue glow — fixed at the top, behind everything. */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 right-0 h-[420px] opacity-70 z-0"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(98,126,234,0.18), rgba(98,126,234,0) 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 py-8">
        {/* ── Top banner: chain + wallet status ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between flex-wrap gap-3 mb-10"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-light"
              style={{
                background: 'var(--brand-dim)',
                color: 'var(--brand)',
                boxShadow: 'inset 0 0 0 1px var(--brand-dim)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: 'var(--brand)' }}
              />
              Ethereum Mainnet · chain 1
            </span>
            <span className="text-[11.5px] font-light text-[var(--text-muted)]">
              gas live · WebSocket connected
            </span>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => router.push('/profile')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12.5px] font-light transition"
              style={{
                background: 'var(--bg-card)',
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
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12.5px] font-light text-white transition hover:brightness-110"
              style={{
                background:
                  'linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)',
                boxShadow: 'var(--shadow-brand)',
              }}
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect wallet
            </button>
          )}
        </motion.div>

        {/* ── Hero: terse, app-style ───────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-12"
        >
          <h1
            className="text-[var(--text)]"
            style={{
              fontSize: 'clamp(36px, 4.6vw, 56px)',
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: '-1.2px',
            }}
          >
            The marketplace for{' '}
            <span
              style={{
                background:
                  'linear-gradient(90deg, #627EEA 0%, #00D4FF 50%, #627EEA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 100%',
                animation: 'shimmer 6s ease-in-out infinite',
              }}
            >
              autonomous agents
            </span>
            <br />
            on Ethereum.
          </h1>
          <p
            className="mt-3 max-w-2xl text-[var(--text-muted)] font-light"
            style={{ fontSize: '15px', lineHeight: 1.6 }}
          >
            Buy AI agents, paid GitHub repos, mint launch tokens — all
            settled onchain on ETH mainnet, with BoltyGuard scanning
            every listing before it goes live.
          </p>
        </motion.section>

        {/* ── 4-up metric strip — live data, not marketing copy ──── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            {
              label: 'AI agents',
              value: metrics?.agents ?? '—',
              icon: Bot,
              accent: '#627EEA',
            },
            {
              label: 'Repos',
              value: metrics?.repos ?? '—',
              icon: GitBranch,
              accent: '#00D4FF',
            },
            {
              label: 'Token launches',
              value: metrics?.launches ?? '—',
              icon: Rocket,
              accent: '#8DA4F1',
            },
            {
              label: 'Community',
              value: metrics?.activeUsers ?? '—',
              icon: Sparkles,
              accent: '#34D399',
            },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                className="rounded-xl p-4 transition hover:translate-y-[-1px]"
                style={{
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--border)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${m.accent}18`,
                      boxShadow: `inset 0 0 0 1px ${m.accent}40`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: m.accent }} />
                  </div>
                  <Activity className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                </div>
                <div
                  className="font-light"
                  style={{
                    fontSize: '28px',
                    color: 'var(--text)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {m.value}
                </div>
                <div
                  className="text-[11.5px] font-light mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {m.label}
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* ── Primary nav tiles ─────────────────────────────────── */}
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
                  className="group relative block rounded-xl p-5 h-full transition overflow-hidden"
                  style={{
                    background: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--border)',
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at top right, ${t.accent}22, transparent 60%)`,
                    }}
                  />
                  <div className="relative flex items-start justify-between mb-4">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: `${t.accent}18`,
                        boxShadow: `inset 0 0 0 1px ${t.accent}40`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: t.accent }} />
                    </div>
                    {t.badge && (
                      <span
                        className="text-[10px] uppercase tracking-wider font-light px-1.5 py-0.5 rounded"
                        style={{
                          background: `${t.accent}18`,
                          color: t.accent,
                        }}
                      >
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <div
                    className="font-light text-[16px] mb-1"
                    style={{ color: 'var(--text)' }}
                  >
                    {t.title}
                  </div>
                  <div
                    className="text-[12px] font-light"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.teaser}
                  </div>
                  <ArrowUpRight
                    className="absolute right-4 bottom-4 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition"
                    style={{ color: t.accent }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </section>

        {/* ── Live activity feed — actual recent listings ────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-light" style={{ fontSize: '18px', color: 'var(--text)' }}>
              Recent activity
            </h2>
            <Link
              href="/market"
              className="text-[12px] font-light hover:underline"
              style={{ color: 'var(--brand)' }}
            >
              View all →
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="rounded-xl overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-sm), inset 0 0 0 1px var(--border)',
            }}
          >
            {recent.length === 0 ? (
              <div className="p-6 text-center text-[12.5px] font-light text-[var(--text-muted)]">
                <Zap
                  className="w-5 h-5 mx-auto mb-2 opacity-50"
                  style={{ color: 'var(--brand)' }}
                />
                No listings yet — be the first to publish.{' '}
                <Link href="/auth" style={{ color: 'var(--brand)' }} className="hover:underline">
                  Connect wallet
                </Link>
              </div>
            ) : (
              <ul>
                {recent.map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.45 + i * 0.04 }}
                    style={{
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    <Link
                      href={r.href}
                      className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-card2)] transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{
                            background: 'var(--brand-dim)',
                            color: 'var(--brand)',
                          }}
                        >
                          {r.sub === 'AI Agent' ? (
                            <Bot className="w-3.5 h-3.5" />
                          ) : (
                            <GitBranch className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div
                            className="text-[13px] font-light"
                            style={{ color: 'var(--text)' }}
                          >
                            {r.title}
                          </div>
                          <div
                            className="text-[10.5px] uppercase tracking-wider font-light"
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
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
