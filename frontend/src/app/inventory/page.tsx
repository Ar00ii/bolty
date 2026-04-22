'use client';

import {
  Bot,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  GitBranch,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface PublishedRepo {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  downloadCount: number;
  githubUrl: string;
  topics: string[];
  logoUrl: string | null;
  isPrivate: boolean;
  isLocked: boolean;
  lockedPriceUsd: number | null;
  createdAt: string;
  raysEarned: number;
}

interface PublishedListing {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  tags: string[];
  status: string;
  createdAt: string;
  raysEarned: number;
}

interface PurchasedRepo {
  id: string;
  purchasedAt: string;
  txHash: string;
  amountWei: string;
  verified: boolean;
  repository: {
    id: string;
    name: string;
    fullName: string;
    githubUrl: string;
    logoUrl: string | null;
  };
  seller: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface PurchasedListing {
  id: string;
  purchasedAt: string;
  txHash: string;
  amountWei: string;
  verified: boolean;
  status: string;
  escrowStatus: string;
  listing: {
    id: string;
    title: string;
    type: string;
    price: number;
    currency: string;
  };
  seller: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface ReputationEvent {
  id: string;
  createdAt: string;
  points: number;
  reason: string;
  resourceId: string | null;
  note: string | null;
}

interface InventoryData {
  published: { repos: PublishedRepo[]; listings: PublishedListing[] };
  purchased: { repos: PurchasedRepo[]; listings: PurchasedListing[] };
  rays: { total: number; recentEvents: ReputationEvent[] };
}

type Tab = 'published' | 'purchased' | 'rays';

const REASON_LABEL: Record<string, string> = {
  REPO_PUBLISHED: 'Published a repository',
  REPO_SOLD: 'Sold a repository',
  REPO_PURCHASED: 'Bought a repository',
  REPO_UPVOTE_RECEIVED: 'Upvote received',
  LISTING_PUBLISHED: 'Published a listing',
  AI_AGENT_PUBLISHED: 'Published an AI agent',
  LISTING_SOLD: 'Sold a listing',
  LISTING_PURCHASED: 'Bought a listing',
  PROFILE_COMPLETED: 'Profile completed',
  SERVICE_COMPLETED: 'Service completed',
  FIRST_SALE: 'First sale bonus',
  FIRST_PURCHASE: 'First purchase bonus',
  COLLABORATOR_ADDED: 'Added as collaborator',
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatEth(wei: string): string {
  try {
    const n = Number(wei) / 1e18;
    if (!Number.isFinite(n) || n === 0) return '0';
    return n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  } catch {
    return '0';
  }
}

function shortTx(tx: string): string {
  if (!tx || tx.length < 14) return tx;
  return `${tx.slice(0, 8)}…${tx.slice(-6)}`;
}

export default function InventoryPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('published');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<InventoryData>('/market/my-inventory');
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    void load();
  }, [isAuthenticated, load, router]);

  const totals = useMemo(() => {
    if (!data) return { published: 0, purchased: 0, rays: 0 };
    return {
      published: data.published.repos.length + data.published.listings.length,
      purchased: data.purchased.repos.length + data.purchased.listings.length,
      rays: data.rays.total,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen px-6 py-20 flex flex-col items-center justify-center gap-3">
        <p className="text-zinc-400">{error || 'Something went wrong'}</p>
        <button
          onClick={load}
          className="px-3 py-1.5 rounded-md text-[12px] text-white"
          style={{
            background: 'rgba(131,110,249,0.2)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.45)',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-zinc-500 mb-3">
        <Package className="w-3.5 h-3.5 text-[#b4a7ff]" />
        <span>Bolty inventory</span>
        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      <h1 className="text-3xl font-light text-white tracking-[-0.01em]">Inventory</h1>
      <p className="text-sm text-zinc-400 font-light mt-1 max-w-2xl">
        Everything you&apos;ve published and everything you&apos;ve bought — rays, tx
        hashes, sellers, all in one place.
      </p>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <StatCard label="Published" value={totals.published} icon={Upload} accent="#06B6D4" />
        <StatCard label="Purchased" value={totals.purchased} icon={ShoppingBag} accent="#836EF9" />
        <StatCard
          label="Rays earned"
          value={totals.rays}
          icon={Sparkles}
          accent="#EC4899"
          suffix="rays"
        />
      </div>

      <div className="mt-6 flex items-center gap-1 border-b border-white/[0.06]">
        <TabButton active={tab === 'published'} onClick={() => setTab('published')}>
          Published {totals.published ? <Count>{totals.published}</Count> : null}
        </TabButton>
        <TabButton active={tab === 'purchased'} onClick={() => setTab('purchased')}>
          Purchased {totals.purchased ? <Count>{totals.purchased}</Count> : null}
        </TabButton>
        <TabButton active={tab === 'rays'} onClick={() => setTab('rays')}>
          Rays history {data.rays.recentEvents.length ? <Count>{data.rays.recentEvents.length}</Count> : null}
        </TabButton>
      </div>

      <div className="mt-5">
        {tab === 'published' && <PublishedTab published={data.published} />}
        {tab === 'purchased' && (
          <PurchasedTab purchased={data.purchased} onRecovered={() => void load()} />
        )}
        {tab === 'rays' && <RaysTab events={data.rays.recentEvents} total={data.rays.total} />}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  suffix?: string;
}) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.7), rgba(10,10,14,0.7))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}80 50%, transparent)`,
        }}
      />
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
        <span style={{ color: accent }} className="inline-flex">
          <Icon className="w-3.5 h-3.5" />
        </span>
        {label}
      </div>
      <div className="text-3xl font-light text-white tabular-nums tracking-[-0.01em]">
        {value.toLocaleString()}
        {suffix && <span className="text-sm text-zinc-500 ml-2 font-light">{suffix}</span>}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="relative px-3 py-2 text-[12.5px] font-light transition-colors"
      style={{ color: active ? '#ffffff' : '#9ca3af' }}
    >
      {children}
      {active && (
        <span
          className="absolute left-0 right-0 -bottom-px h-[2px]"
          style={{ background: 'linear-gradient(90deg, #06B6D4, #836EF9, #EC4899)' }}
        />
      )}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono text-zinc-400 bg-white/[0.04]">
      {children}
    </span>
  );
}

function PublishedTab({ published }: { published: InventoryData['published'] }) {
  if (published.repos.length === 0 && published.listings.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="Nothing published yet"
        subtitle="Publish a GitHub repo or list an agent to appear here."
        action={{ label: 'Publish a repo', href: '/repos' }}
      />
    );
  }
  return (
    <div className="space-y-6">
      {published.repos.length > 0 && (
        <Section title="Repositories" count={published.repos.length} icon={GitBranch}>
          <ul className="divide-y divide-white/[0.04]">
            {published.repos.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/market/repos/${r.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center py-3 hover:bg-white/[0.02] px-2 rounded-md transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] text-white font-light truncate">{r.name}</div>
                    <div className="text-[11px] text-zinc-500 font-light truncate">
                      {r.isLocked ? `$${r.lockedPriceUsd} locked` : 'Public'} ·{' '}
                      <Sparkles className="w-3 h-3 inline -mt-0.5" /> {r.downloadCount} downloads ·{' '}
                      {formatDate(r.createdAt)}
                    </div>
                  </div>
                  <RaysBadge rays={r.raysEarned} />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {published.listings.length > 0 && (
        <Section title="Listings" count={published.listings.length} icon={Bot}>
          <ul className="divide-y divide-white/[0.04]">
            {published.listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/market/agents/${l.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center py-3 hover:bg-white/[0.02] px-2 rounded-md transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] text-white font-light truncate">{l.title}</div>
                    <div className="text-[11px] text-zinc-500 font-light truncate">
                      {l.type} · {l.price} {l.currency} · {l.status.toLowerCase()} ·{' '}
                      {formatDate(l.createdAt)}
                    </div>
                  </div>
                  <RaysBadge rays={l.raysEarned} />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function PurchasedTab({
  purchased,
  onRecovered,
}: {
  purchased: InventoryData['purchased'];
  onRecovered: () => void;
}) {
  return (
    <>
      <RecoverPaymentCard onRecovered={onRecovered} />
      <PurchasedTabBody purchased={purchased} />
    </>
  );
}

function PurchasedTabBody({ purchased }: { purchased: InventoryData['purchased'] }) {
  if (purchased.repos.length === 0 && purchased.listings.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No purchases yet"
        subtitle="Agents, scripts and locked repos you buy will land here."
        action={{ label: 'Browse marketplace', href: '/market' }}
      />
    );
  }
  return (
    <div className="space-y-6">
      {purchased.repos.length > 0 && (
        <Section title="Bought repositories" count={purchased.repos.length} icon={GitBranch}>
          <ul className="space-y-2">
            {purchased.repos.map((p) => (
              <PurchaseRow
                key={p.id}
                title={p.repository.name}
                subtitle={p.repository.fullName}
                href={`/market/repos/${p.repository.id}`}
                seller={p.seller}
                purchasedAt={p.purchasedAt}
                txHash={p.txHash}
                amountWei={p.amountWei}
                verified={p.verified}
              />
            ))}
          </ul>
        </Section>
      )}
      {purchased.listings.length > 0 && (
        <Section title="Bought listings" count={purchased.listings.length} icon={Bot}>
          <ul className="space-y-2">
            {purchased.listings.map((p) => (
              <PurchaseRow
                key={p.id}
                title={p.listing.title}
                subtitle={`${p.listing.type} · ${p.listing.price} ${p.listing.currency}`}
                href={`/orders/${p.id}`}
                seller={p.seller}
                purchasedAt={p.purchasedAt}
                txHash={p.txHash}
                amountWei={p.amountWei}
                verified={p.verified}
              />
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function PurchaseRow({
  title,
  subtitle,
  href,
  seller,
  purchasedAt,
  txHash,
  amountWei,
  verified,
}: {
  title: string;
  subtitle: string;
  href: string;
  seller: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null };
  purchasedAt: string;
  txHash: string;
  amountWei: string;
  verified: boolean;
}) {
  return (
    <li
      className="relative rounded-lg p-3"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.5), rgba(10,10,14,0.5))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-start gap-3">
        <UserAvatar
          src={seller.avatarUrl ?? undefined}
          name={seller.displayName || seller.username || 'Seller'}
          userId={seller.id}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <Link href={href} className="block">
            <div className="text-[13px] text-white font-light truncate hover:text-[#b4a7ff] transition-colors">
              {title}
            </div>
            <div className="text-[11px] text-zinc-500 font-light truncate">{subtitle}</div>
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10.5px] text-zinc-400 font-light">
            <span>
              from{' '}
              <Link
                href={`/u/${seller.username ?? ''}`}
                className="text-[#b4a7ff] hover:underline"
              >
                @{seller.username ?? 'unknown'}
              </Link>
            </span>
            <span className="text-zinc-700">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDate(purchasedAt)}
            </span>
            <span className="text-zinc-700">·</span>
            <span className="font-mono tabular-nums text-[#b4a7ff]">
              {formatEth(amountWei)} ETH
            </span>
            <span className="text-zinc-700">·</span>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-zinc-500 hover:text-white transition-colors"
              title={txHash}
            >
              {shortTx(txHash)} <ExternalLink className="w-3 h-3" />
            </a>
            <span
              className="inline-flex items-center gap-1 ml-auto px-1.5 py-0.5 rounded-md text-[10px]"
              style={{
                color: verified ? '#22c55e' : '#f59e0b',
                background: verified ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                boxShadow: `inset 0 0 0 1px ${verified ? 'rgba(34,197,94,0.35)' : 'rgba(245,158,11,0.35)'}`,
              }}
            >
              {verified ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
              {verified ? 'Verified' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

function RecoverPaymentCard({ onRecovered }: { onRecovered: () => void }) {
  const [open, setOpen] = useState(false);
  const [tx, setTx] = useState('');
  const [seller, setSeller] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const submit = async () => {
    const txTrim = tx.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(txTrim)) {
      setMsg({ kind: 'err', text: 'Invalid tx hash — paste the full 0x… from MetaMask.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const body: { txHash: string; sellerUsername?: string } = { txHash: txTrim };
      if (seller.trim()) body.sellerUsername = seller.trim().replace(/^@/, '');
      const result = await api.post<{
        success: boolean;
        downloadUrl?: string;
      }>('/repos/recover-purchase', body);
      if (result.success) {
        setMsg({ kind: 'ok', text: 'Recovered! Refreshing your inventory…' });
        if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
        }
        setTimeout(() => {
          setTx('');
          setSeller('');
          setMsg(null);
          setOpen(false);
          onRecovered();
        }, 1400);
      }
    } catch (err) {
      setMsg({
        kind: 'err',
        text: err instanceof ApiError ? err.message : 'Recovery failed. Try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="mb-5 rounded-xl p-4"
      style={{
        background: 'linear-gradient(180deg, rgba(131,110,249,0.08), rgba(10,10,14,0.5))',
        boxShadow: '0 0 0 1px rgba(131,110,249,0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(131,110,249,0.2)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.45)',
          }}
        >
          <Shield className="w-4 h-4 text-[#b4a7ff]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-light text-white">Missing a purchase?</h3>
          <p className="text-[11.5px] text-zinc-400 font-light mt-0.5">
            Paid on-chain but the repo didn&apos;t appear? Paste the transaction hash
            from MetaMask. We&apos;ll find the repo automatically.
          </p>
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-white transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(180deg, rgba(131,110,249,0.38), rgba(131,110,249,0.14))',
                boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.48)',
              }}
            >
              Recover stuck payment
            </button>
          )}
          {open && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={tx}
                onChange={(e) => setTx(e.target.value)}
                placeholder="0x… transaction hash (required)"
                disabled={busy}
                className="w-full px-3 py-2 rounded-lg text-[12px] font-mono text-white placeholder:text-zinc-600 focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              />
              <input
                type="text"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="@seller username (optional, speeds up match)"
                disabled={busy}
                className="w-full px-3 py-2 rounded-lg text-[12px] text-white placeholder:text-zinc-600 focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              />
              {msg && (
                <p
                  className="text-[11.5px] font-light"
                  style={{ color: msg.kind === 'ok' ? '#86efac' : '#fca5a5' }}
                >
                  {msg.text}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    if (busy) return;
                    setOpen(false);
                    setTx('');
                    setSeller('');
                    setMsg(null);
                  }}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-md text-[12px] text-zinc-400 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy || !tx.trim()}
                  className="px-3 py-1.5 rounded-md text-[12px] text-white disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.38), rgba(131,110,249,0.14))',
                    boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.48)',
                  }}
                >
                  {busy ? 'Verifying…' : 'Recover'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RaysTab({ events, total }: { events: ReputationEvent[]; total: number }) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No rays yet"
        subtitle="Earn rays by publishing work, getting upvotes, and making sales."
      />
    );
  }
  return (
    <div>
      <div className="text-[12px] text-zinc-400 font-light mb-3">
        Total:{' '}
        <span className="text-white tabular-nums">{total.toLocaleString()}</span> rays from{' '}
        {events.length} events.
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {events.map((ev) => (
          <li key={ev.id} className="flex items-center gap-3 py-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(236,72,153,0.12)',
                boxShadow: 'inset 0 0 0 1px rgba(236,72,153,0.35)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#EC4899]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] text-white font-light truncate">
                {REASON_LABEL[ev.reason] || ev.reason}
              </div>
              <div className="text-[10.5px] text-zinc-500 font-light truncate">
                {ev.note ?? '—'} · {formatDate(ev.createdAt)}
              </div>
            </div>
            <span className="text-[12.5px] font-mono tabular-nums text-[#EC4899]">
              +{ev.points}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl p-4"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.5), rgba(10,10,14,0.5))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{
            background: 'rgba(131,110,249,0.12)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
          }}
        >
          <Icon className="w-3.5 h-3.5 text-[#b4a7ff]" />
        </div>
        <h2 className="text-[11px] uppercase tracking-[0.18em] font-medium text-zinc-300">
          {title}
        </h2>
        <span className="text-[11px] font-mono text-zinc-500 ml-1">{count}</span>
      </div>
      {children}
    </section>
  );
}

function RaysBadge({ rays }: { rays: number }) {
  if (!rays) {
    return <span className="text-[10.5px] text-zinc-700 font-mono">—</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-mono"
      style={{
        color: '#EC4899',
        background: 'rgba(236,72,153,0.1)',
        boxShadow: 'inset 0 0 0 1px rgba(236,72,153,0.35)',
      }}
    >
      <Sparkles className="w-3 h-3" />+{rays}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  action?: { label: string; href: string };
}) {
  return (
    <div
      className="rounded-xl px-6 py-16 flex flex-col items-center justify-center text-center gap-3"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.4), rgba(10,10,14,0.4))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          background: 'rgba(131,110,249,0.08)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
        }}
      >
        <Icon className="w-5 h-5 text-[#b4a7ff]" />
      </div>
      <div>
        <p className="text-sm text-white font-light">{title}</p>
        <p className="text-xs text-zinc-500 font-light mt-1">{subtitle}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-white"
          style={{
            background: 'linear-gradient(180deg, rgba(131,110,249,0.38), rgba(131,110,249,0.14))',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.48)',
          }}
        >
          <Code2 className="w-3.5 h-3.5" />
          {action.label}
        </Link>
      )}
    </div>
  );
}
