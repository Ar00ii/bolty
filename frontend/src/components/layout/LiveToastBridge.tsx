'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { WS_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useToast, type ToastType } from '@/lib/hooks/useToast';
import type { NotificationItem, NotificationType } from '@/lib/hooks/useNotifications';

const TYPE_TOAST: Record<NotificationType, ToastType> = {
  MARKET_NEW_SALE: 'success',
  MARKET_NEW_REVIEW: 'info',
  MARKET_ORDER_DELIVERED: 'info',
  MARKET_ORDER_COMPLETED: 'success',
  MARKET_NEGOTIATION_MESSAGE: 'info',
  SYSTEM: 'info',
};

export function LiveToastBridge() {
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const dmSocketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      dmSocketRef.current?.disconnect();
      dmSocketRef.current = null;
      return;
    }

    // Notifications namespace (sales, reviews, deliveries, etc.)
    const socket = io(`${WS_URL}/notifications`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('notification:new', (n: NotificationItem) => {
      const kind = TYPE_TOAST[n.type] ?? 'info';
      const snippet = n.body ? ` · ${n.body}` : '';
      const text = `${n.title}${snippet}`.slice(0, 160);
      addToast(text, kind, 10_000);
    });

    // DM namespace — we already listen to newDM for the chat UI, but we also
    // want a toast when the user isn't currently on /dm.
    const dm = io(`${WS_URL}/dm`, { withCredentials: true, transports: ['websocket'] });
    dmSocketRef.current = dm;

    dm.on('newDM', ({ message }: { peerId: string; message: { senderId: string; senderUsername: string | null; content: string } }) => {
      if (message.senderId === userIdRef.current) return;
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dm')) return;
      const who = message.senderUsername ? `@${message.senderUsername}` : 'Someone';
      const preview = message.content.slice(0, 80);
      addToast(`${who}: ${preview}`, 'info', 10_000);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      dm.disconnect();
      dmSocketRef.current = null;
    };
  }, [isAuthenticated, addToast, router]);

  return null;
}
