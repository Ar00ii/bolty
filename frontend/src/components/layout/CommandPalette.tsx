'use client';

import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  GitBranch,
  Hash,
  Heart,
  Home,
  Library,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api/client';
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed';

interface NavCommand {
  kind: 'nav';
  id: string;
  title: string;
  hint: string;
  href: string;
  icon: LucideIcon;
  keywords: string;
}

interface ListingCommand {
  kind: 'listing';
  id: string;
  title: string;
  hint: string;
  href: string;
}

type Command = NavCommand | ListingCommand;

const NAV_COMMANDS: NavCommand[] = [
  {
    kind: 'nav',
    id: 'nav:home',
    title: 'Home',
    hint: 'Go to the landing page',
    href: '/',
    icon: Home,
    keywords: 'home landing start',
  },
  {
    kind: 'nav',
    id: 'nav:market',
    title: 'Marketplace',
    hint: 'Browse all listings',
    href: '/market',
    icon: Package,
    keywords: 'market marketplace listings browse explore',
  },
  {
    kind: 'nav',
    id: 'nav:agents',
    title: 'Agents',
    hint: 'AI agents & bots',
    href: '/market/agents',
    icon: Bot,
    keywords: 'agents bots ai',
  },
  {
    kind: 'nav',
    id: 'nav:repos',
    title: 'Repositories',
    hint: 'Source repos for sale',
    href: '/market/repos',
    icon: GitBranch,
    keywords: 'repos repositories source code',
  },
  {
    kind: 'nav',
    id: 'nav:top-sellers',
    title: 'Top sellers',
    hint: 'Creator leaderboard',
    href: '/market/sellers',
    icon: Users,
    keywords: 'sellers top leaderboard creators',
  },
  {
    kind: 'nav',
    id: 'nav:tags',
    title: 'Browse by tag',
    hint: 'Tag explorer',
    href: '/market/tags',
    icon: Hash,
    keywords: 'tags topics categories',
  },
  {
    kind: 'nav',
    id: 'nav:saved',
    title: 'Saved listings',
    hint: 'Your wishlist',
    href: '/market/favorites',
    icon: Heart,
    keywords: 'saved favorites wishlist hearts',
  },
  {
    kind: 'nav',
    id: 'nav:library',
    title: 'Library',
    hint: 'Things you bought',
    href: '/market/library',
    icon: Library,
    keywords: 'library purchased bought downloads',
  },
  {
    kind: 'nav',
    id: 'nav:seller',
    title: 'Seller dashboard',
    hint: 'Your sales & analytics',
    href: '/market/seller',
    icon: BarChart3,
    keywords: 'seller dashboard analytics sales revenue',
  },
  {
    kind: 'nav',
    id: 'nav:orders',
    title: 'Orders',
    hint: 'Buying & selling activity',
    href: '/orders',
    icon: ShoppingBag,
    keywords: 'orders purchases sales transactions',
  },
  {
    kind: 'nav',
    id: 'nav:notifications',
    title: 'Notifications',
    hint: 'Your inbox',
    href: '/notifications',
    icon: Bell,
    keywords: 'notifications inbox alerts',
  },
  {
    kind: 'nav',
    id: 'nav:services',
    title: 'Services',
    hint: 'Hire developers & agents',
    href: '/services',
    icon: Briefcase,
    keywords: 'services gigs hire contract consulting',
  },
  {
    kind: 'nav',
    id: 'nav:leaderboard',
    title: 'Reputation leaderboard',
    hint: 'Top-ranked developers',
    href: '/reputation/leaderboard',
    icon: Trophy,
    keywords: 'leaderboard reputation ranks hall of fame',
  },
];

interface ListingHit {
  id: string;
  title: string;
  type: string;
  seller: { username: string | null };
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<ListingHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { items: recent } = useRecentlyViewed();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isModK) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setListings([]);
      return;
    }
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    const t = setTimeout(async () => {
      try {
        const res = await api.get<{ data: ListingHit[] }>(
          `/market?search=${encodeURIComponent(q)}&page=1`,
          { signal: ctl.signal },
        );
        setListings((res.data || []).slice(0, 6));
      } catch {
        /* ignore */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query]);

  const commands = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase();
    const navs = q
      ? NAV_COMMANDS.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.hint.toLowerCase().includes(q) ||
            c.keywords.includes(q),
        )
      : NAV_COMMANDS;
    const listingCmds: ListingCommand[] = listings.map((l) => ({
      kind: 'listing',
      id: `listing:${l.id}`,
      title: l.title,
      hint: `@${l.seller?.username || 'anonymous'} · ${l.type.toLowerCase().replace('_', ' ')}`,
      href: `/market/agents/${l.id}`,
    }));
    if (!q) {
      const recentCmds: ListingCommand[] = recent.slice(0, 5).map((r) => ({
        kind: 'listing',
        id: `recent:${r.id}`,
        title: r.title,
        hint: `Recently viewed · @${r.seller || 'anonymous'}`,
        href: `/market/agents/${r.id}`,
      }));
      return [...recentCmds, ...navs, ...listingCmds];
    }
    return [...navs, ...listingCmds];
  }, [query, listings, recent]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, listings]);

  const runCommand = useCallback(
    (cmd: Command) => {
      setOpen(false);
      router.push(cmd.href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, commands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const cmd = commands[activeIndex];
      if (cmd) runCommand(cmd);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.6)' }}
      />
      <div
        className="relative w-full max-w-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: 'rgba(15, 15, 17, 0.98)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search listings, jump to pages…"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
          />
          <kbd className="text-[10px] text-zinc-600 border border-zinc-700/60 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <div className="max-h-[380px] overflow-y-auto py-2">
          {commands.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Sparkles className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No matches — try a different term</p>
            </div>
          ) : (
            commands.map((cmd, idx) => {
              const active = idx === activeIndex;
              const Icon = cmd.kind === 'nav' ? cmd.icon : Package;
              return (
                <button
                  key={cmd.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => runCommand(cmd)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div
                    className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center border"
                    style={{
                      borderColor: 'rgba(255,255,255,0.08)',
                      background:
                        cmd.kind === 'listing'
                          ? 'rgba(131,110,249,0.08)'
                          : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${cmd.kind === 'listing' ? 'text-[#836EF9]' : 'text-zinc-300'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-white truncate">{cmd.title}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{cmd.hint}</p>
                  </div>
                  {cmd.kind === 'listing' && (
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                      Listing
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-[10px] text-zinc-500">
          <span className="flex items-center gap-2">
            <kbd className="border border-zinc-700/60 rounded px-1.5 py-0.5">↑↓</kbd>
            navigate
            <kbd className="border border-zinc-700/60 rounded px-1.5 py-0.5 ml-2">↵</kbd>
            select
          </span>
          <span>
            {commands.length} result{commands.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
}
