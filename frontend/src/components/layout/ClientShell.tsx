'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { StaggeredMenu } from '@/components/layout/StaggeredMenu';
import { FloatingAIChat } from '@/components/ui/FloatingAIChat';
import { Footer } from '@/components/ui/footer-section';
import { useUnreadDMs } from '@/lib/hooks/useUnreadDMs';

// Panel width must match StaggeredMenu CSS: clamp(280px, 40vw, 420px)
const PANEL_WIDTH = 'clamp(280px, 40vw, 420px)';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadDMs = useUnreadDMs(isAuthenticated);
  const isHome = pathname === '/';

  const closeMenu = () => setMenuOpen(false);

  return (
    // Outer shell — clips the content that slides off-screen
    <div style={{ overflowX: 'hidden', position: 'relative' }}>

      {/* ── StaggeredMenu ─────────────────────────────────────────────────
          Must live OUTSIDE the push wrapper so its position:fixed
          is relative to the viewport, not the transformed ancestor.   */}
      <StaggeredMenu
        open={menuOpen}
        onClose={closeMenu}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={logout}
        unreadDMs={unreadDMs}
      />

      {/* Backdrop — also outside push wrapper, fixed to viewport */}
      {menuOpen && (
        <div
          onClick={closeMenu}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 35,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            cursor: 'pointer',
          }}
        />
      )}

      {/* ── Push wrapper ──────────────────────────────────────────────────
          When menuOpen, translateX pushes the whole page to the right.
          position:fixed children (Navbar) become fixed relative to THIS
          transformed element — which means they shift right too.        */}
      <div
        style={{
          transform: `translateX(${menuOpen ? PANEL_WIDTH : '0px'})`,
          transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navbar
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />

        <main className="flex-1 pt-16 relative">
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

        <Footer />
      </div>

      {/* Floating AI Chat — outside push wrapper so it doesn't shift */}
      <FloatingAIChat />
    </div>
  );
}
