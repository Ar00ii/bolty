'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';

interface MarketListing {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  price: number;
  currency: string;
  tags: string[];
  status: string;
  agentUrl?: string | null;
  seller: { id: string; username: string | null; avatarUrl: string | null };
  repository: { id: string; name: string; githubUrl: string; language: string | null } | null;
}

const TYPES = ['ALL', 'REPO', 'BOT', 'AI_AGENT', 'SCRIPT', 'OTHER'];

const TYPE_LABELS: Record<string, string> = {
  ALL: 'all',
  REPO: 'repo',
  BOT: 'bot',
  AI_AGENT: 'ai agent',
  SCRIPT: 'script',
  OTHER: 'other',
};

const TYPE_COLORS: Record<string, string> = {
  REPO: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  BOT: 'text-monad-400 border-monad-400/30 bg-monad-400/5',
  AI_AGENT: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  SCRIPT: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  OTHER: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
};

export default function MarketPage() {
  const { isAuthenticated, user } = useAuth();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'REPO' as 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER',
    price: '',
    currency: 'SOL',
    tags: '',
    agentUrl: '',
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type !== 'ALL') params.set('type', type);
      if (search) params.set('search', search);
      const data = await api.get<{ data: MarketListing[] }>(`/market?${params}`);
      setListings(data.data);
    } catch {
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const createListing = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/market', {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        agentUrl: form.agentUrl.trim() || undefined,
      });
      setShowCreate(false);
      setForm({ title: '', description: '', type: 'REPO', price: '', currency: 'SOL', tags: '', agentUrl: '' });
      await fetchListings();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-monad-400 font-mono font-black text-3xl mb-2 tracking-wider">
          MARKET
        </h1>
        <p className="text-terminal-muted text-sm font-mono">
          {'// Trade repos, bots, and scripts. All content is AI-scanned for security.'}
        </p>
      </div>

      {/* Controls */}
      <TerminalCard className="mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="terminal-input flex-1 min-w-48"
          />
          <div className="flex gap-1">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                  type === t
                    ? 'bg-monad-400/10 text-monad-400 border border-monad-400/30'
                    : 'text-terminal-muted hover:text-terminal-text'
                }`}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="btn-neon text-xs py-1.5 px-4"
            >
              + list item
            </button>
          )}
        </div>
      </TerminalCard>

      {/* Create listing form */}
      {showCreate && (
        <TerminalCard title="new_listing" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-terminal-muted text-xs font-mono block mb-1">title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={200}
                placeholder="My Trading Bot v2"
                className="terminal-input w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-terminal-muted text-xs font-mono block mb-1">description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={5000}
                rows={4}
                placeholder="Describe what this does, features, requirements..."
                className="terminal-input w-full resize-none"
              />
            </div>
            <div>
              <label className="text-terminal-muted text-xs font-mono block mb-1">type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
                className="terminal-input w-full"
              >
                {['REPO', 'BOT', 'AI_AGENT', 'SCRIPT', 'OTHER'].map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t.toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-terminal-muted text-xs font-mono block mb-1">price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  className="terminal-input w-full"
                />
              </div>
              <div className="w-24">
                <label className="text-terminal-muted text-xs font-mono block mb-1">currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="terminal-input w-full"
                >
                  <option value="SOL">SOL</option>
                  <option value="ETH">ETH</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            {(form.type === 'AI_AGENT' || form.type === 'BOT') && (
              <div className="md:col-span-2">
                <label className="text-terminal-muted text-xs font-mono block mb-1">
                  agent url <span className="text-zinc-600">(OpenAI, Claude, endpoint...)</span>
                </label>
                <input
                  type="url"
                  value={form.agentUrl}
                  onChange={(e) => setForm({ ...form, agentUrl: e.target.value })}
                  placeholder="https://api.openai.com/... or your agent endpoint"
                  className="terminal-input w-full"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="text-terminal-muted text-xs font-mono block mb-1">tags (comma separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="solana, trading, automation"
                className="terminal-input w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-terminal-muted text-xs font-mono">
              // All listings are AI-scanned for security before going live
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="text-terminal-muted text-xs font-mono hover:text-terminal-text"
              >
                [cancel]
              </button>
              <button
                onClick={createListing}
                disabled={submitting}
                className="btn-neon-solid text-xs py-1.5 px-4 disabled:opacity-50"
              >
                {submitting ? 'scanning...' : 'submit'}
              </button>
            </div>
          </div>
        </TerminalCard>
      )}

      {error && (
        <div className="text-red-400 text-sm font-mono mb-4">ERROR: {error}</div>
      )}

      {/* Listings grid */}
      {loading ? (
        <div className="text-monad-400 font-mono animate-pulse text-center py-16">
          Loading market...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <TerminalCard key={listing.id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="text-terminal-text font-mono font-semibold text-sm leading-tight">
                    {listing.title}
                  </h3>
                  <span className={`shrink-0 text-xs font-mono px-2 py-0.5 rounded border ${TYPE_COLORS[listing.type] || TYPE_COLORS.OTHER}`}>
                    {listing.type.toLowerCase()}
                  </span>
                </div>

                <p className="text-terminal-muted text-xs leading-relaxed mb-3 line-clamp-3">
                  {listing.description}
                </p>

                {listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {listing.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="terminal-badge">{tag}</span>
                    ))}
                  </div>
                )}

                {listing.repository && (
                  <a
                    href={listing.repository.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-monad-400/70 hover:text-monad-400 transition-colors flex items-center gap-1 mb-3"
                  >
                    <span>[gh]</span>
                    <span className="truncate">{listing.repository.name}</span>
                  </a>
                )}
                {listing.agentUrl && (
                  <a
                    href={listing.agentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-emerald-400/70 hover:text-emerald-400 transition-colors flex items-center gap-1 mb-3"
                  >
                    <span>[agent]</span>
                    <span className="truncate">{listing.agentUrl.replace(/^https?:\/\//, '').slice(0, 40)}</span>
                  </a>
                )}

                <div className="text-terminal-muted text-xs flex items-center gap-1">
                  <span className="text-monad-400">@</span>
                  <span>{listing.seller.username || 'anon'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-terminal-border">
                <div className="font-mono text-sm font-bold">
                  {listing.price === 0 ? (
                    <span className="text-green-400">free</span>
                  ) : (
                    <span className="text-monad-400">
                      {listing.price} {listing.currency}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = '/auth';
                      return;
                    }
                    // Contact seller via DM
                    window.location.href = `/dm?peer=${listing.seller.id}`;
                  }}
                  className="btn-neon text-xs py-1 px-3"
                >
                  {listing.price === 0 ? 'get' : 'buy / contact'}
                </button>
              </div>
            </TerminalCard>
          ))}

          {listings.length === 0 && !loading && (
            <div className="col-span-3 text-center py-16 text-terminal-muted font-mono text-sm">
              {'// No listings found. Be the first to list something!'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
