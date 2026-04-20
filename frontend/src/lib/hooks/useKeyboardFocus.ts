'use client';

import { useEffect } from 'react';

type Focusable = HTMLInputElement | HTMLTextAreaElement;

/**
 * Focuses the referenced input when the user presses a key anywhere on the
 * page, unless they are already typing in an editable element.
 *
 * Mirrors the Gmail / GitHub `/` shortcut.
 */
export function useKeyboardFocus(ref: { readonly current: Focusable | null }, key = '/') {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable)
        return;
      e.preventDefault();
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.select();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ref, key]);
}
