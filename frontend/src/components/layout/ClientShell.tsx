'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/ui/footer-section';
import { useUnreadDMs } from '@/lib/hooks/useUnreadDMs';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadDMs = useUnreadDMs(isAuthenticated);
  const isHome = pathname === '/';
  const isAuth = pathname.startsWith('/auth');

  // Don't show sidebar on homepage or auth pages
  const showSidebar = !isHome && !isAuth;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {showSidebar && (
        <Sidebar
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          isAuthenticated={isAuthenticated}
          user={user}
          logout={logout}
          unreadDMs={unreadDMs}
        />
      )}

      {showSidebar && (
        <Navbar
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />
      )}

      <div className={showSidebar ? 'lg:ml-[var(--sidebar-width)] pt-14' : ''}>
        <main className="flex-1 relative min-h-[calc(100vh-56px)]">
          {children}
        </main>
        <Footer />
      </div>

      {/* Mobile overlay */}
      {menuOpen && showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
