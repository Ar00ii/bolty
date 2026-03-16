'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeContext';
import { X, Menu, UserPlus } from 'lucide-react';
import { BoltyLogo } from '@/components/ui/BoltyLogo';
import { StaggeredMenu } from './StaggeredMenu';

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
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
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
        if (resp.ok) { const data = await resp.json(); setCount(data.count ?? 0); }
      } catch { /* ignore */ }
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const unreadDMs = useUnreadDMs(isAuthenticated);

  const displayLabel = user?.displayName || user?.username || user?.githubLogin || 'user';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-black/92 backdrop-blur-md border-b border-white/[0.06]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Menu toggle + Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-200 ${
                  menuOpen
                    ? 'border-monad-400/60 bg-monad-500/15 text-monad-400'
                    : 'border-zinc-700 bg-white/5 text-zinc-300 hover:border-monad-400/50 hover:bg-monad-500/10 hover:text-monad-400'
                }`}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                aria-controls="bolty-nav-panel"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                <div className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-300"
                    style={{ background: 'radial-gradient(circle, rgba(131,110,249,0.5) 0%, transparent 70%)' }} />
                  <BoltyLogo size={28} color="#836EF9" className="relative z-10" />
                </div>
                <span className="text-white font-bold text-base tracking-tight group-hover:text-monad-300 transition-colors">Bolty</span>
                <span className="hidden sm:block text-xs text-zinc-600 font-mono">—</span>
                <span className="hidden sm:block text-xs text-zinc-500 font-mono">AI Developer Platform</span>
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
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
                      <img src={user.avatarUrl} alt={displayLabel} className="w-6 h-6 rounded-full border border-zinc-700 group-hover:border-monad-400/50 transition-colors" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-monad-500/20 border border-monad-500/30 flex items-center justify-center text-monad-400 text-xs font-bold">
                        {displayLabel[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-zinc-400 text-sm hidden sm:block group-hover:text-zinc-200 transition-colors">{displayLabel}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth?tab=register"
                    className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Register
                  </Link>
                  <Link href="/auth" className="flex items-center gap-1.5 btn-primary text-sm px-3 py-2 rounded-lg">
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* StaggeredMenu panel */}
      <StaggeredMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={logout}
        unreadDMs={unreadDMs}
      />
    </>
  );
}
