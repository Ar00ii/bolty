import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis Service — wrapper around ioredis for cache, rate limiting, and session storage
 *
 * This service provides persistent, distributed storage across multiple server instances.
 * Critical for:
 * - Rate limiting (brute force protection, login attempts)
 * - Nonce storage (replay attack prevention in wallet auth)
 * - Session/token validation
 * - Temporary verification codes (2FA, API key deletion)
 * - WebSocket user tracking
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    const useTls = redisUrl.startsWith('rediss://');

    this.client = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      ...(useTls && { tls: {} }),
      connectTimeout: 10000,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Reconnecting to Redis...');
    });
  }

  async onModuleInit(): Promise<void> {
    // Verify Redis connection at startup
    try {
      await this.client.ping();
      this.logger.log('Redis service initialized and verified');
    } catch (err) {
      this.logger.error(`Failed to connect to Redis: ${(err as Error).message}`);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result > 0;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Increment with automatic expiration (for rate limiting)
   * Returns the new counter value
   */
  async incrWithExpire(key: string, seconds: number): Promise<number> {
    const pipeline = this.client.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, seconds);
    const results = await pipeline.exec();
    if (!results || !Array.isArray(results[0])) throw new Error('Redis pipeline failed');
    return results[0][1] as number;
  }

  /**
   * Get Redis client for advanced operations
   */
  getClient(): Redis {
    return this.client;
  }
}
