import { Global, Module } from '@nestjs/common';

import { StepUpService } from './step-up.service';

/**
 * StepUpService is a leaf utility (depends only on Prisma + Redis, both
 * global), so we expose it globally so any feature module can require 2FA
 * without setting off a chain of imports.
 */
@Global()
@Module({
  providers: [StepUpService],
  exports: [StepUpService],
})
export class StepUpModule {}
