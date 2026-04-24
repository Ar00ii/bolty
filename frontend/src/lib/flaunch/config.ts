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

/** Pinata JWT used to pin token metadata + images directly to IPFS,
 *  bypassing Flaunch's web2 upload endpoint. When set, the SDK's
 *  flaunchIPFSWithRevenueManager call uses `pinataConfig` and never
 *  hits web2-api.flaunch.gg — which has been flaky on our origin.
 *  Scoped key (pinFileToIPFS + pinJSONToIPFS only), so exposing it
 *  in the client bundle only lets a bad actor burn our free-tier
 *  upload quota — not access existing pins. */
export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT ?? null;

/** True when the env var is populated and looks like an address.
 *  Cheap client-side check — doesn't prove the contract exists on-chain. */
export function isRevenueManagerConfigured(): boolean {
  return (
    typeof FLAUNCH_REVENUE_MANAGER === 'string' &&
    /^0x[0-9a-fA-F]{40}$/.test(FLAUNCH_REVENUE_MANAGER)
  );
}

/** Appended to every launched token's description so the Flaunch
 *  coin page links back to the source listing + Bolty. Also embeds
 *  the creator username in a parseable marker (`creator: @foo`) so
 *  any consumer — including other users' browsers that don't have
 *  our local cache — can recover who launched it.
 *
 *  Keep the marker format stable: `creator: @username`. The listing
 *  page reads it with a regex, so don't break the exact casing. */
export function boltyAttributionFooter(
  listingUrl: string,
  creatorUsername?: string | null,
): string {
  const creator =
    creatorUsername && /^[a-zA-Z0-9_-]{1,40}$/.test(creatorUsername)
      ? `\ncreator: @${creatorUsername}`
      : '';
  return `\n\nLaunched on the Bolty Network launchpad — ${listingUrl}${creator}`;
}

/** Parses the `creator: @foo` marker back out of a token description
 *  so the launchpad list can render the real username even when the
 *  viewer has no local cache of the launch. Returns null if the
 *  marker isn't present. */
export function parseCreatorFromDescription(
  description: string | null | undefined,
): string | null {
  if (!description) return null;
  const m = description.match(/creator:\s*@([a-zA-Z0-9_-]{1,40})/);
  return m ? m[1] : null;
}
