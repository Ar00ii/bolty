import { useState, useEffect } from 'react';

export function useUnreadDMs(isAuthenticated: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    const fetchCount = async () => {
      try {
        const resp = await fetch(`${API_URL}/dm/unread-count`, { credentials: 'include' });
        if (resp.ok) { const data = await resp.json(); setCount(data.count ?? 0); }
      } catch { /* ignore */ }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return count;
}
