import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../common/redis/redis.service';

import { BoltyGuardService } from './boltyguard.service';
import { FREE_TIER_DAILY_QUOTA, HolderGateService } from './holder-gate.service';

@Controller('boltyguard')
export class BoltyGuardController {
  constructor(
    private readonly guard: BoltyGuardService,
    private readonly holderGate: HolderGateService,
    private readonly redis: RedisService,
  ) {}

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
   *
   *  Tiering:
   *  - Anonymous / non-holder: limited to FREE_TIER_DAILY_QUOTA scans
   *    per day per user (or per IP fallback). Returns 403 once quota
   *    is exhausted with a hint to top up $BOLTY.
   *  - Holder of ≥ MIN_HOLDING $BOLTY (env): unlimited.
   *
   *  Holder check is read-only — we don't burn tokens. Holding alone
   *  unlocks the API.
   */
  @Public()
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scanCode(
    @CurrentUser('id') userId: string | null,
    @Body() body: { code?: string; fileName?: string; isAgent?: boolean },
  ) {
    const code = String(body?.code || '').slice(0, 200_000);
    if (!code.trim()) throw new BadRequestException('code is required');

    const gate = await this.holderGate.isHolder(userId);
    if (!gate.holder) {
      const remaining = await this.consumeFreeQuota(userId ?? null);
      if (remaining < 0) {
        throw new ForbiddenException(
          `Free quota exhausted. Hold ≥ ${gate.minHolding} $BOLTY in a linked wallet to unlock unmetered scans (current balance: ${gate.balance}).`,
        );
      }
    }

    const report = await this.guard.scanCode(code, {
      fileName: body?.fileName,
      isAgent: body?.isAgent,
    });
    return {
      ...report,
      tier: gate.holder ? 'holder' : 'free',
      holding: gate.balance,
      minHolding: gate.minHolding,
    };
  }

  /** Decrement the per-user daily quota in Redis. Returns the count
   *  of remaining scans AFTER this call; -1 means already exhausted. */
  private async consumeFreeQuota(userId: string | null): Promise<number> {
    const bucket =
      userId ?? `anon-${new Date().toISOString().slice(0, 10)}`;
    const key = `boltyguard:freequota:${bucket}:${new Date()
      .toISOString()
      .slice(0, 10)}`;
    const used = await this.redis.incr(key);
    if (used === 1) {
      // Expire at end of day. 25h is fine — generous TTL avoids race.
      await this.redis.expire(key, 25 * 60 * 60);
    }
    return FREE_TIER_DAILY_QUOTA - used;
  }
}
