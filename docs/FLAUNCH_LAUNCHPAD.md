# Flaunch Launchpad — deployment guide

Step-by-step to turn on real on-chain launches. Phase 1 (UI, stubbed
client, flag-gated) is already shipped. This doc walks through the
one-time setup needed for Phase 2 (real contracts, real ETH).

## Decisions (already made)

| | |
|---|---|
| **Treasury address** | `0xc320f2f3608d5bd269c39bb6ea9084ed32131a76` |
| **Protocol fee** | 15% of every swap fee |
| **Chain** | Base (chainId 8453) |
| **Gating** | Open to every listing owner |
| **Data source** | Flaunch subgraph (no backend mirror day 1) |
| **Gas model** | User pays from their own wallet |
| **Token footer** | Bolty attribution appended to every token description |
| **Framing** | Community memecoins (not revenue claims / securities) |

These live in `frontend/src/lib/flaunch/config.ts` and
`frontend/src/lib/flaunch/feature.ts`. Change the fee or
treasury there — don't hardcode anywhere else.

## One-time setup

### 1. Deploy the RevenueManager

Use the Flaunch dashboard — it has a dedicated UI for creating a
RevenueManager, which is far safer than a custom deploy script
(their dashboard composes the right factory calls and validates
the result).

1. Go to <https://flaunch.gg/manage> (connect the deployer wallet
   with ~0.001 ETH on Base).
2. Create a new RevenueManager with:
   - **Protocol recipient**: `0xc320f2f3608d5bd269c39bb6ea9084ed32131a76`
   - **Protocol fee percent**: `15`
3. Submit, wait for confirmation, copy the deployed **manager
   address** from the success screen.

### 2. Wire the address into the frontend

Set on Vercel (Production + Preview + Development scopes) and in
`.env.local` for anyone running the app locally:

```bash
NEXT_PUBLIC_FLAUNCH_REVENUE_MANAGER=<manager address from step 1>
NEXT_PUBLIC_FLAUNCH_LAUNCHPAD_ENABLED=true
```

`isRevenueManagerConfigured()` will now return `true`, removing the
"Preview mode" banner from the launch wizard. The UI is otherwise
unchanged.

### 3. Swap the stubbed client for real SDK calls

Open `frontend/src/lib/flaunch/launchpad.ts` — rewrite the four
exported functions to call `@flaunch/sdk`:

| Current stub | Real SDK equivalent |
|---|---|
| `launchToken(input)` | `sdk.flaunchIPFSWithRevenueManager({ ...input, revenueManager: FLAUNCH_REVENUE_MANAGER })` |
| `buyLaunchpadToken(input)` | `sdk.buyCoin({ coin, ethAmount, slippagePercent })` |
| `sellLaunchpadToken(input)` | `sdk.sellCoin({ coin, tokenAmount, slippagePercent })` |
| `getTokenForListing(id)` + `listLaunchedTokens()` | Query the Flaunch subgraph filtered by `revenueManager == FLAUNCH_REVENUE_MANAGER` |

`getReadWriteSdk()` in `frontend/src/lib/flaunch/client.ts` already
builds the SDK with the user's MetaMask wallet — reuse it directly.

No other UI file needs to change. The type contracts in
`frontend/src/lib/flaunch/types.ts` were designed to match what the
SDK returns.

### 4. Smoke-test

- Connect a wallet on Base with a small ETH balance
- Open any listing you own → "Launch token"
- Walk the wizard, confirm the "Preview mode" banner is gone
- Launch a throwaway token with a tiny premine (0.0001 ETH)
- Verify on basescan.org that the token contract exists
- Check that a swap pays the RevenueManager — small amount of ETH
  should accrue to the treasury address after a handful of trades

### 5. Claim protocol fees

From the deployer wallet on <https://flaunch.gg/manage>:

1. Open your RevenueManager
2. Click **Claim** — sends accrued fees to the treasury

The wallet that called claim covers gas; fees themselves go to the
`protocolRecipient` set in step 1.

## Rollback

If anything goes wrong after step 2:

```bash
# .env.production / Vercel
NEXT_PUBLIC_FLAUNCH_LAUNCHPAD_ENABLED=false
```

This hides every launchpad surface. The existing on-chain tokens
keep trading on Flaunch — they're not "ours" to turn off.

## Notes

- The RevenueManager is immutable once deployed; fee percent + recipient
  cannot be edited. Deploy a new one and migrate if needed.
- Fair-launch mechanics (30 min fixed-price window, 0.25%-per-wallet
  max buy, no sell during window) are enforced by Flaunch's hooks and
  cannot be bypassed per-launch.
- Subgraph queries should filter by `revenueManager` to only surface
  tokens launched through Bolty — other RevenueManagers share the
  Flaunch protocol but aren't ours.
