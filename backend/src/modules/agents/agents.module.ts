import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  providers: [AgentsService, PrismaService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
