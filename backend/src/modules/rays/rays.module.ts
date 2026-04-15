import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

import { RaysController } from './rays.controller';
import { RaysService } from './rays.service';

@Module({
  providers: [RaysService, PrismaService],
  controllers: [RaysController],
  exports: [RaysService],
})
export class RaysModule {}
