'use client';

import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  GitBranch,
  Heart,
  Loader2,
  LucideIcon,
  Lock,
  MessageSquare,
  Package,
  ShoppingBag,
  Play,
  Send,
  Shield,
  Star,
  Tag,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AgentPickerModal } from '@/components/negotiation/AgentPickerModal';
import { Markdown } from '@/components/ui/Markdown';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { ShareButton } from '@/components/ui/ShareButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed';
import { useToast } from '@/lib/hooks/useToast';
import { useWalletPicker } from '@/lib/hooks/useWalletPicker';
import { isEscrowEnabled, getEscrowAddress, escrowDeposit } from '@/lib/wallet/escrow';
import { getMetaMaskProvider } from '@/lib/wallet/ethereum';

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
  seller: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
    walletAddress?: string | null;
  };
  repository?: {
    id: string;
    name: string;
    githubUrl: string;
    language: string | null;
    stars: number;
  } | null;
  reviewAverage?: number | null;
  reviewCount?: number;
}

interface AgentPost {
  id: string;
  createdAt: string;
  content: string;
  postType: 'GENERAL' | 'PRICE_UPDATE' | 'ANNOUNCEMENT' | 'DEAL';
  price: number | null;
  currency: string | null;
}

interface Review {
  id: string;
  createdAt: string;
  rating: number;
  content: string | null;
  author: { id: string; username: string | null; avatarUrl: string | null };
}

interface ReviewsResponse {
  reviews: Review[];
  average: number | null;
  count: number;
}

interface RelatedListing {
  id: string;
  title: string;
  type: MarketListing['type'];
  price: number;
  currency: string;
  tags: string[];
  seller: { id: string; username: string | null; avatarUrl: string | null };
  reviewAverage?: number | null;
  reviewCount?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<
  MarketListing['type'],
  {
    label: string;
    color: string;
    Icon: LucideIcon;
  }
> = {
  AI_AGENT: { label: 'AI Agent', color: '#a855f7', Icon: Bot },
  BOT: { label: 'Bot', color: '#836EF9', Icon: Bot },
  SCRIPT: { label: 'Script', color: '#06B6D4', Icon: Zap },
  REPO: { label: 'Repo', color: '#3b82f6', Icon: GitBranch },
  OTHER: { label: 'Other', color: '#64748b', Icon: Package },
};

const POST_META: Record<AgentPost['postType'], { label: string; tone: string }> = {
  GENERAL: { label: 'Update', tone: 'text-zinc-400 bg-zinc-800/60' },
  PRICE_UPDATE: { label: 'Price', tone: 'text-amber-300 bg-amber-400/10' },
  ANNOUNCEMENT: { label: 'Announcement', tone: 'text-violet-300 bg-violet-400/10' },
  DEAL: { label: 'Deal', tone: 'text-emerald-300 bg-emerald-400/10' },
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

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function shortenAddress(addr: string) {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function FavoriteButton({ listingId }: { listingId: string }) {
  const { has, toggle } = useFavorites();
  const saved = has(listingId);
  return (
    <button
      onClick={() => toggle(listingId)}
      aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
      aria-pressed={saved}
      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-[13px] font-light tracking-[0.005em] transition-all"
      style={
        saved
          ? {
              background:
                'linear-gradient(180deg, rgba(236,72,153,0.22) 0%, rgba(236,72,153,0.06) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(236,72,153,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px -6px rgba(236,72,153,0.5)',
              color: '#fda4c5',
            }
          : {
              background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
              color: '#d4d4d8',
            }
      }
    >
      <Heart className={`w-4 h-4 ${saved ? 'fill-pink-400 text-pink-400' : ''}`} />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [ownership, setOwnership] = useState<{
    purchased: boolean;
    orderId: string | null;
  } | null>(null);
  // Owners can't buy their own listing — render a Manage link instead.
  const isOwner = !!listing && !!user && listing.seller.id === user.id;
  const alreadyOwned = ownership?.purchased === true && !isOwner;
  const [posts, setPosts] = useState<AgentPost[]>([]);
  const [reviews, setReviews] = useState<ReviewsResponse>({
    reviews: [],
    average: null,
    count: 0,
  });
  const [related, setRelated] = useState<RelatedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { pickWallet, pickerElement: buyWalletPicker } = useWalletPicker();
  const [buyConsentData, setBuyConsentData] = useState<{
    sellerWallet: string; buyerAddress: string; sellerWei: bigint;
    platformWei: bigint; totalWei: bigint; amountWei: string; totalUsd: number;
  } | null>(null);
  const [buyPaying, setBuyPaying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [buySuccess, setBuySuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [startingNegotiation, setStartingNegotiation] = useState(false);
  const { record: recordRecent } = useRecentlyViewed();

  const loadReviews = useCallback(async () => {
    const data = await api
      .get<ReviewsResponse>(`/market/${id}/reviews`)
      .catch(() => ({ reviews: [], average: null, count: 0 }) as ReviewsResponse);
    setReviews(data);
  }, [id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<MarketListing>(`/market/${id}`);
      setListing(data);
      if (data && data.status !== 'REMOVED') {
        recordRecent({
          id: data.id,
          title: data.title,
          type: data.type,
          seller: data.seller?.username ?? null,
        });
      }
      const ownershipPromise = isAuthenticated
        ? api
            .get<{ purchased: boolean; orderId: string | null }>(`/market/${id}/purchased`)
            .catch(() => ({ purchased: false, orderId: null }))
        : Promise.resolve({ purchased: false, orderId: null });
      const [postsData, relatedData, , ownershipData] = await Promise.all([
        api.get<AgentPost[]>(`/market/${id}/posts`).catch(() => [] as AgentPost[]),
        api.get<RelatedListing[]>(`/market/${id}/related`).catch(() => [] as RelatedListing[]),
        loadReviews().catch(() => {}),
        ownershipPromise,
      ]);
      setPosts(postsData || []);
      setRelated(relatedData || []);
      setOwnership(ownershipData);
    } catch (err) {
      if (err instanceof ApiError) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, loadReviews, recordRecent, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBuy = async () => {
    if (!isAuthenticated) { router.push('/auth'); return; }
    if (!listing) return;
    if (listing.seller.id === user?.id) {
      addToast("That's your own listing.", 'info');
      return;
    }
    // Hard guard against double-pay: if we already own this listing,
    // skip the MetaMask flow entirely and hop to the order page. The
    // backend rejects too, but by then the ETH has already left the
    // buyer's wallet on the second tx.
    if (ownership?.purchased && ownership.orderId) {
      router.push(`/orders/${ownership.orderId}`);
      return;
    }
    if (listing.status !== 'ACTIVE') {
      addToast('This listing is not active. The seller may have paused it.', 'warning');
      return;
    }
    setBuyError('');
    setBuySuccess(false);
    if (listing.price === 0) {
      setBuyPaying(true);
      try {
        await api.post(`/market/${listing.id}/claim-free`, {});
        setBuySuccess(true);
      } catch (err: unknown) {
        setBuyError(err instanceof ApiError ? err.message : 'Claim failed');
      } finally {
        setBuyPaying(false);
      }
      return;
    }
    setBuyPaying(true);
    try {
      const ethereum = getMetaMaskProvider();
      if (!ethereum) { setBuyError('MetaMask not found'); return; }
      const sellerData = await api.get<{ seller?: { walletAddress?: string } }>(`/market/${listing.id}`);
      const sellerWallet = sellerData?.seller?.walletAddress;
      if (!sellerWallet) { setBuyError('Seller has no wallet linked'); return; }
      let ethPrice = 2000;
      try { const p = await api.get<{ price?: number }>('/chart/eth-price'); if (p.price) ethPrice = p.price; } catch { /* fallback */ }
      const totalWei = BigInt(Math.ceil(listing.price * 1e18));
      const sellerWei = (totalWei * BigInt(930)) / BigInt(1000);
      const platformWei = totalWei - sellerWei;
      const buyerAddress = await pickWallet();
      setBuyConsentData({ sellerWallet, buyerAddress, sellerWei, platformWei, totalWei, amountWei: totalWei.toString(), totalUsd: listing.price * ethPrice });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || String(err);
      setBuyError(msg.includes('rejected') ? 'Payment cancelled' : 'Failed: ' + msg.slice(0, 80));
    } finally {
      setBuyPaying(false);
    }
  };

  const executeBuy = async (signature: string, consentMessage: string, paymentMethod: 'ETH' | 'BOLTY' = 'ETH') => {
    if (!buyConsentData || !listing) return;
    const { sellerWallet, buyerAddress, totalWei, amountWei } = buyConsentData;
    const feeBps = paymentMethod === 'BOLTY' ? 300 : 700;
    const platformWei = (totalWei * BigInt(feeBps)) / BigInt(10000);
    const sellerWei = totalWei - platformWei;
    setBuyConsentData(null);
    const ethereum = getMetaMaskProvider();
    if (!ethereum) { setBuyError('MetaMask not found'); return; }
    try {
      if (isEscrowEnabled()) {
        const orderId = crypto.randomUUID();
        const txHash = await escrowDeposit(orderId, sellerWallet, totalWei);
        await api.post(`/market/${listing.id}/purchase`, { txHash, amountWei, consentSignature: signature, consentMessage, escrowContract: getEscrowAddress() });
      } else {
        const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
        const txHash = (await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: buyerAddress, to: sellerWallet, value: '0x' + sellerWei.toString(16) }] })) as string;
        let platformFeeTxHash: string | undefined;
        if (platformWallet) {
          platformFeeTxHash = (await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: buyerAddress, to: platformWallet, value: '0x' + platformWei.toString(16) }] })) as string;
        }
        await api.post(`/market/${listing.id}/purchase`, { txHash, amountWei, platformFeeTxHash, consentSignature: signature, consentMessage });
      }
      setBuySuccess(true);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || String(err);
      setBuyError(msg.includes('rejected') ? 'Payment cancelled' : err instanceof ApiError ? err.message : 'Payment failed: ' + msg.slice(0, 80));
    }
  };

  const handleNegotiateClick = useCallback(() => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/market/agents/${listing?.id ?? ''}`)}`);
      return;
    }
    if (listing && listing.seller.id === user.id) {
      addToast('That\'s your own listing.', 'info');
      return;
    }
    setShowAgentPicker(true);
  }, [user, listing, router, addToast]);

  const startNegotiation = useCallback(
    async (agentListingId: string | null) => {
      if (!listing) return;
      setShowAgentPicker(false);
      setStartingNegotiation(true);
      try {
        const res = await api.post<{ id: string }>(
          `/market/${listing.id}/negotiate`,
          agentListingId ? { buyerAgentListingId: agentListingId } : {},
        );
        if (res?.id) {
          router.push(`/negotiations/${res.id}`);
          return;
        }
        addToast('Failed to start negotiation', 'error');
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to start negotiation';
        addToast(msg, 'error');
      } finally {
        setStartingNegotiation(false);
      }
    },
    [listing, router, addToast],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#000' }}
      >
        <p className="text-6xl font-mono text-zinc-800">404</p>
        <p className="text-zinc-400">Listing not found</p>
        <Link
          href="/market"
          className="inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to marketplace
        </Link>
      </div>
    );
  }

  const meta = TYPE_META[listing.type] ?? TYPE_META.OTHER;
  const TypeIcon = meta.Icon;
  const isFree = listing.price === 0;

  return (
    <div className="mk-app-page min-h-screen" style={{ background: '#000', maxWidth: 'none', padding: 0 }}>
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-md bg-black/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-zinc-500 overflow-x-auto">
          <Link href="/market" className="hover:text-zinc-200 transition-colors">
            Marketplace
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-700" />
          <Link href="/market/agents" className="hover:text-zinc-200 transition-colors">
            Agents
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-700" />
          <span className="text-zinc-300 truncate max-w-md">{listing.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <header className="mb-8 sm:mb-10">
          <div className="flex items-start gap-4 sm:gap-5 flex-wrap">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${meta.color}26 0%, ${meta.color}06 100%)`,
                boxShadow: `inset 0 0 0 1px ${meta.color}40, inset 0 1px 0 rgba(255,255,255,0.06), 0 0 28px -6px ${meta.color}50`,
              }}
            >
              <TypeIcon className="w-6 h-6" style={{ color: meta.color }} strokeWidth={1.75} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                <span style={{ color: meta.color }}>{meta.label}</span>
                {listing.agentEndpoint && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live endpoint
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-white tracking-tight leading-tight break-words">
                {listing.title}
              </h1>
              <div className="flex items-center gap-3 mt-3 text-sm text-zinc-400">
                <Link
                  href={`/u/${listing.seller.username || listing.seller.id}`}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  <UserAvatar
                    src={listing.seller.avatarUrl}
                    name={listing.seller.username}
                    userId={listing.seller.id}
                    size={20}
                  />
                  <span>@{listing.seller.username || 'anonymous'}</span>
                </Link>
                <span className="text-zinc-700">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Published {timeAgo(listing.createdAt)}
                </span>
                {listing.reviewAverage !== null && listing.reviewAverage !== undefined && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {listing.reviewAverage.toFixed(1)}
                      <span className="text-zinc-600">({listing.reviewCount})</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <FavoriteButton listingId={listing.id} />
              <ShareButton title={listing.title} />
              {isOwner ? (
                <Link
                  href={`/market/agents/${listing.id}/edit`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-zinc-200 text-[13px] font-light tracking-[0.005em] transition-all hover:text-white hover:brightness-110"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  Manage listing
                </Link>
              ) : alreadyOwned ? (
                <Link
                  href={ownership?.orderId ? `/orders/${ownership.orderId}` : '/inventory'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-[13px] font-light tracking-[0.005em] transition-all hover:brightness-110"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(34,197,94,0.32) 0%, rgba(34,197,94,0.10) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(34,197,94,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(34,197,94,0.4)',
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Open in inventory
                </Link>
              ) : (
              <>
              <button
                onClick={handleBuy}
                disabled={buyPaying}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-[13px] font-light tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                {isFree ? 'Get free' : 'Buy now'}
              </button>
              <button
                type="button"
                onClick={handleNegotiateClick}
                disabled={startingNegotiation}
                title="Start an AI-to-AI negotiation"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-light text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(180deg, rgba(131,110,249,0.22), rgba(131,110,249,0.08))',
                  border: '1px solid rgba(131,110,249,0.35)',
                }}
              >
                {startingNegotiation ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Bot className="w-3 h-3" />
                )}
                Negotiate
              </button>
              </>
              )}
            </div>
          </div>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5 ml-[76px]">
              {listing.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-zinc-400 bg-white/[0.03] border border-white/[0.06]"
                >
                  <Tag className="w-2.5 h-2.5 text-zinc-600" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ── Body: 2-col grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* LEFT — main content */}
          <main className="space-y-8 min-w-0">
            <Section title="About" icon={FileText}>
              {listing.description ? (
                <Markdown source={listing.description} className="text-sm" />
              ) : (
                <p className="text-sm text-zinc-500 italic">
                  No description provided by the seller.
                </p>
              )}
            </Section>

            <Section title="Live demo" icon={Play}>
              {listing.agentEndpoint ? (
                <DemoWidget listingId={listing.id} />
              ) : (
                <div
                  className="rounded-xl p-6 text-center"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.5) 0%, rgba(10,10,14,0.5) 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.04) 100%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(131,110,249,0.28), 0 0 18px -6px rgba(131,110,249,0.4)',
                    }}
                  >
                    <Terminal className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm text-zinc-300 mb-1 font-light tracking-[0.005em]">
                    No live endpoint on this listing
                  </p>
                  <p className="text-xs text-zinc-600">
                    Ask the seller to connect a webhook to enable the playground.
                  </p>
                </div>
              )}
            </Section>

            <Section title={`Activity (${posts.length})`} icon={TrendingUp}>
              {posts.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">
                  No updates from the seller yet. Check back later.
                </p>
              ) : (
                <div className="space-y-3">
                  {posts.slice(0, 10).map((p) => {
                    const pm = POST_META[p.postType] ?? POST_META.GENERAL;
                    return (
                      <article
                        key={p.id}
                        className="relative rounded-xl p-4 overflow-hidden"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                          boxShadow:
                            '0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] uppercase tracking-[0.16em] font-medium px-1.5 py-0.5 rounded ${pm.tone}`}
                          >
                            {pm.label}
                          </span>
                          <span className="text-[11px] text-zinc-600">{timeAgo(p.createdAt)}</span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {p.content}
                        </p>
                        {p.postType === 'PRICE_UPDATE' &&
                          p.price !== null &&
                          p.price !== undefined && (
                            <p className="mt-2 text-xs font-mono text-amber-300">
                              New price: {p.price} {p.currency || ''}
                            </p>
                          )}
                      </article>
                    );
                  })}
                </div>
              )}
            </Section>

            <Section title={`Reviews (${reviews.count})`} icon={Star}>
              <ReviewsWidget
                listingId={listing.id}
                reviews={reviews}
                canReview={isAuthenticated && listing.seller.id !== undefined}
                onCreated={loadReviews}
              />
            </Section>

            {related.length > 0 && (
              <Section title="Related" icon={Package}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {related.map((r) => {
                    const meta = TYPE_META[r.type] || TYPE_META.OTHER;
                    return (
                      <Link
                        key={r.id}
                        href={`/market/agents/${r.id}`}
                        className="group flex items-start gap-3 rounded-xl p-3 transition-all hover:brightness-110"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
                          boxShadow:
                            '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${meta.color}26 0%, ${meta.color}06 100%)`,
                            boxShadow: `inset 0 0 0 1px ${meta.color}38, inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px ${meta.color}40`,
                          }}
                        >
                          <meta.Icon
                            className="w-4 h-4"
                            style={{ color: meta.color }}
                            strokeWidth={1.75}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-white truncate">{r.title}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                            <span>
                              {r.price} {r.currency}
                            </span>
                            {r.reviewAverage !== null &&
                              r.reviewAverage !== undefined &&
                              (r.reviewCount ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {r.reviewAverage.toFixed(1)}
                                </span>
                              )}
                            <span className="text-zinc-600">· @{r.seller.username || 'anon'}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-300 transition-colors mt-1" />
                      </Link>
                    );
                  })}
                </div>
              </Section>
            )}
          </main>

          {/* RIGHT — sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <PricingCard
              listing={listing}
              onBuy={handleBuy}
              onNegotiate={handleNegotiateClick}
              negotiating={startingNegotiation}
              isOwner={isOwner}
              buyPaying={buyPaying}
              alreadyOwned={alreadyOwned}
              ownedOrderId={ownership?.orderId ?? null}
            />
            <SellerCard seller={listing.seller} />
            <MetaCard listing={listing} />
            {listing.repository && <RepositoryCard repo={listing.repository} />}
          </aside>
        </div>
      </div>
      {buyWalletPicker}
      {buyPaying && !buyConsentData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-[#836EF9] animate-spin" />
        </div>
      )}
      {buyConsentData && listing && (
        <PaymentConsentModal
          listingTitle={listing.title}
          sellerAddress={buyConsentData.sellerWallet}
          sellerAmountETH={(Number(buyConsentData.sellerWei) / 1e18).toFixed(6)}
          platformFeeETH={(Number(buyConsentData.platformWei) / 1e18).toFixed(6)}
          totalETH={(Number(buyConsentData.totalWei) / 1e18).toFixed(6)}
          totalUsd={buyConsentData.totalUsd.toFixed(2)}
          buyerAddress={buyConsentData.buyerAddress}
          onConsent={executeBuy}
          onCancel={() => { setBuyConsentData(null); }}
        />
      )}
      {buyError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(20,20,26,0.95), rgba(10,10,14,0.95))', boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.5)' }}>
            <p className="text-red-400 text-sm mb-4">{buyError}</p>
            <button type="button" onClick={() => setBuyError('')} className="px-4 py-2 rounded-md text-[12.5px] text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>Close</button>
          </div>
        </div>
      )}
      {buySuccess && listing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(20,20,26,0.95), rgba(10,10,14,0.95))', boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.5)' }}>
            <div className="mx-auto w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(131,110,249,0.15)', boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4)' }}>
              <ShoppingBag className="w-5 h-5 text-[#b4a7ff]" />
            </div>
            <h3 className="text-base font-light text-white mb-2">{listing.price === 0 ? 'Claimed!' : 'Payment sent!'}</h3>
            <p className="text-[12.5px] text-zinc-400 font-light leading-relaxed mb-5">
              <span className="text-white">{listing.title}</span> has been added to your orders.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/orders" className="px-4 py-2 rounded-md text-[12.5px] text-white" style={{ background: 'linear-gradient(180deg, rgba(131,110,249,0.38), rgba(131,110,249,0.14))', boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.48)' }}>View Orders</Link>
              <button type="button" onClick={() => setBuySuccess(false)} className="px-4 py-2 rounded-md text-[12.5px] text-zinc-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Agent picker — fires when the user clicks Negotiate */}
      {showAgentPicker && listing && (
        <AgentPickerModal
          listingTitle={listing.title}
          listingPrice={listing.price}
          listingCurrency={listing.currency}
          onCancel={() => setShowAgentPicker(false)}
          onConfirm={(agentId) => void startNegotiation(agentId)}
        />
      )}
    </div>
  );
}

// ── Sections ───────────────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-white/[0.06]">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.04) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.28)',
          }}
        >
          <Icon className="w-3.5 h-3.5 text-[#b4a7ff]" />
        </div>
        <h2 className="text-[11px] uppercase tracking-[0.18em] font-medium text-zinc-300">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function DemoWidget({ listingId }: { listingId: string }) {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSend = prompt.trim().length > 0 && !loading;

  const handleSend = async () => {
    if (!canSend) return;
    setLoading(true);
    setError(null);
    setReply(null);
    try {
      const data = await api.post<{ reply: string }>(`/market/${listingId}/invoke`, {
        prompt: prompt.trim(),
      });
      setReply(data.reply || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
        }}
      />
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="font-mono text-[11px] text-zinc-500">agent.invoke</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-600">
          5 / min
        </span>
      </div>
      <div className="p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
          onKeyDown={handleKeyDown}
          placeholder="Try a prompt — e.g. summarize this URL..."
          rows={3}
          className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none font-mono"
          disabled={loading}
        />
        <div className="flex items-center justify-between gap-2 mt-3">
          <p className="text-[10px] text-zinc-600 font-mono">{prompt.length}/1000 · ⌘+↵ to send</p>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed text-[11.5px] text-white font-light tracking-[0.005em] transition-all hover:brightness-110"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px -6px rgba(131,110,249,0.5)',
            }}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {loading ? 'Invoking...' : 'Run'}
          </button>
        </div>
      </div>
      {(reply !== null || error) && (
        <div className="border-t border-white/[0.06] bg-black/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-zinc-600 mb-2">
            {error ? 'Error' : 'Response'}
          </p>
          <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {error || reply}
          </pre>
        </div>
      )}
    </div>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= full ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}
        />
      ))}
    </div>
  );
}

function ReviewsWidget({
  listingId,
  reviews,
  canReview,
  onCreated,
}: {
  listingId: string;
  reviews: ReviewsResponse;
  canReview: boolean;
  onCreated: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const submit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/market/${listingId}/reviews`, {
        rating,
        content: content.trim() || null,
      });
      setContent('');
      setRating(0);
      setShowForm(false);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {reviews.count > 0 && reviews.average !== null ? (
        <div className="flex items-center gap-4 pb-3 border-b border-white/[0.06]">
          <div>
            <p className="text-2xl font-medium text-white tabular-nums leading-none">
              {reviews.average.toFixed(1)}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.18em] mt-1">out of 5</p>
          </div>
          <div>
            <Stars value={reviews.average} size={16} />
            <p className="text-xs text-zinc-500 mt-1">
              Based on {reviews.count} review{reviews.count === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 italic">
          No reviews yet. Buyers can leave one after purchasing.
        </p>
      )}

      {canReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
        >
          Write a review
        </button>
      )}

      {canReview && showForm && (
        <div
          className="relative rounded-xl p-4 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          <div className="flex items-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="p-0.5 transition-transform hover:scale-110"
                type="button"
                aria-label={`${n} stars`}
              >
                <Star
                  className={
                    n <= rating ? 'w-6 h-6 fill-amber-400 text-amber-400' : 'w-6 h-6 text-zinc-600'
                  }
                />
              </button>
            ))}
            {rating > 0 && <span className="text-xs text-zinc-500 ml-2">{rating} / 5</span>}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 2000))}
            placeholder="Share what worked, what didn't — help other buyers."
            rows={3}
            className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none border-b border-white/[0.06] focus:border-white/[0.12] pb-2"
          />
          <div className="flex items-center justify-between gap-2 mt-3">
            <p className="text-[10px] text-zinc-600 font-mono">{content.length}/2000</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!rating || submitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed text-[11.5px] text-white font-light tracking-[0.005em] transition-all hover:brightness-110"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px -6px rgba(131,110,249,0.5)',
                }}
              >
                {submitting ? 'Submitting…' : 'Publish review'}
              </button>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      )}

      {reviews.reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.reviews.map((r) => (
            <article
              key={r.id}
              className="relative rounded-xl p-4 overflow-hidden"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <UserAvatar
                    src={r.author.avatarUrl}
                    name={r.author.username}
                    userId={r.author.id}
                    size={20}
                  />
                  <span className="font-medium">{r.author.username || 'Anonymous'}</span>
                  <Stars value={r.rating} size={12} />
                </div>
                <span className="text-[11px] text-zinc-600">{timeAgo(r.createdAt)}</span>
              </div>
              {r.content && (
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {r.content}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function PricingCard({
  listing,
  onBuy,
  onNegotiate,
  negotiating,
  isOwner,
  buyPaying,
  alreadyOwned,
  ownedOrderId,
}: {
  listing: MarketListing;
  onBuy: () => void;
  onNegotiate?: () => void;
  negotiating?: boolean;
  isOwner?: boolean;
  buyPaying?: boolean;
  alreadyOwned?: boolean;
  ownedOrderId?: string | null;
}) {
  const isFree = listing.price === 0;
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.7) 0%, rgba(10,10,14,0.7) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
        }}
      />
      <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
        Price
      </p>
      {isFree ? (
        <p className="text-3xl font-light text-emerald-400 tracking-[-0.01em]">Free</p>
      ) : (
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-light text-white tabular-nums tracking-[-0.01em]">
            {listing.price}
          </p>
          <p className="text-sm text-zinc-500">{listing.currency}</p>
        </div>
      )}
      {listing.minPrice !== null && listing.minPrice !== undefined && listing.minPrice > 0 && (
        <p className="text-xs text-zinc-500 mt-1">
          Floor · {listing.minPrice} {listing.currency}
        </p>
      )}
      {isOwner ? (
        <>
          <Link
            href={`/market/agents/${listing.id}/edit`}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-zinc-200 text-[13px] font-light tracking-[0.005em] transition-all hover:text-white hover:brightness-110"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            Manage your listing
          </Link>
          <p className="text-[11px] text-zinc-600 mt-2.5 text-center leading-relaxed">
            You can&apos;t purchase your own listing. Share the link to reach buyers.
          </p>
        </>
      ) : alreadyOwned ? (
        <>
          <Link
            href={ownedOrderId ? `/orders/${ownedOrderId}` : '/inventory'}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-[13px] font-light tracking-[0.005em] transition-all hover:brightness-110"
            style={{
              background:
                'linear-gradient(180deg, rgba(34,197,94,0.32) 0%, rgba(34,197,94,0.10) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(34,197,94,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(34,197,94,0.4)',
            }}
          >
            <ShoppingBag className="w-4 h-4" />
            Open in inventory
          </Link>
          <p className="text-[11px] text-zinc-600 mt-2.5 text-center leading-relaxed">
            You already bought this — no need to pay again.
          </p>
        </>
      ) : (
        <>
          <button
            onClick={onBuy}
            disabled={buyPaying}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-[13px] font-light tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
            }}
          >
            <ShoppingBag className="w-4 h-4" />
            {isFree ? 'Get free' : 'Buy now'}
          </button>
          <button
            type="button"
            onClick={onNegotiate}
            disabled={negotiating || !onNegotiate}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-light text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(180deg, rgba(131,110,249,0.18), rgba(131,110,249,0.06))',
              border: '1px solid rgba(131,110,249,0.35)',
            }}
          >
            {negotiating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Bot className="w-3 h-3" />
            )}
            Negotiate
          </button>
          <p className="text-[11px] text-zinc-600 mt-2.5 text-center leading-relaxed">
            Payment held in escrow until you approve delivery.
          </p>
        </>
      )}
    </div>
  );
}

function SellerCard({ seller }: { seller: MarketListing['seller'] }) {
  const [copied, setCopied] = useState(false);
  const copyWallet = async () => {
    if (!seller.walletAddress) return;
    await navigator.clipboard.writeText(seller.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-3">
        Seller
      </p>
      <div className="flex items-center gap-3">
        <UserAvatar
          src={seller.avatarUrl}
          name={seller.username}
          userId={seller.id}
          size={40}
          ring
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            @{seller.username || 'anonymous'}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            {seller.username && (
              <Link
                href={`/market/sellers/${seller.username}`}
                className="text-xs text-purple-300 hover:text-purple-200 inline-flex items-center gap-1"
              >
                Storefront <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
            <Link
              href={`/u/${seller.username || seller.id}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
            >
              Profile <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
      {seller.walletAddress && (
        <button
          onClick={copyWallet}
          className="w-full mt-3 inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all group hover:brightness-110"
          style={{
            background: 'linear-gradient(180deg, rgba(8,8,12,0.6) 0%, rgba(4,4,8,0.6) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
          title={seller.walletAddress}
        >
          <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300">
            {shortenAddress(seller.walletAddress)}
          </span>
          <Copy className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300" />
          {copied && <span className="text-[10px] text-emerald-400">copied</span>}
        </button>
      )}
    </div>
  );
}

function MetaCard({ listing }: { listing: MarketListing }) {
  const meta = useMemo(
    () => [
      { label: 'Type', value: TYPE_META[listing.type]?.label || 'Other' },
      { label: 'Status', value: listing.status.toLowerCase() },
      listing.agentEndpoint
        ? { label: 'Endpoint', value: 'configured', tone: 'emerald' as const }
        : null,
      listing.fileKey && listing.fileName
        ? {
            label: 'File',
            value: `${listing.fileName}${listing.fileSize ? ` · ${formatBytes(listing.fileSize)}` : ''}`,
          }
        : null,
      { label: 'Listing ID', value: listing.id.slice(0, 8), mono: true },
    ],
    [listing],
  );

  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-3">
        Details
      </p>
      <dl className="space-y-2">
        {meta.filter(Boolean).map((row) => {
          if (!row) return null;
          return (
            <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
              <dt className="text-zinc-500">{row.label}</dt>
              <dd
                className={`${row.mono ? 'font-mono' : ''} ${
                  row.tone === 'emerald' ? 'text-emerald-300' : 'text-zinc-300'
                } truncate`}
              >
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] text-zinc-500">
        <Shield className="w-3 h-3 text-zinc-600" />
        Sales protected by on-chain escrow
      </div>
    </div>
  );
}

function RepositoryCard({ repo }: { repo: NonNullable<MarketListing['repository']> }) {
  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-3">
        Repository
      </p>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.04) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.36)',
          }}
        >
          <GitBranch className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.75} />
        </div>
        <p className="text-sm font-light text-white truncate tracking-[0.005em]">{repo.name}</p>
      </div>
      {repo.language && <p className="text-xs text-zinc-500 mb-3 ml-8">{repo.language}</p>}
      <a
        href={repo.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-zinc-300 transition-all hover:brightness-110"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <ExternalLink className="w-3 h-3" /> Open on GitHub
      </a>
    </div>
  );
}
