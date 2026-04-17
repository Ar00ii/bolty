'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Package, ShoppingCart, Star, Users } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { api } from '@/lib/api/client';

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

export default function TopSellersPage() {
  const [sellers, setSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((s, i) => (
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
                        {i < 3 && (
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
