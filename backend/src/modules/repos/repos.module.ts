import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChartModule } from '../chart/chart.module';
import { EmailModule } from '../email/email.module';
import { MarketModule } from '../market/market.module';
import { ReputationModule } from '../reputation/reputation.module';

import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';

@Module({
  imports: [ConfigModule, ReputationModule, ChartModule, EmailModule, MarketModule],
  providers: [ReposService],
  controllers: [ReposController],
  exports: [ReposService],
})
export class ReposModule {}
