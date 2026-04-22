'use client';

import { usePathname } from 'next/navigation';
import React, { Suspense, useEffect } from 'react';

import { BackToTop } from '@/components/layout/BackToTop';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { FloatingTopBar } from '@/components/layout/FloatingTopBar';
import { LiveToastBridge } from '@/components/layout/LiveToastBridge';
import { NegotiationPopToast } from '@/components/layout/NegotiationPopToast';
import { PowerNavbar } from '@/components/layout/PowerNavbar';
import { RouteProgress } from '@/components/layout/RouteProgress';
import { ShortcutsModal } from '@/components/layout/ShortcutsModal';
import { StandardSidebar } from '@/components/layout/StandardSidebar';
import { UnifiedHeader } from '@/components/layout/UnifiedHeader';
import { api } from '@/lib/api/client';
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

  useEffect(() => {
    if (!useAppShell) return;
    api.prefetch(['/repos?sortBy=recent', '/market?', '/market/my-listings']);
  }, [useAppShell]);

  if (useAppShell) {
    return (
      <div className="mk-scope min-h-screen" style={{ background: '#09090b' }}>
        <RouteProgress />
        <CommandPalette />
        <ShortcutsModal />
        <BackToTop />
        <LiveToastBridge />
        <NegotiationPopToast />
        <div className="flex">
          <Suspense fallback={<div className="hidden lg:block w-[264px] shrink-0" />}>
            <StandardSidebar />
          </Suspense>
          <div className="flex-1 w-full min-w-0 flex flex-col">
            <Suspense fallback={<div style={{ height: 56 }} />}>
              <PowerNavbar />
            </Suspense>
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
      <RouteProgress />
      <CommandPalette />
      <ShortcutsModal />
      {!isAuth && <LiveToastBridge />}
      {!isAuth && <NegotiationPopToast />}
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
