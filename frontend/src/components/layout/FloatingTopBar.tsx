'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, LogOut, Settings, ChevronDown } from 'lucide-react';

export function FloatingTopBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-4 lg:left-72 z-40 flex items-center gap-3"
    >
      {/* Home Button */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/"
          className="p-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all duration-200"
          title="Back to home"
        >
          <Home className="w-5 h-5" />
        </Link>
      </motion.div>

      {/* Profile Section */}
      <div ref={profileRef} className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all duration-200"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="profile" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-light text-white">
              {(user?.displayName || user?.username || 'U')[0]?.toUpperCase()}
            </div>
          )}

          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-light text-white">
              {user?.displayName || user?.username || 'User'}
            </span>
          </div>

          <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </motion.div>
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-56 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-sm font-light text-white">
                  {user?.displayName || user?.username}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{user?.email}</p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-light text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>

                <Link
                  href="/profile?tab=security"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-light text-zinc-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* Logout */}
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-light text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
