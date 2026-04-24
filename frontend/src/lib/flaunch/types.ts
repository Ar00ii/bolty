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
  websiteUrl: string;
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

export interface TokenInfo {
  listingId: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  flaunchUrl: string;
  /** Current spot price in ETH (per 1 token). */
  priceEth: number;
  marketCapEth: number;
  volume24hEth: number;
  holders: number;
  launchedAt: string;
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
