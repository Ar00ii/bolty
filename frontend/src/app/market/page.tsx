'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, TrendingUp, Package, Bot, GitBranch, Zap, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { HexagonPattern } from '@/components/ui/HexagonPattern';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
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

const TYPE_ACCENTS: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  REPO: { color: '#3b82f6', icon: GitBranch },
  BOT: { color: '#836EF9', icon: Bot },
  AI_AGENT: { color: '#a855f7', icon: Bot },
  SCRIPT: { color: '#06B6D4', icon: Zap },
  OTHER: { color: '#64748b', icon: Package },
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
      setError(
        msg.includes('rejected') ? 'Payment cancelled' : 'Payment failed: ' + msg.slice(0, 80),
      );
    }
  };

  const isSeller = neg?.listing?.sellerId === userId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
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
            <p className="text-sm text-zinc-400">
              Starting at {listing.price} {listing.currency}
            </p>
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
                  <div
                    key={msg.id}
                    className={`text-sm ${ROLE_COLORS[msg.fromRole] || ''} p-2.5 rounded-lg border`}
                  >
                    <p className="font-light">{msg.content}</p>
                    {msg.proposedPrice && (
                      <p className="text-xs mt-1">Price: {msg.proposedPrice}</p>
                    )}
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

  const featured = recentListings.slice(0, 2);
  const recent = recentListings.slice(2, 4);

  return (
    <div
      style={{ background: 'var(--bg)', height: 'calc(100vh - 5rem)' }}
      className="relative overflow-hidden flex flex-col"
    >
      {/* Hexagon pattern backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.25]">
        <HexagonPattern />
      </div>

      {/* Grid overlay */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.08]"
      >
        <defs>
          <pattern id="market-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#market-grid)" />
      </svg>

      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(131,110,249,0.18), transparent 60%), radial-gradient(ellipse 60% 40% at 85% 100%, rgba(6,182,212,0.1), transparent 60%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(236,72,153,0.05), transparent 60%)',
        }}
      />

      {/* Scan line decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(131,110,249,0.6), rgba(6,182,212,0.4), transparent)',
        }}
      />

      {activeNeg && user && (
        <NegotiationModal listing={activeNeg} onClose={() => setActiveNeg(null)} userId={user.id} />
      )}

      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative px-6 md:px-10 pt-10 pb-6 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {/* Corner brackets */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/20 pointer-events-none" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/20 pointer-events-none" />

          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-light">
                  Dashboard
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-light text-white leading-tight">
                <GradientText gradient="purple">Marketplace</GradientText>
              </h1>
              <p className="text-sm text-zinc-400 font-light mt-2 max-w-lg">
                Discover, publish, and sell AI agents, repositories, and services.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/market/agents"
                className="group inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-purple-500/40 bg-white/[0.02] hover:bg-purple-500/[0.06] text-white font-light transition-all"
              >
                <Bot className="w-4 h-4 text-purple-400" />
                Browse Agents
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
              <ShimmerButton
                as={Link}
                href="/market/repos"
                className="text-white text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all inline-flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Browse Repos
              </ShimmerButton>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-white/5 -mb-6 pb-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-4 py-2.5 text-sm font-light flex items-center gap-2 transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className={isActive ? 'text-purple-400' : ''}>{tab.icon}</span>
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute left-0 right-0 -bottom-px h-0.5"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, #a855f7 30%, #836EF9 70%, transparent)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10 max-w-6xl mx-auto"
              >
                {/* Featured */}
                <section>
                  <SectionHeading title="Featured" subtitle="Handpicked this week" />
                  {featured.length === 0 ? (
                    <EmptyState
                      icon={Star}
                      title="No featured listings yet"
                      description="Top picks from the community will appear here soon."
                    />
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {featured.map((listing, i) => (
                        <FeaturedCard
                          key={listing.id}
                          listing={listing}
                          index={i}
                          onOpen={() => setActiveNeg(listing)}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Recent */}
                <section>
                  <SectionHeading title="Recent" subtitle="Just published" />
                  {recent.length === 0 ? (
                    <EmptyState
                      icon={TrendingUp}
                      title="No recent activity"
                      description="New listings will show up here as they launch."
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recent.map((listing, i) => (
                        <RecentCard
                          key={listing.id}
                          listing={listing}
                          index={i}
                          onOpen={() => setActiveNeg(listing)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 max-w-4xl mx-auto"
              >
                <SectionHeading title="Recent Activity" subtitle="Live from the network" />
                {feedPosts.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="No activity yet"
                    description="Deals, price updates and announcements will appear here."
                  />
                ) : (
                  feedPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative p-5 rounded-xl border overflow-hidden"
                      style={{
                        borderColor: 'rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.35)',
                      }}
                    >
                      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/15" />
                      <div className="flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(131,110,249,0.1)',
                            border: '1px solid rgba(131,110,249,0.2)',
                          }}
                        >
                          <TrendingUp className="w-4 h-4 text-purple-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-light text-white truncate">
                            {post.listing.title}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{post.content}</p>
                          <p className="text-[11px] text-zinc-600 mt-2 uppercase tracking-wider">
                            {timeAgo(post.createdAt)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'my-items' && (
              <motion.div
                key="my-items"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                <EmptyState
                  icon={Package}
                  title="No items yet"
                  description="Publish your first agent or repository to get started."
                  action={
                    <Link
                      href="/profile?tab=listings"
                      className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
                    >
                      Create your first listing
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Reusable UI pieces ────────────────────────────────────────────────────────

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-purple-500/60" />
          <h2 className="text-xs uppercase tracking-[0.25em] text-purple-300/80 font-light">
            {title}
          </h2>
        </div>
        {subtitle && <p className="text-lg text-white font-light mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}

function FeaturedCard({
  listing,
  index,
  onOpen,
}: {
  listing: MarketListing;
  index: number;
  onOpen: () => void;
}) {
  const accent = TYPE_ACCENTS[listing.type] ?? TYPE_ACCENTS.OTHER;
  const Icon = accent.icon;
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -3 }}
      className="group relative text-left p-6 md:p-8 rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${accent.color}22`,
        background: 'rgba(0,0,0,0.55)',
        boxShadow: `inset 0 1px 1px ${accent.color}10`,
      }}
    >
      {/* Corner brackets */}
      <div
        className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2"
        style={{ borderColor: `${accent.color}66` }}
      />
      <div
        className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2"
        style={{ borderColor: `${accent.color}66` }}
      />
      <div
        className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2"
        style={{ borderColor: `${accent.color}66` }}
      />
      <div
        className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2"
        style={{ borderColor: `${accent.color}66` }}
      />

      {/* Hover glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at top right, ${accent.color}14, transparent 60%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `${accent.color}12`,
              border: `1px solid ${accent.color}33`,
            }}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] uppercase tracking-[0.2em] font-light px-2 py-0.5 rounded"
                style={{
                  color: accent.color,
                  background: `${accent.color}10`,
                  border: `1px solid ${accent.color}30`,
                }}
              >
                {listing.type}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-light text-white leading-snug truncate">
              {listing.title}
            </h3>
          </div>
        </div>

        {listing.description && (
          <p className="text-sm text-zinc-400 font-light line-clamp-2 mb-5">
            {listing.description}
          </p>
        )}

        <div
          className="flex items-center justify-between pt-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-light">
            From
          </span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-light text-white">
              <GradientText gradient="purple">
                {listing.price} {listing.currency}
              </GradientText>
            </span>
            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-300 transition-colors" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function RecentCard({
  listing,
  index,
  onOpen,
}: {
  listing: MarketListing;
  index: number;
  onOpen: () => void;
}) {
  const accent = TYPE_ACCENTS[listing.type] ?? TYPE_ACCENTS.OTHER;
  const Icon = accent.icon;
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      className="group relative text-left p-5 rounded-xl overflow-hidden transition-colors"
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.35)',
      }}
    >
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/15 group-hover:border-white/30 transition-colors" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/15 group-hover:border-white/30 transition-colors" />

      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `${accent.color}10`,
            border: `1px solid ${accent.color}25`,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-light text-white truncate">{listing.title}</p>
            <span
              className="text-[10px] uppercase tracking-wider font-light px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                color: accent.color,
                background: `${accent.color}10`,
                border: `1px solid ${accent.color}25`,
              }}
            >
              {listing.type}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">From</span>
            <span className="text-sm font-light text-white">
              {listing.price} <span className="text-zinc-400">{listing.currency}</span>
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl px-8 py-14 text-center overflow-hidden"
      style={{
        border: '1px dashed rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)',
      }}
    >
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white/10" />
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white/10" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-white/10" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-white/10" />

      <div
        className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
        style={{
          background: 'rgba(131,110,249,0.08)',
          border: '1px solid rgba(131,110,249,0.2)',
        }}
      >
        <Icon className="w-7 h-7 text-purple-300" />
      </div>
      <p className="text-white font-light text-base">{title}</p>
      <p className="text-sm text-zinc-500 font-light mt-2 max-w-sm mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
