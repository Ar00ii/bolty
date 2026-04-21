import { API_URL } from '@/lib/api/client';

/**
 * Resolve a user-facing asset URL against the backend origin.
 *
 * Historically, the avatar upload endpoint stored a relative path like
 * `/api/v1/users/avatars/<uuid>`. When the frontend and backend run on
 * different origins (localhost:3000 ↔ localhost:3001, or split prod domains),
 * `<img src="/api/v1/...">` resolves against the frontend origin and 404s.
 *
 * This helper detects bare-path URLs and prepends the backend origin derived
 * from `NEXT_PUBLIC_API_URL`. Absolute URLs, data URIs, and blob URIs are
 * returned untouched.
 */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  // API_URL is e.g. `http://localhost:3001/api/v1`. Strip the `/api/...` suffix
  // to get the backend origin.
  let origin = '';
  try {
    const parsed = new URL(API_URL);
    origin = parsed.origin;
  } catch {
    origin = '';
  }
  if (!origin) return url;
  if (url.startsWith('/')) return `${origin}${url}`;
  return url;
}
