'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MOBILE_TABS, isPathActive } from '@/lib/nav-config';

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="mk-mobile-tabbar lg:hidden"
      role="navigation"
      aria-label="Primary"
    >
      {MOBILE_TABS.map((t) => {
        const active = isPathActive(pathname, t.href);
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
