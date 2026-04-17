'use client';

import { motion } from 'framer-motion';
import {
  Bot,
  GitBranch,
  Zap,
  Package,
  Star,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Calendar,
  ShoppingCart,
  ChevronRight,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { ShareButton } from '@/components/ui/ShareButton';
import { api, ApiError } from '@/lib/api/client';
import { useFavorites } from '@/lib/hooks/useFavorites';

type ListingType = 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';

interface SellerProfile {
  seller: {
    id: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    githubLogin: string | null;
    walletAddress: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    websiteUrl: string | null;
    createdAt: string;
  };
  listings: Array<{
    id: string;
    title: string;
    type: ListingType;
    price: number;
    currency: string;
    tags: string[];
    createdAt: string;
    reviewAverage?: number | null;
    reviewCount?: number;
  }>;
  stats: {
    listings: number;
    salesAllTime: number;
    avgRating: number | null;
    reviewCount: number;
  };
  recentReviews: Array<{
    id: string;
    createdAt: string;
    rating: number;
    content: string | null;
    author: { id: string; username: string | null; avatarUrl: string | null };
    listing: { id: string; title: string };
  }>;
}

const TYPE_META: Record<
  ListingType,
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

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatJoined(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { has, toggle } = useFavorites();

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        setLoading(true);
        const resp = await api.get<SellerProfile>(`/market/sellers/${username}`);
        setData(resp);
      } catch (err) {
        if (err instanceof ApiError) setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#000' }}>
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-purple-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#000' }}
      >
        <p className="text-6xl font-mono text-zinc-800">404</p>
        <p className="text-zinc-400">Seller not found</p>
        <Link
          href="/market"
          className="text-sm text-purple-300 hover:text-purple-200 inline-flex items-center gap-1.5"
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  const { seller, listings, stats, recentReviews } = data;

  return (
    <div style={{ background: '#000' }} className="relative min-h-screen overflow-hidden">
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }}
      />

      {/* Breadcrumb */}
      <div className="border-b border-white/8 sticky top-0 z-40 backdrop-blur-md bg-zinc-950/90">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/market" className="hover:text-zinc-200 transition-colors">
            Marketplace
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-700" />
          <Link href="/market/agents" className="hover:text-zinc-200 transition-colors">
            Sellers
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-700" />
          <span className="text-zinc-300 truncate max-w-md">@{seller.username}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Hero */}
        <section className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-full border border-white/10 bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
            {seller.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={seller.avatarUrl}
                alt={seller.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-zinc-400">
                {seller.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl lg:text-4xl font-light text-white">
              <GradientText gradient="purple">@{seller.username}</GradientText>
            </h1>
            {seller.bio && (
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed max-w-2xl">{seller.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {formatJoined(seller.createdAt)}
              </span>
              {seller.githubLogin && (
                <a
                  href={`https://github.com/${seller.githubLogin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Github className="w-3 h-3" />
                  {seller.githubLogin}
                </a>
              )}
              {seller.twitterUrl && (
                <a
                  href={seller.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Twitter className="w-3 h-3" />
                  twitter
                </a>
              )}
              {seller.linkedinUrl && (
                <a
                  href={seller.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Linkedin className="w-3 h-3" />
                  linkedin
                </a>
              )}
              {seller.websiteUrl && (
                <a
                  href={seller.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  website
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <ShareButton
              title={`@${seller.username} on Bolty`}
              text={`Check out @${seller.username}'s listings on Bolty`}
              ariaLabel="Share seller profile"
            />
            <Link
              href={`/u/${seller.username}`}
              className="text-xs text-zinc-400 hover:text-white underline underline-offset-4"
            >
              View full profile →
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Listings" value={stats.listings} icon={Package} />
          <StatCard label="Sales" value={stats.salesAllTime} icon={ShoppingCart} />
          <StatCard
            label="Avg rating"
            value={stats.avgRating !== null ? stats.avgRating.toFixed(1) : '—'}
            icon={Star}
            accent="#f59e0b"
          />
          <StatCard label="Reviews" value={stats.reviewCount} icon={Star} accent="#f59e0b" />
        </section>

        {/* Listings */}
        <section>
          <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">
            Listings ({listings.length})
          </h2>
          {listings.length === 0 ? (
            <div className="text-sm text-zinc-500 border border-dashed border-white/10 rounded-lg p-8 text-center">
              This seller hasn't published any listings yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => {
                const meta = TYPE_META[l.type] || TYPE_META.OTHER;
                const saved = has(l.id);
                return (
                  <Link
                    key={l.id}
                    href={`/market/agents/${l.id}`}
                    className="group relative border border-white/8 rounded-lg bg-zinc-950/50 p-4 hover:border-purple-400/30 hover:bg-purple-500/5 transition-colors"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(l.id);
                      }}
                      aria-pressed={saved}
                      aria-label={saved ? 'Remove from saved' : 'Save for later'}
                      className={`absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                        saved
                          ? 'text-pink-400 bg-pink-500/10 opacity-100'
                          : 'text-zinc-500 hover:text-pink-300 hover:bg-white/5 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-pink-400' : ''}`} />
                    </button>
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center"
                        style={{ background: `${meta.color}18` }}
                      >
                        <meta.Icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0 flex-1 pr-7">
                        <div className="text-sm font-medium text-white truncate">{l.title}</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {meta.label} · {timeAgo(l.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">
                        {l.price} {l.currency}
                      </span>
                      {l.reviewAverage !== null &&
                        l.reviewAverage !== undefined &&
                        (l.reviewCount ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {l.reviewAverage.toFixed(1)}
                            <span className="text-zinc-600">({l.reviewCount})</span>
                          </span>
                        )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent reviews */}
        {recentReviews.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">Recent reviews</h2>
            <div className="space-y-3">
              {recentReviews.map((r) => (
                <div
                  key={r.id}
                  className="border border-white/8 rounded-lg bg-zinc-950/50 p-4 flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {r.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.author.avatarUrl}
                        alt={r.author.username || 'author'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400">
                        {(r.author.username || '?').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-200 font-medium">
                        @{r.author.username || 'anon'}
                      </span>
                      <span className="text-zinc-600">·</span>
                      <Link
                        href={`/market/agents/${r.listing.id}`}
                        className="text-purple-300 hover:underline truncate"
                      >
                        {r.listing.title}
                      </Link>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-500">{timeAgo(r.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                        />
                      ))}
                    </div>
                    {r.content && (
                      <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{r.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = '#836EF9',
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent?: string;
}) {
  return (
    <div className="border border-white/8 rounded-lg bg-zinc-950/60 p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 0%, ${accent}, transparent 60%)` }}
      />
      <div className="flex items-center justify-between mb-2 relative">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <div className="text-2xl font-light text-white relative">{value}</div>
    </div>
  );
}
