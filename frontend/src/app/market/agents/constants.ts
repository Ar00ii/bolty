/**
 * Constants for the Agents marketplace
 */

export const TYPES = ['ALL', 'AI_AGENT', 'BOT', 'SCRIPT', 'OTHER'];

export const TYPE_LABELS: Record<string, string> = {
  ALL: 'all',
  AI_AGENT: 'ai agent',
  BOT: 'bot',
  SCRIPT: 'script',
  OTHER: 'other',
};

export const TYPE_COLORS: Record<string, string> = {
  BOT: 'text-atlas-400/80 border-atlas-400/25 bg-atlas-400/5',
  AI_AGENT: 'text-atlas-400/70 border-atlas-400/20 bg-atlas-400/5',
  SCRIPT: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
  OTHER: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
};

export const ACCEPTS_FILE = new Set(['AI_AGENT', 'BOT', 'SCRIPT', 'OTHER']);
export const ACCEPTS_AGENT_ENDPOINT = new Set(['AI_AGENT', 'BOT']);

export const AGENT_CATEGORIES = {
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

export const PRICING_TIERS = [
  { label: 'Free', value: '0', description: 'No cost' },
  { label: 'Pay-per-use', value: 'usage', description: 'Based on usage' },
  { label: 'Fixed Price', value: 'fixed', description: 'One-time payment' },
  { label: 'Subscription', value: 'subscription', description: 'Recurring payment' },
];

export const AGENT_TYPE_INFO: Record<string, { description: string; examples: string[] }> = {
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
