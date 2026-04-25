import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';

import { BoltyGuardService } from './boltyguard.service';

@Controller('boltyguard')
export class BoltyGuardController {
  constructor(private readonly guard: BoltyGuardService) {}

  /** Public — anyone can read the latest score for any listing.
   *  Used by the launchpad ranking and the agent detail page badge.
   *  Cheap DB read, throttled lightly to discourage scraping. */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('listings/:id/latest')
  async latestForListing(@Param('id') listingId: string) {
    const scan = await this.guard.getLatest(listingId);
    if (!scan) return null;
    return {
      id: scan.id,
      score: scan.score,
      worstSeverity: scan.worstSeverity,
      summary: scan.summary,
      scanner: scan.scanner,
      scannedAt: scan.createdAt,
      findings: scan.findings,
    };
  }

  /** Trigger a fresh scan of a listing. Used by the publish flow and
   *  by sellers who updated their code. Heavier op — tighter throttle. */
  @Public()
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('listings/:id/scan')
  @HttpCode(HttpStatus.OK)
  async rescanListing(@Param('id') listingId: string) {
    return this.guard.scanListing(listingId);
  }

  /** External scan-anything endpoint. Stateless, doesn't persist.
   *  Throttled per-IP. Premium / quota gating + BOLTY-token billing
   *  ride on top of this in a follow-up PR. */
  @Public()
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scanCode(
    @Body() body: { code?: string; fileName?: string; isAgent?: boolean },
  ) {
    const code = String(body?.code || '').slice(0, 200_000);
    return this.guard.scanCode(code, {
      fileName: body?.fileName,
      isAgent: body?.isAgent,
    });
  }
}
