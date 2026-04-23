'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api/client';

interface Trade {
  id: string;
  side: 'buy' | 'sell';
  priceUsd: number | null;
  amountUsd: number | null;
  amountToken: number | null;
  amountEth: number | null;
  txHash: string;
  wallet: string;
  at: string;
}

/** Polling interval — keep tight enough to feel live. */
const POLL_MS = 2500;
const MAX_ROWS = 40;

function formatUsd(n: number | null): string {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(3)}`;
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function BoltyTradesFeed({ className = '' }: { className?: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const lastIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.get<Trade[]>('/token/bolty/trades');
        if (cancelled) return;
        setLoading(false);
        setTrades((prev) => {
          const merged = [...data, ...prev];
          const seen = new Set<string>();
          const out: Trade[] = [];
          for (const t of merged) {
            if (seen.has(t.id)) continue;
            seen.add(t.id);
            out.push(t);
            if (out.length >= MAX_ROWS) break;
          }
          lastIdsRef.current = new Set(out.map((t) => t.id));
          return out;
        });
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const { buys, sells, buyVol, sellVol } = useMemo(() => {
    let bCount = 0;
    let sCount = 0;
    let bVol = 0;
    let sVol = 0;
    for (const t of trades) {
      if (t.side === 'buy') {
        bCount++;
        bVol += t.amountUsd ?? 0;
      } else {
        sCount++;
        sVol += t.amountUsd ?? 0;
      }
    }
    return { buys: bCount, sells: sCount, buyVol: bVol, sellVol: sVol };
  }, [trades]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2"
        style={{ borderColor: 'rgba(131,110,249,0.35)' }}
      />
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_#4ADE80]" />
          <h3 className="text-sm font-normal text-white/80">Live trades</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/50">
          <span className="text-emerald-400">{buys} buys · {formatUsd(buyVol)}</span>
          <span className="text-rose-400">{sells} sells · {formatUsd(sellVol)}</span>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading && trades.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-white/40">
            Loading recent swaps…
          </div>
        ) : trades.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-white/40">
            No trades yet. Be the first to swap.
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0 text-[12px] font-light">
            <thead className="sticky top-0 bg-black/60 backdrop-blur">
              <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-white/40">
                <th className="px-4 py-2">Side</th>
                <th className="px-4 py-2">USD</th>
                <th className="hidden px-4 py-2 sm:table-cell">BOLTY</th>
                <th className="hidden px-4 py-2 md:table-cell">ETH</th>
                <th className="px-4 py-2">Wallet</th>
                <th className="px-4 py-2 text-right">Age</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {trades.map((t) => (
                  <motion.tr
                    key={t.id}
                    layout
                    initial={{ opacity: 0, backgroundColor: t.side === 'buy' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)' }}
                    animate={{ opacity: 1, backgroundColor: 'rgba(255,255,255,0)' }}
                    transition={{ duration: 0.6 }}
                    className="border-t border-white/5 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                          t.side === 'buy'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {t.side === 'buy' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {t.side}
                      </span>
                    </td>
                    <td className="px-4 py-2 tabular-nums text-white">
                      {formatUsd(t.amountUsd)}
                    </td>
                    <td className="hidden px-4 py-2 tabular-nums text-white/70 sm:table-cell">
                      {t.amountToken != null
                        ? t.amountToken.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })
                        : '—'}
                    </td>
                    <td className="hidden px-4 py-2 tabular-nums text-white/70 md:table-cell">
                      {t.amountEth != null
                        ? t.amountEth.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-white/60">
                      <a
                        href={`https://basescan.org/address/${t.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-white"
                      >
                        {shortAddr(t.wallet)}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-right text-white/50">
                      <a
                        href={`https://basescan.org/tx/${t.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 transition hover:text-white"
                      >
                        {relative(t.at)}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default BoltyTradesFeed;
