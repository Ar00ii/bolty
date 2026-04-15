'use client';

import { gsap } from 'gsap';
import {
  Globe,
  Flame,
  Star,
  MessageSquare,
  UserCheck,
  ShoppingBag,
  Store,
  Code2,
  GitBranch,
  Package,
  Cpu,
  Bot,
  User as UserIcon,
  Settings,
  Wallet,
  LogOut,
  Key,
  UserPlus,
  Zap,
  Percent,
  Coins,
  Briefcase,
  ShoppingCart,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';

import './StaggeredMenu.css';
import type { User } from '@/lib/auth/AuthProvider';

// ── Types ──────────────────────────────────────────────────────────────────

interface SubItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavItem {
  label: string;
  href: string;
  badge?: boolean;
  sub: SubItem[];
}

// ── Nav data ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    label: 'How it Works',
    href: '/how-it-works',
    sub: [
      { href: '/how-it-works#roadmap', label: 'Trade Roadmap', icon: Zap },
      { href: '/how-it-works#fees', label: '2.5% Fee Info', icon: Percent },
      { href: '/how-it-works#bolty-token', label: '$BOLTY Token', icon: Coins },
    ],
  },
  {
    label: 'Community',
    href: '/chat',
    sub: [
      { href: '/chat', label: 'Global Chat', icon: Globe },
      { href: '/chat?tab=trending', label: 'Trending', icon: Flame },
      { href: '/chat?tab=discover', label: 'Discover', icon: Star },
    ],
  },
  {
    label: 'Messages',
    href: '/dm',
    badge: true,
    sub: [
      { href: '/dm', label: 'All', icon: MessageSquare },
      { href: '/dm?cat=friends', label: 'Friends', icon: UserCheck },
      { href: '/dm?cat=sellers', label: 'Sellers', icon: ShoppingBag },
      { href: '/dm?cat=vendors', label: 'Vendors', icon: Store },
    ],
  },
  {
    label: 'Market',
    href: '/market',
    sub: [
      { href: '/market', label: 'Overview', icon: ShoppingCart },
      { href: '/market/agents', label: 'AI Agents', icon: Bot },
      { href: '/market/agents?tab=mine', label: 'My Agents', icon: Cpu },
      { href: '/market/repos', label: 'Repos', icon: GitBranch },
      { href: '/market/repos?tab=mine', label: 'My Repos', icon: Code2 },
    ],
  },
  {
    label: 'Boost',
    href: '/profile?tab=agent',
    sub: [
      { href: '/profile?tab=agent', label: 'Buy Boost', icon: ShoppingCart },
      { href: '/profile?tab=agent', label: 'My Agent Boost', icon: Zap },
    ],
  },
  {
    label: 'Hire',
    href: '/services',
    sub: [
      { href: '/services', label: 'Browse Services', icon: Briefcase },
      { href: '/services?category=AI_DEVELOPMENT', label: 'AI Development', icon: Cpu },
      { href: '/services?category=SMART_CONTRACTS', label: 'Smart Contracts', icon: Zap },
    ],
  },
  {
    label: 'Docs',
    href: '/docs/agent-protocol',
    sub: [
      { href: '/docs/agent-protocol', label: 'Agent Protocol', icon: BookOpen },
      { href: '/docs/agent-protocol#request', label: 'Request Payload', icon: Code2 },
      { href: '/docs/agent-protocol#examples', label: 'Code Examples', icon: Package },
    ],
  },
];

const PROFILE_ITEM: NavItem = {
  label: 'Profile',
  href: '/profile',
  sub: [
    { href: '/profile', label: 'My Profile', icon: UserIcon },
    { href: '/profile?tab=wallet', label: 'Wallet', icon: Wallet },
    { href: '/api-keys', label: 'API Keys', icon: Key },
    { href: '/profile?tab=agent', label: 'AI Agent', icon: Cpu },
    { href: '/profile?tab=security', label: 'Security', icon: Settings },
  ],
};

// ── Props ──────────────────────────────────────────────────────────────────

interface StaggeredMenuProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user?: User | null;
  logout: () => void;
  unreadDMs?: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export function StaggeredMenu({
  open,
  onClose,
  isAuthenticated,
  user,
  logout,
  unreadDMs = 0,
}: StaggeredMenuProps) {
  const pathname = usePathname();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const panelRef = useRef<HTMLElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const busyRef = useRef(false);

  const displayLabel = user?.displayName || user?.username || user?.githubLogin || 'user';
  const visibleItems = isAuthenticated ? [...NAV_ITEMS, PROFILE_ITEM] : NAV_ITEMS;

  // Close on route change
  useEffect(() => {
    if (open) onClose();
    setExpandedItem(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Initial positions
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const pre = preLayersRef.current;
      if (!panel) return;
      const layers = pre ? Array.from(pre.querySelectorAll<HTMLElement>('.sm-prelayer')) : [];
      preLayerElsRef.current = layers;
      gsap.set([panel, ...layers], { xPercent: 100 });
    });
    return () => ctx.revert();
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) {
      busyRef.current = false;
      return;
    }

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll<HTMLElement>('.sm-panel-itemLabel'));
    const numEls = Array.from(
      panel.querySelectorAll<HTMLElement>('.sm-panel-list[data-numbering] .sm-panel-item'),
    );
    const socialTitle = panel.querySelector<HTMLElement>('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll<HTMLElement>('.sm-socials-link'));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 8 });
    if (numEls.length) gsap.set(numEls, { '--sm-num-opacity': 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 20, opacity: 0 });

    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        busyRef.current = false;
      },
    });

    layers.forEach((el, i) => {
      tl.fromTo(
        el,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.48, ease: 'power4.out' },
        i * 0.07,
      );
    });

    const panelStart = (layers.length - 1) * 0.07 + 0.08;
    tl.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: 0.62, ease: 'power4.out' },
      panelStart,
    );

    if (itemEls.length) {
      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 0.9, ease: 'power4.out', stagger: { each: 0.08 } },
        panelStart + 0.12,
      );
    }
    if (numEls.length) {
      tl.to(
        numEls,
        { duration: 0.5, ease: 'power2.out', '--sm-num-opacity': 1, stagger: { each: 0.07 } },
        panelStart + 0.18,
      );
    }
    if (socialTitle)
      tl.to(socialTitle, { opacity: 1, duration: 0.4, ease: 'power2.out' }, panelStart + 0.4);
    if (socialLinks.length)
      tl.to(
        socialLinks,
        { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: { each: 0.07 } },
        panelStart + 0.44,
      );

    openTlRef.current = tl;
    tl.play(0);
  }, []);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;
    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: 100,
      duration: 0.28,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        busyRef.current = false;
      },
    });
  }, []);

  useEffect(() => {
    if (open) playOpen();
    else playClose();
  }, [open, playOpen, playClose]);

  const toggleExpand = (href: string) => setExpandedItem((prev) => (prev === href ? null : href));

  return (
    <>
      {/* ── Panel wrapper (fixed, pointer-events: none on root) ──────────── */}
      <div
        className="staggered-menu-wrapper fixed-wrapper"
        style={{ '--sm-accent': '#836ef9' } as React.CSSProperties}
        data-position="right"
        data-open={open || undefined}
        aria-hidden={!open}
        /* pointer-events: none by default — panel has pointer-events: auto */
      >
        {/* Pre-layers */}
        <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
          <div className="sm-prelayer" style={{ background: '#1a1240' }} />
          <div className="sm-prelayer" style={{ background: '#2d1a6e' }} />
          <div className="sm-prelayer" style={{ background: '#4c2fcf' }} />
        </div>

        {/* Main panel */}
        <aside
          ref={panelRef}
          id="bolty-nav-panel"
          className="staggered-menu-panel"
          role="navigation"
          aria-label="Main navigation"
          aria-hidden={!open}
        >
          <div className="sm-panel-inner">
            <p className="sm-panel-title">Navigation</p>

            <ul className="sm-panel-list" role="list" data-numbering={true || undefined}>
              {visibleItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const isExpanded = expandedItem === item.href;
                const hasBadge = item.badge && isAuthenticated && unreadDMs > 0;

                return (
                  <li key={item.href} className="sm-panel-itemWrap">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Link
                        href={item.href}
                        className="sm-panel-item"
                        data-active={isActive || undefined}
                        onClick={() => onClose()}
                        aria-label={`Go to ${item.label}`}
                      >
                        <span className="sm-panel-itemLabel">{item.label}</span>
                        {hasBadge && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '0.2em',
                              right: '1.6em',
                              minWidth: 16,
                              height: 16,
                              padding: '0 4px',
                              background: '#836ef9',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 9999,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {unreadDMs > 99 ? '99+' : unreadDMs}
                          </span>
                        )}
                      </Link>
                      <button
                        onClick={() => toggleExpand(item.href)}
                        aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        style={{
                          background: isExpanded ? 'rgba(131,110,249,0.12)' : 'transparent',
                          border: isExpanded
                            ? '1px solid rgba(131,110,249,0.25)'
                            : '1px solid transparent',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: isExpanded ? '#836ef9' : 'rgba(255,255,255,0.4)',
                          padding: '0.5rem 0.75rem',
                          flexShrink: 0,
                          fontSize: '1.5rem',
                          lineHeight: 1,
                          minWidth: '2.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition:
                            'color 0.15s ease, transform 0.18s ease, background 0.15s ease',
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transformOrigin: '50% 50%',
                        }}
                      >
                        &gt;
                      </button>
                    </div>

                    {isExpanded && (
                      <ul className="sm-sub-list" role="list">
                        {item.sub.map((sub) => {
                          const SubIcon = sub.icon;
                          const subActive = pathname === sub.href;
                          return (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                className="sm-sub-link"
                                data-active={subActive || undefined}
                                onClick={() => onClose()}
                              >
                                <SubIcon
                                  style={{ width: 16, height: 16, flexShrink: 0 }}
                                  strokeWidth={1.5}
                                />
                                {sub.label}
                                {subActive && <span className="sm-sub-dot" />}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Socials */}
            <div className="sm-socials" aria-label="Social links">
              <h3 className="sm-socials-title">Socials</h3>
              <ul className="sm-socials-list" role="list">
                {[
                  { label: 'X', href: 'https://twitter.com/boltynetwork' },
                  { label: 'GitHub', href: 'https://github.com/boltynetwork' },
                ].map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sm-socials-link"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Auth footer */}
          <div className="sm-auth-footer">
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="sm-user-row" onClick={() => onClose()}>
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${displayLabel}'s profile picture`}
                      className="sm-user-avatar"
                    />
                  ) : (
                    <div className="sm-user-avatar-placeholder">
                      {displayLabel[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="sm-user-info-name">{displayLabel}</p>
                    <p className="sm-user-info-sub">View profile</p>
                  </div>
                </Link>
                <button
                  className="sm-signout-btn"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                >
                  <LogOut style={{ width: 13, height: 13 }} strokeWidth={1.5} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" className="sm-auth-btn-primary" onClick={() => onClose()}>
                  Sign in
                </Link>
                <Link
                  href="/auth?tab=register"
                  className="sm-auth-btn-secondary"
                  onClick={() => onClose()}
                >
                  <UserPlus style={{ width: 14, height: 14 }} strokeWidth={1.5} />
                  Create account
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

export default StaggeredMenu;
