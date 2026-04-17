import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

export type NotificationType =
  | 'MARKET_NEW_SALE'
  | 'MARKET_NEW_REVIEW'
  | 'MARKET_ORDER_DELIVERED'
  | 'MARKET_ORDER_COMPLETED'
  | 'MARKET_NEGOTIATION_MESSAGE'
  | 'SYSTEM';

export interface NotificationItem {
  id: string;
  createdAt: string;
  readAt: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  url: string | null;
  meta: Record<string, unknown> | null;
}

export function useNotificationsPoll(isAuthenticated: boolean) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ count: number }>('/notifications/unread-count');
      setCount(data.count ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  return { count, refresh, setCount };
}

export async function fetchNotifications(unreadOnly = false, take = 30) {
  const params = new URLSearchParams();
  if (unreadOnly) params.set('unread', '1');
  params.set('take', String(take));
  return api.get<{ items: NotificationItem[]; unreadCount: number }>(
    `/notifications?${params.toString()}`,
  );
}

export async function markNotificationRead(id: string) {
  await api.post(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/read-all', {});
}
