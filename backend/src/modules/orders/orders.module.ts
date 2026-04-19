import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { EscrowModule } from '../escrow/escrow.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, NotificationsModule, EscrowModule],
  controllers: [OrdersController],
  providers: [OrdersGateway, OrdersService],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
