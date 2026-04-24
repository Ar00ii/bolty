'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import type { TokenInfo } from '@/lib/flaunch/types';

/**
 * OpenSea-style hero carousel. Rotates through ~5 featured tokens,
 * each slide has a token-image background with a readable overlay,
 * identity + stats in the bottom-left, and 3 smaller preview cards
 * on the right so the user can see what's coming.
 *
 * Selection rule: top by 24h volume, fallback to most-recently-
 * launched when volume is low. The parent hands us a pre-filtered
 * list so we stay dumb.
 */

const ROTATE_MS = 7000;
const MIN_COUNT = 1;
const MAX_COUNT = 5;

function formatUsd(n: number): string {
  if (!n || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.0001) return `$${n.toPrecision(3)}`;
  const expOf10 = Math.floor(Math.log10(n));
  const leadingZeros = -expOf10 - 1;
  if (leadingZeros < 4) return `$${n.toFixed(8)}`;
  const sig =
    (n * Math.pow(10, -expOf10))
      .toPrecision(2)
      .replace('.', '')
      .replace(/0+$/, '') || '1';
  const subChars = '₀₁₂₃₄₅₆₇₈₉';
  const sub = String(leadingZeros)
    .split('')
    .map((d) => subChars[Number(d)])
    .join('');
  return `$0.0${sub}${sig}`;
}

function formatEth(n: number): string {
  if (!n) return '0';
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(3);
  if (n >= 0.0001) return n.toFixed(5);
  return n.toExponential(2);
}

export function FeaturedCarousel({ tokens }: { tokens: TokenInfo[] }) {
  const slides = useMemo(() => {
    if (!tokens?.length) return [];
    // Top by 24h volume, fallback to recency when everything is
    // pre-trade. Keep MAX_COUNT.
    const sorted = [...tokens].sort((a, b) => {
      if (b.volume24hEth !== a.volume24hEth) return b.volume24hEth - a.volume24hEth;
      return new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime();
    });
    return sorted.slice(0, MAX_COUNT);
  }, [tokens]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < MIN_COUNT + 1 || paused) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % slides.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [slides.length, paused]);

  const go = useCallback(
    (dir: 'prev' | 'next') => {
      if (slides.length === 0) return;
      setActive((a) =>
        dir === 'next'
          ? (a + 1) % slides.length
          : (a - 1 + slides.length) % slides.length,
      );
    },
    [slides.length],
  );

  if (slides.length === 0) return null;

  const current = slides[active];

  return (
    <section
      className="relative overflow-hidden rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        background: '#0a0a0e',
        border: '1px solid rgba(255,255,255,0.08)',
        minHeight: 520,
      }}
    >
      {/* Background image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.tokenAddress}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {current.bannerUrl || current.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.bannerUrl ?? current.imageUrl ?? ''}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(110%) brightness(0.7)' }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  'linear-gradient(135deg, #1a1028 0%, #836EF9 50%, #06B6D4 100%)',
              }}
            />
          )}
          {/* Readability overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(6,6,12,0.88) 0%, rgba(6,6,12,0.55) 55%, rgba(6,6,12,0.1) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(0deg, rgba(10,10,14,0.9) 0%, transparent 50%)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative flex p-6 lg:p-10 min-h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.tokenAddress + ':content'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col justify-end max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-2 text-[10.5px] uppercase tracking-[0.18em] text-[#b4a7ff] font-medium">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded"
                style={{
                  background: 'rgba(131,110,249,0.2)',
                  boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4)',
                }}
              >
                ★
              </span>
              Featured on Launchpad
            </div>
            <Link
              href={`/launchpad/${current.tokenAddress}`}
              className="inline-flex items-center gap-3 hover:brightness-110 transition"
            >
              <div
                className="w-14 h-14 rounded-2xl overflow-hidden shrink-0"
                style={{
                  background: 'rgba(131,110,249,0.12)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.15), 0 4px 24px rgba(0,0,0,0.4)',
                }}
              >
                {current.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[11px] font-mono text-white/80">
                    ${current.symbol.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-3xl md:text-4xl text-white font-light truncate leading-none">
                  {current.name}
                </h2>
                <div className="mt-1 text-[12px] font-mono text-white/60 truncate">
                  ${current.symbol}
                  {current.creatorUsername && (
                    <span className="text-white/40">
                      {' · '}
                      by{' '}
                      <span className="text-white/70">@{current.creatorUsername}</span>
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {current.description && (
              <p className="mt-4 text-[13px] text-white/70 font-light leading-relaxed line-clamp-2 max-w-xl">
                {current.description.split('\n')[0]}
              </p>
            )}

            <div
              className="mt-5 inline-flex items-stretch rounded-xl overflow-hidden self-start"
              style={{
                background: 'rgba(10,10,14,0.75)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <StatCell label="Price" value={formatUsd(current.priceUsd)} accent="#ffffff" />
              <StatCell label="Mcap" value={formatUsd(current.marketCapUsd)} accent="#e4e4e7" />
              <StatCell
                label="24h Vol"
                value={`${formatEth(current.volume24hEth)} ETH`}
                accent="#e4e4e7"
              />
              <StatCell
                label="Holders"
                value={current.holders.toLocaleString()}
                accent="#e4e4e7"
                icon={<Users className="w-2.5 h-2.5 text-white/50" strokeWidth={2} />}
              />
              <StatCell
                label="24h"
                value={formatChange(current.priceChange24hPercent)}
                accent={current.priceChange24hPercent >= 0 ? '#22c55e' : '#ef4444'}
                icon={
                  current.priceChange24hPercent >= 0 ? (
                    <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.2} />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.2} />
                  )
                }
                last
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation controls */}
      {slides.length > 1 && (
        <>
          {/* Prev / Next cluster — bottom-right so they don't overlap
               the title + stat pills that sit in the bottom-left */}
          <div className="absolute right-4 bottom-4 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={() => go('prev')}
              aria-label="Previous"
              className="grid place-items-center w-8 h-8 rounded-full text-white/70 hover:text-white transition"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => go('next')}
              aria-label="Next"
              className="grid place-items-center w-8 h-8 rounded-full text-white/70 hover:text-white transition"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Dot indicators — bottom-left so they sit under the content */}
          <div className="absolute left-6 lg:left-8 bottom-5 flex items-center gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="transition"
                style={{
                  width: i === active ? 22 : 8,
                  height: 5,
                  borderRadius: 3,
                  background:
                    i === active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function formatChange(change: number): string {
  const up = change >= 0;
  return `${up ? '+' : '-'}${Math.abs(change).toFixed(2)}%`;
}

function StatCell({
  label,
  value,
  accent,
  icon,
  last,
}: {
  label: string;
  value: string;
  accent: string;
  icon?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex flex-col justify-center px-5 py-3 min-w-[96px]"
      style={{
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="text-[9.5px] uppercase tracking-[0.16em] text-white/45 font-medium">
        {label}
      </div>
      <div
        className="mt-1 text-[14px] font-mono tabular-nums inline-flex items-center gap-1 whitespace-nowrap"
        style={{ color: accent }}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}

