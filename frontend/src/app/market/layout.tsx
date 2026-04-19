'use client';

import {
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Hash,
  Heart,
  LayoutGrid,
  Library,
  LifeBuoy,
  MoreHorizontal,
  Search,
  Settings,
  Users,
  Wallet,
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

const PRIMARY_NAV: NavItem[] = [
  { href: '/market', label: 'Overview', icon: LayoutGrid },
  { href: '/market/agents', label: 'Agents', icon: Bot },
  { href: '/market/repos', label: 'Repos', icon: GitBranch },
  { href: '/market/sellers', label: 'Sellers', icon: Users, expandable: true },
  { href: '/market/tags', label: 'Tags', icon: Hash },
];

const SECONDARY_NAV: NavItem[] = [
  { href: '/market/library', label: 'Library', icon: Library },
  { href: '/market/favorites', label: 'Saved', icon: Heart },
  { href: '/market/seller', label: 'Seller', icon: BarChart3, expandable: true },
];

const BOTTOM_NAV: NavItem[] = [
  { href: '/profile/wallet', label: 'Wallet', icon: Wallet },
  { href: '/help', label: 'Support', icon: LifeBuoy },
  { href: '/profile', label: 'Settings', icon: Settings, expandable: true },
];

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sidebarSearch, setSidebarSearch] = useState('');

  const displayName = user?.displayName || user?.username || 'Guest';
  const shortName = useMemo(() => {
    if (displayName.length <= 14) return displayName;
    return displayName.slice(0, 13) + '…';
  }, [displayName]);
  const plan = useMemo(() => {
    const role = (user?.role || 'USER').toUpperCase();
    if (role === 'ADMIN') return 'Pro';
    if (role === 'SELLER') return 'Seller';
    return 'Hobby';
  }, [user?.role]);

  const topbarTitle = useMemo(() => {
    if (!pathname) return 'Overview';
    if (pathname === '/market') return 'Overview';
    if (pathname.startsWith('/market/agents')) return 'Agents';
    if (pathname.startsWith('/market/repos')) return 'Repos';
    if (pathname.startsWith('/market/sellers')) return 'Sellers';
    if (pathname.startsWith('/market/tags')) return 'Tags';
    if (pathname.startsWith('/market/library')) return 'Library';
    if (pathname.startsWith('/market/favorites')) return 'Saved';
    if (pathname.startsWith('/market/seller')) return 'Seller';
    return 'Overview';
  }, [pathname]);

  return (
    <div className="mk-scope mk-shell">
      <aside className="mk-sidebar" aria-label="Marketplace navigation">
        <div className="mk-sidebar__user">
          <div className="mk-sidebar__avatar">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={displayName} />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="mk-sidebar__name" title={displayName}>
            {shortName}
          </span>
          <span className="mk-badge mk-badge--outline">{plan}</span>
          <button type="button" aria-label="Switch account" className="mk-icon-btn">
            <ChevronDown size={14} strokeWidth={1.75} />
          </button>
        </div>

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
          <NavList items={filterNav(PRIMARY_NAV, sidebarSearch)} pathname={pathname} />
          <div className="mk-sidebar__divider" />
          <NavList items={filterNav(SECONDARY_NAV, sidebarSearch)} pathname={pathname} />
          <div className="mk-sidebar__divider" />
          <NavList items={filterNav(BOTTOM_NAV, sidebarSearch)} pathname={pathname} />
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
            <button type="button" aria-label="Notifications" className="mk-icon-btn mk-icon-btn--bell">
              <span className="mk-icon-btn__dot" aria-hidden />
              <Bell size={14} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      <div className="mk-main">
        <header className="mk-topbar">
          <div className="mk-topbar__left">
            <button type="button" className="mk-scope-picker" aria-label="Scope">
              <span className="mk-scope-picker__dot" aria-hidden />
              <span className="mk-scope-picker__label">All Marketplace</span>
              <ChevronDown size={12} strokeWidth={1.75} />
            </button>
          </div>
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
        const isActive =
          pathname === item.href ||
          (item.href !== '/market' && pathname?.startsWith(item.href + '/')) ||
          (item.href === '/market' && pathname === '/market');
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

function filterNav(items: NavItem[], query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.label.toLowerCase().includes(q));
}
