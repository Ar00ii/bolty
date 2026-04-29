/**
 * Canonical listing-type metadata: icon, accent, label.
 *
 * Previously each page (/market, /market/library, /orders, the
 * command palette) defined its own TYPE_ICON map. They drifted —
 * REPO had three different colors depending on the page. Single
 * source of truth lives here; new pages pull from this module.
 */

import { Braces, Cpu, GitBranch, Package, Terminal, type LucideIcon } from 'lucide-react';

export type ListingType = 'REPO' | 'BOT' | 'SCRIPT' | 'AI_AGENT' | 'OTHER';

export const LISTING_TYPE_ICON: Record<ListingType, LucideIcon> = {
  REPO: GitBranch,
  BOT: Terminal,
  AI_AGENT: Cpu,
  SCRIPT: Braces,
  OTHER: Package,
};

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  REPO: 'Repo',
  BOT: 'Bot',
  AI_AGENT: 'Agent',
  SCRIPT: 'Script',
  OTHER: 'Other',
};

export const LISTING_TYPE_ACCENT: Record<ListingType, string> = {
  REPO: '#06B6D4',
  BOT: '#14F195',
  AI_AGENT: '#14F195',
  SCRIPT: '#EC4899',
  OTHER: '#94a3b8',
};

export function listingIcon(type: string | null | undefined): LucideIcon {
  if (!type) return Package;
  return LISTING_TYPE_ICON[type.toUpperCase() as ListingType] ?? Package;
}

export function listingAccent(type: string | null | undefined): string {
  if (!type) return LISTING_TYPE_ACCENT.OTHER;
  return LISTING_TYPE_ACCENT[type.toUpperCase() as ListingType] ?? LISTING_TYPE_ACCENT.OTHER;
}

export function listingLabel(type: string | null | undefined): string {
  if (!type) return 'Other';
  return LISTING_TYPE_LABEL[type.toUpperCase() as ListingType] ?? 'Other';
}
