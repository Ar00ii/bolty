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

/** Rough estimate shown in the wizard — the user pays gas, same as Flaunch. */
export const EST_LAUNCH_GAS_USD = 0.02;
