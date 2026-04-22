import { Module } from '@nestjs/common';

import { ReputationModule } from '../reputation/reputation.module';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WalletsService } from './wallets.service';

@Module({
  imports: [ReputationModule],
  providers: [UsersService, WalletsService],
  controllers: [UsersController],
  exports: [UsersService, WalletsService],
})
export class UsersModule {}
