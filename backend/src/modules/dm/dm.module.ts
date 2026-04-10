import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { DmController } from './dm.controller';
import { DmGateway } from './dm.gateway';
import { DmService } from './dm.service';

@Module({
  imports: [AuthModule],
  controllers: [DmController],
  providers: [DmGateway, DmService],
  exports: [DmService],
})
export class DmModule {}
