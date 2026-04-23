/**
 * Type definitions for the Agents marketplace
 */

export interface MarketListing {
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
}

export interface ApiKeyInfo {
  id: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface NegotiationMessage {
  id: string;
  createdAt: string;
  fromRole: 'buyer' | 'seller' | 'buyer_agent' | 'seller_agent';
  content: string;
  proposedPrice?: number | null;
}

export interface Negotiation {
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

export interface UploadedFileMeta {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  scanPassed?: boolean;
  scanNote?: string;
}

export interface SecurityScan {
  passed: boolean;
  score: number;
  issues: { severity: 'critical' | 'high' | 'medium' | 'low'; message: string }[];
}

export interface AgentFormData {
  title: string;
  description: string;
  type: 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';
  category?: string;
  subcategory?: string;
  tags: string[];
  price: number;
  minPrice?: number;
  agentEndpoint?: string;
  pricingModel?: string;
}
