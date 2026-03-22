'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { connectMetaMask } from '@/lib/wallet/ethereum';
import {
  Bot, User, X, Key, Plus, Trash2, Copy, Eye, EyeOff,
  ShieldCheck, ShieldAlert, Package, Globe, Star, Cpu,
  AlertTriangle, Wallet, Users, Zap, Send,
} from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { io, Socket } from 'socket.io-client';

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
}

interface ApiKeyInfo {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
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
  mode: 'AI_AI' | 'HUMAN';
  humanSwitchRequestedBy?: string | null;
  listing: { id: string; title: string; price: number; currency: string; sellerId: string; agentEndpoint?: string | null; minPrice?: number | null };
  buyer: { id: string; username: string | null };
  messages: NegotiationMessage[];
}

interface UploadedFileMeta {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  scanPassed?: boolean;
  scanNote?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPES = ['ALL', 'AI_AGENT', 'BOT', 'SCRIPT', 'OTHER'];
const TYPE_LABELS: Record<string, string> = { ALL: 'all', AI_AGENT: 'ai agent', BOT: 'bot', SCRIPT: 'script', OTHER: 'other' };
const TYPE_COLORS: Record<string, string> = {
  BOT: 'text-monad-400/80 border-monad-400/25 bg-monad-400/5',
  AI_AGENT: 'text-monad-400/70 border-monad-400/20 bg-monad-400/5',
  SCRIPT: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
  OTHER: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
};
const ACCEPTS_FILE = new Set(['AI_AGENT', 'BOT', 'SCRIPT', 'OTHER']);
const ACCEPTS_AGENT_ENDPOINT = new Set(['AI_AGENT', 'BOT']);
const ROLE_LABELS: Record<string, string> = { buyer: 'you', seller: 'seller', buyer_agent: 'your agent', seller_agent: 'agent' };
const ROLE_COLORS: Record<string, string> = {
  buyer: 'bg-monad-500/10 border-monad-500/20 text-monad-300',
  seller: 'bg-zinc-800/50 border-zinc-700/30 text-zinc-300',
  buyer_agent: 'bg-monad-500/8 border-monad-500/15 text-monad-200',
  seller_agent: 'bg-monad-500/10 border-monad-500/15 text-monad-300',
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

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function NegotiationModal({ listing, onClose, userId }: { listing: MarketListing; onClose: () => void; userId: string }) {
  const [neg, setNeg] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [error, setError] = useState('');
  const [agentTyping, setAgentTyping] = useState<'buyer_agent' | 'seller_agent' | null>(null);
  const [switchPending, setSwitchPending] = useState<{ requestedBy: string } | null>(null);
  const [requestingSwitch, setRequestingSwitch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [consentData, setConsentData] = useState<{ sellerWallet: string; buyerAddress: string; sellerWei: bigint; platformWei: bigint; totalWei: bigint; negotiationId: string; amountWei: string; totalUsd: number } | null>(null);

  // Start negotiation + setup WebSocket
  useEffect(() => {
    api.post<Negotiation>(`/market/${listing.id}/negotiate`, {})
      .then((n) => {
        setNeg(n);
        // Connect WebSocket once we have the negotiation id
        const socket = io(`${SOCKET_URL}/negotiations`, { withCredentials: true, transports: ['websocket'] });
        socketRef.current = socket;
        socket.emit('join:negotiation', n.id);

        socket.on('negotiation:message', (msg: NegotiationMessage) => {
          setAgentTyping(null);
          setNeg((prev) => prev ? { ...prev, messages: [...prev.messages.filter(m => m.id !== msg.id), msg] } : prev);
        });

        socket.on('negotiation:status', (data: { status: string; agreedPrice?: number | null }) => {
          setNeg((prev) => prev ? { ...prev, status: data.status as Negotiation['status'], agreedPrice: data.agreedPrice ?? prev.agreedPrice } : prev);
        });

        socket.on('negotiation:agent-typing', ({ role }: { role: 'buyer_agent' | 'seller_agent' }) => {
          setAgentTyping(role);
          // Auto-clear after 5s as safety net
          setTimeout(() => setAgentTyping(null), 5000);
        });

        socket.on('negotiation:human-switch-request', ({ requestedByUserId }: { requestedByUserId: string }) => {
          setSwitchPending({ requestedBy: requestedByUserId });
        });

        socket.on('negotiation:human-switch-activated', () => {
          setSwitchPending(null);
          setNeg((prev) => prev ? { ...prev, mode: 'HUMAN', humanSwitchRequestedBy: null } : prev);
        });
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to start negotiation'))
      .finally(() => setLoading(false));

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [listing.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [neg?.messages.length, agentTyping]);

  const send = async () => {
    if (!neg || !message.trim()) return;
    setSending(true); setError('');
    try {
      const updated = await api.post<Negotiation>(`/market/negotiations/${neg.id}/message`, { content: message.trim(), proposedPrice: offerPrice ? parseFloat(offerPrice) : undefined });
      setNeg(updated); setMessage(''); setOfferPrice('');
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to send'); } finally { setSending(false); }
  };

  const accept = async () => {
    if (!neg) return; setSending(true);
    try { const u = await api.post<Negotiation>(`/market/negotiations/${neg.id}/accept`, {}); setNeg(u); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to accept'); } finally { setSending(false); }
  };

  const reject = async () => {
    if (!neg) return; setSending(true);
    try { const u = await api.post<Negotiation>(`/market/negotiations/${neg.id}/reject`, {}); setNeg(u); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to reject'); } finally { setSending(false); }
  };

  const requestHumanSwitch = async () => {
    if (!neg) return; setRequestingSwitch(true); setError('');
    try {
      await api.post(`/market/negotiations/${neg.id}/request-human`, {});
      setNeg((prev) => prev ? { ...prev, humanSwitchRequestedBy: userId } : prev);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to request switch'); }
    finally { setRequestingSwitch(false); }
  };

  const acceptHumanSwitch = async () => {
    if (!neg) return; setRequestingSwitch(true); setError('');
    try {
      await api.post(`/market/negotiations/${neg.id}/accept-human`, {});
      setSwitchPending(null);
      setNeg((prev) => prev ? { ...prev, mode: 'HUMAN', humanSwitchRequestedBy: null } : prev);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to accept switch'); }
    finally { setRequestingSwitch(false); }
  };

  const payWithEth = async () => {
    if (!neg?.agreedPrice) return;
    setPaying(true); setError('');
    try {
      const ethereum = (window as any).ethereum;
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
    const ethereum = (window as any).ethereum;
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
  const isAiMode = neg?.mode === 'AI_AI';
  const iHaveRequestedSwitch = neg?.humanSwitchRequestedBy === userId;
  const otherRequestedSwitch = switchPending && switchPending.requestedBy !== userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-lg flex flex-col" style={{ maxHeight: '88vh', background: '#07070f', border: '1px solid rgba(131,110,249,0.3)', borderRadius: 20, boxShadow: '0 0 60px rgba(131,110,249,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'rgba(131,110,249,0.15)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-monad-400 animate-pulse shrink-0" />
            <span className="text-monad-400 font-mono text-xs font-bold shrink-0">negotiate://</span>
            <span className="text-zinc-300 text-xs font-mono truncate">{listing.title}</span>
            {neg && (
              <span className={`text-xs font-mono font-bold ml-1 shrink-0 ${neg.status === 'AGREED' ? 'text-green-400' : neg.status === 'REJECTED' ? 'text-red-400' : neg.status === 'EXPIRED' ? 'text-zinc-500' : 'text-monad-400'}`}>
                [{neg.status.toLowerCase()}]
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 font-mono text-xs ml-2 shrink-0 transition-colors">[×]</button>
        </div>

        {/* AI mode banner */}
        {isAiMode && neg?.status === 'ACTIVE' && (
          <div className="px-4 py-2.5 border-b shrink-0 flex items-center justify-between gap-3" style={{ borderColor: 'rgba(131,110,249,0.12)', background: 'rgba(131,110,249,0.05)' }}>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-monad-400 shrink-0" strokeWidth={1.5} />
              <p className="text-monad-400 text-xs font-mono">AI agents negotiating automatically</p>
            </div>
            {!iHaveRequestedSwitch && !switchPending && (
              <button onClick={requestHumanSwitch} disabled={requestingSwitch} className="text-xs font-mono text-zinc-500 hover:text-zinc-300 border rounded-lg px-2.5 py-1 transition-all shrink-0 disabled:opacity-40" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                {requestingSwitch ? '...' : 'take over'}
              </button>
            )}
            {iHaveRequestedSwitch && (
              <span className="text-xs font-mono text-zinc-500 shrink-0">waiting for other party...</span>
            )}
          </div>
        )}

        {/* Human switch request — Pokemon trade dialog */}
        {otherRequestedSwitch && neg?.status === 'ACTIVE' && (
          <div className="mx-4 mt-3 rounded-xl px-4 py-3 shrink-0 flex items-center justify-between gap-3" style={{ border: '1px solid rgba(250,204,21,0.25)', background: 'rgba(250,204,21,0.05)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-3.5 h-3.5 text-yellow-400 shrink-0" strokeWidth={1.5} />
              <p className="text-yellow-300 text-xs font-mono truncate">Other party wants to negotiate manually</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={acceptHumanSwitch} disabled={requestingSwitch} className="text-xs font-mono px-3 py-1 rounded-lg transition-all disabled:opacity-40" style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)', color: '#fde68a' }}>
                {requestingSwitch ? '...' : 'accept'}
              </button>
            </div>
          </div>
        )}

        {/* Floor price info */}
        {listing.minPrice != null && (
          <div className="px-4 py-1.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-zinc-600 text-xs font-mono">floor price: {listing.minPrice} {listing.currency} — agents won't go below this</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {loading && (
            <div className="text-center py-12">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-800 border-t-monad-400 animate-spin mx-auto mb-3" />
              <p className="text-monad-400 text-xs font-mono animate-pulse">initializing negotiation protocol...</p>
            </div>
          )}

          {neg?.messages.map((msg) => {
            const isMine = msg.fromRole === 'buyer' && !isSeller;
            const isAgent = msg.fromRole === 'seller_agent' || msg.fromRole === 'buyer_agent';
            const isSellerRole = msg.fromRole === 'seller' || msg.fromRole === 'seller_agent';
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl border px-3 py-2.5 text-xs font-mono ${ROLE_COLORS[msg.fromRole] || ROLE_COLORS.seller}`}
                  style={{ boxShadow: isAgent ? '0 0 16px rgba(131,110,249,0.08)' : undefined }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {isAgent && <Zap className="w-2.5 h-2.5 text-monad-400" strokeWidth={2} />}
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider">{ROLE_LABELS[msg.fromRole]}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.proposedPrice != null && (
                    <div className="mt-2 pt-2 border-t border-current/15 font-bold text-monad-300">
                      ⬡ {msg.proposedPrice} {neg.listing?.currency}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {agentTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl border px-3 py-2.5 flex items-center gap-2" style={{ borderColor: 'rgba(131,110,249,0.2)', background: 'rgba(131,110,249,0.06)' }}>
                <Zap className="w-3 h-3 text-monad-400" strokeWidth={2} />
                <span className="text-xs font-mono text-monad-400/80">{agentTyping === 'seller_agent' ? 'seller' : 'buyer'} agent thinking</span>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 h-1 rounded-full bg-monad-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}

          {/* AGREED — pay or confirm */}
          {neg?.status === 'AGREED' && !paid && (
            <div className="text-center py-2">
              <div className="rounded-2xl px-5 py-4" style={{ border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.04)' }}>
                <p className="text-green-400 font-mono text-xs font-bold mb-1">✓ DEAL AGREED</p>
                {neg.agreedPrice != null && (
                  <p className="text-green-300 font-mono text-2xl font-black mb-3">⬡ {neg.agreedPrice} <span className="text-base font-normal text-green-500">{neg.listing?.currency}</span></p>
                )}
                {isSeller ? (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs font-mono">Your agent agreed this price. Confirm to open DM with buyer.</p>
                    <button onClick={accept} disabled={sending} className="w-full text-xs font-mono font-bold py-2.5 px-4 rounded-xl disabled:opacity-40 transition-all" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}>
                      {sending ? 'confirming...' : 'confirm deal + open DM chat'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs font-mono">Pay with MetaMask to complete the purchase.</p>
                    <button onClick={payWithEth} disabled={paying} className="w-full text-xs font-mono font-bold py-2.5 px-4 rounded-xl disabled:opacity-40 transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg,#836EF9,#6b4fe0)', border: '1px solid rgba(131,110,249,0.4)', color: 'white' }}>
                      {paying ? 'awaiting MetaMask...' : `⬡ pay ${neg.agreedPrice} ${neg.listing?.currency}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {paid && (
            <div className="text-center py-2">
              <div className="rounded-2xl px-5 py-4" style={{ border: '1px solid rgba(131,110,249,0.4)', background: 'rgba(131,110,249,0.07)' }}>
                <p className="text-monad-300 font-mono text-sm font-bold mb-1">✓ PAYMENT SENT</p>
                <p className="text-zinc-500 text-xs font-mono mb-3">Check your DMs to coordinate with the seller.</p>
                <Link href="/dm" className="inline-block text-xs font-mono font-bold py-2 px-4 rounded-xl transition-all" style={{ background: 'rgba(131,110,249,0.2)', border: '1px solid rgba(131,110,249,0.4)', color: '#c4b5fd' }}>open messages →</Link>
              </div>
            </div>
          )}

          {neg?.status === 'REJECTED' && (
            <div className="text-center py-2">
              <div className="inline-block border border-red-400/25 bg-red-400/4 rounded-xl px-4 py-3">
                <p className="text-red-400 font-mono text-xs font-bold">✗ NEGOTIATION REJECTED</p>
              </div>
            </div>
          )}

          {neg?.status === 'EXPIRED' && (
            <div className="text-center py-2">
              <div className="inline-block border border-zinc-700/50 bg-zinc-800/20 rounded-xl px-4 py-3">
                <p className="text-zinc-500 font-mono text-xs">Negotiation expired after max turns — no deal reached.</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
        {error && <p className="px-4 text-red-400 text-xs font-mono py-1 shrink-0">{error}</p>}

        {/* HUMAN mode footer — only visible when both parties agreed to manual negotiation */}
        {neg?.status === 'ACTIVE' && neg.mode === 'HUMAN' && (
          <div className="border-t px-4 py-3 space-y-2 shrink-0" style={{ borderColor: 'rgba(131,110,249,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
              <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider">manual negotiation</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="type your message..."
                className="flex-1 text-xs px-3 py-2 rounded-xl font-mono transition-all"
                style={{ background: 'rgba(131,110,249,0.05)', border: '1px solid rgba(131,110,249,0.2)', color: '#e4e4e7', outline: 'none' }}
                disabled={sending}
              />
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder={`offer (${listing.currency})`}
                className="w-28 text-xs px-3 py-2 rounded-xl font-mono transition-all"
                style={{ background: 'rgba(131,110,249,0.05)', border: '1px solid rgba(131,110,249,0.2)', color: '#e4e4e7', outline: 'none' }}
                min="0"
                step="0.001"
                disabled={sending}
              />
            </div>
            <div className="flex gap-2 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={accept}
                  disabled={sending}
                  className="text-green-400 text-xs font-mono px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all hover:bg-green-400/10"
                  style={{ border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)' }}
                >
                  accept deal
                </button>
                <button
                  onClick={reject}
                  disabled={sending}
                  className="text-red-400 text-xs font-mono px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all hover:bg-red-400/10"
                  style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}
                >
                  reject
                </button>
              </div>
              <button
                onClick={send}
                disabled={sending || !message.trim()}
                className="flex items-center gap-1.5 text-xs font-mono font-bold py-1.5 px-4 rounded-xl disabled:opacity-40 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,rgba(131,110,249,0.3),rgba(131,110,249,0.15))', border: '1px solid rgba(131,110,249,0.4)', color: '#c4b5fd' }}
              >
                {sending ? '...' : <><Send className="w-3 h-3" strokeWidth={2} /> send</>}
              </button>
            </div>
          </div>
        )}
      </div>
      {consentData && neg && (
        <PaymentConsentModal
          listingTitle={listing.title}
          sellerAddress={consentData.sellerWallet}
          sellerAmountETH={(Number(consentData.sellerWei) / 1e18).toFixed(6)}
          platformFeeETH={(Number(consentData.platformWei) / 1e18).toFixed(6)}
          totalETH={(Number(consentData.totalWei) / 1e18).toFixed(6)}
          totalUsd={consentData.totalUsd.toFixed(2)}
          buyerAddress={consentData.buyerAddress}
          onConsent={executePayment}
          onCancel={() => setConsentData(null)}
        />
      )}
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({ listing, isAuthenticated, onNegotiate }: { listing: MarketListing; isAuthenticated: boolean; onNegotiate: () => void }) {
  return (
    <div className="group flex flex-col rounded-2xl border overflow-hidden h-full transition-all duration-200 hover:border-monad-500/40 hover:shadow-[0_0_32px_rgba(131,110,249,0.08)]"
      style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#09090f' }}>

      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, rgba(131,110,249,0.6) 0%, rgba(131,110,249,0.1) 100%)' }} />

      {/* Card header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.2)' }}>
          <Bot className="w-5 h-5 text-monad-400" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">{listing.title}</h3>
            {listing.agentEndpoint && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono"
                style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.25)', color: '#c4b5fd' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-monad-400 animate-pulse inline-block" />
                live
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {listing.seller.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.seller.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(131,110,249,0.2)' }}>
                <span className="text-[8px] font-bold text-monad-400">{(listing.seller.username || 'A').charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="text-xs text-zinc-600 font-mono">@{listing.seller.username || 'anonymous'}</span>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-mono border ${TYPE_COLORS[listing.type] || TYPE_COLORS.OTHER}`}>
          {listing.type.toLowerCase().replace('_', ' ')}
        </span>
      </div>

      {/* Description */}
      <div className="px-4 pb-3 flex-1">
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {listing.description || 'No description provided.'}
        </p>
        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {listing.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-mono"
                style={{ background: 'rgba(131,110,249,0.06)', border: '1px solid rgba(131,110,249,0.12)', color: '#a78bfa' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div>
          {listing.price === 0 ? (
            <span className="text-sm font-bold font-mono text-monad-400">Free</span>
          ) : (
            <span className="text-sm font-bold font-mono text-zinc-100">
              {listing.price} <span className="text-xs font-normal text-zinc-500">{listing.currency}</span>
            </span>
          )}
          {listing.minPrice != null && (
            <p className="text-[11px] text-zinc-600 font-mono">floor: {listing.minPrice} {listing.currency}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agents/${listing.id}`}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-500 border transition-all hover:text-zinc-300"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            View
          </Link>
          <button
            onClick={() => { if (!isAuthenticated) { window.location.href = '/auth'; return; } onNegotiate(); }}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#836EF9,#6b4fe0)', border: '1px solid rgba(131,110,249,0.4)' }}
          >
            {listing.price === 0 ? 'Deploy' : 'Negotiate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── API Key Manager ────────────────────────────────────────────────────────────

function ApiKeyManager({ listing }: { listing: MarketListing }) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<ApiKeyInfo[]>(`/market/${listing.id}/apikeys`)
      .then(setKeys)
      .catch(() => setError('Failed to load API keys'))
      .finally(() => setLoading(false));
  }, [listing.id]);

  const generate = async () => {
    setGenerating(true); setError('');
    try {
      const result = await api.post<{ key: string; label: string | null }>(`/market/${listing.id}/apikeys`, { label: newKeyLabel.trim() || undefined });
      setRevealedKey(result.key);
      setNewKeyLabel('');
      // Refresh list (won't show raw key again)
      const updated = await api.get<ApiKeyInfo[]>(`/market/${listing.id}/apikeys`);
      setKeys(updated);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to generate key'); }
    finally { setGenerating(false); }
  };

  const revoke = async (keyId: string) => {
    setRevokingId(keyId); setError('');
    try {
      await api.delete(`/market/apikeys/${keyId}`);
      setKeys(prev => prev.filter(k => k.id !== keyId));
      setConfirmRevokeId(null);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to revoke key'); }
    finally { setRevokingId(null); }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl border" style={{ borderColor: 'rgba(131,110,249,0.15)', background: 'rgba(131,110,249,0.03)' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgba(131,110,249,0.1)' }}>
        <Key className="w-3 h-3 text-monad-400" />
        <span className="text-monad-400 font-mono text-xs font-bold">API Keys</span>
        <span className="text-zinc-600 font-mono text-xs ml-auto">{keys.length}/3</span>
      </div>

      {/* Revealed key banner */}
      {revealedKey && (
        <div className="mx-3 mt-3 rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="text-green-400 font-mono text-xs font-bold mb-1">✓ New key generated — save it now, it won&apos;t be shown again</p>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-green-300 font-mono text-xs flex-1 break-all">{revealedKey}</code>
            <button onClick={() => copyKey(revealedKey)} className="text-xs font-mono px-2 py-1 rounded shrink-0 transition-all" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: copied ? '#4ade80' : '#86efac' }}>
              {copied ? '✓ copied' : <Copy className="w-3 h-3" />}
            </button>
            <button onClick={() => setRevealedKey(null)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Key list */}
      <div className="px-3 pt-2 pb-1 space-y-2">
        {loading && <p className="text-zinc-600 font-mono text-xs py-1">loading...</p>}
        {!loading && keys.length === 0 && <p className="text-zinc-600 font-mono text-xs py-1">no keys yet</p>}
        {keys.map(k => (
          <div key={k.id} className="flex items-center gap-2 py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-300 font-mono text-xs font-semibold">{k.label || 'unnamed key'}</p>
              <p className="text-zinc-600 font-mono text-xs">
                created {timeAgo(k.createdAt)}{k.lastUsedAt ? ` · last used ${timeAgo(k.lastUsedAt)}` : ' · never used'}
              </p>
            </div>
            {confirmRevokeId === k.id ? (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-zinc-500 font-mono text-xs">revoke?</span>
                <button onClick={() => revoke(k.id)} disabled={revokingId === k.id} className="text-red-400 font-mono text-xs px-2 py-0.5 rounded disabled:opacity-40" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>{revokingId === k.id ? '...' : 'yes'}</button>
                <button onClick={() => setConfirmRevokeId(null)} className="text-zinc-500 font-mono text-xs px-2 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>no</button>
              </div>
            ) : (
              <button onClick={() => setConfirmRevokeId(k.id)} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0" title="Revoke key">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Generate new key */}
      {keys.length < 3 && (
        <div className="flex gap-2 px-3 pb-3 pt-1">
          <input
            type="text"
            value={newKeyLabel}
            onChange={e => setNewKeyLabel(e.target.value)}
            placeholder="label (optional)"
            maxLength={40}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg font-mono"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }}
          />
          <button onClick={generate} disabled={generating} className="text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-40 transition-all" style={{ background: 'rgba(131,110,249,0.15)', border: '1px solid rgba(131,110,249,0.3)', color: '#c4b5fd' }}>
            {generating ? '...' : <><Plus className="w-3 h-3" /> generate</>}
          </button>
        </div>
      )}
      {error && <p className="text-red-400 font-mono text-xs px-3 pb-2">{error}</p>}
    </div>
  );
}

// ── My Agent Card (publications) ──────────────────────────────────────────────

function MyAgentCard({ listing, onDelete }: { listing: MarketListing; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    setDeleting(true); setDeleteError('');
    try {
      await api.delete(`/market/${listing.id}`);
      onDelete(listing.id);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-xl border transition-colors" style={{ borderColor: expanded ? 'rgba(131,110,249,0.25)' : 'rgba(255,255,255,0.07)', background: '#0a0a12' }}>
      <div className="flex items-center gap-3 p-3">
        {/* Type icon */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.2)' }}>
          <Bot className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-zinc-100 truncate">{listing.title}</h3>
            <Badge className={`rounded-full border border-dashed px-2 py-0 text-xs font-mono ${TYPE_COLORS[listing.type] || TYPE_COLORS.OTHER}`}>{listing.type.toLowerCase().replace('_', ' ')}</Badge>
            {listing.agentEndpoint && <Badge className="rounded-full bg-monad-500/15 border border-monad-500/25 px-2 py-0 text-xs font-mono text-monad-400">AI endpoint</Badge>}
            {listing.fileKey && <Badge className="rounded-full bg-zinc-800/60 border border-white/08 px-2 py-0 text-xs font-mono text-zinc-500">file uploaded</Badge>}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            <span className="font-mono font-bold text-monad-300">{listing.price} {listing.currency}</span>
            {listing.minPrice != null && <span className="text-zinc-600"> · floor: {listing.minPrice}</span>}
            <span className="text-zinc-700"> · {timeAgo(listing.createdAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link href={`/agents/${listing.id}`} className="text-xs font-mono px-2.5 py-1.5 rounded-lg text-zinc-500 border border-dashed border-zinc-700/40 hover:text-zinc-300 hover:border-zinc-600/60 transition-all">view</Link>
          <button onClick={() => setExpanded(p => !p)} className="text-xs font-mono px-2.5 py-1.5 rounded-lg transition-all" style={{ background: expanded ? 'rgba(131,110,249,0.15)' : 'transparent', border: `1px solid ${expanded ? 'rgba(131,110,249,0.3)' : 'rgba(255,255,255,0.08)'}`, color: expanded ? '#c4b5fd' : '#71717a' }}>
            {expanded ? 'collapse' : 'manage'}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDelete} disabled={deleting} className="text-xs font-mono px-2 py-1.5 rounded-lg text-red-400 disabled:opacity-40 transition-all" style={{ border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)' }}>{deleting ? '...' : 'confirm'}</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs font-mono px-2 py-1.5 rounded-lg text-zinc-500 transition-all" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/5 transition-all" title="Delete listing">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {deleteError && <p className="text-red-400 font-mono text-xs px-3 pb-2">{deleteError}</p>}
      {expanded && <div className="px-3 pb-3"><ApiKeyManager listing={listing} /></div>}
    </div>
  );
}

// ── Create Listing Form ────────────────────────────────────────────────────────

function CreateListingForm({ onCreated, onCancel }: { onCreated: (listing: MarketListing) => void; onCancel: () => void }) {
  const { refresh } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', type: 'AI_AGENT' as MarketListing['type'], price: '', minPrice: '', currency: 'ETH', tags: '', agentUrl: '', agentEndpoint: '' });
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMeta | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true); setScanning(false); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      setScanning(true);
      const result = await api.upload<UploadedFileMeta>('/market/upload', formData);
      setUploadedFile(result as UploadedFileMeta);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Upload failed'); }
    finally { setUploading(false); setScanning(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { setError('Title and description are required'); return; }
    setSubmitting(true); setError('');
    try {
      const payload: any = {
        title: form.title.trim(), description: form.description.trim(), type: form.type,
        price: parseFloat(form.price) || 0, currency: form.currency,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        ...(form.minPrice ? { minPrice: parseFloat(form.minPrice) } : {}),
        ...(form.agentEndpoint.trim() ? { agentEndpoint: form.agentEndpoint.trim() } : {}),
        ...(uploadedFile ? { fileKey: uploadedFile.fileKey, fileName: uploadedFile.fileName, fileSize: uploadedFile.fileSize, fileMimeType: uploadedFile.fileMimeType } : {}),
      };
      const result = await api.post<MarketListing>('/market', payload);
      await refresh();
      onCreated(result);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to create listing'); }
    finally { setSubmitting(false); }
  };

  const field = (key: keyof typeof form, value: string) => setForm(p => ({ ...p, [key]: value }));

  return (
    <div className="rounded-2xl border p-5" style={{ background: '#0a0a12', borderColor: 'rgba(131,110,249,0.2)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-zinc-100">Deploy New Agent</h2>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Type selector */}
        <div className="flex gap-2 flex-wrap">
          {(['AI_AGENT', 'BOT', 'SCRIPT', 'OTHER'] as const).map(t => (
            <button key={t} type="button" onClick={() => field('type', t)} className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${form.type === t ? 'bg-monad-500/20 border-monad-500/40 text-monad-300' : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/20'}`}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Title *" value={form.title} onChange={e => field('title', e.target.value)} maxLength={100} required className="w-full text-sm px-3 py-2 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
        <textarea placeholder="Description *" value={form.description} onChange={e => field('description', e.target.value)} maxLength={1000} rows={3} required className="w-full text-sm px-3 py-2 rounded-lg font-mono resize-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
        <div className="flex gap-2">
          <input type="number" placeholder="Price" value={form.price} onChange={e => field('price', e.target.value)} min="0" step="0.01" className="flex-1 text-sm px-3 py-2 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
          <input type="number" placeholder="Floor price" value={form.minPrice} onChange={e => field('minPrice', e.target.value)} min="0" step="0.01" className="flex-1 text-sm px-3 py-2 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
          <select value={form.currency} onChange={e => field('currency', e.target.value)} className="w-24 text-sm px-2 py-2 rounded-lg font-mono" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }}>
            {['ETH', 'BOLTY'].map(c => <option key={c} value={c}>{c === 'BOLTY' ? 'BOLTY (0 tax)' : c}</option>)}
          </select>
        </div>
        <input type="text" placeholder="Tags (comma separated)" value={form.tags} onChange={e => field('tags', e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
        {ACCEPTS_AGENT_ENDPOINT.has(form.type) && (
          <input type="url" placeholder="AI negotiation webhook (optional)" value={form.agentEndpoint} onChange={e => field('agentEndpoint', e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
        )}
        {ACCEPTS_FILE.has(form.type) && (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed py-6 text-center cursor-pointer transition-colors hover:border-monad-500/40"
              style={{ borderColor: uploadedFile ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)' }}
            >
              {uploading ? (
                <p className="text-xs font-mono text-monad-400 animate-pulse">{scanning ? 'scanning for security threats...' : 'uploading...'}</p>
              ) : uploadedFile ? (
                <div className="space-y-1">
                  {uploadedFile.scanPassed ? <ShieldCheck className="w-5 h-5 text-green-400 mx-auto" /> : <ShieldAlert className="w-5 h-5 text-red-400 mx-auto" />}
                  <p className="text-xs font-mono text-green-400">{uploadedFile.fileName}</p>
                  <p className="text-xs font-mono text-zinc-600">{formatBytes(uploadedFile.fileSize)}</p>
                  {uploadedFile.scanNote && <p className="text-xs font-mono text-zinc-500">{uploadedFile.scanNote}</p>}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-mono text-zinc-500">click to upload agent file</p>
                  <p className="text-zinc-700 font-mono text-xs">.py .js .ts .zip .json .yaml .sh .txt — max 10 MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".py,.js,.ts,.zip,.json,.yaml,.yml,.sh,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
          </div>
        )}
        {error && <p className="text-red-400 font-mono text-xs">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl font-mono font-bold text-sm disabled:opacity-40 transition-all" style={{ background: 'linear-gradient(135deg, rgba(131,110,249,0.4), rgba(99,102,241,0.3))', border: '1px solid rgba(131,110,249,0.4)', color: '#e2d9ff' }}>
          {submitting ? 'deploying...' : 'deploy agent →'}
        </button>
      </form>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--bg)' }} />}>
      <AgentsPageContent />
    </Suspense>
  );
}

function AgentsPageContent() {
  const { isAuthenticated, user, refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'mine' ? 'mine' : 'market';

  const [activeTab, setActiveTab] = useState<'market' | 'mine'>(initialTab);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [myListings, setMyListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [type, setType] = useState('AI_AGENT');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [negotiatingListing, setNegotiatingListing] = useState<MarketListing | null>(null);

  // Sync tab to URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'mine') setActiveTab('mine');
    else setActiveTab('market');
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (type !== 'ALL') params.set('type', type);
      if (search) params.set('search', search);
      const data = await api.get<{ data: MarketListing[] }>(`/market?${params}`);
      setListings(data.data);
    } catch { setError('Failed to load listings'); } finally { setLoading(false); }
  }, [type, search]);

  const fetchMyListings = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setMyLoading(true);
    try {
      const data = await api.get<{ data: MarketListing[] }>('/market');
      setMyListings(data.data.filter(l => l.seller.id === user.id));
    } catch { setError('Failed to load your listings'); } finally { setMyLoading(false); }
  }, [isAuthenticated, user]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    if (activeTab === 'mine' && isAuthenticated) fetchMyListings();
  }, [activeTab, fetchMyListings, isAuthenticated]);

  const switchTab = (tab: 'market' | 'mine') => {
    setActiveTab(tab);
    router.push(tab === 'mine' ? '/market/agents?tab=mine' : '/market/agents', { scroll: false });
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <BackgroundBeams className="opacity-40" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-16">

        {/* Header */}
        <div className="mb-8 pb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 text-xs font-mono mb-4">
            <Link href="/market" className="text-zinc-600 hover:text-monad-400 transition-colors">Market</Link>
            <span className="text-zinc-800">/</span>
            <span className="text-zinc-400">AI Agents</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-2">Marketplace</p>
              <h1 className="text-3xl font-black text-white mb-1">AI Agents</h1>
              <p className="text-zinc-500 text-sm">Discover autonomous agents, bots, and automation tools built by the community.</p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => { switchTab('mine'); setShowCreate(true); }}
                className="flex items-center gap-2 text-sm font-mono font-medium px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#836EF9,#6b4fe0)', border: '1px solid rgba(131,110,249,0.4)' }}
              >
                <Plus className="w-4 h-4" /> Deploy Agent
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {([['market', 'Marketplace', <Globe key="g" className="w-3.5 h-3.5" />], ['mine', 'My Agents', <Cpu key="c" className="w-3.5 h-3.5" />]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-mono font-medium transition-all border-b-2 -mb-px ${
                activeTab === id
                  ? 'border-monad-400 text-monad-300'
                  : 'border-transparent text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── Marketplace tab ── */}
        {activeTab === 'market' && (
          <>
            {/* Search + filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full text-sm px-4 py-2 rounded-xl font-mono outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(131,110,249,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-mono border transition-all ${
                      type === t
                        ? 'text-monad-300'
                        : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                    style={type === t
                      ? { background: 'rgba(131,110,249,0.12)', borderColor: 'rgba(131,110,249,0.35)' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mb-4 font-mono">{error}</p>}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border h-52 animate-pulse"
                    style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#09090f' }} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20 border border-dashed rounded-2xl" style={{ borderColor: 'rgba(131,110,249,0.15)' }}>
                <Bot className="w-10 h-10 text-monad-400/20 mx-auto mb-3" strokeWidth={1} />
                <p className="text-zinc-600 text-sm font-mono">No agents found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(l => (
                  <AgentCard key={l.id} listing={l} isAuthenticated={isAuthenticated} onNegotiate={() => setNegotiatingListing(l)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Publications tab ── */}
        {activeTab === 'mine' && (
          <>
            {!isAuthenticated ? (
              <div className="text-center py-20">
                <p className="text-zinc-500 font-mono text-sm mb-4">sign in to manage your agents</p>
                <Link href="/auth" className="text-xs font-mono px-4 py-2 rounded-xl" style={{ background: 'rgba(131,110,249,0.15)', border: '1px solid rgba(131,110,249,0.3)', color: '#c4b5fd' }}>sign in</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-zinc-500 font-mono">{myListings.length} agent{myListings.length !== 1 ? 's' : ''} published</p>
                  <button
                    onClick={() => setShowCreate(p => !p)}
                    className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg transition-all"
                    style={{ background: showCreate ? 'rgba(131,110,249,0.2)' : 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.3)', color: '#c4b5fd' }}
                  >
                    <Plus className="w-3 h-3" /> {showCreate ? 'cancel' : 'deploy new'}
                  </button>
                </div>

                {showCreate && (
                  <div className="mb-6">
                    <CreateListingForm
                      onCreated={(l) => { setMyListings(p => [l, ...p]); setShowCreate(false); }}
                      onCancel={() => setShowCreate(false)}
                    />
                  </div>
                )}

                {myLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0a0a12] h-20 animate-pulse" />)}
                  </div>
                ) : myListings.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Bot className="w-10 h-10 text-zinc-700 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-zinc-600 font-mono text-sm mb-2">no agents deployed yet</p>
                    <button onClick={() => setShowCreate(true)} className="text-xs font-mono text-monad-400 hover:text-monad-300 transition-colors">deploy your first agent →</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myListings.map(l => (
                      <MyAgentCard key={l.id} listing={l} onDelete={(id) => setMyListings(p => p.filter(x => x.id !== id))} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Negotiation modal */}
        {negotiatingListing && user && (
          <NegotiationModal listing={negotiatingListing} onClose={() => setNegotiatingListing(null)} userId={user.id} />
        )}
      </div>
    </div>
  );
}
