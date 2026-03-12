import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

const FALLBACK_DATABASE_URL = 'postgresql://postgres.ffmgcebzjatjxsfldchf:reloj78.AAAA@aws-1-eu-west-2.pooler.supabase.com:5432/postgres';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly config: ConfigService) {
    const databaseUrl = process.env.DATABASE_URL || FALLBACK_DATABASE_URL;
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
      datasources: {
        db: { url: databaseUrl },
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
