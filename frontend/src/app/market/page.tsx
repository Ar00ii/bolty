'use client';

import {
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
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useState, useEffect, useRef } from 'react';

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

const TYPE_ICONS: Record<string, LucideIcon> = {
  REPO: GitBranch,
  BOT: Bot,
  AI_AGENT: Bot,
  SCRIPT: Zap,
  OTHER: Package,
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
    <Suspense fallback={<div className="mk-scope min-h-screen" />}>
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
      <div className="mk-scope flex items-center justify-center min-h-screen">
        <span className="mk-spinner" aria-label="Loading" />
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
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="mk-scope mk-page">
      {/* Top bar */}
      <div
        className="sticky top-0 z-40"
        style={{
          background: '#000',
          borderBottom: '1px solid var(--mk-surface-3)',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <h1 className="mk-title" style={{ fontSize: 20, lineHeight: '28px' }}>
                Marketplace
              </h1>
              <p className="mk-card-meta" style={{ marginTop: 4 }}>
                Access {listings.length} AI agents, repositories, and services from the community.
              </p>
            </div>
            <div className="flex flex-wrap gap-1 overflow-x-auto">
              <NavChip href="/market/agents" icon={Bot} label="Agents" />
              <NavChip href="/market/repos" icon={GitBranch} label="Repos" />
              <NavChip href="/market/sellers" icon={Users} label="Sellers" />
              <NavChip href="/market/tags" icon={Hash} label="Tags" />
              <NavChip
                href="/market/favorites"
                icon={Heart}
                label="Saved"
                badge={favoriteIds.length > 0 ? favoriteIds.length : undefined}
              />
              <NavChip href="/market/library" icon={Library} label="Library" />
              <NavChip href="/market/seller" icon={BarChart3} label="Seller" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Listings" value={listings.length.toString()} trend="+12%" />
            <StatCard
              label="Recent Activity"
              value={feedPosts.length.toString()}
              trend="This week"
            />
            <StatCard label="Community Size" value="500+" trend="Active devs" />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={1.5}
              style={{ width: 16, height: 16, color: 'var(--mk-text-placeholder)' }}
            />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search agents, repos, services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mk-search"
              style={{ paddingLeft: 36, paddingRight: 36 }}
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 mk-btn-ghost"
                style={{ height: 24, padding: '0 6px' }}
                aria-label="Clear search"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            ) : (
              <kbd className="mk-kbd absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex">
                /
              </kbd>
            )}
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="mk-select"
            >
              <option value="recent">Most Recent</option>
              <option value="trending">Trending</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--mk-text-placeholder)' }}
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

        {/* Filters */}
        <div className="mk-card mb-6" style={{ padding: 14 }}>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="mk-card-meta"
              style={{ fontSize: 12, color: 'var(--mk-text-muted)' }}
            >
              Filters
            </span>
            {activeFilterCount > 0 && <span className="mk-badge mk-badge--plan">{activeFilterCount}</span>}
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="mk-input mk-input--sm"
                style={{ width: 96 }}
              />
              <span style={{ color: 'var(--mk-text-muted)' }}>–</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mk-input mk-input--sm"
                style={{ width: 96 }}
              />
            </div>
            <label
              className="inline-flex items-center gap-2"
              style={{ fontSize: 13, color: 'var(--mk-text)' }}
            >
              <input
                type="checkbox"
                checked={hasDemo}
                onChange={(e) => setHasDemo(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: '#52a8ff' }}
              />
              Live demo available
            </label>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mk-btn-ghost ml-auto">
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
                    className={active ? 'mk-badge mk-badge--plan' : 'mk-badge mk-badge--neutral'}
                    style={{ cursor: 'pointer' }}
                  >
                    #{t.tag}
                    <span style={{ marginLeft: 4, color: 'var(--mk-text-muted)' }}>{t.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently viewed */}
        {recentItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span
                className="inline-flex items-center gap-2"
                style={{ fontSize: 12, color: 'var(--mk-text-muted)' }}
              >
                <Clock style={{ width: 14, height: 14 }} />
                Recently viewed
              </span>
              <button onClick={clearRecent} className="mk-btn-ghost">
                Clear all
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentItems.slice(0, 12).map((r) => {
                const Icon = TYPE_ICONS[r.type] || TYPE_ICONS.OTHER;
                return (
                  <div
                    key={r.id}
                    className="mk-card mk-card--hover relative shrink-0"
                    style={{ width: 240, padding: 12 }}
                  >
                    <Link
                      href={`/market/agents/${r.id}`}
                      className="flex items-center gap-2"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      <span className="mk-type-icon" style={{ width: 28, height: 28 }}>
                        <Icon style={{ width: 14, height: 14 }} />
                      </span>
                      <div className="min-w-0">
                        <p
                          className="mk-card-title truncate"
                          style={{ fontSize: 13 }}
                          title={r.title}
                        >
                          {r.title}
                        </p>
                        <p className="mk-card-meta truncate" style={{ fontSize: 12 }}>
                          @{r.seller || 'anonymous'}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeRecent(r.id)}
                      aria-label="Remove from recently viewed"
                      className="mk-btn-ghost absolute"
                      style={{ top: 6, right: 6, height: 20, padding: '0 4px' }}
                    >
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mk-tabs mb-6">
          {(['all', 'featured', 'activity'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={active ? 'mk-tab mk-tab--active' : 'mk-tab'}
              >
                {tab === 'all' ? 'All Listings' : tab === 'featured' ? 'Featured' : 'Activity'}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'all' &&
          (sortedListings.length === 0 ? (
            <EmptyState
              title="No listings found"
              description="Try adjusting your search or filters. New listings are added daily."
              icon={Package}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedListings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ))}

        {activeTab === 'featured' &&
          (listings.slice(0, 3).length === 0 ? (
            <EmptyState
              title="No featured listings"
              description="Check back soon for curated picks from our community."
              icon={Package}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.slice(0, 3).map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ))}

        {activeTab === 'activity' &&
          (feedPosts.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Stay tuned for updates, new deals, and community highlights."
              icon={Package}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {feedPosts.map((post) => {
                const badgeClass =
                  post.postType === 'PRICE_UPDATE'
                    ? 'mk-badge mk-badge--amber'
                    : post.postType === 'ANNOUNCEMENT'
                      ? 'mk-badge mk-badge--plan'
                      : post.postType === 'DEAL'
                        ? 'mk-badge mk-badge--success'
                        : 'mk-badge mk-badge--neutral';
                return (
                  <div key={post.id} className="mk-card">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={badgeClass}>{post.postType.replace('_', ' ')}</span>
                      <span className="mk-card-meta" style={{ fontSize: 12 }}>
                        {timeAgo(post.createdAt)}
                      </span>
                    </div>
                    <p className="mk-card-title">{post.listing.title}</p>
                    <p className="mk-card-sub mt-1">{post.content}</p>
                    {post.price && (
                      <div className="mt-2">
                        <span className="mk-badge mk-badge--plan">
                          {post.price} {post.currency}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
      </div>
    </div>
  );
}

function NavChip({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}) {
  return (
    <Link href={href} className="mk-nav-item">
      <Icon style={{ width: 14, height: 14, color: 'var(--mk-text-secondary)' }} />
      {label}
      {badge !== undefined && (
        <span className="mk-badge mk-badge--plan" style={{ marginLeft: 4 }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="mk-stat">
      <div className="mk-stat__label">{label}</div>
      <div className="mk-stat__value">{value}</div>
      <div className="mk-stat__trend">{trend}</div>
    </div>
  );
}

function ListingCard({ listing }: { listing: MarketListing }) {
  const Icon = TYPE_ICONS[listing.type] || TYPE_ICONS.OTHER;
  const { has, toggle } = useFavorites();
  const saved = has(listing.id);

  return (
    <Link
      href={`/market/agents/${listing.id}`}
      className="mk-card mk-card--hover"
      style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mk-type-icon">
            <Icon style={{ width: 16, height: 16 }} />
          </span>
          <div className="min-w-0">
            <p className="mk-card-title truncate">{listing.title}</p>
            <p className="mk-card-sub">@{listing.seller.username || 'anonymous'}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(listing.id);
          }}
          aria-pressed={saved}
          aria-label={saved ? 'Remove from saved' : 'Save for later'}
          className="mk-btn-ghost"
          style={{ height: 24, padding: '0 6px' }}
        >
          <Heart
            style={{
              width: 14,
              height: 14,
              color: saved ? 'var(--mk-link)' : 'var(--mk-text-secondary)',
              fill: saved ? 'var(--mk-link)' : 'none',
            }}
          />
        </button>
      </div>

      {listing.description && (
        <p
          className="mk-card-sub mb-3"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {listing.description}
        </p>
      )}

      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid var(--mk-surface-3)' }}
      >
        <div className="flex items-center gap-2">
          <span className="mk-type-chip">{listing.type.replace('_', ' ')}</span>
          {(listing.reviewCount ?? 0) > 0 &&
            listing.reviewAverage !== null &&
            listing.reviewAverage !== undefined && (
              <span
                className="mk-card-meta"
                style={{ fontSize: 12 }}
              >
                ★ {listing.reviewAverage.toFixed(1)}
                <span style={{ color: 'var(--mk-text-muted)', marginLeft: 4 }}>
                  ({listing.reviewCount})
                </span>
              </span>
            )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mk-card-meta" style={{ fontSize: 11 }}>
            from
          </div>
          <div className="mk-card-title" style={{ fontSize: 14 }}>
            {listing.price}
            <span
              style={{ color: 'var(--mk-text-secondary)', marginLeft: 4, fontWeight: 400 }}
            >
              {listing.currency}
            </span>
          </div>
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
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
}) {
  return (
    <div className="mk-empty">
      <Icon style={{ width: 28, height: 28, color: 'var(--mk-text-muted)', margin: '0 auto' }} />
      <p className="mk-empty__title">{title}</p>
      <p className="mk-empty__desc">{description}</p>
    </div>
  );
}
