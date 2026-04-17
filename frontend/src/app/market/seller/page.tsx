'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  Star,
  MessageSquare,
  DollarSign,
  ArrowUpRight,
  Download,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface SellerListing {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  status: string;
  createdAt: string;
  sales: number;
  revenue: number;
  reviewAverage: number | null;
  reviewCount: number;
}

interface RecentSale {
  id: string;
  createdAt: string;
  status: string;
  listing: { id: string; title: string };
  buyer: { id: string; username: string | null; avatarUrl: string | null };
}

interface Analytics {
  totals: {
    listings: number;
    activeListings: number;
    salesAllTime: number;
    salesLast30: number;
    salesLast7: number;
    revenueAllTime: number;
    revenueLast30: number;
    negotiationsOpenLast30: number;
    avgRating: number | null;
    reviewCount: number;
  };
  listings: SellerListing[];
  recentSales: RecentSale[];
  salesByDay: { date: string; sales: number }[];
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function csvEscape(value: unknown) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadListingsCsv(listings: SellerListing[]) {
  const header = [
    'id',
    'title',
    'type',
    'status',
    'price',
    'currency',
    'sales',
    'revenue',
    'avgRating',
    'reviewCount',
    'createdAt',
  ];
  const rows = listings.map((l) =>
    [
      l.id,
      l.title,
      l.type,
      l.status,
      l.price,
      l.currency,
      l.sales,
      l.revenue,
      l.reviewAverage ?? '',
      l.reviewCount,
      l.createdAt,
    ]
      .map(csvEscape)
      .join(','),
  );
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bolty-listings-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SellerDashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }
    if (!isAuthenticated) return;
    (async () => {
      try {
        setLoading(true);
        const resp = await api.get<Analytics>('/market/seller/analytics');
        setData(resp);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load analytics');
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

  if (error || !data) {
    return (
      <div className="min-h-screen" style={{ background: '#000' }}>
        <div className="max-w-7xl mx-auto px-6 py-24 text-center text-sm text-zinc-400">
          {error || 'No data available.'}
        </div>
      </div>
    );
  }

  const { totals, listings, recentSales, salesByDay } = data;
  const maxDay = Math.max(1, ...salesByDay.map((d) => d.sales));

  return (
    <div style={{ background: '#000' }} className="relative min-h-screen overflow-hidden">
      {/* Ambient glows */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }}
      />

      <div className="border-b border-white/8 sticky top-0 z-40 backdrop-blur-md bg-zinc-950/90">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
              <Link href="/market" className="hover:text-zinc-300">
                Marketplace
              </Link>
              <span>/</span>
              <span className="text-zinc-300">Seller</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-light text-white">
              <GradientText gradient="purple">Seller dashboard</GradientText>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Track sales, revenue and engagement across your listings.
            </p>
          </div>
          <Link
            href="/market?new=1"
            className="hidden sm:inline-flex items-center gap-2 rounded-md border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-200 hover:bg-purple-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            New listing
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 relative z-10">
        {totals.listings === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Kpi
                label="Revenue (30d)"
                value={`${totals.revenueLast30.toFixed(2)}`}
                suffix="SOL"
                icon={DollarSign}
                accent="#836EF9"
              />
              <Kpi
                label="Sales (30d)"
                value={totals.salesLast30.toString()}
                subtext={`${totals.salesLast7} last 7d`}
                icon={ShoppingCart}
                accent="#06B6D4"
              />
              <Kpi
                label="Active listings"
                value={totals.activeListings.toString()}
                subtext={`${totals.listings} total`}
                icon={Package}
                accent="#10b981"
              />
              <Kpi
                label="Avg rating"
                value={totals.avgRating !== null ? totals.avgRating.toFixed(1) : '—'}
                subtext={`${totals.reviewCount} reviews`}
                icon={Star}
                accent="#f59e0b"
              />
            </div>

            {/* Sales chart */}
            <section className="relative border-t-2 border-l-2 border-white/10 rounded-tl-lg p-6 bg-zinc-950/50">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-300" />
                  <h2 className="text-sm uppercase tracking-widest text-zinc-400">
                    Sales · last 30 days
                  </h2>
                </div>
                <div className="text-xs text-zinc-500">
                  Total {totals.salesLast30} sale{totals.salesLast30 === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex items-end gap-1 h-32">
                {salesByDay.map((d) => {
                  const h = (d.sales / maxDay) * 100;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center justify-end group relative"
                    >
                      <div
                        className="w-full rounded-sm transition-all"
                        style={{
                          height: `${Math.max(2, h)}%`,
                          background:
                            d.sales > 0
                              ? 'linear-gradient(to top, #836EF9, #a78bfa)'
                              : 'rgba(255,255,255,0.05)',
                        }}
                      />
                      <div className="absolute bottom-full mb-1 hidden group-hover:block text-[10px] text-zinc-300 whitespace-nowrap bg-zinc-900 border border-white/10 rounded px-2 py-1">
                        {d.date}: {d.sales}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Two-column: listings + recent sales */}
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <section className="border border-white/8 rounded-lg bg-zinc-950/50">
                <header className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-300" />
                    <h2 className="text-sm uppercase tracking-widest text-zinc-400">
                      Listing performance
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{listings.length} listings</span>
                    {listings.length > 0 && (
                      <button
                        onClick={() => downloadListingsCsv(listings)}
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-md border border-white/10 hover:border-white/20"
                        aria-label="Download listings as CSV"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </button>
                    )}
                  </div>
                </header>
                <div className="divide-y divide-white/5">
                  {listings.map((l) => (
                    <Link
                      key={l.id}
                      href={`/market/agents/${l.id}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{l.title}</span>
                          <span
                            className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                              l.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                            }`}
                          >
                            {l.status.toLowerCase()}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-500 flex items-center gap-3">
                          <span>
                            {l.price} {l.currency}
                          </span>
                          {l.reviewAverage !== null && l.reviewCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {l.reviewAverage.toFixed(1)} ({l.reviewCount})
                            </span>
                          )}
                          <span>· {l.type.toLowerCase()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{l.sales}</div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                          sales
                        </div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm font-medium text-purple-300">
                          {l.revenue.toFixed(2)}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                          {l.currency}
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600" />
                    </Link>
                  ))}
                </div>
              </section>

              <section className="border border-white/8 rounded-lg bg-zinc-950/50">
                <header className="flex items-center gap-2 px-5 py-4 border-b border-white/8">
                  <ShoppingCart className="w-4 h-4 text-purple-300" />
                  <h2 className="text-sm uppercase tracking-widest text-zinc-400">Recent sales</h2>
                </header>
                <div className="divide-y divide-white/5">
                  {recentSales.length === 0 && (
                    <div className="px-5 py-6 text-xs text-zinc-500">
                      No sales yet. Share your listing to get your first buyer.
                    </div>
                  )}
                  {recentSales.map((s) => (
                    <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {s.buyer.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.buyer.avatarUrl}
                            alt={s.buyer.username || 'buyer'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-zinc-400">
                            {(s.buyer.username || '?').slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-zinc-300 truncate">
                          @{s.buyer.username || 'anon'}{' '}
                          <span className="text-zinc-600">bought</span>{' '}
                          <Link
                            href={`/market/agents/${s.listing.id}`}
                            className="text-purple-300 hover:underline"
                          >
                            {s.listing.title}
                          </Link>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {timeAgo(s.createdAt)} · {s.status.toLowerCase().replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Engagement footer */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <EngagementStat
                icon={MessageSquare}
                label="Open negotiations (30d)"
                value={totals.negotiationsOpenLast30}
              />
              <EngagementStat
                icon={DollarSign}
                label="Revenue all-time"
                value={`${totals.revenueAllTime.toFixed(2)} SOL`}
              />
              <EngagementStat
                icon={ShoppingCart}
                label="Sales all-time"
                value={totals.salesAllTime}
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
  subtext,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
}) {
  return (
    <div className="border border-white/8 rounded-lg bg-zinc-950/60 p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 0%, ${accent}, transparent 60%)` }}
      />
      <div className="flex items-center justify-between mb-2 relative">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <div className="text-2xl font-light text-white relative">
        {value}
        {suffix && <span className="ml-1 text-xs text-zinc-500">{suffix}</span>}
      </div>
      {subtext && <div className="text-[11px] text-zinc-500 mt-1 relative">{subtext}</div>}
    </div>
  );
}

function EngagementStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-white/8 rounded-md bg-zinc-950/50 p-4 flex items-center gap-3">
      <Icon className="w-4 h-4 text-zinc-500" />
      <div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
        <div className="text-sm text-white font-medium">{value}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 border border-dashed border-white/10 rounded-lg bg-zinc-950/40">
      <Package className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
      <h2 className="text-lg font-light text-white mb-2">You don't have any listings yet</h2>
      <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
        Publish your first AI agent, repo, or script to start tracking sales and engagement here.
      </p>
      <Link
        href="/market?new=1"
        className="inline-flex items-center gap-2 rounded-md border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-200 hover:bg-purple-500/20"
      >
        <Plus className="w-3.5 h-3.5" />
        Create a listing
      </Link>
    </div>
  );
}
