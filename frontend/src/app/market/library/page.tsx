'use client';

import { motion } from 'framer-motion';
import {
  Library,
  Download,
  Bot,
  GitBranch,
  Zap,
  Package,
  Star,
  Play,
  ExternalLink,
  Clock,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { api, API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';

type ListingType = 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';

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

const TYPE_META: Record<
  ListingType,
  {
    label: string;
    color: string;
    Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }
> = {
  AI_AGENT: { label: 'AI Agent', color: '#a855f7', Icon: Bot },
  BOT: { label: 'Bot', color: '#836EF9', Icon: Bot },
  SCRIPT: { label: 'Script', color: '#06B6D4', Icon: Zap },
  REPO: { label: 'Repo', color: '#3b82f6', Icon: GitBranch },
  OTHER: { label: 'Other', color: '#64748b', Icon: Package },
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
  const [filter, setFilter] = useState<'all' | 'AI_AGENT' | 'BOT' | 'SCRIPT' | 'REPO'>('all');
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

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#000' }}>
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-purple-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const visible = items.filter((i) => {
    if (!i.listing) return false;
    if (filter !== 'all' && i.listing.type !== filter) return false;
    if (q) {
      const haystack = [i.listing.title, i.listing.seller.username ?? '', ...(i.listing.tags || [])]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const counts = items.reduce(
    (acc, i) => {
      if (!i.listing) return acc;
      acc[i.listing.type] = (acc[i.listing.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div style={{ background: '#000' }} className="relative min-h-screen overflow-hidden">
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }}
      />

      <div className="border-b border-white/8 sticky top-0 z-40 backdrop-blur-md bg-zinc-950/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
            <Link href="/market" className="hover:text-zinc-300">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-zinc-300">Library</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white">
                <GradientText gradient="purple">Your library</GradientText>
              </h1>
              <p className="text-[13px] sm:text-sm text-zinc-400 mt-1">
                Everything you've purchased, all in one place.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-zinc-400 shrink-0">
              <Library className="w-4 h-4" />
              {items.length} item{items.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10 space-y-6">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Search + filters */}
            <div
              className="relative rounded-xl overflow-hidden p-4 space-y-3"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your library…"
                  className="w-full rounded-lg pl-10 pr-16 py-2.5 text-[13px] text-white placeholder-zinc-600 outline-none transition-all focus:shadow-[0_0_0_3px_rgba(131,110,249,0.12)]"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {query ? (
                    <button
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd
                      className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-medium text-zinc-500 leading-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      /
                    </kbd>
                  )}
                </div>
              </div>

              <div className="relative flex flex-wrap items-center gap-2">
                <FilterChip
                  label="All"
                  count={items.length}
                  active={filter === 'all'}
                  onClick={() => setFilter('all')}
                />
                {(['AI_AGENT', 'BOT', 'SCRIPT', 'REPO'] as const).map((t) => {
                  const c = counts[t] || 0;
                  if (c === 0) return null;
                  const meta = TYPE_META[t];
                  return (
                    <FilterChip
                      key={t}
                      label={meta.label}
                      count={c}
                      active={filter === t}
                      onClick={() => setFilter(t)}
                      accent={meta.color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Items */}
            <div className="grid gap-4">
              {visible.map((item, idx) => {
                if (!item.listing) return null;
                const meta = TYPE_META[item.listing.type] || TYPE_META.OTHER;
                return (
                  <motion.div
                    key={item.orderId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(idx * 0.035, 0.35),
                      duration: 0.32,
                      ease: [0.22, 0.61, 0.36, 1],
                    }}
                    whileHover={{ y: -3 }}
                    className="group relative rounded-2xl overflow-hidden p-5"
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
                        background: `linear-gradient(90deg, transparent 0%, ${meta.color}80 50%, transparent 100%)`,
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `${meta.color}22` }}
                    />
                    <div className="relative flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${meta.color}22 0%, ${meta.color}08 100%)`,
                          border: `1px solid ${meta.color}3a`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 16px -4px ${meta.color}30`,
                        }}
                      >
                        <meta.Icon className="w-5 h-5" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/market/agents/${item.listing.id}`}
                              className="block text-[15px] font-normal text-white hover:text-[#b4a7ff] truncate tracking-[0.005em] transition-colors"
                            >
                              {item.listing.title}
                            </Link>
                            <div className="text-[11px] text-zinc-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Purchased {timeAgo(item.purchasedAt)}
                              </span>
                              <span className="text-zinc-400">
                                {item.listing.price} {item.listing.currency}
                              </span>
                              <span>· @{item.listing.seller.username || 'anon'}</span>
                              {item.myRating !== null && (
                                <span className="inline-flex items-center gap-1 text-amber-300">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {item.myRating}
                                </span>
                              )}
                            </div>
                          </div>
                          <StatusPill status={item.status} />
                        </div>

                        {item.listing.tags && item.listing.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {item.listing.tags.slice(0, 6).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-2 py-0.5 rounded-full text-zinc-400"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                }}
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.listing.fileKey && item.listing.fileName && (
                            <a
                              href={`${API_URL}/market/files/${item.listing.fileKey}`}
                              className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-[11.5px] font-medium text-white transition-all hover:brightness-110"
                              style={{
                                background:
                                  'linear-gradient(180deg, rgba(131,110,249,0.28) 0%, rgba(131,110,249,0.1) 100%)',
                                boxShadow:
                                  'inset 0 0 0 1px rgba(131,110,249,0.4), 0 0 18px -4px rgba(131,110,249,0.5)',
                              }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download{' '}
                              <span className="text-[#c9beff]">
                                {item.listing.fileName}
                                {item.listing.fileSize
                                  ? ` · ${formatBytes(item.listing.fileSize)}`
                                  : ''}
                              </span>
                            </a>
                          )}
                          {item.listing.agentEndpoint && (
                            <Link
                              href={`/market/agents/${item.listing.id}`}
                              className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-[11.5px] font-medium text-zinc-200 hover:text-white transition-colors"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                              }}
                            >
                              <Play className="w-3.5 h-3.5" />
                              Open live demo
                            </Link>
                          )}
                          {item.listing.agentUrl && (
                            <a
                              href={item.listing.agentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-[11.5px] font-medium text-zinc-200 hover:text-white transition-colors"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                              }}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open agent
                            </a>
                          )}
                          <Link
                            href={`/orders/${item.orderId}`}
                            className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-[11.5px] font-medium text-zinc-400 hover:text-white transition-colors"
                            style={{
                              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                            }}
                          >
                            View order
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {visible.length === 0 && (
                <div
                  className="relative rounded-2xl overflow-hidden p-10 text-center"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <p className="text-[13px] text-zinc-400">
                    {query ? `No items match "${query}".` : 'No items match this filter.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
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
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 360, damping: 22 }}
      className={`relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors tracking-[0.005em] ${
        active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
      }`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {active && (
        <motion.span
          layoutId="library-filter-pill"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute inset-0 rounded-md"
          style={{
            background: `linear-gradient(180deg, ${c}38 0%, ${c}10 100%)`,
            boxShadow: `inset 0 0 0 1px ${c}5a, 0 0 14px -4px ${c}70`,
          }}
        />
      )}
      <span className="relative z-10">{label}</span>
      <span
        className="relative z-10 text-[10px]"
        style={{ color: active ? `${c}ee` : 'rgba(161,161,170,0.7)' }}
      >
        {count}
      </span>
    </motion.button>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'COMPLETED'
      ? { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', ring: 'rgba(16,185,129,0.3)' }
      : status === 'DISPUTED'
        ? { color: '#fda4af', bg: 'rgba(244,63,94,0.12)', ring: 'rgba(244,63,94,0.3)' }
        : { color: '#d4d4d8', bg: 'rgba(113,113,122,0.14)', ring: 'rgba(113,113,122,0.3)' };
  return (
    <span
      className="text-[10px] uppercase tracking-[0.12em] font-medium px-2 py-0.5 rounded-md whitespace-nowrap"
      style={{
        color: tone.color,
        background: tone.bg,
        boxShadow: `inset 0 0 0 1px ${tone.ring}`,
      }}
    >
      {status.toLowerCase().replace(/_/g, ' ')}
    </span>
  );
}

function EmptyState() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-14 text-center"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
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
      <span
        aria-hidden="true"
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
      <h2 className="relative text-[15px] font-normal text-white tracking-[0.005em] mb-1.5">
        Your library is empty
      </h2>
      <p className="relative text-[12px] text-zinc-500 mb-6 max-w-md mx-auto leading-relaxed">
        Buy your first AI agent, repo, or script and it'll show up here — always one click away.
      </p>
      <Link
        href="/market"
        className="relative inline-flex items-center gap-2 h-8 px-3.5 rounded-md text-[11.5px] font-medium text-white transition-all hover:brightness-110"
        style={{
          background:
            'linear-gradient(180deg, rgba(131,110,249,0.28) 0%, rgba(131,110,249,0.1) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4), 0 0 18px -4px rgba(131,110,249,0.5)',
        }}
      >
        Browse the marketplace
      </Link>
    </div>
  );
}
