'use client';

import { Bell, Copy, Github, LogOut, Menu, Search, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';

import { MarketTicker } from '@/components/layout/MarketTicker';
import { NAV, isItemActive } from '@/components/layout/StandardSidebar';
import { getReputationRank } from '@/components/ui/reputation-badge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { API_URL, api } from '@/lib/api/client';
import { type User, useAuth } from '@/lib/auth/AuthProvider';
import { useNotificationsPoll } from '@/lib/hooks/useNotifications';
import { getMetaMaskProvider } from '@/lib/wallet/ethereum';

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
  const { user, logout, isAuthenticated, refresh } = useAuth();
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

  const userRank = user ? getReputationRank(user.reputationPoints ?? 0) : null;

  return (
    <div className="sticky top-0 z-50">
      <header
        className="flex items-center gap-3 px-[18px]"
        style={{
          position: 'relative',
          zIndex: 2,
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

        {/* Command search — click or ⌘K to open the palette */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('bolty:open-command'))}
          className="hidden md:flex items-center gap-[10px] rounded-lg transition-colors cursor-text"
          style={{
            width: '360px',
            maxWidth: '36vw',
            padding: '8px 12px',
            background: '#0f0f15',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#a1a1aa',
            fontSize: '13px',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <Search className="w-[14px] h-[14px] shrink-0" strokeWidth={2} />
          <span className="flex-1 text-left truncate">Search agents, repos, wallets…</span>
          <span className="flex gap-[3px] shrink-0">
            <kbd
              className="font-mono rounded"
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                background: '#18181b',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#a1a1aa',
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
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#a1a1aa',
              }}
            >
              K
            </kbd>
          </span>
        </button>

        {/* Wallet + GitHub quick-connect chips */}
        {isAuthenticated && <NavConnectChips user={user} refresh={refresh} />}

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
          <div ref={profileRef} className="relative" style={{ overflow: 'visible' }}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="relative flex items-center gap-2 rounded-full transition-colors"
              style={{ padding: '5px', overflow: 'visible' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Account menu"
            >
              <UserAvatar
                src={user?.avatarUrl}
                name={user?.displayName || user?.username}
                userId={user?.id}
                size={28}
              />
              {userRank ? (
                <span
                  className="absolute grid place-items-center rounded-full"
                  style={{
                    bottom: 0,
                    right: 0,
                    width: '14px',
                    height: '14px',
                    background: '#09090b',
                    border: `1.5px solid ${userRank.color}`,
                    boxShadow: `0 0 0 1.5px #09090b, 0 0 8px -1px ${userRank.color}88`,
                    zIndex: 1,
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
                    bottom: '4px',
                    right: '4px',
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
                  // Cap width to the viewport so the menu can never
                  // overflow the right edge on narrow desktop breakpoints.
                  maxWidth: 'calc(100vw - 16px)',
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
                  <div
                    className="flex-shrink-0 rounded-full"
                    style={{
                      padding: '1px',
                      background: userRank ? userRank.color : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <UserAvatar
                      src={user?.avatarUrl}
                      name={user?.displayName || user?.username}
                      userId={user?.id}
                      size={40}
                    />
                  </div>
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
            className="lg:hidden fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}
          />
          <aside
            className="lg:hidden fixed top-0 left-0 bottom-0 z-[61] flex flex-col"
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
                <span className="text-[15px] font-light text-white truncate">
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
// Wallet + GitHub quick-connect chips shown in the navbar
// ─────────────────────────────────────────────────────────────────────────────

function NavConnectChips({
  user,
  refresh,
}: {
  user: User | null;
  refresh: () => Promise<void>;
}) {
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletErr, setWalletErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  const walletAddress = user?.walletAddress ?? null;
  const githubLogin = user?.githubLogin ?? null;
  const githubAvatar = user?.avatarUrl ?? null;

  // Close wallet menu on outside click
  useEffect(() => {
    if (!walletMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(e.target as Node)) {
        setWalletMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [walletMenuOpen]);

  const handleLinkWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletErr('');
    try {
      const eth = getMetaMaskProvider();
      if (!eth) {
        setWalletErr('MetaMask not detected');
        return;
      }
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts[0];
      if (!address) return;
      const { nonce, message } = await api.post<{ nonce: string; message: string }>(
        '/auth/link/wallet/nonce',
        { address },
      );
      const signature = (await eth.request({
        method: 'personal_sign',
        params: [message, address],
      })) as string;
      await api.post('/auth/link/wallet', { address, signature, nonce });
      await refresh();
    } catch (err) {
      setWalletErr(err instanceof Error ? err.message : 'Connection failed');
      setTimeout(() => setWalletErr(''), 4000);
    } finally {
      setWalletLoading(false);
    }
  }, [refresh]);

  const handleLinkGitHub = useCallback(() => {
    window.location.href = `${API_URL}/auth/github`;
  }, []);

  const handleCopyAddress = useCallback(() => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [walletAddress]);

  const handleDisconnectWallet = useCallback(async () => {
    if (!walletAddress || disconnecting) return;
    setDisconnecting(true);
    setWalletErr('');
    // Fire the disconnect and refresh, but swallow any noise that comes
    // after — the unlink itself persists on the backend even when
    // follow-up calls hiccup, and surfacing a 500 here confused users
    // ('disconnected fine but shows error'). Any real failure shows up
    // on the next page load when /auth/me is re-fetched.
    await api.delete('/auth/link/wallet').catch(() => void 0);
    await refresh().catch(() => void 0);
    setWalletMenuOpen(false);
    setDisconnecting(false);
  }, [walletAddress, disconnecting, refresh]);

  return (
    <div className="hidden lg:flex items-center gap-1.5">
      {/* ── Wallet chip ───────────────────────────────── */}
      {walletAddress ? (
        <div ref={walletMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setWalletMenuOpen((v) => !v)}
            title={walletAddress}
            className="flex items-center gap-1.5 rounded-lg transition-colors"
            style={{
              padding: '5px 9px',
              background: '#0c0c0f',
              border: '1px solid #1f1f23',
              fontSize: '11.5px',
              color: '#a1a1aa',
              fontFamily: 'monospace',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2a2a30';
              e.currentTarget.style.color = '#e4e4e7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1f1f23';
              e.currentTarget.style.color = '#a1a1aa';
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            {`${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`}
          </button>
          {walletMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 z-50 overflow-hidden"
              style={{
                minWidth: 220,
                background: '#0f0f15',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6)',
              }}
            >
              <div
                className="px-3 py-2 text-[11px] font-mono"
                style={{
                  color: '#a1a1aa',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}
              </div>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                {copied ? 'Copied!' : 'Copy address'}
              </button>
              <button
                type="button"
                onClick={handleDisconnectWallet}
                disabled={disconnecting}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] transition-colors disabled:opacity-50"
                style={{
                  color: '#fca5a5',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(244,63,94,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                {disconnecting ? 'Disconnecting…' : 'Disconnect wallet'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleLinkWallet}
          disabled={walletLoading}
          title={walletErr || 'Connect MetaMask wallet'}
          className="flex items-center gap-1.5 rounded-lg transition-colors"
          style={{
            padding: '5px 9px',
            background: 'rgba(131,110,249,0.07)',
            border: `1px solid ${walletErr ? 'rgba(239,68,68,0.4)' : 'rgba(131,110,249,0.22)'}`,
            fontSize: '11.5px',
            color: walletErr ? '#f87171' : '#a594ff',
            opacity: walletLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!walletErr)
              e.currentTarget.style.background = 'rgba(131,110,249,0.14)';
          }}
          onMouseLeave={(e) => {
            if (!walletErr)
              e.currentTarget.style.background = 'rgba(131,110,249,0.07)';
          }}
        >
          <Wallet className="w-[12px] h-[12px] shrink-0" strokeWidth={1.75} />
          {walletLoading ? 'Connecting…' : walletErr ? walletErr : 'Connect Wallet'}
        </button>
      )}

      {/* ── GitHub chip ───────────────────────────────── */}
      {githubLogin ? (
        <div
          className="flex items-center gap-1.5 rounded-lg"
          style={{
            padding: '5px 9px',
            background: '#0c0c0f',
            border: '1px solid #1f1f23',
            fontSize: '11.5px',
            color: '#a1a1aa',
          }}
        >
          {githubAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={githubAvatar}
              alt={githubLogin}
              style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }}
            />
          ) : (
            <Github className="w-[12px] h-[12px] shrink-0" strokeWidth={1.75} />
          )}
          <span>@{githubLogin}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleLinkGitHub}
          className="flex items-center gap-1.5 rounded-lg transition-colors"
          style={{
            padding: '5px 9px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid #1f1f23',
            fontSize: '11.5px',
            color: '#71717a',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#e4e4e7';
            e.currentTarget.style.borderColor = '#2a2a30';
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#71717a';
            e.currentTarget.style.borderColor = '#1f1f23';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          <Github className="w-[12px] h-[12px] shrink-0" strokeWidth={1.75} />
          Link GitHub
        </button>
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
