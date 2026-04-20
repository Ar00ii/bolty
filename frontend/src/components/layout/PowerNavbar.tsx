'use client';

import { Bell, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useMemo, useRef, useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function humanizeSegment(seg: string): string {
  // Don't try to humanize IDs (uuid-ish) — keep them as-is but shortened
  if (seg.length > 20 && /^[a-z0-9-]+$/i.test(seg)) return `${seg.slice(0, 6)}…${seg.slice(-4)}`;
  if (/^[0-9a-f]{24,}$/i.test(seg)) return `${seg.slice(0, 6)}…${seg.slice(-4)}`;
  return seg
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: 'Overview', href: '/' }];
  const crumbs: Crumb[] = [];
  let acc = '';
  for (const p of parts) {
    acc += '/' + p;
    crumbs.push({ label: humanizeSegment(p), href: acc });
  }
  return crumbs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main navbar
// ─────────────────────────────────────────────────────────────────────────────

export function PowerNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    function onDocClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [profileOpen]);

  const initials =
    (user?.displayName || user?.username || 'U')
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 px-[18px]"
      style={{
        height: '56px',
        borderBottom: '1px solid #1f1f23',
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[13px] min-w-0 shrink">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <React.Fragment key={c.href + i}>
              {i > 0 && (
                <span className="font-mono shrink-0" style={{ color: '#52525b' }}>
                  /
                </span>
              )}
              <Link
                href={c.href}
                className="transition-colors truncate"
                style={{
                  color: isLast ? '#e4e4e7' : '#71717a',
                  fontWeight: isLast ? 400 : 300,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e4e4e7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isLast ? '#e4e4e7' : '#71717a')}
              >
                {c.label}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Command search */}
      <button
        type="button"
        className="hidden md:flex items-center gap-[10px] rounded-lg transition-colors"
        style={{
          width: '360px',
          maxWidth: '36vw',
          padding: '7px 10px',
          background: '#0c0c0f',
          border: '1px solid #1f1f23',
          color: '#52525b',
          fontSize: '12.5px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#2a2a30';
          e.currentTarget.style.color = '#71717a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#1f1f23';
          e.currentTarget.style.color = '#52525b';
        }}
      >
        <Search className="w-[13px] h-[13px] shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left truncate">Search agents, repos, addresses, tx…</span>
        <span className="flex gap-[3px] shrink-0">
          <kbd
            className="font-mono rounded"
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              background: '#18181b',
              border: '1px solid #2a2a30',
              color: '#71717a',
            }}
          >
            ⌘
          </kbd>
          <kbd
            className="font-mono rounded"
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              background: '#18181b',
              border: '1px solid #2a2a30',
              color: '#71717a',
            }}
          >
            K
          </kbd>
        </span>
      </button>

      {/* Notification bell */}
      <button
        type="button"
        onClick={() => router.push('/notifications')}
        className="relative grid place-items-center rounded-lg transition-colors"
        style={{ width: '32px', height: '32px', color: '#71717a' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#e4e4e7';
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#71717a';
          e.currentTarget.style.background = 'transparent';
        }}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-[15px] h-[15px]" strokeWidth={1.6} />
        {/* Placeholder count — wire to real unread count later */}
        <span
          className="absolute inline-flex items-center justify-center"
          style={{
            top: '2px',
            right: '2px',
            minWidth: '15px',
            height: '15px',
            padding: '0 4px',
            borderRadius: '999px',
            background: '#836EF9',
            color: 'white',
            fontSize: '9.5px',
            fontWeight: 600,
            lineHeight: 1,
            border: '1.5px solid #09090b',
          }}
        >
          3
        </span>
      </button>

      {/* Avatar */}
      <div ref={profileRef} className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="relative flex items-center gap-2 rounded-full transition-colors"
          style={{ padding: '3px' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          aria-label="Account menu"
        >
          {user?.avatarUrl ? (
            <span
              className="grid place-items-center rounded-full overflow-hidden"
              style={{
                width: '28px',
                height: '28px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            </span>
          ) : (
            <span
              className="grid place-items-center rounded-full font-mono text-white"
              style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #ec4899, #836EF9)',
                fontSize: '10.5px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {initials}
            </span>
          )}
          <span
            className="absolute rounded-full"
            style={{
              bottom: '2px',
              right: '2px',
              width: '9px',
              height: '9px',
              background: '#22c55e',
              border: '2px solid #09090b',
            }}
          />
        </button>

        {profileOpen && (
          <div
            className="absolute right-0 mt-2 rounded-xl py-1 overflow-hidden"
            style={{
              top: 'calc(100% + 4px)',
              minWidth: '200px',
              background: '#121214',
              border: '1px solid #2a2a30',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div className="px-3 py-2" style={{ borderBottom: '1px solid #1f1f23' }}>
              <p className="text-[13px] truncate" style={{ color: '#e4e4e7' }}>
                {user?.displayName || user?.username || 'Account'}
              </p>
              {user?.username && (
                <p className="text-[11px] truncate" style={{ color: '#71717a' }}>
                  @{user.username}
                </p>
              )}
            </div>
            <DropdownLink href="/profile" label="Profile" onSelect={() => setProfileOpen(false)} />
            <DropdownLink href="/orders" label="Orders" onSelect={() => setProfileOpen(false)} />
            <DropdownLink
              href="/api-keys"
              label="API Keys"
              onSelect={() => setProfileOpen(false)}
            />
            <DropdownLink
              href="/profile?tab=security"
              label="Settings"
              onSelect={() => setProfileOpen(false)}
            />
            <button
              type="button"
              onClick={async () => {
                setProfileOpen(false);
                await logout?.();
                router.push('/');
              }}
              className="w-full text-left px-3 py-2 text-[13px] transition-colors"
              style={{ color: '#ef4444', borderTop: '1px solid #1f1f23' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticker — hidden on narrow screens. Stub values; wire to real feeds later.
// ─────────────────────────────────────────────────────────────────────────────

function Ticker() {
  return (
    <div
      className="hidden xl:flex items-center gap-[14px] rounded-full"
      style={{
        marginLeft: '18px',
        padding: '5px 14px',
        background: '#0c0c0f',
        border: '1px solid #1f1f23',
      }}
    >
      <TickerItem label="MON" value="$0.328" delta="+4.21%" up />
      <TickerSep />
      <TickerItem label="GAS" value="12 gwei" />
      <TickerSep />
      <TickerItem label="RAYS" value="2,847" delta="+18" up />
    </div>
  );
}

function TickerSep() {
  return <span style={{ width: '1px', height: '14px', background: '#1f1f23' }} />;
}

function TickerItem({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-[6px] font-mono" style={{ fontSize: '11px' }}>
      <span
        style={{
          color: '#52525b',
          fontSize: '10px',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </span>
      <span style={{ color: '#e4e4e7' }}>{value}</span>
      {delta && (
        <span style={{ color: up ? '#22c55e' : '#ef4444', fontSize: '10.5px' }}>{delta}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function DropdownLink({
  href,
  label,
  onSelect,
}: {
  href: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="block px-3 py-2 text-[13px] transition-colors"
      style={{ color: '#a1a1aa' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.color = '#e4e4e7';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#a1a1aa';
      }}
    >
      {label}
    </Link>
  );
}
