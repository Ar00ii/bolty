'use client';

import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  LayoutGrid,
  List,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed';

interface MarketListing {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency: string;
  tags: string[];
  status: string;
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
  listing: {
    id: string;
    title: string;
    type: string;
    seller: { id: string; username: string | null; avatarUrl: string | null };
  };
}

interface Facets {
  tags: { tag: string; count: number }[];
  types: { type: string; count: number }[];
  priceRange: { min: number; max: number };
  totalActive: number;
}

interface UsageMetric {
  label: string;
  value: string;
  quota: string;
  color: string;
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
    <Suspense fallback={<div className="mk-scope min-h-[60vh]" />}>
      <MarketOverview />
    </Suspense>
  );
}

function MarketOverview() {
  const { isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const { items: recentItems } = useRecentlyViewed();

  const [view, setView] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState(initialSearch);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [loading, setLoading] = useState(true);

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
        const qs = new URLSearchParams({ page: '1', sortBy: 'recent' });
        if (search) qs.set('search', search);
        const [listingsData, feedData] = await Promise.all([
          api.get<{ data: MarketListing[]; total: number; page: number; pages: number }>(
            `/market?${qs.toString()}`,
          ),
          api.get<FeedPost[]>('/market/feed?take=6'),
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
  }, [search]);

  const usage: UsageMetric[] = useMemo(() => {
    const totalActive = facets?.totalActive ?? listings.length;
    const tagCount = facets?.tags.length ?? 0;
    const typeCount = facets?.types.reduce((sum, t) => sum + t.count, 0) ?? listings.length;
    return [
      { label: 'Active Listings', value: formatNumber(totalActive), quota: ' / ∞', color: '#52a8ff' },
      { label: 'Agents Indexed', value: formatNumber(typeCount), quota: ' / ∞', color: '#50e3c2' },
      { label: 'Tags Tracked', value: formatNumber(tagCount), quota: ' / ∞', color: '#f2a20d' },
      { label: 'Recent Updates', value: formatNumber(feedPosts.length), quota: ' / day', color: '#ff6166' },
    ];
  }, [facets, listings.length, feedPosts.length]);

  const filteredListings = useMemo(() => {
    if (!search) return listings;
    const q = search.toLowerCase();
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.seller.username || '').toLowerCase().includes(q),
    );
  }, [listings, search]);

  if (authLoading && loading) {
    return (
      <div className="mk-scope flex items-center justify-center min-h-[50vh]">
        <span className="mk-spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div>
      <Toolbar view={view} setView={setView} search={search} setSearch={setSearch} />

      <div className="mk-overview-grid">
        <div className="mk-overview-grid__left">
          <UsageCard metrics={usage} />
          <AlertsCard />
          <RecentPreviewsCard
            recent={recentItems}
            fallback={listings.slice(0, 5).map((l) => ({
              id: l.id,
              title: l.title,
              type: l.type,
            }))}
          />
        </div>
        <div className="mk-overview-grid__right">
          <div
            className="mk-section-title mk-section-title--accent"
            style={{ marginBottom: 12, fontSize: 16 }}
          >
            Listings
          </div>
          {loading ? (
            <div className="mk-card" style={{ padding: 24, textAlign: 'center' }}>
              <span className="mk-spinner" aria-label="Loading" />
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="mk-empty">
              <Package
                style={{ width: 28, height: 28, color: 'var(--mk-text-muted)', margin: '0 auto' }}
              />
              <p className="mk-empty__title">No listings match</p>
              <p className="mk-empty__desc">
                Try a different search term or clear filters to see all listings.
              </p>
            </div>
          ) : view === 'list' ? (
            <div>
              {filteredListings.map((l) => (
                <ProjectCard key={l.id} listing={l} feed={feedPosts} />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {filteredListings.map((l) => (
                <ProjectCard key={l.id} listing={l} feed={feedPosts} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toolbar({
  view,
  setView,
  search,
  setSearch,
}: {
  view: 'grid' | 'list';
  setView: (v: 'grid' | 'list') => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  return (
    <div className="mk-toolbar">
      <div className="mk-toolbar__search">
        <Search size={14} strokeWidth={1.75} className="mk-toolbar__search-icon" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Listings…"
          aria-label="Search listings"
        />
      </div>
      <button type="button" className="mk-icon-box" aria-label="Filter">
        <SlidersHorizontal size={15} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={view === 'grid' ? 'mk-icon-box mk-icon-box--active' : 'mk-icon-box'}
        aria-label="Grid view"
        onClick={() => setView('grid')}
      >
        <LayoutGrid size={15} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className={view === 'list' ? 'mk-icon-box mk-icon-box--active' : 'mk-icon-box'}
        aria-label="List view"
        onClick={() => setView('list')}
      >
        <List size={15} strokeWidth={1.75} />
      </button>
      <div className="mk-btn-split">
        <Link
          href="/market/agents?tab=mine&new=1"
          className="mk-btn-split__main"
          style={{ color: '#000', textDecoration: 'none', gap: 6 }}
        >
          <Plus size={14} strokeWidth={2} />
          Add New…
        </Link>
        <span className="mk-btn-split__divider" aria-hidden />
        <button type="button" className="mk-btn-split__chevron" aria-label="More">
          <ChevronDown size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function UsageCard({ metrics }: { metrics: UsageMetric[] }) {
  return (
    <div className="mk-card" style={{ padding: 14 }}>
      <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
        <div>
          <div
            className="mk-section-title"
            style={{ margin: 0, fontSize: 12, color: 'var(--mk-text-muted)' }}
          >
            Last 30 days
          </div>
        </div>
        <button type="button" className="mk-upgrade-chip" aria-label="Upgrade">
          Upgrade
        </button>
      </div>
      {metrics.map((m) => (
        <div key={m.label} className="mk-usage-row">
          <span className="mk-usage-row__dot" style={{ background: m.color }} />
          <span className="mk-usage-row__label">{m.label}</span>
          <span className="mk-usage-row__value">
            {m.value}
            <span style={{ color: 'var(--mk-text-muted)' }}>{m.quota}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function AlertsCard() {
  return (
    <div className="mk-card" style={{ marginTop: 16 }}>
      <div className="mk-alerts-card">
        <h3 className="mk-alerts-card__title">Get alerted for new drops</h3>
        <p className="mk-alerts-card__desc">
          Automatically watch listings, price changes, and seller activity in real time.
        </p>
        <Link href="/market/favorites" className="mk-alerts-card__cta">
          Go to Saved
        </Link>
      </div>
    </div>
  );
}

function RecentPreviewsCard({
  recent,
  fallback,
}: {
  recent: { id: string; title: string; type: string }[];
  fallback: { id: string; title: string; type: string }[];
}) {
  const source = recent.length > 0 ? recent : fallback;
  return (
    <div style={{ marginTop: 20 }}>
      <div
        className="mk-section-title"
        style={{ fontSize: 12, color: 'var(--mk-text-muted)', marginBottom: 8 }}
      >
        Recent Previews
      </div>
      <div className="mk-card" style={{ padding: 0 }}>
        {source.length === 0 ? (
          <div className="mk-empty" style={{ padding: '20px 16px', minHeight: 0 }}>
            <p className="mk-empty__title" style={{ fontSize: 13 }}>
              Nothing yet
            </p>
            <p className="mk-empty__desc" style={{ fontSize: 12 }}>
              Recently viewed listings will appear here.
            </p>
          </div>
        ) : (
          <div style={{ padding: '4px 12px' }}>
            {source.slice(0, 6).map((r) => {
              const Icon = TYPE_ICONS[r.type] || TYPE_ICONS.OTHER;
              return (
                <Link
                  key={r.id}
                  href={`/market/agents/${r.id}`}
                  className="mk-preview-row"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="mk-preview-row__icon">
                    <Icon size={12} strokeWidth={1.75} />
                  </span>
                  <span className="mk-preview-row__title">{r.title}</span>
                  <span className="mk-preview-row__tag">{shortId(r.id)}</span>
                  <span className="mk-preview-row__dot" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  listing,
  feed,
  compact = false,
}: {
  listing: MarketListing;
  feed: FeedPost[];
  compact?: boolean;
}) {
  const Icon = TYPE_ICONS[listing.type] || TYPE_ICONS.OTHER;
  const matchedPost = feed.find((p) => p.listing.id === listing.id);
  const domain = buildDomain(listing);
  const repo = listing.repository?.name
    ? listing.repository.name
    : listing.seller.username
      ? `${listing.seller.username}/${slugify(listing.title)}`
      : 'bolty/listing';

  return (
    <Link href={`/market/agents/${listing.id}`} className="mk-project-card">
      <div className="mk-project-card__header">
        <div className="mk-project-card__ident">
          <span
            className="mk-sidebar__avatar"
            style={{ width: 28, height: 28, flexBasis: 28 }}
          >
            <Icon size={14} strokeWidth={1.75} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="mk-project-card__title">{listing.title}</p>
            <p className="mk-project-card__domain">{domain}</p>
          </div>
        </div>
        <div className="mk-project-card__actions">
          <span className="mk-project-card__check" aria-label="Verified">
            <Check size={12} strokeWidth={2} />
          </span>
          <button
            type="button"
            className="mk-icon-btn"
            aria-label="More"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ChevronRight size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      {!compact && (
        <>
          <span className="mk-project-card__repo">
            <GitBranch size={11} strokeWidth={1.75} />
            {repo}
          </span>
          <p className="mk-project-card__commit">
            {matchedPost?.content || listing.description || 'No recent activity.'}
          </p>
          <p className="mk-project-card__meta">
            {timeAgo(listing.createdAt)} on <span style={{ color: 'var(--mk-text-secondary)' }}>main</span>
          </p>
        </>
      )}
    </Link>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function buildDomain(l: MarketListing): string {
  const slug = slugify(l.title) || 'listing';
  return `${slug}.bolty.app`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function shortId(id: string): string {
  return id.slice(0, 7);
}

