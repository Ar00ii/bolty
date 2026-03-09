'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { clsx } from 'clsx';

const NAV_LINKS = [
  { href: '/', label: 'home' },
  { href: '/chart', label: 'chart' },
  { href: '/chat', label: 'chat' },
  { href: '/ai', label: 'AI' },
  { href: '/repos', label: 'repos' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-terminal-bg/95 backdrop-blur-sm border-b border-terminal-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-neon-400 font-mono font-bold text-xl group-hover:text-neon-300 transition-colors">
              [BOLTY]
            </span>
            <span className="text-terminal-muted text-xs hidden sm:block">v1.0.0</span>
            <span className="status-online ml-1" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'px-3 py-1.5 rounded text-sm font-mono transition-all duration-200',
                  pathname === link.href
                    ? 'text-neon-400 bg-neon-400/10 border border-neon-400/30'
                    : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-card',
                )}
              >
                {pathname === link.href ? `[${link.label}]` : link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-terminal-muted text-xs hidden sm:block">
                  <span className="text-neon-400">@</span>
                  {user?.username || user?.githubLogin || 'user'}
                </span>
                <button
                  onClick={logout}
                  className="btn-neon text-xs py-1.5 px-3"
                >
                  logout
                </button>
              </>
            ) : (
              <Link href="/auth" className="btn-neon-solid text-xs py-1.5 px-4 rounded">
                connect
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden text-terminal-muted hover:text-neon-400 transition-colors p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-terminal-border py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'block px-4 py-2 text-sm font-mono transition-colors',
                  pathname === link.href
                    ? 'text-neon-400'
                    : 'text-terminal-muted hover:text-terminal-text',
                )}
              >
                {`> ${link.label}`}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
