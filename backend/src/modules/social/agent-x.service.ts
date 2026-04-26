import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

import { decryptToken, encryptToken } from '../../common/crypto/token-cipher.util';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

import { composeLaunchTweet } from './x.service';

/**
 * Per-AI-agent X (Twitter) integration — Bring Your Own X App.
 *
 * Each AI_AGENT MarketListing carries its own X Developer App
 * (clientId + clientSecret) plus the OAuth-issued tokens for the
 * X account that agent will tweet AS. This sidesteps the X API
 * pricing cliff (Free tier rejects POST /2/tweets with 402) by
 * pushing the API quota onto the seller's own developer account.
 *
 * Lifecycle of an AgentXConnection row:
 *   1. Seller pastes Client ID + Secret in the wizard
 *      → POST /social/agent-x/:listingId/setup
 *      → upsert row with `clientIdEnc` + `clientSecretEnc`, OAuth fields null
 *   2. Seller clicks "Connect X account"
 *      → GET  /social/agent-x/:listingId/connect-url
 *      → service generates PKCE + state, persists verifier in Redis
 *      → redirect to x.com/i/oauth2/authorize using THE LISTING'S clientId
 *   3. X redirects to /social/agent-x/callback with code + state
 *      → service exchanges code using the listing's clientSecret
 *      → fills xUserId, screenName, accessTokenEnc, refreshTokenEnc, expiresAt
 *      → redirect back to the wizard with ?x_connected=@handle
 *   4. Auto-tweet path: POST /social/x/post-launch sees `listingId`
 *      → looks up AgentXConnection
 *      → refreshes token if needed (using THIS listing's clientSecret)
 *      → posts using the listing's bearer token
 */
@Injectable()
export class AgentXService {
  private readonly logger = new Logger(AgentXService.name);
  private static readonly STATE_TTL_SEC = 600;
  private static readonly DAILY_POST_CAP = 50;
  private static readonly REFRESH_BUFFER_MS = 60_000;
  private static readonly SCOPES = 'tweet.read tweet.write users.read offline.access';
  private static readonly OAUTH_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
  private static readonly OAUTH_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
  private static readonly TWEETS_URL = 'https://api.twitter.com/2/tweets';
  private static readonly USERS_ME_URL = 'https://api.twitter.com/2/users/me';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ─── Listing-owner gate ────────────────────────────────────────────

  /** Throws if the calling user does not own this listing. Used by every
   *  setup / connect / disconnect endpoint to prevent one seller from
   *  hijacking another seller's agent's X. */
  async assertOwner(listingId: string, userId: string): Promise<void> {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, type: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }
    if (listing.type !== 'AI_AGENT') {
      throw new BadRequestException('Only AI_AGENT listings can connect an X account');
    }
  }

  // ─── Step 1: store the seller's X App credentials ─────────────────

  async upsertAppCredentials(
    listingId: string,
    clientId: string,
    clientSecret: string,
  ): Promise<{ ok: true; hasOAuth: boolean }> {
    const cid = clientId.trim();
    const cs = clientSecret.trim();
    if (!cid || !cs) {
      throw new BadRequestException('Both Client ID and Client Secret are required');
    }
    if (cid.length > 200 || cs.length > 200) {
      throw new BadRequestException('Credentials look unreasonably long — double-check what you pasted');
    }
    const existing = await this.prisma.agentXConnection.findUnique({
      where: { listingId },
      select: { id: true, accessTokenEnc: true },
    });
    await this.prisma.agentXConnection.upsert({
      where: { listingId },
      create: {
        listingId,
        clientIdEnc: encryptToken(cid),
        clientSecretEnc: encryptToken(cs),
      },
      update: {
        clientIdEnc: encryptToken(cid),
        clientSecretEnc: encryptToken(cs),
        // Rotating the app credentials invalidates any prior OAuth
        // tokens — they were minted for the old clientId. Wipe so the
        // user is forced to re-OAuth.
        ...(existing
          ? {
              accessTokenEnc: null,
              refreshTokenEnc: null,
              expiresAt: null,
              xUserId: null,
              screenName: null,
              postsLast24h: 0,
              postsWindowStart: new Date(),
            }
          : {}),
      },
    });
    return { ok: true, hasOAuth: !!existing?.accessTokenEnc };
  }

  // ─── Step 2: generate the OAuth authorize URL using THE LISTING's app ──

  async generateAuthUrl(
    listingId: string,
    userId: string,
    returnTo: string | undefined,
    opts?: { forceLogin?: boolean },
  ): Promise<{ url: string }> {
    const row = await this.prisma.agentXConnection.findUnique({ where: { listingId } });
    if (!row) {
      throw new BadRequestException(
        'Save your X App credentials first (Client ID + Secret).',
      );
    }
    const clientId = decryptToken(row.clientIdEnc);
    if (!clientId) {
      throw new BadRequestException('Stored Client ID is corrupt — re-paste your credentials');
    }
    const redirectUri = this.requireRedirectUri();

    const verifier = b64url(crypto.randomBytes(48));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const state = b64url(crypto.randomBytes(24));

    await this.redis
      .set(
        this.stateKey(state),
        JSON.stringify({ listingId, userId, verifier, returnTo: returnTo ?? null }),
        AgentXService.STATE_TTL_SEC,
      )
      .catch((err) => this.logger.warn(`OAuth state persist failed: ${(err as Error).message}`));

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: AgentXService.SCOPES,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    if (opts?.forceLogin) {
      params.set('force_login', 'true');
      params.set('prompt', 'login');
    }
    return { url: `${AgentXService.OAUTH_AUTH_URL}?${params.toString()}` };
  }

  // ─── Step 3: handle the callback X bounces back to ────────────────

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ listingId: string; screenName: string; returnTo: string | null }> {
    if (!code || !state) throw new BadRequestException('missing code or state');

    const stashed = await this.redis.get(this.stateKey(state)).catch(() => null);
    if (!stashed) throw new ForbiddenException('OAuth state expired or unknown');
    await this.redis.del(this.stateKey(state)).catch(() => null);

    let parsed: { listingId: string; userId: string; verifier: string; returnTo: string | null };
    try {
      parsed = JSON.parse(stashed);
    } catch {
      throw new ForbiddenException('OAuth state corrupt');
    }

    const row = await this.prisma.agentXConnection.findUnique({
      where: { listingId: parsed.listingId },
    });
    if (!row) throw new BadRequestException('Listing X credentials missing');
    const clientId = decryptToken(row.clientIdEnc);
    const clientSecret = decryptToken(row.clientSecretEnc);
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Stored credentials are corrupt — re-paste them');
    }

    const tokens = await this.exchangeCode(clientId, clientSecret, code, parsed.verifier);
    const profile = await this.fetchMe(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await this.prisma.agentXConnection.update({
      where: { listingId: parsed.listingId },
      data: {
        xUserId: profile.id,
        screenName: profile.username,
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        expiresAt,
        scopes: tokens.scope ?? AgentXService.SCOPES,
        postsLast24h: 0,
        postsWindowStart: new Date(),
      },
    });
    return {
      listingId: parsed.listingId,
      screenName: profile.username,
      returnTo: parsed.returnTo,
    };
  }

  // ─── Read / write helpers ─────────────────────────────────────────

  async getStatus(listingId: string) {
    const row = await this.prisma.agentXConnection.findUnique({ where: { listingId } });
    if (!row) return { configured: false as const, connected: false as const };
    return {
      configured: true as const,
      connected: !!row.accessTokenEnc,
      screenName: row.screenName,
      postsLast24h: row.postsLast24h,
      dailyCap: AgentXService.DAILY_POST_CAP,
      connectedAt: row.accessTokenEnc ? row.updatedAt.toISOString() : null,
    };
  }

  async disconnect(listingId: string): Promise<void> {
    await this.prisma.agentXConnection.deleteMany({ where: { listingId } });
  }

  /** All AI_AGENT listings owned by `userId`, each annotated with its
   *  X connection status. Drives the per-agent X manager in /profile so
   *  sellers can see which of their agents need setup at a glance. */
  async listOwnedWithStatus(userId: string) {
    const listings = await this.prisma.marketListing.findMany({
      where: { sellerId: userId, type: 'AI_AGENT' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        agentXConnection: {
          select: { screenName: true, accessTokenEnc: true, postsLast24h: true, updatedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return listings.map((l) => {
      const x = l.agentXConnection;
      const status = x
        ? {
            configured: true as const,
            connected: !!x.accessTokenEnc,
            screenName: x.screenName,
            postsLast24h: x.postsLast24h,
            connectedAt: x.accessTokenEnc ? x.updatedAt.toISOString() : null,
          }
        : { configured: false as const, connected: false as const };
      return {
        listingId: l.id,
        title: l.title,
        listingStatus: l.status,
        createdAt: l.createdAt.toISOString(),
        x: status,
      };
    });
  }

  /** Compose + post the launch-announcement tweet for a freshly
   *  minted token. Uses the listing's own X app credentials end to
   *  end. Returns the same shape the FE pill expects. */
  async postLaunchTweet(
    listingId: string,
    input: {
      symbol: string;
      name?: string | null;
      tokenAddress: string;
      url: string;
      agentName?: string | null;
    },
  ): Promise<
    | { posted: true; id: string; screenName: string; text: string }
    | {
        posted: false;
        reason: 'not_configured' | 'not_connected' | 'cap_reached' | 'reauth' | 'failed';
        detail?: string;
      }
  > {
    const row = await this.prisma.agentXConnection.findUnique({ where: { listingId } });
    if (!row) return { posted: false, reason: 'not_configured' };
    if (!row.accessTokenEnc) return { posted: false, reason: 'not_connected' };

    const text = composeLaunchTweet(input);
    try {
      const out = await this.postTweet(listingId, text);
      return { posted: true, id: out.id, screenName: row.screenName ?? 'unknown', text: out.text };
    } catch (err) {
      const msg = (err as Error)?.message ?? '';
      if (err instanceof ForbiddenException) {
        if (/cap reached/i.test(msg)) {
          return { posted: false, reason: 'cap_reached', detail: msg };
        }
        return { posted: false, reason: 'reauth', detail: msg };
      }
      this.logger.warn(`agent-x post failed for listing=${listingId}: ${msg}`);
      return { posted: false, reason: 'failed', detail: msg };
    }
  }

  // ─── Internals ────────────────────────────────────────────────────

  private async postTweet(listingId: string, text: string): Promise<{ id: string; text: string }> {
    const trimmed = (text ?? '').trim();
    if (!trimmed) throw new BadRequestException('empty tweet');
    if (trimmed.length > 280) throw new BadRequestException('tweet over 280 chars');

    const row = await this.prisma.agentXConnection.findUnique({ where: { listingId } });
    if (!row || !row.accessTokenEnc) {
      throw new NotFoundException('Agent X not connected');
    }

    const now = new Date();
    const inFreshWindow = now.getTime() - row.postsWindowStart.getTime() >= 24 * 60 * 60 * 1000;
    if (!inFreshWindow && row.postsLast24h >= AgentXService.DAILY_POST_CAP) {
      throw new ForbiddenException(
        `daily X post cap reached (${AgentXService.DAILY_POST_CAP}/24h)`,
      );
    }

    const accessToken = await this.ensureFreshAccessToken(listingId);

    let res;
    try {
      res = await axios.post(
        AgentXService.TWEETS_URL,
        { text: trimmed },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        },
      );
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status ?? 500;
      const data = (err as { response?: { data?: unknown } }).response?.data as
        | { detail?: string; title?: string; errors?: Array<{ message?: string }> }
        | undefined;
      const xMessage =
        data?.detail ||
        data?.title ||
        data?.errors?.[0]?.message ||
        (typeof data === 'string' ? data : '') ||
        `http_${status}`;
      this.logger.warn(`agent-x tweet failed (${status}): ${JSON.stringify(data)}`);
      if (status === 401) throw new ForbiddenException('X token rejected, please reconnect');
      if (status === 403) throw new HttpException(`X refused tweet (403): ${xMessage}`, 403);
      if (status === 429) throw new HttpException(`X rate-limited (429): ${xMessage}`, 429);
      throw new HttpException(
        `X API ${status}: ${xMessage}`,
        status >= 400 && status < 600 ? status : 502,
      );
    }

    await this.prisma.agentXConnection.update({
      where: { listingId },
      data: inFreshWindow
        ? { postsLast24h: 1, postsWindowStart: now }
        : { postsLast24h: { increment: 1 } },
    });
    const out = res.data?.data ?? {};
    return { id: String(out.id ?? ''), text: String(out.text ?? trimmed) };
  }

  private async ensureFreshAccessToken(listingId: string): Promise<string> {
    const row = await this.prisma.agentXConnection.findUnique({ where: { listingId } });
    if (!row || !row.accessTokenEnc || !row.expiresAt) {
      throw new NotFoundException('Agent X not connected');
    }
    const fresh = row.expiresAt.getTime() - Date.now() > AgentXService.REFRESH_BUFFER_MS;
    if (fresh) {
      const tok = decryptToken(row.accessTokenEnc);
      if (tok) return tok;
    }
    const refreshTok = decryptToken(row.refreshTokenEnc);
    const clientId = decryptToken(row.clientIdEnc);
    const clientSecret = decryptToken(row.clientSecretEnc);
    if (!refreshTok || !clientId || !clientSecret) {
      throw new ForbiddenException('refresh token missing, please reconnect');
    }
    const fresh2 = await this.refreshTokens(clientId, clientSecret, refreshTok);
    await this.prisma.agentXConnection.update({
      where: { listingId },
      data: {
        accessTokenEnc: encryptToken(fresh2.access_token),
        refreshTokenEnc: encryptToken(fresh2.refresh_token ?? refreshTok),
        expiresAt: new Date(Date.now() + fresh2.expires_in * 1000),
        scopes: fresh2.scope ?? row.scopes,
      },
    });
    return fresh2.access_token;
  }

  private async exchangeCode(
    clientId: string,
    clientSecret: string,
    code: string,
    verifier: string,
  ) {
    const redirectUri = this.requireRedirectUri();
    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await axios.post<TokenResponse>(
      AgentXService.OAUTH_TOKEN_URL,
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        timeout: 8000,
      },
    );
    return res.data;
  }

  private async refreshTokens(clientId: string, clientSecret: string, refreshToken: string) {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: clientId,
    });
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await axios.post<TokenResponse>(
      AgentXService.OAUTH_TOKEN_URL,
      body.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        timeout: 8000,
      },
    );
    return res.data;
  }

  private async fetchMe(accessToken: string): Promise<{ id: string; username: string }> {
    const res = await axios.get<{ data: { id: string; username: string } }>(
      AgentXService.USERS_ME_URL,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 6000,
      },
    );
    return { id: res.data.data.id, username: res.data.data.username };
  }

  private requireRedirectUri(): string {
    const v = process.env.X_AGENT_REDIRECT_URI || process.env.X_REDIRECT_URI;
    if (!v) throw new Error('X_AGENT_REDIRECT_URI (or X_REDIRECT_URI) is not configured');
    return v;
  }

  private stateKey(state: string): string {
    return `agent-x:oauth:state:${state}`;
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
