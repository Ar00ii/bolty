'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  TrendingUp,
  Package,
  Bot,
  GitBranch,
  Zap,
  Search,
  MoreVertical,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useState, useEffect, useRef } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { HexagonPattern } from '@/components/ui/HexagonPattern';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

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

const TYPE_ACCENTS: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }
> = {
  REPO: { color: '#3b82f6', icon: GitBranch },
  BOT: { color: '#836EF9', icon: Bot },
  AI_AGENT: { color: '#a855f7', icon: Bot },
  SCRIPT: { color: '#06B6D4', icon: Zap },
  OTHER: { color: '#64748b', icon: Package },
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
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [messages, setMessages] = useState<NegotiationMessage[]>([]);
  const [input, setInput] = useState('');
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start or resume a negotiation on open
  useEffect(() => {
    const init = async () => {
      setInitializing(true);
      setError('');
      try {
        const neg = await api.post<Negotiation>(`/market/${listing.id}/negotiate`, {});
        setNegotiation(neg);
        setMessages(neg.messages || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to open negotiation');
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [listing.id]);

  const handleSend = async () => {
    if (!input.trim() || !negotiation || loading) return;
    setLoading(true);
    setError('');
    const content = input.trim();
    const proposed = proposedPrice ? Number(proposedPrice) : undefined;
    setInput('');
    setProposedPrice('');
    try {
      const updated = await api.post<Negotiation>(
        `/market/negotiations/${negotiation.id}/message`,
        { content, proposedPrice: proposed },
      );
      setNegotiation(updated);
      setMessages(updated.messages || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send message');
      setInput(content);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!negotiation) return;
    try {
      await api.post(`/market/negotiations/${negotiation.id}/accept`, {});
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to accept');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-light text-white">{listing.title}</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Price: {listing.price} {listing.currency}
              {negotiation?.agreedPrice && (
                <span className="ml-2 text-emerald-400">
                  · Agreed: {negotiation.agreedPrice} {listing.currency}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {negotiation?.status === 'AGREED' && (
              <button
                onClick={handleAccept}
                className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-light transition-all"
              >
                Proceed to payment
              </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {initializing && (
            <p className="text-center text-zinc-500 py-12 text-sm">Opening negotiation...</p>
          )}
          {!initializing && messages.length === 0 && (
            <p className="text-center text-zinc-500 py-12 text-sm">
              Start the negotiation. Propose a price or ask the seller&apos;s agent a question.
            </p>
          )}
          {messages.map((msg) => {
            const isBuyer = msg.fromRole.includes('buyer');
            return (
              <div key={msg.id} className={`flex ${isBuyer ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-sm px-4 py-2 rounded-lg ${
                    isBuyer
                      ? 'bg-purple-600/20 border border-purple-500/30 text-purple-200'
                      : 'bg-zinc-800/50 border border-zinc-700/30 text-zinc-300'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
                    {msg.fromRole.replace('_', ' ')}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                  {msg.proposedPrice != null && (
                    <p className="text-xs mt-1 opacity-80">
                      Proposed: {msg.proposedPrice} {listing.currency}
                    </p>
                  )}
                  <p className="text-[11px] opacity-60 mt-1">{timeAgo(msg.createdAt)}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {error && <div className="px-6 pb-2 text-xs text-red-400">{error}</div>}

        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Price"
              value={proposedPrice}
              onChange={(e) => setProposedPrice(e.target.value)}
              className="w-28 bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50"
            />
            <input
              type="text"
              placeholder="Message seller or their agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={initializing || loading}
              className="flex-1 bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || initializing || !input.trim()}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all text-white text-sm font-light"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-[10px] text-zinc-600">
            Messages go to the seller&apos;s negotiation agent — responses are signed and recorded.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MarketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--bg)' }} />}>
      <MarketPageContent />
    </Suspense>
  );
}

function MarketPageContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'activity'>('all');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [activeNeg, setActiveNeg] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'trending'>(
    'recent',
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: '1' });
        if (search) qs.set('search', search);
        const [listingsData, feedData] = await Promise.all([
          api.get<{ data: MarketListing[]; total: number; page: number; pages: number }>(
            `/market?${qs.toString()}`,
          ),
          api.get<FeedPost[]>('/market/feed?take=5'),
        ]);
        setListings(listingsData?.data || []);
        setFeedPosts(feedData || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-purple-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    );
  }

  const filteredListings = listings.filter((l) =>
    search ? l.title.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'trending':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div style={{ background: 'var(--bg)' }} className="relative min-h-screen overflow-hidden">
      {/* Hexagon pattern backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[780px] opacity-[0.2]"
      >
        <HexagonPattern />
      </div>

      {/* Grid overlay */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[780px] w-full opacity-[0.07]"
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
        className="pointer-events-none absolute inset-x-0 top-0 h-[780px] opacity-70"
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

      {/* Header Section */}
      <div className="border-b border-white/8 sticky top-0 z-40 backdrop-blur-md bg-zinc-950/90">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-light text-white mb-2">
                <GradientText gradient="purple">Marketplace</GradientText>
              </h1>
              <p className="text-sm text-zinc-400">
                Access {listings.length} AI agents, repositories, and services from the community.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/market/agents"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-purple-500/40 text-white hover:bg-purple-500/5 transition-all"
              >
                <Bot className="w-4 h-4" />
                Agents
              </Link>
              <Link
                href="/market/repos"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-white/10 hover:border-blue-500/40 text-white hover:bg-blue-500/5 transition-all"
              >
                <GitBranch className="w-4 h-4" />
                Repos
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Listings"
              value={listings.length.toString()}
              trend="+12%"
              icon={<Package className="w-4 h-4" />}
            />
            <StatCard
              label="Recent Activity"
              value={feedPosts.length.toString()}
              trend="This week"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              label="Community Size"
              value="500+"
              trend="Active devs"
              icon={<Star className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search agents, repos, services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value="recent">Most Recent</option>
            <option value="trending">Trending</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/8 mb-8">
          {(['all', 'featured', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-light border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'all' ? 'All Listings' : tab === 'featured' ? 'Featured' : 'Activity'}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {sortedListings.length === 0 ? (
                <EmptyState
                  title="No listings found"
                  description="Try adjusting your search or filters. New listings are added daily."
                  icon={Package}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onOpen={() => setActiveNeg(listing)}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'featured' && (
            <motion.div
              key="featured"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {listings.slice(0, 3).length === 0 ? (
                <EmptyState
                  title="No featured listings"
                  description="Check back soon for curated picks from our community."
                  icon={Star}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listings.slice(0, 3).map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onOpen={() => setActiveNeg(listing)}
                      isAuthenticated={isAuthenticated}
                      featured
                    />
                  ))}
                </div>
              )}
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
              {feedPosts.length === 0 ? (
                <EmptyState
                  title="No recent activity"
                  description="Stay tuned for updates, new deals, and community highlights."
                  icon={TrendingUp}
                />
              ) : (
                feedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-lg border border-white/8 bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    <p className="text-sm font-light text-white">{post.listing.title}</p>
                    <p className="text-xs text-zinc-400 mt-2">{post.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-zinc-600 uppercase tracking-wider">
                        {timeAgo(post.createdAt)}
                      </span>
                      {post.price && (
                        <span className="text-xs font-light text-purple-300">
                          {post.price} {post.currency}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-lg border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-300"
          style={{ background: 'rgba(131,110,249,0.1)' }}
        >
          {icon}
        </div>
        <span className="text-xs text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-light text-white mb-1">{value}</p>
      <p className="text-[11px] text-zinc-500">{trend}</p>
    </div>
  );
}

function ListingCard({
  listing,
  onOpen,
  isAuthenticated,
  featured,
}: {
  listing: MarketListing;
  onOpen: () => void;
  isAuthenticated: boolean;
  featured?: boolean;
}) {
  const accent = TYPE_ACCENTS[listing.type];
  const Icon = accent.icon;

  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ y: -2 }}
      className="group relative text-left p-5 rounded-lg border border-white/8 bg-white/3 hover:bg-white/5 transition-all"
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreVertical className="w-4 h-4 text-zinc-500" />
      </div>

      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `${accent.color}15`,
            border: `1px solid ${accent.color}30`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: accent.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-light text-white truncate">{listing.title}</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            by {listing.seller.username || 'Anonymous'}
          </p>
        </div>
      </div>

      {listing.description && (
        <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{listing.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span
          className="text-[10px] px-2 py-1 rounded bg-white/5 uppercase tracking-wider"
          style={{ color: accent.color }}
        >
          {listing.type}
        </span>
        <div className="text-right">
          <p className="text-xs text-zinc-500">from</p>
          <p className="text-sm font-light text-white">
            {listing.price} {listing.currency}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative rounded-xl px-8 py-16 text-center border border-white/8 bg-white/2">
      <div
        className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(131,110,249,0.08)', border: '1px solid rgba(131,110,249,0.2)' }}
      >
        <Icon className="w-6 h-6 text-purple-300" />
      </div>
      <p className="text-white font-light mb-2">{title}</p>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  );
}
