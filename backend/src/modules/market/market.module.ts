import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { NegotiationService } from './negotiation.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService, NegotiationService],
})
export class MarketModule {}
