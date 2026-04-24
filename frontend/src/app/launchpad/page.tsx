'use client';

import { ExternalLink, Info, Rocket, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { Badge, EmptyState, Hero, Stat, StatStrip } from '@/components/ui/app';
import { FLAUNCH_LAUNCHPAD_ENABLED, BOLTY_PROTOCOL_FEE_PERCENT } from '@/lib/flaunch/feature';
import { listLaunchedTokens } from '@/lib/flaunch/launchpad';
import type { TokenInfo } from '@/lib/flaunch/types';

type Sort = 'recent' | 'volume' | 'mcap';

export default function LaunchpadPage() {
  const [tokens, setTokens] = useState<TokenInfo[] | null>(null);
  const [sort, setSort] = useState<Sort>('recent');

  useEffect(() => {
    if (!FLAUNCH_LAUNCHPAD_ENABLED) {
      setTokens([]);
      return;
    }
    listLaunchedTokens().then(setTokens);
  }, []);

  const sorted = useMemo(() => {
    if (!tokens) return [];
    const copy = [...tokens];
    if (sort === 'volume') copy.sort((a, b) => b.volume24hEth - a.volume24hEth);
    else if (sort === 'mcap') copy.sort((a, b) => b.marketCapEth - a.marketCapEth);
    // 'recent' already sorted from the client
    return copy;
  }, [tokens, sort]);

  const totals = useMemo(() => {
    if (!tokens) return { count: 0, volume: 0, mcap: 0 };
    return tokens.reduce(
      (acc, t) => ({
        count: acc.count + 1,
        volume: acc.volume + t.volume24hEth,
        mcap: acc.mcap + t.marketCapEth,
      }),
      { count: 0, volume: 0, mcap: 0 },
    );
  }, [tokens]);

  return (
    <div
      className="mk-app-page mx-auto max-w-6xl px-4 sm:px-6 py-8"
      style={{ maxWidth: '72rem' }}
    >
      <Hero
        crumbs={
          <>
            <span>Launchpad</span>
            {!FLAUNCH_LAUNCHPAD_ENABLED && (
              <span className="mk-hero__crumb-sep">/</span>
            )}
            {!FLAUNCH_LAUNCHPAD_ENABLED && (
              <Badge variant="warn">Beta — flag gated</Badge>
            )}
          </>
        }
        title="Launchpad"
        subtitle="Every agent, bot and repo on Bolty can mint its own token — fair-launched on Base via Flaunch. Creators keep the majority of swap fees forever."
      >
        <StatStrip>
          <Stat label="Tokens launched" value={totals.count.toLocaleString()} />
          <Stat
            label="24h volume"
            value={<span className="font-mono">{formatEth(totals.volume)} ETH</span>}
          />
          <Stat
            label="Total mcap"
            value={<span className="font-mono">{formatEth(totals.mcap)} ETH</span>}
          />
        </StatStrip>
      </Hero>

      {/* How-it-works strip */}
      <div
        className="mt-6 rounded-xl p-4 flex items-start gap-3"
        style={{
          background:
            'linear-gradient(135deg, rgba(131,110,249,0.08) 0%, rgba(6,182,212,0.05) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.2)',
        }}
      >
        <div
          className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{
            background: 'rgba(131,110,249,0.18)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
          }}
        >
          <Info className="w-4 h-4 text-[#b4a7ff]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 space-y-1 text-[12px] text-zinc-300 font-light">
          <div className="text-[12.5px] text-white">How it works</div>
          <p>
            Any listing owner can launch a token from their listing page. Flaunch handles the
            fair-launch, liquidity pool, and progressive bid-wall on Base.
          </p>
          <p>
            Every swap routes a <span className="text-white">1%</span> protocol fee; Bolty takes{' '}
            <span className="text-white">{BOLTY_PROTOCOL_FEE_PERCENT}%</span> of that and the rest
            splits between the creator and the token&apos;s community treasury.
          </p>
        </div>
        <Link
          href="https://docs.flaunch.gg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition px-2 py-1 rounded-md shrink-0 self-start"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          Flaunch docs <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Sort chips */}
      <div className="mt-6 flex items-center gap-1">
        <SortChip
          active={sort === 'recent'}
          onClick={() => setSort('recent')}
          label="Recent"
          icon={<Sparkles className="w-3 h-3" strokeWidth={1.75} />}
        />
        <SortChip
          active={sort === 'volume'}
          onClick={() => setSort('volume')}
          label="Volume"
          icon={<TrendingUp className="w-3 h-3" strokeWidth={1.75} />}
        />
        <SortChip
          active={sort === 'mcap'}
          onClick={() => setSort('mcap')}
          label="Market cap"
          icon={<Rocket className="w-3 h-3" strokeWidth={1.75} />}
        />
      </div>

      {/* Grid */}
      <div className="mt-4">
        {tokens === null ? (
          <div className="text-center py-16 text-zinc-500 text-[12.5px] font-light">
            Loading launched tokens…
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No tokens launched yet"
            description={
              FLAUNCH_LAUNCHPAD_ENABLED
                ? 'Be the first — open any listing you own and hit Launch token.'
                : 'The launchpad is currently in private beta. Flip the feature flag to try it locally.'
            }
            action={
              FLAUNCH_LAUNCHPAD_ENABLED
                ? { label: 'Browse marketplace', href: '/market' }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((t) => (
              <TokenCard key={t.tokenAddress} token={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SortChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-light transition"
      style={{
        color: active ? '#ffffff' : '#a1a1aa',
        background: active ? 'rgba(131,110,249,0.18)' : 'rgba(255,255,255,0.03)',
        boxShadow: active
          ? 'inset 0 0 0 1px rgba(131,110,249,0.4)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function TokenCard({ token }: { token: TokenInfo }) {
  // Listings can be either agents or repos — both use /market/*/{id} URLs but
  // we don't know which. Link to /market/agents/{listingId} as a best-effort;
  // the real wiring (Phase 2) would resolve section from the subgraph.
  const listingHref = `/market/agents/${token.listingId}`;
  return (
    <Link
      href={listingHref}
      className="block rounded-xl p-3 transition hover:brightness-110"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
          style={{
            background: 'rgba(131,110,249,0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
          }}
        >
          {token.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={token.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-[10px] text-[#b4a7ff] font-mono">
              ${token.symbol}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] text-white font-light truncate">{token.name}</div>
          <div className="text-[11px] text-zinc-500 font-mono tabular-nums truncate">
            ${token.symbol}
          </div>
        </div>
        <a
          href={token.flaunchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[10.5px] text-zinc-500 hover:text-white transition px-2 py-1 rounded-md shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          title="Open on Flaunch"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-light">
        <Cell label="Price" value={`${formatEth(token.priceEth)} ETH`} />
        <Cell label="24h vol" value={`${formatEth(token.volume24hEth)} ETH`} />
        <Cell label="Holders" value={token.holders.toLocaleString()} />
      </div>
    </Link>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="text-[9.5px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="text-zinc-200 font-mono tabular-nums truncate">{value}</div>
    </div>
  );
}

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(3);
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}
