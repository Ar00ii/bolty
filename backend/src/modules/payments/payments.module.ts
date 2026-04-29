import { Module } from '@nestjs/common';

import { SolanaPaymentsService } from './solana-payments.service';

@Module({
  providers: [SolanaPaymentsService],
  exports: [SolanaPaymentsService],
})
export class PaymentsModule {}
