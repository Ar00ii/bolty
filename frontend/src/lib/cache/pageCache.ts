/**
 * Module-level cache for GET-like API results.
 *
 * Stale-while-revalidate pattern: pages seed state from here on mount
 * so the first frame shows the last known data. If the entry is younger
 * than FRESH_MS we skip the refetch entirely — this is the "instant
 * back-navigation" win.
 *
 * Survives across route changes inside the SPA; cleared on full reload
 * and on logout (via resetCache).
 */

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** How long a cached value is considered "fresh" — no refetch needed. */
export const FRESH_MS = 30_000;

export function getCached<T>(key: string): T | null {
  return (cache.get(key) as CacheEntry<T> | undefined)?.data ?? null;
}

/**
 * Returns `{ data, fresh }` so callers can skip the refetch when fresh.
 * Fresh means the entry is younger than `FRESH_MS` (30s by default).
 */
export function getCachedWithStatus<T>(
  key: string,
  maxAgeMs: number = FRESH_MS,
): { data: T | null; fresh: boolean } {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return { data: null, fresh: false };
  return { data: entry.data, fresh: Date.now() - entry.fetchedAt < maxAgeMs };
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, { data: value, fetchedAt: Date.now() });
}

/** Drop an entry manually — e.g. after a mutation that invalidates it. */
export function invalidateCached(key: string): void {
  cache.delete(key);
}

/** Blow the whole cache, e.g. on logout. */
export function resetCache(): void {
  cache.clear();
}

// ── Prefetch helper ────────────────────────────────────────────────────

type Fetcher<T> = () => Promise<T>;

const inflight = new Map<string, Promise<unknown>>();

/**
 * Fire a fetch and cache the result, without blocking the caller. If
 * the key is already fresh in the cache we skip. If a fetch is already
 * in-flight for that key we return the same promise so we don't double-
 * fetch the same URL across a prefetch + a page mount racing.
 */
export function prefetch<T>(
  key: string,
  fetcher: Fetcher<T>,
  maxAgeMs: number = FRESH_MS,
): Promise<T | null> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.fetchedAt < maxAgeMs) {
    return Promise.resolve(entry.data);
  }
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fetcher()
    .then((data) => {
      setCached(key, data);
      return data;
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.debug('prefetch failed', key, err);
      return null;
    })
    .finally(() => {
      inflight.delete(key);
    }) as Promise<T | null>;
  inflight.set(key, p);
  return p;
}
