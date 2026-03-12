'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { FloatingAIChat } from '@/components/ui/FloatingAIChat';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16 relative">
        {/* Discrete home button shown on all pages except home */}
        {!isHome && (
          <div className="absolute top-4 left-4 z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200
                         px-2.5 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-600
                         bg-zinc-900/60 backdrop-blur-sm transition-all duration-150"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </Link>
          </div>
        )}
        {children}
      </main>
      <footer
        className="border-t py-5 px-6 text-center text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <span className="text-monad-400 font-semibold">Bolty</span>
        <span className="mx-1.5" style={{ color: 'var(--text-muted)' }}>—</span>
        <span>AI Developer Platform</span>
        <span className="mx-3 opacity-30">|</span>
        <Link href="/chat" className="hover:text-monad-400 transition-colors">Community</Link>
        <span className="mx-2 opacity-30">·</span>
        <Link href="/market" className="hover:text-monad-400 transition-colors">Agents</Link>
        <span className="mx-2 opacity-30">·</span>
        <Link href="/repos" className="hover:text-monad-400 transition-colors">Repos</Link>
      </footer>

      {/* Floating AI Chat — bottom left */}
      <FloatingAIChat />
    </div>
  );
}
