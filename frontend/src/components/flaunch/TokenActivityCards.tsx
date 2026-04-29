'use client';

import { ArrowDown, ArrowUp, ExternalLink, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

/**
 * Top trades + top holders for a token, shown below the chart on
 * /launchpad/{address}. Data comes from public APIs with no key:
 *   - Trades: GeckoTerminal /pools/{pool}/trades
 *   - Holders: no great free API — we link to Basescan for the
 *     authoritative list. When someone wires a subgraph / Alchemy
 *     indexer later, this card upgrades in place.
 */

interface Props {
  tokenAddress: string;
  symbol: string;
}

type GeckoTrade = {
  id?: string;
  attributes?: {
    block_number?: number;
    tx_hash?: string;
    block_timestamp?: string;
    kind?: 'buy' | 'sell';
    volume_in_usd?: string;
    price_from_in_currency_token?: string; // ETH
    price_to_in_currency_token?: string;
    price_from_in_usd?: string;
    price_to_in_usd?: string;
    from_token_amount?: string;
    to_token_amount?: string;
    tx_from_address?: string;
  };
};

function shortAddr(a: string | undefined | null): string {
  if (!a) return '';
  if (a.length < 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function timeAgo(iso: string | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatUsd(n: number): string {
  if (!n || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(2)}`;
}

export function TokenActivityCards({ tokenAddress, symbol }: Props) {
  const [pool, setPool] = useState<string | null>(null);
  const [trades, setTrades] = useState<GeckoTrade[] | null>(null);
  const [tradesStatus, setTradesStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  // Resolve the pool address once so we can query trades.
  useEffect(() => {
    let cancelled = false;
    setPool(null);
    setTradesStatus('loading');
    fetch(
      `https://api.geckoterminal.com/api/v2/networks/base/tokens/${tokenAddress}/pools`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (cancelled) return;
        const addr = data?.data?.[0]?.attributes?.address ?? null;
        setPool(addr);
      })
      .catch(() => {
        if (!cancelled) setTradesStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [tokenAddress]);

  // Fetch recent trades whenever pool is known. Poll every 20s.
  useEffect(() => {
    if (!pool) return;
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/base/pools/${pool}/trades?trade_volume_in_usd_greater_than=0`,
        );
        if (!r.ok) {
          if (!cancelled) setTradesStatus('error');
          return;
        }
        const data = await r.json();
        const list: GeckoTrade[] = Array.isArray(data?.data) ? data.data : [];
        if (!cancelled) {
          setTrades(list.slice(0, 10));
          setTradesStatus('ready');
        }
      } catch {
        if (!cancelled) setTradesStatus('error');
      }
    }
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pool]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <TradesCard
        symbol={symbol}
        trades={trades}
        status={tradesStatus}
        poolKnown={pool !== null}
      />
      <HoldersCard tokenAddress={tokenAddress} symbol={symbol} />
    </div>
  );
}

function TradesCard({
  symbol,
  trades,
  status,
  poolKnown,
}: {
  symbol: string;
  trades: GeckoTrade[] | null;
  status: 'loading' | 'ready' | 'error';
  poolKnown: boolean;
}) {
  return (
    <section
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 font-medium">
          Recent trades
        </h2>
        <span className="text-[10px] text-zinc-600 font-mono">last 10</span>
      </div>
      {status === 'loading' || !poolKnown ? (
        <div className="py-10 text-center text-[11.5px] text-zinc-500 font-light">
          Loading trades…
        </div>
      ) : status === 'error' ? (
        <div className="py-10 text-center text-[11.5px] text-zinc-500 font-light">
          Could not load trades.
        </div>
      ) : !trades?.length ? (
        <div className="py-10 text-center text-[11.5px] text-zinc-500 font-light">
          No trades yet — be the first swap on ${symbol}.
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.03]">
          {trades.map((t) => (
            <TradeRow key={t.id ?? t.attributes?.tx_hash} trade={t} symbol={symbol} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TradeRow({ trade, symbol }: { trade: GeckoTrade; symbol: string }) {
  const a = trade.attributes ?? {};
  const kind = a.kind;
  const up = kind === 'buy';
  const usd = Number(a.volume_in_usd ?? '0') || 0;
  const priceUsd =
    Number(a.price_from_in_usd ?? a.price_to_in_usd ?? '0') || 0;
  const tokenAmountRaw =
    kind === 'buy' ? a.to_token_amount : a.from_token_amount;
  const tokenAmount = Number(tokenAmountRaw ?? '0') || 0;

  return (
    <li className="flex items-center gap-3 py-2">
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-md shrink-0"
        style={{
          background: up ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          color: up ? '#22c55e' : '#ef4444',
          boxShadow: up
            ? 'inset 0 0 0 1px rgba(34,197,94,0.3)'
            : 'inset 0 0 0 1px rgba(239,68,68,0.3)',
        }}
      >
        {up ? (
          <ArrowDown className="w-2.5 h-2.5" strokeWidth={2.5} />
        ) : (
          <ArrowUp className="w-2.5 h-2.5" strokeWidth={2.5} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] font-light text-white truncate">
          <span style={{ color: up ? '#22c55e' : '#ef4444' }} className="uppercase">
            {up ? 'Buy' : 'Sell'}
          </span>{' '}
          <span className="font-mono tabular-nums text-zinc-300">
            {tokenAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>{' '}
          <span className="text-zinc-500">${symbol}</span>
        </div>
        <div className="text-[10px] font-mono tabular-nums text-zinc-500 truncate">
          @ {formatUsd(priceUsd)} · {shortAddr(a.tx_from_address)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[11.5px] font-mono tabular-nums text-white">
          {formatUsd(usd)}
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">
          {timeAgo(a.block_timestamp)} ago
        </div>
      </div>
      {a.tx_hash && (
        <a
          href={`https://basescan.org/tx/${a.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-zinc-600 hover:text-white transition shrink-0"
          title="View tx on Basescan"
        >
          <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
        </a>
      )}
    </li>
  );
}

function HoldersCard({
  tokenAddress,
  symbol,
}: {
  tokenAddress: string;
  symbol: string;
}) {
  return (
    <section
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-400 font-medium">
          Top holders
        </h2>
        <a
          href={`https://basescan.org/token/${tokenAddress}#balances`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-zinc-500 hover:text-white transition inline-flex items-center gap-1 font-mono"
        >
          Basescan <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.75} />
        </a>
      </div>
      <div
        className="flex items-center gap-3 px-3 py-8 rounded-lg text-center"
        style={{
          background: 'rgba(255,255,255,0.015)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0"
          style={{
            background: 'rgba(20,241,149,0.1)',
            boxShadow: 'inset 0 0 0 1px rgba(20,241,149,0.3)',
          }}
        >
          <Users className="w-3.5 h-3.5 text-[#b4a7ff]" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[12px] text-white font-light">
            Full holder list on Basescan
          </div>
          <div className="text-[10.5px] text-zinc-500 font-light mt-0.5">
            Top-10 breakdown comes next pass when we wire an indexer. For now,
            the authoritative ${symbol} holders page lives on Basescan.
          </div>
        </div>
      </div>
    </section>
  );
}
