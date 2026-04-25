'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  Handshake,
  WifiOff,
  X,
  Key,
  Plus,
  Trash2,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Cpu,
  Users,
  Zap,
  Send,
  HelpCircle,
  TrendingUp,
  Activity,
  Clock,
  Code2,
  Terminal,
  ArrowUpRight,
  CheckCircle2,
  Star,
  Search,
  XCircle,
  Lock,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

import { SecurityBadge } from '@/components/boltyguard/SecurityBadge';
import { AgentPickerModal } from '@/components/negotiation/AgentPickerModal';
import { Badge } from '@/components/ui/badge';
import { GradientText } from '@/components/ui/GradientText';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, ApiError, API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  getCachedWithStatus,
  setCached as setCachedEntry,
} from '@/lib/cache/pageCache';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';
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
  hasAgentEndpoint?: boolean;
  fileKey?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileMimeType?: string | null;
  seller: { id: string; username: string | null; avatarUrl: string | null };
  reviewAverage?: number | null;
  reviewCount?: number;
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
  fromRole: 'buyer' | 'seller' | 'buyer_agent' | 'seller_agent' | 'system';
  content: string;
  proposedPrice?: number | null;
}

interface Negotiation {
  id: string;
  status: 'ACTIVE' | 'AGREED' | 'REJECTED' | 'EXPIRED';
  agreedPrice?: number | null;
  mode: 'AI_AI' | 'HUMAN';
  humanSwitchRequestedBy?: string | null;
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

interface UploadedFileMeta {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  scanPassed?: boolean;
  scanNote?: string;
}

interface SecurityScan {
  passed: boolean;
  score: number;
  issues: { severity: 'critical' | 'high' | 'medium' | 'low'; message: string }[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPES = ['ALL', 'AI_AGENT', 'BOT', 'SCRIPT', 'OTHER'];
const TYPE_LABELS: Record<string, string> = {
  ALL: 'All',
  AI_AGENT: 'AI Agent',
  BOT: 'Bot',
  SCRIPT: 'Script',
  OTHER: 'Other',
};
const TYPE_COLORS: Record<string, string> = {
  BOT: 'text-bolty-400/80 border-bolty-400/25 bg-bolty-400/5',
  AI_AGENT: 'text-bolty-400/70 border-bolty-400/20 bg-bolty-400/5',
  SCRIPT: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
  OTHER: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
};
const ACCEPTS_FILE = new Set(['AI_AGENT', 'BOT', 'SCRIPT', 'OTHER']);
const ACCEPTS_AGENT_ENDPOINT = new Set(['AI_AGENT', 'BOT']);

const AGENT_CATEGORIES = {
  AI_AGENT: {
    name: 'AI Agent',
    subcategories: [
      'LLM Assistant',
      'Data Analysis',
      'Content Generation',
      'Automation',
      'Code Generation',
      'Other',
    ],
  },
  BOT: {
    name: 'Bot',
    subcategories: [
      'Discord Bot',
      'Telegram Bot',
      'Twitter Bot',
      'Chat Bot',
      'Utility Bot',
      'Other',
    ],
  },
  SCRIPT: {
    name: 'Script',
    subcategories: [
      'Python Script',
      'JavaScript/Node',
      'Shell Script',
      'Automation',
      'Data Processing',
      'Other',
    ],
  },
  OTHER: {
    name: 'Other',
    subcategories: ['Tool', 'Plugin', 'Extension', 'Template', 'Library', 'Other'],
  },
};

const PRICING_TIERS = [
  { label: 'Free', value: '0', description: 'No cost' },
  { label: 'Pay-per-use', value: 'usage', description: 'Based on usage' },
  { label: 'Fixed Price', value: 'fixed', description: 'One-time payment' },
  { label: 'Subscription', value: 'subscription', description: 'Recurring payment' },
];

const AGENT_TYPE_INFO: Record<string, { description: string; examples: string[] }> = {
  AI_AGENT: {
    description: 'LLM-powered agents that can think and make decisions autonomously',
    examples: ['Data analysis', 'Content generation', 'Code generation', 'Research assistant'],
  },
  BOT: {
    description: 'Bots that integrate with platforms like Discord, Telegram, or Slack',
    examples: ['Discord moderation', 'Twitter automation', 'Telegram assistant', 'Chat support'],
  },
  SCRIPT: {
    description: 'Standalone scripts and automation tools for developers',
    examples: ['Data processing', 'Report generation', 'System automation', 'Batch operations'],
  },
  OTHER: {
    description: 'Tools, plugins, extensions, and other technical products',
    examples: ['Browser extension', 'IDE plugin', 'Template', 'Library'],
  },
};

// Generate README content
const generateReadme = (form: any, tiers?: any[]): string => {
  const tierSection =
    tiers && tiers.length > 0
      ? `\n${tiers.map((tier) => `- **${tier.name}**: $${tier.price}/month`).join('\n')}`
      : `- **Basic**: $${form.price}/month`;

  return `# ${form.title || 'Agent'}

${form.description || 'Agent description'}

## Features

- Core functionality overview
- Support for ${form.type === 'AI_AGENT' ? 'AI-powered operations' : form.type === 'BOT' ? 'bot integration' : 'automation'}
- Easy integration with existing systems

## Getting Started

### Installation

\`\`\`bash
npm install @bolty/${form.title?.toLowerCase().replace(/\\s+/g, '-') || 'agent'}
\`\`\`

### Basic Usage

\`\`\`python
import bolty

agent = bolty.Agent(
    api_key="YOUR_API_KEY",
    endpoint="https://api.bolty.io/agents/${form.title?.toLowerCase().replace(/\\s+/g, '-') || 'agent'}"
)

result = agent.invoke(input="Your input here")
print(result.output)
\`\`\`

## Configuration

The agent can be configured with the following options:

- **api_key**: Your Bolty API key
- **timeout**: Request timeout in seconds (default: 30)
- **retry**: Number of retries on failure (default: 3)

## API Reference

### invoke(input, context)

Invoke the agent with the given input.

**Parameters:**
- \`input\` (string): The input for the agent
- \`context\` (dict, optional): Additional context data

**Returns:**
- Response object with \`output\` and \`metadata\`

## Pricing
${tierSection}

## Support

For questions and support, visit [Bolty Documentation](https://docs.bolty.io)

## License

MIT License - See LICENSE file for details

---

Built with ❤️ on [Bolty Marketplace](https://bolty.io)
`;
};

// Generate security scan results
const generateSecurityScan = (fileName: string): SecurityScan => {
  const issues: Array<{ severity: 'critical' | 'high' | 'medium' | 'low'; message: string }> = [];
  const seed = fileName.charCodeAt(0) || 0;

  // Simulate scan results based on file type
  if (fileName.includes('.py')) {
    if (seed % 3 === 0) {
      issues.push({
        severity: 'low' as const,
        message: 'Consider using environment variables for sensitive data',
      });
    }
    if (seed % 5 === 0) {
      issues.push({
        severity: 'medium' as const,
        message: 'Update dependencies to latest versions',
      });
    }
  } else if (fileName.includes('.js') || fileName.includes('.ts')) {
    if (seed % 4 === 0) {
      issues.push({
        severity: 'low' as const,
        message: 'Recommend using strict mode',
      });
    }
  }

  const score =
    100 -
    issues.reduce((acc, i) => {
      const weights: Record<'critical' | 'high' | 'medium' | 'low', number> = {
        critical: 30,
        high: 20,
        medium: 10,
        low: 5,
      };
      return acc - (weights[i.severity] || 0);
    }, 0);

  return {
    passed: score >= 70,
    score: Math.max(score, 0),
    issues,
  };
};

// Generate analytics data
const generateAnalyticsData = (agentName: string) => {
  const seed = agentName.length;
  return {
    totalRevenue: 2450 + seed * 150,
    requestsMonth: 1240 + seed * 80,
    avgResponseTime: 145 + seed * 5,
    successRate: 98.5 + (seed % 1.4),
    topIntegration: 'Python SDK',
    users: 12 + seed,
    dailyRequests: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      requests: Math.floor(Math.random() * 60 + 20),
    })),
    pricingTiers: {
      Free: 35,
      Pro: 45,
      Enterprise: 20,
    },
  };
};

// Generate code snippets for integration
const codeSnippets = {
  python: (agentName: string) => `import requests

# Invoke agent
response = requests.post(
    "https://api.bolty.io/agents/${agentName.toLowerCase().replace(/\\s+/g, '-')}/invoke",
    json={
        "input": "Your agent input here",
        "context": {}
    },
    headers={
        "Authorization": f"Bearer {YOUR_API_KEY}"
    }
)

result = response.json()
print(result.get("output"))`,

  javascript: (agentName: string) => `// Invoke agent
const response = await fetch(
  'https://api.bolty.io/agents/${agentName.toLowerCase().replace(/\\s+/g, '-')}/invoke',
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${YOUR_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: 'Your agent input here',
      context: {}
    })
  }
);

const result = await response.json();
console.log(result.output);`,

  curl: (agentName: string) => `curl -X POST \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "Your agent input here",
    "context": {}
  }' \\
  https://api.bolty.io/agents/${agentName.toLowerCase().replace(/\\s+/g, '-')}/invoke`,
};

// Generate OpenAPI-like documentation
const generateApiDocs = (form: any): string => {
  const slug = form.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  return `{
  "openapi": "3.0.0",
  "info": {
    "title": "${form.title || 'Agent API'}",
    "description": "${form.description?.substring(0, 100) || 'Agent API'}",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api.bolty.io/agents/${slug}",
      "description": "Production server"
    }
  ],
  "paths": {
    "/invoke": {
      "post": {
        "summary": "Invoke the agent",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "input": { "type": "string" },
                  "context": { "type": "object" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "output": { "type": "string" },
                    "metadata": { "type": "object" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;
};

const ROLE_LABELS: Record<string, string> = {
  buyer: 'you',
  seller: 'seller',
  buyer_agent: 'your agent',
  seller_agent: 'agent',
};
const ROLE_COLORS: Record<string, string> = {
  buyer: 'bg-bolty-500/10 border-bolty-500/20 text-bolty-300',
  seller: 'bg-zinc-800/50 border-zinc-700/30 text-zinc-300',
  buyer_agent: 'bg-bolty-500/8 border-bolty-500/15 text-bolty-200',
  seller_agent: 'bg-bolty-500/10 border-bolty-500/15 text-bolty-300',
};

const FIELD_HELP = {
  webhook:
    'Endpoint for AI-to-AI negotiations. Buyers can negotiate directly with your agent through this webhook.',
  category: 'Choose the primary category for better discoverability in the marketplace.',
  keywords:
    'Help people find your agent. Use terms that describe what it does (analytics, nlp, automation).',
  tags: 'Multiple tags increase visibility. Use 4-6 relevant tags separated by commas.',
  price: 'Base price for your agent. Set to 0 for free or use pricing models for flexible pricing.',
  floorPrice: 'Minimum acceptable price. Leave empty to allow any price in negotiations.',
};

// Validators
const validators = {
  url: (url: string): boolean => {
    if (!url.trim()) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  price: (price: string): boolean => {
    if (!price.trim()) return true;
    const num = parseFloat(price);
    return !isNaN(num) && num >= 0;
  },
  tags: (tags: string): number => {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean).length;
  },
};

// Tips for users
const getTips = {
  tags: (count: number): string | null => {
    if (count === 0) return 'Add tags to improve discoverability in search';
    if (count < 4)
      return `Add ${4 - count} more tag${4 - count > 1 ? 's' : ''} for optimal visibility (4-6 recommended)`;
    if (count > 6) return `Consider using ${count - 2}-${count - 1} tags for cleaner presentation`;
    return null;
  },
  title: (length: number): string | null => {
    if (length === 0) return 'Give your agent a clear, descriptive name';
    if (length < 10) return 'Make your title more descriptive for better search results';
    return null;
  },
  description: (length: number): string | null => {
    if (length === 0) return 'Describe what your agent does and who should use it';
    if (length < 50) return 'Add more details about features and benefits';
    return null;
  },
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


// ── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({
  listing,
  isAuthenticated,
  onBuy,
  onNegotiate,
}: {
  listing: MarketListing;
  isAuthenticated: boolean;
  onBuy: () => void;
  onNegotiate: (listing: MarketListing) => void;
}) {
  const isFree = listing.price === 0;
  const hasEndpoint = Boolean(listing.hasAgentEndpoint || listing.agentEndpoint);
  const negotiable =
    listing.minPrice != null &&
    listing.minPrice > 0 &&
    listing.minPrice < listing.price;
  const discount = negotiable
    ? Math.round((1 - (listing.minPrice ?? 0) / listing.price) * 100)
    : 0;
  return (
    <Link
      href={`/market/agents/${listing.id}`}
      className="mk-card mk-card--listing"
      aria-label={listing.title}
      onMouseEnter={() => api.prefetch([`/market/${listing.id}`])}
    >
      {/* Top row: title + seller + type badge */}
      <div className="mk-card__top">
        <div className="mk-card__icon">
          <Bot className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="mk-card__title-col">
          <h3 className="mk-card__title">{listing.title}</h3>
          <div className="mk-card__seller">
            <UserAvatar
              src={listing.seller.avatarUrl}
              name={listing.seller.username}
              userId={listing.seller.id}
              size={14}
            />
            <span>@{listing.seller.username || 'anon'}</span>
          </div>
        </div>
        <div className="mk-card__badges">
          {hasEndpoint && (
            <span className="mk-badge mk-badge--live" title="Responds to agent webhook">
              <span className="mk-badge__dot" />
              live
            </span>
          )}
          <SecurityBadge listingId={listing.id} />
          <span className="mk-badge mk-badge--type">
            {listing.type.toLowerCase().replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mk-card__desc">
        {listing.description || 'No description provided.'}
      </p>

      {/* Meta row: rating + tags */}
      <div className="mk-card__meta">
        {listing.reviewAverage !== null &&
          listing.reviewAverage !== undefined &&
          (listing.reviewCount ?? 0) > 0 && (
            <span className="mk-card__rating">
              <Star className="w-3 h-3 fill-current" />
              <span className="mk-num">{listing.reviewAverage.toFixed(1)}</span>
              <span className="mk-card__rating-count">
                ({listing.reviewCount})
              </span>
            </span>
          )}
        {listing.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="mk-chip">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: price + actions */}
      <div className="mk-card__foot">
        <div className="mk-card__price">
          {isFree ? (
            <span className="mk-price mk-price--free">Free</span>
          ) : (
            <span className="mk-price">
              <span className="mk-num">{listing.price}</span>
              <span className="mk-price__ccy">{listing.currency}</span>
            </span>
          )}
          {negotiable && (
            <span className="mk-card__neg">
              <Handshake className="w-3 h-3" strokeWidth={2} />
              Up to {discount}% off
            </span>
          )}
        </div>
        <div className="mk-card__actions">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!isAuthenticated) {
                window.location.href = '/auth';
                return;
              }
              onNegotiate(listing);
            }}
            className="mk-btn mk-btn--ghost mk-btn--sm"
          >
            <Bot className="w-3 h-3" strokeWidth={2} />
            Negotiate
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!isAuthenticated) {
                window.location.href = '/auth';
                return;
              }
              onBuy();
            }}
            className="mk-btn mk-btn--primary mk-btn--sm"
          >
            {isFree ? 'Get free' : 'Buy now'}
          </button>
        </div>
      </div>
    </Link>
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
    api
      .get<ApiKeyInfo[]>(`/market/${listing.id}/apikeys`)
      .then(setKeys)
      .catch(() => setError('Failed to load API keys'))
      .finally(() => setLoading(false));
  }, [listing.id]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const result = await api.post<{ key: string; label: string | null }>(
        `/market/${listing.id}/apikeys`,
        { label: newKeyLabel.trim() || undefined },
      );
      setRevealedKey(result.key);
      setNewKeyLabel('');
      // Refresh list (won't show raw key again)
      const updated = await api.get<ApiKeyInfo[]>(`/market/${listing.id}/apikeys`);
      setKeys(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate key');
    } finally {
      setGenerating(false);
    }
  };

  const revoke = async (keyId: string) => {
    setRevokingId(keyId);
    setError('');
    try {
      await api.delete(`/market/apikeys/${keyId}`);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      setConfirmRevokeId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to revoke key');
    } finally {
      setRevokingId(null);
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="mt-3 rounded-xl border"
      style={{ borderColor: 'rgba(131,110,249,0.15)', background: 'rgba(131,110,249,0.03)' }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: 'rgba(131,110,249,0.1)' }}
      >
        <Key className="w-3 h-3 text-bolty-400" />
        <span className="text-bolty-400 font-mono text-xs font-light">API Keys</span>
        <span className="text-zinc-600 font-mono text-xs ml-auto">{keys.length}/3</span>
      </div>

      {/* Revealed key banner */}
      {revealedKey && (
        <div
          className="mx-3 mt-3 rounded-lg p-3"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <p className="text-green-400 font-mono text-xs font-light mb-1">
            ✓ New key generated — save it now, it won&apos;t be shown again
          </p>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-green-300 font-mono text-xs flex-1 break-all">{revealedKey}</code>
            <button
              onClick={() => copyKey(revealedKey)}
              className="text-xs font-mono px-2 py-1 rounded shrink-0 transition-all"
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: copied ? '#4ade80' : '#86efac',
              }}
            >
              {copied ? '✓ copied' : <Copy className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setRevealedKey(null)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Key list */}
      <div className="px-3 pt-2 pb-1 space-y-2">
        {loading && <p className="text-zinc-600 font-mono text-xs py-1">loading...</p>}
        {!loading && keys.length === 0 && (
          <p className="text-zinc-600 font-mono text-xs py-1">no keys yet</p>
        )}
        {keys.map((k) => (
          <div
            key={k.id}
            className="flex items-center gap-2 py-1.5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-zinc-300 font-mono text-xs font-light">
                {k.label || 'unnamed key'}
              </p>
              <p className="text-zinc-600 font-mono text-xs">
                created {timeAgo(k.createdAt)}
                {k.lastUsedAt ? ` · last used ${timeAgo(k.lastUsedAt)}` : ' · never used'}
              </p>
            </div>
            {confirmRevokeId === k.id ? (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-zinc-500 font-mono text-xs">revoke?</span>
                <button
                  onClick={() => revoke(k.id)}
                  disabled={revokingId === k.id}
                  className="text-red-400 font-mono text-xs px-2 py-0.5 rounded disabled:opacity-40"
                  style={{
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.05)',
                  }}
                >
                  {revokingId === k.id ? '...' : 'yes'}
                </button>
                <button
                  onClick={() => setConfirmRevokeId(null)}
                  className="text-zinc-500 font-mono text-xs px-2 py-0.5 rounded"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  no
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRevokeId(k.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                title="Revoke key"
              >
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
            onChange={(e) => setNewKeyLabel(e.target.value)}
            placeholder="label (optional)"
            maxLength={40}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg font-mono"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e4e4e7',
              outline: 'none',
            }}
          />
          <button
            onClick={generate}
            disabled={generating}
            className="text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-40 transition-all"
            style={{
              background: 'rgba(131,110,249,0.15)',
              border: '1px solid rgba(131,110,249,0.3)',
              color: '#c4b5fd',
            }}
          >
            {generating ? (
              '...'
            ) : (
              <>
                <Plus className="w-3 h-3" /> generate
              </>
            )}
          </button>
        </div>
      )}
      {error && <p className="text-red-400 font-mono text-xs px-3 pb-2">{error}</p>}
    </div>
  );
}

// ── My Agent Card (publications) ──────────────────────────────────────────────

function MyAgentCard({
  listing,
  onDelete,
}: {
  listing: MarketListing;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
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
    <div
      className="rounded-xl border transition-colors"
      style={{
        borderColor: expanded ? 'rgba(131,110,249,0.25)' : 'rgba(255,255,255,0.07)',
        background: '#0a0a12',
      }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Type icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.2)' }}
        >
          <Bot className="w-4 h-4 text-bolty-400" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-light text-zinc-100 truncate">{listing.title}</h3>
            <Badge
              className={`rounded-full border border-dashed px-2 py-0 text-xs font-mono ${TYPE_COLORS[listing.type] || TYPE_COLORS.OTHER}`}
            >
              {listing.type.toLowerCase().replace('_', ' ')}
            </Badge>
            {listing.status === 'ACTIVE' ? (
              <Badge
                className="rounded-full px-2 py-0 text-[10px] font-mono"
                style={{
                  background: 'rgba(16,185,129,0.12)',
                  boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.35)',
                  color: '#6EE7B7',
                }}
              >
                <span className="inline-block h-1 w-1 rounded-full bg-emerald-400 mr-1 animate-pulse align-middle" />
                live
              </Badge>
            ) : listing.status === 'REMOVED' ? (
              <Badge
                className="rounded-full px-2 py-0 text-[10px] font-mono inline-flex items-center gap-1"
                style={{
                  background: 'rgba(244,63,94,0.12)',
                  boxShadow: 'inset 0 0 0 1px rgba(244,63,94,0.35)',
                  color: '#FDA4AF',
                }}
                title="Webhook failed health-checks. Fix your endpoint to reactivate."
              >
                <WifiOff className="w-2.5 h-2.5" />
                offline
              </Badge>
            ) : (
              <Badge
                className="rounded-full px-2 py-0 text-[10px] font-mono"
                style={{
                  background: 'rgba(251,191,36,0.12)',
                  boxShadow: 'inset 0 0 0 1px rgba(251,191,36,0.35)',
                  color: '#FCD34D',
                }}
              >
                {listing.status.toLowerCase().replace('_', ' ')}
              </Badge>
            )}
            {listing.agentEndpoint && (
              <Badge className="rounded-full bg-bolty-500/15 border border-bolty-500/25 px-2 py-0 text-xs font-mono text-bolty-400">
                AI endpoint
              </Badge>
            )}
            {listing.fileKey && (
              <Badge className="rounded-full bg-zinc-800/60 border border-white/08 px-2 py-0 text-xs font-mono text-zinc-500">
                file uploaded
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            <span className="font-mono font-light text-bolty-300">
              {listing.price} {listing.currency}
            </span>
            {listing.minPrice != null && (
              <span className="text-zinc-600"> · floor: {listing.minPrice}</span>
            )}
            <span className="text-zinc-700"> · {timeAgo(listing.createdAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/market/agents/${listing.id}`}
            className="text-xs font-mono px-2.5 py-1.5 rounded-lg text-zinc-500 border border-dashed border-zinc-700/40 hover:text-zinc-300 hover:border-zinc-600/60 transition-all"
          >
            view
          </Link>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-xs font-mono px-2.5 py-1.5 rounded-lg transition-all"
            style={{
              background: expanded ? 'rgba(131,110,249,0.15)' : 'transparent',
              border: `1px solid ${expanded ? 'rgba(131,110,249,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: expanded ? '#c4b5fd' : '#71717a',
            }}
          >
            {expanded ? 'collapse' : 'manage'}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-mono px-2 py-1.5 rounded-lg text-red-400 disabled:opacity-40 transition-all"
                style={{
                  border: '1px solid rgba(239,68,68,0.35)',
                  background: 'rgba(239,68,68,0.08)',
                }}
              >
                {deleting ? '...' : 'confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs font-mono px-2 py-1.5 rounded-lg text-zinc-500 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/5 transition-all"
              title="Delete listing"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {deleteError && <p className="text-red-400 font-mono text-xs px-3 pb-2">{deleteError}</p>}
      {expanded && (
        <div className="px-3 pb-3">
          <ApiKeyManager listing={listing} />
        </div>
      )}
    </div>
  );
}

// ── Create Listing Form ────────────────────────────────────────────────────────


// ── SaaS chrome ────────────────────────────────────────────────────────────────


const AGENT_SNIPPETS: Record<'curl' | 'node' | 'python', string> = {
  curl: `curl -X POST https://api.bolty.dev/v1/agents/invoke \\
  -H "Authorization: Bearer $BOLTY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "agt_...",
    "input": { "task": "summarize", "url": "https://..." }
  }'`,
  node: `import { Bolty } from "@bolty/sdk";

const bolty = new Bolty({ apiKey: process.env.BOLTY_API_KEY });

const run = await bolty.agents.invoke({
  agentId: "agt_...",
  input: { task: "summarize", url: "https://..." },
});

console.log(run.output);`,
  python: `from bolty import Bolty

bolty = Bolty(api_key=os.environ["BOLTY_API_KEY"])

run = bolty.agents.invoke(
    agent_id="agt_...",
    input={"task": "summarize", "url": "https://..."},
)

print(run.output)`,
};


// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#000' }} />}>
      <AgentsPageContent />
    </Suspense>
  );
}

type SortKey = 'recent' | 'price-low' | 'price-high' | 'rating';

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
  const [negotiateTarget, setNegotiateTarget] = useState<MarketListing | null>(null);
  const [negotiateStarting, setNegotiateStarting] = useState(false);
  // Hydrate filters from the URL so deep-links and back-nav keep state.
  const [type, setType] = useState<string>(
    searchParams.get('type') ?? 'ALL',
  );
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  // Debounced mirror — only this value hits the API so typing doesn't
  // fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get('sort') as SortKey) ?? 'recent',
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [error, setError] = useState('');
  const [mobileBlock, setMobileBlock] = useState(false);

  // ── Direct buy state ──────────────────────────────────────────────────────
  const { pickWallet, pickerElement: buyWalletPicker } = useWalletPicker();
  const [buyingListing, setBuyingListing] = useState<MarketListing | null>(null);
  const [buyConsentData, setBuyConsentData] = useState<{
    sellerWallet: string;
    buyerAddress: string;
    sellerWei: bigint;
    platformWei: bigint;
    totalWei: bigint;
    amountWei: string;
    totalUsd: number;
  } | null>(null);
  const [buyPaying, setBuyPaying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [buySuccess, setBuySuccess] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);

  // Mobile gate for the 6-step deploy wizard — the UI was designed for
  // desktop only (sandbox testing, file picker, long forms). Detect via
  // viewport width so tablets in landscape keep working.
  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  };

  const attemptDeploy = () => {
    router.push('/market/agents/publish');
  };

  // Sync tab to URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'mine') setActiveTab('mine');
    else setActiveTab('market');
  }, [searchParams]);

  // Open deploy form when other pages redirect with ?new=1. The
  // /publish page is mobile-friendly so no more auto-triggered
  // mobile-block modal for anyone who lands here via a deep link.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (searchParams.get('new') === '1') {
      router.replace('/market/agents/publish');
    }
  }, [searchParams, isAuthenticated, router]);

  // Open negotiation modal when a deep link lands here with
  // ?negotiate=<listingId> — legacy deep-link. The flow now lives at
  // /negotiations/<id>, so if we arrive with just the listing id we
  // start a negotiation and redirect; if we have the negotiation id
  // directly we route straight there.
  useEffect(() => {
    const negotiateId = searchParams.get('negotiate');
    const negIdParam = searchParams.get('negId');
    const asAgentParam = searchParams.get('asAgent');
    if (!negotiateId || !isAuthenticated) return;
    if (negIdParam) {
      router.replace(`/negotiations/${negIdParam}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.post<{ id: string }>(
          `/market/${negotiateId}/negotiate`,
          asAgentParam ? { buyerAgentListingId: asAgentParam } : {},
        );
        if (!cancelled && res?.id) router.replace(`/negotiations/${res.id}`);
      } catch {
        /* listing missing or negotiation failed — stay on the list */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, isAuthenticated, router]);

  // Debounce the search input → hitting the API per keystroke is wasteful.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Keep the URL in sync with the active filters so deep-links, back
  // nav, and tab restore all work. Only on the market tab — `mine`
  // doesn't filter.
  useEffect(() => {
    if (activeTab !== 'market') return;
    const params = new URLSearchParams();
    if (type !== 'ALL') params.set('type', type);
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (sort !== 'recent') params.set('sort', sort);
    const qs = params.toString();
    router.replace(qs ? `/market/agents?${qs}` : '/market/agents', { scroll: false });
  }, [type, debouncedSearch, sort, activeTab, router]);

  const fetchListings = useCallback(async () => {
    const params = new URLSearchParams();
    if (type !== 'ALL') params.set('type', type);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sort) params.set('sortBy', sort);
    const cacheKey = `market:agents:${params.toString()}`;
    // Stale-while-revalidate: seed from cache so the grid paints
    // instantly on back-nav, then refetch in the background.
    const cached = getCachedWithStatus<MarketListing[]>(cacheKey);
    if (cached.data) {
      setListings(cached.data);
      setLoading(false);
      if (cached.fresh) return; // skip refetch; data is < 30s old
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const data = await api.get<{ data: MarketListing[] } | MarketListing[]>(
        `/market?${params}`,
      );
      // Tolerate both shapes: legacy {data: []} envelope and the raw
      // array we sometimes get back.
      const rows = Array.isArray(data) ? data : (data?.data ?? []);
      setListings(rows);
      setCachedEntry(cacheKey, rows);
    } catch (err) {
      // 401 → session expired, bounce to login and preserve the URL
      // so they come back here after auth.
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/auth/login?redirect=${encodeURIComponent('/market/agents')}`);
        return;
      }
      // If we had cached data leave it on screen; only flash the empty
      // state + error when we have nothing to show.
      if (!cached.data) {
        const msg =
          err instanceof ApiError
            ? `Couldn't load listings: ${err.message}`
            : 'Network error — check your connection and try again.';
        setError(msg);
        setListings([]);
      }
    } finally {
      setLoading(false);
    }
  }, [type, debouncedSearch, sort, router]);

  const fetchMyListings = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setMyLoading(true);
    try {
      const data = await api.get<{ data: MarketListing[] }>('/market/my-listings');
      setMyListings(data.data);
    } catch {
      setError('Failed to load your listings');
    } finally {
      setMyLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (activeTab === 'mine' && isAuthenticated) fetchMyListings();
  }, [activeTab, fetchMyListings, isAuthenticated]);

  // Stable, pre-computed stats for the hero — recompute only when
  // the listings array itself changes (not on every keystroke).
  const stats = useMemo(() => {
    const total = listings.length;
    const aiNative = listings.filter((l) => l.type === 'AI_AGENT').length;
    const negotiable = listings.filter((l) => l.minPrice != null && l.minPrice > 0).length;
    return { total, aiNative, negotiable };
  }, [listings]);

  // Optional client-side sort — falls back when the server doesn't
  // honour `sortBy`. Keeps the UX consistent across backends.
  const sortedListings = useMemo(() => {
    const rows = [...listings];
    switch (sort) {
      case 'price-low':
        rows.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        rows.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        rows.sort((a, b) => (b.reviewAverage ?? 0) - (a.reviewAverage ?? 0));
        break;
      default:
        rows.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
    return rows;
  }, [listings, sort]);

  const switchTab = (tab: 'market' | 'mine') => {
    setActiveTab(tab);
    router.push(tab === 'mine' ? '/market/agents?tab=mine' : '/market/agents', { scroll: false });
  };

  const handleBuy = async (listing: MarketListing) => {
    setBuyingListing(listing);
    setBuyError('');
    setBuySuccess(false);
    // Free listings — claim directly, no payment needed
    if (listing.price === 0) {
      setBuyPaying(true);
      try {
        await api.post(`/market/${listing.id}/claim-free`, {});
        setBuySuccess(true);
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : (err as Error)?.message || 'Claim failed';
        setBuyError(msg);
      } finally {
        setBuyPaying(false);
      }
      return;
    }
    // Paid listings — fetch seller wallet, compute amounts, open wallet picker
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
      const totalUsd = listing.price * ethPrice;
      const sellerWei = (totalWei * BigInt(975)) / BigInt(1000);
      const platformWei = totalWei - sellerWei;
      const buyerAddress = await pickWallet();
      setBuyConsentData({ sellerWallet, buyerAddress, sellerWei, platformWei, totalWei, amountWei: totalWei.toString(), totalUsd });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || String(err);
      setBuyError(msg.includes('rejected') ? 'Payment cancelled' : 'Failed: ' + msg.slice(0, 80));
    } finally {
      setBuyPaying(false);
    }
  };

  const executeBuy = async (signature: string, consentMessage: string, paymentMethod: 'ETH' | 'BOLTY' = 'ETH') => {
    if (!buyConsentData || !buyingListing) return;
    const { sellerWallet, buyerAddress, totalWei, amountWei } = buyConsentData;
    // Re-derive split based on the payment method the user chose (7% ETH, 3% BOLTY)
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
        await api.post(`/market/${buyingListing.id}/purchase`, { txHash, amountWei, consentSignature: signature, consentMessage, escrowContract: getEscrowAddress() });
      } else {
        const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
        const txHash = (await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: buyerAddress, to: sellerWallet, value: '0x' + sellerWei.toString(16) }] })) as string;
        let platformFeeTxHash: string | undefined;
        if (platformWallet) {
          platformFeeTxHash = (await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: buyerAddress, to: platformWallet, value: '0x' + platformWei.toString(16) }] })) as string;
        }
        await api.post(`/market/${buyingListing.id}/purchase`, { txHash, amountWei, platformFeeTxHash, consentSignature: signature, consentMessage });
      }
      setBuySuccess(true);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || String(err);
      setBuyError(
        msg.includes('rejected') ? 'Payment cancelled'
          : err instanceof ApiError ? err.message
          : 'Payment failed: ' + msg.slice(0, 80),
      );
    }
  };

  return (
    <div className="mk-agents-page mk-app-page">
      {/* Header row — compact, flat, product-feel */}
      <div className="mk-hero">
        <div className="mk-hero__crumbs">
          <Link href="/market" className="mk-hero__crumb-link">
            Market
          </Link>
          <span className="mk-hero__crumb-sep">/</span>
          <span>Agents</span>
        </div>
        <div className="mk-hero__row">
          <div>
            <h1 className="mk-hero__title">Agents</h1>
            <p className="mk-hero__sub">
              Deploy, buy, and negotiate with autonomous AI agents. Every listing is health-checked.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/boltyguard"
              className="mk-btn mk-btn--secondary"
              title="Scan any code with BoltyGuard"
            >
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
              BoltyGuard
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={attemptDeploy}
                className="mk-btn mk-btn--primary"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Deploy agent
              </button>
            )}
          </div>
        </div>

        {/* Stat strip — compact pills, tabular numbers */}
        <div className="mk-stats">
          <div className="mk-stat">
            <div className="mk-stat__label">Live agents</div>
            <div className="mk-stat__value">
              <span className="mk-stat__dot mk-stat__dot--live" />
              {stats.total}
            </div>
          </div>
          <div className="mk-stat">
            <div className="mk-stat__label">AI-native</div>
            <div className="mk-stat__value">{stats.aiNative}</div>
          </div>
          <div className="mk-stat">
            <div className="mk-stat__label">Open to negotiate</div>
            <div className="mk-stat__value">{stats.negotiable}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mk-tabs">
        {(
          [
            ['market', 'Marketplace'],
            ['mine', 'My agents'],
          ] as const
        ).map(([id, label]) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`mk-tab ${active ? 'mk-tab--active' : ''}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Marketplace tab ── */}
      {activeTab === 'market' && (
        <>
          {/* Filter bar — flat, segmented */}
          <div className="mk-toolbar">
            <div className="mk-search">
              <Search className="mk-search__icon" strokeWidth={2} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search agents"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mk-search__input"
              />
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="mk-search__clear"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              ) : (
                <kbd className="mk-search__kbd">/</kbd>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="mk-btn mk-btn--ghost mk-only-mobile"
            >
              Filters
              <ChevronDown className="w-3 h-3" strokeWidth={2} />
            </button>

            <div className="mk-seg mk-only-desktop">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`mk-seg__item ${type === t ? 'mk-seg__item--active' : ''}`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="mk-select">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort"
              >
                <option value="recent">Newest</option>
                <option value="price-low">Price ↑</option>
                <option value="price-high">Price ↓</option>
                <option value="rating">Top rated</option>
              </select>
              <ChevronDown className="mk-select__caret" strokeWidth={2} />
            </div>
          </div>
          {error && (
            <div
              className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: 'rgba(244,63,94,0.10)',
                boxShadow: 'inset 0 0 0 1px rgba(244,63,94,0.3)',
                color: '#FDA4AF',
              }}
            >
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500/30 text-[10px] font-mono">!</span>
              <span className="flex-1 font-light">{error}</span>
              <button
                onClick={() => fetchListings()}
                className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] text-rose-100 transition hover:bg-rose-500/30"
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="relative h-52 rounded-2xl overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.5) 0%, rgba(10,10,14,0.5) 100%)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="absolute inset-0 animate-shimmer"
                    style={{
                      background:
                        'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="mk-empty-app">
              <div className="mk-empty-app__icon">
                <Bot className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="mk-empty-app__title">No agents found</div>
              <div className="mk-empty-app__sub">
                Try adjusting your filters, or deploy the first one.
              </div>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={attemptDeploy}
                  className="mk-btn mk-btn--primary"
                  style={{ marginTop: 16 }}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  Deploy an agent
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedListings.map((l, idx) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(idx * 0.035, 0.4),
                    duration: 0.32,
                    ease: [0.22, 0.61, 0.36, 1],
                  }}
                  whileHover={{ y: -2 }}
                >
                  <AgentCard
                    listing={l}
                    isAuthenticated={isAuthenticated}
                    onBuy={() => handleBuy(l)}
                    onNegotiate={(listing) => setNegotiateTarget(listing)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── My Publications tab ── */}
      {activeTab === 'mine' && (
        <>
          {!isAuthenticated ? (
            <div className="mk-empty">
              <p className="mk-empty__text">Sign in to manage your agents</p>
              <Link href="/auth" className="mk-wizard__primary inline-flex mt-3 max-w-fit">
                Sign in
              </Link>
            </div>
          ) : (
            <div>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12.5px] text-zinc-500">
                    {myListings.length} agent{myListings.length !== 1 ? 's' : ''} published
                  </p>
                  <button
                    type="button"
                    onClick={attemptDeploy}
                    className="mk-wizard__primary"
                    style={{ flex: '0 0 auto', height: 32, padding: '0 12px', fontSize: 12 }}
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Deploy new
                  </button>
                </div>

                {myLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="skeleton h-20 rounded-xl" />
                    ))}
                  </div>
                ) : myListings.length === 0 ? (
                  <div className="mk-empty">
                    <Bot className="w-8 h-8 text-zinc-700 mx-auto mb-3" strokeWidth={1.25} />
                    <p className="mk-empty__text">No agents deployed yet</p>
                    <button
                      type="button"
                      onClick={attemptDeploy}
                      className="mk-wizard__primary inline-flex mt-3 max-w-fit"
                      style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Deploy your first agent
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myListings.map((l) => (
                      <MyAgentCard
                        key={l.id}
                        listing={l}
                        onDelete={(id) => setMyListings((p) => p.filter((x) => x.id !== id))}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {/* Direct buy — wallet picker injected by useWalletPicker */}
      {buyWalletPicker}

      {/* Loading overlay while fetching seller data */}
      {buyPaying && !buyConsentData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-[#836EF9] animate-spin" />
        </div>
      )}

      {/* Payment consent modal for direct buy */}
      {buyConsentData && buyingListing && (
        <PaymentConsentModal
          listingTitle={buyingListing.title}
          sellerAddress={buyConsentData.sellerWallet}
          sellerAmountETH={(Number(buyConsentData.sellerWei) / 1e18).toFixed(6)}
          platformFeeETH={(Number(buyConsentData.platformWei) / 1e18).toFixed(6)}
          totalETH={(Number(buyConsentData.totalWei) / 1e18).toFixed(6)}
          totalUsd={buyConsentData.totalUsd.toFixed(2)}
          buyerAddress={buyConsentData.buyerAddress}
          onConsent={executeBuy}
          onCancel={() => { setBuyConsentData(null); setBuyingListing(null); }}
        />
      )}

      {/* Buy error overlay */}
      {buyError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(20,20,26,0.95), rgba(10,10,14,0.95))', boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.5)' }}>
            <p className="text-red-400 text-sm mb-4">{buyError}</p>
            <button type="button" onClick={() => { setBuyError(''); setBuyingListing(null); }} className="px-4 py-2 rounded-md text-[12.5px] text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Buy success overlay */}
      {buySuccess && buyingListing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-xl p-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(20,20,26,0.95), rgba(10,10,14,0.95))', boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.5)' }}>
            <div className="mx-auto w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(131,110,249,0.15)', boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4)' }}>
              <ShoppingBag className="w-5 h-5 text-[#b4a7ff]" />
            </div>
            <h3 className="text-base font-light text-white mb-2">
              {buyingListing.price === 0 ? 'Claimed!' : 'Payment sent!'}
            </h3>
            <p className="text-[12.5px] text-zinc-400 font-light leading-relaxed mb-5">
              <span className="text-white">{buyingListing.title}</span> has been added to your orders.
            </p>
            <div className="flex gap-2 justify-center">
              <Link
                href="/orders"
                className="px-4 py-2 rounded-md text-[12.5px] text-white"
                style={{ background: 'linear-gradient(180deg, rgba(131,110,249,0.38), rgba(131,110,249,0.14))', boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.48)' }}
              >
                View Orders
              </Link>
              <button type="button" onClick={() => { setBuySuccess(false); setBuyingListing(null); }} className="px-4 py-2 rounded-md text-[12.5px] text-zinc-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {mobileBlock && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileBlock(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 text-center"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.95), rgba(10,10,14,0.95))',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="mx-auto w-11 h-11 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: 'rgba(131,110,249,0.15)',
                boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4)',
              }}
            >
              <Plus className="w-5 h-5 text-[#b4a7ff]" />
            </div>
            <h3 className="text-base font-light text-white mb-2">
              Deploy from desktop
            </h3>
            <p className="text-[12.5px] text-zinc-400 font-light leading-relaxed mb-5">
              The agent deploy wizard needs a wider screen for sandbox testing,
              file uploads and the review step. Open Bolty on a desktop or
              laptop to deploy your agent.
            </p>
            <button
              type="button"
              onClick={() => setMobileBlock(false)}
              className="px-4 py-2 rounded-md text-[12.5px] text-white"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.38), rgba(131,110,249,0.14))',
                boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.48)',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileFilterOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 pb-8"
            style={{
              background:
                'linear-gradient(180deg, rgba(24,22,38,0.98) 0%, rgba(10,10,14,0.98) 100%)',
              boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-white font-normal">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-zinc-500 hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/40 mb-2">
                Type
              </p>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => {
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="text-xs px-3 py-1.5 rounded-lg transition"
                      style={{
                        background: active
                          ? 'linear-gradient(180deg, rgba(131,110,249,0.22), rgba(131,110,249,0.06))'
                          : 'rgba(255,255,255,0.04)',
                        boxShadow: active
                          ? 'inset 0 0 0 1px rgba(131,110,249,0.5)'
                          : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                        color: active ? '#C9BEFF' : '#a1a1aa',
                      }}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/40 mb-2">
                Sort
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                }}
              >
                <option value="recent">Newest first</option>
                <option value="price-low">Price · low to high</option>
                <option value="price-high">Price · high to low</option>
                <option value="rating">Highest rated</option>
              </select>
            </div>
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full rounded-xl bg-gradient-to-r from-[#836EF9] to-[#6B4FE8] py-2.5 text-sm text-white"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Agent picker — opens when a buyer hits Negotiate on a card */}
      {negotiateTarget && (
        <AgentPickerModal
          listingTitle={negotiateTarget.title}
          listingPrice={negotiateTarget.price}
          listingCurrency={negotiateTarget.currency}
          onCancel={() => setNegotiateTarget(null)}
          onConfirm={async (agentId) => {
            if (!negotiateTarget || negotiateStarting) return;
            setNegotiateStarting(true);
            try {
              const res = await api.post<{ id: string }>(
                `/market/${negotiateTarget.id}/negotiate`,
                agentId ? { buyerAgentListingId: agentId } : {},
              );
              if (res?.id) {
                router.push(`/negotiations/${res.id}`);
              }
            } catch (err) {
              alert(err instanceof ApiError ? err.message : 'Failed to start negotiation');
            } finally {
              setNegotiateStarting(false);
              setNegotiateTarget(null);
            }
          }}
        />
      )}
    </div>
  );
}
