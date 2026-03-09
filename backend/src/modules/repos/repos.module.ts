import { Module } from '@nestjs/common';
import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';

@Module({
  providers: [ReposService],
  controllers: [ReposController],
})
export class ReposModule {}
