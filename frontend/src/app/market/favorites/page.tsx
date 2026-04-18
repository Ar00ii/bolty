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
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none"
              strokeWidth={1.75}
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved listings…"
              className="w-full pl-9 pr-16 py-2.5 rounded-lg text-[13px] text-white placeholder-zinc-600 outline-none transition-all focus:shadow-[0_0_0_3px_rgba(131,110,249,0.12)]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
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
              <kbd
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium text-zinc-500 leading-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                /
              </kbd>
            )}
          </div>
        )}

        {missing.length > 0 && !loading && (
          <div
            className="relative mb-6 rounded-xl overflow-hidden px-4 py-3 text-[12px] text-yellow-200 flex items-center justify-between gap-3"
            style={{
              background:
                'linear-gradient(180deg, rgba(161,98,7,0.18) 0%, rgba(113,63,18,0.12) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(234,179,8,0.28), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 16px -6px rgba(234,179,8,0.35)',
            }}
          >
            <span className="font-normal">
              {missing.length} saved listing{missing.length === 1 ? '' : 's'} no longer available.
            </span>
            <button
              onClick={() => missing.forEach(remove)}
              className="text-yellow-100 hover:text-white underline underline-offset-2 font-medium"
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
            className="relative rounded-2xl overflow-hidden p-12 text-center"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(236,72,153,0.5) 50%, transparent 100%)',
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-40"
              style={{ background: 'rgba(236,72,153,0.2)' }}
            />
            <div
              className="relative w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(236,72,153,0.22) 0%, rgba(236,72,153,0.06) 100%)',
                border: '1px solid rgba(236,72,153,0.3)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px -6px rgba(236,72,153,0.35)',
              }}
            >
              <Heart className="w-5 h-5 text-[#f9a8d4]" strokeWidth={1.5} />
            </div>
            <p className="relative text-[14px] text-white font-normal tracking-[0.005em]">
              No saved listings yet
            </p>
            <p className="relative text-[12px] text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              Browse the marketplace and hit the heart icon to start building your list.
            </p>
            <Link
              href="/market"
              className="relative inline-flex items-center gap-2 mt-5 rounded-lg h-9 px-4 text-[12px] font-medium text-zinc-300 hover:text-white transition-colors"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              Browse listings
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div
            className="relative rounded-2xl overflow-hidden p-12 text-center"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow:
                '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
              }}
            />
            <div
              className="relative w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(131,110,249,0.2) 0%, rgba(131,110,249,0.06) 100%)',
                border: '1px solid rgba(131,110,249,0.28)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px -6px rgba(131,110,249,0.35)',
              }}
            >
              <Search className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.5} />
            </div>
            <p className="relative text-[14px] text-white font-normal tracking-[0.005em]">
              No matches
            </p>
            <p className="relative text-[12px] text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.035, 0.4),
                    duration: 0.32,
                    ease: [0.22, 0.61, 0.36, 1],
                  }}
                  whileHover={{ y: -2 }}
                  className="group relative rounded-xl transition-all overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -14px rgba(0,0,0,0.55)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${meta.color} 50%, transparent 100%)`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
                    style={{ background: `${meta.color}25` }}
                  />
                  <Link href={`/market/agents/${l.id}`} className="relative block p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${meta.color}22 0%, ${meta.color}08 100%)`,
                          border: `1px solid ${meta.color}40`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px -4px ${meta.color}30`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 font-medium mb-1">
                          {meta.label}
                        </p>
                        <p className="text-[13px] font-normal text-white truncate tracking-[0.005em]">
                          {l.title}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                          @{l.seller.username || 'anonymous'}
                        </p>
                      </div>
                      <div className="text-right shrink-0 pr-8">
                        <p className="text-[13px] font-medium text-[#b4a7ff] tracking-[0.005em]">
                          {l.price === 0 ? 'Free' : `${l.price} ${l.currency}`}
                        </p>
                        {l.reviewAverage != null && (
                          <p className="text-[11px] text-zinc-500 mt-1 inline-flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {l.reviewAverage.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-[12px] text-zinc-400 font-normal line-clamp-2 leading-relaxed">
                      {l.description}
                    </p>
                  </Link>
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      remove(l.id);
                    }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.08 }}
                    aria-label="Remove from favorites"
                    className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-pink-300 hover:text-pink-200 hover:bg-pink-500/10 transition-colors z-10"
                    style={{
                      background: 'rgba(236,72,153,0.08)',
                      border: '1px solid rgba(236,72,153,0.22)',
                    }}
                  >
                    <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
