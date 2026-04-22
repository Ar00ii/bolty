// Secure API client — all requests go through backend

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private readonly responseCache = new Map<string, { data: unknown; expiresAt: number }>();
  private readonly CACHE_TTL = 60_000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getCsrfToken(): string | null {
    // Read CSRF token from cookie (set by server, non-httpOnly).
    // Cookie name is lowercase "csrf-token" — the legacy "X-CSRF-Token" name is
    // kept as a fallback so older browsers still carrying the old host-only
    // cookie can mirror it back until the server-sent clearCookie lands.
    if (typeof document === 'undefined') return null; // SSR safety
    const match =
      document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/) ||
      document.cookie.match(/(?:^|;\s*)X-CSRF-Token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private async doFetch(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<Response> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add CSRF token for mutations (POST, PUT, PATCH, DELETE)
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
        const csrfToken = this.getCsrfToken();
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
      }

      return await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
        signal: options.signal,
      });
    } catch (err) {
      if (err instanceof TypeError) {
        throw new ApiError('Cannot connect to server. Make sure the backend is running.', 0);
      }
      throw err;
    }
  }

  private parseError(error: unknown): string {
    const raw = (error as { message?: unknown }).message;
    if (Array.isArray(raw)) return String(raw[0] || 'Request failed');
    if (typeof raw === 'string' && raw) return raw;
    // NestJS wraps validation errors as a nested object: { message: { message: [...] } }
    if (raw && typeof raw === 'object') {
      const nested = (raw as { message?: unknown }).message;
      if (Array.isArray(nested)) return String(nested[0] || 'Request failed');
      if (typeof nested === 'string' && nested) return nested;
    }
    return 'Request failed';
  }

  private extractCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const top = (error as { code?: unknown }).code;
    if (typeof top === 'string') return top;
    const nested = (error as { message?: { code?: unknown } }).message;
    if (nested && typeof nested === 'object' && typeof nested.code === 'string') return nested.code;
    return undefined;
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.isRefreshing) return false;
    this.isRefreshing = true;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    // Drive the shared top-bar progress indicator for anything that looks
    // user-facing. Silent background polls (unread counts, notifications)
    // opt out by calling with their own `signal` — we fire the event on
    // every call but pair it with a `done` so the bar completes quickly.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bolty:progress-start'));
    }
    let response: Response;
    try {
      response = await this.doFetch(method, path, body, options);
    } catch (err) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bolty:progress-done'));
      }
      throw err;
    }

    // Auto-refresh on 401 — skip only the endpoints where retrying with a
    // refreshed access token makes no sense or risks looping:
    //   - /auth/refresh itself (loop)
    //   - /auth/login/* and /auth/register (401 = bad credentials, not expired token)
    //   - /auth/logout (we're tearing down the session anyway)
    // /auth/me MUST go through refresh so that reload after 15min works.
    const skipRefresh =
      path === '/auth/refresh' ||
      path === '/auth/logout' ||
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/register') ||
      path.startsWith('/auth/verify/') ||
      path.startsWith('/auth/nonce/') ||
      path.startsWith('/auth/2fa/verify') ||
      path.startsWith('/auth/password/');
    if (response.status === 401 && !skipRefresh) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await this.doFetch(method, path, body, options);
      }
    }

    if (!response.ok) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bolty:progress-done'));
      }
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(
        this.parseError(error),
        response.status,
        this.extractCode(error),
        error as Record<string, unknown>,
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bolty:progress-done'));
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    const entry = this.responseCache.get(path);
    if (entry && Date.now() < entry.expiresAt) {
      return Promise.resolve(entry.data as T);
    }
    return this.request<T>('GET', path, undefined, options).then((data) => {
      this.responseCache.set(path, { data, expiresAt: Date.now() + this.CACHE_TTL });
      return data;
    });
  }

  // Silently pre-populate the cache for a list of paths (no progress bar).
  prefetch(paths: string[]): void {
    for (const path of paths) {
      if (this.responseCache.has(path)) continue;
      this.doFetch('GET', path)
        .then((res) => (res.ok ? (res.json() as Promise<unknown>) : Promise.resolve(null)))
        .then((data) => {
          if (data != null) {
            this.responseCache.set(path, { data, expiresAt: Date.now() + this.CACHE_TTL });
          }
        })
        .catch(() => {});
    }
  }

  // Invalidate all cached entries whose key starts with pathPrefix.
  invalidate(pathPrefix: string): void {
    Array.from(this.responseCache.keys()).forEach((key) => {
      if (key.startsWith(pathPrefix)) this.responseCache.delete(key);
    });
  }

  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }
  put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }
  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }
  delete<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, body, options);
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    let response: Response;
    try {
      const headers: Record<string, string> = {};
      const csrfToken = this.getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
        // No Content-Type — browser sets multipart/form-data with boundary
      });
    } catch (err) {
      if (err instanceof TypeError) {
        throw new ApiError('Cannot connect to server.', 0);
      }
      throw err;
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      const raw = (error as { message?: unknown }).message;
      let msg: string;
      if (Array.isArray(raw)) msg = String(raw[0] || 'Upload failed');
      else if (typeof raw === 'string' && raw) msg = raw;
      else msg = 'Upload failed';
      throw new ApiError(
        msg,
        response.status,
        this.extractCode(error),
        error as Record<string, unknown>,
      );
    }
    return response.json() as Promise<T>;
  }

  async stream(
    path: string,
    body: unknown,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ): Promise<void> {
    let response: Response;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const csrfToken = this.getCsrfToken();
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
      });
    } catch {
      onError('Cannot connect to server.');
      return;
    }

    if (!response.ok || !response.body) {
      onError('Stream failed');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data) as { chunk?: string; error?: string };
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          if (parsed.chunk) onChunk(parsed.chunk);
        } catch {
          /* skip malformed */
        }
      }
    }
  }
}

export const api = new ApiClient(API_URL);
