import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';

import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';

@Module({
  imports: [NotificationsModule],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
