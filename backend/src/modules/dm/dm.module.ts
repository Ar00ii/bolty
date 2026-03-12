import { Module } from '@nestjs/common';
import { DmGateway } from './dm.gateway';
import { DmService } from './dm.service';
import { DmController } from './dm.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DmController],
  providers: [DmGateway, DmService],
})
export class DmModule {}
