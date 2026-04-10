import { useState, useEffect } from 'react';

import { API_URL } from '@/lib/api/client';

export function useUnreadDMs(isAuthenticated: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = async () => {
      try {
        const resp = await fetch(`${API_URL}/dm/unread-count`, { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setCount(data.count ?? 0);
        }
      } catch {
        /* ignore */
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return count;
}
