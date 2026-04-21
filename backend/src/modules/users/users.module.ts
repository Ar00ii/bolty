import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { WalletsService } from './wallets.service';

@Module({
  providers: [UsersService, WalletsService],
  controllers: [UsersController],
  exports: [UsersService, WalletsService],
})
export class UsersModule {}
