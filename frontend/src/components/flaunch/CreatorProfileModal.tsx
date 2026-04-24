'use client';

import { ArrowUpRight, Rocket, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Modal } from '@/components/ui/Modal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { TokenInfo } from '@/lib/flaunch/types';

import { TokenMiniSparkline } from './TokenMiniSparkline';

/**
 * Quick-look at a creator: avatar, handle, aggregate stats, and the
 * list of tokens they've launched through our RevenueManager. Click
 * a token in the list → opens the detail panel for it. The Profile
 * link deep-links to /u/{username} for the full user page.
 */

interface Props {
  open: boolean;
  username: string | null;
  /** Full token list — modal filters locally to tokens by this creator. */
  allTokens: TokenInfo[];
  onClose: () => void;
  onOpenToken: (t: TokenInfo) => void;
}

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

export function CreatorProfileModal({
  open,
  username,
  allTokens,
  onClose,
  onOpenToken,
}: Props) {
  const tokens = React.useMemo(() => {
    if (!username) return [];
    const u = username.toLowerCase();
    return allTokens.filter((t) => (t.creatorUsername ?? '').toLowerCase() === u);
  }, [allTokens, username]);

  const totals = React.useMemo(() => {
    return tokens.reduce(
      (acc, t) => ({
        count: acc.count + 1,
        volume: acc.volume + t.volume24hEth,
        mcap: acc.mcap + t.marketCapEth,
        holders: acc.holders + t.holders,
      }),
      { count: 0, volume: 0, mcap: 0, holders: 0 },
    );
  }, [tokens]);

  const avatarUrl = tokens.find((t) => !!t.creatorAvatarUrl)?.creatorAvatarUrl ?? null;

  return (
    <Modal
      isOpen={open && !!username}
      onClose={onClose}
      title={username ? `@${username}` : ''}
      subtitle="Launchpad history"
      size="md"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <UserAvatar
            src={avatarUrl}
            name={username}
            userId={username ?? ''}
            size={48}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] text-white font-light truncate">
              {username ? `@${username}` : 'Unknown creator'}
            </div>
            <div className="text-[11px] text-zinc-500 font-light">
              {tokens.length
                ? `${tokens.length} token${tokens.length === 1 ? '' : 's'} launched`
                : 'No launches yet'}
            </div>
          </div>
          {username && (
            <Link
              href={`/u/${username}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] text-zinc-300 hover:text-white transition shrink-0"
              style={{
                background: 'rgba(255,255,255,0.04)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              Profile
              <ArrowUpRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          )}
        </div>

        {/* Aggregate stats */}
        {tokens.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5">
            <MiniStat label="Launches" value={totals.count.toLocaleString()} />
            <MiniStat label="24h vol" value={`${formatEth(totals.volume)} ETH`} />
            <MiniStat label="Total mcap" value={`${formatEth(totals.mcap)} ETH`} />
            <MiniStat label="Holders" value={totals.holders.toLocaleString()} />
          </div>
        )}

        {/* Token list */}
        {tokens.length === 0 ? (
          <div
            className="rounded-xl px-6 py-10 text-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-2 grid place-items-center"
              style={{
                background: 'rgba(131,110,249,0.08)',
                boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
              }}
            >
              <Rocket className="w-4 h-4 text-[#b4a7ff]" strokeWidth={1.75} />
            </div>
            <div className="text-[12.5px] text-zinc-300 font-light">
              This creator hasn&apos;t launched a token yet.
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
            {tokens.map((t) => (
              <li key={t.tokenAddress}>
                <TokenRow
                  token={t}
                  onOpen={() => {
                    onClose();
                    onOpenToken(t);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="text-[9.5px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="text-[11.5px] text-zinc-200 font-mono tabular-nums truncate">{value}</div>
    </div>
  );
}

function TokenRow({
  token,
  onOpen,
}: {
  token: TokenInfo;
  onOpen: () => void;
}) {
  const up = token.priceChange24hPercent >= 0;
  const changeAbs = Math.abs(token.priceChange24hPercent);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition hover:brightness-110"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="w-9 h-9 rounded-lg overflow-hidden shrink-0"
        style={{
          background: 'rgba(131,110,249,0.08)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
        }}
      >
        {token.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={token.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-[9px] text-[#b4a7ff] font-mono">
            ${token.symbol}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-white font-light truncate">{token.name}</div>
        <div className="text-[10.5px] font-mono tabular-nums text-zinc-500 truncate">
          ${token.symbol} · {formatEth(token.priceEth)} ETH
        </div>
      </div>
      <TokenMiniSparkline data={token.sparkline7d || []} width={48} height={16} />
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10.5px] font-mono tabular-nums shrink-0"
        style={{
          color: up ? '#22c55e' : '#ef4444',
          background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          boxShadow: up
            ? 'inset 0 0 0 1px rgba(34,197,94,0.3)'
            : 'inset 0 0 0 1px rgba(239,68,68,0.3)',
        }}
      >
        {up ? (
          <TrendingUp className="w-2.5 h-2.5" strokeWidth={2} />
        ) : (
          <TrendingDown className="w-2.5 h-2.5" strokeWidth={2} />
        )}
        {up ? '+' : '-'}
        {changeAbs.toFixed(1)}%
      </span>
    </button>
  );
}
