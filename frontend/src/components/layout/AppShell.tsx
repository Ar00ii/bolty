'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Bot,
  ChevronRight,
  GitBranch,
  Home,
  Menu,
  Rocket,
  Settings,
  Shield,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { BRAND_NAME_DISPLAY } from '@/lib/brand';

/**
 * AppShell — sticky sidebar + top bar + main content.
 *
 * Drops a Coinbase / Linear / Vercel-style chrome around any page
 * without depending on the legacy `ClientShell` + `StandardSidebar`
 * pair (which is wired for the dark Bolty theme and isn't worth
 * retro-fitting for the light base.org rebrand).
 *
 * Layout:
 *  - 240px sticky sidebar on lg+; collapses to a slide-in drawer
 *    behind a hamburger on smaller viewports.
 *  - Wordmark at the top of the sidebar (lowercase, no glyph icon).
 *  - Nav grouped into "Marketplace" + "Account"; active link gets
 *    a brand-blue indicator bar.
 *  - Wallet pill at the bottom of the sidebar — Connect or
 *    @username depending on auth.
 *  - Main content area is a plain <main> the page can fill however
 *    it wants. The shell deliberately does NOT inject a top-page
 *    header; pages can render their own hero/header inline so the
 *    surface layout matches base.org's editorial style.
 */
const NAV_PRIMARY = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/market/agents', label: 'Agents', icon: Bot },
  { href: '/market/repos', label: 'Repos', icon: GitBranch },
  { href: '/launchpad', label: 'Launchpad', icon: Rocket, badge: 'Soon' },
  { href: '/docs/boltyguard', label: 'Guard', icon: Shield },
];

const NAV_ACCOUNT = [
  { href: '/orders', label: 'Activity', icon: Activity, requireAuth: true },
  { href: '/profile', label: 'Profile', icon: Settings, requireAuth: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const sidebar = (
    <nav
      className="flex flex-col h-full"
      style={{ background: '#ffffff', borderRight: '1px solid var(--border)' }}
    >
      {/* Wordmark */}
      <div className="px-5 py-5 flex items-center justify-between">
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
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-md hover:bg-[var(--bg-muted)] transition"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* Chain pill */}
      <div className="px-3 mb-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-light w-fit"
          style={{
            background: 'var(--bg-muted)',
            color: 'var(--text-secondary)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#16A34A' }}
          />
          Ethereum Mainnet
        </span>
      </div>

      {/* Primary nav */}
      <div className="px-2 flex-1 overflow-y-auto">
        <SidebarGroup label="Marketplace">
          {NAV_PRIMARY.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={Icon}
                label={item.label}
                active={active}
                badge={item.badge}
                onNavigate={() => setMobileOpen(false)}
              />
            );
          })}
        </SidebarGroup>

        {isAuthenticated && (
          <SidebarGroup label="Account">
            {NAV_ACCOUNT.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  icon={Icon}
                  label={item.label}
                  active={active}
                  onNavigate={() => setMobileOpen(false)}
                />
              );
            })}
          </SidebarGroup>
        )}
      </div>

      {/* Wallet bottom block */}
      <div
        className="p-3 mt-auto"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {isAuthenticated ? (
          <button
            onClick={() => {
              router.push('/profile');
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition hover:bg-[var(--bg-muted)]"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium text-white shrink-0"
                style={{ background: '#0052FF' }}
              >
                {(user?.username ?? 'U').slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                {user?.username ?? 'Account'}
              </span>
            </span>
            <ChevronRight
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: 'var(--text-muted)' }}
            />
          </button>
        ) : (
          <button
            onClick={() => {
              router.push('/auth');
              setMobileOpen(false);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-white transition hover:brightness-110"
            style={{ background: '#0052FF' }}
          >
            <Wallet className="w-3.5 h-3.5" />
            Connect wallet
          </button>
        )}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex" style={{ background: '#ffffff' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[240px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {sidebar}
      </aside>

      {/* Mobile drawer + scrim */}
      {mobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setMobileOpen(false)}
          />
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[260px]"
          >
            {sidebar}
          </motion.aside>
        </>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile-only top bar with hamburger */}
        <div
          className="lg:hidden flex items-center justify-between px-4 py-3"
          style={{
            background: '#ffffff',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-muted)] transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" style={{ color: 'var(--text)' }} />
          </button>
          <Link
            href="/"
            className="font-light tracking-tight"
            style={{
              fontSize: '17px',
              color: 'var(--text)',
              letterSpacing: '-0.3px',
            }}
          >
            {BRAND_NAME_DISPLAY}
          </Link>
          {isAuthenticated ? (
            <button
              onClick={() => router.push('/profile')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium text-white"
              style={{ background: '#0052FF' }}
            >
              {(user?.username ?? 'U').slice(0, 1).toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => router.push('/auth')}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium text-white"
              style={{ background: '#0052FF' }}
            >
              Connect
            </button>
          )}
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div
        className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.16em] font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  active: boolean;
  badge?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="relative group flex items-center justify-between gap-2 pl-3 pr-3 py-1.5 rounded-md transition"
      style={{
        background: active ? 'var(--brand-dim)' : 'transparent',
        color: active ? '#0052FF' : 'var(--text-secondary)',
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full transition"
        style={{
          height: active ? '60%' : '0',
          background: '#0052FF',
        }}
      />
      <span className="flex items-center gap-2.5 min-w-0">
        <Icon
          className="w-4 h-4 shrink-0"
          style={{ color: active ? '#0052FF' : 'var(--text-muted)' }}
        />
        <span className="truncate text-[13px] font-medium">{label}</span>
      </span>
      {badge && (
        <span
          className="text-[9.5px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded"
          style={{
            background: 'var(--brand-dim)',
            color: '#0052FF',
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
