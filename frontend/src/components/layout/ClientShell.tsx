'use client';

import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';

import { BackToTop } from '@/components/layout/BackToTop';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { FloatingTopBar } from '@/components/layout/FloatingTopBar';
import { PowerNavbar } from '@/components/layout/PowerNavbar';
import { ShortcutsModal } from '@/components/layout/ShortcutsModal';
import { StandardSidebar } from '@/components/layout/StandardSidebar';
import { UnifiedHeader } from '@/components/layout/UnifiedHeader';
import { useGoToShortcuts } from '@/lib/hooks/useGoToShortcuts';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useGoToShortcuts();

  const isHome = pathname === '/';
  const isAuth = pathname.startsWith('/auth');
  const isLegal = pathname === '/terms' || pathname === '/privacy';
  const useAppShell = !isHome && !isAuth && !isLegal;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, [pathname]);

  if (useAppShell) {
    return (
      <div className="mk-scope min-h-screen" style={{ background: '#09090b' }}>
        <CommandPalette />
        <ShortcutsModal />
        <BackToTop />
        <div className="flex">
          <StandardSidebar />
          <div className="flex-1 w-full min-w-0 flex flex-col">
            <PowerNavbar />
            <main id="main-content" tabIndex={-1} className="flex-1 relative focus:outline-none">
              {children}
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <CommandPalette />
      <ShortcutsModal />
      {!isAuth && <FloatingTopBar />}
      {!isAuth && <BackToTop />}
      {!isAuth && <UnifiedHeader />}

      <div className={`flex ${!isHome && !isAuth && !isLegal ? 'pt-16' : ''}`}>
        <div className="flex-1 w-full min-w-0">
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 relative min-h-screen focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
