'use client';

import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  ArrowRight,
  BarChart3,
  Download,
  TrendingUp,
  Lock,
  Search,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, useRef } from 'react';

import { API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';

const API = API_URL;

type OrderStatus = 'PENDING_DELIVERY' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED';

type EscrowStatus = 'NONE' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'RESOLVED' | 'REFUNDED';

interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  escrowStatus: EscrowStatus;
  escrowContract: string | null;
  amountWei: string;
  txHash: string;
  listing: { id: string; title: string; type: string; price: number; currency: string };
  buyer: { id: string; username: string | null; avatarUrl: string | null };
  seller: { id: string; username: string | null; avatarUrl: string | null };
}

interface SellerStats {
  total: number;
  pending: number;
  inProgress: number;
  delivered: number;
  completed: number;
  disputed: number;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  PENDING_DELIVERY: { label: 'Pending', icon: Clock, color: '#f59e0b' },
  IN_PROGRESS: { label: 'In Progress', icon: Package, color: '#06B6D4' },
  DELIVERED: { label: 'Delivered', icon: Truck, color: '#22c55e' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: '#836EF9' },
  DISPUTED: { label: 'Disputed', icon: AlertTriangle, color: '#ef4444' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium tracking-[0.005em]"
      style={{
        color: cfg.color,
        background: `linear-gradient(180deg, ${cfg.color}22 0%, ${cfg.color}08 100%)`,
        boxShadow: `inset 0 0 0 1px ${cfg.color}40`,
      }}
    >
      <Icon className="w-3 h-3" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

function OrderCard({
  order,
  isSeller,
  onClick,
  index = 0,
}: {
  order: Order;
  isSeller: boolean;
  onClick: () => void;
  index?: number;
}) {
  const peer = isSeller ? order.buyer : order.seller;
  const ethAmount = order.amountWei ? (parseFloat(order.amountWei) / 1e18).toFixed(4) : '—';
  const statusColor = STATUS_CONFIG[order.status]?.color ?? '#836EF9';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.035, 0.4),
        duration: 0.28,
        ease: [0.22, 0.61, 0.36, 1],
      }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
      className="group relative w-full text-left rounded-xl overflow-hidden transition-all"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -14px rgba(0,0,0,0.55)',
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${statusColor} 50%, transparent 100%)`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
        style={{ background: `${statusColor}25` }}
      />

      <div className="relative flex items-center gap-4 p-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.04) 100%)',
            boxShadow:
              'inset 0 0 0 1px rgba(131,110,249,0.32), 0 0 14px -4px rgba(131,110,249,0.4)',
          }}
        >
          {peer?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={peer.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-light" style={{ color: '#b4a7ff' }}>
              {(peer?.username || '?')[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-normal text-[13px] text-white truncate tracking-[0.005em]">
              {order.listing.title}
            </span>
            <StatusBadge status={order.status} />
            {order.escrowStatus && order.escrowStatus !== 'NONE' && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  color: '#22c55e',
                  background: 'rgba(34,197,94,0.1)',
                  boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.3)',
                }}
              >
                <Lock className="w-2.5 h-2.5" strokeWidth={2} /> Escrow
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500">
            {isSeller ? 'Buyer' : 'Seller'}:{' '}
            <span className="text-zinc-300 font-normal">@{peer?.username || 'Unknown'}</span>
            <span className="mx-1 opacity-40">·</span>
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-mono font-normal text-[13px] text-[#b4a7ff] tracking-[0.005em]">
            {ethAmount} ETH
          </div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-[0.14em] font-medium mt-0.5">
            {order.listing.type}
          </div>
        </div>

        <ArrowRight
          className="w-4 h-4 text-zinc-600 flex-shrink-0 transition-all group-hover:text-zinc-300 group-hover:translate-x-0.5"
          strokeWidth={1.5}
        />
      </div>
    </motion.button>
  );
}

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadOrdersCsv(orders: Order[], kind: 'buying' | 'selling') {
  const header = [
    'orderId',
    'createdAt',
    'status',
    'escrowStatus',
    'listingTitle',
    'listingType',
    'priceEth',
    'amountWei',
    'counterparty',
    'txHash',
  ];
  const rows = orders.map((o) => {
    const peer = kind === 'selling' ? o.buyer : o.seller;
    const eth = o.amountWei ? (parseFloat(o.amountWei) / 1e18).toString() : '';
    return [
      o.id,
      o.createdAt,
      o.status,
      o.escrowStatus,
      o.listing.title,
      o.listing.type,
      eth,
      o.amountWei,
      peer?.username || '',
      o.txHash,
    ]
      .map(csvEscape)
      .join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bolty-orders-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type StatusFilter = 'ALL' | OrderStatus;

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: 'All',
  PENDING_DELIVERY: 'Pending',
  IN_PROGRESS: 'In progress',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
};

const STATUS_FILTER_ORDER: StatusFilter[] = [
  'ALL',
  'PENDING_DELIVERY',
  'IN_PROGRESS',
  'DELIVERED',
  'COMPLETED',
  'DISPUTED',
];

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'buying' | 'selling'>('buying');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [buyRes, sellRes, statsRes] = await Promise.all([
        fetch(`${API}/orders`, { credentials: 'include' }),
        fetch(`${API}/orders/selling`, { credentials: 'include' }),
        fetch(`${API}/orders/seller/stats`, { credentials: 'include' }),
      ]);
      if (buyRes.ok) setBuyerOrders(await buyRes.json());
      if (sellRes.ok) setSellerOrders(await sellRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-3">
        <ShoppingBag className="w-10 h-10 text-zinc-600" strokeWidth={1} />
        <p className="text-zinc-500">Sign in to view your orders</p>
      </div>
    );
  }

  const baseOrders = tab === 'buying' ? buyerOrders : sellerOrders;
  const q = search.trim().toLowerCase();
  const searched = q
    ? baseOrders.filter((o) => {
        const counterparty = tab === 'buying' ? o.seller.username : o.buyer.username;
        return (
          o.listing.title.toLowerCase().includes(q) ||
          (counterparty || '').toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        );
      })
    : baseOrders;
  const orders =
    statusFilter === 'ALL' ? searched : searched.filter((o) => o.status === statusFilter);
  const statusCounts = searched.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-white tracking-tight">Orders</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track all your purchases and sales in one place.
          </p>
        </div>
        {baseOrders.length > 0 && (
          <button
            onClick={() => downloadOrdersCsv(baseOrders, tab)}
            className="inline-flex items-center gap-1.5 text-[11.5px] text-zinc-400 hover:text-white h-9 px-3 rounded-lg transition-colors"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
            aria-label="Export orders as CSV"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Export CSV
          </button>
        )}
      </div>

      {/* Seller Stats */}
      {tab === 'selling' && stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: BarChart3, accent: '#836EF9' },
            { label: 'Pending', value: stats.pending, icon: Clock, accent: '#f59e0b' },
            { label: 'In Progress', value: stats.inProgress, icon: Package, accent: '#06B6D4' },
            { label: 'Delivered', value: stats.delivered, icon: Truck, accent: '#22c55e' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, accent: '#836EF9' },
            { label: 'Disputed', value: stats.disputed, icon: AlertTriangle, accent: '#ef4444' },
          ].map(({ label, value, icon: Icon, accent }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.04, duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="relative rounded-xl p-4 text-center overflow-hidden transition-all"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`,
                }}
              />
              <div
                className="w-7 h-7 rounded-md mx-auto mb-2 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${accent}22 0%, ${accent}06 100%)`,
                  boxShadow: `inset 0 0 0 1px ${accent}38, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} strokeWidth={1.75} />
              </div>
              <div
                className="font-mono font-light text-xl tracking-[-0.01em]"
                style={{ color: accent }}
              >
                {value}
              </div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-[0.18em] font-medium mt-1">
                {label}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div
        className="inline-flex items-center gap-0.5 p-1 rounded-lg mb-4"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {(
          [
            { key: 'buying', label: 'Buying', icon: ShoppingBag, count: buyerOrders.length },
            { key: 'selling', label: 'Selling', icon: TrendingUp, count: sellerOrders.length },
          ] as const
        ).map(({ key, label, icon: Icon, count }) => {
          const active = tab === key;
          return (
            <motion.button
              key={key}
              onClick={() => {
                setTab(key);
                setStatusFilter('ALL');
                setSearch('');
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className={`relative inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-light tracking-[0.005em] transition-colors ${
                active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="orders-tab-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-md"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
                  }}
                />
              )}
              <Icon className="relative z-10 w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="relative z-10">{label}</span>
              <span
                className="relative z-10 text-[10.5px] font-normal"
                style={{ color: active ? 'rgba(255,255,255,0.75)' : 'rgba(113,113,122,1)' }}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Search */}
      {baseOrders.length > 0 && (
        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
            strokeWidth={1.75}
          />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, counterparty, or order id"
            className="w-full pl-9 pr-16 py-2.5 text-[13px] rounded-lg text-white placeholder-zinc-600 outline-none transition-all focus:shadow-[0_0_0_3px_rgba(131,110,249,0.12)]"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-500 rounded-md px-1.5 py-0.5 leading-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              /
            </kbd>
          )}
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {STATUS_FILTER_ORDER.map((s, idx) => {
          const count = s === 'ALL' ? baseOrders.length : statusCounts[s] || 0;
          const active = statusFilter === s;
          return (
            <motion.button
              key={s}
              onClick={() => setStatusFilter(s)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(idx * 0.03, 0.2),
                duration: 0.22,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              whileTap={{ scale: 0.96 }}
              className={`relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium transition-colors tracking-[0.005em] ${
                active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {active && (
                <motion.span
                  layoutId="orders-status-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.08) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.4), 0 0 14px -4px rgba(131,110,249,0.45)',
                  }}
                />
              )}
              <span className="relative z-10">{STATUS_FILTER_LABELS[s]}</span>
              <span
                className="relative z-10 text-[10px] font-normal"
                style={{ color: active ? 'rgba(255,255,255,0.7)' : 'rgba(113,113,122,1)' }}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[76px] rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div
          className="relative text-center py-16 px-6 rounded-2xl overflow-hidden"
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
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-40"
            style={{ background: 'rgba(131,110,249,0.18)' }}
          />
          <div
            className="relative w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(131,110,249,0.2) 0%, rgba(131,110,249,0.06) 100%)',
              border: '1px solid rgba(131,110,249,0.28)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px -6px rgba(131,110,249,0.35)',
            }}
          >
            <ShoppingBag className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.5} />
          </div>
          <p className="relative text-[14px] text-white font-normal tracking-[0.005em]">
            {tab === 'buying' ? 'No purchases yet' : 'No sales yet'}
          </p>
          <p className="relative text-[12px] text-zinc-500 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
            {tab === 'buying'
              ? 'Browse the marketplace to discover AI agents, repos, and services from the community.'
              : 'Publish your first listing to start receiving orders from buyers.'}
          </p>
          <a
            href="/market"
            className="group relative inline-flex items-center gap-2 rounded-lg h-10 px-4 text-[12.5px] font-medium text-white transition-colors"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.08) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.35), inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 18px -6px rgba(131,110,249,0.4)',
            }}
          >
            <BarChart3
              className="w-3.5 h-3.5 text-[#b4a7ff] group-hover:text-white transition-colors"
              strokeWidth={2}
            />
            <span className="tracking-[0.005em]">
              {tab === 'buying' ? 'Explore marketplace' : 'Create listing'}
            </span>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <OrderCard
              key={order.id}
              order={order}
              isSeller={tab === 'selling'}
              onClick={() => router.push(`/orders/${order.id}`)}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
