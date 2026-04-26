import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipCsrf } from '../../common/guards/csrf.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { AgentXService } from './agent-x.service';

/**
 * Per-listing X (Twitter) BYO endpoints.
 *
 *   POST   /social/agent-x/:listingId/setup        → store/rotate clientId+secret
 *   GET    /social/agent-x/:listingId/connect-url  → start OAuth (auth)
 *   GET    /social/agent-x/callback                → OAuth target (Public)
 *   GET    /social/agent-x/:listingId/status       → "configured? connected as @x"
 *   DELETE /social/agent-x/:listingId              → wipe the row
 */
@Controller('social/agent-x')
export class AgentXController {
  constructor(private readonly agentX: AgentXService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post(':listingId/setup')
  async setup(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
    @Body() body: { clientId?: string; clientSecret?: string },
  ) {
    await this.agentX.assertOwner(listingId, userId);
    return this.agentX.upsertAppCredentials(
      listingId,
      body?.clientId ?? '',
      body?.clientSecret ?? '',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(':listingId/connect-url')
  async connectUrl(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
    @Query('returnTo') returnTo?: string,
    @Query('forceLogin') forceLogin?: string,
  ) {
    await this.agentX.assertOwner(listingId, userId);
    const force = forceLogin === '1' || forceLogin === 'true';
    return this.agentX.generateAuthUrl(listingId, userId, returnTo, { forceLogin: force });
  }

  /** OAuth landing — X is the caller, no JWT cookie. The state param
   *  carries listingId + verifier so we know which row to fill. */
  @Public()
  @SkipCsrf()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const fe = process.env.FRONTEND_URL || 'https://www.boltynetwork.xyz';
    if (error) {
      return res.redirect(302, `${fe}/profile?agent_x_error=${encodeURIComponent(error)}`);
    }
    try {
      const { listingId, screenName, returnTo } = await this.agentX.handleCallback(code, state);
      const dest = sanitizeReturnTo(returnTo, fe, listingId);
      const sep = dest.includes('?') ? '&' : '?';
      return res.redirect(
        302,
        `${dest}${sep}agent_x_connected=${encodeURIComponent(screenName)}&listingId=${listingId}`,
      );
    } catch (err) {
      const msg = (err as Error).message ?? 'oauth_failed';
      return res.redirect(302, `${fe}/profile?agent_x_error=${encodeURIComponent(msg)}`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':listingId/status')
  async status(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
  ) {
    await this.agentX.assertOwner(listingId, userId);
    return this.agentX.getStatus(listingId);
  }

  /** Profile-page roll-up: every AI agent the user owns + its X status. */
  @UseGuards(JwtAuthGuard)
  @Get('owned')
  async owned(@CurrentUser('id') userId: string) {
    return this.agentX.listOwnedWithStatus(userId);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Delete(':listingId')
  async disconnect(
    @CurrentUser('id') userId: string,
    @Param('listingId') listingId: string,
  ) {
    await this.agentX.assertOwner(listingId, userId);
    await this.agentX.disconnect(listingId);
    return { ok: true };
  }
}

function sanitizeReturnTo(raw: string | null, fe: string, listingId: string): string {
  // Default landing — wizard for the listing the user just connected.
  const defaultDest = `${fe}/market/agents/${listingId}`;
  if (!raw) return defaultDest;
  try {
    if (raw.startsWith('/')) return `${fe}${raw}`;
    const u = new URL(raw);
    const f = new URL(fe);
    if (u.host === f.host) return raw;
  } catch {
    /* fall through */
  }
  return defaultDest;
}
