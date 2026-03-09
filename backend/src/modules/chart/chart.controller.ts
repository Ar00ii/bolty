import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { ChartService } from './chart.service';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('history')
  getHistory(@Query() query: HistoryQuery) {
    return this.chartService.getPriceHistory(query.hours || 24);
  }
}
