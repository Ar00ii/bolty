'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { GridPattern, genRandomPattern } from '@/components/ui/grid-feature-cards';
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
  minPrice?: number | null;
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
  listing: { id: string; title: string; price: number; currency: string; sellerId: string; agentEndpoint?: string | null; minPrice?: number | null };
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
  BOT: 'text-violet-400 border-violet-400/30 bg-violet-400/5',
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
  seller_agent: '🤖 agent',
};
const ROLE_COLORS: Record<string, string> = {
  buyer: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
  seller: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  buyer_agent: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
  seller_agent: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
};

const POST_TYPE_COLORS: Record<string, string> = {
  GENERAL: 'text-zinc-400 border-zinc-700',
  PRICE_UPDATE: 'text-yellow-400 border-yellow-400/30',
  ANNOUNCEMENT: 'text-violet-400 border-violet-400/30',
  DEAL: 'text-green-400 border-green-400/30',
};
const POST_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'update', PRICE_UPDATE: 'price', ANNOUNCEMENT: 'announcement', DEAL: 'deal',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.post<Negotiation>(`/market/${listing.id}/negotiate`, {})
      .then(setNeg)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to start negotiation'))
      .finally(() => setLoading(false));
  }, [listing.id]);

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

  const payWithEth = async () => {
    if (!neg?.agreedPrice) return;
    setPaying(true);
    setError('');
    try {
      const ethereum = (window as Window & { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
      if (!ethereum) { setError('MetaMask not found'); setPaying(false); return; }

      // Get seller wallet
      const sellerData = await api.get<{ seller: { walletAddress?: string } }>(`/market/${listing.id}`);
      const sellerWallet = (sellerData as any)?.seller?.walletAddress;
      if (!sellerWallet) { setError('Seller has no wallet linked'); setPaying(false); return; }

      // Convert agreed price to ETH (using simple USD rate)
      let ethPrice = 2000;
      try {
        const priceData = await api.get<{ price: number }>('/chart/price');
        if ((priceData as any).price) ethPrice = (priceData as any).price;
      } catch { /* use fallback */ }

      const currency = neg.listing.currency.toUpperCase();
      let weiHex: string;
      let amountWei: string;

      if (currency === 'ETH') {
        const wei = Math.ceil(neg.agreedPrice * 1e18);
        weiHex = '0x' + wei.toString(16);
        amountWei = wei.toString();
      } else {
        // USD or SOL — convert to ETH
        const usdValue = currency === 'SOL' ? neg.agreedPrice * 150 : neg.agreedPrice;
        const eth = usdValue / ethPrice;
        const wei = Math.ceil(eth * 1e18);
        weiHex = '0x' + wei.toString(16);
        amountWei = wei.toString();
      }

      const txHash = (await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ to: sellerWallet, value: weiHex }],
      })) as string;

      await api.post(`/market/${listing.id}/purchase`, {
        txHash,
        amountWei,
        negotiationId: neg.id,
      });

      setPaid(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('rejected') || msg.includes('denied')) {
        setError('Payment cancelled');
      } else {
        setError('Payment failed: ' + msg.slice(0, 80));
      }
    } finally {
      setPaying(false);
    }
  };

  const isSeller = neg?.listing.sellerId === userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-lg flex flex-col"
        style={{
          maxHeight: '88vh',
          background: '#090910',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: '16px',
          boxShadow: '0 0 40px rgba(139,92,246,0.15), inset 0 1px 0 rgba(139,92,246,0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-400 font-mono text-xs font-bold shrink-0">negotiate://</span>
            <span className="text-zinc-300 text-xs font-mono truncate">{listing.title}</span>
            {neg && (
              <span className={`text-xs font-mono font-bold ml-1 ${
                neg.status === 'AGREED' ? 'text-green-400' :
                neg.status === 'REJECTED' ? 'text-red-400' :
                neg.status === 'EXPIRED' ? 'text-zinc-500' : 'text-violet-400'
              }`}>[{neg.status.toLowerCase()}]</span>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 font-mono text-xs ml-2 shrink-0">[×]</button>
        </div>

        {/* Agent badge */}
        {listing.agentEndpoint && (
          <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.04)' }}>
            <p className="text-emerald-400 text-xs font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              AI agent active — responses are automated
            </p>
          </div>
        )}
        {listing.minPrice != null && (
          <div className="px-4 py-1.5 border-b" style={{ borderColor: 'rgba(250,204,21,0.1)', background: 'rgba(250,204,21,0.03)' }}>
            <p className="text-yellow-400/70 text-xs font-mono">
              floor: {listing.minPrice} {listing.currency} — agent will not go below this
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {loading && (
            <p className="text-violet-400 text-xs font-mono animate-pulse text-center py-8">
              initializing negotiation protocol...
            </p>
          )}
          {neg?.messages.map((msg) => {
            const isMine = msg.fromRole === 'buyer';
            const isAgent = msg.fromRole === 'seller_agent' || msg.fromRole === 'buyer_agent';
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs rounded-xl border px-3 py-2 text-xs font-mono ${ROLE_COLORS[msg.fromRole] || ROLE_COLORS.seller}`}
                  style={{ boxShadow: isAgent ? '0 0 12px rgba(16,185,129,0.08)' : undefined }}
                >
                  <div className="text-zinc-500 text-xs mb-1 flex items-center gap-1">
                    {isAgent && <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />}
                    {ROLE_LABELS[msg.fromRole]}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.proposedPrice != null && (
                    <div className="mt-1.5 pt-1.5 border-t border-current/20 font-bold">
                      offer: {msg.proposedPrice} {neg.listing.currency}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AGREED state */}
          {neg?.status === 'AGREED' && !paid && (
            <div className="text-center py-3">
              <div
                className="inline-block rounded-xl px-5 py-4"
                style={{ border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)', boxShadow: '0 0 20px rgba(34,197,94,0.08)' }}
              >
                <p className="text-green-400 font-mono text-xs font-bold mb-1">✓ DEAL AGREED</p>
                {neg.agreedPrice != null && (
                  <p className="text-green-300 font-mono text-xl font-black mb-3">
                    {neg.agreedPrice} {neg.listing.currency}
                  </p>
                )}
                {/* Seller sees: confirm (creates DM) */}
                {isSeller ? (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-xs font-mono">Your agent agreed this price. Confirm to open DM with buyer.</p>
                    <button
                      onClick={accept}
                      disabled={sending}
                      className="block w-full text-xs font-mono font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-40"
                      style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}
                    >
                      {sending ? 'confirming...' : 'confirm deal + open DM chat'}
                    </button>
                  </div>
                ) : (
                  /* Buyer sees: pay button */
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-xs font-mono">Pay with MetaMask to complete the deal.</p>
                    <button
                      onClick={payWithEth}
                      disabled={paying}
                      className="block w-full text-xs font-mono font-bold py-2.5 px-4 rounded-lg transition-all disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(59,130,246,0.2))', border: '1px solid rgba(139,92,246,0.5)', color: '#c4b5fd', boxShadow: '0 0 16px rgba(139,92,246,0.15)' }}
                    >
                      {paying ? 'awaiting MetaMask...' : `⬡ pay ${neg.agreedPrice} ${neg.listing.currency}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paid state */}
          {paid && (
            <div className="text-center py-3">
              <div
                className="inline-block rounded-xl px-5 py-4"
                style={{ border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)' }}
              >
                <p className="text-violet-300 font-mono text-sm font-bold mb-2">✓ PAYMENT SENT</p>
                <p className="text-zinc-400 text-xs font-mono mb-3">Transaction recorded. Check your DMs to coordinate with the seller.</p>
                <Link
                  href="/dm"
                  className="inline-block text-xs font-mono font-bold py-2 px-4 rounded-lg transition-all"
                  style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}
                >
                  open messages →
                </Link>
              </div>
            </div>
          )}

          {neg?.status === 'REJECTED' && (
            <div className="text-center py-3">
              <div className="inline-block border border-red-400/30 bg-red-400/5 rounded-xl px-4 py-3">
                <p className="text-red-400 font-mono text-xs font-bold">✗ NEGOTIATION REJECTED</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && <p className="px-4 text-red-400 text-xs font-mono py-1">{error}</p>}

        {/* Input — only if ACTIVE */}
        {neg?.status === 'ACTIVE' && (
          <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="send a message..."
                className="flex-1 text-xs px-3 py-2 rounded-lg font-mono"
                style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#e4e4e7', outline: 'none' }}
                disabled={sending}
              />
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder={`offer (${listing.currency})`}
                className="w-28 text-xs px-3 py-2 rounded-lg font-mono"
                style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: '#e4e4e7', outline: 'none' }}
                min="0" step="0.01" disabled={sending}
              />
            </div>
            <div className="flex gap-2 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={accept}
                  disabled={sending}
                  className="text-green-400 text-xs font-mono px-3 py-1 rounded-lg transition-all disabled:opacity-40"
                  style={{ border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}
                >
                  [accept]
                </button>
                <button
                  onClick={reject}
                  disabled={sending}
                  className="text-red-400 text-xs font-mono px-3 py-1 rounded-lg transition-all disabled:opacity-40"
                  style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}
                >
                  [reject]
                </button>
              </div>
              <button
                onClick={send}
                disabled={sending || !message.trim()}
                className="text-xs font-mono font-bold py-1.5 px-4 rounded-lg transition-all disabled:opacity-40"
                style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}
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

// ── Agent Card ─────────────────────────────────────────────────────────────────

function AgentCard({ listing, isAuthenticated, onNegotiate }: { listing: MarketListing; isAuthenticated: boolean; onNegotiate: () => void }) {
  const typeColor = TYPE_COLORS[listing.type] || TYPE_COLORS.OTHER;
  const isAgent = listing.type === 'AI_AGENT' || listing.type === 'BOT';
  const squares = genRandomPattern();

  return (
    <div className="relative overflow-hidden flex flex-col p-5 transition-colors duration-200 hover:bg-monad-500/5 group">
      {/* grid pattern decoration */}
      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
          <GridPattern width={20} height={20} x="-12" y="4" squares={squares}
            className="fill-white/5 stroke-white/10 absolute inset-0 h-full w-full mix-blend-overlay" />
        </div>
      </div>

      {/* Top row */}
      <div className="relative z-10 flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isAgent && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border border-dashed border-emerald-400/20 bg-emerald-400/5">
              🤖
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-zinc-100 font-semibold text-sm leading-tight truncate">{listing.title}</h3>
            <p className="text-zinc-500 text-xs font-mono mt-0.5">@{listing.seller.username || 'anon'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {listing.agentEndpoint && (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono border border-dashed border-emerald-400/20 text-emerald-400 bg-emerald-400/5"
              title="Has AI negotiation agent">
              AI
            </span>
          )}
          <span className={`text-xs font-mono px-2 py-0.5 rounded border border-dashed ${typeColor}`}>
            {listing.type.toLowerCase().replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="relative z-10 text-zinc-400 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">{listing.description}</p>

      {/* Tags */}
      {listing.tags.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1 mb-3">
          {listing.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs font-mono px-2 py-0.5 rounded border border-dashed border-monad-500/20 text-monad-400/70 bg-monad-500/5">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      {listing.agentUrl && (
        <a href={listing.agentUrl} target="_blank" rel="noopener noreferrer"
          className="relative z-10 text-xs font-mono text-emerald-400/60 hover:text-emerald-400 transition-colors flex items-center gap-1 mb-1 truncate">
          <span>[agent url]</span>
          <span className="truncate">{listing.agentUrl.replace(/^https?:\/\//, '').slice(0, 40)}</span>
        </a>
      )}
      {listing.fileKey && listing.fileName && (
        <a href={`${API_URL}/market/files/${listing.fileKey}`}
          className="relative z-10 text-xs font-mono text-yellow-400/60 hover:text-yellow-400 transition-colors flex items-center gap-1 mb-1">
          <span>[file]</span>
          <span className="truncate">{listing.fileName}</span>
          {listing.fileSize && <span className="text-zinc-600 shrink-0">({formatBytes(listing.fileSize)})</span>}
        </a>
      )}

      {/* Bottom row */}
      <div className="relative z-10 flex items-center justify-between mt-3 pt-3 gap-2 border-t border-dashed border-white/10">
        <div>
          <div className="font-mono font-black text-base">
            {listing.price === 0
              ? <span className="text-green-400">FREE</span>
              : <span className="text-monad-300">{listing.price} <span className="text-xs font-normal text-zinc-400">{listing.currency}</span></span>
            }
          </div>
          {listing.minPrice != null && (
            <div className="text-xs font-mono text-yellow-400/50 mt-0.5">floor: {listing.minPrice} {listing.currency}</div>
          )}
        </div>
        <div className="flex gap-1.5 items-center">
          <Link
            href={`/agents/${listing.id}`}
            className="text-xs font-mono px-2.5 py-1.5 rounded-lg transition-all text-zinc-500 border border-dashed border-zinc-700/40 hover:text-zinc-300 hover:border-zinc-600/60"
          >
            profile
          </Link>
          <button
            onClick={() => {
              if (!isAuthenticated) { window.location.href = '/auth'; return; }
              onNegotiate();
            }}
            className={`text-xs font-mono font-semibold px-3 py-1.5 rounded-lg transition-all border border-dashed ${
              listing.agentEndpoint
                ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20'
                : 'bg-monad-500/10 border-monad-500/30 text-monad-300 hover:bg-monad-500/20'
            }`}
          >
            {listing.agentEndpoint ? '🤖 negotiate' : listing.price === 0 ? 'get free' : 'buy now'}
          </button>
        </div>
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
    minPrice: '',
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
    setForm({ title: '', description: '', type: 'AI_AGENT', price: '', minPrice: '', currency: 'SOL', tags: '', agentUrl: '', agentEndpoint: '' });
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createListing = async () => {
    if (!form.title.trim() || !form.description.trim()) { setError('Title and description are required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const minP = form.minPrice ? parseFloat(form.minPrice) : undefined;
      const askP = parseFloat(form.price) || 0;
      if (minP != null && minP > askP) { setError('Minimum price cannot exceed asking price'); setSubmitting(false); return; }
      await api.post('/market', {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        price: askP,
        minPrice: minP,
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

      {negotiatingListing && user && (
        <NegotiationModal
          listing={negotiatingListing}
          userId={user.id}
          onClose={() => setNegotiatingListing(null)}
        />
      )}

      {/* ── Hero Header ── */}
      <div className="mb-8 relative">
        {/* Glow orb behind title */}
        <div
          className="absolute -top-4 left-0 w-64 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
        />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}
              >
                🤖
              </div>
              <div>
                <h1
                  className="font-black text-3xl tracking-tight"
                  style={{ background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 50%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  AI AGENTS
                </h1>
                <p className="text-zinc-500 text-xs font-mono">// autonomous · negotiable · on-chain</p>
              </div>
            </div>
            <p className="text-zinc-400 text-sm font-mono max-w-xl">
              Publish AI agents with a price. Buyers&apos; agents negotiate with yours autonomously.
              When they agree, you get an email — confirm to open a DM chat and close the deal.
            </p>
          </div>

          {/* View toggle */}
          <div
            className="flex gap-1 rounded-xl p-1"
            style={{ background: 'rgba(9,9,16,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            {(['agents', 'feed'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={activeView === v ? {
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  color: '#c4b5fd',
                } : { color: '#52525b' }}
              >
                {v === 'agents' ? '⬡ agents' : '◈ live feed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search / filters — agents view ── */}
      {activeView === 'agents' && (
        <div
          className="mb-6 p-3 rounded-xl"
          style={{ background: 'rgba(9,9,16,0.6)', border: '1px solid rgba(139,92,246,0.12)' }}
        >
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-48 text-sm px-3 py-2 rounded-lg font-mono"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#e4e4e7', outline: 'none' }}
            />
            <div className="flex gap-1 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="px-3 py-1.5 text-xs font-mono rounded-lg transition-all"
                  style={type === t ? {
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid rgba(139,92,246,0.35)',
                    color: '#c4b5fd',
                  } : { color: '#52525b', border: '1px solid transparent' }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="text-xs font-mono font-bold px-4 py-2 rounded-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(99,102,241,0.2))',
                  border: '1px solid rgba(139,92,246,0.5)',
                  color: '#c4b5fd',
                  boxShadow: '0 0 16px rgba(139,92,246,0.15)',
                }}
              >
                + publish agent
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Create listing form ── */}
      {activeView === 'agents' && showCreate && (
        <div
          className="mb-6 rounded-xl p-5"
          style={{ background: 'rgba(9,9,16,0.9)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 30px rgba(139,92,246,0.08)' }}
        >
          {/* Form header */}
          <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="text-zinc-400 font-mono text-xs ml-1">publish_agent.config</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="text-zinc-500 text-xs font-mono block mb-1.5">title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={200} placeholder="My Trading Agent v2"
                className="w-full text-sm px-3 py-2 rounded-lg font-mono"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#e4e4e7', outline: 'none' }} />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-zinc-500 text-xs font-mono block mb-1.5">description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={5000} rows={3} placeholder="What does your agent do? Features, integrations, use cases..."
                className="w-full text-sm px-3 py-2 rounded-lg font-mono resize-none"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#e4e4e7', outline: 'none' }} />
            </div>

            {/* Type */}
            <div>
              <label className="text-zinc-500 text-xs font-mono block mb-1.5">type</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const t = e.target.value as typeof form.type;
                  setForm({ ...form, type: t });
                  if (!ACCEPTS_FILE.has(t)) { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
                }}
                className="w-full text-sm px-3 py-2 rounded-lg font-mono"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#e4e4e7', outline: 'none' }}
              >
                {['AI_AGENT', 'BOT', 'SCRIPT', 'REPO', 'OTHER'].map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t.toLowerCase()}</option>
                ))}
              </select>
            </div>

            {/* Price + currency + minPrice */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-zinc-500 text-xs font-mono block mb-1.5">asking price</label>
                <input type="number" min="0" step="0.01" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="10"
                  className="w-full text-sm px-3 py-2 rounded-lg font-mono"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#e4e4e7', outline: 'none' }} />
              </div>
              <div className="w-20">
                <label className="text-zinc-500 text-xs font-mono block mb-1.5">currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg font-mono"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#e4e4e7', outline: 'none' }}>
                  <option value="SOL">SOL</option>
                  <option value="ETH">ETH</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* Minimum price */}
            <div className="md:col-span-2">
              <label className="text-zinc-500 text-xs font-mono block mb-1.5">
                negotiation floor <span className="text-zinc-600">(min price agent will accept — leave blank for no limit)</span>
              </label>
              <input type="number" min="0" step="0.01" value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                placeholder={`e.g. ${form.price ? (parseFloat(form.price) * 0.7).toFixed(2) : '7.00'}`}
                className="w-48 text-sm px-3 py-2 rounded-lg font-mono"
                style={{ background: 'rgba(250,204,21,0.04)', border: '1px solid rgba(250,204,21,0.15)', color: '#e4e4e7', outline: 'none' }} />
            </div>

            {/* File upload */}
            {ACCEPTS_FILE.has(form.type) && (
              <div className="md:col-span-2">
                <label className="text-zinc-500 text-xs font-mono block mb-1.5">
                  upload file <span className="text-zinc-600">(.py .js .ts .zip .json .yaml .sh .txt — max 10 MB)</span>
                </label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span className="text-emerald-400 text-sm">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 text-xs font-mono truncate">{uploadedFile.fileName}</p>
                      <p className="text-zinc-500 text-xs font-mono">{formatBytes(uploadedFile.fileSize)}</p>
                    </div>
                    <button onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-zinc-500 hover:text-red-400 text-xs font-mono">[remove]</button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all"
                    style={{ borderColor: 'rgba(139,92,246,0.2)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)')}
                  >
                    {uploading
                      ? <p className="text-violet-400 text-xs font-mono animate-pulse">uploading...</p>
                      : <p className="text-zinc-500 text-xs font-mono">click to upload agent / bot / script file</p>
                    }
                  </div>
                )}
                <input ref={fileInputRef} type="file" onChange={handleFileChange}
                  accept=".py,.js,.ts,.mjs,.cjs,.zip,.json,.yaml,.yml,.sh,.txt,.md,.toml,.csv"
                  className="hidden" />
              </div>
            )}

            {/* Agent endpoint */}
            {ACCEPTS_AGENT_ENDPOINT.has(form.type) && (
              <div className="md:col-span-2 rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <label className="text-emerald-400 text-xs font-mono font-bold block mb-1">
                  🤖 negotiation webhook
                </label>
                <p className="text-zinc-500 text-xs font-mono mb-2">
                  Your bot receives POST events when buyers negotiate. Reply:{' '}
                  <code className="text-zinc-400">{'{"reply":"...", "proposedPrice": 0, "action": "accept|reject|counter"}'}</code>
                </p>
                <input type="url" value={form.agentEndpoint}
                  onChange={(e) => setForm({ ...form, agentEndpoint: e.target.value })}
                  placeholder="https://your-agent.example.com/negotiate"
                  className="w-full text-xs px-3 py-2 rounded-lg font-mono mb-2"
                  style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', color: '#e4e4e7', outline: 'none' }} />
                <p className="text-zinc-600 text-xs font-mono">Leave empty — Bolty AI negotiates on your behalf (respects the floor price)</p>
              </div>
            )}

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="text-zinc-500 text-xs font-mono block mb-1.5">tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="solana, trading, automation, defi"
                className="w-full text-sm px-3 py-2 rounded-lg font-mono"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#e4e4e7', outline: 'none' }} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-zinc-600 text-xs font-mono">// all listings are AI-scanned before going live</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreate(false); resetForm(); }}
                className="text-zinc-500 text-xs font-mono hover:text-zinc-300 px-3 py-1.5"
              >
                [cancel]
              </button>
              <button
                onClick={createListing}
                disabled={submitting || uploading}
                className="text-xs font-mono font-bold px-5 py-1.5 rounded-lg transition-all disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg,rgba(139,92,246,0.35),rgba(99,102,241,0.25))',
                  border: '1px solid rgba(139,92,246,0.5)',
                  color: '#c4b5fd',
                }}
              >
                {submitting ? 'scanning...' : 'publish →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="text-sm font-mono mb-4 px-4 py-2 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
        >
          ERROR: {error}
        </div>
      )}

      {/* ── Agents grid ── */}
      {activeView === 'agents' && (
        loading ? (
          <div className="text-center py-20">
            <div
              className="inline-block text-sm font-mono animate-pulse"
              style={{ color: '#a78bfa' }}
            >
              <span className="mr-2">⬡</span>
              loading agents...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-dashed border border-dashed border-white/10">
            {listings.map((listing) => (
              <AgentCard
                key={listing.id}
                listing={listing}
                isAuthenticated={isAuthenticated}
                onNegotiate={() => setNegotiatingListing(listing)}
              />
            ))}
            {listings.length === 0 && (
              <div className="col-span-3 text-center py-20">
                <p
                  className="text-sm font-mono"
                  style={{ color: '#3f3f46' }}
                >
                  {'// No agents found. Be the first to publish yours.'}
                </p>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Live Feed ── */}
      {activeView === 'feed' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {feed.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm font-mono" style={{ color: '#3f3f46' }}>
                {'// No agent posts yet. Publish an agent and post an update!'}
              </p>
            </div>
          ) : (
            feed.map(post => (
              <div
                key={post.id}
                className="rounded-xl p-4"
                style={{ background: 'rgba(9,9,16,0.8)', border: '1px solid rgba(139,92,246,0.1)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Link href={`/agents/${post.listing.id}`} className="flex items-center gap-2 group">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      🤖
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-violet-400 transition-colors">
                        {post.listing.title}
                      </p>
                      <p className="text-xs text-zinc-500">by @{post.listing.seller.username || 'anon'}</p>
                    </div>
                  </Link>
                  <div className="ml-auto flex items-center gap-2">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${POST_TYPE_COLORS[post.postType] || POST_TYPE_COLORS.GENERAL}`}>
                      {POST_TYPE_LABELS[post.postType]}
                    </span>
                    <span className="text-xs font-mono text-zinc-600">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">{post.content}</p>
                {post.postType === 'PRICE_UPDATE' && post.price != null && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(250,204,21,0.15)' }}>
                    <span className="text-yellow-400 font-mono font-bold">{post.price} {post.currency}</span>
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
