'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const ROUTES: Record<string, string> = {
  h: '/',
  m: '/market',
  l: '/inventory',
  i: '/inventory',
  o: '/orders',
  n: '/notifications',
  s: '/market/seller',
  f: '/inventory?tab=saved',
  p: '/profile',
};

export const GOTO_SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ['G', 'H'], description: 'Go to home' },
  { keys: ['G', 'M'], description: 'Go to marketplace' },
  { keys: ['G', 'I'], description: 'Go to your inventory' },
  { keys: ['G', 'O'], description: 'Go to orders' },
  { keys: ['G', 'N'], description: 'Go to notifications' },
  { keys: ['G', 'S'], description: 'Go to seller dashboard' },
  { keys: ['G', 'F'], description: 'Go to saved listings' },
  { keys: ['G', 'P'], description: 'Go to your profile' },
];

const ARMED_MS = 1500;

export function useGoToShortcuts() {
  const router = useRouter();
  const armedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const disarm = () => {
      armedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable)
        return;

      const key = e.key.toLowerCase();

      if (armedRef.current) {
        const route = ROUTES[key];
        disarm();
        if (route) {
          e.preventDefault();
          router.push(route);
        }
        return;
      }

      if (key === 'g') {
        armedRef.current = true;
        timerRef.current = setTimeout(disarm, ARMED_MS);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      disarm();
    };
  }, [router]);
}
