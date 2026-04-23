import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

import { RedisService } from '../../common/redis/redis.service';

/**
 * BOLTY token contract on Base. Deployed via Flaunch, tradable on
 * Uniswap V4 (which Flaunch is built on).
 */
export const BOLTY_CONTRACT = '0xA383e85a626171edCB2727AEcAED4Fc5e27E42a7';
export const BOLTY_CHAIN = 'base';

const CACHE_TTL_SEC = 60;
const CACHE_KEY = 'token:bolty:stats:v1';

/** Shape we expose to the frontend — curated from DexScreener pair data. */
export interface TokenStats {
  contract: string;
  chain: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  priceUsd: number | null;
  priceChange24h: number | null; // percent
  priceChange1h: number | null;
  priceChange6h: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  marketCapUsd: number | null;
  pairAddress: string | null; // for DexScreener chart embed
  pairUrl: string | null;
  dexId: string | null;
  flaunchUrl: string;
  updatedAt: string;
}

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  url: string;
  priceUsd?: string;
  priceChange?: { h1?: number; h6?: number; h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  baseToken: { address: string; name: string; symbol: string };
  info?: { imageUrl?: string };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[] | null;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly redis: RedisService) {}

  async getBoltyStats(): Promise<TokenStats> {
    const cached = await this.redis.get(CACHE_KEY).catch(() => null);
    if (cached) {
      try {
        return JSON.parse(cached) as TokenStats;
      } catch {
        /* fall through and refetch */
      }
    }

    const fresh = await this.fetchFromDexScreener().catch((err) => {
      this.logger.warn(`DexScreener fetch failed: ${(err as Error).message}`);
      return null;
    });

    const stats: TokenStats = fresh ?? this.fallback();
    await this.redis
      .set(CACHE_KEY, JSON.stringify(stats), CACHE_TTL_SEC)
      .catch(() => void 0);
    return stats;
  }

  private async fetchFromDexScreener(): Promise<TokenStats | null> {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${BOLTY_CONTRACT}`;
    const res = await axios.get<DexScreenerResponse>(url, {
      timeout: 6000,
      headers: { Accept: 'application/json' },
      validateStatus: (s) => s >= 200 && s < 300,
      maxRedirects: 0,
    });
    const pairs = (res.data?.pairs ?? []).filter((p) => p.chainId === BOLTY_CHAIN);
    if (pairs.length === 0) return null;

    // Pick the pair with the deepest liquidity — DexScreener returns
    // every pair the token trades in (v2 + v3 + v4), some of which are
    // shallow or test pools.
    pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    const p = pairs[0];

    return {
      contract: BOLTY_CONTRACT,
      chain: BOLTY_CHAIN,
      symbol: p.baseToken.symbol,
      name: p.baseToken.name,
      imageUrl: p.info?.imageUrl ?? null,
      priceUsd: p.priceUsd != null ? Number(p.priceUsd) : null,
      priceChange24h: p.priceChange?.h24 ?? null,
      priceChange1h: p.priceChange?.h1 ?? null,
      priceChange6h: p.priceChange?.h6 ?? null,
      volume24hUsd: p.volume?.h24 ?? null,
      liquidityUsd: p.liquidity?.usd ?? null,
      fdvUsd: p.fdv ?? null,
      marketCapUsd: p.marketCap ?? null,
      pairAddress: p.pairAddress,
      pairUrl: p.url,
      dexId: p.dexId,
      flaunchUrl: `https://flaunch.gg/base/coin/${BOLTY_CONTRACT}`,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Offline placeholder used when DexScreener is unreachable or the
   * pair hasn't been indexed yet. The frontend renders this shape the
   * same way — with empty stats — and surfaces a "Trade on Flaunch"
   * CTA so users can still reach the token.
   */
  private fallback(): TokenStats {
    return {
      contract: BOLTY_CONTRACT,
      chain: BOLTY_CHAIN,
      symbol: 'BOLTY',
      name: 'Bolty',
      imageUrl: null,
      priceUsd: null,
      priceChange24h: null,
      priceChange1h: null,
      priceChange6h: null,
      volume24hUsd: null,
      liquidityUsd: null,
      fdvUsd: null,
      marketCapUsd: null,
      pairAddress: null,
      pairUrl: null,
      dexId: null,
      flaunchUrl: `https://flaunch.gg/base/coin/${BOLTY_CONTRACT}`,
      updatedAt: new Date().toISOString(),
    };
  }
}
