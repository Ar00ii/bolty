'use client';

import { Rocket, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { FLAUNCH_LAUNCHPAD_ENABLED } from '@/lib/flaunch/feature';
import { getTokenForListing } from '@/lib/flaunch/launchpad';
import type { TokenInfo } from '@/lib/flaunch/types';

import { LaunchWizardModal } from './LaunchWizardModal';
import { TokenWidget } from './TokenWidget';

interface Props {
  listingId: string;
  listingTitle: string;
  listingDescription: string;
  listingImageUrl: string | null;
  isOwner: boolean;
}

export function TokenLaunchCard({
  listingId,
  listingTitle,
  listingDescription,
  listingImageUrl,
  isOwner,
}: Props) {
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const load = useCallback(() => {
    if (!FLAUNCH_LAUNCHPAD_ENABLED) {
      setLoaded(true);
      return;
    }
    getTokenForListing(listingId)
      .then((t) => setToken(t))
      .finally(() => setLoaded(true));
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  // Gate: feature flag OFF → render nothing
  if (!FLAUNCH_LAUNCHPAD_ENABLED) return null;
  if (!loaded) return null;

  // Already launched → widget for everyone
  if (token) {
    return <TokenWidget token={token} />;
  }

  // Not launched, not owner → keep the detail page uncluttered
  if (!isOwner) return null;

  // Owner, no token → CTA
  const listingUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/market/agents/${listingId}`
      : `https://bolty.network/market/agents/${listingId}`;

  return (
    <>
      <div
        className="rounded-xl p-4 flex items-center gap-4"
        style={{
          background:
            'linear-gradient(135deg, rgba(131,110,249,0.14) 0%, rgba(6,182,212,0.08) 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(131,110,249,0.3), 0 0 24px -8px rgba(131,110,249,0.4)',
        }}
      >
        <div
          className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(131,110,249,0.35) 0%, rgba(131,110,249,0.12) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.5)',
          }}
        >
          <Rocket className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-[#b4a7ff] font-medium mb-0.5">
            <Sparkles className="w-3 h-3" /> Launchpad
          </div>
          <div className="text-[13.5px] text-white font-light">
            Launch a token for this listing
          </div>
          <div className="text-[11.5px] text-zinc-400 font-light mt-0.5">
            Fair-launch on Base via Flaunch. You pay gas, keep the creator share forever.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-light text-white transition hover:brightness-110 shrink-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(131,110,249,0.55) 0%, rgba(131,110,249,0.4) 100%)',
            boxShadow:
              '0 0 0 1px rgba(131,110,249,0.5), 0 0 20px -8px rgba(131,110,249,0.6)',
          }}
        >
          Launch token
        </button>
      </div>

      <LaunchWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onLaunched={() => load()}
        listingId={listingId}
        listingTitle={listingTitle}
        listingDescription={listingDescription}
        listingImageUrl={listingImageUrl}
        listingUrl={listingUrl}
      />
    </>
  );
}
