/**
 * Legacy escrow shim. The Base/EVM escrow contract is gone — Solana
 * payments + escrow ship in the next phase. Signatures preserved so
 * existing call-sites still compile.
 */

export function isEscrowEnabled(): boolean {
  return false;
}

export function getEscrowAddress(): string | null {
  return null;
}

export async function escrowDeposit(
  ..._args: unknown[]
): Promise<string> {
  throw new Error('On-chain escrow is being migrated to Solana. Coming back online soon.');
}

export async function escrowResolve(
  _provider: unknown,
  _orderId: string,
  _refundBuyer: boolean,
): Promise<string> {
  throw new Error('On-chain escrow is being migrated to Solana. Coming back online soon.');
}
