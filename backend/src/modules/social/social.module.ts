import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';

import { AgentXAutonomousService } from './agent-x-autonomous.service';
import { AgentXController } from './agent-x.controller';
import { AgentXService } from './agent-x.service';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialXController } from './x.controller';
import { SocialXService } from './x.service';

@Module({
  // ScheduleModule.forRoot() is registered globally elsewhere; we
  // import again here defensively so AgentXAutonomousService's @Cron
  // decorators get picked up even if the module is loaded standalone
  // (e.g. in unit tests).
  imports: [PrismaModule, RedisModule, ScheduleModule.forRoot()],
  controllers: [SocialController, SocialXController, AgentXController],
  providers: [SocialService, SocialXService, AgentXService, AgentXAutonomousService],
  exports: [SocialService, SocialXService, AgentXService, AgentXAutonomousService],
})
export class SocialModule {}
