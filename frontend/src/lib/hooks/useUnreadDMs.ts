import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import { API_URL, WS_URL } from '@/lib/api/client';

/**
 * Tracks the authenticated user's unread DM count for the sidebar badge.
 *
 * Pushes from the /dm gateway (`newDM` events to the `user:${userId}` room)
 * are the primary signal — we just ++ when one lands. A slow fallback poll
 * keeps the number self-healing if the socket silently drops.
 */
export function useUnreadDMs(isAuthenticated: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const resp = await fetch(`${API_URL}/dm/unread-count`, { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled) setCount(data.count ?? 0);
        }
      } catch {
        /* ignore */
      }
    };

    fetchCount();

    const socket = io(`${WS_URL}/dm`, {
      withCredentials: true,
      transports: ['websocket'],
      timeout: 8000,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });

    // New DM delivered to this user — just bump, don't round-trip the API.
    socket.on('newDM', () => {
      setCount((prev) => prev + 1);
    });

    // Slower fallback; the socket is the primary signal now.
    const interval = setInterval(fetchCount, 120_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      socket.disconnect();
    };
  }, [isAuthenticated]);

  return count;
}
