'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Globe,
  Pencil,
  Send,
  TrendingDown,
  TrendingUp,
  Twitter,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import type { TokenInfo } from '@/lib/flaunch/types';

import { EditTokenModal } from './EditTokenModal';

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
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();

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

            <div className="mt-3">
              <CopyCaButton address={current.tokenAddress} />
            </div>

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

      {/* Social links + owner edit — bottom-right edge, above nav arrows.
          Socials: one round pill per configured link. Edit pencil only
          renders if the auth'd user is the token's creator. */}
      <div className="absolute right-4 bottom-16 flex items-center gap-1.5 z-10">
        <SocialCluster socials={current.socials} />
        {user?.username &&
          current.creatorUsername &&
          user.username.toLowerCase() === current.creatorUsername.toLowerCase() && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label="Edit token"
              title="Edit banner, logo and links"
              className="grid place-items-center w-8 h-8 rounded-full text-white/70 hover:text-white transition"
              style={{
                background: 'rgba(131,110,249,0.4)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(131,110,249,0.6)',
              }}
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
      </div>

      <EditTokenModal
        open={editOpen}
        token={editOpen ? current : null}
        onClose={() => setEditOpen(false)}
      />

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

function CopyCaButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!address || typeof navigator === 'undefined' || !navigator.clipboard) return;
      navigator.clipboard.writeText(address).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [address],
  );
  return (
    <button
      type="button"
      onClick={onCopy}
      title={address}
      className="inline-flex items-center gap-2.5 pl-3 pr-3.5 py-2 rounded-lg text-[12px] font-mono transition hover:brightness-125"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: copied ? '#22c55e' : '#ffffff',
      }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.18em] font-medium shrink-0"
        style={{ color: copied ? '#22c55e' : 'rgba(255,255,255,0.6)' }}
      >
        CA
      </span>
      <span className="tabular-nums break-all">{address}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
      ) : (
        <Copy className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
      )}
    </button>
  );
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

function SocialCluster({ socials }: { socials: TokenInfo['socials'] }) {
  if (!socials) return null;
  const items: Array<[string | null, React.ReactNode, string]> = [
    [socials.websiteUrl, <Globe key="w" className="w-3.5 h-3.5" strokeWidth={2} />, 'Website'],
    [socials.githubUrl, <GithubMark key="g" />, 'GitHub'],
    [socials.twitterUrl, <Twitter key="t" className="w-3.5 h-3.5" strokeWidth={2} />, 'X / Twitter'],
    [socials.telegramUrl, <Send key="tg" className="w-3.5 h-3.5" strokeWidth={2} />, 'Telegram'],
    [socials.discordUrl, <DiscordMarkCluster key="d" />, 'Discord'],
  ];
  const active = items.filter(([url]) => !!url);
  if (active.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {active.map(([url, icon, label]) => (
        <a
          key={label}
          href={url as string}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="grid place-items-center w-8 h-8 rounded-full text-white/80 hover:text-white transition hover:brightness-125"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}

function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
      <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.39v-1.34c-2.23.48-2.7-1.08-2.7-1.08-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.05 1.22.83 1.22.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82A7.66 7.66 0 0 1 8 4.04c.68.01 1.37.1 2.01.28 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.66 3.95.29.25.54.74.54 1.5v2.22c0 .22.15.47.55.39A8 8 0 0 0 8 0Z" />
    </svg>
  );
}

function DiscordMarkCluster() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.201.36-.435.846-.596 1.228a18.27 18.27 0 0 0-5.924 0A12.64 12.64 0 0 0 9.44 3c-1.301.22-2.56.55-3.76 1.37-2.37 3.53-3.01 6.97-2.69 10.36.005.02.018.04.04.05 1.58 1.16 3.11 1.87 4.62 2.33.01.01.03.01.04 0 .34-.46.64-.95.9-1.46.01-.02 0-.05-.02-.06-.48-.18-.93-.4-1.37-.65-.02-.01-.02-.04 0-.06.09-.07.18-.14.27-.21.02-.01.04-.02.06-.01 2.88 1.32 6 1.32 8.85 0 .02-.01.04 0 .06.01.09.07.18.14.27.21.02.02.02.05 0 .06-.44.26-.89.47-1.37.65-.02.01-.03.04-.02.06.27.51.57 1 .9 1.46.02.01.04.01.05 0 1.52-.46 3.05-1.17 4.63-2.33.02-.01.03-.03.04-.05.39-3.91-.71-7.33-3.01-10.36-.01-.02-.02-.03-.04-.04ZM8.02 12.66c-.9 0-1.65-.83-1.65-1.85 0-1.02.73-1.85 1.65-1.85.93 0 1.66.84 1.65 1.85 0 1.02-.73 1.85-1.65 1.85Zm7.97 0c-.9 0-1.65-.83-1.65-1.85 0-1.02.73-1.85 1.65-1.85.93 0 1.66.84 1.65 1.85 0 1.02-.72 1.85-1.65 1.85Z" />
    </svg>
  );
}

