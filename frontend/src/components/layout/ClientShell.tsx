'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { StaggeredMenu } from '@/components/layout/StaggeredMenu';
import { FloatingAIChat } from '@/components/ui/FloatingAIChat';
import { Footer } from '@/components/ui/footer-section';
import { BoltyLogo } from '@/components/ui/BoltyLogo';
import { useUnreadDMs } from '@/lib/hooks/useUnreadDMs';
import { Menu, X, Home } from 'lucide-react';
import { DotPattern } from '@/components/ui/dot-pattern';

// Must match StaggeredMenu CSS panel width
const PANEL_WIDTH = 'clamp(280px, 40vw, 420px)';

// Pages that show the branded logo box in the top bar
const LOGO_PAGES = ['/market/agents', '/market/repos'];

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const unreadDMs = useUnreadDMs(isAuthenticated);
  const isHome = pathname === '/';
  const showLogoBox = LOGO_PAGES.some(p => pathname === p || pathname.startsWith(p + '?'));

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen(v => !v);

  return (
    <div style={{ overflowX: 'hidden', position: 'relative', minHeight: '100vh' }}>

      {/* ── Global dot pattern background ──────────────────────────────────── */}
      <DotPattern
        width={22}
        height={22}
        cr={1}
        className="fixed inset-0 z-0 fill-zinc-600/50 opacity-40 pointer-events-none"
      />

      {/* ── Floating menu button ───────────────────────────────────────────── */}
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
          background: menuOpen ? 'rgba(131,110,249,0.18)' : 'rgba(10,10,16,0.85)',
          border: `2px solid ${menuOpen ? '#836ef9' : 'rgba(255,255,255,0.13)'}`,
          color: menuOpen ? '#836ef9' : '#d4d4d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: menuOpen ? '0 0 24px rgba(131,110,249,0.35)' : '0 4px 20px rgba(0,0,0,0.5)',
          transition: 'all 0.22s ease',
        }}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <StaggeredMenu
        open={menuOpen}
        onClose={closeMenu}
        isAuthenticated={isAuthenticated}
        user={user}
        logout={logout}
        unreadDMs={unreadDMs}
      />

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
          {/* Home button on inner pages */}
          {!isHome && (
            <div style={{ position: 'fixed', top: '1.1rem', left: '4.5rem', zIndex: 60 }}>
              <Link
                href="/"
                aria-label="Go to home"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(10,10,16,0.85)',
                  border: '2px solid rgba(255,255,255,0.13)',
                  color: '#d4d4d8',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  transition: 'all 0.22s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'rgba(131,110,249,0.18)';
                  el.style.borderColor = '#836ef9';
                  el.style.color = '#836ef9';
                  el.style.boxShadow = '0 0 24px rgba(131,110,249,0.35)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'rgba(10,10,16,0.85)';
                  el.style.borderColor = 'rgba(255,255,255,0.13)';
                  el.style.color = '#d4d4d8';
                  el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
                }}
              >
                <Home size={20} />
              </Link>
            </div>
          )}

          {/* ── Bolty logo pill — shown on Agents & Repos pages ─────── */}
          {showLogoBox && (
            <div
              style={{
                position: 'fixed',
                top: '1.1rem',
                left: '8.5rem',
                zIndex: 60,
                height: 50,
                borderRadius: 28,
                background: 'rgba(131,110,249,0.12)',
                border: '2px solid rgba(131,110,249,0.45)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 0 18px rgba(131,110,249,0.25), 0 4px 20px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 16px 0 6px',
              }}
            >
              {/* Logo scaled up via transform so it fills without offset issues */}
              <div style={{ width: 42, height: 42, overflow: 'hidden', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bolty-icon.png"
                  alt="Bolty"
                  style={{ width: 42, height: 42, objectFit: 'contain', transform: 'scale(2)', display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ color: '#e4e4e7', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Bolty</span>
                <span style={{ color: '#836ef9', fontSize: '0.6rem', fontWeight: 500, whiteSpace: 'nowrap' }}>AI Platform</span>
              </div>
            </div>
          )}

          {children}
        </main>

        <Footer />
      </div>

      <FloatingAIChat />
    </div>
  );
}
