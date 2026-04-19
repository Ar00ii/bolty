'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  MessageSquare,
  BookOpen,
  Menu,
  X,
  Flame,
  Star,
  ShoppingCart,
  Bot,
  GitBranch,
  Code2,
  ChevronRight,
  Zap,
  User,
  Users,
  Hash,
  Heart,
  Library,
  BarChart3,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useState, useEffect } from 'react';

interface NavSection {
  label: string;
  icon: any;
  href: string;
  separator?: boolean;
  children?: {
    label: string;
    href: string;
    icon: any;
  }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Initialize on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (!isMobile) return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMobile, isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isMobile]);

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
      label: 'Profile',
      icon: User,
      href: '/profile',
    },
    {
      label: 'Marketplace',
      icon: ShoppingCart,
      href: '/market',
      separator: true,
      children: [
        { label: 'AI Agents', href: '/market/agents', icon: Bot },
        { label: 'Repositories', href: '/market/repos', icon: GitBranch },
        { label: 'Top Sellers', href: '/market/sellers', icon: Users },
        { label: 'Browse by tag', href: '/market/tags', icon: Hash },
        { label: 'Saved', href: '/market/favorites', icon: Heart },
        { label: 'Library', href: '/market/library', icon: Library },
        { label: 'Seller Dashboard', href: '/market/seller', icon: BarChart3 },
      ],
    },
    {
      label: 'Community',
      icon: Globe,
      href: '/chat',
      children: [
        { label: 'Global Chat', href: '/chat', icon: MessageSquare },
        { label: 'Trending', href: '/chat?tab=trending', icon: Flame },
        { label: 'Discover', href: '/chat?tab=discover', icon: Star },
        { label: 'Leaderboard', href: '/reputation/leaderboard', icon: Trophy },
      ],
    },
    {
      label: 'Messages',
      icon: MessageSquare,
      href: '/dm',
    },
    {
      label: 'Boost',
      icon: Zap,
      href: '/profile?tab=agent',
      separator: true,
    },
    {
      label: 'Docs',
      icon: BookOpen,
      href: '/docs/agent-protocol',
      separator: true,
      children: [
        { label: 'Agent Protocol', href: '/docs/agent-protocol', icon: BookOpen },
        { label: 'API Reference', href: '/docs/agent-api', icon: Code2 },
      ],
    },
  ];

  const isActive = (href: string) => {
    const basePath = href.split('?')[0];
    if (basePath === '/') return pathname === '/';
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 lg:hidden z-[60] w-10 h-10 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
        style={{
          background: 'linear-gradient(180deg, rgba(24,24,30,0.85) 0%, rgba(12,12,16,0.85) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow:
            '0 8px 24px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="inline-flex"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="inline-flex"
            >
              <Menu className="w-4 h-4" strokeWidth={1.75} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          key="sidebar"
          initial={isMobile ? { x: '-100%' } : false}
          animate={isOpen || !isMobile ? { x: 0 } : { x: '-100%' }}
          transition={{
            type: 'spring',
            stiffness: 340,
            damping: 34,
          }}
          className={`fixed lg:relative top-0 left-0 overflow-y-auto z-50 flex flex-col w-[82%] max-w-[300px] lg:w-60 lg:max-w-none lg:z-40 ${
            isMobile ? 'will-change-transform' : ''
          }`}
          style={{
            height: '100dvh',
            background: 'linear-gradient(180deg, #0e0e12 0%, #08080b 100%)',
            boxShadow: isMobile
              ? '24px 0 60px -10px rgba(0,0,0,0.6), inset -1px 0 0 rgba(131,110,249,0.12)'
              : 'inset -1px 0 0 rgba(255,255,255,0.05)',
            borderRight: isMobile ? '1px solid rgba(131,110,249,0.16)' : 'none',
          }}
        >
          {/* Header */}
          <motion.div
            className="px-4 pt-5 pb-4 relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex w-8 h-8 items-center justify-center rounded-xl flex-shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(131,110,249,0.3) 0%, rgba(236,72,153,0.2) 100%)',
                  border: '1px solid rgba(131,110,249,0.32)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.10), 0 0 16px -4px rgba(131,110,249,0.5)',
                }}
              >
                <Zap className="w-4 h-4 text-[#c4b5fd]" strokeWidth={2} />
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-[14px] font-semibold text-white tracking-[-0.01em]">
                  Bolty
                </span>
                <span className="text-[9.5px] text-[#836ef9]/60 mt-0.5 tracking-[0.22em] uppercase font-medium">
                  Network
                </span>
              </div>
            </div>
            {/* Bottom border with gradient */}
            <div
              className="absolute bottom-0 left-4 right-4 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.25) 40%, rgba(255,255,255,0.05) 100%)',
              }}
            />
          </motion.div>

          {/* Nav sections */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {navSections.map((section, idx) => (
              <motion.div
                key={`${section.href}-${idx}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: isMobile ? Math.min(idx * 0.04, 0.2) : 0,
                  duration: 0.25,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
              >
                {section.separator && (
                  <div
                    className="my-2 mx-1 h-px"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(131,110,249,0.15) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)',
                    }}
                  />
                )}
                <SidebarItem
                  section={section}
                  isActive={isActive}
                  isExpanded={expandedSections.has(section.href)}
                  onToggle={() => toggleSection(section.href)}
                  onNavigate={() => isMobile && setIsOpen(false)}
                />
              </motion.div>
            ))}
          </nav>

          {/* Footer */}
          <motion.div
            className="px-3 pb-4 pt-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div
              className="h-px mb-3"
              style={{
                background:
                  'linear-gradient(90deg, rgba(131,110,249,0.15) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)',
              }}
            />
            <div className="space-y-0.5 text-[12px] text-zinc-500">
              <button
                onClick={() => {
                  if (typeof window === 'undefined') return;
                  window.dispatchEvent(
                    new KeyboardEvent('keydown', {
                      key: 'k',
                      ctrlKey: true,
                      metaKey: true,
                      bubbles: true,
                    }),
                  );
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.03] hover:text-zinc-300 transition-colors"
              >
                <span>Quick search</span>
                <span className="inline-flex items-center gap-1">
                  <SidebarKbd>⌘</SidebarKbd>
                  <SidebarKbd>K</SidebarKbd>
                </span>
              </button>
              <button
                onClick={() => {
                  if (typeof window === 'undefined') return;
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.03] hover:text-zinc-300 transition-colors"
              >
                <span>Shortcuts</span>
                <SidebarKbd>?</SidebarKbd>
              </button>
              <p className="text-zinc-700 px-2 pt-2 text-[10px] tracking-[0.15em] uppercase">
                © 2026 Bolty Network
              </p>
            </div>
          </motion.div>
        </motion.aside>
      </AnimatePresence>
    </>
  );
}

function SidebarKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-medium text-zinc-400 leading-none"
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.35)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {children}
    </kbd>
  );
}

interface SidebarItemProps {
  section: NavSection;
  isActive: (href: string) => boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

function SidebarItem({ section, isActive, isExpanded, onToggle, onNavigate }: SidebarItemProps) {
  const Icon = section.icon;
  const hasChildren = section.children && section.children.length > 0;
  const active = isActive(section.href);

  if (hasChildren) {
    return (
      <div className="group">
        <motion.button
          whileTap={{ scale: 0.985 }}
          onClick={onToggle}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-light transition-all duration-150 relative ${
            active ? 'text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03]'
          }`}
          style={
            active
              ? {
                  background:
                    'linear-gradient(90deg, rgba(131,110,249,0.16) 0%, rgba(131,110,249,0.04) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.22), inset 0 1px 0 rgba(255,255,255,0.04)',
                }
              : undefined
          }
        >
          {active && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute -left-0.5 top-1.5 bottom-1.5 w-[3px] rounded-r"
              style={{
                background: 'linear-gradient(180deg, #c4b5fd 0%, #836EF9 100%)',
                boxShadow: '0 0 10px rgba(131,110,249,0.7)',
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            />
          )}

          <Icon
            className={`w-[15px] h-[15px] shrink-0 transition-colors ${active ? 'text-[#c4b5fd]' : 'text-zinc-500 group-hover:text-zinc-300'}`}
            strokeWidth={1.75}
          />

          <span className="flex-1 text-left tracking-[0.005em]">{section.label}</span>

          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </motion.div>
        </motion.button>

        {/* Submenu */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div
                className="ml-5 pl-3 py-1 mt-0.5 space-y-0.5"
                style={{ borderLeft: '1px solid rgba(131,110,249,0.12)' }}
              >
                {section.children!.map((child, idx) => {
                  const childActive = isActive(child.href);
                  return (
                    <motion.div
                      key={child.href}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ delay: idx * 0.025, duration: 0.15 }}
                    >
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={childActive ? 'page' : undefined}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] font-light transition-all duration-150 relative ${
                          childActive
                            ? 'text-white bg-white/[0.04]'
                            : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.025]'
                        }`}
                      >
                        {childActive && (
                          <motion.div
                            layoutId={`subActive-${section.href}`}
                            className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-r"
                            style={{
                              background: '#836EF9',
                              boxShadow: '0 0 6px rgba(131,110,249,0.55)',
                            }}
                            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                          />
                        )}
                        <child.icon
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${childActive ? 'text-[#b4a7ff]' : 'text-zinc-600 group-hover:text-zinc-400'}`}
                          strokeWidth={1.75}
                        />
                        <span className="flex-1 tracking-[0.005em]">{child.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="group">
      <Link
        href={section.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-light transition-all duration-150 relative ${
          active ? 'text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03]'
        }`}
        style={
          active
            ? {
                background:
                  'linear-gradient(90deg, rgba(131,110,249,0.16) 0%, rgba(131,110,249,0.04) 100%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(131,110,249,0.22), inset 0 1px 0 rgba(255,255,255,0.04)',
              }
            : undefined
        }
      >
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -left-0.5 top-1.5 bottom-1.5 w-[3px] rounded-r"
            style={{
              background: 'linear-gradient(180deg, #c4b5fd 0%, #836EF9 100%)',
              boxShadow: '0 0 10px rgba(131,110,249,0.7)',
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          />
        )}

        <Icon
          className={`w-[15px] h-[15px] shrink-0 transition-colors ${active ? 'text-[#c4b5fd]' : 'text-zinc-500 group-hover:text-zinc-300'}`}
          strokeWidth={1.75}
        />

        <span className="flex-1 tracking-[0.005em]">{section.label}</span>
      </Link>
    </div>
  );
}
