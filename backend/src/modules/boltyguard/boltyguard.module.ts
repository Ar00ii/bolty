import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/prisma/prisma.module';

import { BoltyGuardController } from './boltyguard.controller';
import { BoltyGuardService } from './boltyguard.service';

@Module({
  imports: [PrismaModule],
  controllers: [BoltyGuardController],
  providers: [BoltyGuardService],
  exports: [BoltyGuardService],
})
export class BoltyGuardModule {}
