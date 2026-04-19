'use client';

import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  ChevronRight,
  FileText,
  GitBranch,
  Hash,
  Heart,
  LayoutGrid,
  Library,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Trophy,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  expandable?: boolean;
}

interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'primary',
    items: [
      { href: '/market', label: 'Marketplace', icon: LayoutGrid, expandable: true },
      { href: '/market/agents', label: 'Agents', icon: Bot },
      { href: '/market/repos', label: 'Repos', icon: GitBranch },
      { href: '/market/sellers', label: 'Sellers', icon: Users },
      { href: '/market/tags', label: 'Tags', icon: Hash },
    ],
  },
  {
    id: 'workspace',
    items: [
      { href: '/market/library', label: 'Library', icon: Library },
      { href: '/market/favorites', label: 'Saved', icon: Heart },
      { href: '/market/seller', label: 'Seller', icon: BarChart3, expandable: true },
      { href: '/orders', label: 'Orders', icon: ShoppingBag },
    ],
  },
  {
    id: 'community',
    items: [
      { href: '/chat', label: 'Chat', icon: MessageSquare },
      { href: '/dm', label: 'Messages', icon: MessageCircle },
      { href: '/reputation/leaderboard', label: 'Leaderboard', icon: Trophy },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    id: 'other',
    items: [
      { href: '/services', label: 'Services', icon: Briefcase },
      { href: '/how-it-works', label: 'How it works', icon: FileText },
      { href: '/docs/agent-protocol', label: 'Docs', icon: BookOpen, expandable: true },
    ],
  },
  {
    id: 'account',
    items: [
      { href: '/profile/wallet', label: 'Wallet', icon: Wallet },
      { href: '/help', label: 'Support', icon: LifeBuoy },
      { href: '/profile', label: 'Settings', icon: Settings, expandable: true },
    ],
  },
];

const TITLE_MAP: { prefix: string; title: string }[] = [
  { prefix: '/market/agents', title: 'Agents' },
  { prefix: '/market/repos', title: 'Repos' },
  { prefix: '/market/sellers', title: 'Sellers' },
  { prefix: '/market/tags', title: 'Tags' },
  { prefix: '/market/library', title: 'Library' },
  { prefix: '/market/favorites', title: 'Saved' },
  { prefix: '/market/seller', title: 'Seller' },
  { prefix: '/market', title: 'Marketplace' },
  { prefix: '/orders', title: 'Orders' },
  { prefix: '/chat', title: 'Chat' },
  { prefix: '/dm', title: 'Messages' },
  { prefix: '/notifications', title: 'Notifications' },
  { prefix: '/services', title: 'Services' },
  { prefix: '/how-it-works', title: 'How it works' },
  { prefix: '/docs', title: 'Docs' },
  { prefix: '/reputation', title: 'Reputation' },
  { prefix: '/profile/wallet', title: 'Wallet' },
  { prefix: '/profile', title: 'Profile' },
  { prefix: '/repos', title: 'Repositories' },
  { prefix: '/u/', title: 'Profile' },
  { prefix: '/help', title: 'Support' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sidebarSearch, setSidebarSearch] = useState('');

  const displayName = user?.displayName || user?.username || 'Guest';
  const shortName = useMemo(() => {
    if (displayName.length <= 14) return displayName;
    return displayName.slice(0, 13) + '…';
  }, [displayName]);
  const topbarTitle = useMemo(() => {
    if (!pathname || pathname === '/') return 'Overview';
    const found = TITLE_MAP.find((m) => pathname.startsWith(m.prefix));
    return found?.title || 'Overview';
  }, [pathname]);

  const groups = useMemo(() => filterGroups(NAV_GROUPS, sidebarSearch), [sidebarSearch]);

  return (
    <div className="mk-scope mk-shell">
      <aside className="mk-sidebar" aria-label="Primary navigation">
        <div className="mk-sidebar__search">
          <Search size={14} strokeWidth={1.75} className="mk-sidebar__search-icon" />
          <input
            type="text"
            placeholder="Find…"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            aria-label="Search navigation"
          />
          <kbd className="mk-kbd mk-kbd--sm">F</kbd>
        </div>

        <nav className="mk-sidebar__nav" aria-label="Sections">
          {groups.map((group, idx) => (
            <React.Fragment key={group.id}>
              {idx > 0 && group.items.length > 0 && <div className="mk-sidebar__divider" />}
              <NavList items={group.items} pathname={pathname} />
            </React.Fragment>
          ))}
        </nav>

        <div className="mk-sidebar__footer">
          <div className="mk-sidebar__user mk-sidebar__user--compact">
            <div className="mk-sidebar__avatar mk-sidebar__avatar--sm">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={displayName} />
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span
              className="mk-sidebar__name mk-sidebar__name--muted"
              title={displayName}
            >
              {user?.username || shortName.toLowerCase()}
            </span>
            <button type="button" aria-label="More" className="mk-icon-btn">
              <MoreHorizontal size={14} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="mk-icon-btn mk-icon-btn--bell"
            >
              <span className="mk-icon-btn__dot" aria-hidden />
              <Bell size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <div className="mk-main">
        <header className="mk-topbar">
          <div className="mk-topbar__left" />
          <div className="mk-topbar__center">
            <span className="mk-topbar__title">{topbarTitle}</span>
          </div>
          <div className="mk-topbar__right">
            <button type="button" className="mk-icon-btn" aria-label="More">
              <MoreHorizontal size={16} strokeWidth={1.75} />
            </button>
          </div>
        </header>
        <main id="main-content" className="mk-main__scroll" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavList({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string | null;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mk-nav">
      {items.map((item) => {
        const isActive = isRouteActive(item.href, pathname);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={isActive ? 'mk-nav-row mk-nav-row--active' : 'mk-nav-row'}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon size={14} strokeWidth={1.75} className="mk-nav-row__icon" />
              <span className="mk-nav-row__label">{item.label}</span>
              {item.expandable && (
                <ChevronRight
                  size={12}
                  strokeWidth={1.75}
                  className="mk-nav-row__chevron"
                  aria-hidden
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function isRouteActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === '/market' && pathname === '/market') return true;
  if (href === '/market' && pathname.startsWith('/market/')) return false;
  if (pathname === href) return true;
  return pathname.startsWith(href + '/');
}

function filterGroups(groups: NavGroup[], query: string): NavGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);
}

// Keep dynamic icon refs alive for future use.
void Package;
void Zap;
