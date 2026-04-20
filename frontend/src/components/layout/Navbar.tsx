'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Key,
  ShoppingBag,
  Menu,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeContext';

import { NotificationsBell } from './NotificationsBell';

interface NavbarProps {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  sidebarCollapsed?: boolean;
}

const NAV_LINKS = [
  { href: '/market', label: 'Marketplace' },
  { href: '/market/agents', label: 'Agents' },
  { href: '/market/repos', label: 'Repos' },
  { href: '/chat/agents', label: 'Agent Chat' },
  { href: '/docs/agent-protocol', label: 'Docs' },
];

export function Navbar({ menuOpen, setMenuOpen, sidebarCollapsed }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const displayLabel = user?.displayName || user?.username || user?.githubLogin || 'user';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileOpen(false);
  }, [pathname]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-200 lg:left-[var(--sidebar-width)]"
      style={{
        background: 'var(--bg)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      }}
    >
      <div className="h-14 px-4 lg:px-6 flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Nav links - desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || (link.href !== '/market' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-[13px] font-light transition-all ${
                  isActive
                    ? 'text-white bg-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search agents, repos..."
                  className="w-64 pl-8 pr-3 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none focus:border-bolty-400/50 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchOpen(false);
                      setSearchQuery('');
                    } else if (e.key === 'Enter') {
                      const q = searchQuery.trim();
                      if (q) {
                        router.push(`/market?search=${encodeURIComponent(q)}`);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }
                    }
                  }}
                />
              </div>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 text-xs transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] font-mono text-zinc-500 border border-zinc-700">
                /
              </kbd>
            </button>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {isAuthenticated ? (
          <>
            <NotificationsBell isAuthenticated={isAuthenticated} />

            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayLabel}
                    className="w-7 h-7 rounded-full border border-zinc-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-bolty-500/20 border border-bolty-500/30 flex items-center justify-center text-bolty-400 text-xs font-light">
                    {displayLabel[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-zinc-300 hidden sm:block max-w-[100px] truncate">
                  {displayLabel}
                </span>
                <motion.span
                  animate={{ rotate: profileOpen ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className="inline-flex"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </motion.span>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-700/80 overflow-hidden shadow-xl z-50 origin-top-right"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <div className="p-3 border-b border-zinc-700/50">
                      <p className="text-sm font-light text-white truncate">{displayLabel}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {user?.email || user?.githubLogin || ''}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" /> Orders
                      </Link>
                      <Link
                        href="/api-keys"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Key className="w-4 h-4" /> API Keys
                      </Link>
                      <Link
                        href="/profile?tab=notifications"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                    </div>
                    <div className="py-1 border-t border-zinc-700/50">
                      <button
                        onClick={logout}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-all w-full text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth"
              className="text-sm text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign in
            </Link>
            <Link href="/auth?tab=register" className="btn-primary text-sm px-3.5 py-1.5">
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
