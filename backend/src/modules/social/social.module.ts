import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';

import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialXController } from './x.controller';
import { SocialXService } from './x.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [SocialController, SocialXController],
  providers: [SocialService, SocialXService],
  exports: [SocialService, SocialXService],
})
export class SocialModule {}
