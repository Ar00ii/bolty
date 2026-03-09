import { Module } from '@nestjs/common';
import { DmGateway } from './dm.gateway';
import { DmService } from './dm.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [DmGateway, DmService],
})
export class DmModule {}
