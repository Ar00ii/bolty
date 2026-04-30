'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { HowItWorks } from '@/components/ui/HowItWorks';

interface HowItWorksContextValue {
  open: () => void;
  close: () => void;
}

const HowItWorksContext = createContext<HowItWorksContextValue | null>(null);

const SEEN_KEY = 'bolty:how-it-works-seen';

/**
 * Mounts the HowItWorks modal at the root and exposes open/close to
 * any descendant via `useHowItWorks()`. Also auto-opens once for
 * brand-new visitors (no localStorage flag set).
 */
export function HowItWorksProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Auto-open for first-time visitors. Slight delay so the page has
  // a chance to paint first.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      if (!seen) {
        const t = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <HowItWorksContext.Provider value={{ open, close }}>
      {children}
      <HowItWorks open={isOpen} onClose={close} />
    </HowItWorksContext.Provider>
  );
}

export function useHowItWorks(): HowItWorksContextValue {
  const ctx = useContext(HowItWorksContext);
  if (!ctx) {
    // Graceful no-op when consumed outside the provider — keeps the
    // header help button safe to render even if the provider tree
    // changes.
    return {
      open: () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('bolty:open-how-it-works'));
        }
      },
      close: () => {},
    };
  }
  return ctx;
}
