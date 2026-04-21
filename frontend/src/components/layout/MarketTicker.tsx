'use client';

import { Crown, Flame, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

import { getReputationRank } from '@/components/ui/reputation-badge';
import { api } from '@/lib/api/client';

interface TickerAgent {
  id: string;
  title: string;
  sales: number;
  sellerUsername: string | null;
  sellerAvatar: string | null;
}

interface TickerDev {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  reputationPoints: number;
  totalSales: number;
}

interface TickerData {
  topAgents: TickerAgent[];
  topDevs: TickerDev[];
}

const REFRESH_MS = 30_000;

export function MarketTicker() {
  const [data, setData] = useState<TickerData>({ topAgents: [], topDevs: [] });
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get<TickerData>('/market/ticker');
        if (!cancelled) setData(res);
      } catch {
        /* swallow — ticker is best-effort */
      }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const items = useTickerItems(data);
  if (items.length === 0) return null;

  // Duplicate items so the marquee loops seamlessly.
  const loop = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden hidden md:block"
      style={{
        background: 'rgba(9,9,11,0.96)',
        borderBottom: '1px solid #1f1f23',
        height: '34px',
      }}
      aria-label="Top agents and developers ticker"
    >
      <div
        className="absolute inset-y-0 left-0 z-10 pointer-events-none"
        style={{
          width: 56,
          background: 'linear-gradient(90deg, rgba(9,9,11,1) 0%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-y-0 right-0 z-10 pointer-events-none"
        style={{
          width: 56,
          background: 'linear-gradient(270deg, rgba(9,9,11,1) 0%, transparent 100%)',
        }}
      />
      <div
        ref={trackRef}
        className="ticker-track flex items-center gap-7 h-full whitespace-nowrap"
        style={{
          animation: `ticker-slide ${Math.max(28, loop.length * 4)}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {loop.map((it, i) => (
          <TickerEntry key={`${it.key}-${i}`} item={it} />
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker-slide {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

type TickerItem =
  | {
      key: string;
      kind: 'agent';
      href: string;
      title: string;
      sales: number;
      sellerUsername: string | null;
      sellerAvatar: string | null;
    }
  | {
      key: string;
      kind: 'dev';
      href: string;
      username: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      reputationPoints: number;
      totalSales: number;
    };

function useTickerItems(data: TickerData): TickerItem[] {
  const items: TickerItem[] = [];
  for (const a of data.topAgents.slice(0, 8)) {
    items.push({
      key: `a-${a.id}`,
      kind: 'agent',
      href: `/market/agents/${a.id}`,
      title: a.title,
      sales: a.sales,
      sellerUsername: a.sellerUsername,
      sellerAvatar: a.sellerAvatar,
    });
  }
  for (const d of data.topDevs.slice(0, 8)) {
    items.push({
      key: `d-${d.id}`,
      kind: 'dev',
      href: d.username ? `/u/${d.username}` : '#',
      username: d.username,
      displayName: d.displayName,
      avatarUrl: d.avatarUrl,
      reputationPoints: d.reputationPoints,
      totalSales: d.totalSales,
    });
  }
  return items;
}

function TickerEntry({ item }: { item: TickerItem }) {
  if (item.kind === 'agent') {
    return (
      <Link
        href={item.href}
        className="inline-flex items-center gap-2 hover:brightness-125 transition-all"
        style={{ fontSize: 11.5 }}
      >
        <span
          className="inline-flex items-center gap-1 px-1.5 py-[1.5px] rounded font-mono uppercase"
          style={{
            background: 'rgba(236,72,153,0.12)',
            color: '#f9a8d4',
            border: '1px solid rgba(236,72,153,0.32)',
            fontSize: 9.5,
            letterSpacing: '0.12em',
          }}
        >
          <Flame className="w-2.5 h-2.5" strokeWidth={2.5} />
          Top sold
        </span>
        {item.sellerAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.sellerAvatar}
            alt=""
            className="w-4 h-4 rounded-full object-cover"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          />
        ) : (
          <span
            className="w-4 h-4 rounded-full grid place-items-center font-mono text-[8px] text-white"
            style={{ background: 'linear-gradient(135deg,#ec4899,#836EF9)' }}
          >
            {(item.sellerUsername || '?')[0]?.toUpperCase()}
          </span>
        )}
        <span style={{ color: '#e4e4e7' }} className="truncate max-w-[160px]">
          {item.title}
        </span>
        <span style={{ color: '#71717a' }} className="font-mono">
          ·
        </span>
        <span
          style={{ color: '#22c55e', fontSize: 10.5 }}
          className="font-mono inline-flex items-center gap-1"
        >
          <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} />
          {item.sales} sales
        </span>
      </Link>
    );
  }

  const rank = getReputationRank(item.reputationPoints);
  const RankIcon = rank.icon;
  return (
    <Link
      href={item.href}
      className="inline-flex items-center gap-2 hover:brightness-125 transition-all"
      style={{ fontSize: 11.5 }}
    >
      <span
        className="inline-flex items-center gap-1 px-1.5 py-[1.5px] rounded font-mono uppercase"
        style={{
          background: `${rank.color}14`,
          color: rank.color,
          border: `1px solid ${rank.color}38`,
          fontSize: 9.5,
          letterSpacing: '0.12em',
        }}
      >
        <Crown className="w-2.5 h-2.5" strokeWidth={2.5} />
        Top dev
      </span>
      {item.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.avatarUrl}
          alt=""
          className="w-4 h-4 rounded-full object-cover"
          style={{ border: `1px solid ${rank.color}` }}
        />
      ) : (
        <span
          className="w-4 h-4 rounded-full grid place-items-center font-mono text-[8px] text-white"
          style={{ background: 'linear-gradient(135deg,#ec4899,#836EF9)' }}
        >
          {(item.username || '?')[0]?.toUpperCase()}
        </span>
      )}
      <span style={{ color: '#e4e4e7' }} className="truncate max-w-[140px]">
        @{item.username || 'anon'}
      </span>
      <span
        style={{ color: rank.color, fontSize: 10.5 }}
        className="font-mono inline-flex items-center gap-1"
      >
        <RankIcon className="w-2.5 h-2.5" strokeWidth={2.5} />
        {item.reputationPoints.toLocaleString()} rays
      </span>
    </Link>
  );
}
