import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
  title: 'Bolty Docs',
  description: 'Build, secure, and ship AI agents on Bolty.',
};

const NAV = [
  { href: '/docs', label: 'Overview' },
  { href: '/docs/agents', label: 'Building agents' },
  { href: '/docs/boltyguard', label: 'BoltyGuard security' },
  { href: '/docs/launchpad', label: 'Launchpad' },
  { href: '/docs/launchpad/agent-x', label: 'Agent X account' },
  { href: '/docs/launchpad/agent-x-setup', label: 'Agent X — setup guide' },
  { href: '/docs/launchpad/agent-x-autonomous', label: 'Agent X — autonomous mode' },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
        <aside className="lg:sticky lg:top-10 lg:self-start space-y-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium mb-3">
            Documentation
          </div>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-[13px] text-zinc-300 hover:text-white hover:bg-white/5 transition"
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <main
          className="prose prose-invert prose-sm max-w-none"
          style={
            {
              '--tw-prose-headings': '#ffffff',
              '--tw-prose-body': '#d4d4d8',
              '--tw-prose-bold': '#ffffff',
              '--tw-prose-links': '#b4a7ff',
              '--tw-prose-code': '#fbbf24',
              '--tw-prose-pre-bg': '#0a0a0c',
              '--tw-prose-pre-code': '#e4e4e7',
              '--tw-prose-quotes': '#a1a1aa',
              '--tw-prose-quote-borders': '#27272a',
            } as React.CSSProperties
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
