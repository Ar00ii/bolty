'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Bot, GitBranch, ShoppingBag, MessageSquare,
  Users, Briefcase, BookOpen, User, Key, Settings, LogOut,
  Trophy, Mail, Wallet, UserPlus, Globe, TrendingUp,
} from 'lucide-react';
import { BoltyLogoSVG } from '@/components/ui/BoltyLogo';
import type { User as UserType } from '@/lib/auth/AuthProvider';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user?: UserType | null;
  logout: () => void;
  unreadDMs?: number;
}

interface NavSection {
  title: string;
  items: { href: string; label: string; icon: React.ElementType; badge?: number }[];
}

export function Sidebar({ open, onClose, isAuthenticated, user, logout, unreadDMs = 0 }: SidebarProps) {
  const pathname = usePathname();
  const displayLabel = user?.displayName || user?.username || user?.githubLogin || 'user';

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { href: '/market', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/market/agents', label: 'AI Agents', icon: Bot },
        { href: '/market/repos', label: 'Repositories', icon: GitBranch },
        { href: '/services', label: 'Services', icon: Briefcase },
      ],
    },
    {
      title: 'Community',
      items: [
        { href: '/chat', label: 'Global Chat', icon: Globe },
        { href: '/dm', label: 'Messages', icon: Mail, badge: unreadDMs || undefined },
        { href: '/reputation/leaderboard', label: 'Leaderboard', icon: Trophy },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/orders', label: 'Orders', icon: ShoppingBag },
        { href: '/api-keys', label: 'API Keys', icon: Key },
        { href: '/profile', label: 'Profile', icon: User },
        { href: '/profile?tab=security', label: 'Settings', icon: Settings },
      ],
    },
    {
      title: 'Resources',
      items: [
        { href: '/docs/agent-protocol', label: 'Documentation', icon: BookOpen },
        { href: '/how-it-works', label: 'How It Works', icon: TrendingUp },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 w-[var(--sidebar-width)] border-r flex flex-col transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{
        background: 'var(--bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
          <BoltyLogoSVG size={28} className="transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(131,110,249,0.4)]" />
          <span className="text-[15px] font-light tracking-tight" style={{
            background: 'linear-gradient(135deg, #e0d4ff 0%, #836EF9 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>BoltyNetwork</span>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/market' && pathname.startsWith(item.href.split('?')[0]) && item.href.split('?')[0].length > 1);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all group ${
                      isActive
                        ? 'bg-monad-500/10 text-monad-400 border border-monad-500/15'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-monad-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} strokeWidth={1.75} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-monad-500 text-white text-[10px] font-light px-1">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t px-3 py-3" style={{ borderColor: 'var(--border)' }}>
        {isAuthenticated ? (
          <div className="space-y-2">
            <Link href="/profile" onClick={onClose} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-zinc-700" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-monad-500/20 border border-monad-500/30 flex items-center justify-center text-monad-400 text-[11px] font-light">
                  {displayLabel[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{displayLabel}</p>
                <p className="text-[11px] text-zinc-500 truncate">{user?.email || 'View profile'}</p>
              </div>
            </Link>
            <button
              onClick={() => { logout(); onClose(); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[13px] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-all"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Link href="/auth" onClick={onClose} className="btn-primary w-full text-center text-sm py-2">
              Sign in
            </Link>
            <Link href="/auth?tab=register" onClick={onClose} className="flex items-center justify-center gap-1.5 w-full text-sm text-zinc-400 hover:text-zinc-200 py-2 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-all">
              <UserPlus className="w-3.5 h-3.5" />
              Create account
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
