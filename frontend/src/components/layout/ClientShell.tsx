'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { StaggeredMenu } from '@/components/layout/StaggeredMenu';
import { FloatingAIChat } from '@/components/ui/FloatingAIChat';
import { Footer } from '@/components/ui/footer-section';
import { useUnreadDMs } from '@/lib/hooks/useUnreadDMs';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadDMs = useUnreadDMs(isAuthenticated);
  const isHome = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      {/* StaggeredMenu — fixed overlay, does NOT block page content */}
      <StaggeredMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onToggle={() => setMenuOpen(v => !v)}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={logout}
        unreadDMs={unreadDMs}
      />

      <main className="flex-1 pt-16 relative">
        {!isHome && (
          <div className="fixed top-4 left-4 z-30" style={{ left: '5rem' }}>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200
                         px-2.5 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-600
                         bg-zinc-900/80 backdrop-blur-sm transition-all duration-150"
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

      <Footer />
      <FloatingAIChat />
    </div>
  );
}
