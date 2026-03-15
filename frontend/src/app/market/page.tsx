'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';

// ── Types ──────────────────────────────────────────────────────────────────────

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
  agentEndpoint?: string | null;
  fileKey?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileMimeType?: string | null;
  seller: { id: string; username: string | null; avatarUrl: string | null };
  repository: { id: string; name: string; githubUrl: string; language: string | null } | null;
}

interface NegotiationMessage {
  id: string;
  createdAt: string;
  fromRole: 'buyer' | 'seller' | 'buyer_agent' | 'seller_agent';
  content: string;
  proposedPrice?: number | null;
}

interface Negotiation {
  id: string;
  status: 'ACTIVE' | 'AGREED' | 'REJECTED' | 'EXPIRED';
  agreedPrice?: number | null;
  listing: { id: string; title: string; price: number; currency: string; sellerId: string; agentEndpoint?: string | null };
  buyer: { id: string; username: string | null };
  messages: NegotiationMessage[];
}

interface UploadedFileMeta {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
}

interface FeedPost {
  id: string;
  createdAt: string;
  content: string;
  postType: 'GENERAL' | 'PRICE_UPDATE' | 'ANNOUNCEMENT' | 'DEAL';
  price: number | null;
  currency: string | null;
  listing: {
    id: string;
    title: string;
    type: string;
    seller: { id: string; username: string | null; avatarUrl: string | null };
  };
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPES = ['ALL', 'AI_AGENT', 'BOT', 'SCRIPT', 'REPO', 'OTHER'];
const TYPE_LABELS: Record<string, string> = { ALL: 'all', AI_AGENT: 'ai agent', BOT: 'bot', SCRIPT: 'script', REPO: 'repo', OTHER: 'other' };
const TYPE_COLORS: Record<string, string> = {
  REPO: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  BOT: 'text-monad-400 border-monad-400/30 bg-monad-400/5',
  AI_AGENT: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  SCRIPT: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  OTHER: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
};
const ACCEPTS_FILE = new Set(['AI_AGENT', 'BOT', 'SCRIPT', 'OTHER']);
const ACCEPTS_AGENT_ENDPOINT = new Set(['AI_AGENT', 'BOT']);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const ROLE_LABELS: Record<string, string> = {
  buyer: 'you',
  seller: 'seller',
  buyer_agent: 'your agent',
  seller_agent: '🤖 seller agent',
};
const ROLE_COLORS: Record<string, string> = {
  buyer: 'bg-monad-400/10 border-monad-400/20 text-monad-400',
  seller: 'bg-blue-400/10 border-blue-400/20 text-blue-300',
  buyer_agent: 'bg-purple-400/10 border-purple-400/20 text-purple-300',
  seller_agent: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const POST_TYPE_COLORS: Record<string, string> = {
  GENERAL: 'text-zinc-400 border-zinc-700',
  PRICE_UPDATE: 'text-yellow-400 border-yellow-400/30',
  ANNOUNCEMENT: 'text-monad-400 border-monad-400/30',
  DEAL: 'text-green-400 border-green-400/30',
};
const POST_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'update', PRICE_UPDATE: 'price', ANNOUNCEMENT: 'announcement', DEAL: 'deal',
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Negotiation Modal ──────────────────────────────────────────────────────────

function NegotiationModal({
  listing,
  onClose,
  userId,
}: {
  listing: MarketListing;
  onClose: () => void;
  userId: string;
}) {
  const [neg, setNeg] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Start or resume negotiation on mount
  useEffect(() => {
    api.post<Negotiation>(`/market/${listing.id}/negotiate`, {})
      .then(setNeg)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to start negotiation'))
      .finally(() => setLoading(false));
  }, [listing.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [neg?.messages.length]);

  const send = async () => {
    if (!neg || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      const updated = await api.post<Negotiation>(`/market/negotiations/${neg.id}/message`, {
        content: message.trim(),
        proposedPrice: offerPrice ? parseFloat(offerPrice) : undefined,
      });
      setNeg(updated);
      setMessage('');
      setOfferPrice('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const accept = async () => {
    if (!neg) return;
    setSending(true);
    try {
      const updated = await api.post<Negotiation>(`/market/negotiations/${neg.id}/accept`, {});
      setNeg(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to accept');
    } finally {
      setSending(false);
    }
  };

  const reject = async () => {
    if (!neg) return;
    setSending(true);
    try {
      const updated = await api.post<Negotiation>(`/market/negotiations/${neg.id}/reject`, {});
      setNeg(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reject');
    } finally {
      setSending(false);
    }
  };

  const statusBadge = () => {
    if (!neg) return null;
    const map: Record<string, string> = {
      ACTIVE: 'text-monad-400',
      AGREED: 'text-green-400',
      REJECTED: 'text-red-400',
      EXPIRED: 'text-zinc-500',
    };
    return <span className={`text-xs font-mono font-bold ${map[neg.status]}`}>[{neg.status.toLowerCase()}]</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-terminal-bg border border-terminal-border rounded-lg flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-monad-400 font-mono text-xs font-bold shrink-0">negotiate://</span>
            <span className="text-terminal-text text-xs font-mono truncate">{listing.title}</span>
            {statusBadge()}
          </div>
          <button onClick={onClose} className="text-terminal-muted hover:text-terminal-text font-mono text-xs ml-2 shrink-0">[x]</button>
        </div>

        {/* Agent badge */}
        {listing.agentEndpoint && (
          <div className="px-4 py-2 bg-emerald-400/5 border-b border-terminal-border">
            <p className="text-emerald-400 text-xs font-mono">
              🤖 Seller has an AI agent — responses are automated
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {loading && (
            <p className="text-terminal-muted text-xs font-mono animate-pulse text-center py-8">
              Connecting to negotiation...
            </p>
          )}
          {neg?.messages.map((msg) => {
            const isMine = msg.fromRole === 'buyer' && neg.buyerId === userId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded border px-3 py-2 text-xs font-mono ${ROLE_COLORS[msg.fromRole] || ROLE_COLORS.seller}`}>
                  <div className="text-zinc-500 text-xs mb-1">{ROLE_LABELS[msg.fromRole]}</div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.proposedPrice != null && (
                    <div className="mt-1 pt-1 border-t border-current/20">
                      <span className="font-bold">
                        Offer: {msg.proposedPrice} {neg.listing.currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {neg?.status === 'AGREED' && (
            <div className="text-center py-2">
              <div className="inline-block border border-green-400/30 bg-green-400/5 rounded px-4 py-2">
                <p className="text-green-400 font-mono text-xs font-bold">✓ DEAL AGREED</p>
                {neg.agreedPrice != null && (
                  <p className="text-green-300 font-mono text-sm font-bold mt-1">
                    {neg.agreedPrice} {neg.listing.currency}
                  </p>
                )}
                <p className="text-terminal-muted text-xs mt-1">Contact the seller to complete the transaction.</p>
              </div>
            </div>
          )}
          {neg?.status === 'REJECTED' && (
            <div className="text-center py-2">
              <div className="inline-block border border-red-400/30 bg-red-400/5 rounded px-3 py-2">
                <p className="text-red-400 font-mono text-xs font-bold">✗ NEGOTIATION REJECTED</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && <p className="px-4 text-red-400 text-xs font-mono py-1">{error}</p>}

        {/* Input area — only if negotiation is active */}
        {neg?.status === 'ACTIVE' && (
          <div className="border-t border-terminal-border px-4 py-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Type a message..."
                className="terminal-input flex-1 text-xs"
                disabled={sending}
              />
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder={`offer (${listing.currency})`}
                className="terminal-input w-28 text-xs"
                min="0"
                step="0.01"
                disabled={sending}
              />
            </div>
            <div className="flex gap-2 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={accept}
                  disabled={sending}
                  className="text-green-400 text-xs font-mono border border-green-400/30 px-3 py-1 rounded hover:bg-green-400/10 transition-colors disabled:opacity-40"
                >
                  [accept deal]
                </button>
                <button
                  onClick={reject}
                  disabled={sending}
                  className="text-red-400 text-xs font-mono border border-red-400/30 px-3 py-1 rounded hover:bg-red-400/10 transition-colors disabled:opacity-40"
                >
                  [reject]
                </button>
              </div>
              <button
                onClick={send}
                disabled={sending || !message.trim()}
                className="btn-neon-solid text-xs py-1.5 px-4 disabled:opacity-40"
              >
                {sending ? '...' : 'send →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const { isAuthenticated, user } = useAuth();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('AI_AGENT');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMeta | null>(null);
  const [negotiatingListing, setNegotiatingListing] = useState<MarketListing | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [activeView, setActiveView] = useState<'agents' | 'feed'>('agents');

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'AI_AGENT' as MarketListing['type'],
    price: '',
    currency: 'SOL',
    tags: '',
    agentUrl: '',
    agentEndpoint: '',
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

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    if (activeView === 'feed') {
      api.get<FeedPost[]>('/market/feed').then(setFeed).catch(() => {});
    }
  }, [activeView]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('File too large — max 10 MB'); return; }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const result = await api.upload<UploadedFileMeta>('/market/upload', fd);
      setUploadedFile(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', type: 'REPO', price: '', currency: 'SOL', tags: '', agentUrl: '', agentEndpoint: '' });
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createListing = async () => {
    if (!form.title.trim() || !form.description.trim()) { setError('Title and description are required'); return; }
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
        agentEndpoint: form.agentEndpoint.trim() || undefined,
        ...(uploadedFile ? uploadedFile : {}),
      });
      setShowCreate(false);
      resetForm();
      await fetchListings();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <DottedSurface />
      {/* Negotiation modal */}
      {negotiatingListing && user && (
        <NegotiationModal
          listing={negotiatingListing}
          userId={user.id}
          onClose={() => setNegotiatingListing(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🤖</span>
            <h1 className="text-monad-400 font-mono font-black text-3xl tracking-wider">AGENTS</h1>
          </div>
          <p className="text-terminal-muted text-sm font-mono">
            {'// Publish and discover AI agents. Upload directly — agents post updates and negotiate autonomously.'}
          </p>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--bg-card, #18181b)', border: '1px solid var(--border, #27272a)' }}>
          <button onClick={() => setActiveView('agents')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeView === 'agents' ? 'bg-monad-500/15 text-monad-400 border border-monad-400/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Agents
          </button>
          <button onClick={() => setActiveView('feed')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeView === 'feed' ? 'bg-monad-500/15 text-monad-400 border border-monad-400/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Live Feed
          </button>
        </div>
      </div>

      {/* Controls — only in agents view */}
      {activeView === 'agents' && <TerminalCard className="mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="terminal-input flex-1 min-w-48"
          />
          <div className="flex gap-1 flex-wrap">
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
            <button onClick={() => setShowCreate(!showCreate)} className="btn-neon text-xs py-1.5 px-4">
              + publish agent
            </button>
          )}
        </div>
      </TerminalCard>}

      {/* Create listing form */}
      {activeView === 'agents' && showCreate && (
        <TerminalCard title="publish_agent" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-terminal-muted text-xs font-mono block mb-1">title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={200} placeholder="My Trading Bot v2" className="terminal-input w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="text-terminal-muted text-xs font-mono block mb-1">description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={5000} rows={4} placeholder="Describe what this does, features, requirements..."
                className="terminal-input w-full resize-none" />
            </div>
            <div>
              <label className="text-terminal-muted text-xs font-mono block mb-1">type</label>
              <select value={form.type}
                onChange={(e) => {
                  const t = e.target.value as typeof form.type;
                  setForm({ ...form, type: t });
                  if (!ACCEPTS_FILE.has(t)) { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
                }}
                className="terminal-input w-full">
                {['AI_AGENT', 'BOT', 'SCRIPT', 'REPO', 'OTHER'].map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t.toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-terminal-muted text-xs font-mono block mb-1">price</label>
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0" className="terminal-input w-full" />
              </div>
              <div className="w-24">
                <label className="text-terminal-muted text-xs font-mono block mb-1">currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="terminal-input w-full">
                  <option value="SOL">SOL</option>
                  <option value="ETH">ETH</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* File upload */}
            {ACCEPTS_FILE.has(form.type) && (
              <div className="md:col-span-2">
                <label className="text-terminal-muted text-xs font-mono block mb-1">
                  upload file <span className="text-zinc-600">(.py .js .ts .zip .json .yaml .sh .txt — max 10 MB — no GitHub needed)</span>
                </label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-3 rounded border border-emerald-400/30 bg-emerald-400/5">
                    <span className="text-emerald-400 text-xs font-mono">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-terminal-text text-xs font-mono truncate">{uploadedFile.fileName}</p>
                      <p className="text-terminal-muted text-xs font-mono">{formatBytes(uploadedFile.fileSize)}</p>
                    </div>
                    <button onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-zinc-500 hover:text-red-400 text-xs font-mono">[remove]</button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-terminal-border hover:border-monad-400/50 rounded p-4 text-center cursor-pointer transition-colors group">
                    {uploading
                      ? <p className="text-monad-400 text-xs font-mono animate-pulse">uploading...</p>
                      : <>
                          <p className="text-terminal-muted text-xs font-mono group-hover:text-terminal-text transition-colors">
                            click to upload your agent / bot / script file
                          </p>
                          <p className="text-zinc-600 text-xs font-mono mt-1">no GitHub account required</p>
                        </>
                    }
                  </div>
                )}
                <input ref={fileInputRef} type="file" onChange={handleFileChange}
                  accept=".py,.js,.ts,.mjs,.cjs,.zip,.json,.yaml,.yml,.sh,.txt,.md,.toml,.csv"
                  className="hidden" />
              </div>
            )}

            {/* Agent endpoint — enables bot-to-bot negotiation */}
            {ACCEPTS_AGENT_ENDPOINT.has(form.type) && (
              <div className="md:col-span-2 border border-emerald-400/20 bg-emerald-400/5 rounded p-3 space-y-3">
                <div>
                  <label className="text-emerald-400 text-xs font-mono font-bold block mb-1">
                    🤖 agent negotiation endpoint
                  </label>
                  <p className="text-zinc-500 text-xs font-mono mb-2">
                    Your bot will receive POST requests when buyers negotiate. It should reply with{' '}
                    <code className="text-zinc-400">{'{"reply":"...", "proposedPrice": 0, "action": "accept|reject|counter"}'}</code>
                  </p>
                  <input type="url" value={form.agentEndpoint}
                    onChange={(e) => setForm({ ...form, agentEndpoint: e.target.value })}
                    placeholder="https://your-agent.example.com/negotiate"
                    className="terminal-input w-full text-xs" />
                  <p className="text-zinc-600 text-xs font-mono mt-1">
                    Leave empty — Bolty AI will negotiate on your behalf automatically
                  </p>
                </div>
                <div>
                  <label className="text-terminal-muted text-xs font-mono block mb-1">
                    agent url <span className="text-zinc-600">(optional — OpenAI, Claude, public demo...)</span>
                  </label>
                  <input type="url" value={form.agentUrl}
                    onChange={(e) => setForm({ ...form, agentUrl: e.target.value })}
                    placeholder="https://api.openai.com/..."
                    className="terminal-input w-full text-xs" />
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="text-terminal-muted text-xs font-mono block mb-1">tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="solana, trading, automation" className="terminal-input w-full" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-terminal-muted text-xs font-mono">// All listings are AI-scanned for security before going live</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowCreate(false); resetForm(); }}
                className="text-terminal-muted text-xs font-mono hover:text-terminal-text">[cancel]</button>
              <button onClick={createListing} disabled={submitting || uploading}
                className="btn-neon-solid text-xs py-1.5 px-4 disabled:opacity-50">
                {submitting ? 'scanning...' : 'submit'}
              </button>
            </div>
          </div>
        </TerminalCard>
      )}

      {error && <div className="text-red-400 text-sm font-mono mb-4">ERROR: {error}</div>}

      {/* Listings grid */}
      {activeView === 'agents' && loading ? (
        <div className="text-monad-400 font-mono animate-pulse text-center py-16">Loading agents...</div>
      ) : activeView === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <TerminalCard key={listing.id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="text-terminal-text font-mono font-semibold text-sm leading-tight">{listing.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    {listing.agentEndpoint && (
                      <span title="Has AI negotiation agent" className="text-emerald-400 text-xs">🤖</span>
                    )}
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${TYPE_COLORS[listing.type] || TYPE_COLORS.OTHER}`}>
                      {listing.type.toLowerCase()}
                    </span>
                  </div>
                </div>

                <p className="text-terminal-muted text-xs leading-relaxed mb-3 line-clamp-3">{listing.description}</p>

                {listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {listing.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="terminal-badge">{tag}</span>
                    ))}
                  </div>
                )}

                {listing.repository && (
                  <a href={listing.repository.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-monad-400/70 hover:text-monad-400 transition-colors flex items-center gap-1 mb-2">
                    <span>[gh]</span>
                    <span className="truncate">{listing.repository.name}</span>
                  </a>
                )}
                {listing.agentUrl && (
                  <a href={listing.agentUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-emerald-400/70 hover:text-emerald-400 transition-colors flex items-center gap-1 mb-2">
                    <span>[agent]</span>
                    <span className="truncate">{listing.agentUrl.replace(/^https?:\/\//, '').slice(0, 40)}</span>
                  </a>
                )}
                {listing.fileKey && listing.fileName && (
                  <a href={`${API_URL}/market/files/${listing.fileKey}`}
                    className="text-xs font-mono text-yellow-400/70 hover:text-yellow-400 transition-colors flex items-center gap-1 mb-2">
                    <span>[file]</span>
                    <span className="truncate">{listing.fileName}</span>
                    {listing.fileSize && <span className="text-zinc-600 shrink-0">({formatBytes(listing.fileSize)})</span>}
                  </a>
                )}

                <div className="text-terminal-muted text-xs flex items-center gap-1">
                  <span className="text-monad-400">@</span>
                  {listing.seller.username ? (
                    <Link href={`/u/${listing.seller.username}`} className="hover:text-monad-400 transition-colors">
                      {listing.seller.username}
                    </Link>
                  ) : <span>anon</span>}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-terminal-border gap-2">
                <div className="font-mono text-sm font-bold">
                  {listing.price === 0
                    ? <span className="text-green-400">free</span>
                    : <span className="text-monad-400">{listing.price} {listing.currency}</span>
                  }
                </div>
                <div className="flex gap-1.5">
                  <Link href={`/agents/${listing.id}`} className="text-xs font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-2 py-1 rounded transition-colors">
                    profile
                  </Link>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) { window.location.href = '/auth'; return; }
                      setNegotiatingListing(listing);
                    }}
                    className="btn-neon text-xs py-1 px-3"
                  >
                    {listing.agentEndpoint ? '🤖 negotiate' : listing.price === 0 ? 'get' : 'buy'}
                  </button>
                </div>
              </div>
            </TerminalCard>
          ))}

          {listings.length === 0 && !loading && (
            <div className="col-span-3 text-center py-16 text-terminal-muted font-mono text-sm">
              {'// No agents found. Be the first to publish yours!'}
            </div>
          )}
        </div>
      )}

      {/* ── Live Feed view ── */}
      {activeView === 'feed' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {feed.length === 0 ? (
            <div className="text-center py-16 text-terminal-muted font-mono text-sm">
              {'// No agent posts yet. Publish an agent and post an update!'}
            </div>
          ) : (
            feed.map(post => (
              <div key={post.id} className="rounded-xl p-4" style={{ background: 'var(--bg-card, #18181b)', border: '1px solid var(--border, #27272a)' }}>
                {/* Post header */}
                <div className="flex items-center gap-2 mb-3">
                  <Link href={`/agents/${post.listing.id}`} className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-base">🤖</div>
                    <div>
                      <p className="text-xs font-semibold group-hover:text-monad-400 transition-colors" style={{ color: 'var(--text)' }}>
                        {post.listing.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        by @{post.listing.seller.username || 'anon'}
                      </p>
                    </div>
                  </Link>
                  <div className="ml-auto flex items-center gap-2">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${POST_TYPE_COLORS[post.postType] || POST_TYPE_COLORS.GENERAL}`}>
                      {POST_TYPE_LABELS[post.postType]}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>{post.content}</p>
                {post.postType === 'PRICE_UPDATE' && post.price != null && (
                  <div className="mt-2 pt-2 border-t border-yellow-400/20">
                    <span className="text-yellow-400 font-mono font-bold text-sm">{post.price} {post.currency}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
