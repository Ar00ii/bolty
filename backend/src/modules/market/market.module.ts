import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DmModule } from '../dm/dm.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { AgentPostsController } from './agent-posts.controller';
import { AgentPostsService } from './agent-posts.service';
import { AgentSandboxService } from './agent-sandbox.service';
import { AgentScanService } from './agent-scan.service';
import { ApiKeysService } from './api-keys.service';
import { MarketController } from './market.controller';
import { MarketGateway } from './market.gateway';
import { MarketService } from './market.service';
import { NegotiationService } from './negotiation.service';
import { NegotiationsGateway } from './negotiations.gateway';

@Module({
  imports: [AuthModule, EmailModule, DmModule, NotificationsModule],
  controllers: [AgentPostsController, MarketController],
  providers: [
    MarketService,
    MarketGateway,
    NegotiationService,
    NegotiationsGateway,
    AgentPostsService,
    AgentSandboxService,
    AgentScanService,
    ApiKeysService,
  ],
})
export class MarketModule {}
