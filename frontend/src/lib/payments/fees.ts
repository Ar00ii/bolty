// Base network dual-fee model.
// The buyer-side discount lives here: the seller's listing price is the
// amount they take home, and the platform fee is added on top of that.
// ATLAS (3%) is therefore strictly cheaper for the buyer than ETH (7%).

export type PaymentMethod = 'ETH' | 'ATLAS';

export const FEE_BPS: Record<PaymentMethod, number> = { ETH: 700, ATLAS: 300 };

export function feeRateFor(method: PaymentMethod): number {
  return FEE_BPS[method] / 10000;
}

/** USD the buyer pays so the seller nets `baseUsd` after the platform fee. */
export function grossUsdForBase(baseUsd: number, method: PaymentMethod): number {
  return baseUsd / (1 - feeRateFor(method));
}

/** USD platform fee (= grossUsd − baseUsd). */
export function feeUsdForBase(baseUsd: number, method: PaymentMethod): number {
  return grossUsdForBase(baseUsd, method) - baseUsd;
}

function ceilDiv(num: bigint, den: bigint): bigint {
  return (num + den - 1n) / den;
}

/**
 * Given `sellerWei` (the seller's net amount on-chain), return the platform
 * fee the buyer must also send so the platform receives feeBps of the gross.
 * Rounded up so the platform never loses dust.
 */
export function platformWeiForSeller(sellerWei: bigint, method: PaymentMethod): bigint {
  const feeBps = BigInt(FEE_BPS[method]);
  const sellerBps = 10000n - feeBps;
  return ceilDiv(sellerWei * feeBps, sellerBps);
}

/** Buyer's gross on-chain amount: seller net + platform fee. */
export function grossWeiForSeller(sellerWei: bigint, method: PaymentMethod): bigint {
  return sellerWei + platformWeiForSeller(sellerWei, method);
}
