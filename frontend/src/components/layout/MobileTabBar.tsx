'use client';

import { Mail, MessageSquare, Package, Store, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS: Array<{
  href: string;
  label: string;
  icon: typeof Store;
  matches: (pathname: string) => boolean;
}> = [
  {
    href: '/market',
    label: 'Market',
    icon: Store,
    matches: (p) => p === '/market' || p.startsWith('/market/'),
  },
  {
    href: '/feed',
    label: 'Feed',
    icon: MessageSquare,
    matches: (p) => p === '/feed' || p.startsWith('/feed/'),
  },
  {
    href: '/inventory',
    label: 'Items',
    icon: Package,
    matches: (p) => p === '/inventory',
  },
  {
    href: '/dm',
    label: 'Messages',
    icon: Mail,
    matches: (p) => p === '/dm' || p.startsWith('/dm/'),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
    matches: (p) => p === '/profile' || p.startsWith('/profile/'),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="mk-mobile-tabbar lg:hidden"
      role="navigation"
      aria-label="Primary"
    >
      {TABS.map((t) => {
        const active = t.matches(pathname);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`mk-mobile-tab ${active ? 'mk-mobile-tab--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className="mk-mobile-tab__icon"
              strokeWidth={active ? 2.2 : 1.8}
              aria-hidden
            />
            <span className="mk-mobile-tab__label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
