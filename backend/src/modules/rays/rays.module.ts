import { Module } from '@nestjs/common';

import { RaysController } from './rays.controller';
import { RaysService } from './rays.service';

@Module({
  providers: [RaysService],
  controllers: [RaysController],
  exports: [RaysService],
})
export class RaysModule {}
