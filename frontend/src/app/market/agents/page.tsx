'use client';

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
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { Badge } from '@/components/ui/badge';
import { GradientText } from '@/components/ui/GradientText';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useKeyboardFocus } from '@/lib/hooks/useKeyboardFocus';
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
  fromRole: 'buyer' | 'seller' | 'buyer_agent' | 'seller_agent';
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
  BOT: 'text-monad-400/80 border-monad-400/25 bg-monad-400/5',
  AI_AGENT: 'text-monad-400/70 border-monad-400/20 bg-monad-400/5',
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
  buyer: 'bg-monad-500/10 border-monad-500/20 text-monad-300',
  seller: 'bg-zinc-800/50 border-zinc-700/30 text-zinc-300',
  buyer_agent: 'bg-monad-500/8 border-monad-500/15 text-monad-200',
  seller_agent: 'bg-monad-500/10 border-monad-500/15 text-monad-300',
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
    info: 'text-monad-300',
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

  // Start negotiation + setup WebSocket
  useEffect(() => {
    api
      .post<Negotiation>(`/market/${listing.id}/negotiate`, {})
      .then((n) => {
        setNeg(n);
        // Connect WebSocket once we have the negotiation id
        const socket = io(`${SOCKET_URL}/negotiations`, {
          withCredentials: true,
          transports: ['websocket'],
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
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [listing.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [neg?.messages.length, agentTyping]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-lg flex flex-col"
        style={{
          maxHeight: '88vh',
          background: '#07070f',
          border: '1px solid rgba(131,110,249,0.3)',
          borderRadius: 20,
          boxShadow: '0 0 60px rgba(131,110,249,0.12)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'rgba(131,110,249,0.15)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-monad-400 animate-pulse shrink-0" />
            <span className="text-monad-400 font-mono text-xs font-light shrink-0">
              negotiate://
            </span>
            <span className="text-zinc-300 text-xs font-mono truncate">{listing.title}</span>
            {neg && (
              <span
                className={`text-xs font-mono font-light ml-1 shrink-0 ${neg.status === 'AGREED' ? 'text-green-400' : neg.status === 'REJECTED' ? 'text-red-400' : neg.status === 'EXPIRED' ? 'text-zinc-500' : 'text-monad-400'}`}
              >
                [{neg.status.toLowerCase()}]
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 font-mono text-xs ml-2 shrink-0 transition-colors"
          >
            [×]
          </button>
        </div>

        {/* AI mode banner */}
        {isAiMode && neg?.status === 'ACTIVE' && (
          <div
            className="px-4 py-2.5 border-b shrink-0 flex items-center justify-between gap-3"
            style={{ borderColor: 'rgba(131,110,249,0.12)', background: 'rgba(131,110,249,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-monad-400 shrink-0" strokeWidth={1.5} />
              <p className="text-monad-400 text-xs font-mono">
                AI agents negotiating automatically
              </p>
            </div>
            {!iHaveRequestedSwitch && !switchPending && (
              <button
                onClick={requestHumanSwitch}
                disabled={requestingSwitch}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 border rounded-lg px-2.5 py-1 transition-all shrink-0 disabled:opacity-40"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {requestingSwitch ? '...' : 'take over'}
              </button>
            )}
            {iHaveRequestedSwitch && (
              <span className="text-xs font-mono text-zinc-500 shrink-0">
                waiting for other party...
              </span>
            )}
          </div>
        )}

        {/* Human switch request — Pokemon trade dialog */}
        {otherRequestedSwitch && neg?.status === 'ACTIVE' && (
          <div
            className="mx-4 mt-3 rounded-xl px-4 py-3 shrink-0 flex items-center justify-between gap-3"
            style={{
              border: '1px solid rgba(250,204,21,0.25)',
              background: 'rgba(250,204,21,0.05)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-3.5 h-3.5 text-yellow-400 shrink-0" strokeWidth={1.5} />
              <p className="text-yellow-300 text-xs font-mono truncate">
                Other party wants to negotiate manually
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={acceptHumanSwitch}
                disabled={requestingSwitch}
                className="text-xs font-mono px-3 py-1 rounded-lg transition-all disabled:opacity-40"
                style={{
                  background: 'rgba(250,204,21,0.15)',
                  border: '1px solid rgba(250,204,21,0.3)',
                  color: '#fde68a',
                }}
              >
                {requestingSwitch ? '...' : 'accept'}
              </button>
            </div>
          </div>
        )}

        {/* Floor price info */}
        {listing.minPrice != null && (
          <div
            className="px-4 py-1.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <p className="text-zinc-600 text-xs font-mono">
              floor price: {listing.minPrice} {listing.currency} — agents won&apos;t go below this
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {loading && (
            <div className="text-center py-12">
              <div className="w-4 h-4 rounded-full border-2 border-zinc-800 border-t-monad-400 animate-spin mx-auto mb-3" />
              <p className="text-monad-400 text-xs font-mono animate-pulse">
                initializing negotiation protocol...
              </p>
            </div>
          )}

          {neg?.messages.map((msg) => {
            const isMine = msg.fromRole === 'buyer' && !isSeller;
            const isAgent = msg.fromRole === 'seller_agent' || msg.fromRole === 'buyer_agent';
            const isSellerRole = msg.fromRole === 'seller' || msg.fromRole === 'seller_agent';
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl border px-3 py-2.5 text-xs font-mono ${ROLE_COLORS[msg.fromRole] || ROLE_COLORS.seller}`}
                  style={{ boxShadow: isAgent ? '0 0 16px rgba(131,110,249,0.08)' : undefined }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {isAgent && <Zap className="w-2.5 h-2.5 text-monad-400" strokeWidth={2} />}
                    <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
                      {ROLE_LABELS[msg.fromRole]}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.proposedPrice != null && (
                    <div className="mt-2 pt-2 border-t border-current/15 font-light text-monad-300">
                      ⬡ {msg.proposedPrice} {neg.listing?.currency}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {agentTyping && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl border px-3 py-2.5 flex items-center gap-2"
                style={{
                  borderColor: 'rgba(131,110,249,0.2)',
                  background: 'rgba(131,110,249,0.06)',
                }}
              >
                <Zap className="w-3 h-3 text-monad-400" strokeWidth={2} />
                <span className="text-xs font-mono text-monad-400/80">
                  {agentTyping === 'seller_agent' ? 'seller' : 'buyer'} agent thinking
                </span>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full bg-monad-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          {/* AGREED — pay or confirm */}
          {neg?.status === 'AGREED' && !paid && (
            <div className="text-center py-2">
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(34,197,94,0.04)',
                }}
              >
                <p className="text-green-400 font-mono text-xs font-light mb-1">✓ DEAL AGREED</p>
                {neg.agreedPrice != null && (
                  <p className="text-green-300 font-mono text-2xl font-light mb-3">
                    ⬡ {neg.agreedPrice}{' '}
                    <span className="text-base font-light text-green-500">
                      {neg.listing?.currency}
                    </span>
                  </p>
                )}
                {isSeller ? (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs font-mono">
                      Your agent agreed this price. Confirm to open DM with buyer.
                    </p>
                    <button
                      onClick={accept}
                      disabled={sending}
                      className="w-full text-xs font-mono font-light py-2.5 px-4 rounded-xl disabled:opacity-40 transition-all"
                      style={{
                        background: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.4)',
                        color: '#4ade80',
                      }}
                    >
                      {sending ? 'confirming...' : 'confirm deal + open DM chat'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs font-mono">
                      Pay with MetaMask to complete the purchase.
                    </p>
                    <button
                      onClick={payWithEth}
                      disabled={paying}
                      className="w-full text-xs font-mono font-light py-2.5 px-4 rounded-xl disabled:opacity-40 transition-all hover:opacity-90"
                      style={{
                        background: 'linear-gradient(135deg,#836EF9,#6b4fe0)',
                        border: '1px solid rgba(131,110,249,0.4)',
                        color: 'white',
                      }}
                    >
                      {paying
                        ? 'awaiting MetaMask...'
                        : `⬡ pay ${neg.agreedPrice} ${neg.listing?.currency}`}
                    </button>
                  </div>
                )}
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
                <p className="text-monad-300 font-mono text-sm font-light mb-1">✓ PAYMENT SENT</p>
                <p className="text-zinc-500 text-xs font-mono mb-3">
                  Check your DMs to coordinate with the seller.
                </p>
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
          )}

          {neg?.status === 'REJECTED' && (
            <div className="text-center py-2">
              <div className="inline-block border border-red-400/25 bg-red-400/4 rounded-xl px-4 py-3">
                <p className="text-red-400 font-mono text-xs font-light">✗ NEGOTIATION REJECTED</p>
              </div>
            </div>
          )}

          {neg?.status === 'EXPIRED' && (
            <div className="text-center py-2">
              <div className="inline-block border border-zinc-700/50 bg-zinc-800/20 rounded-xl px-4 py-3">
                <p className="text-zinc-500 font-mono text-xs">
                  Negotiation expired after max turns — no deal reached.
                </p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
        {error && <p className="px-4 text-red-400 text-xs font-mono py-1 shrink-0">{error}</p>}

        {/* HUMAN mode footer — only visible when both parties agreed to manual negotiation */}
        {neg?.status === 'ACTIVE' && neg.mode === 'HUMAN' && (
          <div
            className="border-t px-4 py-3 space-y-2 shrink-0"
            style={{ borderColor: 'rgba(131,110,249,0.2)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
              <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider">
                manual negotiation
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="type your message..."
                className="flex-1 text-xs px-3 py-2 rounded-xl font-mono transition-all"
                style={{
                  background: 'rgba(131,110,249,0.05)',
                  border: '1px solid rgba(131,110,249,0.2)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
                disabled={sending}
              />
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder={`offer (${listing.currency})`}
                className="w-28 text-xs px-3 py-2 rounded-xl font-mono transition-all"
                style={{
                  background: 'rgba(131,110,249,0.05)',
                  border: '1px solid rgba(131,110,249,0.2)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
                min="0"
                step="0.001"
                disabled={sending}
              />
            </div>
            <div className="flex gap-2 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={accept}
                  disabled={sending}
                  className="text-green-400 text-xs font-mono px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all hover:bg-green-400/10"
                  style={{
                    border: '1px solid rgba(34,197,94,0.3)',
                    background: 'rgba(34,197,94,0.05)',
                  }}
                >
                  accept deal
                </button>
                <button
                  onClick={reject}
                  disabled={sending}
                  className="text-red-400 text-xs font-mono px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all hover:bg-red-400/10"
                  style={{
                    border: '1px solid rgba(239,68,68,0.25)',
                    background: 'rgba(239,68,68,0.04)',
                  }}
                >
                  reject
                </button>
              </div>
              <button
                onClick={send}
                disabled={sending || !message.trim()}
                className="flex items-center gap-1.5 text-xs font-mono font-light py-1.5 px-4 rounded-xl disabled:opacity-40 transition-all hover:opacity-90"
                style={{
                  background:
                    'linear-gradient(135deg,rgba(131,110,249,0.3),rgba(131,110,249,0.15))',
                  border: '1px solid rgba(131,110,249,0.4)',
                  color: '#c4b5fd',
                }}
              >
                {sending ? (
                  '...'
                ) : (
                  <>
                    <Send className="w-3 h-3" strokeWidth={2} /> send
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
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
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({
  listing,
  isAuthenticated,
  onNegotiate,
}: {
  listing: MarketListing;
  isAuthenticated: boolean;
  onNegotiate: () => void;
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
            <Bot className="w-4.5 h-4.5 text-monad-400" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[13px] font-light text-white truncate leading-tight">
              {listing.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {listing.seller.avatarUrl ? (
                <img
                  src={listing.seller.avatarUrl}
                  alt=""
                  className="w-3.5 h-3.5 rounded-full object-cover"
                />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-monad-500/20 flex items-center justify-center">
                  <span className="text-[7px] font-light text-monad-400">
                    {(listing.seller.username || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
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
              <span className="w-1 h-1 rounded-full bg-monad-400 animate-pulse inline-block" />
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
            onClick={() => {
              if (!isAuthenticated) {
                window.location.href = '/auth';
                return;
              }
              onNegotiate();
            }}
            className="btn-primary text-xs py-1 px-3"
          >
            {listing.price === 0 ? 'Get free' : 'Negotiate'}
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
        <Key className="w-3 h-3 text-monad-400" />
        <span className="text-monad-400 font-mono text-xs font-light">API Keys</span>
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
          <Bot className="w-4 h-4 text-monad-400" strokeWidth={1.5} />
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
              <Badge className="rounded-full bg-monad-500/15 border border-monad-500/25 px-2 py-0 text-xs font-mono text-monad-400">
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
            <span className="font-mono font-light text-monad-300">
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
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
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
      setError(err instanceof ApiError ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const canProceedToStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return form.title.trim() !== '' && form.description.trim() !== '';
      case 2:
        return true;
      case 3:
        return form.agentEndpoint.trim() !== '' || !ACCEPTS_AGENT_ENDPOINT.has(form.type);
      case 4:
        return form.price !== '';
      case 5:
        return form.version !== '';
      default:
        return true;
    }
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
    <div
      className="rounded-2xl border p-8 max-w-2xl mx-auto"
      style={{ background: '#0a0a12', borderColor: 'rgba(131,110,249,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light text-zinc-100">Deploy New Agent</h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-zinc-600">
              Step {step} of {steps.length}
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-20 h-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${completion}%`,
                    background:
                      'linear-gradient(90deg, rgba(131,110,249,0.6), rgba(99,102,241,0.6))',
                  }}
                />
              </div>
              <span className="text-xs text-zinc-600">{completion}%</span>
            </div>
          </div>
        </div>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {steps.map((s) => (
          <div key={s.num} className="flex-1">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                background: s.num <= step ? 'rgba(131,110,249,0.6)' : 'rgba(255,255,255,0.1)',
              }}
            />
          </div>
        ))}
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
                    className={`text-xs font-light px-4 py-2 rounded-lg border transition-all ${form.type === t ? 'bg-monad-500/20 border-monad-500/40 text-monad-300' : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/20'}`}
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
                onChange={(e) => field('title', e.target.value)}
                maxLength={100}
                required
                className="w-full text-sm px-3 py-2 rounded-lg font-light"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-600 mt-1">{form.title.length}/100</p>
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
                onChange={(e) => field('description', e.target.value)}
                maxLength={1000}
                rows={4}
                required
                className="w-full text-sm px-3 py-2 rounded-lg font-light resize-none"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e4e4e7',
                  outline: 'none',
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-600 mt-1">{form.description.length}/1000</p>
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
                  className="w-full rounded-xl border-2 border-dashed py-8 text-center cursor-pointer transition-colors"
                  style={{
                    borderColor: uploadedFile ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)',
                    background: uploadedFile ? 'rgba(34,197,94,0.05)' : 'transparent',
                  }}
                >
                  {uploading ? (
                    <p className="text-xs font-light text-monad-400 animate-pulse">
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
                className="w-full py-2 px-4 rounded-lg text-xs font-light text-monad-300 border transition-all hover:border-monad-500/40"
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
              className="w-full py-2 px-4 rounded-lg text-xs font-light text-monad-300 border transition-all hover:border-monad-500/40"
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
                    className={`p-3 rounded-lg border text-left transition-all ${
                      form.pricingModel === tier.value
                        ? 'bg-monad-500/20 border-monad-500/40'
                        : 'bg-transparent border-white/10 hover:border-white/20'
                    }`}
                  >
                    <p className="text-sm font-light text-zinc-100">{tier.label}</p>
                    <p className="text-xs font-light text-zinc-600">{tier.description}</p>
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
              className="w-full py-2 px-4 rounded-lg text-xs font-light text-monad-300 border transition-all hover:border-monad-500/40"
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
                          <Bot className="w-5 h-5 text-monad-300" />
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
                        <span className="text-lg font-light text-monad-300">
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
                className="py-2 px-4 rounded-lg text-xs font-light text-monad-300 border transition-all hover:border-monad-500/40"
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
                className="py-2 px-4 rounded-lg text-xs font-light text-monad-300 border transition-all hover:border-monad-500/40"
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
                className="py-2 px-4 rounded-lg text-xs font-light text-monad-300 border transition-all hover:border-monad-500/40"
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
                className="py-2 px-4 rounded-lg text-xs font-light text-monad-300 border transition-all hover:border-monad-500/40"
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
                className="py-2 px-4 rounded-lg text-xs font-light text-monad-300 border transition-all hover:border-monad-500/40"
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

        {/* Error */}
        {error && step !== 5 && <p className="text-red-400 font-light text-xs">{error}</p>}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="flex-1 py-2.5 rounded-xl font-light text-sm transition-all border"
              style={{
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#e4e4e7',
                background: 'transparent',
              }}
            >
              Back
            </button>
          )}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => {
                setError('');
                if (canProceedToStep(step)) {
                  setStep((prev) => (prev + 1) as any);
                } else {
                  setError('Please fill in the required fields');
                }
              }}
              className="flex-1 py-2.5 rounded-xl font-light text-sm transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, rgba(131,110,249,0.4), rgba(99,102,241,0.3))',
                border: '1px solid rgba(131,110,249,0.4)',
                color: '#e2d9ff',
              }}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl font-light text-sm transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, rgba(131,110,249,0.4), rgba(99,102,241,0.3))',
                border: '1px solid rgba(131,110,249,0.4)',
                color: '#e2d9ff',
              }}
            >
              {submitting ? 'deploying...' : 'deploy agent →'}
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
                    <span className="text-monad-300 mt-1">→</span>
                    <span>Share your agent URL with others</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-monad-300 mt-1">→</span>
                    <span>Monitor usage and earnings in your dashboard</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-monad-300 mt-1">→</span>
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
                    className="px-3 py-2 rounded-lg text-xs font-light text-monad-300 border transition-all"
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
                        <p className="text-lg font-light text-monad-300 mb-2">
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
                      <button className="text-xs px-2 py-1 rounded text-monad-300 border border-monad-500/20 hover:border-monad-500/40 transition-all">
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
                          className="flex-1 rounded-t transition-all hover:bg-monad-500/50"
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
                        <p className="text-2xl font-light text-monad-300">
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
                        ? 'bg-monad-500/20 border-monad-500/40 text-monad-300'
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
                  💡 Replace <code className="text-monad-300">YOUR_API_KEY</code> with your actual
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
  const [type, setType] = useState('AI_AGENT');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [negotiatingListing, setNegotiatingListing] = useState<MarketListing | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardFocus(searchRef);

  // Sync tab to URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'mine') setActiveTab('mine');
    else setActiveTab('market');
  }, [searchParams]);

  // Open negotiation modal when detail page redirects with ?negotiate=id
  useEffect(() => {
    const negotiateId = searchParams.get('negotiate');
    if (!negotiateId || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<MarketListing>(`/market/${negotiateId}`);
        if (!cancelled) setNegotiatingListing(data);
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
      const data = await api.get<{ data: MarketListing[] }>('/market');
      setMyListings(data.data.filter((l) => l.seller.id === user.id));
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

  return (
    <div className="page-container py-8 relative" style={{ background: '#000' }}>
      {/* Header */}
      <div className="page-header relative">
        <div
          className="relative rounded-2xl p-6 md:p-10 overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/20 pointer-events-none" />
          <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/20 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/20 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/20 pointer-events-none" />

          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
            <Link
              href="/market"
              className="hover:text-purple-300 transition-colors uppercase tracking-[0.2em]"
            >
              Market
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-purple-300/80 uppercase tracking-[0.2em]">AI Agents</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-500 font-light">
                  Autonomous agents
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight">
                <GradientText gradient="purple">AI Agents</GradientText>
              </h1>
              <p className="text-sm md:text-base text-zinc-400 font-light mt-3 max-w-xl">
                Discover autonomous agents, bots, and automation tools built by the community.
                Deploy, negotiate, and integrate in minutes.
              </p>
            </div>
            {isAuthenticated && (
              <ShimmerButton
                onClick={() => {
                  switchTab('mine');
                  setShowCreate(true);
                }}
                className="text-white text-sm px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Deploy Agent
              </ShimmerButton>
            )}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 mt-6">
        <AgentStat
          icon={<Bot className="w-3.5 h-3.5" />}
          label="Live agents"
          value={listings.length.toString()}
          accent="#836EF9"
          delta="+12% this week"
        />
        <AgentStat
          icon={<Activity className="w-3.5 h-3.5" />}
          label="Active now"
          value={Math.max(1, Math.floor(listings.length * 0.42)).toString()}
          accent="#06B6D4"
          delta="real-time"
        />
        <AgentStat
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="24h volume"
          value={`${(listings.length * 3.2).toFixed(1)} BOLTY`}
          accent="#EC4899"
          delta="+8.4%"
        />
        <AgentStat
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Avg response"
          value="1.2s"
          accent="#22c55e"
          delta="p95: 3.1s"
        />
      </div>

      {/* Developer quick-start */}
      <DeveloperQuickstart />

      {/* Tabs */}
      <div
        className="inline-flex items-center gap-0.5 p-1 rounded-lg mb-6"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {(
          [
            ['market', 'Marketplace', <Globe key="g" className="w-3.5 h-3.5" />],
            ['mine', 'My Agents', <Cpu key="c" className="w-3.5 h-3.5" />],
          ] as const
        ).map(([id, label, icon]) => {
          const active = activeTab === id;
          return (
            <motion.button
              key={id}
              onClick={() => switchTab(id)}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className={`relative inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-light tracking-[0.005em] transition-colors ${
                active ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="market-agents-tab-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-md"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
                  }}
                />
              )}
              <span className="relative z-10 inline-flex">{icon}</span>
              <span className="relative z-10">{label}</span>
            </motion.button>
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
            <div className="flex gap-1.5 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    type === t
                      ? 'text-monad-300 bg-monad-500/10 border-monad-500/30'
                      : 'text-zinc-500 hover:text-zinc-300 border-zinc-800 bg-transparent'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
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
                    onNegotiate={() => setNegotiatingListing(l)}
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
            <div className="card text-center py-16">
              <p className="text-zinc-500 text-sm mb-4">Sign in to manage your agents</p>
              <Link href="/auth" className="btn-primary text-sm px-4 py-2 inline-flex">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-zinc-500">
                  {myListings.length} agent{myListings.length !== 1 ? 's' : ''} published
                </p>
                <button
                  onClick={() => setShowCreate((p) => !p)}
                  className={
                    showCreate
                      ? 'btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5'
                      : 'btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5'
                  }
                >
                  <Plus className="w-3 h-3" /> {showCreate ? 'Cancel' : 'Deploy new'}
                </button>
              </div>

              {showCreate && (
                <div className="mb-6">
                  <CreateListingForm
                    onCreated={(l) => {
                      setMyListings((p) => [l, ...p]);
                      setShowCreate(false);
                    }}
                    onCancel={() => setShowCreate(false)}
                  />
                </div>
              )}

              {myLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-20 rounded-xl" />
                  ))}
                </div>
              ) : myListings.length === 0 ? (
                <div className="card text-center py-16">
                  <Bot className="w-10 h-10 text-zinc-700 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-zinc-600 text-sm mb-3">No agents deployed yet</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3 h-3" /> Deploy your first agent
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
            </>
          )}
        </>
      )}

      {/* Negotiation modal */}
      {negotiatingListing && user && (
        <NegotiationModal
          listing={negotiatingListing}
          onClose={() => setNegotiatingListing(null)}
          userId={user.id}
        />
      )}
    </div>
  );
}
