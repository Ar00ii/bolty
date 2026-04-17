'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Package, Search, ShoppingCart, Star, Users, X } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { api } from '@/lib/api/client';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';

interface TopSeller {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  githubLogin: string | null;
  createdAt: string;
  sales: number;
  activeListings: number;
  avgRating: number | null;
  reviewCount: number;
}

function Avatar({ url, username }: { url: string | null; username: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={username || 'seller'}
        className="w-14 h-14 rounded-full object-cover border border-white/10"
      />
    );
  }
  const initial = (username || '?').charAt(0).toUpperCase();
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-light text-white border border-white/10"
      style={{ background: 'linear-gradient(135deg, #836EF9 0%, #EC4899 100%)' }}
    >
      {initial}
    </div>
  );
}

type SellerSort = 'sales' | 'rating' | 'listings';

export default function TopSellersPage() {
  const [sellers, setSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SellerSort>('sales');
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<TopSeller[]>('/market/top-sellers?limit=48');
        setSellers(data);
      } catch {
        setSellers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? sellers.filter((s) =>
          [s.username ?? '', s.bio ?? '', s.githubLogin ?? ''].join(' ').toLowerCase().includes(q),
        )
      : sellers;
    if (sort === 'rating') {
      return [...filtered].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    }
    if (sort === 'listings') {
      return [...filtered].sort((a, b) => b.activeListings - a.activeListings);
    }
    return filtered;
  }, [sellers, query, sort]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-40 right-0 w-[380px] h-[380px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <Link
          href="/market"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to market
        </Link>

        <div className="relative border-t-2 border-l-2 border-white/20 rounded-tl-2xl p-8 mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-[#836EF9]" />
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Discovery</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-3">
            Top <GradientText>sellers</GradientText>
          </h1>
          <p className="text-zinc-400 font-light max-w-xl">
            The most-purchased creators on Bolty — ranked by all-time sales. Explore their agents,
            scripts and repos.
          </p>
        </div>

        {!loading && sellers.length > 0 && (
          <div
            className="mb-6 rounded-xl border border-white/5 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            style={{ background: 'var(--bg-card)' }}
          >
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a creator…"
                className="w-full bg-transparent border border-white/8 rounded-lg pl-9 pr-14 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#836EF9]/40 transition-colors"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded border border-white/10 bg-white/[0.04] text-[9px] text-zinc-500 font-mono leading-none">
                    /
                  </kbd>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mr-2">
                Sort
              </span>
              {(
                [
                  { k: 'sales', label: 'Sales', Icon: ShoppingCart },
                  { k: 'rating', label: 'Rating', Icon: Star },
                  { k: 'listings', label: 'Listings', Icon: Package },
                ] as const
              ).map(({ k, label, Icon }) => (
                <button
                  key={k}
                  onClick={() => setSort(k)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-light transition-all ${
                    sort === k
                      ? 'bg-[#836EF9]/15 text-[#836EF9] border border-[#836EF9]/30'
                      : 'text-zinc-400 hover:text-white border border-transparent hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl border border-white/5 animate-pulse"
                style={{ background: 'var(--bg-card)' }}
              />
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <div
            className="rounded-xl border border-white/10 p-12 text-center"
            style={{ background: 'var(--bg-card)' }}
          >
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-light">No top sellers yet</p>
            <p className="text-xs text-zinc-500 mt-1 font-light">
              Once creators start shipping, you&apos;ll see them climb the leaderboard.
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
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-light">
              {query ? `No creators match "${query}"` : 'No matches'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <Link
                  href={`/market/sellers/${s.username || ''}`}
                  className="block p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <div className="flex items-start gap-4">
                    <Avatar url={s.avatarUrl} username={s.username} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-light text-white truncate">
                          @{s.username || 'unknown'}
                        </p>
                        {sort === 'sales' && !query.trim() && i < 3 && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: 'rgba(131, 110, 249, 0.15)',
                              color: '#836EF9',
                            }}
                          >
                            #{i + 1}
                          </span>
                        )}
                      </div>
                      {s.bio ? (
                        <p className="text-xs text-zinc-400 font-light line-clamp-2 mb-3">
                          {s.bio}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-600 italic font-light mb-3">No bio yet</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          {s.sales} sale{s.sales === 1 ? '' : 's'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {s.activeListings} listing{s.activeListings === 1 ? '' : 's'}
                        </span>
                        {s.avgRating !== null && (
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            {s.avgRating.toFixed(2)}
                            <span className="text-zinc-600">({s.reviewCount})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
