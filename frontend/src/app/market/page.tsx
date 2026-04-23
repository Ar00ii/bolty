'use client';

export const dynamic = 'force-dynamic';

import {
  ArrowUpRight,
  Bot,
  Flame,
  GitBranch,
  Package,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, WS_URL } from '@/lib/api/client';
import { getCached, getCachedWithStatus, setCached } from '@/lib/cache/pageCache';

// ── Types ──────────────────────────────────────────────────────────────────

type ListingType = 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
type TypeFilter = 'ALL' | ListingType;
type SortKey = 'trending' | 'recent' | 'volume' | 'price-low' | 'price-high';

interface MarketListing {
  id: string;
  createdAt: string;
  title: string;
  type: ListingType;
  price: number;
  currency: string;
  tags: string[];
  seller: { id: string; username: string | null; avatarUrl: string | null };
  reviewAverage?: number | null;
  reviewCount?: number;
  sales24h?: number;
  volumeEth24h?: number;
  sparkline7d?: number[];
}

interface Pulse {
  stats: {
    activeListings: number;
    totalListings: number;
    totalSales: number;
    sales24h: number;
    volumeEth24h: number;
    traders24h: number;
  };
  recentTrades: Array<{
    id: string;
    createdAt: string;
    priceEth: number | null;
    buyer: { id: string; username: string | null; avatarUrl: string | null };
    seller: { id: string; username: string | null };
    listing: { id: string; title: string; type: ListingType; currency: string; price: number };
  }>;
  recentListings: Array<{
    id: string;
    title: string;
    type: ListingType;
    price: number;
    currency: string;
    tags: string[];
    createdAt: string;
    seller: { id: string; username: string | null; avatarUrl: string | null };
  }>;
}

interface SaleEvent {
  listingId: string;
  listingTitle: string;
  listingType: ListingType;
  priceEth: number | null;
  currency: string;
  buyer: { id: string; username: string | null; avatarUrl: string | null };
  seller: { id: string; username: string | null };
  createdAt: string;
}

interface NewListingEvent {
  listingId: string;
  title: string;
  type: ListingType;
  price: number;
  currency: string;
  tags: string[];
  seller: { id: string; username: string | null; avatarUrl: string | null };
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<ListingType, LucideIcon> = {
  REPO: GitBranch,
  BOT: Bot,
  AI_AGENT: Bot,
  SCRIPT: Zap,
  OTHER: Package,
};

const TYPE_LABEL: Record<ListingType, string> = {
  REPO: 'Repo',
  BOT: 'Bot',
  AI_AGENT: 'Agent',
  SCRIPT: 'Script',
  OTHER: 'Other',
};

const TYPE_ACCENT: Record<ListingType, string> = {
  REPO: '#06B6D4',
  BOT: '#836EF9',
  AI_AGENT: '#836EF9',
  SCRIPT: '#EC4899',
  OTHER: '#94a3b8',
};

function timeAgo(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'now';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toString();
}

function formatEth(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  if (n < 0.0001) return '<0.0001';
  if (n < 1) return n.toFixed(4);
  if (n < 100) return n.toFixed(3);
  return n.toFixed(2);
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function MarketPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <MarketScreener />
    </Suspense>
  );
}

function MarketScreener() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [sort, setSort] = useState<SortKey>('trending');
  const [listings, setListings] = useState<MarketListing[]>(
    () => getCached<MarketListing[]>('market:listings') ?? [],
  );
  const [pulse, setPulse] = useState<Pulse | null>(
    () => getCached<Pulse>('market:pulse') ?? null,
  );
  const [loading, setLoading] = useState(true);

  // Rows that should flash green (listingId → timestamp)
  const [flash, setFlash] = useState<Map<string, number>>(new Map());
  // Rows added live via socket (pre-pended)
  const [liveListings, setLiveListings] = useState<MarketListing[]>([]);
  // Live trade feed (rolling)
  const [liveTrades, setLiveTrades] = useState<Pulse['recentTrades']>([]);
  // Stats that pulse on change
  const [statPulse, setStatPulse] = useState<Record<string, number>>({});

  // ── Fetch initial data ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const hasCache = listings.length > 0 || pulse !== null;
      // For the default (unfiltered) view, skip the network if cache
      // is fresh (<30s). Filtered searches always hit so the user sees
      // their filter applied.
      const isDefaultView = !search && typeFilter === 'ALL' && sort === 'recent';
      if (isDefaultView && hasCache) {
        const { fresh } = getCachedWithStatus('market:listings');
        if (fresh) {
          setLoading(false);
          return;
        }
      }
      if (!hasCache) setLoading(true);
      try {
        const qs = new URLSearchParams({ page: '1' });
        qs.set('sortBy', sort === 'volume' ? 'trending' : sort);
        if (search) qs.set('search', search);
        if (typeFilter !== 'ALL') qs.set('type', typeFilter);

        const [listRes, pulseRes] = await Promise.all([
          api.get<{ data: MarketListing[] }>(`/market?${qs.toString()}`),
          api.get<Pulse>('/market/pulse?limit=20'),
        ]);
        if (cancelled) return;

        const data = listRes?.data || [];
        if (sort === 'volume') {
          data.sort((a, b) => (b.volumeEth24h || 0) - (a.volumeEth24h || 0));
        }
        setListings(data);
        setPulse(pulseRes);
        setLiveTrades(pulseRes?.recentTrades || []);
        // Only cache the default (unfiltered) view — filtered searches
        // would pollute and evict the baseline we want to restore fast.
        if (!search && typeFilter === 'ALL' && sort === 'recent') {
          setCached('market:listings', data);
          setCached('market:pulse', pulseRes);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [search, typeFilter, sort]);

  // ── Websocket ──────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    const socket = io(`${WS_URL}/market`, {
      transports: ['websocket'],
      withCredentials: true,
      timeout: 8000,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
    socketRef.current = socket;

    socket.on('sale', (ev: SaleEvent) => {
      // Flash the row
      setFlash((prev) => {
        const next = new Map(prev);
        next.set(ev.listingId, Date.now());
        return next;
      });
      // Bump 24h stats on the row locally (feels instant)
      setListings((prev) =>
        prev.map((l) =>
          l.id === ev.listingId
            ? {
                ...l,
                sales24h: (l.sales24h || 0) + 1,
                volumeEth24h: Number(((l.volumeEth24h || 0) + (ev.priceEth || 0)).toFixed(4)),
              }
            : l,
        ),
      );
      // Prepend to live trades
      setLiveTrades((prev) => {
        const next = [
          {
            id: `live-${ev.listingId}-${Date.now()}`,
            createdAt: ev.createdAt,
            priceEth: ev.priceEth,
            buyer: ev.buyer,
            seller: ev.seller,
            listing: {
              id: ev.listingId,
              title: ev.listingTitle,
              type: ev.listingType,
              currency: ev.currency,
              price: 0,
            },
          },
          ...prev,
        ];
        return next.slice(0, 40);
      });
      // Pulse the global stats
      setStatPulse({ sales24h: Date.now(), volumeEth24h: Date.now() });
      setPulse((p) =>
        p
          ? {
              ...p,
              stats: {
                ...p.stats,
                sales24h: p.stats.sales24h + 1,
                volumeEth24h: Number((p.stats.volumeEth24h + (ev.priceEth || 0)).toFixed(4)),
              },
            }
          : p,
      );
    });

    socket.on('new-listing', (ev: NewListingEvent) => {
      setLiveListings((prev) => {
        if (prev.some((l) => l.id === ev.listingId)) return prev;
        const entry: MarketListing = {
          id: ev.listingId,
          createdAt: ev.createdAt,
          title: ev.title,
          type: ev.type,
          price: ev.price,
          currency: ev.currency,
          tags: ev.tags,
          seller: ev.seller,
          reviewAverage: null,
          reviewCount: 0,
          sales24h: 0,
          volumeEth24h: 0,
          sparkline7d: new Array(7).fill(0),
        };
        return [entry, ...prev].slice(0, 10);
      });
      setStatPulse((p) => ({ ...p, activeListings: Date.now() }));
      setPulse((p) =>
        p
          ? {
              ...p,
              stats: {
                ...p.stats,
                activeListings: p.stats.activeListings + 1,
                totalListings: p.stats.totalListings + 1,
              },
              recentListings: [
                {
                  id: ev.listingId,
                  title: ev.title,
                  type: ev.type,
                  price: ev.price,
                  currency: ev.currency,
                  tags: ev.tags,
                  createdAt: ev.createdAt,
                  seller: ev.seller,
                },
                ...(p.recentListings || []),
              ].slice(0, 20),
            }
          : p,
      );
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Clear stale flashes
  useEffect(() => {
    if (flash.size === 0) return;
    // Check at 1600ms — just past the 1500ms flash duration — so we fire
    // only once per flash event instead of 3 times.
    const t = setInterval(() => {
      const now = Date.now();
      setFlash((prev) => {
        let changed = false;
        const next = new Map(prev);
        next.forEach((v, k) => {
          if (now - v > 1500) {
            next.delete(k);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [flash.size]);

  // Merge live listings into the main table
  const mergedListings = useMemo(() => {
    if (liveListings.length === 0) return listings;
    const seen = new Set(listings.map((l) => l.id));
    const fresh = liveListings.filter((l) => !seen.has(l.id));
    return [...fresh, ...listings];
  }, [listings, liveListings]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="px-6 pt-4 pb-4 md:px-10 md:pt-5">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-medium text-zinc-200 uppercase tracking-[0.18em] mb-2">
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Bolty Screener</span>
                <LiveDot />
              </div>
              <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white">
                Marketplace
              </h1>
            </div>
            <Link
              href="/market/seller/publish"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12.5px] font-normal text-white transition"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.9) 0%, rgba(131,110,249,0.7) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 14px -6px rgba(131,110,249,0.5)',
              }}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              Publish listing
            </Link>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <section className="px-6 md:px-10 mb-4">
        <div className="mx-auto max-w-[1400px] grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatTile
            label="24h volume"
            value={`${formatEth(pulse?.stats.volumeEth24h || 0)} ETH`}
            sub={`${pulse?.stats.sales24h ?? 0} sales`}
            pulseKey={statPulse.volumeEth24h}
            accent="#836EF9"
          />
          <StatTile
            label="24h sales"
            value={formatNumber(pulse?.stats.sales24h || 0)}
            sub={`${pulse?.stats.traders24h ?? 0} traders`}
            pulseKey={statPulse.sales24h}
            accent="#22c55e"
          />
          <StatTile
            label="Active listings"
            value={formatNumber(pulse?.stats.activeListings || 0)}
            sub={`${pulse?.stats.totalListings ?? 0} total`}
            pulseKey={statPulse.activeListings}
            accent="#06B6D4"
          />
          <StatTile
            label="All-time sales"
            value={formatNumber(pulse?.stats.totalSales || 0)}
            sub="since launch"
            accent="#EC4899"
          />
        </div>
      </section>

      {/* New launches ticker */}
      <NewLaunchesTicker items={pulse?.recentListings || []} />

      {/* Filters */}
      <section className="px-6 md:px-10 mt-5 mb-3">
        <div className="mx-auto max-w-[1400px] flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-1 min-w-[240px] max-w-md px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
            <Search className="w-3.5 h-3.5 text-zinc-200" strokeWidth={1.75} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents, repos, bots, tags…"
              className="flex-1 bg-transparent border-none outline-none text-[13px] font-light text-white placeholder-zinc-400"
            />
          </div>

          <TypeTabs value={typeFilter} onChange={setTypeFilter} />

          <div className="flex items-center gap-1 ml-auto">
            <SortChip
              active={sort === 'trending'}
              onClick={() => setSort('trending')}
              icon={<Flame className="w-3 h-3" strokeWidth={1.75} />}
              label="Hot"
            />
            <SortChip
              active={sort === 'recent'}
              onClick={() => setSort('recent')}
              icon={<Sparkles className="w-3 h-3" strokeWidth={1.75} />}
              label="New"
            />
            <SortChip
              active={sort === 'volume'}
              onClick={() => setSort('volume')}
              icon={<TrendingUp className="w-3 h-3" strokeWidth={1.75} />}
              label="Volume"
            />
            <SortChip
              active={sort === 'price-low'}
              onClick={() => setSort('price-low')}
              label="Low $"
            />
            <SortChip
              active={sort === 'price-high'}
              onClick={() => setSort('price-high')}
              label="High $"
            />
          </div>
        </div>
      </section>

      {/* Table + trades feed */}
      <section className="px-6 md:px-10">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div>
            <ScreenerTable
              listings={mergedListings}
              flash={flash}
              liveIds={new Set(liveListings.map((l) => l.id))}
              loading={loading}
            />
          </div>
          <aside className="hidden lg:block">
            <LiveTradesFeed trades={liveTrades} />
          </aside>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative inline-flex items-center justify-center w-2 h-2 ml-1">
      <span
        className="absolute inset-0 rounded-full animate-ping"
        style={{ background: '#22c55e' }}
      />
      <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
    </span>
  );
}

function StatTile({
  label,
  value,
  sub,
  pulseKey,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  pulseKey?: number;
  accent: string;
}) {
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (!pulseKey) return;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 700);
    return () => clearTimeout(t);
  }, [pulseKey]);

  return (
    <div
      className="relative rounded-xl px-4 py-3 overflow-hidden transition-all"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
        boxShadow: pulsing
          ? `0 0 0 1px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.04), 0 0 20px -4px ${accent}55`
          : '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
        }}
      />
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-200 mb-1">
        {label}
      </div>
      <div className="font-mono text-xl md:text-2xl font-light text-white tabular-nums">
        {value}
      </div>
      <div className="text-[10.5px] text-zinc-200 font-light mt-0.5">{sub}</div>
    </div>
  );
}

function NewLaunchesTicker({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    type: ListingType;
    price: number;
    currency: string;
    createdAt: string;
  }>;
}) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];
  return (
    <section className="px-6 md:px-10 mb-2">
      <div
        className="mx-auto max-w-[1400px] relative overflow-hidden rounded-lg py-2"
        style={{
          background: 'linear-gradient(90deg, rgba(34,197,94,0.05), rgba(131,110,249,0.05))',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="flex items-center gap-1.5 px-3 text-[10.5px] uppercase tracking-[0.16em] text-[#22c55e] font-medium whitespace-nowrap absolute left-0 top-0 bottom-0 z-10 pr-3"
          style={{
            background: 'linear-gradient(90deg, rgba(10,10,14,0.95) 70%, transparent)',
          }}
        >
          <Sparkles className="w-3 h-3" strokeWidth={2} />
          New launches
        </div>
        <div
          className="flex gap-6 whitespace-nowrap pl-36"
          style={{
            animation: 'bolty-ticker 60s linear infinite',
          }}
        >
          {doubled.map((item, i) => {
            const Icon = TYPE_ICON[item.type] ?? Package;
            return (
              <Link
                href={`/market/agents/${item.id}`}
                key={`${item.id}-${i}`}
                className="inline-flex items-center gap-2 text-[12px] font-light text-zinc-300 hover:text-white transition"
              >
                <Icon
                  className="w-3 h-3"
                  strokeWidth={1.75}
                  style={{ color: TYPE_ACCENT[item.type] }}
                />
                <span>{item.title}</span>
                <span className="font-mono text-[#b4a7ff]">
                  {formatEth(item.price)} {item.currency}
                </span>
                <span className="text-zinc-300">· {timeAgo(item.createdAt)} ago</span>
              </Link>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        @keyframes bolty-ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}

function TypeTabs({ value, onChange }: { value: TypeFilter; onChange: (v: TypeFilter) => void }) {
  const tabs: { key: TypeFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'AI_AGENT', label: 'Agents' },
    { key: 'BOT', label: 'Bots' },
    { key: 'REPO', label: 'Repos' },
    { key: 'SCRIPT', label: 'Scripts' },
  ];
  return (
    <div
      className="flex items-center gap-0.5 rounded-lg p-0.5"
      style={{
        background: 'rgba(0,0,0,0.4)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className="px-2.5 py-1 text-[12px] font-light rounded-md transition"
          style={{
            color: value === t.key ? '#ffffff' : '#d4d4d8',
            background: value === t.key ? 'rgba(131,110,249,0.2)' : 'transparent',
            boxShadow: value === t.key ? 'inset 0 0 0 1px rgba(131,110,249,0.35)' : 'none',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SortChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-light transition"
      style={{
        color: active ? '#ffffff' : '#d4d4d8',
        background: active ? 'rgba(131,110,249,0.18)' : 'rgba(255,255,255,0.02)',
        boxShadow: active
          ? 'inset 0 0 0 1px rgba(131,110,249,0.4)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ScreenerTable({
  listings,
  flash,
  liveIds,
  loading,
}: {
  listings: MarketListing[];
  flash: Map<string, number>;
  liveIds: Set<string>;
  loading: boolean;
}) {
  if (loading && listings.length === 0) {
    return (
      <div
        className="rounded-xl px-6 py-20 text-center text-sm text-zinc-200 font-light"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        Loading market data…
      </div>
    );
  }

  if (!loading && listings.length === 0) {
    return (
      <div
        className="rounded-xl px-6 py-20 text-center"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div className="text-sm font-light text-zinc-300">No listings match your filters.</div>
        <div className="text-xs font-light text-zinc-200 mt-1">
          Try changing the type or clearing the search.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div className="grid grid-cols-[28px_minmax(0,1fr)_90px_72px_88px_72px_120px_32px] md:grid-cols-[28px_minmax(0,1fr)_100px_90px_100px_90px_140px_32px] items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-zinc-200 font-medium border-b border-white/5">
        <span className="text-center">#</span>
        <span>Listing</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
        <span className="text-right">24h vol</span>
        <span className="text-right">Rating</span>
        <span className="hidden md:block">Seller</span>
        <span />
      </div>
      <ul>
        {listings.map((l, i) => (
          <Row
            key={l.id}
            listing={l}
            index={i}
            flashedAt={flash.get(l.id)}
            isLive={liveIds.has(l.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function Row({
  listing,
  index,
  flashedAt,
  isLive,
}: {
  listing: MarketListing;
  index: number;
  flashedAt?: number;
  isLive: boolean;
}) {
  const Icon = TYPE_ICON[listing.type] ?? Package;
  const accent = TYPE_ACCENT[listing.type];
  const flashing = !!flashedAt && Date.now() - flashedAt < 1500;
  const sparkline = listing.sparkline7d || [];

  return (
    <li>
      <Link
        href={`/market/agents/${listing.id}`}
        className="group relative grid grid-cols-[28px_minmax(0,1fr)_90px_72px_88px_72px_120px_32px] md:grid-cols-[28px_minmax(0,1fr)_100px_90px_100px_90px_140px_32px] items-center gap-3 px-3 py-2.5 border-b border-white/[0.04] transition-all"
        style={{
          background: flashing
            ? 'linear-gradient(90deg, rgba(34,197,94,0.12), rgba(34,197,94,0.02))'
            : isLive
              ? 'linear-gradient(90deg, rgba(131,110,249,0.08), transparent)'
              : 'transparent',
        }}
      >
        {/* Flash left bar */}
        {flashing && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[2px]"
            style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}
          />
        )}
        {isLive && !flashing && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[2px]"
            style={{ background: accent, opacity: 0.6 }}
          />
        )}

        <span className="text-[11px] text-zinc-300 font-mono text-center tabular-nums">
          {index + 1}
        </span>

        <div className="min-w-0 flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: `${accent}18`,
              boxShadow: `inset 0 0 0 1px ${accent}40`,
            }}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-normal text-white truncate">{listing.title}</span>
              {isLive && (
                <span
                  className="text-[9px] uppercase tracking-[0.12em] px-1 py-px rounded"
                  style={{
                    color: '#22c55e',
                    background: 'rgba(34,197,94,0.1)',
                    boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.3)',
                  }}
                >
                  NEW
                </span>
              )}
            </div>
            <div className="text-[10.5px] text-zinc-200 font-light flex items-center gap-1">
              <span style={{ color: accent }}>{TYPE_LABEL[listing.type]}</span>
              {(listing.tags || []).slice(0, 2).map((t) => (
                <span key={t} className="text-zinc-300">
                  · {t}
                </span>
              ))}
              <span className="text-zinc-300">· {timeAgo(listing.createdAt)} ago</span>
            </div>
          </div>
        </div>

        <div className="text-right font-mono tabular-nums text-[12.5px] text-[#b4a7ff]">
          {formatEth(listing.price)}
          <span className="text-zinc-300 ml-1 text-[10px]">{listing.currency}</span>
        </div>

        <div className="text-right font-mono tabular-nums text-[12px]">
          <SalesCell sales={listing.sales24h || 0} />
        </div>

        <div className="text-right font-mono tabular-nums text-[12px] text-zinc-300 flex items-center justify-end gap-1.5">
          <Sparkline data={sparkline} accent={listing.sales24h ? '#22c55e' : '#52525b'} />
          <span className="w-12 text-right">{formatEth(listing.volumeEth24h || 0)}</span>
        </div>

        <div className="text-right text-[12px] text-zinc-300 font-light">
          {listing.reviewCount ? (
            <span>
              <span className="text-[#f59e0b]">★</span> {(listing.reviewAverage ?? 0).toFixed(1)}
              <span className="text-zinc-300 ml-0.5 text-[10px]">({listing.reviewCount})</span>
            </span>
          ) : (
            <span className="text-zinc-300">—</span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[11.5px] text-zinc-400 font-light truncate">
          <UserAvatar
            src={listing.seller.avatarUrl}
            name={listing.seller.username}
            userId={listing.seller.id}
            size={20}
          />
          <span className="truncate">@{listing.seller.username || 'unknown'}</span>
        </div>

        <ArrowUpRight
          className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white transition"
          strokeWidth={1.75}
        />
      </Link>
    </li>
  );
}

function SalesCell({ sales }: { sales: number }) {
  if (sales === 0) return <span className="text-zinc-300">0</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-[#22c55e]">
      <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
      {sales}
    </span>
  );
}

function Sparkline({ data, accent }: { data: number[]; accent: string }) {
  if (!data || data.length === 0) return <span className="w-12 h-4 inline-block" />;
  const max = Math.max(1, ...data);
  const w = 48;
  const h = 16;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="flex-shrink-0" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={accent}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LiveTradesFeed({ trades }: { trades: Pulse['recentTrades'] }) {
  return (
    <div
      className="rounded-xl overflow-hidden sticky top-4"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.16em] text-zinc-200 font-medium">
          Live trades
          <LiveDot />
        </div>
        <span className="text-[10px] text-zinc-300 font-light">{trades.length}</span>
      </div>
      {trades.length === 0 ? (
        <div className="px-3 py-10 text-center text-[12px] text-zinc-200 font-light">
          Waiting for the first trade…
        </div>
      ) : (
        <ul className="max-h-[560px] overflow-y-auto">
          {trades.map((t) => (
            <TradeRow key={t.id} trade={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TradeRow({ trade }: { trade: Pulse['recentTrades'][number] }) {
  const Icon = TYPE_ICON[trade.listing.type] ?? Package;
  const accent = TYPE_ACCENT[trade.listing.type];
  return (
    <li className="border-b border-white/[0.04] last:border-0">
      <Link
        href={`/market/agents/${trade.listing.id}`}
        className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition"
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, boxShadow: `inset 0 0 0 1px ${accent}40` }}
        >
          <Icon className="w-3 h-3" strokeWidth={1.75} style={{ color: accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] text-white truncate font-light">{trade.listing.title}</div>
          <div className="text-[10px] text-zinc-200 font-light truncate">
            <span className="text-[#22c55e]">@{trade.buyer.username || 'anon'}</span>
            <span className="text-zinc-300"> bought from </span>
            <span className="text-zinc-400">@{trade.seller.username || 'anon'}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-[11.5px] text-[#b4a7ff] tabular-nums">
            {formatEth(trade.priceEth)}
          </div>
          <div className="text-[10px] text-zinc-300 font-light">{timeAgo(trade.createdAt)}</div>
        </div>
      </Link>
    </li>
  );
}
