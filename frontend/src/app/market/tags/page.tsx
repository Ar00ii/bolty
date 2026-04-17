'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Hash, Tag } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { api } from '@/lib/api/client';

interface TagFacet {
  tag: string;
  count: number;
}

interface Facets {
  tags: TagFacet[];
  types: { type: string; count: number }[];
  priceRange: { min: number; max: number };
  totalActive: number;
}

export default function MarketTagsPage() {
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Facets>('/market/facets');
        setFacets(data);
      } catch {
        setFacets({ tags: [], types: [], priceRange: { min: 0, max: 0 }, totalActive: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!facets) return [];
    const q = search.trim().toLowerCase();
    if (!q) return facets.tags;
    return facets.tags.filter((t) => t.tag.toLowerCase().includes(q));
  }, [facets, search]);

  const maxCount = facets?.tags[0]?.count || 1;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 right-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #EC4899 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-60 -left-20 w-[380px] h-[380px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }}
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
            <Hash className="w-5 h-5 text-[#EC4899]" />
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Explore</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-3">
            Browse by <GradientText>tag</GradientText>
          </h1>
          <p className="text-zinc-400 font-light max-w-xl">
            {facets
              ? `${facets.tags.length} tags across ${facets.totalActive} active listings.`
              : 'Discover listings by topic.'}
          </p>
        </div>

        <div
          className="rounded-xl border border-white/5 p-4 mb-6"
          style={{ background: 'var(--bg-card)' }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tags…"
            className="w-full bg-transparent border-b border-white/10 px-1 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#836EF9] transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 rounded-full border border-white/5 animate-pulse"
                style={{ background: 'var(--bg-card)' }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl border border-white/10 p-12 text-center"
            style={{ background: 'var(--bg-card)' }}
          >
            <Tag className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-light">
              {search ? `No tags match "${search}"` : 'No tags yet'}
            </p>
            <p className="text-xs text-zinc-500 mt-1 font-light">
              Tags will appear here as creators publish listings.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((t, i) => {
              const weight = Math.max(0.5, t.count / maxCount);
              return (
                <motion.div
                  key={t.tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.6), duration: 0.2 }}
                >
                  <Link
                    href={`/market?tags=${encodeURIComponent(t.tag)}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-[#836EF9]/50 transition-all"
                    style={{
                      background: `rgba(131, 110, 249, ${0.05 + weight * 0.12})`,
                    }}
                  >
                    <Hash className="w-3 h-3 text-[#836EF9]" />
                    <span
                      className="font-light text-white"
                      style={{ fontSize: `${12 + weight * 4}px` }}
                    >
                      {t.tag}
                    </span>
                    <span className="text-[11px] text-zinc-500">{t.count}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
