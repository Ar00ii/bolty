'use client';

import {
  Bell,
  Check,
  DollarSign,
  MessageSquare,
  Package,
  PartyPopper,
  Search,
  Star,
  X,
} from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';
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
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);

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

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    return items.filter((n) => {
      if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
      if (!q) return true;
      const haystack = `${n.title} ${n.body || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, typeFilter, q]);
  const typeCounts = items.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

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
            className="text-[11.5px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 h-9 px-3 rounded-lg"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} /> Mark all read
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none"
          strokeWidth={1.75}
        />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notifications…"
          className="w-full pl-9 pr-16 py-2.5 rounded-lg text-[13px] text-white placeholder-zinc-600 outline-none transition-all focus:shadow-[0_0_0_3px_rgba(131,110,249,0.12)]"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        />
        {query ? (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium text-zinc-500 leading-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            /
          </kbd>
        )}
      </div>

      <div
        className="inline-flex items-center p-0.5 rounded-lg mb-3"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {(['all', 'unread'] as const).map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11.5px] font-medium h-7 px-3 rounded-md transition-colors tracking-[0.005em] ${
                active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}
              style={
                active
                  ? {
                      background:
                        'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
                    }
                  : undefined
              }
            >
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {TYPE_FILTERS.map((t) => {
          const count = t.value === 'ALL' ? items.length : typeCounts[t.value] || 0;
          if (t.value !== 'ALL' && count === 0) return null;
          const active = typeFilter === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium transition-colors tracking-[0.005em] ${
                active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={
                active
                  ? {
                      background:
                        'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.08) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.4), 0 0 14px -4px rgba(131,110,249,0.45)',
                    }
                  : {
                      background:
                        'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                      boxShadow:
                        '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
                    }
              }
            >
              {t.label}
              <span
                className="text-[10px] font-normal"
                style={{ color: active ? 'rgba(255,255,255,0.7)' : 'rgba(113,113,122,1)' }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center py-20 text-sm text-zinc-500">Loading…</div>
      ) : visible.length === 0 ? (
        <div
          className="relative py-16 text-center rounded-2xl overflow-hidden"
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
            <Bell className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.5} />
          </div>
          <p className="relative text-[14px] text-white font-normal tracking-[0.005em]">
            {q
              ? 'No notifications match your search'
              : typeFilter === 'ALL'
                ? 'Nothing here yet'
                : 'No notifications of that type'}
          </p>
          <p className="relative text-[12px] text-zinc-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {q
              ? 'Try a different keyword or clear the search to see everything.'
              : 'Sales, reviews, delivery updates and marketplace messages will show up in this feed.'}
          </p>
        </div>
      ) : (
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px z-10"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          <ul className="relative divide-y divide-white/[0.05]">
            {visible.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
              const Icon = meta.icon;
              const inner = (
                <div
                  className={`flex gap-4 p-4 transition-colors ${
                    n.readAt
                      ? 'hover:bg-white/[0.02]'
                      : 'bg-[#836EF9]/[0.045] hover:bg-[#836EF9]/[0.07]'
                  }`}
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.accent}`}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-zinc-500">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-zinc-700">•</span>
                      <span className="text-[10px] text-zinc-500 tracking-wide">
                        {formatTime(n.createdAt)}
                      </span>
                      {!n.readAt && (
                        <span
                          className="ml-auto text-[9.5px] font-semibold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md text-white"
                          style={{
                            background: 'linear-gradient(180deg, #9a83ff 0%, #7056ec 100%)',
                            boxShadow:
                              '0 2px 8px -1px rgba(131,110,249,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                          }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-normal text-white tracking-[0.005em]">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[12px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    )}
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
        </div>
      )}
    </div>
  );
}
