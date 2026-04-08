'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
      {/* Show header only on landing and auth pages */}
      {!showSidebar && <UnifiedHeader />}

      <div className={`flex ${!showSidebar && !isHome ? 'pt-16' : ''}`}>
        {showSidebar && <Sidebar />}

        <div className="flex-1 w-full">
          <main className="flex-1 relative min-h-screen">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
          {!isHome && <Footer />}
        </div>
      </div>
    </div>
  );
}
