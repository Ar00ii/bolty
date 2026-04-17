'use client';

import { Bell, Check, DollarSign, MessageSquare, Package, PartyPopper, Star } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  useNotificationsPoll,
  type NotificationItem,
  type NotificationType,
} from '@/lib/hooks/useNotifications';

const TYPE_META: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; accent: string }
> = {
  MARKET_NEW_SALE: { icon: DollarSign, accent: 'text-emerald-400' },
  MARKET_NEW_REVIEW: { icon: Star, accent: 'text-yellow-400' },
  MARKET_ORDER_DELIVERED: { icon: Package, accent: 'text-cyan-400' },
  MARKET_ORDER_COMPLETED: { icon: PartyPopper, accent: 'text-[#836EF9]' },
  MARKET_NEGOTIATION_MESSAGE: { icon: MessageSquare, accent: 'text-zinc-300' },
  SYSTEM: { icon: Bell, accent: 'text-zinc-400' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsBell({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { count, refresh, setCount } = useNotificationsPoll(isAuthenticated);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications(false, 15);
      setItems(data.items);
      setCount(data.unreadCount);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [setCount]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleItemClick = async (n: NotificationItem) => {
    if (!n.readAt) {
      try {
        await markNotificationRead(n.id);
      } catch {
        /* ignore */
      }
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
      );
      setCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      return;
    }
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: now })));
    setCount(0);
    refresh();
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all relative"
        aria-label={count > 0 ? `Notifications (${count} unread)` : 'Notifications'}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-medium flex items-center justify-center"
            style={{ background: '#836EF9', color: 'white' }}
            aria-hidden="true"
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] rounded-xl border border-zinc-700/80 overflow-hidden shadow-xl z-50 flex flex-col"
          style={{ background: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
            <div>
              <p className="text-sm font-light text-white">Notifications</p>
              <p className="text-[11px] text-zinc-500">
                {count > 0 ? `${count} unread` : 'All caught up'}
              </p>
            </div>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && items.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-zinc-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No notifications yet</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Sales, reviews and order updates will appear here.
                </p>
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
                  const Icon = meta.icon;
                  const content = (
                    <div
                      className={`flex gap-3 px-4 py-3 border-b border-zinc-700/30 hover:bg-white/[0.03] transition-colors ${n.readAt ? '' : 'bg-[#836EF9]/[0.04]'}`}
                    >
                      <div
                        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${meta.accent}`}
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-light text-white truncate">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{n.body}</p>
                        )}
                        <p className="text-[11px] text-zinc-500 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.readAt && (
                        <span
                          className="shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                          style={{ background: '#836EF9' }}
                        />
                      )}
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.url ? (
                        <Link href={n.url} onClick={() => handleItemClick(n)} className="block">
                          {content}
                        </Link>
                      ) : (
                        <button onClick={() => handleItemClick(n)} className="w-full text-left">
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-700/50 px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-zinc-400 hover:text-white transition-colors py-1"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
