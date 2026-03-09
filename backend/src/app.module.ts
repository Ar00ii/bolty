import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { ReposModule } from './modules/repos/repos.module';
import { ChartModule } from './modules/chart/chart.module';
import { UsersModule } from './modules/users/users.module';
import { DmModule } from './modules/dm/dm.module';
import { MarketModule } from './modules/market/market.module';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // ── Rate Limiting (in-memory) ────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: config.get<number>('RATE_LIMIT_WINDOW_MS', 900000),
            limit: config.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
          },
        ],
      }),
    }),

    // ── Core Modules ─────────────────────────────────────────────────────
    PrismaModule,
    RedisModule,

    // ── Feature Modules ───────────────────────────────────────────────────
    AuthModule,
    ChatModule,
    AiModule,
    ReposModule,
    ChartModule,
    UsersModule,
    DmModule,
    MarketModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
