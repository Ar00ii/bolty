'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, LogOut, Settings, ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useState, useRef, useEffect } from 'react';

import { NotificationsBell } from '@/components/layout/NotificationsBell';
import { useAuth } from '@/lib/auth/AuthProvider';

export function FloatingTopBar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modKey, setModKey] = useState('Ctrl');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
      setModKey('⌘');
    }
  }, []);

  const openPalette = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true }),
    );
  };

  const isHome = pathname === '/';
  const isAuth = pathname.startsWith('/auth');
  const shouldShow = isAuthenticated && !isHome && !isAuth;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  if (!shouldShow) return null;

  const chipStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(24,24,30,0.85) 0%, rgba(12,12,16,0.85) 100%)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow:
      '0 8px 24px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  const chipClass =
    'inline-flex items-center justify-center rounded-xl text-zinc-300 hover:text-white transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-4 lg:left-72 z-40 flex items-center gap-2"
    >
      {/* Home Button */}
      <Link href="/" className={`${chipClass} w-10 h-10`} style={chipStyle} title="Back to home">
        <Home className="w-4 h-4" strokeWidth={1.75} />
      </Link>

      {/* Command Palette Trigger */}
      <button
        onClick={openPalette}
        title={`Open command palette (${modKey}K)`}
        className={`${chipClass} hidden md:inline-flex h-10 pl-3 pr-2 gap-2`}
        style={chipStyle}
      >
        <Search className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
        <span className="text-[12px] font-normal text-zinc-400">Search</span>
        <kbd
          className="text-[10px] font-medium text-zinc-500 rounded-md px-1.5 py-0.5 leading-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {modKey}K
        </kbd>
      </button>

      {/* Notifications */}
      <div className="rounded-xl flex items-center justify-center w-10 h-10" style={chipStyle}>
        <NotificationsBell isAuthenticated={isAuthenticated} />
      </div>

      {/* Profile Section */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className={`${chipClass} h-10 pl-1.5 pr-2.5 gap-2`}
          style={chipStyle}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="profile"
              className="w-7 h-7 rounded-lg object-cover"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #836EF9 0%, #EC4899 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {(user?.displayName || user?.username || 'U')[0]?.toUpperCase()}
            </div>
          )}

          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-[12px] font-normal text-white">
              {user?.displayName || user?.username || 'User'}
            </span>
          </div>

          <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
          </motion.div>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-full left-0 mt-2 w-64 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'linear-gradient(180deg, #131317 0%, #0c0c10 100%)',
                boxShadow:
                  '0 24px 60px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.5) 50%, transparent 100%)',
                }}
              />
              {/* User Info */}
              <div className="px-4 py-3.5 border-b border-white/[0.06]">
                <p className="text-[13px] font-medium text-white truncate">
                  {user?.displayName || user?.username}
                </p>
                {user?.email && (
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{user.email}</p>
                )}
              </div>

              {/* Menu Items */}
              <div className="py-1.5">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[13px] text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
                  My Profile
                </Link>

                <Link
                  href="/profile?tab=notifications"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-[13px] text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
                  Settings
                </Link>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.06]" />

              {/* Logout */}
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
