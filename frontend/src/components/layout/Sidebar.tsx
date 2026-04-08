'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Globe, Briefcase, MessageSquare, BookOpen, Menu, X,
  Flame, Star, ShoppingCart, Bot, Cpu, GitBranch, Code2, Trophy,
} from 'lucide-react';

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
      label: 'Services',
      icon: Briefcase,
      href: '/services',
      children: [
        { label: 'Browse', href: '/services', icon: Briefcase },
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

  const isActive = (href: string) => {
    if (href === '/market') return pathname.startsWith('/market') || pathname === '/';
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 lg:hidden z-50 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
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
            className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: '-100%' } : { x: 0 }}
        animate={isOpen || !isMobile ? { x: 0 } : { x: isMobile ? '-100%' : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed lg:relative top-0 left-0 h-screen w-56 bg-zinc-950 border-r border-white/5 overflow-y-auto z-40 lg:shadow-none"
      >
        <nav className="p-4 space-y-1 h-full flex flex-col">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navSections.map((section) => (
              <SidebarItem
                key={section.href}
                section={section}
                isActive={isActive}
                isExpanded={expandedSections.has(section.href)}
                onToggle={() => toggleSection(section.href)}
              />
            ))}
          </div>
        </nav>
      </motion.aside>
    </>
  );
}

interface SidebarItemProps {
  section: NavSection;
  isActive: (href: string) => boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function SidebarItem({
  section,
  isActive,
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
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-all ${
            active
              ? 'text-white bg-white/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">{section.label}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-xs opacity-50">›</span>
          </motion.div>
        </button>
      ) : (
        <Link
          href={section.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-all ${
            active
              ? 'text-white bg-white/10'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span>{section.label}</span>
        </Link>
      )}

      {/* Submenu */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 mt-1 ml-4 border-l border-white/5 pl-3"
          >
            {section.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-light transition-all ${
                  isActive(child.href)
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <child.icon className="w-3 h-3 flex-shrink-0" />
                <span>{child.label}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
