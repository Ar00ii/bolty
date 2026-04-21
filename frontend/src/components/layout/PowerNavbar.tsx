'use client';

import { Bell, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useRef, useState, useEffect } from 'react';

import { MarketTicker } from '@/components/layout/MarketTicker';
import { NAV, isItemActive } from '@/components/layout/StandardSidebar';
import { getReputationRank } from '@/components/ui/reputation-badge';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useNotificationsPoll } from '@/lib/hooks/useNotifications';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function humanizeSegment(seg: string): string {
  // Don't try to humanize IDs (uuid-ish) — keep them as-is but shortened
  if (seg.length > 20 && /^[a-z0-9-]+$/i.test(seg)) return `${seg.slice(0, 6)}…${seg.slice(-4)}`;
  if (/^[0-9a-f]{24,}$/i.test(seg)) return `${seg.slice(0, 6)}…${seg.slice(-4)}`;
  return seg
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: 'Overview', href: '/' }];
  const crumbs: Crumb[] = [];
  let acc = '';
  for (const p of parts) {
    acc += '/' + p;
    crumbs.push({ label: humanizeSegment(p), href: acc });
  }
  return crumbs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main navbar
// ─────────────────────────────────────────────────────────────────────────────

export function PowerNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { count: unreadCount } = useNotificationsPoll(isAuthenticated);

  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Mobile/tablet drawer — sidebar is hidden below lg, so this is the only
  // way to reach the main nav on smaller viewports.
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);

  // Close drawer whenever the route changes so tapping a link feels right.
  useEffect(() => {
    setNavDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (navDrawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [navDrawerOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    function onDocClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [profileOpen]);

  const initials =
    (user?.displayName || user?.username || 'U')
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const userRank = user ? getReputationRank(user.reputationPoints ?? 0) : null;

  return (
    <div className="sticky top-0 z-30">
      <header
        className="flex items-center gap-3 px-[18px]"
        style={{
          height: '56px',
          borderBottom: '1px solid #1f1f23',
          background: 'rgba(9,9,11,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Mobile/tablet hamburger — sidebar is hidden below lg */}
        <button
          type="button"
          onClick={() => setNavDrawerOpen(true)}
          className="lg:hidden grid place-items-center rounded-lg transition-colors shrink-0"
          style={{
            width: '34px',
            height: '34px',
            color: '#a1a1aa',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid #1f1f23',
          }}
          aria-label="Open menu"
          aria-expanded={navDrawerOpen}
        >
          <Menu className="w-[16px] h-[16px]" strokeWidth={1.75} />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[13px] min-w-0 shrink">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={c.href + i}>
                {i > 0 && (
                  <span className="font-mono shrink-0" style={{ color: '#52525b' }}>
                    /
                  </span>
                )}
                <Link
                  href={c.href}
                  className="transition-colors truncate"
                  style={{
                    color: isLast ? '#e4e4e7' : '#71717a',
                    fontWeight: isLast ? 400 : 300,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#e4e4e7')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = isLast ? '#e4e4e7' : '#71717a')
                  }
                >
                  {c.label}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Command search */}
        <button
          type="button"
          className="hidden md:flex items-center gap-[10px] rounded-lg transition-colors"
          style={{
            width: '360px',
            maxWidth: '36vw',
            padding: '7px 10px',
            background: '#0c0c0f',
            border: '1px solid #1f1f23',
            color: '#52525b',
            fontSize: '12.5px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#2a2a30';
            e.currentTarget.style.color = '#71717a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1f1f23';
            e.currentTarget.style.color = '#52525b';
          }}
        >
          <Search className="w-[13px] h-[13px] shrink-0" strokeWidth={2} />
          <span className="flex-1 text-left truncate">Search agents, repos, addresses, tx…</span>
          <span className="flex gap-[3px] shrink-0">
            <kbd
              className="font-mono rounded"
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                background: '#18181b',
                border: '1px solid #2a2a30',
                color: '#71717a',
              }}
            >
              ⌘
            </kbd>
            <kbd
              className="font-mono rounded"
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                background: '#18181b',
                border: '1px solid #2a2a30',
                color: '#71717a',
              }}
            >
              K
            </kbd>
          </span>
        </button>

        {/* Notification bell (signed-in only) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => router.push('/notifications')}
            className="relative grid place-items-center rounded-lg transition-colors"
            style={{ width: '32px', height: '32px', color: '#71717a' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#e4e4e7';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#71717a';
              e.currentTarget.style.background = 'transparent';
            }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-[15px] h-[15px]" strokeWidth={1.6} />
            {isAuthenticated && unreadCount > 0 && (
              <span
                className="absolute inline-flex items-center justify-center"
                style={{
                  top: '2px',
                  right: '2px',
                  minWidth: '15px',
                  height: '15px',
                  padding: '0 4px',
                  borderRadius: '999px',
                  background: '#836EF9',
                  color: 'white',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  lineHeight: 1,
                  border: '1.5px solid #09090b',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Signed-out: show Sign in CTA instead of avatar */}
        {!isAuthenticated && (
          <Link
            href="/auth"
            className="text-[13px] transition-colors px-3 py-1.5 rounded-md"
            style={{
              color: '#e4e4e7',
              background: 'rgba(131,110,249,0.15)',
              border: '1px solid rgba(131,110,249,0.3)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(131,110,249,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(131,110,249,0.15)')}
          >
            Sign in
          </Link>
        )}

        {/* Avatar (signed-in only) */}
        {isAuthenticated && (
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="relative flex items-center gap-2 rounded-full transition-colors"
              style={{ padding: '3px' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Account menu"
            >
              {user?.avatarUrl ? (
                <span
                  className="grid place-items-center rounded-full overflow-hidden"
                  style={{
                    width: '28px',
                    height: '28px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                </span>
              ) : (
                <span
                  className="grid place-items-center rounded-full font-mono text-white"
                  style={{
                    width: '28px',
                    height: '28px',
                    background: 'linear-gradient(135deg, #ec4899, #836EF9)',
                    fontSize: '10.5px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {initials}
                </span>
              )}
              {userRank ? (
                <span
                  className="absolute grid place-items-center rounded-full"
                  style={{
                    bottom: '-3px',
                    right: '-3px',
                    width: '14px',
                    height: '14px',
                    background: '#09090b',
                    border: `1.5px solid ${userRank.color}`,
                    boxShadow: `0 0 6px -1px ${userRank.color}80`,
                  }}
                  title={`${userRank.label} · ${user?.reputationPoints ?? 0} rays`}
                >
                  <userRank.icon
                    style={{ color: userRank.color, width: 8, height: 8 }}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </span>
              ) : (
                <span
                  className="absolute rounded-full"
                  style={{
                    bottom: '2px',
                    right: '2px',
                    width: '9px',
                    height: '9px',
                    background: '#22c55e',
                    border: '2px solid #09090b',
                  }}
                />
              )}
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50 flex flex-col"
                style={{
                  top: 'calc(100% + 6px)',
                  minWidth: '260px',
                  maxHeight: 'calc(100vh - 80px)',
                  background: '#121214',
                  border: '1px solid #2a2a30',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                }}
              >
                <div
                  className="px-3.5 py-3 flex items-start gap-3 shrink-0"
                  style={{
                    borderBottom: '1px solid #1f1f23',
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.08) 0%, rgba(131,110,249,0) 100%)',
                  }}
                >
                  {user?.avatarUrl ? (
                    <span
                      className="grid place-items-center rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        width: '40px',
                        height: '40px',
                        border: userRank
                          ? `1.5px solid ${userRank.color}`
                          : '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    </span>
                  ) : (
                    <span
                      className="grid place-items-center rounded-full font-mono text-white flex-shrink-0"
                      style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #ec4899, #836EF9)',
                        fontSize: '13px',
                        border: userRank
                          ? `1.5px solid ${userRank.color}`
                          : '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {initials}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] leading-tight truncate"
                      style={{ color: '#e4e4e7', fontWeight: 400 }}
                    >
                      {user?.displayName || user?.username || 'Account'}
                    </p>
                    {user?.username && (
                      <p
                        className="text-[11px] leading-tight truncate mt-0.5"
                        style={{ color: '#71717a' }}
                      >
                        @{user.username}
                      </p>
                    )}
                    {userRank && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-[1.5px] rounded font-mono uppercase"
                          style={{
                            background: `${userRank.color}14`,
                            color: userRank.color,
                            border: `1px solid ${userRank.color}38`,
                            fontSize: 9,
                            letterSpacing: '0.1em',
                          }}
                        >
                          <userRank.icon
                            style={{ color: userRank.color, width: 9, height: 9 }}
                            strokeWidth={2.5}
                          />
                          {userRank.label}
                        </span>
                        <span className="font-mono" style={{ color: '#a1a1aa', fontSize: 10.5 }}>
                          {(user?.reputationPoints ?? 0).toLocaleString()} rays
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="py-1 overflow-y-auto flex-1 min-h-0">
                  <DropdownLink
                    href="/profile"
                    label="Profile"
                    onSelect={() => setProfileOpen(false)}
                  />
                  <DropdownLink
                    href="/orders"
                    label="Orders"
                    onSelect={() => setProfileOpen(false)}
                  />
                  <DropdownLink
                    href="/api-keys"
                    label="API Keys"
                    onSelect={() => setProfileOpen(false)}
                  />
                  <DropdownLink
                    href="/reputation/leaderboard"
                    label="Leaderboard"
                    onSelect={() => setProfileOpen(false)}
                  />
                  <DropdownLink
                    href="/profile?tab=security"
                    label="Settings"
                    onSelect={() => setProfileOpen(false)}
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false);
                    await logout?.();
                    router.push('/');
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-[12.5px] transition-colors shrink-0"
                  style={{ color: '#ef4444', borderTop: '1px solid #1f1f23' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <MarketTicker />

      {/* Mobile/tablet navigation drawer */}
      {navDrawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setNavDrawerOpen(false)}
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
          />
          <aside
            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col"
            style={{
              width: '86%',
              maxWidth: '320px',
              height: '100dvh',
              background: '#0c0c0f',
              borderRight: '1px solid #1f1f23',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            }}
          >
            <div
              className="flex items-center justify-between px-4 h-[56px] shrink-0"
              style={{ borderBottom: '1px solid #1f1f23' }}
            >
              <Link
                href="/"
                onClick={() => setNavDrawerOpen(false)}
                className="flex items-center gap-2.5 min-w-0"
              >
                <div className="w-8 h-8 grid place-items-center rounded-lg overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/LogoNew.png" alt="Bolty" className="w-full h-full object-contain" />
                </div>
                <span
                  className="text-[15px] font-semibold truncate"
                  style={{
                    background: 'linear-gradient(90deg,#ffffff 0%,#e8e2ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  BoltyNetwork
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setNavDrawerOpen(false)}
                aria-label="Close menu"
                className="grid place-items-center rounded-lg transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                  color: '#a1a1aa',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #1f1f23',
                }}
              >
                <X className="w-[15px] h-[15px]" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3">
              {NAV.map((sect) => (
                <div key={sect.section} className="mt-4 first:mt-0">
                  <div
                    className="font-mono text-[10px] uppercase px-3 pb-1.5"
                    style={{ color: '#52525b', letterSpacing: '0.12em' }}
                  >
                    {sect.section}
                  </div>
                  {sect.items.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(
                      pathname,
                      searchParams ?? new URLSearchParams(),
                      item.href,
                    );
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setNavDrawerOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors"
                        style={{
                          color: active ? '#e4e4e7' : '#a1a1aa',
                          background: active ? 'rgba(131,110,249,0.10)' : 'transparent',
                          fontSize: '14px',
                          fontWeight: 300,
                        }}
                      >
                        <Icon
                          className="w-[15px] h-[15px] shrink-0"
                          style={{ color: active ? '#a594ff' : '#71717a' }}
                          strokeWidth={1.75}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {!isAuthenticated && (
              <div className="p-3" style={{ borderTop: '1px solid #1f1f23' }}>
                <Link
                  href="/auth"
                  onClick={() => setNavDrawerOpen(false)}
                  className="block text-center rounded-md py-2.5 text-[13px] transition-colors"
                  style={{
                    background: 'rgba(131,110,249,0.15)',
                    border: '1px solid rgba(131,110,249,0.3)',
                    color: '#e4e4e7',
                  }}
                >
                  Sign in
                </Link>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function DropdownLink({
  href,
  label,
  onSelect,
}: {
  href: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="block px-3 py-2 text-[13px] transition-colors"
      style={{ color: '#a1a1aa' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.color = '#e4e4e7';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#a1a1aa';
      }}
    >
      {label}
    </Link>
  );
}
