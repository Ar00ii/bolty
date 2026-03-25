import { Module } from '@nestjs/common';
import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';
import { ConfigModule } from '@nestjs/config';
import { ReputationModule } from '../reputation/reputation.module';

@Module({
  imports: [ConfigModule, ReputationModule],
  providers: [ReposService],
  controllers: [ReposController],
})
export class ReposModule {}
