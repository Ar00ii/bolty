import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/prisma/prisma.module';

import { SeedListingsService } from './seed-listings.service';

/**
 * One-shot seeders. Each service self-gates on an env var so this
 * module is safe to keep registered in every environment — the
 * services do nothing unless their flag is set.
 */
@Module({
  imports: [PrismaModule],
  providers: [SeedListingsService],
})
export class SeedModule {}
