'use client';

import React, { useEffect, useState } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  // A chunk of the marketplace / agent pages relies on desktop-only
  // layout primitives (wide grids, CodeMirror, web3 modals). When the
  // page crashes on a phone viewport the user gets the scary "Atlas hit
  // a snag" screen — replace it with a clear "desktop only" message so
  // people don't think the site is broken.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <html>
      <body style={{ margin: 0, background: '#000' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
            color: '#fff',
            background: '#000',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 600,
              height: 500,
              borderRadius: '50%',
              filter: 'blur(80px)',
              opacity: 0.18,
              background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              maxWidth: 520,
              width: '100%',
              borderTop: '2px solid rgba(255,255,255,0.2)',
              borderLeft: '2px solid rgba(255,255,255,0.2)',
              borderTopLeftRadius: 16,
              padding: '2.5rem',
            }}
          >
            <p
              style={{
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(161,161,170,0.8)',
                margin: 0,
              }}
            >
              {isMobile ? 'Heads up' : 'Critical error'}
            </p>
            <h1
              style={{
                fontSize: 40,
                fontWeight: 300,
                margin: '0.75rem 0 0.5rem',
                background: 'linear-gradient(135deg, #14F195 0%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {isMobile ? 'Best on desktop' : 'Atlas hit a snag'}
            </h1>
            <p
              style={{
                color: 'rgba(161,161,170,0.9)',
                fontWeight: 300,
                lineHeight: 1.6,
                maxWidth: 380,
                margin: '0 0 1.5rem',
              }}
            >
              {isMobile
                ? 'This section of Atlas is optimised for desktop. Open it from a laptop or desktop browser for the full experience.'
                : "The app couldn't render this page. Refresh to try again — if it keeps failing, let us know."}
            </p>
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.625rem 1rem',
                fontSize: 14,
                borderRadius: 10,
                border: '1px solid rgba(20,241,149,0.3)',
                background: 'rgba(20,241,149,0.1)',
                color: '#EDE9FE',
                cursor: 'pointer',
                transition: 'background 120ms',
              }}
            >
              {isMobile ? 'Try again' : 'Refresh'}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
