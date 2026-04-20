'use client';

import React, { useEffect } from 'react';

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
              Critical error
            </p>
            <h1
              style={{
                fontSize: 40,
                fontWeight: 300,
                margin: '0.75rem 0 0.5rem',
                background: 'linear-gradient(135deg, #836EF9 0%, #EC4899 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Bolty hit a snag
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
              The app couldn&apos;t render this page. Refresh to try again — if it keeps failing,
              let us know.
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
                border: '1px solid rgba(131,110,249,0.3)',
                background: 'rgba(131,110,249,0.1)',
                color: '#EDE9FE',
                cursor: 'pointer',
                transition: 'background 120ms',
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
