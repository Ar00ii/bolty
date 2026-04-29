'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bot, GitBranch, Loader2, Package, Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getTokenForListing } from '@/lib/flaunch/launchpad';

import { LaunchWizardModal } from './LaunchWizardModal';

interface PickerListing {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  path: string;
  type: 'REPO' | 'AGENT' | 'BOT' | 'SCRIPT' | 'OTHER';
  typeLabel: string;
  tokenLaunched: boolean;
}

interface InventoryResponse {
  published: {
    repos: Array<{
      id: string;
      name: string;
      description: string | null;
      logoUrl: string | null;
    }>;
    listings: Array<{
      id: string;
      title: string;
      type: string;
    }>;
  };
}

interface ListingDetail {
  id: string;
  description?: string | null;
}

async function hydrateListingDescription(
  listing: { id: string; title: string; type: string },
): Promise<{ description: string; imageUrl: string | null }> {
  // /market/my-inventory gives us title + type + raysEarned but not the
  // full description we need for the wizard's prefill. Fetch lightly.
  try {
    const d = await api.get<ListingDetail & { description?: string | null }>(
      `/market/${listing.id}`,
    );
    return { description: d?.description ?? '', imageUrl: null };
  } catch {
    return { description: '', imageUrl: null };
  }
}

function typeLabel(t: string): string {
  const u = t.toUpperCase();
  if (u === 'AI_AGENT' || u === 'AGENT') return 'Agent';
  if (u === 'BOT') return 'Bot';
  if (u === 'SCRIPT') return 'Script';
  if (u === 'REPO') return 'Repo';
  return 'Item';
}

function normalizeType(t: string): PickerListing['type'] {
  const u = t.toUpperCase();
  if (u === 'AI_AGENT' || u === 'AGENT') return 'AGENT';
  if (u === 'BOT') return 'BOT';
  if (u === 'SCRIPT') return 'SCRIPT';
  if (u === 'REPO') return 'REPO';
  return 'OTHER';
}

export function LaunchYoursModal({
  open,
  onClose,
  inline,
}: {
  open: boolean;
  onClose: () => void;
  /** Render inline (no Modal chrome) when true. */
  inline?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<PickerListing[] | null>(null);
  const [selected, setSelected] = useState<PickerListing | null>(null);
  // Two-step flow: first the mode chooser (null), then the picker.
  // No AI-agent info is rendered while mode is null or 'self'.
  const [mode, setMode] = useState<'self' | 'agent' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const inv = await api.get<InventoryResponse>('/market/my-inventory');
      const published = inv?.published ?? { repos: [], listings: [] };
      const rows: PickerListing[] = [
        ...published.repos.map(
          (r): PickerListing => ({
            id: r.id,
            title: r.name,
            description: r.description ?? '',
            imageUrl: r.logoUrl ?? null,
            path: `/market/repos/${r.id}`,
            type: 'REPO',
            typeLabel: 'Repo',
            tokenLaunched: false,
          }),
        ),
        ...published.listings.map(
          (l): PickerListing => ({
            id: l.id,
            title: l.title,
            description: '',
            imageUrl: null,
            path: `/market/agents/${l.id}`,
            type: normalizeType(l.type),
            typeLabel: typeLabel(l.type),
            tokenLaunched: false,
          }),
        ),
      ];
      // Flag which already have a token (stub + real path both answer this).
      const withStatus = await Promise.all(
        rows.map(async (r) => ({
          ...r,
          tokenLaunched: !!(await getTokenForListing(r.id).catch(() => null)),
        })),
      );
      setListings(withStatus);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!isAuthenticated) {
      setListings([]);
      return;
    }
    load();
  }, [open, isAuthenticated, load]);

  async function pick(listing: PickerListing) {
    // Hydrate full description before opening the wizard
    const hydrated = await hydrateListingDescription({
      id: listing.id,
      title: listing.title,
      type: listing.type,
    });
    setSelected({
      ...listing,
      description: listing.description || hydrated.description,
      imageUrl: listing.imageUrl || hydrated.imageUrl,
    });
  }

  function closeAll() {
    setSelected(null);
    setMode(null);
    onClose();
  }

  function handleWizardClose() {
    setSelected(null);
    setMode(null);
    onClose();
    // Refresh the launchpad grid so the new token shows up
    window.dispatchEvent(new CustomEvent('launchpad:refresh'));
  }

  // Filter listings based on the chosen mode. The two modes are
  // mutually exclusive: self mode is for non-agent items (repos,
  // scripts, "other"); agent mode is for AI_AGENT / BOT listings.
  // This is why picking "Launch (no AI)" should never surface an
  // agent — nothing in the self path touches AI at all.
  const visibleListings = listings?.filter((l) => {
    const isAgent = l.type === 'AGENT' || l.type === 'BOT';
    if (mode === 'agent') return isAgent;
    return !isAgent;
  });

  const pickerBody = !isAuthenticated ? (
    <NotAuthed onClose={onClose} />
  ) : loading ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <ListingSkeleton key={i} />
      ))}
    </div>
  ) : error ? (
    <div className="py-8 text-center">
      <div className="text-[13.5px] text-red-300 font-medium">{error}</div>
      <button
        type="button"
        onClick={load}
        className="mt-3 px-4 py-2 rounded-xl text-[12.5px] text-white transition hover:brightness-110"
        style={{
          background: 'rgba(20,241,149,0.22)',
          border: '1px solid rgba(20,241,149,0.5)',
        }}
      >
        Retry
      </button>
    </div>
  ) : !listings?.length ? (
    <EmptyInventory onClose={onClose} />
  ) : !visibleListings?.length ? (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        background: '#0a0a0c',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="text-[14px] text-white font-medium">
        {mode === 'agent'
          ? 'No AI agent listings yet'
          : 'No non-agent listings to launch from'}
      </div>
      <div className="text-[12px] text-zinc-400 mt-1 font-light">
        {mode === 'agent'
          ? 'Launching with AI requires an AI agent listing.'
          : 'Plain launch is for repos / scripts. For AI agent listings, go back and pick "Launch with AI".'}
      </div>
    </div>
  ) : inline ? (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.04 } },
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1"
    >
      {visibleListings.map((l) => (
        <motion.li
          key={l.id}
          variants={{
            hidden: { opacity: 0, y: 6 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] },
            },
          }}
        >
          <ListingRow listing={l} onLaunch={() => pick(l)} />
        </motion.li>
      ))}
    </motion.ul>
  ) : (
    <ul className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
      {visibleListings.map((l) => (
        <li key={l.id}>
          <ListingRow listing={l} onLaunch={() => pick(l)} />
        </li>
      ))}
    </ul>
  );

  const wizard = selected ? (
    <LaunchWizardModal
      inline={inline}
      open={!!selected}
      onClose={handleWizardClose}
      onLaunched={() => {
        window.dispatchEvent(new CustomEvent('launchpad:refresh'));
      }}
      listingId={selected.id}
      listingTitle={selected.title}
      listingDescription={selected.description}
      listingImageUrl={selected.imageUrl}
      listingUrl={
        typeof window !== 'undefined'
          ? `${window.location.origin}${selected.path}`
          : `https://bolty.network${selected.path}`
      }
      listingPath={selected.path}
      initialLaunchMode={mode ?? 'self'}
    />
  ) : null;

  if (inline) {
    if (!open) return null;
    // Step A: no mode picked yet → show the two-button chooser with
    //         brief explanations. Nothing about AI / agents leaks into
    //         this screen beyond the label on its own card.
    if (!selected && !mode) {
      return (
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[18px] text-white font-medium tracking-tight">
                How do you want to launch?
              </div>
              <div className="text-[13px] text-zinc-400 mt-1 font-light">
                Pick one. You can always come back and launch again with
                the other option later.
              </div>
            </div>
            <button
              type="button"
              onClick={closeAll}
              className="grid place-items-center w-7 h-7 rounded-md text-zinc-500 hover:text-white transition shrink-0 ml-3"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              aria-label="Close"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
          <ModeChooser
            onPick={(m) => {
              setMode(m);
              // Self mode doesn't need a listing — go straight to the
              // wizard with a blank template. User fills everything
              // themselves. No picker, no filter, nothing.
              if (m === 'self') {
                const id = `self-${Date.now().toString(36)}-${Math.random()
                  .toString(36)
                  .slice(2, 8)}`;
                setSelected({
                  id,
                  title: '',
                  description: '',
                  imageUrl: null,
                  path: '/launchpad',
                  type: 'OTHER',
                  typeLabel: 'Token',
                  tokenLaunched: false,
                });
              }
            }}
          />
        </div>
      );
    }
    // Step B: mode picked → show the listing picker (filtered),
    //         or the wizard if a listing has been selected.
    return (
      <div className="relative">
        {selected ? (
          wizard
        ) : (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="mb-2 inline-flex items-center gap-1 text-[11.5px] text-zinc-500 hover:text-white transition"
                >
                  <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10 12L6 8l4-4" />
                  </svg>
                  Back
                </button>
                <div className="text-[18px] text-white font-medium tracking-tight">
                  {mode === 'agent' ? 'Launch with AI' : 'Launch a token'}
                </div>
                <div className="text-[13px] text-zinc-400 mt-1 font-light">
                  {mode === 'agent'
                    ? 'Pick the AI agent that will handle the launch and post the announcement to the community feed.'
                    : 'Pick one of your listings to mint a community token for. You can tweak everything on the next step.'}
                </div>
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="grid place-items-center w-7 h-7 rounded-md text-zinc-500 hover:text-white transition shrink-0 ml-3"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                aria-label="Close"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
            {pickerBody}
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <Modal
        isOpen={open && !selected}
        onClose={closeAll}
        title="Launch a token"
        subtitle="Pick one of your listings to mint a community token for."
        size="md"
      >
        {pickerBody}
      </Modal>

      {wizard}
    </>
  );
}

// ── Sub-views ──────────────────────────────────────────────────────────

function ModeChooser({ onPick }: { onPick: (m: 'self' | 'agent') => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onPick('self')}
        className="text-left p-6 rounded-2xl transition hover:brightness-125"
        style={{
          background: '#000000',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <div
          className="w-11 h-11 rounded-xl grid place-items-center mb-4"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Rocket className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>
        <div className="text-[15px] text-white font-semibold tracking-tight">
          Launch
        </div>
        <div className="text-[12.5px] text-zinc-400 mt-1.5 font-light leading-relaxed">
          You pick the listing, fill the form, sign the transaction from
          your wallet. No automation, no announcements — just a clean
          on-chain launch you control.
        </div>
      </button>

      <button
        type="button"
        onClick={() => onPick('agent')}
        className="text-left p-6 rounded-2xl transition hover:brightness-125"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,241,149,0.25) 0%, rgba(20,241,149,0.08) 100%)',
          border: '1px solid rgba(20,241,149,0.55)',
        }}
      >
        <div
          className="w-11 h-11 rounded-xl grid place-items-center mb-4"
          style={{
            background: 'rgba(20,241,149,0.25)',
            border: '1px solid rgba(20,241,149,0.6)',
          }}
        >
          <Sparkles className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>
        <div className="text-[15px] text-white font-semibold tracking-tight">
          Launch with AI
        </div>
        <div className="text-[12.5px] text-zinc-200 mt-1.5 font-light leading-relaxed">
          Your AI agent handles the launch end-to-end and posts the
          debut to the community feed with the token CA and a direct
          buy link. Only available for your AI agent listings with a
          healthy webhook.
        </div>
      </button>
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-4"
      style={{
        background: '#0a0a0c',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl shrink-0 animate-pulse"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div
          className="h-3 w-2/3 rounded animate-pulse"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
        <div
          className="h-2.5 w-1/4 rounded animate-pulse"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        />
      </div>
    </div>
  );
}

function ListingRow({
  listing,
  onLaunch,
}: {
  listing: PickerListing;
  onLaunch: () => void;
}) {
  const Icon = iconFor(listing.type);
  const accent = accentFor(listing.type);
  return (
    <button
      type="button"
      onClick={onLaunch}
      className="group relative flex items-center gap-3 rounded-2xl p-4 w-full text-left transition hover:brightness-110"
      style={{
        background: '#0a0a0c',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl overflow-hidden grid place-items-center shrink-0"
        style={{
          background: `${accent}14`,
          border: `1px solid ${accent}40`,
        }}
      >
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon className="w-4 h-4" strokeWidth={1.75} style={{ color: accent }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] text-white font-medium truncate tracking-tight">
          {listing.title}
        </div>
        <div
          className="text-[11px] mt-0.5 font-medium"
          style={{ color: accent }}
        >
          {listing.typeLabel}
        </div>
      </div>
      {listing.tokenLaunched ? (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] shrink-0"
          style={{
            color: '#22c55e',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
          }}
        >
          <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
          Live
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white font-medium shrink-0 transition"
          style={{
            background: '#000000',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Rocket className="w-3.5 h-3.5" />
          Select
        </span>
      )}
    </button>
  );
}

function EmptyInventory({ onClose }: { onClose: () => void }) {
  return (
    <div className="py-6 text-center">
      <div
        className="w-12 h-12 rounded-xl mx-auto grid place-items-center mb-3"
        style={{
          background: 'rgba(20,241,149,0.12)',
          boxShadow: 'inset 0 0 0 1px rgba(20,241,149,0.3)',
        }}
      >
        <Package className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.75} />
      </div>
      <div className="text-[13px] text-white font-light">Nothing to launch from yet</div>
      <div className="text-[11.5px] text-zinc-500 font-light mt-1 mb-4 px-4">
        You need at least one published listing. Publish an agent, bot, script, or a repo
        — then come back and launch its token.
      </div>
      <div className="flex items-center justify-center gap-2">
        <Link
          href="/market/agents/publish"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-white transition"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,241,149,0.5) 0%, rgba(20,241,149,0.35) 100%)',
            boxShadow: '0 0 0 1px rgba(20,241,149,0.45)',
          }}
        >
          <Bot className="w-3 h-3" /> Publish an agent
        </Link>
        <Link
          href="/repos"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-zinc-300 hover:text-white transition"
          style={{
            background: 'rgba(255,255,255,0.04)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          <GitBranch className="w-3 h-3" /> Publish a repo
        </Link>
      </div>
    </div>
  );
}

function NotAuthed({ onClose }: { onClose: () => void }) {
  return (
    <div className="py-6 text-center">
      <div className="text-[13px] text-white font-light">Sign in to launch</div>
      <div className="text-[11.5px] text-zinc-500 font-light mt-1 mb-4">
        Only authenticated listing owners can mint tokens.
      </div>
      <Link
        href="/auth"
        onClick={onClose}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-white transition"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,241,149,0.5) 0%, rgba(20,241,149,0.35) 100%)',
          boxShadow: '0 0 0 1px rgba(20,241,149,0.45)',
        }}
      >
        Sign in
      </Link>
    </div>
  );
}

// ── Icon / accent helpers (aligned with listing/types module) ──────────

function iconFor(t: PickerListing['type']) {
  if (t === 'REPO') return GitBranch;
  if (t === 'AGENT') return Bot;
  if (t === 'BOT') return Bot;
  if (t === 'SCRIPT') return Sparkles;
  return Package;
}

function accentFor(t: PickerListing['type']): string {
  if (t === 'REPO') return '#06B6D4';
  if (t === 'AGENT' || t === 'BOT') return '#14F195';
  if (t === 'SCRIPT') return '#EC4899';
  return '#94a3b8';
}
