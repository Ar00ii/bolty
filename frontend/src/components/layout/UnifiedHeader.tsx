'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { BoltyLogoSVG } from '@/components/ui/BoltyLogo';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { Menu, X, ChevronDown } from 'lucide-react';

const NAV_LINKS = [
  { href: '/market', label: 'Marketplace' },
  { href: '/market/agents', label: 'Agents' },
  { href: '/market/repos', label: 'Repos' },
  { href: '/services', label: 'Services' },
  { href: '/docs/agent-protocol', label: 'Docs' },
];

export function UnifiedHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 border-b border-zinc-800 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BoltyLogoSVG size={24} />
          <span className="text-white font-light text-sm md:text-base hidden sm:inline">
            BoltyNetwork
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname.startsWith(link.href) ? 'text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: Auth/Profile */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {!isAuthenticated ? (
            <>
              <Link
                href="/auth"
                className="hidden sm:block text-sm text-gray-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <ShimmerButton
                as={Link}
                href="/auth?tab=register"
                className="text-white text-xs md:text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-all"
              >
                Get started
              </ShimmerButton>
            </>
          ) : (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1 hover:opacity-80 transition-opacity"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="profile" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-light">
                    {(user?.displayName || user?.username || 'u')[0]?.toUpperCase()}
                  </div>
                )}
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-zinc-700">
                    <p className="text-sm font-light text-white">
                      {user?.displayName || user?.username}
                    </p>
                    <p className="text-xs text-zinc-400">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/api-keys"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50"
                  >
                    API Keys
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800/50 border-t border-zinc-700"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black/60">
          <div className="px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
