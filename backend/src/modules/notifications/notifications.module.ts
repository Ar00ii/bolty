import { Module } from '@nestjs/common';

import { RedisModule } from '../../common/redis/redis.module';
import { AuthModule } from '../auth/auth.module';

import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
