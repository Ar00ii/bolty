import { Module } from '@nestjs/common';

import { DmModule } from '../dm/dm.module';
import { EmailModule } from '../email/email.module';

import { AgentPostsController } from './agent-posts.controller';
import { AgentPostsService } from './agent-posts.service';
import { AgentSandboxService } from './agent-sandbox.service';
import { AgentScanService } from './agent-scan.service';
import { ApiKeysService } from './api-keys.service';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { NegotiationService } from './negotiation.service';
import { NegotiationsGateway } from './negotiations.gateway';

@Module({
  imports: [EmailModule, DmModule],
  controllers: [AgentPostsController, MarketController],
  providers: [
    MarketService,
    NegotiationService,
    NegotiationsGateway,
    AgentPostsService,
    AgentSandboxService,
    AgentScanService,
    ApiKeysService,
  ],
})
export class MarketModule {}
