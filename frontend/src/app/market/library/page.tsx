'use client';

import {
  ArrowUpRight,
  Bot,
  Clock,
  Download,
  ExternalLink,
  GitBranch,
  Library,
  Package,
  Play,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { api, API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';

type ListingType = 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
type TypeFilter = 'ALL' | ListingType;

interface LibraryItem {
  orderId: string;
  purchasedAt: string;
  status: string;
  escrowStatus: string;
  myRating: number | null;
  listing: {
    id: string;
    title: string;
    type: ListingType;
    price: number;
    currency: string;
    tags: string[];
    agentUrl: string | null;
    agentEndpoint: string | null;
    fileKey: string | null;
    fileName: string | null;
    fileSize: number | null;
    fileMimeType: string | null;
    status: string;
    seller: { id: string; username: string | null; avatarUrl: string | null };
  } | null;
}

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

function formatEth(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  if (n < 0.0001) return '<0.0001';
  if (n < 1) return n.toFixed(4);
  if (n < 100) return n.toFixed(3);
  return n.toFixed(2);
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toString();
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TypeFilter>('ALL');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoading(true);
        const data = await api.get<LibraryItem[]>('/market/library');
        setItems(data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isLoading, router]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      items.filter((i) => {
        if (!i.listing) return false;
        if (filter !== 'ALL' && i.listing.type !== filter) return false;
        if (q) {
          const haystack = [
            i.listing.title,
            i.listing.seller.username ?? '',
            ...(i.listing.tags || []),
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
    [items, filter, q],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) {
      if (!i.listing) continue;
      c[i.listing.type] = (c[i.listing.type] || 0) + 1;
    }
    return c;
  }, [items]);

  const totalSpent = useMemo(
    () =>
      items.reduce((sum, i) => {
        if (!i.listing) return sum;
        return sum + (Number.isFinite(i.listing.price) ? i.listing.price : 0);
      }, 0),
    [items],
  );

  const downloadable = useMemo(
    () => items.filter((i) => i.listing?.fileKey).length,
    [items],
  );

  const liveAgents = useMemo(
    () => items.filter((i) => i.listing?.agentEndpoint || i.listing?.agentUrl).length,
    [items],
  );

  const thisMonth = useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return items.filter((i) => new Date(i.purchasedAt).getTime() >= since).length;
  }, [items]);

  if (isLoading || (loading && items.length === 0)) {
    return (
      <div className="min-h-screen pb-20 px-6 md:px-10 pt-10">
        <div className="mx-auto max-w-[1400px]">
          <div
            className="rounded-xl px-6 py-20 text-center text-sm text-zinc-500 font-light"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            Loading your library…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 md:px-10 md:pt-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-medium text-zinc-500 uppercase tracking-[0.18em] mb-2">
                <Library className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Library</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white">
                Your library
              </h1>
              <p className="text-[12.5px] text-zinc-500 font-light mt-1">
                Everything you own — agents, bots, scripts and repos — one click away.
              </p>
            </div>
            <Link
              href="/market"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12.5px] font-normal text-white transition"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.9) 0%, rgba(131,110,249,0.7) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 14px -6px rgba(131,110,249,0.5)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
              Browse marketplace
            </Link>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <section className="px-6 md:px-10 mb-4">
        <div className="mx-auto max-w-[1400px] grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatTile
            label="Items owned"
            value={formatNumber(items.length)}
            sub={`${thisMonth} this month`}
            accent="#836EF9"
          />
          <StatTile
            label="Total spent"
            value={`${formatEth(totalSpent)} ETH`}
            sub="across all orders"
            accent="#EC4899"
          />
          <StatTile
            label="Downloads"
            value={formatNumber(downloadable)}
            sub="files ready"
            accent="#22c55e"
          />
          <StatTile
            label="Live agents"
            value={formatNumber(liveAgents)}
            sub="interactive"
            accent="#06B6D4"
          />
        </div>
      </section>

      {/* Empty state */}
      {items.length === 0 ? (
        <section className="px-6 md:px-10">
          <div className="mx-auto max-w-[1400px]">
            <EmptyState />
          </div>
        </section>
      ) : (
        <>
          {/* Filters */}
          <section className="px-6 md:px-10 mb-3">
            <div className="mx-auto max-w-[1400px] flex items-center gap-2 flex-wrap">
              <div
                className="flex items-center gap-1 flex-1 min-w-[220px] max-w-md px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <Search className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.75} />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your library…"
                  className="flex-1 bg-transparent border-none outline-none text-[12.5px] font-light text-white placeholder-zinc-600"
                />
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center justify-center text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    /
                  </kbd>
                )}
              </div>

              <div
                className="flex items-center gap-0.5 rounded-lg p-0.5 ml-auto"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <FilterChip
                  label="All"
                  count={items.length}
                  active={filter === 'ALL'}
                  onClick={() => setFilter('ALL')}
                />
                {(['AI_AGENT', 'BOT', 'SCRIPT', 'REPO'] as const).map((t) => {
                  const c = counts[t] || 0;
                  if (c === 0) return null;
                  return (
                    <FilterChip
                      key={t}
                      label={TYPE_LABEL[t]}
                      count={c}
                      active={filter === t}
                      onClick={() => setFilter(t)}
                      accent={TYPE_ACCENT[t]}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* Table */}
          <section className="px-6 md:px-10">
            <div className="mx-auto max-w-[1400px]">
              <LibraryTable items={visible} query={query} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ── Components ──────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className="relative rounded-xl px-4 py-3 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
        }}
      />
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500 mb-1">
        {label}
      </div>
      <div className="font-mono text-xl md:text-2xl font-light text-white tabular-nums">
        {value}
      </div>
      <div className="text-[10.5px] text-zinc-500 font-light mt-0.5">{sub}</div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  accent,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) {
  const c = accent || '#836EF9';
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-light transition"
      style={{
        color: active ? '#ffffff' : '#a1a1aa',
        background: active ? `${c}22` : 'transparent',
        boxShadow: active ? `inset 0 0 0 1px ${c}5a` : 'none',
      }}
    >
      {label}
      <span
        className="text-[10.5px] font-mono tabular-nums"
        style={{ color: active ? `${c}ee` : '#71717a' }}
      >
        {count}
      </span>
    </button>
  );
}

function LibraryTable({ items, query }: { items: LibraryItem[]; query: string }) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-xl px-6 py-12 text-center"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div className="text-sm font-light text-zinc-300">
          {query ? `No items match "${query}".` : 'No items match this filter.'}
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
      <div className="grid grid-cols-[28px_minmax(0,1fr)_80px_90px_80px_90px_220px_28px] items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500 font-medium border-b border-white/5">
        <span className="text-center">#</span>
        <span>Item</span>
        <span>Type</span>
        <span className="text-right">Price</span>
        <span className="text-right">Rating</span>
        <span className="text-right">Purchased</span>
        <span className="hidden md:block">Actions</span>
        <span />
      </div>
      <ul>
        {items.map((item, i) => {
          if (!item.listing) return null;
          return <LibraryRow key={item.orderId} item={item} index={i} />;
        })}
      </ul>
    </div>
  );
}

function LibraryRow({ item, index }: { item: LibraryItem; index: number }) {
  const l = item.listing!;
  const Icon = TYPE_ICON[l.type] ?? Package;
  const accent = TYPE_ACCENT[l.type];

  return (
    <li>
      <div className="group relative grid grid-cols-[28px_minmax(0,1fr)_80px_90px_80px_90px_220px_28px] items-center gap-3 px-3 py-2.5 border-b border-white/[0.04] transition-all hover:bg-white/[0.02]">
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: accent, opacity: 0.55 }}
        />

        <span className="text-[11px] text-zinc-600 font-mono text-center tabular-nums">
          {index + 1}
        </span>

        <Link
          href={`/market/agents/${l.id}`}
          className="min-w-0 flex items-center gap-2.5 hover:text-white transition"
        >
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
            <div className="text-[13px] font-normal text-white truncate">{l.title}</div>
            <div className="text-[10.5px] text-zinc-500 font-light flex items-center gap-1.5 truncate">
              <span>@{l.seller.username || 'anon'}</span>
              {(l.tags || []).slice(0, 2).map((t) => (
                <span key={t} className="text-zinc-600">
                  · {t}
                </span>
              ))}
            </div>
          </div>
        </Link>

        <div>
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              color: accent,
              background: `${accent}14`,
              boxShadow: `inset 0 0 0 1px ${accent}40`,
            }}
          >
            {TYPE_LABEL[l.type]}
          </span>
        </div>

        <div className="text-right font-mono tabular-nums text-[12.5px] text-[#b4a7ff]">
          {formatEth(l.price)}
          <span className="text-zinc-600 ml-1 text-[10px]">{l.currency}</span>
        </div>

        <div className="text-right text-[11.5px] font-light">
          {item.myRating !== null ? (
            <span className="inline-flex items-center gap-0.5 text-amber-300 font-mono tabular-nums">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {item.myRating}
            </span>
          ) : (
            <span className="text-zinc-700">—</span>
          )}
        </div>

        <div className="text-right text-[11px] text-zinc-500 font-mono tabular-nums flex items-center justify-end gap-1">
          <Clock className="w-3 h-3 text-zinc-600" strokeWidth={1.75} />
          {timeAgo(item.purchasedAt)}
        </div>

        <div className="hidden md:flex items-center gap-1.5 min-w-0">
          {l.fileKey && l.fileName && (
            <a
              href={`${API_URL}/market/files/${l.fileKey}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10.5px] font-medium text-white transition hover:brightness-110 truncate"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.28) 0%, rgba(131,110,249,0.1) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4)',
              }}
              title={`${l.fileName}${l.fileSize ? ' · ' + formatBytes(l.fileSize) : ''}`}
            >
              <Download className="w-3 h-3" strokeWidth={1.75} />
              Download
            </a>
          )}
          {l.agentEndpoint && (
            <Link
              href={`/market/agents/${l.id}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10.5px] font-medium text-zinc-200 hover:text-white transition"
              style={{
                background: 'rgba(255,255,255,0.04)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              <Play className="w-3 h-3" strokeWidth={1.75} />
              Run
            </Link>
          )}
          {l.agentUrl && !l.agentEndpoint && (
            <a
              href={l.agentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10.5px] font-medium text-zinc-200 hover:text-white transition"
              style={{
                background: 'rgba(255,255,255,0.04)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
              Open
            </a>
          )}
          <Link
            href={`/orders/${item.orderId}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10.5px] font-light text-zinc-400 hover:text-white transition"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            Order
          </Link>
        </div>

        <Link
          href={`/market/agents/${l.id}`}
          className="flex items-center justify-end"
          aria-label="Open listing"
        >
          <ArrowUpRight
            className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-300 transition"
            strokeWidth={1.75}
          />
        </Link>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-14 text-center"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30"
        style={{ background: 'rgba(131,110,249,0.25)' }}
      />
      <div
        className="relative w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
        style={{
          background:
            'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
          border: '1px solid rgba(131,110,249,0.35)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px -6px rgba(131,110,249,0.45)',
        }}
      >
        <Library className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.5} />
      </div>
      <h2 className="relative text-[15px] font-normal text-white mb-1.5">Your library is empty</h2>
      <p className="relative text-[12px] text-zinc-500 mb-6 max-w-md mx-auto font-light">
        Buy your first AI agent, repo, bot or script — everything lives here and is one click away.
      </p>
      <Link
        href="/market"
        className="relative inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[12px] font-normal text-white transition"
        style={{
          background:
            'linear-gradient(180deg, rgba(131,110,249,0.9) 0%, rgba(131,110,249,0.7) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 14px -6px rgba(131,110,249,0.5)',
        }}
      >
        <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
        Browse marketplace
      </Link>
    </div>
  );
}
