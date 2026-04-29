/**
 * Solana fee model: flat 5% to the platform on top of the seller's
 * net price. The listing price is what the seller takes home — the
 * fee is added so the buyer's total = price × 1.05 (rounded up so the
 * platform never loses dust).
 */

export const PLATFORM_FEE_BPS = 500; // 5%

export function feeRate(): number {
  return PLATFORM_FEE_BPS / 10000;
}

/** USD the buyer pays so the seller nets `baseUsd` after the platform fee. */
export function grossUsdForBase(baseUsd: number): number {
  return baseUsd / (1 - feeRate());
}

/** USD platform fee (= grossUsd − baseUsd). */
export function feeUsdForBase(baseUsd: number): number {
  return grossUsdForBase(baseUsd) - baseUsd;
}

function ceilDiv(num: bigint, den: bigint): bigint {
  return (num + den - 1n) / den;
}

/**
 * Given `sellerLamports` (what the seller nets on-chain), return the
 * platform fee in lamports the buyer must send alongside so the
 * platform receives 5% of the gross. Rounded up.
 */
export function platformLamportsForSeller(sellerLamports: bigint): bigint {
  const feeBps = BigInt(PLATFORM_FEE_BPS);
  const sellerBps = 10000n - feeBps;
  return ceilDiv(sellerLamports * feeBps, sellerBps);
}

/** Buyer's gross on-chain amount: seller net + platform fee. */
export function grossLamportsForSeller(sellerLamports: bigint): bigint {
  return sellerLamports + platformLamportsForSeller(sellerLamports);
}
