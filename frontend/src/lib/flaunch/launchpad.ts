/**
 * Launchpad client.
 *
 * Single boundary between the launchpad UI and Flaunch. Every
 * function decides at call time:
 *   - If FLAUNCH_REVENUE_MANAGER env var is set  → call real SDK
 *   - Otherwise                                  → fall back to stub
 *
 * The stub path is how /launchpad renders nicely in local dev
 * without a wallet / contract. The real path does on-chain work
 * against our deployed RevenueManager.
 *
 * No UI file needs to know which path is active — TokenInfo shape
 * stays identical. Wallet prompts surface via the SDK's own flow
 * when the real path runs.
 */

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { parseEther } from 'viem';

import { getPublicClient, getReadSdk, getReadWriteSdk } from './client';
import { FLAUNCH_REVENUE_MANAGER, isRevenueManagerConfigured } from './config';
import type {
  BuyInput,
  LaunchInput,
  LaunchResult,
  SellInput,
  TokenInfo,
  TradeResult,
} from './types';

// ── Persistence (both paths use it) ───────────────────────────────────
//
// The stub uses this as its source of truth.
// The real path uses a lightweight mapping { listingId → coinAddress }
// cached here at launch time so getTokenForListing(listingId) can go
// straight to a single on-chain read instead of scanning the whole
// RevenueManager. Scanning still works as a fallback via listLaunchedTokens.

const STORE_KEY = 'flaunch:launchpad:stubbed-tokens';
const MAP_KEY = 'flaunch:launchpad:listing-to-coin';

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

interface ListingMap {
  [listingId: string]: {
    coinAddress: string;
    listingPath: string;
    creatorUsername: string | null;
    creatorAvatarUrl: string | null;
    launchedAt: string;
  };
}

function readMap(): ListingMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || '{}') as ListingMap;
  } catch {
    return {};
  }
}

function writeMap(m: ListingMap) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MAP_KEY, JSON.stringify(m));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function fakeHex(seed: string, len: number): string {
  let hex = '';
  for (let i = 0; i < seed.length && hex.length < len; i++) {
    hex += seed.charCodeAt(i).toString(16).padStart(2, '0');
  }
  while (hex.length < len) hex += 'a';
  return '0x' + hex.slice(0, len);
}

function stubSparkline(seed: string, days = 7): number[] {
  const out: number[] = [];
  let v = 40;
  for (let i = 0; i < days; i++) {
    const n = (seed.charCodeAt((i + 3) % seed.length) % 17) - 8;
    v = Math.max(1, v + n);
    out.push(v);
  }
  return out;
}

function stubPriceChange(seed: string): number {
  const c = seed.charCodeAt(0) + seed.charCodeAt(seed.length - 1);
  return ((c % 61) - 20) / 2;
}

// ── Image → base64 ────────────────────────────────────────────────────
//
// Flaunch's IPFS metadata path expects `base64Image` (raw base64, no
// data: prefix). The web2 API rejects images under a minimum size —
// our previous 16×16 placeholder hit that and produced a 400.
//
// Strategy now:
//   1. If the listing has an image URL and we can fetch it (CORS-ok),
//      use that.
//   2. Otherwise generate a 512×512 branded PNG on a canvas with a
//      purple→cyan gradient + the token ticker drawn large. Big
//      enough to pass Flaunch's validation; branded enough to look
//      intentional, not a default.

async function renderTickerImage(symbol: string): Promise<string> {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Brand gradient background (same #836EF9 → #06B6D4 used elsewhere)
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#1a1028');
  grad.addColorStop(0.5, '#836EF9');
  grad.addColorStop(1, '#06B6D4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle corner glow
  const glow = ctx.createRadialGradient(128, 128, 20, 128, 128, 320);
  glow.addColorStop(0, 'rgba(255,255,255,0.25)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);

  // Ticker text — auto-shrink for long symbols so it always fits
  const up = (symbol || 'TOKEN').toUpperCase().slice(0, 8);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = up.length <= 4 ? 220 : up.length <= 6 ? 160 : 120;
  ctx.font = `700 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillText(`$${up}`, 256, 256);

  // "bolty.network" micro-mark bottom
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `500 18px ui-monospace, monospace`;
  ctx.fillText('bolty.network · launchpad', 256, 478);

  // JPEG at 90% quality — the Flaunch upload API has been flaky on
  // our PNG output. JPEG is universally accepted by image parsers and
  // the file lands smaller (~40KB vs ~120KB), which also sidesteps any
  // payload-size limits on the upload endpoint.
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return dataUrl.split(',')[1] ?? '';
}

async function imageUrlToBase64(url: string | null, symbol: string): Promise<string> {
  if (typeof window === 'undefined') return renderTickerImage(symbol);
  if (url) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = String(reader.result || '');
            resolve(result.split(',')[1] || '');
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });
        if (b64.length > 2000) return b64; // sanity: reject tiny images
      }
    } catch {
      /* fall through to canvas */
    }
  }
  return renderTickerImage(symbol);
}

// ── Real-path helpers ─────────────────────────────────────────────────

/** Parse a listing URL stored in token metadata back into /market/…/id. */
function parseListingPath(websiteUrl: string | undefined | null): string | null {
  if (!websiteUrl) return null;
  try {
    const u = new URL(websiteUrl);
    const m = u.pathname.match(/\/market\/(agents|repos)\/([a-zA-Z0-9_-]+)/);
    return m ? m[0] : null;
  } catch {
    return null;
  }
}

function extractListingId(listingPath: string | null): string | null {
  if (!listingPath) return null;
  const m = listingPath.match(/\/market\/(?:agents|repos)\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

/** Hydrate a coin address into our TokenInfo shape with live on-chain data. */
async function hydrateCoin(
  coinAddress: string,
  fallback: {
    listingId: string;
    listingPath: string;
    launchedAt: string;
    creatorUsername: string | null;
    creatorAvatarUrl: string | null;
  },
): Promise<TokenInfo | null> {
  const sdk = getReadSdk() as any;
  try {
    const [metaRes, infoRes, priceEthRes, mcapRes] = await Promise.allSettled([
      sdk.getCoinMetadata(coinAddress),
      sdk.getCoinInfo(coinAddress),
      sdk.coinPriceInETH(coinAddress),
      sdk.coinMarketCapInUSD({ coinAddress }),
    ]);

    const meta: any = metaRes.status === 'fulfilled' ? metaRes.value : {};
    const info: any = infoRes.status === 'fulfilled' ? infoRes.value : {};
    const priceEthStr: string =
      priceEthRes.status === 'fulfilled' ? String(priceEthRes.value ?? '0') : '0';
    // SDK returns price in ETH as an 18-decimal integer string; convert to float.
    const priceEth = Number(priceEthStr) / 1e18 || 0;
    const mcapUsdStr: string = mcapRes.status === 'fulfilled' ? String(mcapRes.value ?? '0') : '0';
    const mcapUsd = Number(mcapUsdStr) || 0;
    // Approximate mcap in ETH with a rough $3000/ETH fallback. The subgraph
    // would give us a denominated value; this keeps the UI populated until
    // we wire a price oracle.
    const marketCapEth = mcapUsd / 3000;

    return {
      listingId: fallback.listingId,
      listingPath: fallback.listingPath,
      tokenAddress: coinAddress,
      name: meta?.name ?? 'Unknown',
      symbol: meta?.symbol ?? '???',
      imageUrl: meta?.image ?? null,
      flaunchUrl: `https://flaunch.gg/base/coin/${coinAddress}`,
      priceEth,
      priceChange24hPercent: 0,
      marketCapEth,
      volume24hEth: 0,
      holders: Number(info?.holders ?? 0),
      sparkline7d: [],
      creatorUsername: fallback.creatorUsername,
      creatorAvatarUrl: fallback.creatorAvatarUrl,
      launchedAt: fallback.launchedAt,
    };
  } catch {
    return null;
  }
}

// ── launchToken ───────────────────────────────────────────────────────

async function realLaunchToken(input: LaunchInput): Promise<LaunchResult> {
  const { sdk, account } = await getReadWriteSdk();
  // Symbol (normalised below) is used as the canvas fallback's label.
  const symbolForImage = input.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'TOKEN';
  const base64Image = await imageUrlToBase64(input.imageUrl, symbolForImage);

  // Symbol normalisation — SDK rejects anything outside [A-Z0-9].
  const symbol = input.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'TOKEN';
  const name = input.name.slice(0, 32) || symbol;

  const sdkAny = sdk as unknown as {
    flaunchIPFSWithRevenueManager: (p: any) => Promise<`0x${string}`>;
    getPoolCreatedFromTx: (hash: `0x${string}`) => Promise<any>;
  };

  let txHash: `0x${string}`;
  try {
    txHash = await sdkAny.flaunchIPFSWithRevenueManager({
      name,
      symbol,
      fairLaunchPercent: 0,
      fairLaunchDuration: 30 * 60,
      initialMarketCapUSD: 20_000,
      creator: account,
      creatorFeeAllocationPercent: Math.max(0, Math.min(100, input.creatorSharePercent)),
      revenueManagerInstanceAddress: FLAUNCH_REVENUE_MANAGER,
      metadata: {
        base64Image,
        description: input.description,
        websiteUrl: input.websiteUrl,
      },
    });
  } catch (err) {
    // Surface full details so we can actually debug Flaunch API rejections.
    // The SDK re-throws axios errors with a message like "Failed to upload
    // image to Flaunch API: <reason>". Dump the underlying response to the
    // console so the network reason shows up in devtools.
    // eslint-disable-next-line no-console
    console.error('[flaunch] launch failed', {
      error: err,
      imageBytesBase64: base64Image.length,
      imageFirstBytes: base64Image.slice(0, 24),
      symbol,
      name,
      revenueManager: FLAUNCH_REVENUE_MANAGER,
    });
    throw err;
  }

  // Wait for on-chain confirmation before reading the coin address.
  const publicClient = getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  let coinAddress: string = '';
  try {
    const resolved: any = await sdkAny.getPoolCreatedFromTx(txHash);
    coinAddress =
      resolved?.coinAddress ??
      resolved?.address ??
      resolved?.flaunch ??
      resolved?.pool?.coinAddress ??
      '';
  } catch {
    /* best-effort — transaction succeeded but we can't parse the address */
  }

  // Cache the mapping so getTokenForListing(listingId) can resolve
  // without scanning the whole RevenueManager.
  if (coinAddress) {
    const map = readMap();
    map[input.listingId] = {
      coinAddress,
      listingPath: input.listingPath,
      creatorUsername: input.creatorUsername,
      creatorAvatarUrl: input.creatorAvatarUrl,
      launchedAt: new Date().toISOString(),
    };
    writeMap(map);
  }

  return {
    tokenAddress: coinAddress || txHash,
    txHash,
    flaunchUrl: coinAddress
      ? `https://flaunch.gg/base/coin/${coinAddress}`
      : `https://basescan.org/tx/${txHash}`,
    launchedAt: new Date().toISOString(),
  };
}

async function stubLaunchToken(input: LaunchInput): Promise<LaunchResult> {
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

export async function launchToken(input: LaunchInput): Promise<LaunchResult> {
  return isRevenueManagerConfigured() ? realLaunchToken(input) : stubLaunchToken(input);
}

// ── getTokenForListing ────────────────────────────────────────────────

async function realGetTokenForListing(listingId: string): Promise<TokenInfo | null> {
  const entry = readMap()[listingId];
  if (!entry) return null;
  return hydrateCoin(entry.coinAddress, {
    listingId,
    listingPath: entry.listingPath,
    launchedAt: entry.launchedAt,
    creatorUsername: entry.creatorUsername,
    creatorAvatarUrl: entry.creatorAvatarUrl,
  });
}

export async function getTokenForListing(listingId: string): Promise<TokenInfo | null> {
  if (isRevenueManagerConfigured()) return realGetTokenForListing(listingId);
  await sleep(60);
  return readStore()[listingId] ?? null;
}

// ── listLaunchedTokens ────────────────────────────────────────────────

async function realListLaunchedTokens(): Promise<TokenInfo[]> {
  const sdk = getReadSdk() as unknown as {
    revenueManagerAllTokensInManager: (p: {
      revenueManagerAddress: string;
      sortByDesc?: boolean;
    }) => Promise<Array<{ flaunch: `0x${string}`; tokenId: bigint }>>;
    getCoinMetadataFromTokenIds: (items: Array<{ flaunch: `0x${string}`; tokenId: bigint }>) => Promise<any[]>;
  };
  try {
    const raw = await sdk.revenueManagerAllTokensInManager({
      revenueManagerAddress: FLAUNCH_REVENUE_MANAGER as string,
      sortByDesc: true,
    });
    if (!raw?.length) return [];

    const metas = await sdk.getCoinMetadataFromTokenIds(raw);
    const map = readMap();

    // Build a list merging on-chain metadata with our local mapping for
    // creator attribution + listingPath fallback.
    const tokens: TokenInfo[] = [];
    for (let i = 0; i < metas.length; i++) {
      const meta: any = metas[i];
      const coinAddress: string = meta?.coinAddress ?? meta?.address ?? '';
      if (!coinAddress) continue;

      // Prefer the explicit listing URL baked into metadata when we launched.
      const websiteUrl: string | undefined = meta?.external_link ?? meta?.website_url;
      const pathFromMeta = parseListingPath(websiteUrl);
      const listingId = extractListingId(pathFromMeta);
      const cached = listingId ? map[listingId] : undefined;

      tokens.push({
        listingId: listingId ?? coinAddress,
        listingPath: pathFromMeta ?? cached?.listingPath ?? '/launchpad',
        tokenAddress: coinAddress,
        name: meta?.name ?? 'Unknown',
        symbol: meta?.symbol ?? '???',
        imageUrl: meta?.image ?? null,
        flaunchUrl: `https://flaunch.gg/base/coin/${coinAddress}`,
        priceEth: 0,
        priceChange24hPercent: 0,
        marketCapEth: 0,
        volume24hEth: 0,
        holders: 0,
        sparkline7d: [],
        creatorUsername: cached?.creatorUsername ?? null,
        creatorAvatarUrl: cached?.creatorAvatarUrl ?? null,
        launchedAt: cached?.launchedAt ?? new Date().toISOString(),
      });
    }
    return tokens;
  } catch {
    return [];
  }
}

export async function listLaunchedTokens(): Promise<TokenInfo[]> {
  if (isRevenueManagerConfigured()) return realListLaunchedTokens();

  // Stub path
  await sleep(80);
  const now = Date.now();
  return Object.values(readStore())
    .map((t) => {
      const ageSec = (now - new Date(t.launchedAt).getTime()) / 1000;
      if (ageSec < 60) return t;
      return {
        ...t,
        sparkline7d: t.sparkline7d?.length ? t.sparkline7d : stubSparkline(t.tokenAddress),
        priceChange24hPercent: t.priceChange24hPercent || stubPriceChange(t.tokenAddress),
        volume24hEth: t.volume24hEth || Number((Math.random() * 3).toFixed(3)),
        holders: t.holders > 1 ? t.holders : 2 + Math.floor(Math.random() * 40),
      };
    })
    .sort((a, b) => new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime());
}

// ── buy / sell ────────────────────────────────────────────────────────

async function realBuy(input: BuyInput): Promise<TradeResult> {
  const { sdk } = await getReadWriteSdk();
  const amountIn = parseEther((input.ethAmount || '0') as `${number}`);
  const txHash = await (sdk as any).buyCoin({
    coinAddress: input.tokenAddress,
    slippagePercent: input.slippagePercent,
    swapType: 'EXACT_IN',
    amountIn,
  });
  return { txHash, received: input.ethAmount, receivedSymbol: 'tokens' };
}

async function realSell(input: SellInput): Promise<TradeResult> {
  const { sdk } = await getReadWriteSdk();
  // SDK expects token amount as a bigint with 18 decimals.
  const tokens = Number(input.tokenAmount || '0');
  const amountIn = BigInt(Math.floor(tokens * 1e18));
  const txHash = await (sdk as any).sellCoin({
    coinAddress: input.tokenAddress,
    amountIn,
    slippagePercent: input.slippagePercent,
  });
  return { txHash, received: input.tokenAmount, receivedSymbol: 'ETH' };
}

export async function buyLaunchpadToken(input: BuyInput): Promise<TradeResult> {
  if (isRevenueManagerConfigured()) return realBuy(input);
  await sleep(1400);
  const eth = Number(input.ethAmount) || 0;
  const tokens = eth / 0.00000012;
  return {
    txHash: fakeHex(input.tokenAddress + ':buy:' + Date.now(), 64),
    received: tokens.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    receivedSymbol: 'tokens',
  };
}

export async function sellLaunchpadToken(input: SellInput): Promise<TradeResult> {
  if (isRevenueManagerConfigured()) return realSell(input);
  await sleep(1400);
  const tokens = Number(input.tokenAmount) || 0;
  const eth = tokens * 0.00000012;
  return {
    txHash: fakeHex(input.tokenAddress + ':sell:' + Date.now(), 64),
    received: eth.toFixed(6),
    receivedSymbol: 'ETH',
  };
}

/** Dev-only: wipe stubbed state. No-op in real mode. */
export function _resetStubbedState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(MAP_KEY);
}
