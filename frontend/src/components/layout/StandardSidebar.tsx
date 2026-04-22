'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Flame,
  GitBranch,
  Heart,
  LayoutGrid,
  Library,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { prefetch } from '@/lib/cache/pageCache';

// Kick off API fetches for the most likely-visited pages the moment
// the user's cursor touches the sidebar row. The prefetch module
// dedupes in-flight calls and skips if fresh (<30s), so repeated
// hover doesn't spam the network.
function prefetchForHref(href: string) {
  const base = href.split('?')[0];
  switch (base) {
    case '/market':
      void prefetch('market:listings', () =>
        api
          .get<{ data: unknown[] }>('/market?page=1&sortBy=recent')
          .then((r) => r?.data ?? []),
      );
      void prefetch('market:pulse', () => api.get('/market/pulse?limit=20'));
      break;
    case '/orders':
      void prefetch('orders:buyer', () => api.get('/orders'));
      void prefetch('orders:seller', () => api.get('/orders/selling'));
      void prefetch('orders:stats', () => api.get('/orders/seller/stats'));
      void prefetch('orders:negotiations', () => api.get('/market/negotiations'));
      break;
    case '/inventory':
      void prefetch('inventory:data', () => api.get('/market/my-inventory'));
      break;
    case '/market/library':
      void prefetch('library:items', () => api.get('/market/library'));
      break;
    default:
      break;
  }
}

interface NavChild {
  label: string;
  icon?: LucideIcon;
  href: string;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  count?: number;
  badge?: string;
  hot?: boolean;
  dot?: boolean;
  kbd?: string;
  children?: NavChild[];
}

interface NavSection {
  section: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    section: 'Discover',
    items: [
      {
        label: 'Marketplace',
        icon: LayoutGrid,
        href: '/market',
        children: [
          { label: 'Agents', icon: Bot, href: '/market/agents' },
          { label: 'Repos', icon: GitBranch, href: '/market/repos' },
        ],
      },
      { label: 'Leaderboard', icon: Trophy, href: '/reputation/leaderboard' },
    ],
  },
  {
    section: 'My work',
    items: [
      { label: 'Inventory', icon: Package, href: '/inventory' },
      { label: 'Favorites', icon: Heart, href: '/favorites' },
      { label: 'Library', icon: Library, href: '/market/library' },
      { label: 'Orders', icon: ShoppingBag, href: '/orders' },
    ],
  },
  {
    section: 'Community',
    items: [
      { label: 'Chat', icon: MessageSquare, href: '/chat' },
      { label: 'Messages', icon: MessageCircle, href: '/dm' },
      { label: 'Notifications', icon: Bell, href: '/notifications' },
    ],
  },
  {
    section: 'Account',
    items: [
      { label: 'Settings', icon: Settings, href: '/profile' },
      { label: 'How it works', icon: FileText, href: '/how-it-works' },
      { label: 'Docs', icon: BookOpen, href: '/docs/agent-protocol' },
      { label: 'Help', icon: LifeBuoy, href: '/help' },
    ],
  },
];

export function isItemActive(
  pathname: string,
  searchParams: URLSearchParams,
  href: string,
): boolean {
  const [cleanHref, query] = href.split('?');
  if (cleanHref === '/market') return pathname === '/market';
  if (cleanHref === '/profile') {
    if (!(pathname === '/profile' || pathname.startsWith('/profile/'))) return false;
    if (query) {
      const expected = new URLSearchParams(query);
      return expected.get('tab') === searchParams.get('tab');
    }
    return !searchParams.get('tab') || searchParams.get('tab') === 'profile';
  }
  return pathname === cleanHref || pathname.startsWith(cleanHref + '/');
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function StandardSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  const walletAddress = user?.walletAddress ?? '0x4f2a0000000000000000000000000000000000E91c';
  const isAuthenticated = !!user;

  return (
    <aside
      className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen flex-col overflow-hidden w-[264px] shrink-0"
      style={{
        background: '#0c0c0f',
        borderRight: '1px solid #1f1f23',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Workspace switcher */}
      <Link
        href="/"
        className="grid items-center text-left h-12 px-[14px] gap-[10px] transition-colors hover:bg-white/[0.02]"
        style={{
          gridTemplateColumns: '38px 1fr 16px',
          borderBottom: '1px solid #1f1f23',
        }}
      >
        <div className="w-[38px] h-[38px] grid place-items-center rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LogoNew.png" alt="Bolty" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0 flex items-center">
          <span
            className="text-xl truncate"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.3px',
              background: 'linear-gradient(90deg, #ffffff 0%, #e8e2ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            BoltyNetwork
          </span>
        </div>
        <span />
      </Link>

      {/* Search trigger */}
      <button
        type="button"
        className="mx-3 mt-3 mb-2 flex items-center gap-2 px-[10px] py-[7px] rounded-lg text-[12.5px] transition-colors"
        style={{
          background: '#09090b',
          border: '1px solid #1f1f23',
          color: '#ffffff',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a30')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1f1f23')}
      >
        <Search className="w-3 h-3 shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left">Jump to…</span>
        <kbd
          className="font-mono text-[10px] px-[5px] py-[2px] rounded"
          style={{
            background: '#18181b',
            border: '1px solid #2a2a30',
            color: '#ffffff',
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Scroll area with sections */}
      <div className="flex-1 overflow-y-auto px-2 pt-1 pb-3">
        {NAV.map((sect) => (
          <div key={sect.section} className="mt-4 first:mt-0">
            <div
              className="font-mono text-[10px] uppercase px-[10px] pb-[6px]"
              style={{ color: '#ffffff', letterSpacing: '0.16em', fontWeight: 600 }}
            >
              {sect.section.toUpperCase()}
            </div>
            {sect.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(pathname, searchParams, item.href);
              return <SidebarItem key={item.label} item={item} Icon={Icon} active={active} />;
            })}
          </div>
        ))}
      </div>

      {/* Footer: wallet chip + disconnect when signed in, Sign-in CTA when signed out */}
      <div
        className="p-3"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(131,110,249,0.04))',
        }}
      >
        {isAuthenticated ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6px]">
              <span
                className="w-[6px] h-[6px] rounded-full"
                style={{
                  background: '#22c55e',
                  boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                }}
              />
              <span className="font-mono text-[11px]" style={{ color: '#ffffff' }}>
                {shortenAddress(walletAddress)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => logout?.()}
              className="font-mono text-[10px] transition-colors"
              style={{ color: '#ffffff' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
            >
              disconnect
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="block text-center rounded-md py-2 text-[12px] transition-colors"
            style={{
              background: 'rgba(131,110,249,0.15)',
              border: '1px solid rgba(131,110,249,0.3)',
              color: '#e4e4e7',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(131,110,249,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(131,110,249,0.15)')}
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SidebarItem({ item, Icon, active }: { item: NavItem; Icon: LucideIcon; active: boolean }) {
  const pathname = usePathname();
  const hasChildren = !!item.children && item.children.length > 0;

  // Child is considered active if its exact href matches the current route
  const childActiveHref = hasChildren
    ? item.children!.find(
        (c) => pathname === c.href.split('?')[0] || pathname.startsWith(c.href.split('?')[0] + '/'),
      )?.href
    : undefined;

  // Auto-open when a child is active (e.g. landing on /market/agents)
  const [open, setOpen] = useState<boolean>(!!childActiveHref || active);
  useEffect(() => {
    if (childActiveHref) setOpen(true);
  }, [childActiveHref]);

  // Hover-to-open with a short close delay so crossing the parent↔children
  // gap doesn't snap it shut.
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      // Only close if nothing inside keeps it pinned open
      if (!childActiveHref) setOpen(false);
    }, 120);
  };
  useEffect(() => () => cancelClose(), []);

  const handleGroupEnter = () => {
    if (!hasChildren) return;
    cancelClose();
    setOpen(true);
  };
  const handleGroupLeave = () => {
    if (!hasChildren) return;
    scheduleClose();
  };

  const iconColor = active ? '#a594ff' : '#ffffff';

  const rowStyle: React.CSSProperties = {
    gridTemplateColumns: '10px 16px 1fr auto',
    color: active ? '#ffffff' : '#ffffff',
    background: active ? 'rgba(131,110,249,0.08)' : 'transparent',
    fontSize: '13px',
    fontWeight: 300,
  };

  const rowClassName =
    'grid items-center gap-[10px] px-[10px] py-[7px] rounded-md transition-colors group relative w-full text-left';

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!active) {
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
    }
    const iconEl = e.currentTarget.querySelector<HTMLElement>('[data-side-icon]');
    if (iconEl) iconEl.style.color = '#a594ff';
    const kbdEl = e.currentTarget.querySelector<HTMLElement>('[data-side-kbd]');
    if (kbdEl) kbdEl.style.opacity = '1';
    // Prefetch API data for the most common destinations so by the time
    // the user actually clicks, the page renders from cache instantly.
    prefetchForHref(item.href);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!active) {
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.background = 'transparent';
    }
    const iconEl = e.currentTarget.querySelector<HTMLElement>('[data-side-icon]');
    if (iconEl) iconEl.style.color = iconColor;
    const kbdEl = e.currentTarget.querySelector<HTMLElement>('[data-side-kbd]');
    if (kbdEl) kbdEl.style.opacity = '0';
  };

  const body = (
    <>
      <span
        className="font-mono leading-none"
        style={{ fontSize: '13px', color: '#836EF9', width: '10px' }}
      >
        {active ? '›' : ''}
      </span>
      <span className="flex" style={{ color: iconColor }} data-side-icon>
        <Icon className="w-4 h-4" strokeWidth={1.5} />
      </span>
      <span className="truncate whitespace-nowrap">{item.label}</span>
      <SidebarItemMeta item={item} open={open} />
    </>
  );

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        className={rowClassName}
        style={rowStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {body}
      </Link>
    );
  }

  return (
    <div onMouseEnter={handleGroupEnter} onMouseLeave={handleGroupLeave}>
      <Link
        href={item.href}
        aria-expanded={open}
        className={rowClassName}
        style={rowStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {body}
      </Link>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-0.5 mb-1 pl-[22px] relative">
              {/* left rail */}
              <span
                className="absolute top-1 bottom-1 w-px"
                style={{ left: '15px', background: '#1f1f23' }}
              />
              {item.children!.map((c) => {
                const ChildIcon = c.icon;
                const isActive =
                  pathname === c.href.split('?')[0] ||
                  pathname.startsWith(c.href.split('?')[0] + '/');
                return (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="flex items-center gap-[10px] px-[10px] py-[6px] rounded-md transition-colors"
                    style={{
                      color: '#ffffff',
                      background: isActive ? 'rgba(131,110,249,0.08)' : 'transparent',
                      fontSize: '12.5px',
                      fontWeight: 300,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {ChildIcon && (
                      <ChildIcon
                        className="w-[14px] h-[14px] shrink-0"
                        strokeWidth={1.5}
                        style={{ color: isActive ? '#a594ff' : '#ffffff' }}
                      />
                    )}
                    <span className="truncate">{c.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItemMeta({ item, open }: { item: NavItem; open?: boolean }) {
  if (item.children && item.children.length > 0) {
    return (
      <ChevronRight
        className="w-[14px] h-[14px] transition-transform"
        strokeWidth={1.75}
        style={{
          color: '#52525b',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      />
    );
  }
  if (item.badge) {
    return (
      <span
        className="inline-flex items-center gap-[5px] font-mono"
        style={{
          fontSize: '10px',
          padding: '1px 6px',
          borderRadius: '4px',
          background: '#18181b',
          border: '1px solid #1f1f23',
          color: '#a1a1aa',
        }}
      >
        <span
          className="w-[5px] h-[5px] rounded-full animate-pulse"
          style={{ background: '#22c55e' }}
        />
        {item.badge}
      </span>
    );
  }
  if (item.count != null) {
    return (
      <span
        className="font-mono"
        style={{
          fontSize: '10.5px',
          padding: '1px 6px',
          borderRadius: '999px',
          background: item.dot ? '#836EF9' : '#18181b',
          border: item.dot ? 'none' : '1px solid #1f1f23',
          color: item.dot ? 'white' : '#52525b',
        }}
      >
        {item.count}
      </span>
    );
  }
  if (item.hot) {
    return <Flame className="w-[14px] h-[14px]" strokeWidth={1.75} style={{ color: '#f59e0b' }} />;
  }
  if (item.kbd) {
    return (
      <span
        className="font-mono"
        style={{
          fontSize: '10px',
          color: '#52525b',
          letterSpacing: '0.05em',
          opacity: 0,
          transition: 'opacity 120ms',
        }}
        data-side-kbd
      >
        {item.kbd}
      </span>
    );
  }
  return null;
}
