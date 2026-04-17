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

    // Log connection attempt (mask password)
    const maskedUrl = redisUrl.replace(/:[^:@]+@/, ':***@');
    this.logger.log(`Initializing Redis with URL: ${maskedUrl} (TLS: ${useTls})`);

    this.client = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        if (times > 20) {
          if (times % 60 === 0) {
            this.logger.warn(`Redis still unreachable after ${times} attempts`);
          }
          return 30000;
        }
        return Math.min(times * 200, 5000);
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      ...(useTls && { tls: {} }),
      connectTimeout: 10000,
      lazyConnect: true,
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
    // Kick off the connection without blocking bootstrap. If Redis is down the
    // HTTP server must still bind its port so the platform health-check passes.
    this.client.connect().catch((err) => {
      this.logger.warn(
        `Redis connection failed at startup: ${(err as Error).message}. ` +
          'Application will continue; rate limiting, sessions and nonces will be unavailable until Redis recovers.',
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (err) {
      this.client.disconnect();
      this.logger.warn(`Redis quit failed, forced disconnect: ${(err as Error).message}`);
    }
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
