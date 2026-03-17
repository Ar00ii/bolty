'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Package, Clock, CheckCircle2, AlertTriangle,
  Truck, ArrowRight, BarChart3, TrendingUp, Users,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type OrderStatus = 'PENDING_DELIVERY' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED';

interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
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

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING_DELIVERY: { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Clock },
  IN_PROGRESS:      { label: 'In Progress',color: '#836EF9', bg: 'rgba(131,110,249,0.1)', icon: Package },
  DELIVERED:        { label: 'Delivered',  color: '#34d399', bg: 'rgba(52,211,153,0.1)',  icon: Truck },
  COMPLETED:        { label: 'Completed',  color: '#71717a', bg: 'rgba(113,113,122,0.1)', icon: CheckCircle2 },
  DISPUTED:         { label: 'Disputed',   color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: AlertTriangle },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`, padding: '0.2rem 0.6rem', borderRadius: 999 }}>
      <Icon style={{ width: 11, height: 11 }} strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

function OrderCard({ order, isSeller, onClick }: { order: Order; isSeller: boolean; onClick: () => void }) {
  const peer = isSeller ? order.buyer : order.seller;
  const ethAmount = order.amountWei ? (parseFloat(order.amountWei) / 1e18).toFixed(4) : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, borderColor: 'rgba(131,110,249,0.35)', boxShadow: '0 8px 28px rgba(131,110,249,0.08)' } as any}
      onClick={onClick}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.2rem 1.4rem', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', display: 'flex', alignItems: 'center', gap: '1rem' }}
    >
      {/* Avatar */}
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(131,110,249,0.15)', border: '1px solid rgba(131,110,249,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        {peer?.avatarUrl ? (
          <img src={peer.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '1rem', color: '#836EF9' }}>{(peer?.username || '?')[0].toUpperCase()}</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.listing.title}
          </span>
          <StatusBadge status={order.status} />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {isSeller ? 'Buyer' : 'Seller'}: <strong style={{ color: 'var(--text)' }}>@{peer?.username || 'Unknown'}</strong>
          <span style={{ margin: '0 0.4rem', opacity: 0.4 }}>·</span>
          {new Date(order.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.9rem', color: '#836EF9' }}>
          {ethAmount} ETH
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {order.listing.type}
        </div>
      </div>

      <ArrowRight style={{ width: 15, height: 15, color: 'var(--text-muted)', flexShrink: 0 }} strokeWidth={1.5} />
    </motion.div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [tab, setTab]               = useState<'buying' | 'selling'>('buying');
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [stats, setStats]           = useState<SellerStats | null>(null);
  const [loading, setLoading]       = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [buyRes, sellRes, statsRes] = await Promise.all([
        fetch(`${API}/orders`,          { credentials: 'include' }),
        fetch(`${API}/orders/selling`,  { credentials: 'include' }),
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
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <ShoppingBag style={{ width: 40, height: 40, color: 'var(--text-muted)' }} strokeWidth={1} />
        <p style={{ color: 'var(--text-muted)' }}>Sign in to view your orders</p>
      </div>
    );
  }

  const orders = tab === 'buying' ? buyerOrders : sellerOrders;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', paddingTop: '5rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.4rem' }}>Orders</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Track all your purchases and sales in one place.</p>
        </div>

        {/* Seller Stats (when on selling tab) */}
        {tab === 'selling' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total',       value: stats.total,      icon: BarChart3 },
              { label: 'Pending',     value: stats.pending,    icon: Clock },
              { label: 'In Progress', value: stats.inProgress, icon: Package },
              { label: 'Delivered',   value: stats.delivered,  icon: Truck },
              { label: 'Completed',   value: stats.completed,  icon: CheckCircle2 },
              { label: 'Disputed',    value: stats.disputed,   icon: AlertTriangle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                <Icon style={{ width: 16, height: 16, color: '#836EF9', margin: '0 auto 0.4rem' }} strokeWidth={1.5} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '1.4rem', color: '#836EF9' }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.25rem', border: '1px solid var(--border)', width: 'fit-content' }}>
          {(['buying', 'selling'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s', background: tab === t ? '#836EF9' : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)' }}
            >
              {t === 'buying' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShoppingBag style={{ width: 13, height: 13 }} strokeWidth={2} /> Buying ({buyerOrders.length})
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <TrendingUp style={{ width: 13, height: 13 }} strokeWidth={2} /> Selling ({sellerOrders.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 76, background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', opacity: 0.5 }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <ShoppingBag style={{ width: 36, height: 36, color: 'var(--text-muted)', margin: '0 auto 1rem' }} strokeWidth={1} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {tab === 'buying' ? 'No purchases yet. Browse the marketplace!' : 'No sales yet. Create a listing!'}
            </p>
            <a href="/market" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '1.25rem', background: 'linear-gradient(135deg, #836EF9, #6b4fe0)', color: '#fff', fontWeight: 600, fontSize: '0.85rem', padding: '0.6rem 1.2rem', borderRadius: 9, textDecoration: 'none' }}>
              <BarChart3 style={{ width: 14, height: 14 }} strokeWidth={2} />
              {tab === 'buying' ? 'Explore Marketplace' : 'Create Listing'}
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <OrderCard
                  order={order}
                  isSeller={tab === 'selling'}
                  onClick={() => router.push(`/orders/${order.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
