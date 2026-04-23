'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import {
  Bot,
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
import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { AgentPickerModal } from '@/components/negotiation/AgentPickerModal';
import { Badge } from '@/components/ui/badge';
import { GradientText } from '@/components/ui/GradientText';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { api, ApiError, API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
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
  ALL: 'all',
  AI_AGENT: 'ai agent',
  BOT: 'bot',
  SCRIPT: 'script',
  OTHER: 'other',
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

interface HelpLabelProps {
  label: string;
  help?: string;
  required?: boolean;
}

function HelpLabel({ label, help, required }: HelpLabelProps) {
  const [showHelp, setShowHelp] = React.useState(false);
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-light text-zinc-400">
          {label} {required && '*'}
        </label>
        {help && (
          <div className="relative group cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-500" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300 whitespace-nowrap z-10">
              {help}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TipProps {
  message: string | null;
  variant?: 'info' | 'success' | 'warning';
}

function Tip({ message, variant = 'info' }: TipProps) {
  if (!message) return null;
  const colorMap = {
    info: 'text-bolty-300',
    success: 'text-green-300',
    warning: 'text-yellow-300',
  };
  return <p className={`text-xs font-light mt-2 ${colorMap[variant]}`}>💡 {message}</p>;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language = 'json' }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-lg overflow-hidden border"
      style={{ borderColor: 'rgba(255,255,255,0.1)' }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 text-xs"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <span className="text-zinc-600 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <Copy className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre
        className="overflow-x-auto p-3 text-xs font-mono text-zinc-300"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Negotiation Modal ──────────────────────────────────────────────────────────

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function NegotiationModal({
  listing,
  onClose,
  userId,
  initialNegotiationId,
  buyerAgentListingId,
}: {
  listing: MarketListing;
  onClose: () => void;
  userId: string;
  /** When set (seller opening via notification or deep-link), GET the
   *  existing negotiation by id instead of POSTing a new one — sellers
   *  can't POST /negotiate on their own listing (403). */
  initialNegotiationId?: string | null;
  /** Buyer-side agent delegation. Persisted on the negotiation row so
   *  the AI loop calls this agent instead of the buyer's profile-level
   *  endpoint for every buyer turn. */
  buyerAgentListingId?: string | null;
}) {
  const [neg, setNeg] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMsg, setCounterMsg] = useState('');
  const [countering, setCountering] = useState(false);
  const [error, setError] = useState('');
  const { pickWallet, pickerElement: walletPicker } = useWalletPicker();
  const [agentTyping, setAgentTyping] = useState<'buyer_agent' | 'seller_agent' | null>(null);
  const [switchPending, setSwitchPending] = useState<{ requestedBy: string } | null>(null);
  const [requestingSwitch, setRequestingSwitch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
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

  // Start negotiation + setup WebSocket. If we were opened from a
  // notification or deep link we load the exact negotiation by id
  // (sellers can't POST /negotiate on their own listing).
  useEffect(() => {
    const loader = initialNegotiationId
      ? api.get<Negotiation>(`/market/negotiations/${initialNegotiationId}`)
      : api.post<Negotiation>(
          `/market/${listing.id}/negotiate`,
          buyerAgentListingId ? { buyerAgentListingId } : {},
        );
    // Polling fallback — if the socket misses the first few emits (e.g.
    // connect race or transient drop) we still catch up by refetching
    // the negotiation every 3 seconds while it's ACTIVE. The socket
    // listener is the primary, this is defence in depth.
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    loader
      .then((n) => {
        setNeg(n);
        // Tell NegotiationPopToast which negotiation this viewport is
        // currently showing so it can suppress duplicate top-left toasts
        // for events that are already visible in the chat.
        if (typeof document !== 'undefined') {
          document.body.setAttribute('data-neg-open', n.id);
        }
        // 10s fallback — WebSocket is the primary delivery mechanism;
        // this only catches messages lost during a transient connect race.
        pollTimer = setInterval(async () => {
          try {
            const fresh = await api.get<Negotiation>(`/market/negotiations/${n.id}`);
            setNeg((prev) => {
              if (!prev) return fresh;
              // Merge: keep any local optimistic state; overwrite messages
              // and status from server.
              return { ...prev, ...fresh, messages: fresh.messages };
            });
            if (fresh.status !== 'ACTIVE' && pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
          } catch {
            /* ignore — socket will catch up */
          }
        }, 10_000);
        // Connect WebSocket once we have the negotiation id
        const socket = io(`${SOCKET_URL}/negotiations`, {
          withCredentials: true,
          transports: ['websocket'],
          timeout: 8000,
          reconnectionAttempts: 5,
          reconnectionDelay: 500,
          reconnectionDelayMax: 3000,
        });
        socketRef.current = socket;
        socket.emit('join:negotiation', n.id);

        socket.on('negotiation:message', (msg: NegotiationMessage) => {
          setAgentTyping(null);
          setNeg((prev) =>
            prev
              ? { ...prev, messages: [...prev.messages.filter((m) => m.id !== msg.id), msg] }
              : prev,
          );
        });

        socket.on('negotiation:status', (data: { status: string; agreedPrice?: number | null }) => {
          setNeg((prev) =>
            prev
              ? {
                  ...prev,
                  status: data.status as Negotiation['status'],
                  agreedPrice: data.agreedPrice ?? prev.agreedPrice,
                }
              : prev,
          );
        });

        socket.on(
          'negotiation:agent-typing',
          ({ role }: { role: 'buyer_agent' | 'seller_agent' }) => {
            setAgentTyping(role);
            // Auto-clear after 5s as safety net
            setTimeout(() => setAgentTyping(null), 5000);
          },
        );

        socket.on(
          'negotiation:error',
          ({ stage, message }: { stage: string; message: string }) => {
            setAgentTyping(null);
            setNeg((prev) =>
              prev
                ? {
                    ...prev,
                    messages: [
                      ...prev.messages,
                      {
                        id: `err-${Date.now()}`,
                        fromRole: 'system',
                        content: `Agent ${stage.replace('_', ' ')} failed: ${message}. Try switching to human mode.`,
                        proposedPrice: null,
                        createdAt: new Date().toISOString(),
                      } as NegotiationMessage,
                    ],
                  }
                : prev,
            );
          },
        );

        socket.on(
          'negotiation:human-switch-request',
          ({ requestedByUserId }: { requestedByUserId: string }) => {
            setSwitchPending({ requestedBy: requestedByUserId });
          },
        );

        socket.on('negotiation:human-switch-activated', () => {
          setSwitchPending(null);
          setNeg((prev) =>
            prev ? { ...prev, mode: 'HUMAN', humanSwitchRequestedBy: null } : prev,
          );
        });
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to start negotiation'),
      )
      .finally(() => setLoading(false));

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      socketRef.current?.disconnect();
      socketRef.current = null;
      if (typeof document !== 'undefined') {
        document.body.removeAttribute('data-neg-open');
      }
    };
  }, [listing.id, initialNegotiationId, buyerAgentListingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [neg?.messages.length, agentTyping]);

  const submitCounter = async () => {
    if (!neg) return;
    const price = parseFloat(counterPrice);
    if (!price || price <= 0) {
      setError('Enter a valid counter price');
      return;
    }
    setCountering(true);
    setError('');
    try {
      const updated = await api.post<Negotiation>(
        `/market/negotiations/${neg.id}/counter`,
        {
          proposedPrice: price,
          content: counterMsg.trim() || undefined,
        },
      );
      setNeg(updated);
      setShowCounter(false);
      setCounterMsg('');
      setCounterPrice('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Counter failed');
    } finally {
      setCountering(false);
    }
  };

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
      setError(err instanceof ApiError ? err.message : 'Failed to send');
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

  const requestHumanSwitch = async () => {
    if (!neg) return;
    setRequestingSwitch(true);
    setError('');
    try {
      await api.post(`/market/negotiations/${neg.id}/request-human`, {});
      setNeg((prev) => (prev ? { ...prev, humanSwitchRequestedBy: userId } : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to request switch');
    } finally {
      setRequestingSwitch(false);
    }
  };

  const acceptHumanSwitch = async () => {
    if (!neg) return;
    setRequestingSwitch(true);
    setError('');
    try {
      await api.post(`/market/negotiations/${neg.id}/accept-human`, {});
      setSwitchPending(null);
      setNeg((prev) => (prev ? { ...prev, mode: 'HUMAN', humanSwitchRequestedBy: null } : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to accept switch');
    } finally {
      setRequestingSwitch(false);
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
        // eslint-disable-next-line no-empty
      }
      const totalWei = BigInt(Math.ceil(neg.agreedPrice * 1e18));
      const totalUsd = neg.agreedPrice * ethPrice;
      const sellerWei = (totalWei * BigInt(975)) / BigInt(1000);
      const platformWei = totalWei - sellerWei;
      const buyerAddress = await pickWallet();
      setConsentData({
        sellerWallet,
        buyerAddress,
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
    const {
      sellerWallet,
      buyerAddress,
      sellerWei,
      platformWei,
      negotiationId,
      amountWei,
      totalWei,
    } = consentData;
    setConsentData(null);
    const ethereum = getMetaMaskProvider();
    if (!ethereum) {
      setError('MetaMask not found');
      return;
    }

    try {
      if (isEscrowEnabled()) {
        // ── Escrow mode: single deposit to escrow contract ──
        const txHash = await escrowDeposit(negotiationId, sellerWallet, totalWei);
        await api.post(`/market/${listing.id}/purchase`, {
          txHash,
          amountWei,
          negotiationId,
          consentSignature: signature,
          consentMessage,
          escrowContract: getEscrowAddress(),
        });
      } else {
        // ── Legacy mode: direct payment to seller + platform fee ──
        const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
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
      }
      setPaid(true);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(
        msg.includes('rejected')
          ? 'Payment cancelled'
          : err instanceof ApiError
            ? err.message
            : 'Payment failed: ' + msg.slice(0, 80),
      );
    }
  };

  const isSeller = neg?.listing?.sellerId === userId;
  const isAiMode = neg?.mode === 'AI_AI';
  const iHaveRequestedSwitch = neg?.humanSwitchRequestedBy === userId;
  const otherRequestedSwitch = switchPending && switchPending.requestedBy !== userId;

  const statusPill: { label: string; color: string } = (() => {
    const s = neg?.status;
    if (s === 'AGREED') return { label: 'Deal reached', color: '#22c55e' };
    if (s === 'REJECTED') return { label: 'Rejected', color: '#ef4444' };
    if (s === 'EXPIRED') return { label: 'Expired', color: '#f59e0b' };
    return { label: 'Negotiating', color: '#836ef9' };
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(14px)' }}
    >
      <div
        className="w-full max-w-xl flex flex-col overflow-hidden relative"
        style={{
          height: 'min(90vh, 680px)',
          minHeight: 520,
          background: 'linear-gradient(180deg, rgba(20,20,28,0.96) 0%, rgba(10,10,16,0.96) 100%)',
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px -10px rgba(131,110,249,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
          borderRadius: 22,
        }}
      >
        {/* Gradient corner glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-8 -left-8 w-40 h-40 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(131,110,249,0.25) 0%, transparent 70%)',
            filter: 'blur(14px)',
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-10 w-48 h-48 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
            filter: 'blur(16px)',
          }}
        />

        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0 relative"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(131,110,249,0.3), rgba(6,182,212,0.25))',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            <Zap className="w-5 h-5 text-white" strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[13.5px] text-white font-light truncate tracking-[-0.005em]">
                {listing.title}
              </p>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-[0.12em]"
                style={{
                  color: statusPill.color,
                  background: `${statusPill.color}1a`,
                  boxShadow: `inset 0 0 0 1px ${statusPill.color}55`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: statusPill.color,
                    boxShadow: `0 0 6px ${statusPill.color}`,
                  }}
                />
                {statusPill.label}
              </span>
            </div>
            {neg?.status === 'ACTIVE' && (
              <p className="text-[11px] text-zinc-500 font-light mt-0.5">
                AI agents negotiating live · you can chime in anytime
              </p>
            )}
            {listing.minPrice != null && (
              <p className="text-[11px] text-zinc-500 font-light mt-0.5">
                Seller floor · {listing.minPrice} {listing.currency}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0 relative z-10">
          {loading && (
            <div className="text-center py-12">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-800 border-t-[#836ef9] animate-spin mx-auto mb-3" />
              <p className="text-zinc-400 text-xs font-light">Opening the negotiation…</p>
            </div>
          )}

          {!loading && neg && neg.messages.length === 0 && neg.status === 'ACTIVE' && (
            <div
              className="flex flex-col items-center justify-center text-center py-10"
            >
              <div className="flex gap-1 mb-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#b4a7ff] animate-bounce"
                    style={{ animationDelay: `${i * 0.14}s` }}
                  />
                ))}
              </div>
              <p className="text-[13px] text-white font-light">Agents are connecting…</p>
              <p className="text-[11.5px] text-zinc-500 font-light mt-1">
                First message lands in a moment.
              </p>
            </div>
          )}

          {neg?.messages.map((msg) => {
            const myRole = isSeller ? 'seller' : 'buyer';
            const isMine = msg.fromRole === myRole;
            const isAgent = msg.fromRole === 'seller_agent' || msg.fromRole === 'buyer_agent';
            const isMyAgent =
              (isSeller && msg.fromRole === 'seller_agent') ||
              (!isSeller && msg.fromRole === 'buyer_agent');
            const alignRight = isMine || isMyAgent;
            const bubbleLabel = isMine
              ? 'You'
              : isMyAgent
                ? 'Your agent'
                : isAgent
                  ? 'Agent'
                  : 'Counterparty';
            const bubbleAccent = alignRight ? '#836ef9' : '#06B6D4';
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${alignRight ? 'justify-end' : 'justify-start'}`}
                style={{ animation: 'negMsgIn 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both' }}
              >
                {!alignRight && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: `${bubbleAccent}1f`,
                      boxShadow: `inset 0 0 0 1px ${bubbleAccent}55`,
                    }}
                  >
                    <Zap className="w-3.5 h-3.5" style={{ color: bubbleAccent }} strokeWidth={2} />
                  </div>
                )}
                <div className="max-w-[78%]">
                  <p
                    className="text-[10px] font-light text-zinc-500 mb-1 px-1"
                    style={{ textAlign: alignRight ? 'right' : 'left' }}
                  >
                    {bubbleLabel}
                  </p>
                  <div
                    className="px-3.5 py-2.5 text-[13px] leading-[1.45] text-white"
                    style={{
                      background: alignRight
                        ? 'linear-gradient(180deg, rgba(131,110,249,0.28), rgba(131,110,249,0.12))'
                        : 'linear-gradient(180deg, rgba(6,182,212,0.22), rgba(6,182,212,0.08))',
                      boxShadow: `inset 0 0 0 1px ${bubbleAccent}55, 0 1px 0 rgba(255,255,255,0.04)`,
                      borderRadius: alignRight
                        ? '18px 18px 4px 18px'
                        : '18px 18px 18px 4px',
                      fontWeight: 300,
                    }}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.proposedPrice != null && (
                      <div
                        className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono"
                        style={{
                          background: `${bubbleAccent}33`,
                          boxShadow: `inset 0 0 0 1px ${bubbleAccent}80`,
                          color: '#ffffff',
                        }}
                      >
                        {msg.proposedPrice} {neg.listing?.currency}
                      </div>
                    )}
                  </div>
                </div>
                {alignRight && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: `${bubbleAccent}1f`,
                      boxShadow: `inset 0 0 0 1px ${bubbleAccent}55`,
                    }}
                  >
                    <Zap className="w-3.5 h-3.5" style={{ color: bubbleAccent }} strokeWidth={2} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {agentTyping && (
            <div className="flex justify-start items-end gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(6,182,212,0.18)',
                  boxShadow: 'inset 0 0 0 1px rgba(6,182,212,0.45)',
                }}
              >
                <Zap className="w-3.5 h-3.5 text-cyan-300" strokeWidth={2} />
              </div>
              <div
                className="px-3.5 py-2.5 flex items-center gap-1.5"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(6,182,212,0.18), rgba(6,182,212,0.06))',
                  boxShadow: 'inset 0 0 0 1px rgba(6,182,212,0.35)',
                  borderRadius: '18px 18px 18px 4px',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* AGREED — one-click Accept deal. Buyer path runs the MetaMask
              tx + escrow funding; seller path just confirms so the deal
              is locked on their side. Both are labelled "Accept deal"
              for a consistent mental model. */}
          {neg?.status === 'AGREED' && !paid && (
            <div className="text-center py-2">
              <div
                className="rounded-2xl px-5 py-5"
                style={{
                  border: '1px solid rgba(34,197,94,0.4)',
                  background:
                    'linear-gradient(180deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
                  boxShadow: '0 0 40px -12px rgba(34,197,94,0.35)',
                }}
              >
                <p className="text-green-400 font-mono text-[10px] uppercase tracking-[0.18em] font-medium mb-1">
                  Deal reached
                </p>
                {neg.agreedPrice != null && (
                  <p className="text-white font-light text-3xl mb-1 tracking-[-0.01em]">
                    {neg.agreedPrice}{' '}
                    <span className="text-base text-zinc-400 font-light">
                      {neg.listing?.currency}
                    </span>
                  </p>
                )}
                <p className="text-zinc-500 text-[11px] font-mono mb-4">
                  {isSeller
                    ? 'Lock the deal — buyer will pay next.'
                    : 'Accept to release payment via MetaMask. Escrow delivers on confirmation.'}
                </p>
                <button
                  onClick={isSeller ? accept : payWithEth}
                  disabled={isSeller ? sending : paying}
                  className="w-full text-[13px] font-light py-3 px-4 rounded-xl disabled:opacity-40 transition-all hover:brightness-110"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(34,197,94,0.35) 0%, rgba(34,197,94,0.12) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(34,197,94,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(34,197,94,0.55)',
                    color: 'white',
                  }}
                >
                  {isSeller
                    ? sending
                      ? 'Locking deal…'
                      : `Accept deal at ${neg.agreedPrice} ${neg.listing?.currency}`
                    : paying
                      ? 'Waiting for MetaMask…'
                      : `Accept & pay ${neg.agreedPrice} ${neg.listing?.currency}`}
                </button>
                <button
                  onClick={() => setShowCounter(true)}
                  disabled={sending || paying}
                  className="w-full mt-2 text-[12px] font-light py-2 rounded-lg transition-all hover:text-white text-zinc-400 disabled:opacity-30"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                >
                  Counter with a different offer
                </button>
              </div>
            </div>
          )}

          {neg?.status === 'AGREED' && showCounter && !paid && (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{
                background: 'linear-gradient(180deg, rgba(131,110,249,0.08), rgba(6,182,212,0.04))',
                boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
              }}
            >
              <p className="text-[12px] text-zinc-400 font-light">
                Your counter will reopen the negotiation. The other agent responds
                immediately.
              </p>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder={`New price in ${neg.listing?.currency}`}
                min="0"
                step="0.000001"
                className="w-full rounded-lg px-3 py-2 text-[13px] text-white bg-black/20 placeholder:text-zinc-600 outline-none"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
                disabled={countering}
              />
              <input
                type="text"
                value={counterMsg}
                onChange={(e) => setCounterMsg(e.target.value)}
                placeholder="Message to the seller (optional)"
                className="w-full rounded-lg px-3 py-2 text-[13px] text-white bg-black/20 placeholder:text-zinc-600 outline-none"
                style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
                disabled={countering}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCounter(false)}
                  disabled={countering}
                  className="text-[12px] text-zinc-400 hover:text-white px-3 py-2 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitCounter}
                  disabled={countering || !counterPrice}
                  className="text-[12.5px] text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:brightness-110"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.45), rgba(131,110,249,0.18))',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.55), 0 0 22px -4px rgba(131,110,249,0.55)',
                  }}
                >
                  {countering ? 'Sending…' : 'Send counter'}
                </button>
              </div>
            </div>
          )}

          {paid && (
            <div className="text-center py-2">
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  border: '1px solid rgba(131,110,249,0.4)',
                  background: 'rgba(131,110,249,0.07)',
                }}
              >
                <p className="text-bolty-300 font-mono text-sm font-light mb-1">✓ PAYMENT SENT</p>
                <p className="text-zinc-500 text-xs font-mono mb-3">
                  {listing.fileKey
                    ? 'Your file is ready — download below or open messages with the seller.'
                    : 'Check your DMs to coordinate with the seller.'}
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {listing.fileKey && (
                    <a
                      href={`${API_URL}/market/files/${listing.fileKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-light py-2 px-4 rounded-xl transition-all hover:opacity-90"
                      style={{
                        background: 'linear-gradient(135deg,#836EF9,#6b4fe0)',
                        border: '1px solid rgba(131,110,249,0.5)',
                        color: 'white',
                      }}
                    >
                      ⬇ download {listing.fileName || 'file'}
                    </a>
                  )}
                  <Link
                    href="/dm"
                    className="inline-block text-xs font-mono font-light py-2 px-4 rounded-xl transition-all"
                    style={{
                      background: 'rgba(131,110,249,0.2)',
                      border: '1px solid rgba(131,110,249,0.4)',
                      color: '#c4b5fd',
                    }}
                  >
                    open messages →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {neg?.status === 'REJECTED' && (
            <div className="text-center py-2">
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.35)',
                  color: '#fca5a5',
                }}
              >
                <XCircle className="w-4 h-4" strokeWidth={1.8} />
                <span className="text-[13px] font-light">Negotiation rejected</span>
              </div>
            </div>
          )}

          {neg?.status === 'EXPIRED' && (
            <div className="text-center py-2">
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.35)',
                  color: '#fcd34d',
                }}
              >
                <span className="text-[13px] font-light">Negotiation expired — no deal reached.</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
        {error && (
          <p
            className="px-5 py-2 text-[12px] font-light shrink-0"
            style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.06)' }}
          >
            {error}
          </p>
        )}

        {/* Composer — always visible during an active negotiation. Humans
            can chime in any time; the AI agents keep running in parallel. */}
        {neg?.status === 'ACTIVE' && (
          <div
            className="px-4 py-3 shrink-0 relative z-10"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex-1 flex items-center rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Type a message to nudge your agent…"
                  className="flex-1 bg-transparent text-[13px] text-white placeholder:text-zinc-600 outline-none font-light"
                  disabled={sending}
                />
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder={`offer ${listing.currency}`}
                  className="w-20 text-right bg-transparent text-[12px] text-white placeholder:text-zinc-600 outline-none font-mono"
                  min="0"
                  step="0.000001"
                  disabled={sending}
                />
              </div>
              <button
                onClick={send}
                disabled={sending || !message.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:brightness-110"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.45), rgba(131,110,249,0.18))',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.55), 0 0 22px -4px rgba(131,110,249,0.55)',
                }}
                aria-label="Send"
              >
                <Send className="w-4 h-4 text-white" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes negMsgIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 8px, 0) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
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
      {walletPicker}
    </div>
  );
}

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
  return (
    <div className="card-interactive flex flex-col h-full group">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--brand-dim)', border: '1px solid rgba(131,110,249,0.15)' }}
          >
            <Bot className="w-4.5 h-4.5 text-bolty-400" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-light text-white truncate leading-tight">
              {listing.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <UserAvatar
                src={listing.seller.avatarUrl}
                name={listing.seller.username}
                userId={listing.seller.id}
                size={14}
              />
              <span className="text-[11px] text-zinc-500">
                @{listing.seller.username || 'anon'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {listing.agentEndpoint && (
            <span
              title="Has own AI agent"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-light"
              style={{
                background: 'rgba(131,110,249,0.12)',
                border: '1px solid rgba(131,110,249,0.2)',
                color: '#a78bfa',
              }}
            >
              <span className="w-1 h-1 rounded-full bg-bolty-400 animate-pulse inline-block" />
              AI
            </span>
          )}
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-light border ${TYPE_COLORS[listing.type] || TYPE_COLORS.OTHER}`}
          >
            {listing.type.toLowerCase().replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3 flex-1">
        {listing.description || 'No description provided.'}
      </p>

      {/* Rating */}
      {listing.reviewAverage !== null &&
        listing.reviewAverage !== undefined &&
        (listing.reviewCount ?? 0) > 0 && (
          <div className="inline-flex items-center gap-1 text-[11px] text-zinc-400 mb-3">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-medium">{listing.reviewAverage.toFixed(1)}</span>
            <span className="text-zinc-600">
              ({listing.reviewCount} review{listing.reviewCount === 1 ? '' : 's'})
            </span>
          </div>
        )}

      {/* Tags */}
      {listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {listing.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          {listing.price === 0 ? (
            <span className="text-sm font-light text-green-400">Free</span>
          ) : (
            <span className="text-sm font-light text-white">
              {listing.price}{' '}
              <span className="text-xs text-zinc-500 font-light">{listing.currency}</span>
            </span>
          )}
          {listing.minPrice != null && (
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Floor: {listing.minPrice} {listing.currency}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Link href={`/market/agents/${listing.id}`} className="btn-ghost text-xs py-1 px-2.5">
            View
          </Link>
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
            title="Start an AI-to-AI negotiation"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-light text-white transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(180deg, rgba(131,110,249,0.22), rgba(131,110,249,0.08))',
              border: '1px solid rgba(131,110,249,0.35)',
            }}
          >
            <Bot className="w-2.5 h-2.5" />
            Negotiate
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                window.location.href = '/auth';
                return;
              }
              onBuy();
            }}
            className="btn-primary text-xs py-1 px-3"
          >
            {listing.price === 0 ? 'Get free' : 'Buy'}
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

function CreateListingForm({
  onCreated,
  onCancel,
}: {
  onCreated: (listing: MarketListing) => void;
  onCancel: () => void;
}) {
  const { refresh } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'AI_AGENT' as MarketListing['type'],
    category: '',
    subcategory: '',
    keywords: '',
    price: '',
    minPrice: '',
    pricingModel: 'fixed',
    currency: 'ETH',
    tags: '',
    agentUrl: '',
    agentEndpoint: '',
    version: '1.0.0',
    releaseNotes: '',
    releaseType: 'initial',
  });
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMeta | null>(null);
  const [securityScan, setSecurityScan] = useState<SecurityScan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [showCodeSnippets, setShowCodeSnippets] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<'python' | 'javascript' | 'curl'>(
    'python',
  );
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<{ output?: string; error?: string } | null>(
    null,
  );
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamRole, setTeamRole] = useState<'Owner' | 'Editor' | 'Viewer'>('Editor');
  const [teamMembers, setTeamMembers] = useState<
    Array<{ email: string; role: 'Owner' | 'Editor' | 'Viewer' }>
  >([{ email: 'You (Owner)', role: 'Owner' }]);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({
    slack: false,
    discord: false,
    webhook: false,
    email: false,
    datadog: false,
  });
  const [showTiers, setShowTiers] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<
    Array<{ name: string; price: string; features: string; users: string }>
  >([{ name: 'Basic', price: form.price, features: 'Core features', users: '1' }]);
  const [newTierName, setNewTierName] = useState('');
  const [showReadme, setShowReadme] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const testAgent = async () => {
    if (!sandboxInput.trim()) return;
    setSandboxLoading(true);
    setSandboxResult(null);
    try {
      // Simulate agent response
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSandboxResult({
        output: `Agent processed: "${sandboxInput.trim()}"\n\nResponse: This is a simulated response from your ${TYPE_LABELS[form.type]} agent.`,
      });
    } catch (err) {
      setSandboxResult({
        error: 'Failed to test agent. Please ensure webhook is configured.',
      });
    } finally {
      setSandboxLoading(false);
    }
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'agentEndpoint':
        if (ACCEPTS_AGENT_ENDPOINT.has(form.type) && value.trim() && !validators.url(value)) {
          return 'Invalid webhook URL';
        }
        return '';
      case 'price':
        if (value && !validators.price(value)) {
          return 'Price must be a positive number';
        }
        return '';
      case 'minPrice':
        if (value && !validators.price(value)) {
          return 'Floor price must be a positive number';
        }
        if (form.price && value && parseFloat(value) > parseFloat(form.price)) {
          return 'Floor price cannot exceed price';
        }
        return '';
      default:
        return '';
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setScanning(false);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      setScanning(true);
      const result = await api.upload<UploadedFileMeta>('/market/upload', formData);
      setUploadedFile(result as UploadedFileMeta);

      // Generate security scan
      const scan = generateSecurityScan(file.name);
      setSecurityScan(scan);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Run every step's validator so we never submit a partially-invalid
    // form. If any step has issues, surface the errors, jump back to the
    // earliest broken step and bail before we hit the backend.
    const allErrors: Record<string, string> = {};
    let firstBrokenStep: 1 | 2 | 3 | 4 | 5 | 6 | null = null;
    for (const s of [1, 2, 3, 4, 5] as const) {
      const errs = validateStep(s);
      if (Object.keys(errs).length > 0) {
        Object.assign(allErrors, errs);
        if (firstBrokenStep === null) firstBrokenStep = s;
      }
    }
    if (firstBrokenStep !== null) {
      setFieldErrors((prev) => ({ ...prev, ...allErrors }));
      setError('Some required fields are missing — jumping you back.');
      setStep(firstBrokenStep);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        ...(form.minPrice ? { minPrice: parseFloat(form.minPrice) } : {}),
        ...(form.agentEndpoint.trim() ? { agentEndpoint: form.agentEndpoint.trim() } : {}),
        ...(uploadedFile
          ? {
              fileKey: uploadedFile.fileKey,
              fileName: uploadedFile.fileName,
              fileSize: uploadedFile.fileSize,
              fileMimeType: uploadedFile.fileMimeType,
            }
          : {}),
      };
      const result = await api.post<MarketListing>('/market', payload);
      await refresh();
      setDeploySuccess(true);
      // Show success for 2 seconds then call onCreated
      setTimeout(() => {
        onCreated(result);
      }, 2000);
    } catch (err) {
      if (err instanceof Error && err.message === 'Cancelled') {
        // User dismissed the 2FA modal — leave the form as-is.
      } else {
        setError(err instanceof ApiError ? err.message : 'Failed to create listing');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }));

  // Per-step validation returning a map of field → error so the wizard
  // can render errors inline on each input instead of dumping a generic
  // "fill in required fields" at the bottom after the user has already
  // walked past step 6.
  const validateStep = (currentStep: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    switch (currentStep) {
      case 1:
        if (!form.title.trim()) errs.title = 'Title is required';
        else if (form.title.trim().length < 3) errs.title = 'Title must be at least 3 characters';
        if (!form.description.trim()) errs.description = 'Description is required';
        else if (form.description.trim().length < 20)
          errs.description = 'Description must be at least 20 characters';
        break;
      case 2:
        break;
      case 3:
        if (ACCEPTS_AGENT_ENDPOINT.has(form.type)) {
          if (!form.agentEndpoint.trim()) {
            errs.agentEndpoint = 'Negotiation webhook is required for this agent type';
          } else if (!validators.url(form.agentEndpoint)) {
            errs.agentEndpoint = 'Invalid webhook URL';
          }
        }
        break;
      case 4:
        if (!form.price) {
          errs.price = 'Price is required';
        } else if (!validators.price(form.price)) {
          errs.price = 'Price must be a positive number';
        }
        if (form.minPrice) {
          if (!validators.price(form.minPrice)) {
            errs.minPrice = 'Floor price must be a positive number';
          } else if (form.price && parseFloat(form.minPrice) > parseFloat(form.price)) {
            errs.minPrice = 'Floor price cannot exceed price';
          }
        }
        break;
      case 5:
        if (!form.version) errs.version = 'Version is required';
        break;
    }
    return errs;
  };

  const FIELD_LABELS: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    agentEndpoint: 'Negotiation webhook',
    price: 'Price',
    minPrice: 'Floor price',
    version: 'Version',
  };

  const steps = [
    { num: 1, label: 'Type & Description' },
    { num: 2, label: 'Category & Tags' },
    { num: 3, label: 'Configuration' },
    { num: 4, label: 'Pricing' },
    { num: 5, label: 'Versioning' },
    { num: 6, label: 'Review' },
  ];

  const categoryData = AGENT_CATEGORIES[form.type as keyof typeof AGENT_CATEGORIES];

  // Calculate completion percentage
  const calculateCompletion = (): number => {
    let completed = 0;
    let total = 5; // title, description, type, price, currency

    if (form.title.trim()) completed++;
    if (form.description.trim()) completed++;
    if (form.type) completed++;
    if (form.price) completed++;
    if (form.tags.trim()) completed++;

    // Add conditional fields
    if (ACCEPTS_AGENT_ENDPOINT.has(form.type) && form.agentEndpoint.trim()) {
      completed++;
      total++;
    } else if (ACCEPTS_AGENT_ENDPOINT.has(form.type)) {
      total++;
    }

    if (ACCEPTS_FILE.has(form.type) && uploadedFile) {
      completed++;
      total++;
    } else if (ACCEPTS_FILE.has(form.type)) {
      total++;
    }

    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();

  return (
    <div className="mk-wizard">
      {/* Header */}
      <div className="mk-wizard__header">
        <div>
          <h2 className="mk-wizard__title">Deploy new agent</h2>
          <p className="mk-wizard__sub">
            Step {step} of {steps.length} · {completion}% complete
          </p>
        </div>
        <button type="button" onClick={onCancel} className="mk-wizard__close" aria-label="Close">
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Step progress — click to jump back to a completed step */}
      <div className="mk-wizard__steps">
        {steps.map((s) => {
          const hasError =
            (s.num === 1 && (fieldErrors.title || fieldErrors.description)) ||
            (s.num === 3 && fieldErrors.agentEndpoint) ||
            (s.num === 4 && (fieldErrors.price || fieldErrors.minPrice)) ||
            (s.num === 5 && fieldErrors.version);
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < step) {
                  setError('');
                  setStep(s.num as 1 | 2 | 3 | 4 | 5 | 6);
                }
              }}
              disabled={s.num >= step}
              aria-label={`Step ${s.num}: ${s.label}`}
              title={s.label}
              className={`mk-wizard__step ${s.num <= step ? 'mk-wizard__step--done' : ''} ${
                hasError ? 'mk-wizard__step--error' : ''
              }`}
              style={
                hasError
                  ? { background: 'rgba(239,68,68,0.6)', cursor: s.num < step ? 'pointer' : 'default' }
                  : { cursor: s.num < step ? 'pointer' : 'default' }
              }
            />
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Type & Description */}
        {step === 1 && (
          <>
            <div>
              <HelpLabel
                label="Agent Type"
                required
                help="Choose the type that best describes your product"
              />
              <div className="flex gap-2 flex-wrap mb-3">
                {(['AI_AGENT', 'BOT', 'SCRIPT', 'OTHER'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => field('type', t)}
                    className={`mk-wizard__chip ${form.type === t ? 'mk-wizard__chip--active' : ''}`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              {form.type && (
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    background: 'rgba(131,110,249,0.05)',
                    borderColor: 'rgba(131,110,249,0.2)',
                  }}
                >
                  <p className="text-xs font-light text-zinc-300 mb-2">
                    {AGENT_TYPE_INFO[form.type as keyof typeof AGENT_TYPE_INFO]?.description}
                  </p>
                  <p className="text-xs text-zinc-600">
                    Examples:{' '}
                    {AGENT_TYPE_INFO[form.type as keyof typeof AGENT_TYPE_INFO]?.examples.join(
                      ', ',
                    )}
                  </p>
                </div>
              )}
            </div>

            <div>
              <HelpLabel
                label="Title"
                required
                help="Keep it short and descriptive. This appears in marketplace search results."
              />
              <input
                type="text"
                placeholder={
                  form.type === 'AI_AGENT'
                    ? 'e.g., Smart Data Analyzer'
                    : form.type === 'BOT'
                      ? 'e.g., Discord Moderation Bot'
                      : form.type === 'SCRIPT'
                        ? 'e.g., Automated Report Generator'
                        : 'e.g., Custom Analytics Tool'
                }
                value={form.title}
                onChange={(e) => {
                  field('title', e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((p) => {
                      const copy = { ...p };
                      delete copy.title;
                      return copy;
                    });
                  }
                }}
                maxLength={100}
                required
                className="w-full text-sm px-3 py-2 rounded-lg font-light"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: fieldErrors.title
                    ? '1px solid rgba(239,68,68,0.35)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
              />
              <div className="flex items-center justify-between">
                {fieldErrors.title ? (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.title}</p>
                ) : (
                  <p className="text-xs text-zinc-600 mt-1">{form.title.length}/100</p>
                )}
              </div>
              <Tip message={getTips.title(form.title.length)} />
            </div>

            <div>
              <HelpLabel
                label="Description"
                required
                help="What does your agent do? What problems does it solve?"
              />
              <textarea
                placeholder="What does your agent do? What problems does it solve?"
                value={form.description}
                onChange={(e) => {
                  field('description', e.target.value);
                  if (fieldErrors.description) {
                    setFieldErrors((p) => {
                      const copy = { ...p };
                      delete copy.description;
                      return copy;
                    });
                  }
                }}
                maxLength={1000}
                rows={4}
                required
                className="w-full text-sm px-3 py-2 rounded-lg font-light resize-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: fieldErrors.description
                    ? '1px solid rgba(239,68,68,0.35)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
              />
              <div className="flex items-center justify-between">
                {fieldErrors.description ? (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.description}</p>
                ) : (
                  <p className="text-xs text-zinc-600 mt-1">{form.description.length}/1000</p>
                )}
              </div>
              <Tip message={getTips.description(form.description.length)} />
            </div>
          </>
        )}

        {/* Step 2: Category & Tags */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <HelpLabel label="Category" help={FIELD_HELP.category} />
                <select
                  value={form.category}
                  onChange={(e) => field('category', e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg font-light"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e4e4e7',
                    outline: 'none',
                  }}
                >
                  <option value="">Select category</option>
                  {categoryData &&
                    categoryData.subcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-light text-zinc-400 mb-2 block">Subcategory</label>
                <input
                  type="text"
                  placeholder="Specify more..."
                  value={form.subcategory}
                  onChange={(e) => field('subcategory', e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg font-light"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e4e4e7',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <HelpLabel label="Keywords" help={FIELD_HELP.keywords} />
              <input
                type="text"
                placeholder="e.g., analytics, nlp, automation"
                value={form.keywords}
                onChange={(e) => field('keywords', e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg font-light"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <HelpLabel label="Tags" help={FIELD_HELP.tags} />
              <input
                type="text"
                placeholder="e.g., ai, data, python, api"
                value={form.tags}
                onChange={(e) => field('tags', e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg font-light"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
              />
              <Tip message={getTips.tags(validators.tags(form.tags))} />
            </div>
          </>
        )}

        {/* Step 3: Configuration */}
        {step === 3 && (
          <>
            {ACCEPTS_AGENT_ENDPOINT.has(form.type) && (
              <div>
                <HelpLabel label="AI Negotiation Webhook" required help={FIELD_HELP.webhook} />
                <input
                  type="url"
                  placeholder="https://your-api.com/webhook"
                  value={form.agentEndpoint}
                  onChange={(e) => {
                    field('agentEndpoint', e.target.value);
                    const err = validateField('agentEndpoint', e.target.value);
                    if (err) {
                      setFieldErrors((p) => ({ ...p, agentEndpoint: err }));
                    } else {
                      setFieldErrors((p) => {
                        const copy = { ...p };
                        delete copy.agentEndpoint;
                        return copy;
                      });
                    }
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg font-light"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: fieldErrors.agentEndpoint
                      ? '1px solid rgba(239,68,68,0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                    color: '#e4e4e7',
                    outline: 'none',
                  }}
                />
                {fieldErrors.agentEndpoint ? (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.agentEndpoint}</p>
                ) : (
                  <p className="text-xs text-zinc-600 mt-1">
                    Endpoint where buyers can negotiate with your agent
                  </p>
                )}
              </div>
            )}

            {ACCEPTS_FILE.has(form.type) && (
              <div>
                <label className="text-xs font-light text-zinc-400 mb-3 block">Agent File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`mk-wizard__dropzone ${uploadedFile ? 'mk-wizard__dropzone--done' : ''}`}
                >
                  {uploading ? (
                    <p className="text-xs font-light text-bolty-400 animate-pulse">
                      {scanning ? 'scanning for security threats...' : 'uploading...'}
                    </p>
                  ) : uploadedFile ? (
                    <div className="space-y-3 w-full">
                      <div className="flex items-center gap-2 justify-center">
                        {uploadedFile.scanPassed ? (
                          <ShieldCheck className="w-6 h-6 text-green-400" />
                        ) : (
                          <ShieldAlert className="w-6 h-6 text-yellow-400" />
                        )}
                        <div className="text-left">
                          <p className="text-xs font-light text-zinc-300">
                            {uploadedFile.fileName}
                          </p>
                          <p className="text-xs font-light text-zinc-600">
                            {formatBytes(uploadedFile.fileSize)}
                          </p>
                        </div>
                      </div>

                      {/* Security Score */}
                      {securityScan && (
                        <div
                          className="rounded-lg p-3 space-y-2"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-light text-zinc-600">Security Score</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-zinc-800">
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${securityScan.score}%`,
                                    background:
                                      securityScan.score >= 80
                                        ? 'rgba(34,197,94,0.6)'
                                        : securityScan.score >= 60
                                          ? 'rgba(234,179,8,0.6)'
                                          : 'rgba(239,68,68,0.6)',
                                  }}
                                />
                              </div>
                              <span className="text-xs font-light text-zinc-400">
                                {securityScan.score}%
                              </span>
                            </div>
                          </div>

                          {securityScan.issues.length > 0 && (
                            <div className="space-y-1 pt-2 border-t border-zinc-800">
                              {securityScan.issues.map((issue, idx) => (
                                <p key={idx} className="text-xs font-light text-zinc-500">
                                  {issue.severity === 'critical' && '🔴'}
                                  {issue.severity === 'high' && '🟠'}
                                  {issue.severity === 'medium' && '🟡'}
                                  {issue.severity === 'low' && '🟢'} {issue.message}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {uploadedFile.scanNote && (
                        <p className="text-xs font-light text-zinc-500">{uploadedFile.scanNote}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-light text-zinc-500">Click to upload agent file</p>
                      <p className="text-xs font-light text-zinc-700">
                        .py .js .ts .zip .json .yaml .sh — max 10 MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".py,.js,.ts,.zip,.json,.yaml,.yml,.sh,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
              </div>
            )}

            {/* Sandbox Test Button */}
            {form.agentEndpoint && ACCEPTS_AGENT_ENDPOINT.has(form.type) && (
              <button
                type="button"
                onClick={() => setShowSandbox(true)}
                className="w-full py-2 px-4 rounded-lg text-xs font-light text-bolty-300 border transition-all hover:border-bolty-500/40"
                style={{
                  borderColor: 'rgba(131,110,249,0.2)',
                  background: 'rgba(131,110,249,0.05)',
                }}
              >
                🧪 Test Agent in Sandbox
              </button>
            )}

            {/* Integrations Button */}
            <button
              type="button"
              onClick={() => setShowIntegrations(true)}
              className="w-full py-2 px-4 rounded-lg text-xs font-light text-bolty-300 border transition-all hover:border-bolty-500/40"
              style={{
                borderColor: 'rgba(131,110,249,0.2)',
                background: 'rgba(131,110,249,0.05)',
              }}
            >
              ⚡ Setup Integrations
            </button>
          </>
        )}

        {/* Step 4: Pricing */}
        {step === 4 && (
          <>
            <div>
              <label className="text-xs font-light text-zinc-400 mb-3 block">Pricing Model</label>
              <div className="grid grid-cols-2 gap-3">
                {PRICING_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => field('pricingModel', tier.value)}
                    className={`mk-wizard__tile ${
                      form.pricingModel === tier.value ? 'mk-wizard__tile--active' : ''
                    }`}
                  >
                    <p className="text-[13px] font-normal text-zinc-100">{tier.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{tier.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <HelpLabel label="Price" required help={FIELD_HELP.price} />
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => {
                    field('price', e.target.value);
                    const err = validateField('price', e.target.value);
                    if (err) {
                      setFieldErrors((p) => ({ ...p, price: err }));
                    } else {
                      setFieldErrors((p) => {
                        const copy = { ...p };
                        delete copy.price;
                        return copy;
                      });
                    }
                  }}
                  min="0"
                  step="0.01"
                  required
                  className="w-full text-sm px-3 py-2 rounded-lg font-light"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: fieldErrors.price
                      ? '1px solid rgba(239,68,68,0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                    color: '#e4e4e7',
                    outline: 'none',
                  }}
                />
                {fieldErrors.price && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.price}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-light text-zinc-400 mb-2 block">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => field('currency', e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg font-light"
                  style={{
                    background: 'rgba(15,15,24,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e4e4e7',
                    outline: 'none',
                  }}
                >
                  {['ETH', 'BOLTY'].map((c) => (
                    <option key={c} value={c}>
                      {c === 'BOLTY' ? 'BOLTY (0 tax)' : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <HelpLabel label="Floor Price" help={FIELD_HELP.floorPrice} />
              <input
                type="number"
                placeholder="Leave empty if no minimum"
                value={form.minPrice}
                onChange={(e) => {
                  field('minPrice', e.target.value);
                  const err = validateField('minPrice', e.target.value);
                  if (err) {
                    setFieldErrors((p) => ({ ...p, minPrice: err }));
                  } else {
                    setFieldErrors((p) => {
                      const copy = { ...p };
                      delete copy.minPrice;
                      return copy;
                    });
                  }
                }}
                min="0"
                step="0.01"
                className="w-full text-sm px-3 py-2 rounded-lg font-light"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: fieldErrors.minPrice
                    ? '1px solid rgba(239,68,68,0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
              />
              {fieldErrors.minPrice && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.minPrice}</p>
              )}
            </div>

            {/* Pricing Tiers Builder Button */}
            <button
              type="button"
              onClick={() => setShowTiers(true)}
              className="w-full py-2 px-4 rounded-lg text-xs font-light text-bolty-300 border transition-all hover:border-bolty-500/40"
              style={{
                borderColor: 'rgba(131,110,249,0.2)',
                background: 'rgba(131,110,249,0.05)',
              }}
            >
              💰 Create Pricing Tiers
            </button>
          </>
        )}

        {/* Step 5: Versioning */}
        {step === 5 && (
          <>
            <div
              className="rounded-lg p-4 border mb-4"
              style={{ background: 'rgba(131,110,249,0.05)', borderColor: 'rgba(131,110,249,0.2)' }}
            >
              <p className="text-xs font-light text-zinc-400 mb-1">First Deployment</p>
              <p className="text-sm font-light text-zinc-300">
                Version will be locked at v1.0.0 for your initial release
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <HelpLabel label="Major" help="Breaking changes or major features" />
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={form.version.split('.')[0]}
                  onChange={(e) => {
                    const parts = form.version.split('.');
                    field('version', `${e.target.value}.${parts[1]}.${parts[2]}`);
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg font-light"
                  disabled
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#a1a1a1',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <HelpLabel label="Minor" help="New features, backward compatible" />
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={form.version.split('.')[1]}
                  onChange={(e) => {
                    const parts = form.version.split('.');
                    field('version', `${parts[0]}.${e.target.value}.${parts[2]}`);
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg font-light"
                  disabled
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#a1a1a1',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <HelpLabel label="Patch" help="Bug fixes and improvements" />
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={form.version.split('.')[2]}
                  onChange={(e) => {
                    const parts = form.version.split('.');
                    field('version', `${parts[0]}.${parts[1]}.${e.target.value}`);
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg font-light"
                  disabled
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#a1a1a1',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <HelpLabel label="Release Notes" help="Describe what changed in this version" />
              <textarea
                placeholder="Initial release - Describe your agent's capabilities and features..."
                value={form.releaseNotes}
                onChange={(e) => field('releaseNotes', e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full text-sm px-3 py-2 rounded-lg font-light resize-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-zinc-600">{form.releaseNotes.length}/500</p>
              </div>
            </div>

            <div
              className="rounded-lg p-3 border mt-4"
              style={{
                background: 'rgba(34,197,94,0.05)',
                borderColor: 'rgba(34,197,94,0.2)',
              }}
            >
              <p className="text-xs font-light text-green-300">
                ✨ Version history will be maintained for all future releases of your agent.
              </p>
            </div>
          </>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-light text-zinc-100 mb-4">Preview</h3>
              <div
                className="rounded-lg border p-5 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(131,110,249,0.2)',
                  borderWidth: '1px',
                }}
              >
                <div className="space-y-3">
                  {/* Agent card preview */}
                  <div className="group cursor-pointer">
                    <div
                      className="relative rounded-lg border p-4 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      {/* Icon placeholder */}
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(131,110,249,0.2)' }}
                        >
                          <Bot className="w-5 h-5 text-bolty-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-light text-zinc-100 truncate">
                            {form.title || 'Agent Title'}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            <Badge className="text-xs">{TYPE_LABELS[form.type]}</Badge>
                            {form.category && (
                              <Badge variant="secondary" className="text-xs">
                                {form.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description preview */}
                      <p className="text-xs font-light text-zinc-500 line-clamp-2">
                        {form.description || 'Agent description will appear here'}
                      </p>

                      {/* Tags preview */}
                      {form.tags && (
                        <div className="flex gap-1 mt-3 flex-wrap">
                          {form.tags
                            .split(',')
                            .slice(0, 3)
                            .map((tag) => (
                              <span
                                key={tag.trim()}
                                className="text-xs px-2 py-1 rounded-md"
                                style={{
                                  background: 'rgba(131,110,249,0.1)',
                                  color: 'rgba(131,110,249,0.8)',
                                }}
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          {form.tags.split(',').length > 3 && (
                            <span
                              className="text-xs px-2 py-1 rounded-md"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.5)',
                              }}
                            >
                              +{form.tags.split(',').length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer with price */}
                      <div
                        className="flex items-center justify-between mt-4 pt-3 border-t"
                        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                      >
                        <span className="text-xs text-zinc-600">Starting at</span>
                        <span className="text-lg font-light text-bolty-300">
                          {form.price || '0'} {form.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div
              className="rounded-lg p-4"
              style={{
                background: 'rgba(131,110,249,0.05)',
                borderColor: 'rgba(131,110,249,0.2)',
                border: '1px solid',
              }}
            >
              <h4 className="text-xs font-light text-zinc-400 mb-3 uppercase tracking-wide">
                Deployment Summary
              </h4>
              <div className="space-y-2 text-xs font-light">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Type:</span>
                  <span className="text-zinc-300">{TYPE_LABELS[form.type]}</span>
                </div>
                {form.category && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Category:</span>
                    <span className="text-zinc-300">{form.category}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-600">Pricing Model:</span>
                  <span className="text-zinc-300 capitalize">{form.pricingModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Price:</span>
                  <span className="text-zinc-300">
                    {form.price} {form.currency}
                  </span>
                </div>
                {form.minPrice && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Floor Price:</span>
                    <span className="text-zinc-300">
                      {form.minPrice} {form.currency}
                    </span>
                  </div>
                )}
                {form.tags && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Tags:</span>
                    <span className="text-zinc-300">{form.tags.split(',').length} tags</span>
                  </div>
                )}
                {uploadedFile && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">File:</span>
                    <span className="text-zinc-300">{uploadedFile.fileName}</span>
                  </div>
                )}
                {ACCEPTS_AGENT_ENDPOINT.has(form.type) && form.agentEndpoint && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Webhook:</span>
                    <span className="text-zinc-300 truncate">Configured</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  borderColor: 'rgba(239,68,68,0.3)',
                  border: '1px solid',
                }}
              >
                <p className="text-red-400 font-light text-xs">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setShowApiDocs(true)}
                className="py-2 px-4 rounded-lg text-xs font-light text-bolty-300 border transition-all hover:border-bolty-500/40"
                style={{
                  borderColor: 'rgba(131,110,249,0.2)',
                  background: 'rgba(131,110,249,0.05)',
                }}
              >
                📄 API Docs
              </button>
              <button
                type="button"
                onClick={() => setShowCodeSnippets(true)}
                className="py-2 px-4 rounded-lg text-xs font-light text-bolty-300 border transition-all hover:border-bolty-500/40"
                style={{
                  borderColor: 'rgba(131,110,249,0.2)',
                  background: 'rgba(131,110,249,0.05)',
                }}
              >
                💻 Code
              </button>
              <button
                type="button"
                onClick={() => setShowAnalytics(true)}
                className="py-2 px-4 rounded-lg text-xs font-light text-bolty-300 border transition-all hover:border-bolty-500/40"
                style={{
                  borderColor: 'rgba(131,110,249,0.2)',
                  background: 'rgba(131,110,249,0.05)',
                }}
              >
                📊 Analytics
              </button>
              <button
                type="button"
                onClick={() => setShowReadme(true)}
                className="py-2 px-4 rounded-lg text-xs font-light text-bolty-300 border transition-all hover:border-bolty-500/40"
                style={{
                  borderColor: 'rgba(131,110,249,0.2)',
                  background: 'rgba(131,110,249,0.05)',
                }}
              >
                📝 README
              </button>
              <button
                type="button"
                onClick={() => setShowTeam(true)}
                className="py-2 px-4 rounded-lg text-xs font-light text-bolty-300 border transition-all hover:border-bolty-500/40"
                style={{
                  borderColor: 'rgba(131,110,249,0.2)',
                  background: 'rgba(131,110,249,0.05)',
                }}
              >
                👥 Team
              </button>
            </div>
          </div>
        )}

        {/* Step-level error summary */}
        {(() => {
          const stepFieldErrs = Object.entries(fieldErrors).filter(([key]) => {
            if (step === 1) return key === 'title' || key === 'description';
            if (step === 3) return key === 'agentEndpoint';
            if (step === 4) return key === 'price' || key === 'minPrice';
            if (step === 5) return key === 'version';
            return false;
          });
          if (stepFieldErrs.length === 0) return null;
          return (
            <div
              className="rounded-lg p-3 border"
              style={{
                background: 'rgba(239,68,68,0.05)',
                borderColor: 'rgba(239,68,68,0.25)',
              }}
              role="alert"
            >
              <p className="text-xs font-light text-red-300 mb-1">
                Fix {stepFieldErrs.length === 1 ? 'this' : 'these'} before continuing:
              </p>
              <ul className="text-xs font-light text-red-200/90 space-y-0.5 pl-3">
                {stepFieldErrs.map(([key, msg]) => (
                  <li key={key}>
                    • {FIELD_LABELS[key] || key}: {msg}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Error */}
        {error && step !== 5 && <p className="text-red-400 font-light text-xs">{error}</p>}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep((prev) => (prev - 1) as any);
              }}
              className="mk-wizard__secondary"
            >
              Back
            </button>
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => {
                setError('');
                const errs = validateStep(step);
                setFieldErrors((prev) => {
                  const next = { ...prev, ...errs };
                  // clear any resolved errors for this step's fields
                  if (step === 1) {
                    if (!errs.title) delete next.title;
                    if (!errs.description) delete next.description;
                  } else if (step === 3) {
                    if (!errs.agentEndpoint) delete next.agentEndpoint;
                  } else if (step === 4) {
                    if (!errs.price) delete next.price;
                    if (!errs.minPrice) delete next.minPrice;
                  } else if (step === 5) {
                    if (!errs.version) delete next.version;
                  }
                  return next;
                });
                if (Object.keys(errs).length === 0) {
                  setStep((prev) => (prev + 1) as any);
                }
              }}
              className="mk-wizard__primary"
            >
              Next
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="mk-wizard__primary">
              {submitting ? 'Deploying…' : 'Deploy agent'}
            </button>
          )}
        </div>
      </form>

      {/* Success Confirmation Modal */}
      {deploySuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl border max-w-2xl w-full"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div className="p-8 text-center space-y-6">
              {/* Success Animation */}
              <div className="text-6xl animate-bounce">🎉</div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-light text-zinc-100 mb-2">
                  Agent Deployed Successfully!
                </h2>
                <p className="text-sm text-zinc-600">
                  Your {form.title} is now live on the Bolty marketplace.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🌐', label: 'Public URL', value: 'Active' },
                  { icon: '🔑', label: 'API Keys', value: 'Generated' },
                  { icon: '📊', label: 'Analytics', value: 'Ready' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 border"
                    style={{
                      background: 'rgba(34,197,94,0.05)',
                      borderColor: 'rgba(34,197,94,0.2)',
                    }}
                  >
                    <p className="text-2xl mb-1">{stat.icon}</p>
                    <p className="text-xs text-zinc-600">{stat.label}</p>
                    <p className="text-xs font-light text-green-300 mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Next Steps */}
              <div
                className="rounded-lg p-4 border text-left"
                style={{
                  background: 'rgba(131,110,249,0.05)',
                  borderColor: 'rgba(131,110,249,0.2)',
                }}
              >
                <p className="text-xs font-light text-zinc-400 mb-3 uppercase tracking-wide">
                  Next Steps
                </p>
                <div className="space-y-2 text-xs font-light text-zinc-400">
                  <div className="flex items-start gap-2">
                    <span className="text-bolty-300 mt-1">→</span>
                    <span>Share your agent URL with others</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-bolty-300 mt-1">→</span>
                    <span>Monitor usage and earnings in your dashboard</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-bolty-300 mt-1">→</span>
                    <span>Update and manage versions anytime</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Check out my new agent on Bolty: ${form.title}`);
                  }}
                  className="py-2 px-4 rounded-lg text-xs font-light border transition-all"
                  style={{
                    borderColor: 'rgba(131,110,249,0.4)',
                    color: '#e2d9ff',
                    background: 'rgba(131,110,249,0.1)',
                  }}
                >
                  📋 Share
                </button>
                <button
                  onClick={() => {
                    setDeploySuccess(false);
                  }}
                  className="py-2 px-4 rounded-lg text-xs font-light border transition-all"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(131,110,249,0.4), rgba(99,102,241,0.3))',
                    border: '1px solid rgba(131,110,249,0.4)',
                    color: '#e2d9ff',
                  }}
                >
                  ✨ Go to Dashboard
                </button>
              </div>

              <p className="text-xs text-zinc-600">Redirecting in a moment...</p>
            </div>
          </div>
        </div>
      )}

      {/* README Generator Modal */}
      {showReadme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="rounded-2xl border max-w-3xl w-full my-8"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="flex items-center justify-between p-4 border-b sticky top-0"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a12' }}
            >
              <h3 className="text-lg font-light text-zinc-100">Generated README.md</h3>
              <button
                onClick={() => setShowReadme(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-zinc-600">
                This README will be displayed on your agent&apos;s marketplace page. You can edit it
                after deployment.
              </p>

              <CodeBlock code={generateReadme(form, pricingTiers)} language="markdown" />

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateReadme(form, pricingTiers));
                    alert('README copied to clipboard!');
                  }}
                  className="flex-1 py-2 px-4 rounded-lg text-xs font-light border transition-all"
                  style={{
                    borderColor: 'rgba(131,110,249,0.4)',
                    color: '#e2d9ff',
                    background: 'rgba(131,110,249,0.1)',
                  }}
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute(
                      'href',
                      `data:text/plain;charset=utf-8,${encodeURIComponent(generateReadme(form, pricingTiers))}`,
                    );
                    element.setAttribute('download', 'README.md');
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg text-xs font-light border transition-all"
                  style={{
                    borderColor: 'rgba(131,110,249,0.4)',
                    color: '#e2d9ff',
                    background: 'rgba(131,110,249,0.1)',
                  }}
                >
                  ⬇️ Download
                </button>
              </div>

              <button
                onClick={() => setShowReadme(false)}
                className="w-full py-2 px-4 rounded-lg text-xs font-light border transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#e4e4e7',
                  background: 'transparent',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tiers Builder Modal */}
      {showTiers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="rounded-2xl border max-w-3xl w-full my-8"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="flex items-center justify-between p-4 border-b sticky top-0"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a12' }}
            >
              <h3 className="text-lg font-light text-zinc-100">Pricing Tiers</h3>
              <button
                onClick={() => setShowTiers(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-zinc-600">
                Create multiple pricing tiers to appeal to different customer segments.
              </p>

              {/* Tiers Table */}
              <div className="overflow-x-auto">
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-4 gap-3 px-4 py-2 text-xs font-light text-zinc-400">
                    <div>Tier Name</div>
                    <div>Price</div>
                    <div>Features</div>
                    <div>Max Users</div>
                  </div>

                  {/* Tier Rows */}
                  {pricingTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-4 gap-3 p-3 rounded-lg border"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          updated[idx].name = e.target.value;
                          setPricingTiers(updated);
                        }}
                        className="text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700"
                        placeholder="Tier name"
                      />
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          updated[idx].price = e.target.value;
                          setPricingTiers(updated);
                        }}
                        className="text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700"
                        placeholder="0.00"
                      />
                      <input
                        type="text"
                        value={tier.features}
                        onChange={(e) => {
                          const updated = [...pricingTiers];
                          updated[idx].features = e.target.value;
                          setPricingTiers(updated);
                        }}
                        className="text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700"
                        placeholder="Feature list"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={tier.users}
                          onChange={(e) => {
                            const updated = [...pricingTiers];
                            updated[idx].users = e.target.value;
                            setPricingTiers(updated);
                          }}
                          className="text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700 flex-1"
                          placeholder="1"
                        />
                        {idx > 0 && (
                          <button
                            onClick={() => {
                              setPricingTiers(pricingTiers.filter((_, i) => i !== idx));
                            }}
                            className="text-red-400 hover:text-red-300 text-xs px-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Tier Form */}
              <div
                className="p-4 rounded-lg border"
                style={{
                  background: 'rgba(131,110,249,0.05)',
                  borderColor: 'rgba(131,110,249,0.2)',
                }}
              >
                <p className="text-xs font-light text-zinc-400 mb-3">Add New Tier</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tier name (e.g., Professional)"
                    value={newTierName}
                    onChange={(e) => setNewTierName(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-lg font-light"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e4e4e7',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newTierName.trim()) {
                        setPricingTiers([
                          ...pricingTiers,
                          {
                            name: newTierName,
                            price: '',
                            features: '',
                            users: '',
                          },
                        ]);
                        setNewTierName('');
                      }
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-light text-bolty-300 border transition-all"
                    style={{
                      borderColor: 'rgba(131,110,249,0.4)',
                      background: 'rgba(131,110,249,0.1)',
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div
                className="rounded-lg p-4 border overflow-x-auto"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <p className="text-xs font-light text-zinc-400 mb-3">Preview</p>
                <div className="text-xs">
                  <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${pricingTiers.length}, 1fr)` }}
                  >
                    {pricingTiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded border"
                        style={{
                          borderColor: 'rgba(131,110,249,0.3)',
                          background: 'rgba(131,110,249,0.05)',
                        }}
                      >
                        <p className="font-light text-zinc-300 mb-2">{tier.name}</p>
                        <p className="text-lg font-light text-bolty-300 mb-2">
                          ${tier.price || '0'}
                        </p>
                        <p className="text-zinc-600 text-xs mb-2">{tier.features || '—'}</p>
                        <p className="text-zinc-600 text-xs">
                          Up to {tier.users || '1'} user{parseInt(tier.users || '1') > 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowTiers(false)}
                className="w-full py-2 px-4 rounded-lg text-xs font-light border transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#e4e4e7',
                  background: 'transparent',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Integrations Modal */}
      {showIntegrations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="rounded-2xl border max-w-2xl w-full my-8"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="flex items-center justify-between p-4 border-b sticky top-0"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a12' }}
            >
              <h3 className="text-lg font-light text-zinc-100">Setup Integrations</h3>
              <button
                onClick={() => setShowIntegrations(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-zinc-600 mb-4">
                Connect your agent to external services for notifications and monitoring.
              </p>

              {[
                {
                  id: 'slack',
                  name: 'Slack',
                  description: 'Send agent notifications to Slack channels',
                  icon: '💬',
                },
                {
                  id: 'discord',
                  name: 'Discord',
                  description: 'Post agent events to Discord webhooks',
                  icon: '🎮',
                },
                {
                  id: 'webhook',
                  name: 'Custom Webhook',
                  description: 'Send data to your custom endpoint',
                  icon: '🔗',
                },
                {
                  id: 'email',
                  name: 'Email Alerts',
                  description: 'Receive email notifications on errors',
                  icon: '📧',
                },
                {
                  id: 'datadog',
                  name: 'Datadog',
                  description: 'Send metrics to Datadog monitoring',
                  icon: '📊',
                },
              ].map((integration) => (
                <div
                  key={integration.id}
                  className="rounded-lg p-4 border"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: integrations[integration.id]
                      ? 'rgba(131,110,249,0.3)'
                      : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{integration.icon}</span>
                        <p className="text-sm font-light text-zinc-300">{integration.name}</p>
                      </div>
                      <p className="text-xs text-zinc-600">{integration.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={integrations[integration.id]}
                      onChange={(e) => {
                        setIntegrations({
                          ...integrations,
                          [integration.id]: e.target.checked,
                        });
                      }}
                      className="mt-1"
                    />
                  </div>

                  {integrations[integration.id] && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                      {integration.id === 'slack' && (
                        <input
                          type="text"
                          placeholder="Slack webhook URL"
                          className="w-full text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700"
                        />
                      )}
                      {integration.id === 'discord' && (
                        <input
                          type="text"
                          placeholder="Discord webhook URL"
                          className="w-full text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700"
                        />
                      )}
                      {integration.id === 'webhook' && (
                        <input
                          type="text"
                          placeholder="Your endpoint URL"
                          className="w-full text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700"
                        />
                      )}
                      {integration.id === 'email' && (
                        <input
                          type="email"
                          placeholder="Email for alerts"
                          className="w-full text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700"
                        />
                      )}
                      {integration.id === 'datadog' && (
                        <input
                          type="text"
                          placeholder="Datadog API key"
                          className="w-full text-xs px-2 py-1 rounded bg-black/30 text-zinc-300 border border-zinc-700"
                        />
                      )}
                      <button className="text-xs px-2 py-1 rounded text-bolty-300 border border-bolty-500/20 hover:border-bolty-500/40 transition-all">
                        Test Connection
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => setShowIntegrations(false)}
                className="w-full py-2 px-4 rounded-lg text-xs font-light border transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#e4e4e7',
                  background: 'transparent',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Collaboration Modal */}
      {showTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl border max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="flex items-center justify-between p-4 border-b sticky top-0"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a12' }}
            >
              <h3 className="text-lg font-light text-zinc-100">Team Management</h3>
              <button
                onClick={() => {
                  setShowTeam(false);
                  setTeamEmail('');
                  setTeamRole('Editor');
                }}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-zinc-600">
                Share access with team members to collaborate on this agent.
              </p>

              {/* Invite Form */}
              <div
                className="rounded-lg p-4 border"
                style={{
                  background: 'rgba(131,110,249,0.05)',
                  borderColor: 'rgba(131,110,249,0.2)',
                }}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-light text-zinc-400 mb-2 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="colleague@company.com"
                      value={teamEmail}
                      onChange={(e) => setTeamEmail(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg font-light"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e4e4e7',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-light text-zinc-400 mb-2 block">Role</label>
                    <select
                      value={teamRole}
                      onChange={(e) => setTeamRole(e.target.value as any)}
                      className="w-full text-sm px-3 py-2 rounded-lg font-light"
                      style={{
                        background: 'rgba(15,15,24,0.8)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#e4e4e7',
                        outline: 'none',
                      }}
                    >
                      <option value="Viewer">Viewer - View only</option>
                      <option value="Editor">Editor - Full edit access</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (teamEmail.trim()) {
                        setTeamMembers([...teamMembers, { email: teamEmail, role: teamRole }]);
                        setTeamEmail('');
                        setTeamRole('Editor');
                      }
                    }}
                    disabled={!teamEmail.trim()}
                    className="w-full py-2 px-4 rounded-lg text-xs font-light transition-all disabled:opacity-40"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(131,110,249,0.4), rgba(99,102,241,0.3))',
                      border: '1px solid rgba(131,110,249,0.4)',
                      color: '#e2d9ff',
                    }}
                  >
                    + Add Team Member
                  </button>
                </div>
              </div>

              {/* Team Members List */}
              <div>
                <p className="text-xs font-light text-zinc-400 mb-3">
                  Team Members ({teamMembers.length})
                </p>
                <div className="space-y-2">
                  {teamMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-light"
                          style={{ background: 'rgba(131,110,249,0.2)' }}
                        >
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-light text-zinc-300">{member.email}</p>
                          <p className="text-xs text-zinc-600">{member.role}</p>
                        </div>
                      </div>
                      {idx > 0 && (
                        <button
                          onClick={() => {
                            setTeamMembers(teamMembers.filter((_, i) => i !== idx));
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-lg p-3 border"
                style={{
                  background: 'rgba(34,197,94,0.05)',
                  borderColor: 'rgba(34,197,94,0.2)',
                }}
              >
                <p className="text-xs font-light text-green-300">
                  ✨ Team members will receive an invitation email and can collaborate on this agent
                  after accepting.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowTeam(false);
                  setTeamEmail('');
                }}
                className="w-full py-2 px-4 rounded-lg text-xs font-light border transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#e4e4e7',
                  background: 'transparent',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="rounded-2xl border max-w-3xl w-full my-8"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="flex items-center justify-between p-4 border-b sticky top-0"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a12' }}
            >
              <h3 className="text-lg font-light text-zinc-100">Analytics Template</h3>
              <button
                onClick={() => setShowAnalytics(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-zinc-600">
                This is a preview of your agent analytics dashboard after deployment. Real data will
                populate here.
              </p>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Revenue',
                    value: `$${generateAnalyticsData(form.title).totalRevenue}`,
                    icon: '💰',
                  },
                  {
                    label: 'Requests',
                    value: generateAnalyticsData(form.title).requestsMonth.toLocaleString(),
                    icon: '📈',
                  },
                  {
                    label: 'Response Time',
                    value: `${generateAnalyticsData(form.title).avgResponseTime}ms`,
                    icon: '⚡',
                  },
                  {
                    label: 'Success Rate',
                    value: `${generateAnalyticsData(form.title).successRate.toFixed(1)}%`,
                    icon: '✅',
                  },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 border"
                    style={{
                      background: 'rgba(131,110,249,0.05)',
                      borderColor: 'rgba(131,110,249,0.2)',
                    }}
                  >
                    <p className="text-2xl mb-1">{metric.icon}</p>
                    <p className="text-xs text-zinc-600">{metric.label}</p>
                    <p className="text-sm font-light text-zinc-300 mt-1">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="space-y-4">
                {/* Requests Chart */}
                <div
                  className="rounded-lg p-4 border"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <p className="text-xs font-light text-zinc-400 mb-3">
                    Requests Over Last 30 Days
                  </p>
                  <div className="flex items-end gap-1 h-32">
                    {generateAnalyticsData(form.title)
                      .dailyRequests.slice(-30)
                      .map((data, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t transition-all hover:bg-bolty-500/50"
                          style={{
                            height: `${(data.requests / 80) * 100}%`,
                            background: 'rgba(131,110,249,0.4)',
                          }}
                          title={`Day ${data.day}: ${data.requests} requests`}
                        />
                      ))}
                  </div>
                </div>

                {/* Pricing Distribution */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="rounded-lg p-4 border"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <p className="text-xs font-light text-zinc-400 mb-3">Users by Tier</p>
                    <div className="space-y-2">
                      {Object.entries(generateAnalyticsData(form.title).pricingTiers).map(
                        ([tier, count]) => (
                          <div key={tier} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500">{tier}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-zinc-800">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${count}%`,
                                    background:
                                      tier === 'Enterprise'
                                        ? 'rgba(131,110,249,0.6)'
                                        : 'rgba(131,110,249,0.4)',
                                  }}
                                />
                              </div>
                              <span className="text-xs text-zinc-400 w-6">{count}%</span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div
                    className="rounded-lg p-4 border"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <p className="text-xs font-light text-zinc-400 mb-3">Top Integration</p>
                    <div className="space-y-3 mt-4">
                      <div>
                        <p className="text-sm text-zinc-300">
                          {generateAnalyticsData(form.title).topIntegration}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">Most used integration method</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-600">Active Users</p>
                        <p className="text-2xl font-light text-bolty-300">
                          {generateAnalyticsData(form.title).users}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="rounded-lg p-3 border"
                style={{
                  background: 'rgba(34,197,94,0.05)',
                  borderColor: 'rgba(34,197,94,0.2)',
                }}
              >
                <p className="text-xs font-light text-green-300">
                  ✨ Your analytics dashboard will be live immediately after deployment. Access it
                  from your agent settings.
                </p>
              </div>

              <button
                onClick={() => setShowAnalytics(false)}
                className="w-full py-2 px-4 rounded-lg text-xs font-light border transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#e4e4e7',
                  background: 'transparent',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Snippets Modal */}
      {showCodeSnippets && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl border max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="sticky top-0 flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a12' }}
            >
              <h3 className="text-lg font-light text-zinc-100">Integration Examples</h3>
              <button
                onClick={() => setShowCodeSnippets(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-zinc-600">
                Copy and paste these code examples to integrate your agent into your application.
              </p>

              {/* Snippet Selector */}
              <div className="flex gap-2">
                {(['python', 'javascript', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedSnippet(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-light border transition-all ${
                      selectedSnippet === lang
                        ? 'bg-bolty-500/20 border-bolty-500/40 text-bolty-300'
                        : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/20'
                    }`}
                  >
                    {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>

              {/* Code Block */}
              <CodeBlock
                code={codeSnippets[selectedSnippet](form.title || 'my-agent')}
                language={selectedSnippet}
              />

              <div
                className="rounded-lg p-3 border"
                style={{
                  background: 'rgba(131,110,249,0.05)',
                  borderColor: 'rgba(131,110,249,0.2)',
                }}
              >
                <p className="text-xs font-light text-zinc-300">
                  💡 Replace <code className="text-bolty-300">YOUR_API_KEY</code> with your actual
                  API key from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Docs Modal */}
      {showApiDocs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl border max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="sticky top-0 flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#0a0a12' }}
            >
              <h3 className="text-lg font-light text-zinc-100">OpenAPI Documentation</h3>
              <button
                onClick={() => setShowApiDocs(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-zinc-600 mb-4">
                Auto-generated API specification for your agent. This helps developers integrate
                with your agent.
              </p>
              <CodeBlock code={generateApiDocs(form)} />
            </div>
          </div>
        </div>
      )}

      {/* Sandbox Test Modal */}
      {showSandbox && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl border max-w-2xl w-full"
            style={{
              background: '#0a0a12',
              borderColor: 'rgba(131,110,249,0.2)',
            }}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <h3 className="text-lg font-light text-zinc-100">Test Agent in Sandbox</h3>
              <button
                onClick={() => {
                  setShowSandbox(false);
                  setSandboxInput('');
                  setSandboxResult(null);
                }}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-zinc-600">
                Test your agent with sample input before deploying to production.
              </p>

              <div>
                <label className="text-xs font-light text-zinc-400 mb-2 block">Test Input</label>
                <textarea
                  placeholder="Enter test input for your agent..."
                  value={sandboxInput}
                  onChange={(e) => setSandboxInput(e.target.value)}
                  rows={4}
                  className="w-full text-sm px-3 py-2 rounded-lg font-light resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e4e4e7',
                    outline: 'none',
                  }}
                />
              </div>

              {sandboxResult && (
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    background: sandboxResult.error
                      ? 'rgba(239,68,68,0.05)'
                      : 'rgba(34,197,94,0.05)',
                    borderColor: sandboxResult.error
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(34,197,94,0.2)',
                  }}
                >
                  <p className="text-xs font-light text-zinc-600 mb-2">Response:</p>
                  <p
                    className={`text-xs font-light whitespace-pre-wrap ${sandboxResult.error ? 'text-red-400' : 'text-green-400'}`}
                  >
                    {sandboxResult.error || sandboxResult.output}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={testAgent}
                  disabled={sandboxLoading || !sandboxInput.trim()}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-light transition-all disabled:opacity-40"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(131,110,249,0.4), rgba(99,102,241,0.3))',
                    border: '1px solid rgba(131,110,249,0.4)',
                    color: '#e2d9ff',
                  }}
                >
                  {sandboxLoading ? '🔄 Testing...' : '▶️ Test Agent'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSandbox(false);
                    setSandboxInput('');
                    setSandboxResult(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-light border transition-all"
                  style={{
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#e4e4e7',
                    background: 'transparent',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── SaaS chrome ────────────────────────────────────────────────────────────────

function AgentStat({
  icon,
  label,
  value,
  accent,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  delta: string;
}) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden group transition-all hover:border-white/20"
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-light"
          style={{ color: accent }}
        >
          <span
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}
          >
            {icon}
          </span>
          {label}
        </span>
      </div>
      <p className="text-xl font-light text-white">{value}</p>
      <p className="text-[11px] text-zinc-500 mt-1 font-light">{delta}</p>
    </div>
  );
}

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

function DeveloperQuickstart() {
  const [lang, setLang] = useState<'curl' | 'node' | 'python'>('node');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_SNIPPETS[lang]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden mb-6"
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        background:
          'linear-gradient(135deg, rgba(131,110,249,0.06) 0%, rgba(6,182,212,0.04) 100%), rgba(0,0,0,0.4)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr]">
        {/* Left: pitch */}
        <div className="p-5 md:p-6 border-b md:border-b-0 md:border-r border-white/8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{
                background: 'rgba(131,110,249,0.12)',
                border: '1px solid rgba(131,110,249,0.3)',
              }}
            >
              <Code2 className="w-3.5 h-3.5 text-purple-300" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-purple-300/80 font-light">
              Quickstart
            </span>
          </div>
          <h3 className="text-lg text-white font-light mb-2">Invoke any agent in &lt; 30s</h3>
          <p className="text-xs text-zinc-400 font-light leading-relaxed mb-4">
            Every agent ships with a signed HTTPS endpoint. Grab an API key, drop in the snippet,
            ship. Full typed SDKs for Node, Python, and Go.
          </p>
          <div className="flex flex-col gap-1.5 text-[11px] text-zinc-400 font-light">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Signed, auditable requests
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Streaming + async modes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Pay-per-call on-chain escrow
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Link
              href="/api-keys"
              className="inline-flex items-center gap-1.5 text-[11px] text-purple-300 hover:text-purple-200 transition-colors"
            >
              <Key className="w-3 h-3" /> Get API key
              <ArrowUpRight className="w-3 h-3" />
            </Link>
            <span className="text-zinc-700">·</span>
            <Link
              href="/docs/agent-api"
              className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Terminal className="w-3 h-3" /> Read docs
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right: code */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-2">
            <div className="relative flex gap-1">
              {(['node', 'python', 'curl'] as const).map((l) => {
                const active = lang === l;
                return (
                  <motion.button
                    key={l}
                    onClick={() => setLang(l)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                    className={`relative text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded transition-colors ${
                      active ? 'text-purple-200' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="market-agents-lang-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        aria-hidden="true"
                        className="absolute inset-0 rounded"
                        style={{
                          background: 'rgba(131,110,249,0.1)',
                          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
                        }}
                      />
                    )}
                    <span className="relative">{l}</span>
                  </motion.button>
                );
              })}
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
          <pre
            className="flex-1 text-[11.5px] leading-relaxed font-mono text-zinc-300 p-4 overflow-x-auto"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <code>{AGENT_SNIPPETS[lang]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#000' }} />}>
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
  const [negotiateTarget, setNegotiateTarget] = useState<MarketListing | null>(null);
  const [negotiateStarting, setNegotiateStarting] = useState(false);
  const [type, setType] = useState('AI_AGENT');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [negotiatingListing, setNegotiatingListing] = useState<MarketListing | null>(null);
  const [initialNegId, setInitialNegId] = useState<string | null>(null);
  const [asAgentId, setAsAgentId] = useState<string | null>(null);
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
    if (isMobile()) {
      setMobileBlock(true);
      return;
    }
    router.push('/market/agents/publish');
  };

  // Sync tab to URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'mine') setActiveTab('mine');
    else setActiveTab('market');
  }, [searchParams]);

  // Open deploy form when other pages redirect with ?new=1 — unless the
  // user is on mobile, in which case we show the desktop-only notice.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (searchParams.get('new') === '1') {
      if (isMobile()) {
        setMobileBlock(true);
        return;
      }
      setActiveTab('mine');
      setShowCreate(true);
    }
  }, [searchParams, isAuthenticated]);

  // Open negotiation modal when a deep link lands here with
  // ?negotiate=<listingId> (and optionally &negId=<negId> so sellers
  // opening from a notification see the exact existing negotiation).
  useEffect(() => {
    const negotiateId = searchParams.get('negotiate');
    const negIdParam = searchParams.get('negId');
    const asAgentParam = searchParams.get('asAgent');
    if (!negotiateId || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<MarketListing>(`/market/${negotiateId}`);
        if (!cancelled) {
          setInitialNegId(negIdParam);
          setAsAgentId(asAgentParam);
          setNegotiatingListing(data);
        }
      } catch {
        /* listing missing — ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, isAuthenticated]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (type !== 'ALL') params.set('type', type);
      if (search) params.set('search', search);
      const data = await api.get<{ data: MarketListing[] }>(`/market?${params}`);
      setListings(data.data);
    } catch {
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [type, search]);

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
    <div className="mk-agents-page">
      {/* Minimal header: breadcrumb + Deploy CTA */}
      <div className="mk-agents-head">
        <div>
          <div className="mk-breadcrumb">
            <Link href="/market" className="mk-breadcrumb__link">
              Market
            </Link>
            <span className="mk-breadcrumb__sep">/</span>
            <span>Agents</span>
          </div>
          <h1 className="mk-agents-title">Agents</h1>
        </div>
        {isAuthenticated && (
          <button
            type="button"
            onClick={attemptDeploy}
            className="mk-wizard__primary mk-agents-head__cta"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Deploy agent
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mk-agents-tabs">
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
              className={`mk-agents-tab ${active ? 'mk-agents-tab--active' : ''}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Marketplace tab ── */}
      {activeTab === 'market' && (
        <>
          {/* Search + filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full pl-9 pr-16"
              />
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center px-1.5 py-0.5 bg-zinc-800/60 rounded text-[10px] font-mono text-zinc-500 border border-zinc-700/60">
                  /
                </kbd>
              )}
            </div>
            <div className="relative flex gap-1.5 flex-wrap">
              {TYPES.map((t) => {
                const active = type === t;
                return (
                  <motion.button
                    key={t}
                    onClick={() => setType(t)}
                    whileTap={{ scale: 0.96 }}
                    whileHover={active ? undefined : { y: -1 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                    className={`relative text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      active ? 'text-bolty-300' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="market-agents-type-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background:
                            'linear-gradient(180deg, rgba(131,110,249,0.2) 0%, rgba(131,110,249,0.06) 100%)',
                          boxShadow:
                            'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
                        }}
                      />
                    )}
                    <span className="relative">{TYPE_LABELS[t]}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-52 rounded-xl" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div
              className="relative rounded-2xl px-8 py-16 text-center overflow-hidden"
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
                <Bot className="w-7 h-7 text-purple-300" strokeWidth={1.5} />
              </div>
              <p className="text-white font-light text-base">No agents found</p>
              <p className="text-sm text-zinc-500 font-light mt-2 max-w-sm mx-auto">
                Try adjusting your filters or check back soon — new agents deploy every day.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l, idx) => (
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
            <div className={showCreate ? 'mk-agents-split' : ''}>
              {/* Left column: deploy form */}
              {showCreate && (
                <aside className="mk-agents-split__form">
                  <CreateListingForm
                    onCreated={(l) => {
                      setMyListings((p) => [l, ...p]);
                      setShowCreate(false);
                    }}
                    onCancel={() => setShowCreate(false)}
                  />
                </aside>
              )}

              {/* Right column: listings */}
              <section className="mk-agents-split__list">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12.5px] text-zinc-500">
                    {myListings.length} agent{myListings.length !== 1 ? 's' : ''} published
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreate((p) => !p)}
                    className={showCreate ? 'mk-wizard__secondary' : 'mk-wizard__primary'}
                    style={{ flex: '0 0 auto', height: 32, padding: '0 12px', fontSize: 12 }}
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    {showCreate ? 'Close form' : 'Deploy new'}
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
                    {!showCreate && (
                      <button
                        type="button"
                        onClick={attemptDeploy}
                        className="mk-wizard__primary inline-flex mt-3 max-w-fit"
                        style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        Deploy your first agent
                      </button>
                    )}
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

      {/* Negotiation modal (accessible via URL ?negotiate=id for existing negotiations) */}
      {negotiatingListing && user && (
        <NegotiationModal
          listing={negotiatingListing}
          onClose={() => {
            setNegotiatingListing(null);
            setInitialNegId(null);
            setAsAgentId(null);
          }}
          userId={user.id}
          initialNegotiationId={initialNegId}
          buyerAgentListingId={asAgentId}
        />
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
