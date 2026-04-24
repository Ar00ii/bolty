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

/** Starting market cap every token launches at (USD). Flaunch's
 *  protocol has a fee-free threshold around $10k mcap — tokens
 *  below it launch for gas only, tokens at or above pay a
 *  proportional flaunching fee. Matches Flaunch's own UI, which
 *  launches at ~$9k so creators pay only Base gas (cents).
 *  Tokens with real volume push past $10k fast on their own, which
 *  is when our 15% swap-fee cut starts flowing through the
 *  RevenueManager. */
export const LAUNCH_INITIAL_MARKET_CAP_USD = 9_000;

/** Flaunch's fee-free threshold for launches (USD mcap). Tokens
 *  launched under this pay no protocol fee. */
export const FLAUNCH_FEE_FREE_THRESHOLD_USD = 10_000;

/** Flaunch's protocol-level launch fee — 0.1% of starting mcap,
 *  paid in ETH at launch time. Exposed here so the wizard can
 *  show a honest "you pay" figure that matches the wallet prompt. */
export const FLAUNCH_LAUNCH_FEE_PERCENT = 0.1;

/** Rough estimate shown in the wizard — the user pays gas, same as Flaunch. */
export const EST_LAUNCH_GAS_USD = 0.02;
