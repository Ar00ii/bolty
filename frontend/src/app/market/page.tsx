'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError, API_URL } from '@/lib/api/client';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { Badge } from '@/components/ui/badge';
import { connectMetaMask, isMetaMaskInstalled, getMetaMaskProvider } from '@/lib/wallet/ethereum';
import {
  Bot, User, X, ShieldCheck, ShieldAlert,
  GitBranch, Star, TrendingUp, Clock, Package, Zap,
  ArrowRight, Search, SlidersHorizontal,
} from 'lucide-react';

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

const TYPE_COLORS: Record<string, string> = {
  REPO:     'text-blue-400 border-blue-400/20 bg-blue-400/5',
  BOT:      'text-monad-400 border-monad-400/20 bg-monad-400/5',
  AI_AGENT: 'text-violet-400 border-violet-400/20 bg-violet-400/5',
  SCRIPT:   'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
  OTHER:    'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
};

const ROLE_LABELS: Record<string, string> = {
  buyer: 'you', seller: 'seller', buyer_agent: 'your agent', seller_agent: 'agent',
};
const ROLE_COLORS: Record<string, string> = {
  buyer: 'bg-monad-500/10 border-monad-500/20 text-monad-300',
  seller: 'bg-zinc-800/50 border-zinc-700/30 text-zinc-300',
  buyer_agent: 'bg-monad-500/8 border-monad-500/15 text-monad-200',
  seller_agent: 'bg-monad-500/10 border-monad-500/15 text-monad-300',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Negotiation Modal ──────────────────────────────────────────────────────────

function NegotiationModal({ listing, onClose, userId }: { listing: MarketListing; onClose: () => void; userId: string }) {
  const [neg, setNeg] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [consentData, setConsentData] = useState<{
    sellerWallet: string; buyerAddress: string; sellerWei: bigint;
    platformWei: bigint; totalWei: bigint; negotiationId: string;
    amountWei: string; totalUsd: number;
  } | null>(null);

  useEffect(() => {
    api.post<Negotiation>(`/market/${listing.id}/negotiate`, {})
      .then(setNeg)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to start negotiation'))
      .finally(() => setLoading(false));
  }, [listing.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [neg?.messages.length]);

  const send = async () => {
    if (!neg || !message.trim()) return;
    setSending(true); setError('');
    try {
      const updated = await api.post<Negotiation>(`/market/negotiations/${neg.id}/message`, {
        content: message.trim(),
        proposedPrice: offerPrice ? parseFloat(offerPrice) : undefined,
      });
      setNeg(updated); setMessage(''); setOfferPrice('');
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to send message'); }
    finally { setSending(false); }
  };

  const accept = async () => {
    if (!neg) return; setSending(true);
    try { const u = await api.post<Negotiation>(`/market/negotiations/${neg.id}/accept`, {}); setNeg(u); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to accept'); }
    finally { setSending(false); }
  };

  const reject = async () => {
    if (!neg) return; setSending(true);
    try { const u = await api.post<Negotiation>(`/market/negotiations/${neg.id}/reject`, {}); setNeg(u); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to reject'); }
    finally { setSending(false); }
  };

  const payWithEth = async () => {
    if (!neg?.agreedPrice) return;
    setPaying(true); setError('');
    try {
      const ethereum = getMetaMaskProvider();
      if (!ethereum) { setError('MetaMask not found'); setPaying(false); return; }
      const sellerData = await api.get<any>(`/market/${listing.id}`);
      const sellerWallet = sellerData?.seller?.walletAddress;
      if (!sellerWallet) { setError('Seller has no wallet linked'); setPaying(false); return; }
      let ethPrice = 2000;
      try { const p = await api.get<any>('/chart/eth-price'); if (p.price) ethPrice = p.price; } catch {}
      const totalWei = BigInt(Math.ceil(neg.agreedPrice * 1e18));
      const totalUsd = neg.agreedPrice * ethPrice;
      const sellerWei = (totalWei * BigInt(975)) / BigInt(1000);
      const platformWei = totalWei - sellerWei;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      setConsentData({ sellerWallet, buyerAddress: accounts[0], sellerWei, platformWei, totalWei, negotiationId: neg.id, amountWei: totalWei.toString(), totalUsd });
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg.includes('rejected') ? 'Payment cancelled' : 'Payment failed: ' + msg.slice(0, 80));
    } finally { setPaying(false); }
  };

  const executePayment = async (signature: string, consentMessage: string) => {
    if (!consentData) return;
    const { sellerWallet, buyerAddress, sellerWei, platformWei, negotiationId, amountWei } = consentData;
    setConsentData(null);
    const ethereum = getMetaMaskProvider();
    if (!ethereum) { setError('MetaMask not found'); return; }
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
    try {
      const txHash = (await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: buyerAddress, to: sellerWallet, value: '0x' + sellerWei.toString(16) }] })) as string;
      let platformFeeTxHash: string | undefined;
      if (platformWallet) {
        platformFeeTxHash = (await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: buyerAddress, to: platformWallet, value: '0x' + platformWei.toString(16) }] })) as string;
      }
      await api.post(`/market/${listing.id}/purchase`, { txHash, amountWei, negotiationId, platformFeeTxHash, consentSignature: signature, consentMessage });
      setPaid(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg.includes('rejected') ? 'Payment cancelled' : err instanceof ApiError ? err.message : 'Payment failed: ' + msg.slice(0, 80));
    }
  };

  const isSeller = neg?.listing?.sellerId === userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-lg flex flex-col rounded-xl border overflow-hidden shadow-2xl" style={{ maxHeight: '88vh', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-monad-400 animate-pulse" />
            <span className="text-sm font-light text-white truncate">{listing.title}</span>
            {neg && (
              <span className={`badge text-xs ml-1 ${neg.status === 'AGREED' ? 'badge-success' : neg.status === 'REJECTED' ? 'badge-error' : ''}`}>
                {neg.status.toLowerCase()}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {listing.minPrice != null && (
          <div className="px-4 py-2 text-xs text-zinc-500" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            Floor price: <strong className="text-zinc-300">{listing.minPrice} {listing.currency}</strong>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {loading && (
            <div className="text-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-monad-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Starting negotiation...</p>
            </div>
          )}

          {neg?.messages.map((msg) => {
            const isMine = msg.fromRole === 'buyer' && !isSeller;
            const isAgent = msg.fromRole === 'seller_agent' || msg.fromRole === 'buyer_agent';
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl border px-3 py-2 text-xs ${ROLE_COLORS[msg.fromRole] || ROLE_COLORS.seller}`}>
                  <div className="flex items-center gap-1 mb-1 opacity-60">
                    {isAgent && <Zap className="w-2.5 h-2.5" />}
                    <span className="text-[10px] uppercase tracking-wide">{ROLE_LABELS[msg.fromRole]}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.proposedPrice != null && (
                    <div className="mt-1.5 pt-1.5 border-t border-current/20 font-bold text-monad-300">
                      Offer: {msg.proposedPrice} {neg.listing?.currency}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {neg?.status === 'AGREED' && !paid && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
              <p className="text-green-400 font-light text-sm mb-1">Deal agreed</p>
              {neg.agreedPrice != null && <p className="text-2xl font-bold text-white mb-3">{neg.agreedPrice} <span className="text-sm text-zinc-400">{neg.listing?.currency}</span></p>}
              {isSeller ? (
                <button onClick={accept} disabled={sending} className="btn-primary w-full py-2 text-sm disabled:opacity-50">
                  {sending ? 'Confirming...' : 'Confirm deal'}
                </button>
              ) : (
                <button onClick={payWithEth} disabled={paying} className="btn-primary w-full py-2 text-sm disabled:opacity-50">
                  {paying ? 'Awaiting MetaMask...' : `Pay ${neg.agreedPrice} ${neg.listing?.currency}`}
                </button>
              )}
            </div>
          )}

          {paid && (
            <div className="rounded-xl border border-monad-500/20 bg-monad-500/5 p-4 text-center">
              <p className="text-monad-400 font-light text-sm mb-2">Payment sent!</p>
              <Link href="/dm" className="btn-secondary text-xs px-4 py-2 inline-flex">Open messages →</Link>
            </div>
          )}

          {neg?.status === 'REJECTED' && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
              <p className="text-red-400 text-sm">Negotiation rejected</p>
            </div>
          )}

          {neg?.status === 'EXPIRED' && (
            <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/20 p-3 text-center">
              <p className="text-zinc-500 text-sm">Negotiation expired</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="px-4 py-2 text-red-400 text-xs border-t" style={{ borderColor: 'var(--border)' }}>{error}</p>}

        {neg?.status === 'ACTIVE' && (
          <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2">
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Send a message..." className="input flex-1 text-sm" disabled={sending} />
              <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Offer" className="input w-24 text-sm" min="0" step="0.001" disabled={sending} />
            </div>
            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <button onClick={accept} disabled={sending} className="text-xs text-green-400 px-3 py-1.5 rounded-lg border border-green-500/20 hover:bg-green-500/10 transition-all disabled:opacity-40">Accept</button>
                <button onClick={reject} disabled={sending} className="text-xs text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-all disabled:opacity-40">Reject</button>
              </div>
              <button onClick={send} disabled={sending || !message.trim()} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-40">
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
      {consentData && neg && (
        <PaymentConsentModal listingTitle={listing.title} sellerAddress={consentData.sellerWallet}
          sellerAmountETH={(Number(consentData.sellerWei) / 1e18).toFixed(6)}
          platformFeeETH={(Number(consentData.platformWei) / 1e18).toFixed(6)}
          totalETH={(Number(consentData.totalWei) / 1e18).toFixed(6)}
          totalUsd={consentData.totalUsd.toFixed(2)} buyerAddress={consentData.buyerAddress}
          onConsent={executePayment} onCancel={() => setConsentData(null)} />
      )}
    </div>
  );
}

// ── Listing Card ───────────────────────────────────────────────────────────────

function ListingCard({ listing, isAuthenticated, onNegotiate }: { listing: MarketListing; isAuthenticated: boolean; onNegotiate: () => void }) {
  const handleClick = () => {
    if (!isAuthenticated) { window.location.href = '/auth'; return; }
    onNegotiate();
  };

  return (
    <div className="card-interactive flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-dim)', border: '1px solid rgba(131,110,249,0.15)' }}>
            {listing.type === 'REPO' ? <GitBranch className="w-4 h-4 text-monad-400" strokeWidth={1.75} /> : <Bot className="w-4 h-4 text-monad-400" strokeWidth={1.75} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-light text-white truncate">{listing.title}</h3>
            <p className="text-xs text-zinc-500">@{listing.seller.username || 'anon'}</p>
          </div>
        </div>
        <span className={`badge text-[10px] shrink-0 ${TYPE_COLORS[listing.type] || TYPE_COLORS.OTHER}`}>
          {listing.type.toLowerCase().replace('_', ' ')}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 flex-1 mb-3">
        {listing.description || 'No description.'}
      </p>

      {/* Tags */}
      {listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {listing.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/50">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div>
          {listing.price === 0 ? (
            <span className="text-sm font-light text-green-400">Free</span>
          ) : (
            <span className="text-sm font-light text-white">{listing.price} <span className="text-xs text-zinc-500 font-normal">{listing.currency}</span></span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Link href={`/agents/${listing.id}`} className="btn-ghost text-xs py-1 px-2.5">View</Link>
          <button onClick={handleClick} className="btn-primary text-xs py-1 px-3">
            {listing.price === 0 ? 'Get free' : 'Negotiate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const { user, isAuthenticated } = useAuth();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNeg, setActiveNeg] = useState<MarketListing | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listRes, feedRes] = await Promise.all([
          api.get<{ data: MarketListing[] }>('/market?limit=8'),
          api.get<FeedPost[]>('/market/feed?limit=6').catch(() => [] as FeedPost[]),
        ]);
        setListings((listRes as any).data || listRes as unknown as MarketListing[]);
        setFeedPosts(Array.isArray(feedRes) ? feedRes : []);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featured = listings.filter(l => l.agentEndpoint).slice(0, 2);
  const recent = listings.slice(0, 6);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {activeNeg && user && (
        <NegotiationModal listing={activeNeg} onClose={() => setActiveNeg(null)} userId={user.id} />
      )}

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 pt-20">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-light text-white mb-2">Marketplace</h1>
              <p className="text-base text-gray-400">AI agents, automation tools, and code repositories</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/market/agents" className="px-6 py-2.5 text-sm text-white border border-zinc-700 rounded hover:bg-zinc-800/50 transition-all flex items-center gap-2">
                <Bot className="w-4 h-4" /> Agents
              </Link>
              <Link href="/market/repos" className="px-6 py-2.5 text-sm text-white border border-zinc-700 rounded hover:bg-zinc-800/50 transition-all flex items-center gap-2">
                <GitBranch className="w-4 h-4" /> Repos
              </Link>
            </div>
          </div>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/market/agents" className="card-interactive p-5 group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-dim)', border: '1px solid rgba(131,110,249,0.2)' }}>
                <Bot className="w-5 h-5 text-monad-400" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-light text-white group-hover:text-monad-300 transition-colors">AI Agents</h2>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-monad-400 transition-colors" />
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">Discover and buy autonomous AI bots, scripts, and automation agents. Negotiate with AI-powered pricing.</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="badge text-xs">Browse marketplace</span>
                  <Link href="/market/agents?tab=mine" onClick={e => e.stopPropagation()} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">My agents →</Link>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/market/repos" className="card-interactive p-5 group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <GitBranch className="w-5 h-5 text-blue-400" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-light text-white group-hover:text-blue-300 transition-colors">Repositories</h2>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">Browse community code — public repos and paid locked projects. Vote, download, and unlock with ETH.</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="badge-secondary text-xs">Browse repos</span>
                  <Link href="/market/repos?tab=mine" onClick={e => e.stopPropagation()} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">My repos →</Link>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listings */}
          <div className="lg:col-span-2">
            {/* Featured */}
            {featured.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-400" strokeWidth={1.75} />
                  <h2 className="text-sm font-light text-white">Featured</h2>
                  <span className="badge text-xs">AI agents</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featured.map(l => (
                    <ListingCard key={l.id} listing={l} isAuthenticated={isAuthenticated} onNegotiate={() => setActiveNeg(l)} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent listings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
                  <h2 className="text-sm font-light text-white">Recent listings</h2>
                </div>
                <Link href="/market/agents" className="text-xs text-monad-400 hover:text-monad-300 transition-colors">View all →</Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
                </div>
              ) : recent.length === 0 ? (
                <div className="card text-center py-12">
                  <Package className="w-8 h-8 text-zinc-700 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-zinc-500">No listings yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recent.map(l => (
                    <ListingCard key={l.id} listing={l} isAuthenticated={isAuthenticated} onNegotiate={() => setActiveNeg(l)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
              <h2 className="text-sm font-light text-white">Activity</h2>
            </div>
            <div className="space-y-2">
              {feedPosts.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-xs text-zinc-500">No activity yet</p>
                </div>
              ) : (
                feedPosts.map(post => (
                  <div key={post.id} className="card p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold bg-monad-500/15 text-monad-400">
                        {(post.listing.seller.username || 'A')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-zinc-300 truncate">@{post.listing.seller.username || 'anon'}</span>
                          <span className="text-[10px] text-zinc-600">{timeAgo(post.createdAt)}</span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2">{post.content}</p>
                        {post.price && (
                          <p className="text-xs text-monad-400 mt-1 font-medium">{post.price} {post.currency}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
