/**
 * Launchpad config — deployment-sensitive constants.
 *
 * Split from feature.ts so the treasury address and on-chain contract
 * reference live somewhere obvious. Phase 2 pulls the RevenueManager
 * address from NEXT_PUBLIC_FLAUNCH_REVENUE_MANAGER; until that env
 * var is set the UI runs in stubbed mode (see launchpad.ts) and the
 * wizard shows a banner so the user knows launches aren't on-chain yet.
 */

/** Bolty treasury wallet on Base — receives the protocol-fee cut
 *  of every swap across every launched token. Same address we use
 *  for the existing escrow platform fee. Immutable once the
 *  RevenueManager is deployed. */
export const BOLTY_TREASURY_ADDRESS: `0x${string}` =
  '0xc320f2f3608d5bd269c39bb6ea9084ed32131a76';

/** Flaunch's RevenueManager on Base. Deployed once via
 *  the Flaunch dashboard (see docs/flaunch-launchpad.md). Read here
 *  so Phase 2's real SDK call can target the right manager. */
export const FLAUNCH_REVENUE_MANAGER =
  (process.env.NEXT_PUBLIC_FLAUNCH_REVENUE_MANAGER as `0x${string}` | undefined) ?? null;

/** True when the env var is populated and looks like an address.
 *  Cheap client-side check — doesn't prove the contract exists on-chain. */
export function isRevenueManagerConfigured(): boolean {
  return (
    typeof FLAUNCH_REVENUE_MANAGER === 'string' &&
    /^0x[0-9a-fA-F]{40}$/.test(FLAUNCH_REVENUE_MANAGER)
  );
}

/** Appended to every launched token's description so the Flaunch
 *  coin page links back to the source listing + Bolty. Prevents
 *  the token becoming disembodied once someone trades it outside
 *  bolty.network. */
export function boltyAttributionFooter(listingUrl: string): string {
  return `\n\nLaunched on the Bolty Network launchpad — ${listingUrl}`;
}
