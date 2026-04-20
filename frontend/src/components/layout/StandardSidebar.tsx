'use client';

import {
  Bell,
  BookOpen,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Flame,
  Heart,
  LayoutGrid,
  Library,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  Search,
  Settings,
  ShoppingBag,
  Trophy,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  count?: number;
  badge?: string;
  hot?: boolean;
  dot?: boolean;
  kbd?: string;
  expandable?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    section: 'Discover',
    items: [
      { label: 'Marketplace', icon: LayoutGrid, href: '/market', expandable: true },
      { label: 'Leaderboard', icon: Trophy, href: '/reputation/leaderboard' },
    ],
  },
  {
    section: 'My work',
    items: [
      { label: 'Library', icon: Library, href: '/market/library' },
      { label: 'Saved', icon: Heart, href: '/market/favorites' },
      { label: 'Orders', icon: ShoppingBag, href: '/orders', expandable: true },
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
      { label: 'Wallet', icon: Wallet, href: '/profile?tab=wallet' },
      { label: 'Settings', icon: Settings, href: '/profile', expandable: true },
      { label: 'How it works', icon: FileText, href: '/how-it-works' },
      { label: 'Docs', icon: BookOpen, href: '/docs/agent-protocol' },
      { label: 'Help', icon: LifeBuoy, href: '/help' },
    ],
  },
];

function isItemActive(pathname: string, href: string): boolean {
  const cleanHref = href.split('?')[0];
  if (cleanHref === '/market') return pathname === '/market';
  if (cleanHref === '/profile') return pathname === '/profile' || pathname.startsWith('/profile/');
  return pathname === cleanHref || pathname.startsWith(cleanHref + '/');
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function StandardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const walletAddress = user?.walletAddress ?? '0x4f2a0000000000000000000000000000000000E91c';

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
      <button
        type="button"
        className="grid items-center text-left h-14 px-[14px] gap-[10px] transition-colors hover:bg-white/[0.02]"
        style={{
          gridTemplateColumns: '30px 1fr 16px',
          borderBottom: '1px solid #1f1f23',
        }}
      >
        <div
          className="w-[30px] h-[30px] grid place-items-center font-mono font-semibold text-[14px] text-white rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #836EF9 0%, #5b3fd1 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 14px rgba(131,110,249,0.25)',
          }}
        >
          B
        </div>
        <div className="min-w-0">
          <div className="text-[13px] truncate" style={{ color: '#e4e4e7', fontWeight: 400 }}>
            {user?.displayName || user?.username
              ? `${user.displayName || user.username}'s Workspace`
              : 'Bolty Workspace'}
          </div>
          <div
            className="flex items-center gap-[6px] font-mono text-[10.5px] mt-[1px]"
            style={{ color: '#71717a' }}
          >
            <span
              className="w-[6px] h-[6px] rounded-full"
              style={{
                background: '#22c55e',
                boxShadow: '0 0 8px rgba(34,197,94,0.6)',
              }}
            />
            Bolty Mainnet
          </div>
        </div>
        <ChevronsUpDown
          className="w-[14px] h-[14px]"
          style={{ color: '#52525b' }}
          strokeWidth={1.75}
        />
      </button>

      {/* Search trigger */}
      <button
        type="button"
        className="mx-3 mt-3 mb-2 flex items-center gap-2 px-[10px] py-[7px] rounded-lg text-[12.5px] transition-colors"
        style={{
          background: '#09090b',
          border: '1px solid #1f1f23',
          color: '#71717a',
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
            color: '#71717a',
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
              style={{ color: '#52525b', letterSpacing: '0.12em' }}
            >
              {sect.section}
            </div>
            {sect.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(pathname, item.href);
              return <SidebarItem key={item.label} item={item} Icon={Icon} active={active} />;
            })}
          </div>
        ))}
      </div>

      {/* Wallet footer */}
      <div
        className="p-3"
        style={{
          borderTop: '1px solid #1f1f23',
          background: 'linear-gradient(180deg, transparent, rgba(131,110,249,0.04))',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[6px]">
            <span
              className="w-[6px] h-[6px] rounded-full"
              style={{
                background: '#22c55e',
                boxShadow: '0 0 8px rgba(34,197,94,0.6)',
              }}
            />
            <span className="font-mono text-[11px]" style={{ color: '#a1a1aa' }}>
              {shortenAddress(walletAddress)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => logout?.()}
            className="font-mono text-[10px] transition-colors"
            style={{ color: '#52525b' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
          >
            disconnect
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SidebarItem({ item, Icon, active }: { item: NavItem; Icon: LucideIcon; active: boolean }) {
  const iconColor = active ? '#a594ff' : '#71717a';

  return (
    <Link
      href={item.href}
      className="grid items-center gap-[10px] px-[10px] py-[7px] rounded-md transition-colors group relative"
      style={{
        gridTemplateColumns: '10px 16px 1fr auto',
        color: active ? '#e4e4e7' : '#a1a1aa',
        background: active ? 'rgba(131,110,249,0.08)' : 'transparent',
        fontSize: '13px',
        fontWeight: 300,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = '#e4e4e7';
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        }
        const iconEl = e.currentTarget.querySelector<HTMLElement>('[data-side-icon]');
        if (iconEl) iconEl.style.color = '#a594ff';
        const kbdEl = e.currentTarget.querySelector<HTMLElement>('[data-side-kbd]');
        if (kbdEl) kbdEl.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = '#a1a1aa';
          e.currentTarget.style.background = 'transparent';
        }
        const iconEl = e.currentTarget.querySelector<HTMLElement>('[data-side-icon]');
        if (iconEl) iconEl.style.color = iconColor;
        const kbdEl = e.currentTarget.querySelector<HTMLElement>('[data-side-kbd]');
        if (kbdEl) kbdEl.style.opacity = '0';
      }}
    >
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
      <SidebarItemMeta item={item} />
    </Link>
  );
}

function SidebarItemMeta({ item }: { item: NavItem }) {
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
  if (item.expandable) {
    return (
      <ChevronRight className="w-[14px] h-[14px]" strokeWidth={1.75} style={{ color: '#52525b' }} />
    );
  }
  return null;
}
