import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

import { Public } from '../../common/decorators/public.decorator';

import { ChartService } from './chart.service';

class HistoryQuery {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(168) // max 7 days
  hours?: number;
}

@Controller('chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('price')
  getPrice() {
    return this.chartService.getCurrentPrice();
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('eth-price')
  getEthPrice() {
    return this.chartService.getEthPrice();
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('history')
  getHistory(@Query() query: HistoryQuery) {
    return this.chartService.getPriceHistory(query.hours || 24);
  }
}
