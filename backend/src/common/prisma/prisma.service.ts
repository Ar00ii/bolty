import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * FORCE Prisma pool tuning on the connection URL. Render's bundled
 * DATABASE_URL ships with `connection_limit=1` baked into the
 * connection string itself, which means the whole service serializes
 * through one Postgres connection and any handful of concurrent reads
 * 500s every endpoint at once. The previous "skip if already present"
 * version of this helper let Render's `connection_limit=1` win, so
 * the pool stayed at 1 even though the env var said 5.
 *
 * Now we strip any existing connection_limit / pool_timeout from the
 * URL and re-append our values. The env vars
 * PRISMA_CONNECTION_LIMIT / PRISMA_POOL_TIMEOUT win; otherwise
 * defaults are 5 / 15 s.
 *
 * String-level surgery (not `new URL(...)`) — Postgres passwords can
 * legally contain `@`, `?`, `&` which break the URL parser.
 */
function tunePoolDefaults(
  url: string,
  opts: { connectionLimit: string; poolTimeout: string },
): string {
  // Drop any existing copies — `(\?|&)connection_limit=[^&]*` matches
  // `?connection_limit=1` at the start AND `&connection_limit=1` later.
  // We stitch the leading `?` back if it was the first param removed.
  let stripped = url
    .replace(/(\?|&)connection_limit=[^&]*/g, (_, sep) => (sep === '?' ? '?' : ''))
    .replace(/(\?|&)pool_timeout=[^&]*/g, (_, sep) => (sep === '?' ? '?' : ''));
  // Heal any `?&` left behind by stripping a non-leading param after a leading one.
  stripped = stripped.replace(/\?&/, '?').replace(/\?$/, '');
  const sep = stripped.includes('?') ? '&' : '?';
  return `${stripped}${sep}connection_limit=${opts.connectionLimit}&pool_timeout=${opts.poolTimeout}`;
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
