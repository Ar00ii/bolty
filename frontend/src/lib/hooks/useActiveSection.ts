'use client';

import { useEffect, useState } from 'react';

/**
 * Returns the id of the section currently closest to the top of the viewport
 * among the given candidate ids. Useful for highlighting the active entry in
 * a docs-style table of contents.
 */
export function useActiveSection(ids: string[], offset = 120): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join(',');

  useEffect(() => {
    const list = key ? key.split(',') : [];
    if (list.length === 0) return;

    const pick = () => {
      let current: string | null = null;
      for (const id of list) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - offset <= 0) {
          current = id;
        } else {
          break;
        }
      }
      setActive(current ?? list[0]);
    };

    pick();
    window.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', pick);
    return () => {
      window.removeEventListener('scroll', pick);
      window.removeEventListener('resize', pick);
    };
  }, [key, offset]);

  return active;
}
