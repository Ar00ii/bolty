'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Globe, Briefcase, MessageSquare, BookOpen, Menu, X,
  Flame, Star, ShoppingCart, Bot, GitBranch, Code2, Trophy,
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
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile && isOpen) {
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

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 lg:hidden z-50 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
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
            className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          key="sidebar"
          initial={isMobile ? { x: -224 } : false}
          animate={isOpen || !isMobile ? { x: 0 } : { x: isMobile ? -224 : 0 }}
          transition={{
            duration: 0.35,
            ease: [0.4, 0, 0.2, 1],
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={`fixed lg:relative top-0 left-0 h-screen w-56 bg-zinc-950 border-r border-white/5 overflow-y-auto z-40 ${
            isMobile ? 'will-change-transform' : ''
          }`}
        >
          <nav className="p-4 space-y-2">
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

function SidebarItem({
  section,
  isActive,
  isExpanded,
  onToggle,
  onNavigate,
}: SidebarItemProps) {
  const Icon = section.icon;
  const hasChildren = section.children && section.children.length > 0;
  const active = isActive(section.href);

  if (hasChildren) {
    return (
      <div>
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-all ${
            active ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
            <Icon className="w-4 h-4 flex-shrink-0" />
          </motion.div>
          <span className="flex-1 text-left">{section.label}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className="text-xs opacity-50">›</span>
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
              className="space-y-1 border-l border-white/5 ml-2 pl-3"
            >
              {section.children!.map((child, idx) => (
                <motion.div
                  key={child.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={child.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-light transition-all ${
                      isActive(child.href)
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.15 }} transition={{ duration: 0.2 }}>
                      <child.icon className="w-3 h-3 flex-shrink-0" />
                    </motion.div>
                    <span>{child.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} initial={false}>
      <Link
        href={section.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-all ${
          active ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
          <Icon className="w-4 h-4 flex-shrink-0" />
        </motion.div>
        <span>{section.label}</span>
      </Link>
    </motion.div>
  );
}
