/**
 * Types for the Flaunch launchpad integration.
 *
 * This module is the single boundary between the app UI and the
 * Flaunch protocol. During Phase 1 the implementation in client.ts
 * is stubbed — the types here stay identical in Phase 2 when we
 * swap in @flaunch/sdk + viem. Callers import types from here, not
 * from the SDK directly, so nothing else in the app has to change.
 */

export interface LaunchInput {
  listingId: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string | null;
  /** Optional wide banner data URL picked by the user in the wizard.
   *  Uploaded to Pinata separately and shown as the carousel hero
   *  background on the launchpad. */
  bannerDataUrl: string | null;
  websiteUrl: string;
  /** Path to the listing so the launchpad can infer type + link back. */
  listingPath: string;
  /** Attribution for the launchpad grid (auth'd user at launch time). */
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  /** 0-100 percent going to the creator; remainder goes to the
   *  community treasury (buybacks / airdrops). Immutable after launch. */
  creatorSharePercent: number;
  /** Optional premine paid in ETH, as a human-readable string. */
  premineEth: string;
}

export interface LaunchResult {
  tokenAddress: string;
  txHash: string;
  flaunchUrl: string;
  launchedAt: string;
}

export interface TokenSocials {
  websiteUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  telegramUrl: string | null;
  discordUrl: string | null;
}

export interface TokenInfo {
  listingId: string;
  /** Path back to the listing (/market/agents/… or /market/repos/…). */
  listingPath: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  /** Wide banner (creator-provided or null). Uploaded to Pinata at
   *  launch and used as the FeaturedCarousel hero background. */
  bannerUrl: string | null;
  flaunchUrl: string;
  /** Current spot price in ETH (per 1 token). */
  priceEth: number;
  /** Current spot price in USD (per 1 token). Primary display value —
   *  microcaps land at numbers like 0.0₂₈39 which are unreadable in ETH. */
  priceUsd: number;
  /** Percentage change in price over last 24h, signed (-100 .. +∞). */
  priceChange24hPercent: number;
  marketCapEth: number;
  /** Market cap in USD — primary display value for the launchpad UI. */
  marketCapUsd: number;
  volume24hEth: number;
  holders: number;
  /** 7 daily points for a mini sparkline (newest last, all >= 0). */
  sparkline7d: number[];
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  /** Pinned IPFS metadata description — what the creator wrote in the
   *  wizard. Null when launched outside the wizard or pin is missing. */
  description: string | null;
  launchedAt: string;
  /** Creator-editable social links. Omitted / undefined when never set;
   *  the launchpad's read boundary fills a normalized object via
   *  `applyOverrides` so UI can rely on `t.socials?.githubUrl` etc. */
  socials?: TokenSocials;
}

export interface TokenOverrides {
  imageUrl?: string | null;
  bannerUrl?: string | null;
  socials?: Partial<TokenSocials>;
}

export interface BuyInput {
  tokenAddress: string;
  /** ETH to spend, as a human-readable string (e.g. "0.05"). */
  ethAmount: string;
  slippagePercent: number;
}

export interface SellInput {
  tokenAddress: string;
  /** Token amount to sell, as a human-readable string. */
  tokenAmount: string;
  slippagePercent: number;
}

export interface TradeResult {
  txHash: string;
  /** Human-readable amount received. */
  received: string;
  receivedSymbol: string;
}
