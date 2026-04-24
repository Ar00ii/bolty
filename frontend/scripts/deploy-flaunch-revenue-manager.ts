/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * One-shot script to deploy our Flaunch RevenueManager on Base.
 *
 * RevenueManager is Flaunch's integrator-fee primitive — every token
 * flaunched through our manager pipes a fixed percentage of its 1%
 * swap fee into the Bolty treasury. One-time deploy, no recurring ops.
 *
 * Usage:
 *   cd frontend
 *   PRIVATE_KEY=0x... npx tsx scripts/deploy-flaunch-revenue-manager.ts
 *
 * Needs ~0.001 ETH on Base in the deployer wallet for gas. After it
 * prints the address, set NEXT_PUBLIC_FLAUNCH_REVENUE_MANAGER on
 * Vercel and flip NEXT_PUBLIC_FLAUNCH_LAUNCHPAD_ENABLED to true.
 *
 * Sources for the SDK shape:
 *   https://docs.flaunch.gg/manager-types
 *   https://github.com/flayerlabs/flaunch-sdk
 */

import { createFlaunch } from '@flaunch/sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Kept in sync manually with src/lib/flaunch/config.ts + feature.ts.
// Edit both when changing.
const TREASURY = '0xc320f2f3608d5bd269c39bb6ea9084ed32131a76' as const;
const PROTOCOL_FEE_PERCENT = 15;

function fail(msg: string): never {
  console.error('\n✗ ' + msg + '\n');
  process.exit(1);
}

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    fail(
      'Set PRIVATE_KEY env var to the deployer wallet private key.\n' +
        '  Needs ~0.001 ETH on Base for gas.\n' +
        '  Example: PRIVATE_KEY=0x... npx tsx scripts/deploy-flaunch-revenue-manager.ts',
    );
  }
  if (!pk.startsWith('0x') || pk.length !== 66) {
    fail('PRIVATE_KEY must be a 0x-prefixed 64-char hex string.');
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const publicClient = createPublicClient({ chain: base, transport: http() });
  const walletClient = createWalletClient({
    chain: base,
    transport: http(),
    account,
  });

  console.log('Deploying Flaunch RevenueManager on Base');
  console.log('  Deployer       :', account.address);
  console.log('  Treasury       :', TREASURY);
  console.log('  Protocol fee % :', PROTOCOL_FEE_PERCENT);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('  Deployer ETH   :', (Number(balance) / 1e18).toFixed(6));
  if (balance === 0n) {
    fail('Deployer wallet has 0 ETH on Base. Fund it first (any on-chain bridge works).');
  }

  // SDK bundles its own copy of viem's types — structural-cast so
  // our client types are accepted. Runtime shape is identical.
  const flaunchWrite = (createFlaunch as unknown as (p: {
    publicClient: any;
    walletClient: any;
  }) => any)({ publicClient, walletClient });

  if (typeof flaunchWrite?.deployRevenueManager !== 'function') {
    fail(
      'flaunchWrite.deployRevenueManager is not a function.\n' +
        '  The @flaunch/sdk API may have shifted — check the SDK release notes at\n' +
        '  https://github.com/flayerlabs/flaunch-sdk and update this script.',
    );
  }

  console.log('\n→ Signing deployment tx…');
  const result = await flaunchWrite.deployRevenueManager({
    protocolRecipient: TREASURY,
    protocolFeePercent: PROTOCOL_FEE_PERCENT,
  });

  // SDK docs suggest it returns the address string; handle an object
  // fallback so we still print something useful if the shape changes.
  const address =
    typeof result === 'string'
      ? result
      : result?.revenueManagerInstanceAddress ??
        result?.managerAddress ??
        result?.address ??
        null;

  console.log('\n✓ RevenueManager deployed\n');
  if (address) {
    console.log('  Address:', address);
  } else {
    console.log('  Raw SDK return (extract address manually):');
    console.log('  ', result);
  }
  console.log('\nSet these env vars on Vercel (Production + Preview + Development):');
  console.log(`  NEXT_PUBLIC_FLAUNCH_REVENUE_MANAGER=${address ?? '<address-from-output-above>'}`);
  console.log('  NEXT_PUBLIC_FLAUNCH_LAUNCHPAD_ENABLED=true');
}

main().catch((err) => {
  console.error('\n✗ Deployment failed:\n', err);
  process.exit(1);
});
