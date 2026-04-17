'use client';

import { Command, Keyboard, Slash, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  items: Shortcut[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'Search & navigation',
    items: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['Ctrl', 'K'], description: 'Open command palette (Windows/Linux)' },
      { keys: ['/'], description: 'Focus the page search input' },
      { keys: ['Esc'], description: 'Close palette, dialog, or dropdown' },
    ],
  },
  {
    title: 'Inside the palette',
    items: [
      { keys: ['↑'], description: 'Move up' },
      { keys: ['↓'], description: 'Move down' },
      { keys: ['↵'], description: 'Run selected command' },
    ],
  },
  {
    title: 'Global',
    items: [{ keys: ['?'], description: 'Show this keyboard cheatsheet' }],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 rounded border border-white/15 bg-white/[0.04] text-[11px] text-zinc-200 font-mono leading-none"
      style={{ letterSpacing: 0 }}
    >
      {children}
    </kbd>
  );
}

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable)
          return;
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.65)' }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: 'rgba(15, 15, 17, 0.98)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[#836EF9]" />
            <p className="text-sm font-light text-white">Keyboard shortcuts</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close shortcuts"
            className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/5">
          {GROUPS.map((group) => (
            <div key={group.title} className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                {group.title}
              </p>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.description} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-light text-zinc-300">{item.description}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-[10px] text-zinc-600">+</span>}
                          <KeyBadge>{k}</KeyBadge>
                        </React.Fragment>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-[11px] text-zinc-500">
          <span className="flex items-center gap-2">
            Press
            <KeyBadge>
              <Slash className="w-3 h-3" />
            </KeyBadge>
            to jump into the search box,
            <KeyBadge>
              <Command className="w-3 h-3" />K
            </KeyBadge>
            for anything else.
          </span>
        </div>
      </div>
    </div>
  );
}
