/**
 * Legacy $BOLTY ERC20 helpers. The token is being migrated to a Solana
 * SPL mint — everything here is a no-op until that ships. Signatures
 * mirror the original so the dozen call-sites still compile.
 */

export interface BoltyTokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  priceUsd: number | null;
}

export function getBoltyTokenConfig(): BoltyTokenConfig | null {
  return null;
}

export async function loadBoltyTokenConfig(): Promise<BoltyTokenConfig | null> {
  return null;
}

export function usdToTokenUnits(_usd: number, _cfg: BoltyTokenConfig): bigint {
  return 0n;
}

export function encodeErc20Transfer(_to: string, _amount: bigint): string {
  throw new Error('$BOLTY transfers are migrating to Solana SPL. Coming back online soon.');
}

export async function boltyApprove(
  _provider: unknown,
  _spender: string,
  _amount: bigint,
): Promise<never> {
  throw new Error('$BOLTY transfers are migrating to Solana SPL. Coming back online soon.');
}

export async function boltyBalanceOf(
  _provider: unknown,
  _owner: string,
): Promise<bigint> {
  return 0n;
}
