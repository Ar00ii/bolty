import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { DmController } from './dm.controller';
import { DmGateway } from './dm.gateway';
import { DmService } from './dm.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [DmController],
  providers: [DmGateway, DmService],
  exports: [DmService],
})
export class DmModule {}
