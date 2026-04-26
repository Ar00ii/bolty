import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';

import { AgentXController } from './agent-x.controller';
import { AgentXService } from './agent-x.service';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialXController } from './x.controller';
import { SocialXService } from './x.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [SocialController, SocialXController, AgentXController],
  providers: [SocialService, SocialXService, AgentXService],
  exports: [SocialService, SocialXService, AgentXService],
})
export class SocialModule {}
