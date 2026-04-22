'use client';

import { Interface, parseUnits } from 'ethers';

// Minimal ERC-20 Transfer ABI fragment — just enough to encode the
// single call we need from the repo / listing purchase flow.
const ERC20_TRANSFER_IFACE = new Interface([
  'function transfer(address to, uint256 amount) returns (bool)',
]);

export interface BoltyTokenConfig {
  /** ERC-20 contract address on Base (0x…). */
  address: string;
  /** USD price per 1 BOLTY — used to convert USD listing prices to token units. */
  usdPrice: number;
  /** Token decimals. Defaults to 18 if unset (most ERC-20s on Base). */
  decimals?: number;
}

/**
 * Read BOLTY token config from NEXT_PUBLIC_* env vars. Returns null when
 * the token isn't launched yet — callers should fall back to ETH in
 * that case. Safe to call on the server (env is inlined by Next).
 */
export function getBoltyTokenConfig(): BoltyTokenConfig | null {
  const address = process.env.NEXT_PUBLIC_BOLTY_TOKEN_CONTRACT;
  const usdPriceRaw = process.env.NEXT_PUBLIC_BOLTY_USD_PRICE;
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) return null;
  const usdPrice = usdPriceRaw ? Number(usdPriceRaw) : NaN;
  if (!Number.isFinite(usdPrice) || usdPrice <= 0) return null;
  const decimalsRaw = process.env.NEXT_PUBLIC_BOLTY_TOKEN_DECIMALS;
  const decimals = decimalsRaw ? Number(decimalsRaw) : 18;
  return {
    address,
    usdPrice,
    decimals: Number.isFinite(decimals) && decimals > 0 ? decimals : 18,
  };
}

/**
 * Compute the token amount in base units for a given USD price.
 * `usd / usdPrice` tokens, rounded up in the last base unit so the
 * seller never receives fractionally less than quoted due to rounding.
 */
export function usdToTokenUnits(usd: number, cfg: BoltyTokenConfig): bigint {
  if (!Number.isFinite(usd) || usd <= 0) {
    throw new Error('Invalid USD amount');
  }
  const tokens = usd / cfg.usdPrice;
  // Represent tokens with 12 digits of precision before parseUnits to
  // avoid losing fractional pennies in the conversion.
  const asString = tokens.toFixed(12);
  return parseUnits(asString, cfg.decimals ?? 18);
}

/** Encode `transfer(to, amount)` calldata for eth_sendTransaction. */
export function encodeErc20Transfer(to: string, amount: bigint): string {
  return ERC20_TRANSFER_IFACE.encodeFunctionData('transfer', [to, amount]);
}
