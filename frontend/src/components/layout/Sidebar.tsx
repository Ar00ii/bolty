'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Globe, Briefcase, MessageSquare, User, BookOpen, LogOut, ChevronRight, Menu, X,
  Flame, Star, MessageSquare as MessageIcon, UserCheck, ShoppingBag, Store,
  ShoppingCart, Bot, Cpu, GitBranch, Code2, Trophy, Settings, Wallet, Key, Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';

interface NavSection {
  label: string;
  icon: any;
  href: string;
  badge?: number | boolean;
  children?: {
    label: string;
    href: string;
    icon: any;
  }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [pathname, isMobile]);

  const toggleSection = (href: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedSections(newExpanded);
  };

  const navSections: NavSection[] = [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/market',
    },
    {
      label: 'Community',
      icon: Globe,
      href: '/chat',
      children: [
        { label: 'Global Chat', href: '/chat', icon: MessageIcon },
        { label: 'Trending', href: '/chat?tab=trending', icon: Flame },
        { label: 'Discover', href: '/chat?tab=discover', icon: Star },
      ],
    },
    {
      label: 'Messages',
      icon: MessageSquare,
      href: '/dm',
      badge: true,
      children: [
        { label: 'All Messages', href: '/dm', icon: MessageIcon },
        { label: 'Friends', href: '/dm?cat=friends', icon: UserCheck },
        { label: 'Sellers', href: '/dm?cat=sellers', icon: ShoppingBag },
        { label: 'Vendors', href: '/dm?cat=vendors', icon: Store },
      ],
    },
    {
      label: 'Marketplace',
      icon: ShoppingCart,
      href: '/market',
      children: [
        { label: 'Overview', href: '/market', icon: ShoppingCart },
        { label: 'AI Agents', href: '/market/agents', icon: Bot },
        { label: 'My Agents', href: '/market/agents?tab=mine', icon: Cpu },
        { label: 'Repositories', href: '/market/repos', icon: GitBranch },
        { label: 'My Repos', href: '/market/repos?tab=mine', icon: Code2 },
      ],
    },
    {
      label: 'Services',
      icon: Briefcase,
      href: '/services',
      children: [
        { label: 'Browse Services', href: '/services', icon: Briefcase },
        { label: 'Leaderboard', href: '/reputation/leaderboard', icon: Trophy },
      ],
    },
    {
      label: 'Docs',
      icon: BookOpen,
      href: '/docs/agent-protocol',
      children: [
        { label: 'Agent Protocol', href: '/docs/agent-protocol', icon: BookOpen },
        { label: 'API Reference', href: '/docs/agent-api', icon: Code2 },
      ],
    },
  ];

  const profileSections: NavSection[] = isAuthenticated
    ? [
        {
          label: 'Account',
          icon: User,
          href: '/profile',
          children: [
            { label: 'My Profile', href: '/profile', icon: User },
            { label: 'Wallet', href: '/profile?tab=wallet', icon: Wallet },
            { label: 'API Keys', href: '/api-keys', icon: Key },
            { label: 'Security', href: '/profile?tab=security', icon: Settings },
          ],
        },
      ]
    : [];

  const isActive = (href: string) => {
    if (href === '/market') return pathname.startsWith('/market') || pathname === '/';
    return pathname === href || pathname.startsWith(href);
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: isMobile ? '-100%' : 0, opacity: isMobile ? 0 : 1 },
  };

  const containerVariants = {
    open: { opacity: 1, pointerEvents: 'auto' as const },
    closed: { opacity: 0, pointerEvents: 'none' as const },
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 lg:hidden z-50 p-2.5 rounded-lg bg-monad-500/10 border border-monad-500/20 hover:bg-monad-500/20 hover:border-monad-500/30 text-monad-400 transition-all"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={isMobile ? 'closed' : 'open'}
        animate={isOpen || !isMobile ? 'open' : 'closed'}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed lg:relative top-0 left-0 h-screen w-64 bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border-r border-zinc-800/50 overflow-y-auto z-40 shadow-xl lg:shadow-none transition-all ${
          isCollapsed && !isMobile ? 'lg:w-20' : ''
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Desktop Collapse Toggle */}
          {!isMobile && (
            <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-800/30 bg-gradient-to-r from-monad-500/5 to-transparent">
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-monad-400" />
                  <span className="text-sm font-light text-white">Bolty</span>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors ml-auto"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          )}

          {/* Navigation Sections */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
            {navSections.map((section) => (
              <SidebarItem
                key={section.href}
                section={section}
                isActive={isActive}
                isCollapsed={isCollapsed && !isMobile}
                isExpanded={expandedSections.has(section.href)}
                onToggle={() => toggleSection(section.href)}
              />
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-zinc-800/30" />

          {/* Profile Section */}
          {isAuthenticated && (
            <nav className="px-3 py-4 space-y-2">
              {profileSections.map((section) => (
                <SidebarItem
                  key={section.href}
                  section={section}
                  isActive={isActive}
                  isCollapsed={isCollapsed && !isMobile}
                  isExpanded={expandedSections.has(section.href)}
                  onToggle={() => toggleSection(section.href)}
                />
              ))}
            </nav>
          )}

          {/* Footer */}
          {isAuthenticated && (
            <div className="p-3 border-t border-zinc-800/30 space-y-2 bg-gradient-to-t from-zinc-900/50 to-transparent">
              {!isCollapsed && !isMobile && (
                <div className="px-3 py-2">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-light mb-2">
                    Account
                  </p>
                  <p className="text-sm text-white font-light truncate">
                    {user?.displayName || user?.username}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light text-red-400/80 hover:text-red-300 hover:bg-red-500/10 border border-red-500/0 hover:border-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && !isMobile && 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}

interface SidebarItemProps {
  section: NavSection;
  isActive: (href: string) => boolean;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function SidebarItem({
  section,
  isActive,
  isCollapsed,
  isExpanded,
  onToggle,
}: SidebarItemProps) {
  const Icon = section.icon;
  const hasChildren = section.children && section.children.length > 0;
  const active = isActive(section.href);

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-all duration-200 ${
            active
              ? 'text-monad-300 bg-monad-500/15 border border-monad-500/40 shadow-lg shadow-monad-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{section.label}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </>
          )}
        </button>
      ) : (
        <Link
          href={section.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-all duration-200 ${
            active
              ? 'text-monad-300 bg-monad-500/15 border border-monad-500/40 shadow-lg shadow-monad-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1">{section.label}</span>
              {section.badge && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-2 h-2 rounded-full bg-red-500"
                />
              )}
            </>
          )}
        </Link>
      )}

      {/* Submenu */}
      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 border-l-2 border-monad-500/20 ml-2 pl-2"
          >
            {section.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-light transition-all duration-200 ${
                  isActive(child.href)
                    ? 'text-monad-300 bg-monad-500/10'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                <child.icon className="w-3 h-3 flex-shrink-0 opacity-60" />
                <span>{child.label}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
