import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';

import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  /**
   * Public — the BOLTY token page on the landing site needs to load
   * price data for unauthenticated visitors. The service caches to
   * Redis for 60s so this is cheap.
   */
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('bolty')
  getBolty() {
    return this.tokenService.getBoltyStats();
  }

  /**
   * Recent trade feed for the BOLTY page — last ~30 swaps with side,
   * USD size, and tx hash. Served public so unauthed visitors see the
   * live tape. Backend caches for 4s so hammering this endpoint from
   * a client polling loop doesn't pierce GeckoTerminal's rate limit.
   */
  @Public()
  @Throttle({ default: { limit: 180, ttl: 60000 } })
  @Get('bolty/trades')
  getBoltyTrades() {
    return this.tokenService.getBoltyTrades();
  }
}
