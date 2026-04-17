'use client';

import { Bell, Check, DollarSign, MessageSquare, Package, PartyPopper, Star } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type NotificationType,
} from '@/lib/hooks/useNotifications';

const TYPE_META: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; accent: string; label: string }
> = {
  MARKET_NEW_SALE: { icon: DollarSign, accent: 'text-emerald-400', label: 'Sale' },
  MARKET_NEW_REVIEW: { icon: Star, accent: 'text-yellow-400', label: 'Review' },
  MARKET_ORDER_DELIVERED: { icon: Package, accent: 'text-cyan-400', label: 'Delivery' },
  MARKET_ORDER_COMPLETED: { icon: PartyPopper, accent: 'text-[#836EF9]', label: 'Completed' },
  MARKET_NEGOTIATION_MESSAGE: { icon: MessageSquare, accent: 'text-zinc-300', label: 'Message' },
  SYSTEM: { icon: Bell, accent: 'text-zinc-400', label: 'System' },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TYPE_FILTERS: { value: NotificationType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All types' },
  { value: 'MARKET_NEW_SALE', label: 'Sales' },
  { value: 'MARKET_NEW_REVIEW', label: 'Reviews' },
  { value: 'MARKET_ORDER_DELIVERED', label: 'Deliveries' },
  { value: 'MARKET_ORDER_COMPLETED', label: 'Completed' },
  { value: 'MARKET_NEGOTIATION_MESSAGE', label: 'Messages' },
  { value: 'SYSTEM', label: 'System' },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications(filter === 'unread', 50);
      setItems(data.items);
      setUnread(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRead = async (n: NotificationItem) => {
    if (n.readAt) return;
    try {
      await markNotificationRead(n.id);
    } catch {
      return;
    }
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
    );
    setUnread((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      return;
    }
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: now })));
    setUnread(0);
  };

  const visible = typeFilter === 'ALL' ? items : items.filter((n) => n.type === typeFilter);

  return (
    <div className="relative max-w-3xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(131,110,249,0.08), transparent 70%)' }}
      />

      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1 font-light">
            {unread > 0 ? `${unread} unread` : 'You are all caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/60 hover:border-zinc-600"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-3">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-light transition-all ${
              filter === f
                ? 'text-white bg-white/[0.08] border border-white/10'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            {f === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-light border transition-all ${
              typeFilter === t.value
                ? 'text-white border-[#836EF9]/60 bg-[#836EF9]/10'
                : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center py-20 text-sm text-zinc-500">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="border border-zinc-800 rounded-2xl py-16 text-center">
          <Bell className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 font-light">
            {typeFilter === 'ALL' ? 'Nothing here yet' : 'No notifications of that type'}
          </p>
          <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
            Sales, reviews, delivery updates and marketplace messages will show up in this feed.
          </p>
        </div>
      ) : (
        <ul className="border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          {visible.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
            const Icon = meta.icon;
            const inner = (
              <div
                className={`flex gap-4 p-4 transition-colors ${
                  n.readAt
                    ? 'hover:bg-white/[0.02]'
                    : 'bg-[#836EF9]/[0.04] hover:bg-[#836EF9]/[0.06]'
                }`}
              >
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.accent}`}
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-500">{formatTime(n.createdAt)}</span>
                    {!n.readAt && (
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(131,110,249,0.15)', color: '#836EF9' }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-light text-white">{n.title}</p>
                  {n.body && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{n.body}</p>}
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.url ? (
                  <Link href={n.url} onClick={() => handleRead(n)} className="block">
                    {inner}
                  </Link>
                ) : (
                  <button onClick={() => handleRead(n)} className="w-full text-left">
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
