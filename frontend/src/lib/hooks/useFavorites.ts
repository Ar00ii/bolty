'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'bolty.market.favorites.v1';
const MAX_FAVORITES = 200;

function readStore(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeStore(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_FAVORITES)));
    window.dispatchEvent(new CustomEvent('bolty:favorites-changed'));
  } catch {
    /* storage full or disabled */
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readStore());
    const onChange = () => setIds(readStore());
    window.addEventListener('bolty:favorites-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('bolty:favorites-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const add = useCallback((id: string) => {
    const current = readStore();
    if (current.includes(id)) return;
    writeStore([id, ...current]);
  }, []);

  const remove = useCallback((id: string) => {
    writeStore(readStore().filter((x) => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readStore();
    if (current.includes(id)) {
      writeStore(current.filter((x) => x !== id));
    } else {
      writeStore([id, ...current]);
    }
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, add, remove, toggle, has };
}
