'use client';

import {
  ArrowUpRight,
  BookOpen,
  Bot,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  LifeBuoy,
  Lock,
  Mail,
  MessageCircle,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────

interface Topic {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: string;
  description: string;
  href: string;
}

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'buying' | 'selling' | 'escrow' | 'account';
  tags: string[];
}

// ── Data ───────────────────────────────────────────────────────────────

const TOPICS: Topic[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    icon: Sparkles,
    accent: '#14F195',
    description: 'Create an account, connect your wallet, and make your first purchase.',
    href: '/how-it-works',
  },
  {
    id: 'buying',
    title: 'Buying & downloads',
    icon: ShoppingBag,
    accent: '#06B6D4',
    description: 'How orders, deliveries and inventory access work after a purchase.',
    href: '/inventory?tab=purchased',
  },
  {
    id: 'selling',
    title: 'Selling & payouts',
    icon: Zap,
    accent: '#EC4899',
    description: 'Publish listings, attach files or endpoints, and get paid on delivery.',
    href: '/market/seller/publish',
  },
  {
    id: 'escrow',
    title: 'Escrow & disputes',
    icon: Lock,
    accent: '#22c55e',
    description: 'How funds are held on-chain, and how disputes are resolved.',
    href: '/docs/agent-protocol',
  },
  {
    id: 'wallet',
    title: 'Wallet & billing',
    icon: Wallet,
    accent: '#f59e0b',
    description: 'Connect wallets, track balances, and export transaction history.',
    href: '/profile?tab=wallet',
  },
  {
    id: 'security',
    title: 'Security & 2FA',
    icon: Shield,
    accent: '#a855f7',
    description: 'Protect your account with strong auth and review active sessions.',
    href: '/profile?tab=security',
  },
  {
    id: 'agents-api',
    title: 'Agents & API',
    icon: Bot,
    accent: '#3b82f6',
    description: 'Build with the Agent Protocol, API keys and programmatic access.',
    href: '/docs/agent-api',
  },
  {
    id: 'billing',
    title: 'Refunds & billing',
    icon: CreditCard,
    accent: '#64748b',
    description: 'Request refunds, manage invoices and see past receipts.',
    href: '/orders',
  },
];

const FAQS: FaqEntry[] = [
  {
    id: 'what-is-bolty',
    question: 'What is Bolty?',
    answer:
      'Bolty is a marketplace for AI agents, bots, scripts and repositories. Buyers and sellers transact on-chain with escrow protection — every order is funded up-front and released on delivery.',
    category: 'general',
    tags: ['overview', 'intro'],
  },
  {
    id: 'how-escrow',
    question: 'How does escrow work?',
    answer:
      'When a buyer purchases a listing, the funds are locked in an on-chain escrow contract. The seller gets paid only after the buyer marks the order as delivered, or after the auto-release window. If anything goes wrong, either party can open a dispute.',
    category: 'escrow',
    tags: ['escrow', 'safety'],
  },
  {
    id: 'payment-methods',
    question: 'What can I pay with?',
    answer:
      'Native ETH is supported for all listings. BOLTY token payments (with fee discounts) are rolling out next — sellers choose which currencies they accept when publishing.',
    category: 'buying',
    tags: ['payment', 'eth', 'token'],
  },
  {
    id: 'seller-fees',
    question: 'What are the seller fees?',
    answer:
      'Platform fee is a flat 7% of each sale. Gas fees are paid by the buyer on purchase and by the escrow on release.',
    category: 'selling',
    tags: ['fees', 'payouts'],
  },
  {
    id: 'file-delivery',
    question: 'How do buyers receive what they purchased?',
    answer:
      'Everything lives in your Library. Static listings (repos, scripts, zips) give you a signed download link. Live agents give you an interactive runner plus API credentials that only your account can use.',
    category: 'buying',
    tags: ['delivery', 'library', 'downloads'],
  },
  {
    id: 'publish-listing',
    question: 'How do I publish a listing?',
    answer:
      'Head to Publish listing → pick a type (Agent, Bot, Script, Repo, Other) → upload files or point to a live endpoint → set price, tags and preview → submit. Listings go live as soon as they pass basic validation.',
    category: 'selling',
    tags: ['publish', 'listing'],
  },
  {
    id: 'dispute',
    question: 'What happens if I open a dispute?',
    answer:
      "Disputes freeze the escrow until a moderator reviews both sides' evidence. Typical resolution takes under 48h. The losing party pays a small dispute fee (1% of the order) to discourage frivolous claims.",
    category: 'escrow',
    tags: ['dispute', 'refund'],
  },
  {
    id: 'refund',
    question: 'Can I get a refund?',
    answer:
      "Yes — as long as you haven't marked the order as delivered, you can request a full refund at any time. After delivery, refunds require a dispute.",
    category: 'buying',
    tags: ['refund'],
  },
  {
    id: 'change-wallet',
    question: 'Can I change my connected wallet?',
    answer:
      'You can link multiple wallets from Profile → Wallet. Only one wallet is "primary" at a time and receives payouts. Switching primary wallets does not affect past orders.',
    category: 'account',
    tags: ['wallet', 'account'],
  },
  {
    id: 'api-keys',
    question: 'How do I use the Agent API?',
    answer:
      'Generate an API key under Profile → API keys. Each key is scoped (read, write, admin) and rate-limited. Full docs including auth, streaming and error codes live in /docs/agent-api.',
    category: 'selling',
    tags: ['api', 'keys', 'automation'],
  },
  {
    id: 'two-factor',
    question: 'How do I enable 2FA?',
    answer:
      'Profile → Security & 2FA. We support TOTP apps (Authy, 1Password, Google Authenticator). Hardware keys (WebAuthn) are in beta — enable them if you handle large volumes.',
    category: 'account',
    tags: ['2fa', 'security'],
  },
  {
    id: 'seller-verification',
    question: 'Do I need to verify my identity to sell?',
    answer:
      'Not for most listings. We only require verification above a payout threshold (currently 5 ETH lifetime) to comply with financial regulations. You can pre-verify any time from Profile → Security.',
    category: 'selling',
    tags: ['verification', 'kyc'],
  },
];

const CATEGORY_LABELS: Record<FaqEntry['category'], string> = {
  general: 'General',
  buying: 'Buying',
  selling: 'Selling',
  escrow: 'Escrow',
  account: 'Account',
};

const CATEGORY_COLORS: Record<FaqEntry['category'], string> = {
  general: '#14F195',
  buying: '#06B6D4',
  selling: '#EC4899',
  escrow: '#22c55e',
  account: '#f59e0b',
};

const CONTACT_CHANNELS: {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}[] = [
  {
    id: 'docs',
    title: 'Read the docs',
    description: 'Protocol spec, API reference and integration guides.',
    cta: 'Open docs',
    href: '/docs/agent-protocol',
    icon: BookOpen,
    accent: '#14F195',
  },
  {
    id: 'chat',
    title: 'Ask the community',
    description: 'Jump into live chat with other builders and sellers.',
    cta: 'Open chat',
    href: '/chat',
    icon: MessageCircle,
    accent: '#06B6D4',
  },
  {
    id: 'support',
    title: 'Email support',
    description: 'Account, payout or escrow issues — typically < 24h response.',
    cta: 'support@bolty.run',
    href: 'mailto:support@bolty.run',
    icon: Mail,
    accent: '#EC4899',
  },
];

// ── Page ───────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | FaqEntry['category']>('all');

  const q = query.trim().toLowerCase();
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((f) => {
      if (category !== 'all' && f.category !== category) return false;
      if (!q) return true;
      const haystack = [f.question, f.answer, ...f.tags].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [q, category]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = { all: FAQS.length };
    for (const f of FAQS) c[f.category] = (c[f.category] || 0) + 1;
    return c;
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 md:px-10 md:pt-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] font-medium text-zinc-500 uppercase tracking-[0.18em] mb-2">
                <LifeBuoy className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Help center</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                How can we help?
              </h1>
              <p className="text-[12.5px] text-zinc-500 font-semibold mt-1">
                Guides, FAQs and direct channels to reach the team.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="px-6 md:px-10 mb-4">
        <div className="mx-auto max-w-[1400px]">
          <div
            className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(20, 241, 149,0.55) 50%, transparent 100%)',
              }}
            />
            <Search className="w-4 h-4 text-zinc-500" strokeWidth={1.75} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help articles, topics, keywords…"
              className="flex-1 bg-transparent border-none outline-none text-[13.5px] font-semibold text-white placeholder-zinc-600"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                /
              </kbd>
            )}
          </div>
        </div>
      </section>

      {/* Topics grid */}
      {!q && (
        <section className="px-6 md:px-10 mb-6">
          <div className="mx-auto max-w-[1400px]">
            <div className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-zinc-500 mb-2">
              Browse by topic
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {TOPICS.map((t) => (
                <TopicTile key={t.id} topic={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="px-6 md:px-10 mb-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <div className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              Frequently asked
            </div>
            <div
              className="flex items-center gap-0.5 rounded-lg p-0.5"
              style={{
                background: 'rgba(0,0,0,0.4)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              <CategoryChip
                label="All"
                count={categoryCounts.all || 0}
                active={category === 'all'}
                onClick={() => setCategory('all')}
              />
              {(Object.keys(CATEGORY_LABELS) as FaqEntry['category'][]).map((c) => (
                <CategoryChip
                  key={c}
                  label={CATEGORY_LABELS[c]}
                  count={categoryCounts[c] || 0}
                  active={category === c}
                  onClick={() => setCategory(c)}
                  accent={CATEGORY_COLORS[c]}
                />
              ))}
            </div>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {filteredFaqs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <HelpCircle className="w-6 h-6 text-zinc-600 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-[13px] text-zinc-300 font-semibold">
                  No articles match {q ? `"${query}"` : 'this filter'}.
                </p>
                <p className="text-[11.5px] text-zinc-500 font-semibold mt-1">
                  Try a different keyword or{' '}
                  <Link href="mailto:support@bolty.run" className="text-[#7DFFBF] hover:text-white">
                    reach out to support
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ul>
                {filteredFaqs.map((f, i) => (
                  <FaqRow key={f.id} entry={f} index={i} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Contact channels */}
      <section className="px-6 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-zinc-500 mb-2">
            Still need help?
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {CONTACT_CHANNELS.map((c) => (
              <ContactCard key={c.id} channel={c} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────────

function TopicTile({ topic }: { topic: Topic }) {
  const Icon = topic.icon;
  return (
    <Link
      href={topic.href}
      className="group relative rounded-xl p-4 overflow-hidden transition-all hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${topic.accent} 50%, transparent 100%)`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `${topic.accent}28` }}
      />
      <div className="relative flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: `${topic.accent}18`,
            boxShadow: `inset 0 0 0 1px ${topic.accent}44`,
          }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} style={{ color: topic.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-normal text-white truncate">{topic.title}</span>
            <ArrowUpRight
              className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300 transition"
              strokeWidth={1.75}
            />
          </div>
          <p className="text-[11px] text-zinc-500 font-semibold mt-1 leading-relaxed">
            {topic.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
  accent,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  accent?: string;
}) {
  const c = accent || '#14F195';
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition"
      style={{
        color: active ? '#ffffff' : '#a1a1aa',
        background: active ? `${c}22` : 'transparent',
        boxShadow: active ? `inset 0 0 0 1px ${c}5a` : 'none',
      }}
    >
      {label}
      <span
        className="text-[10px] font-mono tabular-nums"
        style={{ color: active ? `${c}ee` : '#71717a' }}
      >
        {count}
      </span>
    </button>
  );
}

function FaqRow({ entry, index }: { entry: FaqEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const accent = CATEGORY_COLORS[entry.category];

  return (
    <li className="border-b border-white/[0.04] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative grid grid-cols-[28px_minmax(0,1fr)_90px_20px] items-center gap-3 px-3 py-3 w-full text-left transition hover:bg-white/[0.02]"
        aria-expanded={open}
      >
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: accent, opacity: open ? 0.9 : 0.4 }}
        />
        <span className="text-[11px] text-zinc-600 font-mono text-center tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-normal text-white">{entry.question}</div>
          {!open && (
            <div className="text-[11px] text-zinc-500 font-semibold mt-0.5 truncate">
              {entry.answer}
            </div>
          )}
        </div>
        <span
          className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{
            color: accent,
            background: `${accent}14`,
            boxShadow: `inset 0 0 0 1px ${accent}44`,
          }}
        >
          {CATEGORY_LABELS[entry.category]}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 text-zinc-500 transition"
          strokeWidth={1.75}
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <div className="px-3 pb-4 pl-[56px] pr-12">
          <p className="text-[12.5px] text-zinc-300 font-semibold leading-relaxed">{entry.answer}</p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 rounded text-zinc-500 font-mono"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function ContactCard({
  channel,
}: {
  channel: {
    id: string;
    title: string;
    description: string;
    cta: string;
    href: string;
    icon: LucideIcon;
    accent: string;
  };
}) {
  const Icon = channel.icon;
  const external = channel.href.startsWith('mailto:');
  const Component: React.ElementType = external ? 'a' : Link;
  const extraProps = external ? {} : { href: channel.href };
  return (
    <Component
      {...(external ? { href: channel.href } : extraProps)}
      className="group relative rounded-xl p-4 overflow-hidden block transition-all hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.6), rgba(10,10,14,0.6))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${channel.accent} 50%, transparent 100%)`,
        }}
      />
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: `${channel.accent}18`,
            boxShadow: `inset 0 0 0 1px ${channel.accent}44`,
          }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} style={{ color: channel.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-normal text-white">{channel.title}</div>
          <p className="text-[11px] text-zinc-500 font-semibold mt-0.5 leading-relaxed">
            {channel.description}
          </p>
          <div
            className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium transition"
            style={{ color: channel.accent }}
          >
            {channel.cta}
            <ArrowUpRight
              className="w-3 h-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.75}
            />
          </div>
        </div>
      </div>
    </Component>
  );
}

// Keep these imports reachable for future entry additions
void FileText;
