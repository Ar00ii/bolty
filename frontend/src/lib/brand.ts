/**
 * Single source of truth for the platform's external-facing name +
 * tagline. Every UI surface that used to hard-code "Bolty" should
 * import from here so renaming the platform is a one-line change.
 *
 * The user is mid-rebrand away from the "Bolty" name; until they
 * confirm the final name we ship `BRAND_NAME` as `'ethflow'` (lower
 * case to match base.org's wordmark style). Swap the string on this
 * line and the whole app updates.
 */

export const BRAND_NAME = 'ethflow';
export const BRAND_NAME_DISPLAY = 'ethflow'; // case-preserved if you later go mixed-case
export const BRAND_TAGLINE = 'The marketplace for autonomous agents on Ethereum.';
export const BRAND_DESCRIPTION =
  'Buy, sell, and run AI agents — settled onchain on Ethereum mainnet.';
export const BRAND_DOMAIN = 'ethflow.xyz';
