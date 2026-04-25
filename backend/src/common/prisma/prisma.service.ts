import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Append default Prisma pool tuning to the connection URL when the
 * caller hasn't already specified them. Render's provided DATABASE_URL
 * ships with `connection_limit=1`, meaning the whole service
 * serializes through one Postgres connection. A handful of concurrent
 * reads (eg. AuthProvider's idle prefetch) saturated the pool and
 * 500'd every endpoint at once. 5 connections + 15 s pool timeout
 * gives sane headroom on the starter Postgres tier without going near
 * Postgres' max_connections.
 *
 * String-level append avoids `new URL(...)` — Postgres passwords can
 * legally contain characters that break the URL parser.
 */
function tunePoolDefaults(
  url: string,
  opts: { connectionLimit: string; poolTimeout: string },
): string {
  const additions: string[] = [];
  if (!/[?&]connection_limit=/.test(url)) {
    additions.push(`connection_limit=${opts.connectionLimit}`);
  }
  if (!/[?&]pool_timeout=/.test(url)) {
    additions.push(`pool_timeout=${opts.poolTimeout}`);
  }
  if (additions.length === 0) return url;
  const sep = url.includes('?') ? '&' : '?';
  return url + sep + additions.join('&');
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(_config: ConfigService) {
    const databaseUrl = _config.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const tunedUrl = tunePoolDefaults(databaseUrl, {
      connectionLimit: _config.get<string>('PRISMA_CONNECTION_LIMIT') || '5',
      poolTimeout: _config.get<string>('PRISMA_POOL_TIMEOUT') || '15',
    });
    super({
      log:
        _config.get<string>('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
      datasources: {
        db: { url: tunedUrl },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
