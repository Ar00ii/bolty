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
import { FLAUNCH_REVENUE_MANAGER, isRevenueManagerConfigured, PINATA_JWT } from './config';
import { LAUNCH_INITIAL_MARKET_CAP_USD } from './feature';
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
    bannerUrl: string | null;
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

  // JPEG at 90% quality — JPEG is universally accepted by image
  // parsers and the file lands smaller. Return the FULL data: URL
  // so the SDK can detect mime type (image/jpeg) and pass the right
  // Content-Type when pinning to Pinata. The SDK strips the prefix
  // internally before atob().
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Returns a data URL (data:image/...;base64,xxx) — Pinata path in the
 * SDK uses the prefix to detect mime type for Content-Type. Stripping
 * it (as we did before) caused images to upload as image/png even
 * when they were JPEG, which can break flaunch.gg's metadata reader.
 */
async function imageUrlToBase64(url: string | null, symbol: string): Promise<string> {
  if (typeof window === 'undefined') return renderTickerImage(symbol);
  if (url) {
    if (url.startsWith('data:')) return url; // already a data URL, perfect
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });
        if (dataUrl && dataUrl.length > 500) return dataUrl;
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

/**
 * Fallback: read ERC20 name + symbol directly from the coin contract.
 * Flaunch coins are standard ERC20s, so when the IPFS metadata gateway
 * is slow / down / truncating (we've seen getCoinMetadata return empty
 * objects in the wild), this keeps our UI from rendering "Unknown".
 */
async function readErc20NameSymbol(
  coinAddress: string,
): Promise<{ name: string | null; symbol: string | null }> {
  try {
    const publicClient = getPublicClient();
    const abi = [
      { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
      { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    ] as const;
    const [nameRes, symbolRes] = await Promise.allSettled([
      publicClient.readContract({ address: coinAddress as `0x${string}`, abi, functionName: 'name' }),
      publicClient.readContract({ address: coinAddress as `0x${string}`, abi, functionName: 'symbol' }),
    ]);
    return {
      name: nameRes.status === 'fulfilled' ? String(nameRes.value || '') || null : null,
      symbol: symbolRes.status === 'fulfilled' ? String(symbolRes.value || '') || null : null,
    };
  } catch {
    return { name: null, symbol: null };
  }
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
    bannerUrl: string | null;
  },
): Promise<TokenInfo | null> {
  const sdk = getReadSdk() as any;
  try {
    const [metaRes, infoRes, priceEthRes, priceUsdRes, mcapRes] = await Promise.allSettled([
      sdk.getCoinMetadata(coinAddress),
      sdk.getCoinInfo(coinAddress),
      sdk.coinPriceInETH(coinAddress),
      sdk.coinPriceInUSD({ coinAddress }),
      sdk.coinMarketCapInUSD({ coinAddress }),
    ]);

    const meta: any = metaRes.status === 'fulfilled' ? metaRes.value : {};
    // Fall back to the ERC20 contract directly when IPFS metadata is
    // empty / broken. This is cheap (one multicall) and fixes the
    // "Unknown" / "$???" display that users hit on fresh launches.
    let resolvedName: string = meta?.name ?? '';
    let resolvedSymbol: string = meta?.symbol ?? '';
    if (!resolvedName || !resolvedSymbol) {
      const onChain = await readErc20NameSymbol(coinAddress);
      if (!resolvedName && onChain.name) resolvedName = onChain.name;
      if (!resolvedSymbol && onChain.symbol) resolvedSymbol = onChain.symbol;
    }
    const info: any = infoRes.status === 'fulfilled' ? infoRes.value : {};
    const priceEthStr: string =
      priceEthRes.status === 'fulfilled' ? String(priceEthRes.value ?? '0') : '0';
    // SDK returns ETH price as 18-decimal integer string; convert to float.
    const priceEth = Number(priceEthStr) / 1e18 || 0;
    const priceUsd =
      priceUsdRes.status === 'fulfilled' ? Number(priceUsdRes.value ?? 0) || 0 : 0;
    const marketCapUsd =
      mcapRes.status === 'fulfilled' ? Number(mcapRes.value ?? 0) || 0 : 0;
    // Keep marketCapEth around for any caller still on it — derive from USD
    // mcap and the SDK-reported ETH/USD ratio (priceEth / priceUsd) rather
    // than a hardcoded ETH price.
    const ethUsd = priceUsd > 0 && priceEth > 0 ? priceUsd / priceEth : 2500;
    const marketCapEth = ethUsd > 0 ? marketCapUsd / ethUsd : 0;

    return {
      listingId: fallback.listingId,
      listingPath: fallback.listingPath,
      tokenAddress: coinAddress,
      name: resolvedName || 'Unknown',
      symbol: resolvedSymbol || '???',
      imageUrl: meta?.image ?? null,
      bannerUrl: fallback.bannerUrl,
      flaunchUrl: `https://flaunch.gg/base/coin/${coinAddress}`,
      priceEth,
      priceUsd,
      priceChange24hPercent: 0,
      marketCapEth,
      marketCapUsd,
      volume24hEth: 0,
      holders: Number(info?.holders ?? 0),
      sparkline7d: [],
      description: meta?.description ?? null,
      creatorUsername: fallback.creatorUsername,
      creatorAvatarUrl: fallback.creatorAvatarUrl,
      launchedAt: fallback.launchedAt,
    };
  } catch {
    return null;
  }
}

// ── launchToken ───────────────────────────────────────────────────────

/**
 * Pin a banner image to IPFS via Pinata. Takes a data URL (from the
 * file upload in the wizard), POSTs to Pinata's pinFileToIPFS as
 * multipart/form-data, returns a gateway URL. Best-effort — callers
 * should treat a throw as "no banner" and continue.
 */
async function uploadBannerToPinata(
  dataUrl: string,
  opts: { name: string },
): Promise<string | null> {
  if (!PINATA_JWT) return null;
  // data: URL → Blob
  const [, b64 = ''] = dataUrl.split(',');
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';
  const byteStr = atob(b64);
  const bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const file = new File([blob], `${opts.name}.${mime.split('/')[1] || 'jpg'}`, {
    type: mime,
  });

  const form = new FormData();
  form.append('file', file);
  form.append(
    'pinataMetadata',
    JSON.stringify({ name: opts.name, keyvalues: { type: 'bolty-banner' } }),
  );
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Pinata upload failed: ${res.status}`);
  const data = (await res.json()) as { IpfsHash?: string };
  if (!data.IpfsHash) return null;
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}

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
      initialMarketCapUSD: LAUNCH_INITIAL_MARKET_CAP_USD,
      creator: account,
      creatorFeeAllocationPercent: Math.max(0, Math.min(100, input.creatorSharePercent)),
      revenueManagerInstanceAddress: FLAUNCH_REVENUE_MANAGER,
      // Pin directly to IPFS via Pinata when a JWT is configured.
      // The SDK only falls back to Flaunch's web2 upload API when
      // pinataConfig is undefined — which has been 400'ing us.
      ...(PINATA_JWT ? { pinataConfig: { jwt: PINATA_JWT } } : {}),
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
    // SDK returns PoolCreatedEventData with .memecoin as the coin
    // address. Other fallback names cover any future shape changes.
    coinAddress =
      resolved?.memecoin ??
      resolved?.coinAddress ??
      resolved?.address ??
      resolved?.flaunch ??
      resolved?.pool?.coinAddress ??
      '';
  } catch {
    /* best-effort — transaction succeeded but we can't parse the address */
  }

  // Upload the optional banner to Pinata (separate pin from the
  // token metadata) so we can embed a full-bleed carousel hero
  // without ballooning localStorage with base64. We reuse the
  // existing Pinata JWT from config. Best-effort: if upload fails,
  // the token still launches fine without a banner.
  let bannerUrl: string | null = null;
  if (input.bannerDataUrl && PINATA_JWT) {
    try {
      bannerUrl = await uploadBannerToPinata(input.bannerDataUrl, {
        name: `${symbol}-banner`,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[flaunch] banner upload failed', err);
    }
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
      bannerUrl,
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
    bannerUrl: input.bannerDataUrl,
    flaunchUrl: `https://flaunch.gg/base/coin/${tokenAddress}`,
    priceEth: 0.00000012,
    priceUsd: 0.0000003,
    priceChange24hPercent: 0,
    marketCapEth: 1.2,
    marketCapUsd: 3000,
    volume24hEth: 0,
    holders: 1,
    sparkline7d: [0, 0, 0, 0, 0, 0, 1],
    description: input.description,
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
    bannerUrl: entry.bannerUrl,
  });
}

export async function getTokenForListing(listingId: string): Promise<TokenInfo | null> {
  if (isRevenueManagerConfigured()) return realGetTokenForListing(listingId);
  await sleep(60);
  return readStore()[listingId] ?? null;
}

/**
 * Look up a token by its on-chain coin address (used by the
 * /launchpad/[address] full-page route). In stub mode, scans the
 * stubbed store for a match. In real mode, hits the SDK's metadata
 * endpoints directly with creator info pulled from our local cache
 * if we have it.
 */
export async function getTokenByAddress(address: string): Promise<TokenInfo | null> {
  if (!address) return null;
  const lower = address.toLowerCase();

  if (isRevenueManagerConfigured()) {
    // Try to enrich with cached creator/listing info — if we launched it
    // through our wizard, we'll have the mapping. Anonymous if not.
    const map = readMap();
    const cacheEntry = Object.values(map).find(
      (m) => m.coinAddress.toLowerCase() === lower,
    );
    return hydrateCoin(address, {
      listingId: cacheEntry
        ? Object.keys(map).find((k) => map[k].coinAddress.toLowerCase() === lower) ?? address
        : address,
      listingPath: cacheEntry?.listingPath ?? '/launchpad',
      launchedAt: cacheEntry?.launchedAt ?? new Date().toISOString(),
      creatorUsername: cacheEntry?.creatorUsername ?? null,
      creatorAvatarUrl: cacheEntry?.creatorAvatarUrl ?? null,
      bannerUrl: cacheEntry?.bannerUrl ?? null,
    });
  }

  // Stub mode — scan the stubbed store
  await sleep(60);
  const found = Object.values(readStore()).find(
    (t) => t.tokenAddress.toLowerCase() === lower,
  );
  return found ?? null;
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
  const map = readMap();

  // Fallback snapshot: every coin we launched through our wizard is
  // cached locally. If the on-chain / metadata path fails, at least
  // this user's own launches still render instead of disappearing.
  const fromCache = (): TokenInfo[] =>
    Object.entries(map).map(([listingId, entry]) => ({
      listingId,
      listingPath: entry.listingPath,
      tokenAddress: entry.coinAddress,
      name: 'Loading…',
      symbol: '…',
      imageUrl: null,
      bannerUrl: entry.bannerUrl,
      flaunchUrl: `https://flaunch.gg/base/coin/${entry.coinAddress}`,
      priceEth: 0,
      priceUsd: 0,
      priceChange24hPercent: 0,
      marketCapEth: 0,
      marketCapUsd: 0,
      volume24hEth: 0,
      holders: 0,
      sparkline7d: [],
      description: null,
      creatorUsername: entry.creatorUsername,
      creatorAvatarUrl: entry.creatorAvatarUrl,
      launchedAt: entry.launchedAt,
    }));

  let raw: Array<{ flaunch: `0x${string}`; tokenId: bigint }> = [];
  try {
    raw =
      (await sdk.revenueManagerAllTokensInManager({
        revenueManagerAddress: FLAUNCH_REVENUE_MANAGER as string,
        sortByDesc: true,
      })) ?? [];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[flaunch] revenueManagerAllTokensInManager failed, falling back to cache', err);
    return fromCache();
  }
  if (!raw.length) return fromCache();

  let metas: any[] = [];
  try {
    metas = await sdk.getCoinMetadataFromTokenIds(raw);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[flaunch] getCoinMetadataFromTokenIds failed, degrading to minimal data', err);
    metas = [];
  }

  const tokens: TokenInfo[] = [];
  for (let i = 0; i < Math.max(raw.length, metas.length); i++) {
    const meta: any = metas[i] ?? {};
    const coinAddress: string = meta?.coinAddress ?? meta?.address ?? '';
    if (!coinAddress) continue;

    const websiteUrl: string | undefined = meta?.external_link ?? meta?.website_url;
    const pathFromMeta = parseListingPath(websiteUrl);
    const listingId = extractListingId(pathFromMeta);
    const cached = listingId ? map[listingId] : undefined;

    tokens.push({
      listingId: listingId ?? coinAddress,
      listingPath: pathFromMeta ?? cached?.listingPath ?? '/launchpad',
      tokenAddress: coinAddress,
      name: meta?.name || 'Unknown',
      symbol: meta?.symbol || '???',
      imageUrl: meta?.image ?? null,
      bannerUrl: cached?.bannerUrl ?? null,
      flaunchUrl: `https://flaunch.gg/base/coin/${coinAddress}`,
      priceEth: 0,
      priceUsd: 0,
      priceChange24hPercent: 0,
      marketCapEth: 0,
      marketCapUsd: 0,
      volume24hEth: 0,
      holders: 0,
      sparkline7d: [],
      description: meta?.description ?? null,
      creatorUsername: cached?.creatorUsername ?? null,
      creatorAvatarUrl: cached?.creatorAvatarUrl ?? null,
      launchedAt: cached?.launchedAt ?? new Date().toISOString(),
    });
  }

  // If on-chain gave us nothing usable, still show the local cache so
  // the user's own just-launched coin doesn't vanish on refresh.
  if (tokens.length === 0) return fromCache();
  return tokens;
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
