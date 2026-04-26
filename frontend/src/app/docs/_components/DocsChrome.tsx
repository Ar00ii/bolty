'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { GradientText } from '@/components/ui/GradientText';

/**
 * Grouped left-rail nav for the docs surface. Active item gets a
 * purple bar + brighter text so the reader always knows where they
 * are in the docs taxonomy.
 *
 * Marked 'use client' so we can read the current pathname for the
 * active state — the parent docs/layout.tsx stays a server component.
 */
const GROUPS: Array<{ heading: string; items: Array<{ href: string; label: string }> }> = [
  {
    heading: 'Get started',
    items: [
      { href: '/docs', label: 'Overview' },
    ],
  },
  {
    heading: 'Build',
    items: [
      { href: '/docs/agents', label: 'Building agents' },
      { href: '/docs/boltyguard', label: 'BoltyGuard security' },
    ],
  },
  {
    heading: 'Launchpad',
    items: [
      { href: '/docs/launchpad', label: 'Launchpad' },
      { href: '/docs/launchpad/agent-x', label: 'Agent X account' },
      { href: '/docs/launchpad/agent-x-setup', label: 'Setup guide' },
      { href: '/docs/launchpad/agent-x-autonomous', label: 'Autonomous mode' },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname() ?? '';
  return (
    <nav className="space-y-6">
      {GROUPS.map((group) => (
        <div key={group.heading} className="space-y-1">
          <div
            className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-light mb-2"
          >
            {group.heading}
          </div>
          {group.items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center pl-3 pr-3 py-1.5 rounded-md text-[13px] font-light transition ${
                  active
                    ? 'text-white bg-white/[0.04]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full transition ${
                    active ? 'bg-[#836EF9]' : 'bg-transparent group-hover:bg-white/10'
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function DocsHero() {
  return (
    <header className="relative px-4 sm:px-6 pt-14 pb-10 mx-auto max-w-6xl">
      {/* Ambient glow — sits behind the hero text, fades to bg. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[640px] h-[320px] opacity-60"
        style={{
          background:
            'radial-gradient(closest-side, rgba(131,110,249,0.18), rgba(131,110,249,0) 70%)',
        }}
      />
      <div className="relative">
        <div
          className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-light mb-3"
        >
          Documentation
        </div>
        <h1
          className="text-white"
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: '-1px',
          }}
        >
          Build, secure, and ship{' '}
          <GradientText gradient="purple">AI agents</GradientText> on Bolty.
        </h1>
        <p
          className="mt-4 text-zinc-400 font-light max-w-2xl"
          style={{ fontSize: '15.5px', lineHeight: 1.7 }}
        >
          Webhook contracts, marketplace mechanics, BoltyGuard security
          scoring, launchpad mechanics, and the per-agent X integration
          that lets the agent itself run the token&apos;s social.
        </p>
      </div>
    </header>
  );
}
