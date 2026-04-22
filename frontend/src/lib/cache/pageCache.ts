/**
 * Module-level cache for GET-like API results.
 *
 * Simple stale-while-revalidate pattern: pages seed their state from
 * here on mount (no loading flash when you navigate back), then do
 * their normal fetch and write the fresh result back. Survives across
 * route changes inside the SPA; cleared on full reload.
 */

const cache = new Map<string, unknown>();

export function getCached<T>(key: string): T | null {
  return (cache.get(key) as T | undefined) ?? null;
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, value);
}

/** Drop an entry manually — e.g. after a mutation that invalidates it. */
export function invalidateCached(key: string): void {
  cache.delete(key);
}

/** Blow the whole cache, e.g. on logout. */
export function resetCache(): void {
  cache.clear();
}
