import { Module } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { RaysService } from './rays.service';
import { RaysController } from './rays.controller';

@Module({
  providers: [RaysService, PrismaService],
  controllers: [RaysController],
  exports: [RaysService],
})
export class RaysModule {}
