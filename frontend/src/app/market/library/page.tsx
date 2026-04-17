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
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { api, API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

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

  const visible = items.filter((i) => {
    if (!i.listing) return false;
    if (filter === 'all') return true;
    return i.listing.type === filter;
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
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
            <Link href="/market" className="hover:text-zinc-300">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-zinc-300">Library</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-light text-white">
                <GradientText gradient="purple">Your library</GradientText>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Everything you've purchased, all in one place.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <Library className="w-4 h-4" />
              {items.length} item{items.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 space-y-8">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label={`All (${items.length})`}
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
                    label={`${meta.label} (${c})`}
                    active={filter === t}
                    onClick={() => setFilter(t)}
                    accent={meta.color}
                  />
                );
              })}
            </div>

            {/* Items */}
            <div className="grid gap-4">
              {visible.map((item) => {
                if (!item.listing) return null;
                const meta = TYPE_META[item.listing.type] || TYPE_META.OTHER;
                return (
                  <div
                    key={item.orderId}
                    className="group rounded-lg border border-white/8 bg-zinc-950/50 p-5 hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: `${meta.color}18` }}
                      >
                        <meta.Icon className="w-5 h-5" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/market/agents/${item.listing.id}`}
                              className="block text-base font-medium text-white hover:text-purple-200 truncate"
                            >
                              {item.listing.title}
                            </Link>
                            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-3">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Purchased {timeAgo(item.purchasedAt)}
                              </span>
                              <span>
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
                                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-zinc-400"
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
                              className="inline-flex items-center gap-2 rounded-md border border-purple-400/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-100 hover:bg-purple-500/20"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download{' '}
                              <span className="text-purple-300/80">
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
                              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
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
                              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open agent
                            </a>
                          )}
                          <Link
                            href={`/orders/${item.orderId}`}
                            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
                          >
                            View order
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {visible.length === 0 && (
                <div className="text-sm text-zinc-500 py-8 text-center">
                  No items match this filter.
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
  active,
  onClick,
  accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
        active
          ? 'bg-purple-500/20 text-purple-100 border-purple-400/40'
          : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:border-white/20'
      }`}
      style={active && accent ? { borderColor: `${accent}66`, background: `${accent}1a` } : {}}
    >
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'COMPLETED'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      : status === 'DISPUTED'
        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        : 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20';
  return (
    <span
      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${tone} whitespace-nowrap`}
    >
      {status.toLowerCase().replace(/_/g, ' ')}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 border border-dashed border-white/10 rounded-lg bg-zinc-950/40">
      <Library className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
      <h2 className="text-lg font-light text-white mb-2">Your library is empty</h2>
      <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
        Buy your first AI agent, repo, or script and it'll show up here — always one click away.
      </p>
      <Link
        href="/market"
        className="inline-flex items-center gap-2 rounded-md border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-200 hover:bg-purple-500/20"
      >
        Browse the marketplace
      </Link>
    </div>
  );
}
