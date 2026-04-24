/**
 * Feature flags + constants for the Flaunch launchpad.
 *
 * Gate every Flaunch UI surface behind FLAUNCH_LAUNCHPAD_ENABLED
 * until the RevenueManager contract is deployed and audited.
 */

export const FLAUNCH_LAUNCHPAD_ENABLED =
  process.env.NEXT_PUBLIC_FLAUNCH_LAUNCHPAD_ENABLED === 'true';

/** Cut Bolty takes from every swap fee, routed via RevenueManager.
 *  Must match the protocolFeePercent set on-chain. */
export const BOLTY_PROTOCOL_FEE_PERCENT = 15;

/** Starting market cap every token launches at (USD). Drives the
 *  flaunching fee (0.1% of this) that Flaunch charges creators up
 *  front on launch. Matches Flaunch's own launch pricing — starting
 *  low keeps the user-facing cost in cents, and tokens with real
 *  volume grow past $10k mcap fast (where our 15% swap cut kicks in). */
export const LAUNCH_INITIAL_MARKET_CAP_USD = 1_000;

/** Flaunch's protocol-level launch fee — 0.1% of starting mcap,
 *  paid in ETH at launch time. Exposed here so the wizard can
 *  show a honest "you pay" figure that matches the wallet prompt. */
export const FLAUNCH_LAUNCH_FEE_PERCENT = 0.1;

/** Rough estimate shown in the wizard — the user pays gas, same as Flaunch. */
export const EST_LAUNCH_GAS_USD = 0.02;
