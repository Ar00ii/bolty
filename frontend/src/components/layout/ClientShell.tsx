'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { UnifiedHeader } from '@/components/layout/UnifiedHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/ui/footer-section';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isAuth = pathname.startsWith('/auth');
  const showSidebar = !isHome && !isAuth;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {showSidebar && <UnifiedHeader />}

      <div className={`flex ${showSidebar ? 'pt-16' : ''}`}>
        {showSidebar && <Sidebar />}

        <div className="flex-1 w-full">
          <main className="flex-1 relative min-h-screen">
            {children}
          </main>
          {!isHome && <Footer />}
        </div>
      </div>
    </div>
  );
}
