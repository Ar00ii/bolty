'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Bot, GitBranch, Heart, Package, Search, Star, X, Zap } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { api, ApiError } from '@/lib/api/client';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';

interface Listing {
  id: string;
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency: string;
  tags: string[];
  status: string;
  seller: { id: string; username: string | null; avatarUrl: string | null };
  reviewAverage?: number | null;
  reviewCount?: number;
}

const TYPE_META: Record<
  Listing['type'],
  { color: string; icon: React.ElementType; label: string }
> = {
  REPO: { color: '#3b82f6', icon: GitBranch, label: 'Repo' },
  BOT: { color: '#836EF9', icon: Bot, label: 'Bot' },
  AI_AGENT: { color: '#a855f7', icon: Bot, label: 'AI agent' },
  SCRIPT: { color: '#06B6D4', icon: Zap, label: 'Script' },
  OTHER: { color: '#64748b', icon: Package, label: 'Other' },
};

export default function FavoritesPage() {
  const { ids, remove } = useFavorites();
  const [listings, setListings] = useState<Listing[]>([]);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const found: Listing[] = [];
      const gone: string[] = [];
      await Promise.all(
        ids.map(async (id) => {
          try {
            const l = await api.get<Listing>(`/market/${id}`);
            if (l && l.status !== 'REMOVED') found.push(l);
            else gone.push(id);
          } catch (err) {
            if (err instanceof ApiError && err.status === 404) gone.push(id);
          }
        }),
      );
      if (cancelled) return;
      const order = new Map(ids.map((id, i) => [id, i]));
      found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      setListings(found);
      setMissing(gone);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) => {
      const haystack = [l.title, l.description, l.seller.username ?? '', ...(l.tags || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [listings, query]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        <Link
          href="/market"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to market
        </Link>

        <div className="relative border-t-2 border-l-2 border-white/20 rounded-tl-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Your list</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-3">
            Saved <GradientText>listings</GradientText>
          </h1>
          <p className="text-zinc-400 font-light max-w-xl">
            {ids.length === 0
              ? 'Tap the heart on any listing to save it here for later.'
              : `${ids.length} saved listing${ids.length === 1 ? '' : 's'} — stored in this browser.`}
          </p>
        </div>

        {!loading && listings.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved listings…"
              className="w-full pl-9 pr-16 py-2.5 bg-zinc-900/40 border border-zinc-800 rounded-lg text-sm font-light text-white placeholder-zinc-600 outline-none focus:border-[#836EF9]/40 transition-colors"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center px-1.5 py-0.5 bg-zinc-800/60 rounded text-[10px] font-mono text-zinc-500 border border-zinc-700/60">
                /
              </kbd>
            )}
          </div>
        )}

        {missing.length > 0 && !loading && (
          <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-300 flex items-center justify-between gap-3">
            <span>
              {missing.length} saved listing{missing.length === 1 ? '' : 's'} no longer available.
            </span>
            <button
              onClick={() => missing.forEach(remove)}
              className="text-yellow-200 hover:text-white underline underline-offset-2"
            >
              Clean up
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-white/5 animate-pulse"
                style={{ background: 'var(--bg-card)' }}
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div
            className="rounded-xl border border-white/10 p-12 text-center"
            style={{ background: 'var(--bg-card)' }}
          >
            <Heart className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-light">No saved listings yet</p>
            <p className="text-xs text-zinc-500 mt-1 font-light">
              Browse the marketplace and hit the heart icon to start building your list.
            </p>
            <Link
              href="/market"
              className="inline-block mt-5 px-5 py-2 text-xs rounded-lg border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            >
              Browse listings
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div
            className="rounded-xl border border-white/10 p-12 text-center"
            style={{ background: 'var(--bg-card)' }}
          >
            <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-light">No matches</p>
            <p className="text-xs text-zinc-500 mt-1 font-light">
              Try a different keyword or clear the search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visible.map((l, i) => {
              const meta = TYPE_META[l.type] ?? TYPE_META.OTHER;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="relative rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <Link href={`/market/agents/${l.id}`} className="block p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: `${meta.color}14`,
                          border: `1px solid ${meta.color}33`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                          {meta.label}
                        </p>
                        <p className="text-sm font-light text-white truncate">{l.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">
                          @{l.seller.username || 'anonymous'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono text-purple-300">
                          {l.price === 0 ? 'Free' : `${l.price} ${l.currency}`}
                        </p>
                        {l.reviewAverage != null && (
                          <p className="text-[11px] text-zinc-500 mt-1 inline-flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            {l.reviewAverage.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 font-light line-clamp-2">{l.description}</p>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      remove(l.id);
                    }}
                    aria-label="Remove from favorites"
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-pink-300 hover:bg-pink-500/10 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
