'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { StaggeredMenu } from '@/components/layout/StaggeredMenu';
import { FloatingAIChat } from '@/components/ui/FloatingAIChat';
import { Footer } from '@/components/ui/footer-section';
import { useUnreadDMs } from '@/lib/hooks/useUnreadDMs';
import { Menu, X } from 'lucide-react';

// Must match StaggeredMenu CSS panel width
const PANEL_WIDTH = 'clamp(280px, 40vw, 420px)';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadDMs = useUnreadDMs(isAuthenticated);
  const isHome = pathname === '/';

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen(v => !v);

  return (
    // Outer shell: clips content that slides off-screen when menu opens
    <div style={{ overflowX: 'hidden', position: 'relative', minHeight: '100vh' }}>

      {/* ── Floating menu button — always top-left, fixed ─────────────────── */}
      <button
        onClick={toggleMenu}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        style={{
          position: 'fixed',
          top: '1.1rem',
          left: '1.1rem',
          zIndex: 70,
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: menuOpen
            ? 'rgba(131,110,249,0.18)'
            : 'rgba(10,10,16,0.85)',
          border: `2px solid ${menuOpen ? '#836ef9' : 'rgba(255,255,255,0.13)'}`,
          color: menuOpen ? '#836ef9' : '#d4d4d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: menuOpen
            ? '0 0 24px rgba(131,110,249,0.35)'
            : '0 4px 20px rgba(0,0,0,0.5)',
          transition: 'all 0.22s ease',
        }}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── StaggeredMenu panel — fixed to RIGHT, outside push wrapper ──────
          Position: fixed right:0. Content will shift LEFT to make room.   */}
      <StaggeredMenu
        open={menuOpen}
        onClose={closeMenu}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={logout}
        unreadDMs={unreadDMs}
      />

      {/* ── Push wrapper ─────────────────────────────────────────────────────
          Shifts LEFT (negative X) when menu opens, revealing menu on right. */}
      <div
        style={{
          transform: menuOpen ? `translateX(-${PANEL_WIDTH})` : 'translateX(0)',
          transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <main className="flex-1 relative">
          {/* "← Home" back button on inner pages */}
          {!isHome && (
            <div style={{ position: 'fixed', top: '1.1rem', left: '4.5rem', zIndex: 60 }}>
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

        {/* Footer only on home page */}
        {isHome && <Footer />}
      </div>

      {/* FloatingAIChat outside push wrapper so it stays put */}
      <FloatingAIChat />
    </div>
  );
}
