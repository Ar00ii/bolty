'use client';

import { AlertCircle, ArrowDown, CheckCircle2, ExternalLink, Loader2, Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { erc20Abi, formatUnits, parseEther, parseUnits, type Address } from 'viem';

import { getPublicClient, getReadWriteSdk } from '@/lib/flaunch/client';

const ATLAS = '0xA383e85a626171edCB2727AEcAED4Fc5e27E42a7' as Address;
const DEFAULT_SLIPPAGE = 5;

type Side = 'buy' | 'sell';

interface BoltySwapCardProps {
  priceUsd: number | null;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'pending'; txHash: `0x${string}` }
  | { kind: 'success'; txHash: `0x${string}` }
  | { kind: 'error'; message: string };

function formatToken(value: bigint, decimals = 18, digits = 4): string {
  const s = formatUnits(value, decimals);
  const [int, frac = ''] = s.split('.');
  if (!frac) return int;
  return `${int}.${frac.slice(0, digits)}`;
}

export function BoltySwapCard({ priceUsd }: BoltySwapCardProps) {
  const [side, setSide] = useState<Side>('buy');
  const [amount, setAmount] = useState<string>('0.01');
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [connected, setConnected] = useState<Address | null>(null);
  const [balanceBolty, setBalanceBolty] = useState<bigint | null>(null);

  // Re-read the ATLAS balance after the wallet connects and after each
  // successful swap so the header number stays accurate.
  const refreshBalance = useCallback(
    async (addr: Address) => {
      try {
        const pc = getPublicClient();
        const bal = (await pc.readContract({
          address: ATLAS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [addr],
        })) as bigint;
        setBalanceBolty(bal);
      } catch {
        setBalanceBolty(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (connected) void refreshBalance(connected);
  }, [connected, refreshBalance]);

  const amountParsed = useMemo(() => {
    const trimmed = amount.trim();
    if (!trimmed) return null;
    try {
      return side === 'buy' ? parseEther(trimmed) : parseUnits(trimmed, 18);
    } catch {
      return null;
    }
  }, [amount, side]);

  // Quick price estimate — we don't run the Flaunch quoter on every
  // keystroke (that's an RPC call). Use the live priceUsd to preview
  // the other side and pair with slippage for the floor/ceiling.
  const estimate = useMemo(() => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || priceUsd == null) return null;
    // ETH → USD at a stable reference. We don't fetch ETH price here —
    // DexScreener gives us the pair's USD price directly, so when the
    // user types "0.01 ETH" we already know the priceUsd per ATLAS.
    // Convert via: amountIn (ETH or ATLAS) → USD → other side.
    if (side === 'buy') {
      // Need ETH price — pull from window (set by header) or skip.
      const ethUsd = getReferenceEthUsd();
      if (!ethUsd) return null;
      const usd = amt * ethUsd;
      const tokensOut = usd / priceUsd;
      const floor = tokensOut * (1 - slippage / 100);
      return { outAmount: tokensOut, floor, label: 'ATLAS' };
    }
    // sell: ATLAS → ETH
    const ethUsd = getReferenceEthUsd();
    if (!ethUsd) return null;
    const usd = amt * priceUsd;
    const ethOut = usd / ethUsd;
    const floor = ethOut * (1 - slippage / 100);
    return { outAmount: ethOut, floor, label: 'ETH' };
  }, [amount, side, priceUsd, slippage]);

  const onConnect = useCallback(async () => {
    try {
      setStatus({ kind: 'idle' });
      const { account } = await getReadWriteSdk();
      setConnected(account);
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Wallet connection failed',
      });
    }
  }, []);

  const onSwap = useCallback(async () => {
    if (!amountParsed || amountParsed <= BigInt(0)) {
      setStatus({ kind: 'error', message: 'Enter an amount to swap' });
      return;
    }
    setStatus({ kind: 'submitting' });
    try {
      const { sdk, walletClient, account } = await getReadWriteSdk();
      setConnected(account);

      let txHash: `0x${string}`;
      if (side === 'buy') {
        txHash = await sdk.buyCoin({
          coinAddress: ATLAS,
          swapType: 'EXACT_IN',
          amountIn: amountParsed,
          slippagePercent: slippage,
        });
      } else {
        // Sell flow uses Permit2. Check current allowance — if it's
        // enough, skip the sign step; otherwise, fetch typed data and
        // sign through the wallet.
        const { allowance } = await sdk.getPermit2AllowanceAndNonce(ATLAS);
        if (allowance >= amountParsed) {
          txHash = await sdk.sellCoin({
            coinAddress: ATLAS,
            amountIn: amountParsed,
            slippagePercent: slippage,
          });
        } else {
          const { typedData, permitSingle } = await sdk.getPermit2TypedData(ATLAS);
          // Sign the Permit2 typed data via the wallet client we
          // already built in getReadWriteSdk. Typed-data shapes across
          // the SDK's bundled viem and ours are nominally different,
          // so we cast the call at the boundary.
          const signTyped = (walletClient as unknown as {
            signTypedData: (args: unknown) => Promise<`0x${string}`>;
          }).signTypedData;
          const signature = await signTyped({
            account,
            domain: typedData.domain,
            types: typedData.types,
            primaryType: typedData.primaryType,
            message: typedData.message,
          });
          txHash = await sdk.sellCoin({
            coinAddress: ATLAS,
            amountIn: amountParsed,
            slippagePercent: slippage,
            permitSingle,
            signature,
          });
        }
      }

      setStatus({ kind: 'pending', txHash });
      // Wait for the receipt so we can flip to success + refresh balance
      try {
        const pc = getPublicClient();
        await pc.waitForTransactionReceipt({ hash: txHash });
        setStatus({ kind: 'success', txHash });
        void refreshBalance(account);
      } catch {
        // Receipt poll failed but tx was submitted — still show pending.
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const msg = raw.split('\n')[0].slice(0, 160);
      setStatus({ kind: 'error', message: msg || 'Swap failed' });
    }
  }, [amountParsed, side, slippage, refreshBalance]);

  const pctButtons: number[] = [0.001, 0.01, 0.1];
  const busy = status.kind === 'submitting' || status.kind === 'pending';

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 font-light"
      style={{
        background:
          'linear-gradient(180deg, rgba(24,22,40,0.75) 0%, rgba(10,10,14,0.75) 100%)',
        boxShadow:
          '0 0 0 1px rgba(20,241,149,0.22), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.22em] text-white/50">Swap</div>
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5 text-[11px]">
          {(['buy', 'sell'] as Side[]).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`rounded-md px-2.5 py-1 transition ${
                side === s
                  ? 'bg-gradient-to-b from-[#14F195] to-[#6B4FE8] text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {s === 'buy' ? 'Buy' : 'Sell'}
            </button>
          ))}
        </div>
      </div>

      {/* You pay */}
      <div className="mt-3 rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
        <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.18em] text-white/40">
          <span>You {side === 'buy' ? 'pay' : 'sell'}</span>
          {side === 'sell' && balanceBolty != null && (
            <button
              className="normal-case tracking-normal text-[11px] text-white/60 hover:text-white"
              onClick={() => setAmount(formatToken(balanceBolty, 18, 6))}
            >
              Balance: {formatToken(balanceBolty, 18, 4)}
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/,/g, '.');
              if (/^\d*\.?\d*$/.test(v)) setAmount(v);
            }}
            placeholder="0.0"
            className="flex-1 bg-transparent text-2xl font-light text-white outline-none placeholder:text-white/20"
          />
          <span className="rounded-lg bg-white/5 px-2 py-1 text-xs font-normal text-white/90">
            {side === 'buy' ? 'ETH' : 'ATLAS'}
          </span>
        </div>
        {side === 'buy' && (
          <div className="mt-2 flex gap-1">
            {pctButtons.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="my-1.5 flex justify-center">
        <div className="rounded-full border border-white/10 bg-black/60 p-1">
          <ArrowDown className="h-3.5 w-3.5 text-white/50" />
        </div>
      </div>

      {/* You receive */}
      <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/5">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">
          You receive
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 text-2xl font-light text-white">
            {estimate ? estimate.outAmount.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
          </div>
          <span className="rounded-lg bg-white/5 px-2 py-1 text-xs font-normal text-white/90">
            {side === 'buy' ? 'ATLAS' : 'ETH'}
          </span>
        </div>
        {estimate && (
          <div className="mt-1.5 text-[11px] text-white/45">
            Min received (≥ {slippage}% slip): {estimate.floor.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
            {estimate.label}
          </div>
        )}
      </div>

      {/* Slippage */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
        <span>Slippage</span>
        <div className="flex gap-1">
          {[1, 3, 5, 10].map((v) => (
            <button
              key={v}
              onClick={() => setSlippage(v)}
              className={`rounded-md px-2 py-0.5 transition ${
                slippage === v ? 'bg-[#14F195]/25 text-white' : 'bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="mt-4">
        {!connected ? (
          <button
            onClick={onConnect}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14F195] to-[#6B4FE8] px-4 py-3 text-sm font-normal text-white shadow-[0_0_30px_-8px_#14F195] transition hover:brightness-110"
          >
            <Wallet className="h-4 w-4" />
            Connect wallet
          </button>
        ) : (
          <button
            disabled={busy || !amountParsed || amountParsed <= BigInt(0)}
            onClick={onSwap}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14F195] to-[#6B4FE8] px-4 py-3 text-sm font-normal text-white shadow-[0_0_30px_-8px_#14F195] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {status.kind === 'pending' ? 'Confirming…' : 'Submitting…'}
              </>
            ) : (
              <>
                {side === 'buy' ? 'Buy $ATLAS' : 'Sell $ATLAS'}
              </>
            )}
          </button>
        )}
      </div>

      {/* Status line */}
      <div className="mt-2 min-h-[20px] text-[11px]">
        {status.kind === 'error' && (
          <div className="flex items-start gap-1.5 text-rose-300">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="break-words">{status.message}</span>
          </div>
        )}
        {(status.kind === 'pending' || status.kind === 'success') && (
          <a
            href={`https://basescan.org/tx/${status.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-300 hover:underline"
          >
            {status.kind === 'success' ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {status.kind === 'success' ? 'Swap confirmed' : 'Swap submitted'} · view tx
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {status.kind === 'idle' && connected && (
          <div className="text-white/40">
            Connected {connected.slice(0, 6)}…{connected.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Read the ETH/USD reference price cached by the BoltyPricePill / page
 * header. Keeping the lookup on window avoids a second API call just
 * for the swap preview — if nothing's cached, the estimate hides.
 */
function getReferenceEthUsd(): number | null {
  if (typeof window === 'undefined') return null;
  const v = (window as unknown as { __BOLTY_ETH_USD?: number }).__BOLTY_ETH_USD;
  return typeof v === 'number' && isFinite(v) && v > 0 ? v : null;
}

export default BoltySwapCard;
