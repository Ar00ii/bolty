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
  Loader2,
  MessageSquare,
  Package,
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

import { Markdown } from '@/components/ui/Markdown';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

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
    Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [posts, setPosts] = useState<AgentPost[]>([]);
  const [reviews, setReviews] = useState<ReviewsResponse>({
    reviews: [],
    average: null,
    count: 0,
  });
  const [related, setRelated] = useState<RelatedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      const [postsData, relatedData] = await Promise.all([
        api.get<AgentPost[]>(`/market/${id}/posts`).catch(() => [] as AgentPost[]),
        api.get<RelatedListing[]>(`/market/${id}/related`).catch(() => [] as RelatedListing[]),
        loadReviews(),
      ]);
      setPosts(postsData || []);
      setRelated(relatedData || []);
    } catch (err) {
      if (err instanceof ApiError) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, loadReviews]);

  useEffect(() => {
    load();
  }, [load]);

  const handleNegotiate = () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    router.push(`/market/agents?negotiate=${id}`);
  };

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
    <div className="min-h-screen" style={{ background: '#000' }}>
      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] sticky top-0 z-40 backdrop-blur-md bg-black/70">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-zinc-500">
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <header className="mb-10">
          <div className="flex items-start gap-5 flex-wrap">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `${meta.color}14`,
                border: `1px solid ${meta.color}33`,
              }}
            >
              <TypeIcon className="w-6 h-6" style={{ color: meta.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
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
              <h1 className="text-3xl md:text-4xl font-medium text-white tracking-tight leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-center gap-3 mt-3 text-sm text-zinc-400">
                <Link
                  href={`/u/${listing.seller.username || listing.seller.id}`}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  {listing.seller.avatarUrl ? (
                    <img
                      src={listing.seller.avatarUrl}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] text-zinc-400">
                      {(listing.seller.username || 'A').charAt(0).toUpperCase()}
                    </span>
                  )}
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
              <button
                onClick={handleNegotiate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                {isFree ? 'Get it' : 'Negotiate'}
              </button>
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
                <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                  <Terminal className="w-8 h-8 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-zinc-400 mb-1">No live endpoint on this listing</p>
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
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${pm.tone}`}
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
                        className="group flex items-start gap-3 rounded-lg border border-white/8 bg-zinc-950/40 p-3 hover:border-purple-400/30 hover:bg-purple-500/5 transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: `${meta.color}18` }}
                        >
                          <meta.Icon className="w-4 h-4" style={{ color: meta.color }} />
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
            <PricingCard listing={listing} onNegotiate={handleNegotiate} />
            <SellerCard seller={listing.seller} />
            <MetaCard listing={listing} />
            {listing.repository && <RepositoryCard repo={listing.repository} />}
          </aside>
        </div>
      </div>
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
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
        <Icon className="w-4 h-4 text-zinc-500" />
        <h2 className="text-sm font-medium text-zinc-200 tracking-wide">{title}</h2>
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
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="font-mono text-[11px] text-zinc-500">agent.invoke</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">5 / min</span>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed text-xs text-zinc-200 font-medium transition-colors"
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
        <div className="border-t border-white/[0.06] bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-2">
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
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs text-white font-medium transition-colors"
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
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  {r.author.avatarUrl ? (
                    <img
                      src={r.author.avatarUrl}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] text-zinc-400">
                      {(r.author.username || 'A').charAt(0).toUpperCase()}
                    </span>
                  )}
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
  onNegotiate,
}: {
  listing: MarketListing;
  onNegotiate: () => void;
}) {
  const isFree = listing.price === 0;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Price</p>
      {isFree ? (
        <p className="text-3xl font-medium text-emerald-400">Free</p>
      ) : (
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-medium text-white tabular-nums">{listing.price}</p>
          <p className="text-sm text-zinc-500">{listing.currency}</p>
        </div>
      )}
      {listing.minPrice !== null && listing.minPrice !== undefined && listing.minPrice > 0 && (
        <p className="text-xs text-zinc-500 mt-1">
          Floor · {listing.minPrice} {listing.currency}
        </p>
      )}
      <button
        onClick={onNegotiate}
        className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        {isFree ? 'Get it' : 'Negotiate with seller'}
      </button>
      <p className="text-[11px] text-zinc-600 mt-2.5 text-center leading-relaxed">
        Payment held in escrow until you approve delivery.
      </p>
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
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">Seller</p>
      <div className="flex items-center gap-3">
        {seller.avatarUrl ? (
          <img
            src={seller.avatarUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-white/10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-sm text-zinc-300">
            {(seller.username || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            @{seller.username || 'anonymous'}
          </p>
          <Link
            href={`/u/${seller.username || seller.id}`}
            className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
          >
            View profile <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      {seller.walletAddress && (
        <button
          onClick={copyWallet}
          className="w-full mt-3 inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/[0.06] hover:border-white/15 transition-colors group"
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
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">Details</p>
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
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">Repository</p>
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-blue-400" />
        <p className="text-sm font-medium text-white truncate">{repo.name}</p>
      </div>
      {repo.language && <p className="text-xs text-zinc-500 mb-3">{repo.language}</p>}
      <a
        href={repo.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 text-xs text-zinc-300 transition-colors"
      >
        <ExternalLink className="w-3 h-3" /> Open on GitHub
      </a>
    </div>
  );
}
