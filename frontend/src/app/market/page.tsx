'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  TrendingUp,
  Package,
  Bot,
  GitBranch,
  Zap,
  Search,
  BarChart3,
  Library,
  Users,
  Hash,
  Heart,
  Clock,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useState, useEffect, useRef } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed';

interface MarketListing {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency: string;
  minPrice?: number | null;
  tags: string[];
  status: string;
  agentUrl?: string | null;
  agentEndpoint?: string | null;
  fileKey?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileMimeType?: string | null;
  seller: { id: string; username: string | null; avatarUrl: string | null };
  repository: { id: string; name: string; githubUrl: string; language: string | null } | null;
  reviewAverage?: number | null;
  reviewCount?: number;
}

interface FeedPost {
  id: string;
  createdAt: string;
  content: string;
  postType: 'GENERAL' | 'PRICE_UPDATE' | 'ANNOUNCEMENT' | 'DEAL';
  price: number | null;
  currency: string | null;
  listing: {
    id: string;
    title: string;
    type: string;
    seller: { id: string; username: string | null; avatarUrl: string | null };
  };
}

const TYPE_ACCENTS: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }
> = {
  REPO: { color: '#3b82f6', icon: GitBranch },
  BOT: { color: '#836EF9', icon: Bot },
  AI_AGENT: { color: '#a855f7', icon: Bot },
  SCRIPT: { color: '#06B6D4', icon: Zap },
  OTHER: { color: '#64748b', icon: Package },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function MarketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#000' }} />}>
      <MarketPageContent />
    </Suspense>
  );
}

interface Facets {
  tags: { tag: string; count: number }[];
  types: { type: string; count: number }[];
  priceRange: { min: number; max: number };
  totalActive: number;
}

function MarketPageContent() {
  const { isLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const { ids: favoriteIds } = useFavorites();
  const { items: recentItems, clear: clearRecent, remove: removeRecent } = useRecentlyViewed();
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'activity'>('all');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'trending'>(
    'recent',
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hasDemo, setHasDemo] = useState(false);
  const [facets, setFacets] = useState<Facets | null>(null);

  useEffect(() => {
    api
      .get<Facets>('/market/facets')
      .then((f) => setFacets(f))
      .catch(() => void 0);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: '1', sortBy });
        if (search) qs.set('search', search);
        if (selectedTags.length > 0) qs.set('tags', selectedTags.join(','));
        if (minPrice) qs.set('minPrice', minPrice);
        if (maxPrice) qs.set('maxPrice', maxPrice);
        if (hasDemo) qs.set('hasDemo', '1');
        const [listingsData, feedData] = await Promise.all([
          api.get<{ data: MarketListing[]; total: number; page: number; pages: number }>(
            `/market?${qs.toString()}`,
          ),
          api.get<FeedPost[]>('/market/feed?take=5'),
        ]);
        setListings(listingsData?.data || []);
        setFeedPosts(feedData || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, sortBy, selectedTags, minPrice, maxPrice, hasDemo]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setMinPrice('');
    setMaxPrice('');
    setHasDemo(false);
  };

  const activeFilterCount =
    selectedTags.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (hasDemo ? 1 : 0);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-purple-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    );
  }

  const filteredListings = listings.filter((l) =>
    search ? l.title.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'trending':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div style={{ background: '#000' }} className="relative min-h-screen overflow-hidden">
      {/* Header Section */}
      <div className="border-b border-white/8 sticky top-0 z-40 backdrop-blur-md bg-zinc-950/90">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-light text-white mb-2">
                <GradientText gradient="purple">Marketplace</GradientText>
              </h1>
              <p className="text-sm text-zinc-400">
                Access {listings.length} AI agents, repositories, and services from the community.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/market/agents"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-purple-500/40 text-white hover:bg-purple-500/5 transition-all"
              >
                <Bot className="w-4 h-4" />
                Agents
              </Link>
              <Link
                href="/market/repos"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-blue-500/40 text-white hover:bg-blue-500/5 transition-all"
              >
                <GitBranch className="w-4 h-4" />
                Repos
              </Link>
              <Link
                href="/market/sellers"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-purple-500/40 text-white hover:bg-purple-500/5 transition-all"
              >
                <Users className="w-4 h-4" />
                Sellers
              </Link>
              <Link
                href="/market/tags"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-pink-500/40 text-white hover:bg-pink-500/5 transition-all"
              >
                <Hash className="w-4 h-4" />
                Tags
              </Link>
              <Link
                href="/market/favorites"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-pink-500/40 text-white hover:bg-pink-500/5 transition-all"
              >
                <Heart className="w-4 h-4" />
                Saved
                {favoriteIds.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-medium bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {favoriteIds.length > 99 ? '99+' : favoriteIds.length}
                  </span>
                )}
              </Link>
              <Link
                href="/market/library"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-purple-500/40 text-white hover:bg-purple-500/5 transition-all"
              >
                <Library className="w-4 h-4" />
                Library
              </Link>
              <Link
                href="/market/seller"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-purple-500/40 text-white hover:bg-purple-500/5 transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                Seller
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Listings"
              value={listings.length.toString()}
              trend="+12%"
              icon={<Package className="w-4 h-4" />}
            />
            <StatCard
              label="Recent Activity"
              value={feedPosts.length.toString()}
              trend="This week"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              label="Community Size"
              value="500+"
              trend="Active devs"
              icon={<Star className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div
            className="group relative flex-1 rounded-xl transition-colors focus-within:shadow-[0_0_0_3px_rgba(131,110,249,0.12)]"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#b4a7ff] transition-colors"
              strokeWidth={1.75}
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search agents, repos, services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-transparent text-white placeholder-zinc-500 text-[13px] focus:outline-none tracking-[0.005em]"
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            ) : (
              <kbd
                className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-500 rounded px-1.5 py-0.5 leading-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                /
              </kbd>
            )}
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none pl-4 pr-9 py-2.5 rounded-xl text-white text-[13px] cursor-pointer focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,110,249,0.12)] transition-shadow"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="trending">Trending</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2 3.5 L5 6.5 L8 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Advanced filters */}
        <div
          className="mb-8 rounded-xl p-4"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.4) 0%, rgba(10,10,14,0.4) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.055), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
              Filters
              {activeFilterCount > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-medium px-1 text-[#b4a7ff]"
                  style={{
                    background: 'rgba(131,110,249,0.14)',
                    border: '1px solid rgba(131,110,249,0.28)',
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Min price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-28 px-2.5 py-1.5 rounded-md text-white placeholder-zinc-500 text-[12px] focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,110,249,0.12)] transition-shadow"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
                }}
              />
              <span className="text-zinc-600 text-xs">–</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 px-2.5 py-1.5 rounded-md text-white placeholder-zinc-500 text-[12px] focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,110,249,0.12)] transition-shadow"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
                }}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-[12px] text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasDemo}
                onChange={(e) => setHasDemo(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#836EF9]"
              />
              Live demo available
            </label>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="ml-auto text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {facets && facets.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {facets.tags.map((t) => {
                const active = selectedTags.includes(t.tag);
                return (
                  <button
                    key={t.tag}
                    onClick={() => toggleTag(t.tag)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-normal transition-colors ${
                      active ? 'text-[#b4a7ff]' : 'text-zinc-400 hover:text-white'
                    }`}
                    style={
                      active
                        ? {
                            background:
                              'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.08) 100%)',
                            boxShadow:
                              'inset 0 0 0 1px rgba(131,110,249,0.4), 0 0 12px -2px rgba(131,110,249,0.35)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.03)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                          }
                    }
                  >
                    #{t.tag}
                    <span className={`ml-1 ${active ? 'text-[#9b88ff]' : 'text-zinc-500'}`}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {recentItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                Recently viewed
              </div>
              <button
                onClick={clearRecent}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              {recentItems.slice(0, 12).map((r) => {
                const accent = TYPE_ACCENTS[r.type] || TYPE_ACCENTS.OTHER;
                const Icon = accent.icon;
                return (
                  <div
                    key={r.id}
                    className="group relative shrink-0 w-56 rounded-lg border border-white/8 hover:border-white/20 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <Link
                      href={`/market/agents/${r.id}`}
                      className="block p-3 pr-8"
                      title={r.title}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                          style={{ background: `${accent.color}18` }}
                        >
                          <Icon className="w-3 h-3" style={{ color: accent.color }} />
                        </div>
                        <p className="text-xs font-light text-white truncate flex-1">{r.title}</p>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate">
                        @{r.seller || 'anonymous'}
                      </p>
                    </Link>
                    <button
                      onClick={() => removeRecent(r.id)}
                      aria-label="Remove from recently viewed"
                      className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-200 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/8 mb-8">
          {(['all', 'featured', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-light border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'all' ? 'All Listings' : tab === 'featured' ? 'Featured' : 'Activity'}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {sortedListings.length === 0 ? (
                <EmptyState
                  title="No listings found"
                  description="Try adjusting your search or filters. New listings are added daily."
                  icon={Package}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'featured' && (
            <motion.div
              key="featured"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {listings.slice(0, 3).length === 0 ? (
                <EmptyState
                  title="No featured listings"
                  description="Check back soon for curated picks from our community."
                  icon={Star}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listings.slice(0, 3).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} featured />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {feedPosts.length === 0 ? (
                <EmptyState
                  title="No recent activity"
                  description="Stay tuned for updates, new deals, and community highlights."
                  icon={TrendingUp}
                />
              ) : (
                feedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg border border-white/8 bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    <p className="text-sm font-light text-white">{post.listing.title}</p>
                    <p className="text-xs text-zinc-400 mt-2">{post.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-zinc-600 uppercase tracking-wider">
                        {timeAgo(post.createdAt)}
                      </span>
                      {post.price && (
                        <span className="text-xs font-light text-purple-300">
                          {post.price} {post.currency}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="group relative p-4 rounded-xl overflow-hidden transition-colors hover:bg-white/[0.02]"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -12px rgba(0,0,0,0.55)',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.35) 50%, transparent 100%)',
        }}
      />
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#b4a7ff]"
          style={{
            background:
              'linear-gradient(135deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.06) 100%)',
            border: '1px solid rgba(131,110,249,0.2)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {icon}
        </div>
        <span className="text-[10.5px] text-zinc-500 uppercase tracking-[0.18em] font-medium">
          {label}
        </span>
      </div>
      <p className="text-[26px] font-light text-white leading-none mb-2 tracking-[-0.01em]">
        {value}
      </p>
      <p className="text-[11px] text-zinc-500 tracking-wide">{trend}</p>
    </div>
  );
}

function ListingCard({ listing, featured }: { listing: MarketListing; featured?: boolean }) {
  const accent = TYPE_ACCENTS[listing.type];
  const Icon = accent.icon;
  const { has, toggle } = useFavorites();
  const saved = has(listing.id);

  return (
    <Link
      href={`/market/agents/${listing.id}`}
      className="group relative block text-left p-5 rounded-xl overflow-hidden transition-colors"
      data-featured={featured ? 'true' : undefined}
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 30px -16px rgba(0,0,0,0.5)',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent.color} 50%, transparent 100%)`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
        style={{ background: `${accent.color}25` }}
      />

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(listing.id);
        }}
        aria-pressed={saved}
        aria-label={saved ? 'Remove from saved' : 'Save for later'}
        className={`absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center transition-all z-10 ${
          saved
            ? 'text-pink-300 opacity-100'
            : 'text-zinc-500 hover:text-pink-300 hover:bg-white/5 opacity-0 group-hover:opacity-100'
        }`}
        style={
          saved
            ? {
                background: 'rgba(236,72,153,0.1)',
                border: '1px solid rgba(236,72,153,0.22)',
              }
            : undefined
        }
      >
        <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-pink-300' : ''}`} strokeWidth={1.75} />
      </button>

      <div className="relative flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent.color}22 0%, ${accent.color}08 100%)`,
            border: `1px solid ${accent.color}38`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px -4px ${accent.color}30`,
          }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: accent.color }} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-[14px] font-medium text-white truncate tracking-[-0.005em]">
            {listing.title}
          </h3>
          <p className="text-[11px] text-zinc-500 mt-1">
            by <span className="text-zinc-400">@{listing.seller.username || 'anonymous'}</span>
          </p>
        </div>
      </div>

      {listing.description && (
        <p className="relative text-[12px] text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>
      )}

      <div className="relative flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span
            className="text-[9.5px] font-semibold px-2 py-1 rounded uppercase tracking-[0.12em]"
            style={{
              color: accent.color,
              background: `${accent.color}14`,
              border: `1px solid ${accent.color}26`,
            }}
          >
            {listing.type.replace('_', ' ')}
          </span>
          {listing.reviewAverage !== null &&
            listing.reviewAverage !== undefined &&
            (listing.reviewCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {listing.reviewAverage.toFixed(1)}
                <span className="text-zinc-600">({listing.reviewCount})</span>
              </span>
            )}
        </div>
        <div className="text-right leading-none">
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.12em] mb-1">from</p>
          <p className="text-[14px] font-medium text-white tracking-[-0.005em]">
            {listing.price}
            <span className="text-zinc-500 font-normal ml-1">{listing.currency}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative rounded-xl px-8 py-16 text-center border border-white/8 bg-white/2">
      <div
        className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(131,110,249,0.08)', border: '1px solid rgba(131,110,249,0.2)' }}
      >
        <Icon className="w-6 h-6 text-purple-300" />
      </div>
      <p className="text-white font-light mb-2">{title}</p>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}
