'use client';

import { Bot, X, GitBranch, Star, TrendingUp, Clock, Package, Zap, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getMetaMaskProvider } from '@/lib/wallet/ethereum';

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
  listing: {
    id: string;
    title: string;
    price: number;
    currency: string;
    sellerId: string;
    agentEndpoint?: string | null;
    minPrice?: number | null;
  };
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

const TYPE_COLORS: Record<string, string> = {
  REPO: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
  BOT: 'text-monad-400 border-monad-400/20 bg-monad-400/5',
  AI_AGENT: 'text-violet-400 border-violet-400/20 bg-violet-400/5',
  SCRIPT: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
  OTHER: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
};

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
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

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
  const [consentData, setConsentData] = useState<{
    sellerWallet: string;
    buyerAddress: string;
    sellerWei: bigint;
    platformWei: bigint;
    totalWei: bigint;
    negotiationId: string;
    amountWei: string;
    totalUsd: number;
  } | null>(null);

  useEffect(() => {
    api
      .post<Negotiation>(`/market/${listing.id}/negotiate`, {})
      .then(setNeg)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to start negotiation'),
      )
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
      const u = await api.post<Negotiation>(`/market/negotiations/${neg.id}/accept`, {});
      setNeg(u);
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
      const u = await api.post<Negotiation>(`/market/negotiations/${neg.id}/reject`, {});
      setNeg(u);
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
      const ethereum = getMetaMaskProvider();
      if (!ethereum) {
        setError('MetaMask not found');
        setPaying(false);
        return;
      }
      const sellerData = await api.get<any>(`/market/${listing.id}`);
      const sellerWallet = sellerData?.seller?.walletAddress;
      if (!sellerWallet) {
        setError('Seller has no wallet linked');
        setPaying(false);
        return;
      }
      let ethPrice = 2000;
      try {
        const p = await api.get<any>('/chart/eth-price');
        if (p.price) ethPrice = p.price;
      } catch {
        // ignore
      }
      const totalWei = BigInt(Math.ceil(neg.agreedPrice * 1e18));
      const totalUsd = neg.agreedPrice * ethPrice;
      const sellerWei = (totalWei * BigInt(975)) / BigInt(1000);
      const platformWei = totalWei - sellerWei;
      const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      setConsentData({
        sellerWallet,
        buyerAddress: accounts[0],
        sellerWei,
        platformWei,
        totalWei,
        negotiationId: neg.id,
        amountWei: totalWei.toString(),
        totalUsd,
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(
        msg.includes('rejected') ? 'Payment cancelled' : 'Payment failed: ' + msg.slice(0, 80),
      );
    } finally {
      setPaying(false);
    }
  };

  const executePayment = async (signature: string, consentMessage: string) => {
    if (!consentData) return;
    const { sellerWallet, buyerAddress, sellerWei, platformWei, negotiationId, amountWei } =
      consentData;
    setConsentData(null);
    const ethereum = getMetaMaskProvider();
    if (!ethereum) {
      setError('MetaMask not found');
      return;
    }
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
    try {
      const txHash = (await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: buyerAddress, to: sellerWallet, value: '0x' + sellerWei.toString(16) }],
      })) as string;
      let platformFeeTxHash: string | undefined;
      if (platformWallet) {
        platformFeeTxHash = (await ethereum.request({
          method: 'eth_sendTransaction',
          params: [
            { from: buyerAddress, to: platformWallet, value: '0x' + platformWei.toString(16) },
          ],
        })) as string;
      }
      await api.post(`/market/${listing.id}/purchase`, {
        txHash,
        amountWei,
        negotiationId,
        platformFeeTxHash,
        consentSignature: signature,
        consentMessage,
      });
      setPaid(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg.includes('rejected') ? 'Payment cancelled' : 'Payment failed: ' + msg.slice(0, 80));
    }
  };

  const isSeller = neg?.listing?.sellerId === userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      {consentData && (
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

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-monad-500/20"
        style={{ background: 'var(--bg-card)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-light text-white">{listing.title}</h2>
            <p className="text-sm text-zinc-400">Starting at {listing.price} {listing.currency}</p>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <motion.div
                className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-monad-400 mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          ) : !neg ? (
            <p className="text-red-400">{error || 'Failed to load negotiation'}</p>
          ) : paid ? (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
              Payment successful!
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[300px] overflow-y-auto space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
                {neg.messages.map((msg) => (
                  <div key={msg.id} className={`text-sm ${ROLE_COLORS[msg.fromRole] || ''} p-2.5 rounded-lg border`}>
                    <p className="font-light">{msg.content}</p>
                    {msg.proposedPrice && <p className="text-xs mt-1">Price: {msg.proposedPrice}</p>}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {neg.status === 'ACTIVE' && (
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Offer price (optional)"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 text-sm"
                  />
                  <button
                    onClick={send}
                    disabled={sending || !message.trim()}
                    className="w-full py-2 rounded-lg bg-monad-500 hover:bg-monad-600 text-white font-light text-sm disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              )}

              {isSeller && neg.status === 'ACTIVE' && (
                <div className="flex gap-2">
                  <button
                    onClick={accept}
                    disabled={sending}
                    className="flex-1 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 font-light text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={reject}
                    disabled={sending}
                    className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-light text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}

              {!isSeller && neg.status === 'AGREED' && (
                <button
                  onClick={payWithEth}
                  disabled={paying}
                  className="w-full py-2 rounded-lg bg-monad-500 hover:bg-monad-600 text-white font-light text-sm disabled:opacity-50"
                >
                  {paying ? 'Processing...' : 'Pay with ETH'}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function MarketPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'browse' | 'activity' | 'my-items'>('browse');
  const [recentListings, setRecentListings] = useState<MarketListing[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [activeNeg, setActiveNeg] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [listings, feed] = await Promise.all([
          api.get<MarketListing[]>('/market/listings?limit=4'),
          api.get<FeedPost[]>('/market/feed?limit=3'),
        ]);
        setRecentListings(listings || []);
        setFeedPosts(feed || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-monad-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    );
  }

  const TABS = [
    { id: 'browse', label: 'Browse', icon: <Star size={16} /> },
    { id: 'activity', label: 'Activity', icon: <TrendingUp size={16} /> },
    { id: 'my-items', label: 'My Items', icon: <Package size={16} /> },
  ] as const;

  return (
    <div style={{ background: 'var(--bg)', height: 'calc(100vh - 5rem)' }} className="overflow-hidden flex flex-col">
      {activeNeg && user && (
        <NegotiationModal listing={activeNeg} onClose={() => setActiveNeg(null)} userId={user.id} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 md:px-8 pt-6 pb-4 border-b border-monad-500/10 flex-shrink-0"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-light text-white">Marketplace</h1>
              <p className="text-sm text-zinc-400">AI agents, tools, and repositories</p>
            </div>
            <div className="flex gap-2">
              <Link href="/market/agents" className="px-4 py-2 text-sm rounded-lg border border-monad-500/30 hover:bg-monad-500/10 text-white font-light transition-all">
                Browse Agents
              </Link>
              <Link href="/market/repos" className="px-4 py-2 text-sm rounded-lg border border-monad-500/30 hover:bg-monad-500/10 text-white font-light transition-all">
                Browse Repos
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-sm font-light flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-monad-500/20 text-monad-300 border border-monad-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
          <AnimatePresence mode="wait">
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-light text-white mb-3">Featured</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentListings.slice(0, 2).map((listing) => (
                      <motion.button
                        key={listing.id}
                        onClick={() => setActiveNeg(listing)}
                        whileHover={{ y: -2 }}
                        className="text-left p-4 rounded-xl border border-monad-500/15 hover:border-monad-500/30 bg-monad-500/5 hover:bg-monad-500/10 transition-all"
                      >
                        <p className="font-light text-white mb-1">{listing.title}</p>
                        <p className="text-xs text-zinc-400">{listing.price} {listing.currency}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-light text-white mb-3">Recent</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recentListings.slice(2, 4).map((listing) => (
                      <motion.button
                        key={listing.id}
                        onClick={() => setActiveNeg(listing)}
                        whileHover={{ y: -2 }}
                        className="text-left p-3 rounded-lg border border-white/10 hover:border-monad-500/20 bg-white/5 hover:bg-monad-500/5 transition-all"
                      >
                        <p className="text-sm font-light text-white">{listing.title}</p>
                        <p className="text-xs text-zinc-500 mt-1">{listing.price} {listing.currency}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <h2 className="text-lg font-light text-white mb-4">Recent Activity</h2>
                {feedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg border border-white/10 bg-white/5"
                  >
                    <p className="text-sm font-light text-white">{post.listing.title}</p>
                    <p className="text-xs text-zinc-400 mt-1">{post.content}</p>
                    <p className="text-xs text-zinc-600 mt-2">{timeAgo(post.createdAt)}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'my-items' && (
              <motion.div
                key="my-items"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-12"
              >
                <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-light">No items yet</p>
                <Link href="/profile?tab=listings" className="text-sm text-monad-400 hover:text-monad-300 mt-2 inline-block">
                  Create your first listing →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
