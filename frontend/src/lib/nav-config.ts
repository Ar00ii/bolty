/**
 * Single source of truth for navigation across the app.
 *
 * Three consumers, three curated views of the same data:
 *
 *  - `MAIN_NAV`     — full sectioned tree used by `StandardSidebar` (desktop)
 *                     and `PowerNavbar` mobile drawer (≤lg).
 *  - `MOBILE_TABS`  — flat 5-tab bottom bar (`MobileTabBar`).
 *  - `PUBLIC_NAV`   — short top-of-page links for unauthenticated marketing
 *                     pages (`UnifiedHeader`).
 *
 * To add a destination, edit MAIN_NAV here. Decide whether it should also
 * appear in MOBILE_TABS (top-level mobile reach) or PUBLIC_NAV (marketing).
 */
import {
  Bell,
  BookOpen,
  Bot,
  FileText,
  GitBranch,
  Heart,
  LayoutGrid,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Trophy,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface NavChild {
  label: string;
  icon?: LucideIcon;
  href: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  count?: number;
  badge?: string;
  hot?: boolean;
  dot?: boolean;
  kbd?: string;
  children?: NavChild[];
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sectioned main navigation (sidebar + ≤lg drawer)
// ─────────────────────────────────────────────────────────────────────────────

export const MAIN_NAV: NavSection[] = [
  {
    section: 'Discover',
    items: [
      {
        label: 'Marketplace',
        icon: LayoutGrid,
        href: '/market',
        children: [
          { label: 'Agents', icon: Bot, href: '/market/agents' },
          { label: 'Repos', icon: GitBranch, href: '/market/repos' },
        ],
      },
      { label: 'Leaderboard', icon: Trophy, href: '/reputation/leaderboard' },
      { label: '$BOLTY', icon: Zap, href: '/bolty' },
    ],
  },
  {
    section: 'My work',
    items: [
      { label: 'Inventory', icon: Package, href: '/inventory' },
      { label: 'Saved', icon: Heart, href: '/inventory?tab=saved' },
      { label: 'Orders', icon: ShoppingBag, href: '/orders' },
    ],
  },
  {
    section: 'Community',
    items: [
      { label: 'Feed', icon: MessageSquare, href: '/feed' },
      { label: 'Messages', icon: MessageCircle, href: '/dm' },
      { label: 'Notifications', icon: Bell, href: '/notifications' },
    ],
  },
  {
    section: 'Account',
    items: [
      { label: 'Settings', icon: Settings, href: '/profile' },
      { label: 'How it works', icon: FileText, href: '/how-it-works' },
      { label: 'Docs', icon: BookOpen, href: '/docs/agent-protocol' },
      { label: 'Help', icon: LifeBuoy, href: '/help' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mobile bottom-tab bar (≤lg). Curated 4 tabs + "More" overflow that opens
// the full sidebar drawer (PowerNavbar handles that). Keep this list to 5
// max — anything beyond 5 hurts touch ergonomics on small phones.
// ─────────────────────────────────────────────────────────────────────────────

export const MOBILE_TABS: NavLink[] = [
  { href: '/market', label: 'Market', icon: Store },
  { href: '/feed', label: 'Feed', icon: MessageSquare },
  { href: '/inventory', label: 'Items', icon: Package },
  { href: '/dm', label: 'Inbox', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public marketing top bar (unauthenticated landing/legal/auth pages).
// Short, conversion-focused. Don't bury Docs.
// ─────────────────────────────────────────────────────────────────────────────

export const PUBLIC_NAV: NavLink[] = [
  { href: '/market/agents', label: 'Agents', icon: Bot },
  { href: '/market/repos', label: 'Repos', icon: GitBranch },
  { href: '/docs/agent-protocol', label: 'Docs', icon: BookOpen },
];

// ─────────────────────────────────────────────────────────────────────────────
// Active-state matcher — used by every nav surface so highlight logic stays
// consistent. Handles `?tab=` query params for /profile and /inventory.
// ─────────────────────────────────────────────────────────────────────────────

export function isItemActive(
  pathname: string | null,
  searchParams: URLSearchParams | null,
  href: string,
): boolean {
  const path = pathname ?? '';
  const tab = searchParams?.get('tab') ?? null;
  const [cleanHref, query] = href.split('?');
  if (cleanHref === '/market') return path === '/market';
  if (cleanHref === '/profile') {
    if (!(path === '/profile' || path.startsWith('/profile/'))) return false;
    if (query) {
      const expected = new URLSearchParams(query);
      return expected.get('tab') === tab;
    }
    return !tab || tab === 'profile';
  }
  if (cleanHref === '/inventory') {
    if (path !== '/inventory') return false;
    if (query) {
      const expected = new URLSearchParams(query);
      return expected.get('tab') === tab;
    }
    return !tab;
  }
  return path === cleanHref || path.startsWith(cleanHref + '/');
}

/** Lightweight pathname-only matcher for places that don't have access to URLSearchParams. */
export function isPathActive(pathname: string, href: string): boolean {
  const cleanHref = href.split('?')[0];
  return pathname === cleanHref || pathname.startsWith(cleanHref + '/');
}
