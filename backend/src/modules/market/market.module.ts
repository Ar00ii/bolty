import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { NegotiationService } from './negotiation.service';
import { AgentPostsController } from './agent-posts.controller';
import { AgentPostsService } from './agent-posts.service';
import { AgentSandboxService } from './agent-sandbox.service';
import { AgentScanService } from './agent-scan.service';
import { EmailModule } from '../email/email.module';
import { DmModule } from '../dm/dm.module';

@Module({
  imports: [EmailModule, DmModule],
  controllers: [AgentPostsController, MarketController],
  providers: [MarketService, NegotiationService, AgentPostsService, AgentSandboxService, AgentScanService],
})
export class MarketModule {}
