'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Globe,
  Briefcase,
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
  Trophy,
  ChevronRight,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useState, useEffect } from 'react';

interface NavSection {
  label: string;
  icon: any;
  href: string;
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
        { label: 'Global Chat', href: '/chat', icon: MessageSquare },
        { label: 'Trending', href: '/chat?tab=trending', icon: Flame },
        { label: 'Discover', href: '/chat?tab=discover', icon: Star },
      ],
    },
    {
      label: 'Messages',
      icon: MessageSquare,
      href: '/dm',
      children: [
        { label: 'All Messages', href: '/dm', icon: MessageSquare },
        { label: 'Friends', href: '/dm?cat=friends', icon: Globe },
        { label: 'Sellers', href: '/dm?cat=sellers', icon: ShoppingCart },
      ],
    },
    {
      label: 'Marketplace',
      icon: ShoppingCart,
      href: '/market',
      children: [
        { label: 'AI Agents', href: '/market/agents', icon: Bot },
        { label: 'Repositories', href: '/market/repos', icon: GitBranch },
      ],
    },
    {
      label: 'Rays',
      icon: Zap,
      href: '/profile?tab=agent',
      children: [
        { label: 'My Rays', href: '/profile?tab=agent', icon: Zap },
        { label: 'Marketplace', href: '/#rays-marketplace', icon: ShoppingCart },
      ],
    },
    {
      label: 'Services',
      icon: Briefcase,
      href: '/services',
      children: [
        { label: 'Browse', href: '/services', icon: Briefcase },
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

  const isActive = (href: string) => {
    if (href === '/market') return pathname.startsWith('/market') || pathname === '/';
    return pathname === href || pathname.startsWith(href);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 lg:hidden z-50 p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 bg-zinc-900/80 backdrop-blur-sm border border-white/5 transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5" />
            </motion.div>
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
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          key="sidebar"
          initial={isMobile ? { x: -240 } : false}
          animate={isOpen || !isMobile ? { x: 0 } : { x: isMobile ? -240 : 0 }}
          transition={{
            duration: 0.35,
            ease: [0.4, 0, 0.2, 1],
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={`fixed lg:relative top-0 left-0 h-screen w-60 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-r border-white/5 overflow-y-auto z-40 flex flex-col ${
            isMobile ? 'will-change-transform' : ''
          }`}
        >
          {/* Header */}
          <motion.div
            className="px-4 py-6 border-b border-white/5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
              Navigation
            </div>
          </motion.div>

          {/* Nav sections */}
          <nav className="flex-1 p-4 space-y-1">
            {navSections.map((section, idx) => (
              <motion.div
                key={section.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: isMobile ? idx * 0.05 : 0,
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
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

          {/* Footer divider */}
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          />

          {/* Footer info */}
          <motion.div
            className="px-4 py-4 text-xs text-zinc-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <p>© Bolty Network</p>
          </motion.div>
        </motion.aside>
      </AnimatePresence>
    </>
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
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-light transition-all duration-200 relative ${
            active
              ? 'text-white bg-white/10 border border-white/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
          }`}
        >
          {active && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-r"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}

          <motion.div
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.2 }}
            className={`flex-shrink-0 ml-1 transition-colors ${active ? 'text-purple-400' : ''}`}
          >
            <Icon className="w-4 h-4" />
          </motion.div>

          <span className="flex-1 text-left">{section.label}</span>

          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </motion.div>
        </motion.button>

        {/* Submenu */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-1 border-l-2 border-purple-500/20 ml-2 pl-2 py-1"
            >
              {section.children!.map((child, idx) => {
                const childActive = isActive(child.href);
                return (
                  <motion.div
                    key={child.href}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ delay: idx * 0.05, duration: 0.2 }}
                  >
                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-light transition-all duration-200 relative ${
                        childActive
                          ? 'text-purple-300 bg-white/5 border border-purple-500/20'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {childActive && (
                        <motion.div
                          layoutId={`subActive-${child.href}`}
                          className="absolute -left-1.5 w-1 h-3.5 bg-purple-500 rounded-r"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}

                      <motion.div
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        transition={{ duration: 0.2 }}
                        className={`flex-shrink-0 transition-colors ${childActive ? 'text-purple-400' : ''}`}
                      >
                        <child.icon className="w-3 h-3" />
                      </motion.div>
                      <span className="flex-1">{child.label}</span>

                      {childActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} initial={false} className="group">
      <Link
        href={section.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-light transition-all duration-200 relative ${
          active
            ? 'text-white bg-white/10 border border-white/10'
            : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
        }`}
      >
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-r"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.2 }}
          className={`flex-shrink-0 ml-1 transition-colors ${active ? 'text-purple-400' : ''}`}
        >
          <Icon className="w-4 h-4" />
        </motion.div>

        <span className="flex-1">{section.label}</span>

        {active && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-1.5 h-1.5 rounded-full bg-purple-400"
          />
        )}
      </Link>
    </motion.div>
  );
}
