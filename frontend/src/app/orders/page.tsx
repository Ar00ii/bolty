'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { API_URL } from '@/lib/api/client';
import {
  ShoppingBag, Package, Clock, CheckCircle2, AlertTriangle,
  Truck, ArrowRight, BarChart3, TrendingUp, Lock,
} from 'lucide-react';

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
  buyer:  { id: string; username: string | null; avatarUrl: string | null };
  seller: { id: string; username: string | null; avatarUrl: string | null };
}

interface SellerStats {
  total: number; pending: number; inProgress: number;
  delivered: number; completed: number; disputed: number;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string; icon: React.ElementType }> = {
  PENDING_DELIVERY: { label: 'Pending',     className: 'badge-warning', icon: Clock },
  IN_PROGRESS:      { label: 'In Progress', className: 'badge',         icon: Package },
  DELIVERED:        { label: 'Delivered',   className: 'badge-success', icon: Truck },
  COMPLETED:        { label: 'Completed',   className: 'badge-secondary', icon: CheckCircle2 },
  DISPUTED:         { label: 'Disputed',    className: 'badge-error',   icon: AlertTriangle },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`badge ${cfg.className} flex items-center gap-1`}>
      <Icon className="w-3 h-3" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

function OrderCard({ order, isSeller, onClick }: { order: Order; isSeller: boolean; onClick: () => void }) {
  const peer = isSeller ? order.buyer : order.seller;
  const ethAmount = order.amountWei ? (parseFloat(order.amountWei) / 1e18).toFixed(4) : '—';

  return (
    <div
      onClick={onClick}
      className="card-interactive flex items-center gap-4 p-4 cursor-pointer"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-monad-500/15 border border-monad-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {peer?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={peer.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-base text-monad-400">{(peer?.username || '?')[0].toUpperCase()}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-light text-sm text-white truncate">{order.listing.title}</span>
          <StatusBadge status={order.status} />
          {order.escrowStatus && order.escrowStatus !== 'NONE' && (
            <span className="badge-success flex items-center gap-1 text-[10px]">
              <Lock className="w-2.5 h-2.5" /> Escrow
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500">
          {isSeller ? 'Buyer' : 'Seller'}: <span className="text-zinc-300 font-medium">@{peer?.username || 'Unknown'}</span>
          <span className="mx-1 opacity-40">·</span>
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <div className="font-mono font-light text-sm text-monad-400">{ethAmount} ETH</div>
        <div className="text-[10px] text-zinc-600 uppercase tracking-wide mt-0.5">{order.listing.type}</div>
      </div>

      <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" strokeWidth={1.5} />
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [tab, setTab] = useState<'buying' | 'selling'>('buying');
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [buyRes, sellRes, statsRes] = await Promise.all([
        fetch(`${API}/orders`,              { credentials: 'include' }),
        fetch(`${API}/orders/selling`,      { credentials: 'include' }),
        fetch(`${API}/orders/seller/stats`, { credentials: 'include' }),
      ]);
      if (buyRes.ok)   setBuyerOrders(await buyRes.json());
      if (sellRes.ok)  setSellerOrders(await sellRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-3">
        <ShoppingBag className="w-10 h-10 text-zinc-600" strokeWidth={1} />
        <p className="text-zinc-500">Sign in to view your orders</p>
      </div>
    );
  }

  const orders = tab === 'buying' ? buyerOrders : sellerOrders;

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="page-header">
        <h1 className="text-2xl font-light text-white tracking-tight">Orders</h1>
        <p className="text-sm text-zinc-500 mt-1">Track all your purchases and sales in one place.</p>
      </div>

      {/* Seller Stats */}
      {tab === 'selling' && stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total',       value: stats.total,      icon: BarChart3 },
            { label: 'Pending',     value: stats.pending,    icon: Clock },
            { label: 'In Progress', value: stats.inProgress, icon: Package },
            { label: 'Delivered',   value: stats.delivered,  icon: Truck },
            { label: 'Completed',   value: stats.completed,  icon: CheckCircle2 },
            { label: 'Disputed',    value: stats.disputed,   icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-4 text-center">
              <Icon className="w-4 h-4 text-monad-400 mx-auto mb-2" strokeWidth={1.5} />
              <div className="font-mono font-light text-xl text-monad-400">{value}</div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="tab-group mb-6">
        <button onClick={() => setTab('buying')} className={`tab-item ${tab === 'buying' ? 'active' : ''}`}>
          <ShoppingBag className="w-3.5 h-3.5" /> Buying ({buyerOrders.length})
        </button>
        <button onClick={() => setTab('selling')} className={`tab-item ${tab === 'selling' ? 'active' : ''}`}>
          <TrendingUp className="w-3.5 h-3.5" /> Selling ({sellerOrders.length})
        </button>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[76px] rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-16 px-6">
          <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-4" strokeWidth={1} />
          <p className="text-zinc-500 text-sm mb-6">
            {tab === 'buying' ? 'No purchases yet. Browse the marketplace!' : 'No sales yet. Create a listing!'}
          </p>
          <a href="/market" className="btn-primary text-sm px-5 py-2 inline-flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {tab === 'buying' ? 'Explore Marketplace' : 'Create Listing'}
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSeller={tab === 'selling'}
              onClick={() => router.push(`/orders/${order.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
