'use client';

import { AnimatePresence, motion } from 'framer-motion';
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
        <Bell className="w-4 h-4" strokeWidth={1.75} />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-medium flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(180deg, #9a83ff 0%, #7056ec 100%)',
                boxShadow:
                  '0 2px 8px -1px rgba(131,110,249,0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
              aria-hidden="true"
            >
              {count > 9 ? '9+' : count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] rounded-2xl overflow-hidden z-50 flex flex-col origin-top-right"
            style={{
              background: 'linear-gradient(180deg, #131317 0%, #0c0c10 100%)',
              boxShadow:
                '0 24px 60px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.5) 50%, transparent 100%)',
              }}
            />
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
              <div>
                <p className="text-[13px] font-medium text-white tracking-[0.005em]">
                  Notifications
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {count > 0 ? `${count} unread` : 'All caught up'}
                </p>
              </div>
              {count > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-[11px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/5"
                >
                  <Check className="w-3 h-3" strokeWidth={2} /> Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading && items.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-zinc-500">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div
                    className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{
                      background: 'rgba(131,110,249,0.08)',
                      border: '1px solid rgba(131,110,249,0.18)',
                    }}
                  >
                    <Bell className="w-4 h-4 text-[#a89dff]" strokeWidth={1.75} />
                  </div>
                  <p className="text-[13px] text-white font-normal">No notifications yet</p>
                  <p className="text-[11px] text-zinc-500 mt-1 px-6 leading-relaxed">
                    Sales, reviews and order updates will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {items.map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
                    const Icon = meta.icon;
                    const unread = !n.readAt;
                    const content = (
                      <div
                        className={`flex gap-3 px-4 py-3 transition-colors ${
                          unread
                            ? 'bg-[#836EF9]/[0.045] hover:bg-[#836EF9]/[0.07]'
                            : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <div
                          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${meta.accent}`}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-normal text-white truncate">{n.title}</p>
                          {n.body && (
                            <p className="text-[11.5px] text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                              {n.body}
                            </p>
                          )}
                          <p className="text-[10.5px] text-zinc-500 mt-1 tracking-wide">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                        {unread && (
                          <span
                            aria-hidden="true"
                            className="shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                            style={{
                              background: '#836EF9',
                              boxShadow: '0 0 8px rgba(131,110,249,0.6)',
                            }}
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

            <div
              className="border-t border-white/[0.06] px-4 py-2"
              style={{ background: 'rgba(255,255,255,0.015)' }}
            >
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-[11.5px] text-zinc-400 hover:text-white transition-colors py-1.5 tracking-wide"
              >
                View all notifications →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
