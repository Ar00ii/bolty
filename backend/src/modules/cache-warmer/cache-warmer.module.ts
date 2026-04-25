import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MarketModule } from '../market/market.module';
import { ReposModule } from '../repos/repos.module';
import { TokenModule } from '../token/token.module';

import { CacheWarmerService } from './cache-warmer.service';

@Module({
  imports: [ScheduleModule.forRoot(), MarketModule, ReposModule, TokenModule],
  providers: [CacheWarmerService],
})
export class CacheWarmerModule {}
