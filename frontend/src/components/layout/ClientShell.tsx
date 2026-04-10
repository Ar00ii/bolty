'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { FloatingTopBar } from '@/components/layout/FloatingTopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { UnifiedHeader } from '@/components/layout/UnifiedHeader';
import { Footer } from '@/components/ui/footer-section';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const isHome = pathname === '/';
  const isAuth = pathname.startsWith('/auth');
  const showSidebar = !isHome && !isAuth;

  // Show loading bar on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <ProgressBar isLoading={isLoading} />
      <FloatingTopBar />
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
