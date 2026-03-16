'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Menu } from 'lucide-react';
import { BoltyLogo } from '@/components/ui/BoltyLogo';

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

const MotionLink = motion.create(Link);

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadDMs = useUnreadDMs(isAuthenticated);

  const displayLabel = user?.displayName || user?.username || user?.githubLogin || 'user';

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Menu toggle + Logo */}
            <div className="flex items-center gap-4">
              {/* Menu toggle button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200 ${menuOpen ? 'border-monad-400/60 bg-monad-500/15 text-monad-400' : 'border-zinc-700 bg-white/5 text-zinc-300 hover:border-monad-400/50 hover:bg-monad-500/10 hover:text-monad-400'}`}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                <div className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-300"
                    style={{ background: 'radial-gradient(circle, rgba(131,110,249,0.5) 0%, transparent 70%)' }} />
                  <BoltyLogo size={28} color="#836EF9" className="relative z-10" />
                </div>
                <span className="text-white font-bold text-base tracking-tight group-hover:text-monad-300 transition-colors">
                  Bolty
                </span>
                <span className="hidden sm:block text-xs text-zinc-600 font-mono">—</span>
                <span className="hidden sm:block text-xs text-zinc-500 font-mono">AI Developer Platform</span>
              </Link>
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
            </div>
          </div>
        </div>
      </nav>

      {/* Full-screen menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu panel — slides in from top-left */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-16 left-0 z-50 pt-10 pb-12 px-6 min-h-[calc(100vh-4rem)] w-72"
              style={{ background: 'rgba(4,4,8,0.97)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Close */}
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <p className="text-[10px] font-mono text-zinc-700 tracking-widest uppercase mb-8">Navigation</p>

              <div className="flex flex-col gap-3">
                {NAV_LINKS.map((link, index) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  const hasBadge = link.badge && isAuthenticated && unreadDMs > 0;
                  return (
                    <motion.div
                      key={link.href}
                      initial="initial"
                      whileHover="hover"
                      className="flex items-center gap-2 group/nav"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <motion.div
                        variants={{
                          initial: { x: '-100%', opacity: 0 },
                          hover: { x: 0, opacity: 1 },
                        }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        style={{ color: '#836ef9' }}
                      >
                        <ArrowRight strokeWidth={3} className="w-6 h-6" />
                      </motion.div>
                      <MotionLink
                        href={link.href}
                        variants={{
                          initial: { x: -24 },
                          hover: { x: 0, color: '#836ef9' },
                        }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative text-3xl font-bold no-underline"
                        style={{ color: isActive ? '#836ef9' : '#71717a' }}
                      >
                        {link.label}
                        {hasBadge && (
                          <span className="absolute -top-1 -right-5 min-w-[16px] h-4 px-1 bg-monad-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                            {unreadDMs > 99 ? '99+' : unreadDMs}
                          </span>
                        )}
                      </MotionLink>
                    </motion.div>
                  );
                })}
              </div>

              {isAuthenticated && (
                <div className="mt-12 pt-6 border-t border-zinc-800/60 space-y-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
                  >
                    {user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full border border-zinc-700" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-monad-500/20 border border-monad-500/30 flex items-center justify-center text-monad-400 text-xs font-bold">
                        {displayLabel[0]?.toUpperCase()}
                      </div>
                    )}
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="flex items-center px-2 py-2 rounded-lg text-sm text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all w-full text-left"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
