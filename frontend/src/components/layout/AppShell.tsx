'use client';

import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  FileText,
  GitBranch,
  Hash,
  Heart,
  Home,
  Key,
  LayoutGrid,
  Library,
  LifeBuoy,
  LogOut,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  User,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
    id: 'discover',
    label: 'Discover',
    items: [
      { href: '/market', label: 'Marketplace', icon: LayoutGrid, expandable: true },
      { href: '/reputation/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    id: 'workspace',
    label: 'My work',
    items: [
      { href: '/market/library', label: 'Library', icon: Library },
      { href: '/market/favorites', label: 'Saved', icon: Heart },
      { href: '/orders', label: 'Orders', icon: ShoppingBag, expandable: true },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    items: [
      { href: '/chat', label: 'Chat', icon: MessageSquare },
      { href: '/dm', label: 'Messages', icon: MessageCircle },
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      { href: '/profile?tab=wallet', label: 'Wallet', icon: Wallet },
      { href: '/profile', label: 'Settings', icon: Settings, expandable: true },
      { href: '/how-it-works', label: 'How it works', icon: FileText },
      { href: '/docs/agent-protocol', label: 'Docs', icon: BookOpen },
      { href: '/help', label: 'Help', icon: LifeBuoy },
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
  { prefix: '/how-it-works', title: 'How it works' },
  { prefix: '/docs', title: 'Docs' },
  { prefix: '/reputation', title: 'Reputation' },
  { prefix: '/profile', title: 'Profile' },
  { prefix: '/repos', title: 'Repositories' },
  { prefix: '/u/', title: 'Profile' },
  { prefix: '/help', title: 'Support' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
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

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      router.push('/');
    }
  }, [logout, router]);

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
              {group.label && group.items.length > 0 && (
                <div className="mk-sidebar__group-label">{group.label}</div>
              )}
              <NavList items={group.items} pathname={pathname} />
            </React.Fragment>
          ))}
        </nav>

        <div className="mk-sidebar__footer">
          <div className="mk-sidebar__user mk-sidebar__user--compact">
            <Link
              href="/profile"
              className="mk-sidebar__avatar mk-sidebar__avatar--sm"
              aria-label="Open profile settings"
            >
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={displayName} />
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </Link>
            <span className="mk-sidebar__name mk-sidebar__name--muted" title={displayName}>
              {user?.username || shortName.toLowerCase()}
            </span>
            <SidebarMoreMenu onLogout={handleLogout} />
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="mk-icon-btn mk-icon-btn--bell"
            >
              <span className="mk-icon-btn__dot" aria-hidden />
              <Bell size={14} strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </aside>

      <div className="mk-main">
        <header className="mk-topbar">
          <div className="mk-topbar__left">
            <Link
              href="/"
              className="mk-topbar__home"
              aria-label="Back to landing page"
              title="Back to landing"
            >
              <Home size={14} strokeWidth={1.75} />
              <span>Landing</span>
            </Link>
          </div>
          <div className="mk-topbar__center">
            <span className="mk-topbar__title">{topbarTitle}</span>
          </div>
          <div className="mk-topbar__right">
            <Link href="/profile" aria-label="Settings" title="Settings" className="mk-icon-btn">
              <Settings size={16} strokeWidth={1.75} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="mk-main__scroll" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarMoreMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="mk-more">
      <button
        ref={btnRef}
        type="button"
        aria-label="Settings & more"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={open ? 'mk-icon-btn mk-icon-btn--active' : 'mk-icon-btn'}
        title="Settings"
      >
        <MoreHorizontal size={14} strokeWidth={1.75} />
      </button>
      {open && (
        <div ref={popRef} role="menu" className="mk-more__pop">
          <div className="mk-more__header">
            <Settings size={12} strokeWidth={1.75} />
            <span>Settings</span>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            className="mk-more__item"
            onClick={() => setOpen(false)}
          >
            <User size={13} strokeWidth={1.75} />
            <span>Profile & account</span>
          </Link>
          <Link
            href="/profile?tab=api-keys"
            role="menuitem"
            className="mk-more__item"
            onClick={() => setOpen(false)}
          >
            <Key size={13} strokeWidth={1.75} />
            <span>API keys</span>
          </Link>
          <Link
            href="/profile?tab=security"
            role="menuitem"
            className="mk-more__item"
            onClick={() => setOpen(false)}
          >
            <ShieldCheck size={13} strokeWidth={1.75} />
            <span>Security & 2FA</span>
          </Link>
          <Link
            href="/profile?tab=wallet"
            role="menuitem"
            className="mk-more__item"
            onClick={() => setOpen(false)}
          >
            <Wallet size={13} strokeWidth={1.75} />
            <span>Wallet</span>
          </Link>
          <div className="mk-more__sep" />
          <Link href="/" role="menuitem" className="mk-more__item" onClick={() => setOpen(false)}>
            <Home size={13} strokeWidth={1.75} />
            <span>Back to landing</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            className="mk-more__item mk-more__item--danger"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut size={13} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

function NavList({ items, pathname }: { items: NavItem[]; pathname: string | null }) {
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
  const base = href.split('?')[0];
  if (pathname === base) return true;
  return pathname.startsWith(base + '/');
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
