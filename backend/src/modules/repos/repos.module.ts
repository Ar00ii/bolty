import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ReputationModule } from '../reputation/reputation.module';

import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';

@Module({
  imports: [ConfigModule, ReputationModule],
  providers: [ReposService],
  controllers: [ReposController],
})
export class ReposModule {}
