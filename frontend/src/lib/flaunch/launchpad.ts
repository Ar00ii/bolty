/**
 * Launchpad client — Phase 1 (stubbed).
 *
 * Sibling to client.ts (which wires the real @flaunch/sdk for the
 * /bolty swap widget). This module is the single boundary between
 * the launchpad UI and Flaunch's SDK. Phase 2 replaces each
 * implementation with the corresponding SDK call
 * (`flaunchIPFSWithRevenueManager`, `buyCoin`, `sellCoin`); the
 * exported signatures stay identical so no UI file changes.
 *
 * Phase 1 behavior:
 *  - Every call sleeps a realistic amount then returns fake data
 *  - Launched tokens persist to localStorage so refreshes still
 *    render the post-launch widget — makes UX dogfooding easy
 *  - No wallet interaction; the wizard simulates the "sign" step
 */

import type {
  BuyInput,
  LaunchInput,
  LaunchResult,
  SellInput,
  TokenInfo,
  TradeResult,
} from './types';

const STORE_KEY = 'flaunch:launchpad:stubbed-tokens';

function readStore(): Record<string, TokenInfo> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}') as Record<string, TokenInfo>;
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, TokenInfo>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function fakeHex(seed: string, len: number): string {
  let hex = '';
  for (let i = 0; i < seed.length && hex.length < len; i++) {
    hex += seed.charCodeAt(i).toString(16).padStart(2, '0');
  }
  while (hex.length < len) hex += 'a';
  return '0x' + hex.slice(0, len);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Build a plausible-looking sparkline seeded by the listingId so
// reloads render the same shape. Values are relative price levels,
// not absolute — the card normalizes min/max.
function stubSparkline(seed: string, days = 7): number[] {
  const out: number[] = [];
  let v = 40;
  for (let i = 0; i < days; i++) {
    const n = (seed.charCodeAt((i + 3) % seed.length) % 17) - 8; // −8..+8
    v = Math.max(1, v + n);
    out.push(v);
  }
  return out;
}

function stubPriceChange(seed: string): number {
  // Deterministic pseudo-random, skewed slightly positive (fresh memecoins).
  const c = seed.charCodeAt(0) + seed.charCodeAt(seed.length - 1);
  return ((c % 61) - 20) / 2; // −10% .. +20%
}

export async function launchToken(input: LaunchInput): Promise<LaunchResult> {
  // Simulate wallet signing + on-chain confirmation on Base
  await sleep(2200);
  const tokenAddress = fakeHex(input.listingId + ':token', 40);
  const token: TokenInfo = {
    listingId: input.listingId,
    listingPath: input.listingPath,
    tokenAddress,
    name: input.name,
    symbol: input.symbol,
    imageUrl: input.imageUrl,
    flaunchUrl: `https://flaunch.gg/base/coin/${tokenAddress}`,
    priceEth: 0.00000012,
    priceChange24hPercent: 0,
    marketCapEth: 1.2,
    volume24hEth: 0,
    holders: 1,
    sparkline7d: [0, 0, 0, 0, 0, 0, 1],
    creatorUsername: input.creatorUsername,
    creatorAvatarUrl: input.creatorAvatarUrl,
    launchedAt: new Date().toISOString(),
  };
  const store = readStore();
  store[input.listingId] = token;
  writeStore(store);
  return {
    tokenAddress,
    txHash: fakeHex(input.listingId + ':launchtx', 64),
    flaunchUrl: token.flaunchUrl,
    launchedAt: token.launchedAt,
  };
}

export async function getTokenForListing(listingId: string): Promise<TokenInfo | null> {
  await sleep(60);
  return readStore()[listingId] ?? null;
}

export async function listLaunchedTokens(): Promise<TokenInfo[]> {
  await sleep(80);
  // Synthesize plausible activity for tokens that have been live >60s so
  // the grid doesn't look dead. Phase 2 pulls these numbers from the
  // Flaunch subgraph and this block evaporates.
  const now = Date.now();
  return Object.values(readStore())
    .map((t) => {
      const ageSec = (now - new Date(t.launchedAt).getTime()) / 1000;
      if (ageSec < 60) return t;
      return {
        ...t,
        sparkline7d: t.sparkline7d?.length ? t.sparkline7d : stubSparkline(t.tokenAddress),
        priceChange24hPercent:
          t.priceChange24hPercent || stubPriceChange(t.tokenAddress),
        volume24hEth: t.volume24hEth || Number((Math.random() * 3).toFixed(3)),
        holders: t.holders > 1 ? t.holders : 2 + Math.floor(Math.random() * 40),
      };
    })
    .sort((a, b) => new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime());
}

export async function buyLaunchpadToken(input: BuyInput): Promise<TradeResult> {
  await sleep(1400);
  const eth = Number(input.ethAmount) || 0;
  // arbitrary fake curve — real curve comes from the v4 pool in Phase 2
  const tokens = eth / 0.00000012;
  return {
    txHash: fakeHex(input.tokenAddress + ':buy:' + Date.now(), 64),
    received: tokens.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    receivedSymbol: 'tokens',
  };
}

export async function sellLaunchpadToken(input: SellInput): Promise<TradeResult> {
  await sleep(1400);
  const tokens = Number(input.tokenAmount) || 0;
  const eth = tokens * 0.00000012;
  return {
    txHash: fakeHex(input.tokenAddress + ':sell:' + Date.now(), 64),
    received: eth.toFixed(6),
    receivedSymbol: 'ETH',
  };
}

/** Dev-only: wipe stubbed state. No-op in Phase 2. */
export function _resetStubbedState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORE_KEY);
}
