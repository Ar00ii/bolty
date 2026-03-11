// Secure API client — all requests go through backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...options.headers },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
        signal: options.signal,
      });
    } catch (err) {
      if (err instanceof TypeError) {
        throw new ApiError(
          'Cannot connect to server. Make sure the backend is running.',
          0,
        );
      }
      throw err;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      const raw = (error as { message?: unknown }).message;
      let msg: string;
      if (Array.isArray(raw)) {
        msg = String(raw[0] || 'Request failed');
      } else if (typeof raw === 'string' && raw) {
        msg = raw;
      } else {
        msg = 'Request failed';
      }
      throw new ApiError(msg, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
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
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
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
      throw new ApiError(msg, response.status);
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
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(data) as { chunk?: string; error?: string };
          if (parsed.error) { onError(parsed.error); return; }
          if (parsed.chunk) onChunk(parsed.chunk);
        } catch { /* skip malformed */ }
      }
    }
  }
}

export const api = new ApiClient(API_URL);
