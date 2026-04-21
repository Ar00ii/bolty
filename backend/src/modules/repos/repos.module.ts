import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChartModule } from '../chart/chart.module';
import { ReputationModule } from '../reputation/reputation.module';

import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';

@Module({
  imports: [ConfigModule, ReputationModule, ChartModule],
  providers: [ReposService],
  controllers: [ReposController],
})
export class ReposModule {}
