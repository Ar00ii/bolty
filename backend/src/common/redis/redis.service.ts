import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly store = new Map<string, CacheEntry>();

  constructor() {
    // Cleanup expired entries every 60 seconds
    setInterval(() => this.cleanup(), 60000);
    this.logger.log('In-memory cache initialized (no Redis required)');
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) + 1 : 1;
    const entry = this.store.get(key);
    this.store.set(key, {
      value: String(value),
      expiresAt: entry?.expiresAt ?? null,
    });
    return value;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      this.store.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 });
    }
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || !entry.expiresAt) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
