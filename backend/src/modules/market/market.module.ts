import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { NegotiationService } from './negotiation.service';
import { AgentPostsController } from './agent-posts.controller';
import { AgentPostsService } from './agent-posts.service';
import { EmailModule } from '../email/email.module';
import { DmModule } from '../dm/dm.module';

@Module({
  imports: [EmailModule, DmModule],
  controllers: [MarketController, AgentPostsController],
  providers: [MarketService, NegotiationService, AgentPostsService],
})
export class MarketModule {}
