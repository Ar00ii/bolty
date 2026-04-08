'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Globe, Briefcase, MessageSquare, User, BookOpen, LogOut, ChevronLeft, Menu, X,
  Flame, Star, MessageSquare as MessageIcon, UserCheck, ShoppingBag, Store,
  ShoppingCart, Bot, Cpu, GitBranch, Code2, Trophy, Settings, Wallet, Key,
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
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
      label: 'Hire & Services',
      icon: Briefcase,
      href: '/services',
      children: [
        { label: 'Browse Services', href: '/services', icon: Briefcase },
        { label: 'Leaderboard', href: '/reputation/leaderboard', icon: Trophy },
      ],
    },
    {
      label: 'Documentation',
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
          label: 'Profile',
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
  };

  const backdropVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 },
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 lg:hidden z-40 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial={isMobile ? 'closed' : 'open'}
        animate={isMobile ? (isOpen ? 'open' : 'closed') : 'open'}
        transition={{ duration: 0.3 }}
        className={`fixed lg:relative top-16 left-0 h-[calc(100vh-4rem)] lg:top-0 lg:h-screen w-64 bg-zinc-900 border-r border-zinc-800 overflow-y-auto z-40 transition-all ${
          isCollapsed && !isMobile ? 'lg:w-20' : ''
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Collapse Toggle (Desktop) */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center h-12 hover:bg-zinc-800 transition-colors border-b border-zinc-800"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          {/* Navigation Sections */}
          <nav className="flex-1 p-4 space-y-1">
            {navSections.map((section) => (
              <SidebarItem
                key={section.href}
                section={section}
                isActive={isActive}
                isCollapsed={isCollapsed && !isMobile}
                isExpanded={expandedSection === section.href}
                onToggle={() =>
                  setExpandedSection(
                    expandedSection === section.href ? null : section.href
                  )
                }
              />
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-zinc-800" />

          {/* Profile Section */}
          {isAuthenticated && (
            <nav className="p-4 space-y-1">
              {profileSections.map((section) => (
                <SidebarItem
                  key={section.href}
                  section={section}
                  isActive={isActive}
                  isCollapsed={isCollapsed && !isMobile}
                  isExpanded={expandedSection === section.href}
                  onToggle={() =>
                    setExpandedSection(
                      expandedSection === section.href ? null : section.href
                    )
                  }
                />
              ))}
            </nav>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 space-y-2">
            {isAuthenticated && (
              <>
                {!isCollapsed && !isMobile && (
                  <div className="px-3 py-2 mb-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-light mb-1">
                      Logged in as
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
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && !isMobile && 'Sign out'}
                </button>
              </>
            )}
          </div>
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

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-all ${
            isActive(section.href)
              ? 'text-monad-300 bg-monad-500/10 border border-monad-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{section.label}</span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.div>
            </>
          )}
        </button>
      ) : (
        <Link
          href={section.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-all ${
            isActive(section.href)
              ? 'text-monad-300 bg-monad-500/10 border border-monad-500/30'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && section.label}
          {section.badge && !isCollapsed && (
            <span className="ml-auto px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
              New
            </span>
          )}
        </Link>
      )}

      {/* Submenu */}
      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-3 mt-1 space-y-1 border-l border-zinc-700"
          >
            {section.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-light transition-all ml-2 ${
                  isActive(child.href)
                    ? 'text-monad-300 bg-monad-500/10'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <child.icon className="w-3 h-3 flex-shrink-0" />
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
