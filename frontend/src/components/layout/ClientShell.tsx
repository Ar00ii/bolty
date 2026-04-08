'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { UnifiedHeader } from '@/components/layout/UnifiedHeader';
import { Footer } from '@/components/ui/footer-section';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isAuth = pathname.startsWith('/auth');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <UnifiedHeader />

      <div className={!isHome && !isAuth ? 'pt-16' : ''}>
        <main className="flex-1 relative min-h-[calc(100vh-56px)]">
          {children}
        </main>
        {!isHome && <Footer />}
      </div>
    </div>
  );
}
