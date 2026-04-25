'use client';

import { Bot, ExternalLink, GitBranch, Heart, Package, Star, X } from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api/client';
import { useFavoriteRepos, useFavorites } from '@/lib/hooks/useFavorites';

interface RepoSummary {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  downloadCount: number;
  isLocked: boolean;
  lockedPriceUsd: number | null;
  user: { username: string; avatarUrl: string | null };
}

interface ListingSummary {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  tags: string[];
  seller: { username: string | null; avatarUrl: string | null } | null;
}

type Tab = 'repos' | 'listings';

export default function FavoritesPage() {
  const [tab, setTab] = useState<Tab>('repos');
  const { ids: repoIds, remove: removeRepo } = useFavoriteRepos();
  const { ids: listingIds, remove: removeListing } = useFavorites();
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRepos = useCallback(async () => {
    if (repoIds.length === 0) {
      setRepos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Bulk lookup — one request instead of N parallel `/repos/:id`
      // fetches. Backend preserves the caller's id ordering.
      const rows = await api.get<RepoSummary[]>(
        `/repos/by-ids?ids=${encodeURIComponent(repoIds.join(','))}`,
      );
      setRepos(Array.isArray(rows) ? rows : []);
    } catch {
      setError('Could not load favorite repos');
    } finally {
      setLoading(false);
    }
  }, [repoIds]);

  const loadListings = useCallback(async () => {
    if (listingIds.length === 0) {
      setListings([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await api.get<ListingSummary[]>(
        `/market/by-ids?ids=${encodeURIComponent(listingIds.join(','))}`,
      );
      setListings(Array.isArray(rows) ? rows : []);
    } catch {
      setError('Could not load favorite listings');
    } finally {
      setLoading(false);
    }
  }, [listingIds]);

  useEffect(() => {
    if (tab === 'repos') void loadRepos();
    else void loadListings();
  }, [tab, loadRepos, loadListings]);

  return (
    <div className="mk-app-page mx-auto max-w-6xl px-4 sm:px-6 py-8" style={{ maxWidth: '72rem' }}>
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-zinc-500 mb-3">
        <Heart className="w-3.5 h-3.5 text-[#EC4899]" />
        <span>Saved for later</span>
      </div>
      <h1 className="text-3xl font-light text-white tracking-[-0.01em]">Favorites</h1>
      <p className="text-sm text-zinc-400 font-light mt-1 max-w-2xl">
        Repos and agents you&apos;ve saved to come back to. Saved privately on this
        device — nothing is shared publicly.
      </p>

      <div className="mt-6 flex items-center gap-1 border-b border-white/[0.06]">
        <TabButton active={tab === 'repos'} onClick={() => setTab('repos')}>
          <GitBranch className="w-3.5 h-3.5 mr-1.5 inline -mt-0.5" />
          Repositories
          <Count>{repoIds.length}</Count>
        </TabButton>
        <TabButton active={tab === 'listings'} onClick={() => setTab('listings')}>
          <Bot className="w-3.5 h-3.5 mr-1.5 inline -mt-0.5" />
          Agents &amp; listings
          <Count>{listingIds.length}</Count>
        </TabButton>
      </div>

      <div className="mt-5">
        {error && <p className="text-sm text-red-400 font-light mb-4">{error}</p>}

        {tab === 'repos' &&
          (repoIds.length === 0 ? (
            <Empty
              icon={GitBranch}
              title="No saved repos"
              subtitle="Tap the star icon on any repo to save it here."
              href="/market/repos"
              action="Browse repos"
            />
          ) : loading && repos.length === 0 ? (
            <LoadingList count={repoIds.length} />
          ) : (
            <ul className="space-y-2">
              {repos.map((r) => (
                <FavoriteRepoRow key={r.id} repo={r} onRemove={() => removeRepo(r.id)} />
              ))}
            </ul>
          ))}

        {tab === 'listings' &&
          (listingIds.length === 0 ? (
            <Empty
              icon={Bot}
              title="No saved agents"
              subtitle="Tap the star icon on any agent or script to save it here."
              href="/market"
              action="Browse marketplace"
            />
          ) : loading && listings.length === 0 ? (
            <LoadingList count={listingIds.length} />
          ) : (
            <ul className="space-y-2">
              {listings.map((l) => (
                <FavoriteListingRow key={l.id} listing={l} onRemove={() => removeListing(l.id)} />
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="relative px-3 py-2 text-[12.5px] font-light transition-colors"
      style={{ color: active ? '#ffffff' : '#9ca3af' }}
    >
      {children}
      {active && (
        <span
          className="absolute left-0 right-0 -bottom-px h-[2px]"
          style={{ background: 'linear-gradient(90deg, #06B6D4, #836EF9, #EC4899)' }}
        />
      )}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono text-zinc-400 bg-white/[0.04]">
      {children}
    </span>
  );
}

function FavoriteRepoRow({ repo, onRemove }: { repo: RepoSummary; onRemove: () => void }) {
  return (
    <li
      className="relative rounded-lg p-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.5), rgba(10,10,14,0.5))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <Link href={`/market/repos/${repo.id}`} className="min-w-0 block">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="w-3.5 h-3.5 text-[#b4a7ff] flex-shrink-0" />
          <span className="text-[13px] text-white font-light truncate">{repo.name}</span>
          {repo.isLocked && repo.lockedPriceUsd && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{
                background: 'rgba(131,110,249,0.1)',
                color: '#b4a7ff',
                boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
              }}
            >
              ${repo.lockedPriceUsd}
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 font-light truncate mt-0.5">
          {repo.description || repo.fullName}
        </p>
        <div className="flex items-center gap-3 text-[10.5px] text-zinc-500 font-light mt-1">
          {repo.language && <span>{repo.language}</span>}
          <span className="inline-flex items-center gap-1">
            <Star className="w-3 h-3" /> {repo.stars}
          </span>
          <span>{repo.downloadCount} downloads</span>
          {repo.user?.username && <span>by @{repo.user.username}</span>}
        </div>
      </Link>
      <button
        onClick={onRemove}
        title="Remove from favorites"
        className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function FavoriteListingRow({
  listing,
  onRemove,
}: {
  listing: ListingSummary;
  onRemove: () => void;
}) {
  return (
    <li
      className="relative rounded-lg p-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.5), rgba(10,10,14,0.5))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <Link
        href={
          listing.type === 'AI_AGENT'
            ? `/market/agents/${listing.id}`
            : `/market/${listing.id}`
        }
        className="min-w-0 block"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="w-3.5 h-3.5 text-[#b4a7ff] flex-shrink-0" />
          <span className="text-[13px] text-white font-light truncate">{listing.title}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{
              background: 'rgba(131,110,249,0.1)',
              color: '#b4a7ff',
              boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
            }}
          >
            {listing.price} {listing.currency}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10.5px] text-zinc-500 font-light mt-1">
          <span>{listing.type}</span>
          {listing.seller?.username && <span>by @{listing.seller.username}</span>}
          {listing.tags?.slice(0, 2).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </Link>
      <button
        onClick={onRemove}
        title="Remove from favorites"
        className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function LoadingList({ count }: { count: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <li
          key={i}
          className="h-16 rounded-lg animate-pulse"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.4), rgba(10,10,14,0.4))',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
          }}
        />
      ))}
    </ul>
  );
}

function Empty({
  icon: Icon,
  title,
  subtitle,
  href,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  href: string;
  action: string;
}) {
  return (
    <div
      className="rounded-xl px-6 py-16 flex flex-col items-center justify-center text-center gap-3"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.4), rgba(10,10,14,0.4))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          background: 'rgba(236,72,153,0.08)',
          boxShadow: 'inset 0 0 0 1px rgba(236,72,153,0.25)',
        }}
      >
        <Icon className="w-5 h-5 text-[#EC4899]" />
      </div>
      <div>
        <p className="text-sm text-white font-light">{title}</p>
        <p className="text-xs text-zinc-500 font-light mt-1">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-white"
        style={{
          background: 'linear-gradient(180deg, rgba(236,72,153,0.38), rgba(236,72,153,0.14))',
          boxShadow: 'inset 0 0 0 1px rgba(236,72,153,0.48)',
        }}
      >
        <Package className="w-3.5 h-3.5" />
        {action}
      </Link>
    </div>
  );
}
