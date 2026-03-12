'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeContext';
import { clsx } from 'clsx';

const NAV_LINKS = [
  { href: '/chat',   label: 'Community' },
  { href: '/dm',     label: 'Messages', badge: true },
  { href: '/repos',  label: 'Repos' },
  { href: '/market', label: 'Agents' },
];

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function useUnreadDMs(isAuthenticated: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    const fetchCount = async () => {
      try {
        const resp = await fetch(`${API_URL}/dm/unread-count`, { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setCount(data.count ?? 0);
        }
      } catch {
        // ignore
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return count;
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadDMs = useUnreadDMs(isAuthenticated);

  const displayLabel = user?.displayName || user?.username || user?.githubLogin || 'user';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        background: 'rgba(var(--bg-rgb, 9,9,11), 0.85)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-monad-500/15 border border-monad-500/25 flex items-center justify-center transition-all group-hover:bg-monad-500/25">
              <svg className="w-4 h-4 text-monad-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-white font-bold text-base tracking-tight group-hover:text-monad-300 transition-colors">
              Bolty
            </span>
            <span className="hidden sm:flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md bg-monad-500/10 text-monad-400 font-medium">
              alpha
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const hasBadge = link.badge && isAuthenticated && unreadDMs > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'text-white bg-white/8 border border-white/10'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5',
                  )}
                >
                  {link.label}
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-monad-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadDMs > 99 ? '99+' : unreadDMs}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all duration-150"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {isAuthenticated ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={displayLabel}
                      className="w-6 h-6 rounded-full border border-zinc-700 group-hover:border-monad-400/50 transition-colors"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-monad-500/20 border border-monad-500/30 flex items-center justify-center text-monad-400 text-xs font-bold">
                      {displayLabel[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-zinc-400 text-sm hidden sm:block group-hover:text-zinc-200 transition-colors">
                    {displayLabel}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-all"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="btn-primary text-sm px-4 py-2 rounded-lg"
              >
                Get started
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Open menu"
            >
              <span className={clsx('block w-4 h-0.5 bg-current transition-all', mobileOpen && 'rotate-45 translate-y-2')} />
              <span className={clsx('block w-4 h-0.5 bg-current transition-all', mobileOpen && 'opacity-0')} />
              <span className={clsx('block w-4 h-0.5 bg-current transition-all', mobileOpen && '-rotate-45 -translate-y-2')} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            {NAV_LINKS.map((link) => {
              const hasBadge = link.badge && isAuthenticated && unreadDMs > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'relative flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5',
                    pathname === link.href
                      ? 'text-white bg-white/8'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5',
                  )}
                >
                  {link.label}
                  {hasBadge && (
                    <span className="ml-2 min-w-[18px] h-[18px] px-1 bg-monad-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadDMs > 99 ? '99+' : unreadDMs}
                    </span>
                  )}
                </Link>
              );
            })}
            {isAuthenticated && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors mb-0.5"
                >
                  Profile
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors w-full text-left"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
