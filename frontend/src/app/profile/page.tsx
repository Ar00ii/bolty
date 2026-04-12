'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { APIKeysSection } from '@/components/profile/APIKeysSection';
import { UsageSection } from '@/components/profile/UsageSection';
import { BillingSection } from '@/components/profile/BillingSection';
import { NotificationsSection } from '@/components/profile/NotificationsSection';
import { IntegrationsSection } from '@/components/profile/IntegrationsSection';
import { AgentDashboard } from '@/components/profile/AgentDashboard';

import { api, ApiError, API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getMetaMaskProvider } from '@/lib/wallet/ethereum';

type Tab = 'general' | 'social' | 'wallet' | 'friends' | 'agent' | 'api-keys' | 'billing' | 'usage' | 'notifications' | 'integrations' | 'activity';

interface Friend {
  id: string;
  friend: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    userTag?: string | null;
  };
  since: string;
}

interface FriendRequest {
  id: string;
  from: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    userTag?: string | null;
  };
  createdAt: string;
}

interface UserSearchResult {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  userTag: string | null;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  preview: string;
  createdAt: string;
  lastUsed: string | null;
  scopes: string[];
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
      />
    </svg>
  );
}
function IconGlobe({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}
function IconWallet({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
      />
    </svg>
  );
}
function IconLink({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}
function IconShield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}
function IconGitHub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconCpu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
      />
    </svg>
  );
}

// ── Small UI helpers ───────────────────────────────────────────────────────────

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  if (!msg) return null;
  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 mb-6 text-sm font-light animate-[fade-in_0.3s_ease] ${
        type === 'success'
          ? 'bg-green-500/10 border border-green-500/30 text-green-300'
          : 'bg-red-500/10 border border-red-500/30 text-red-300'
      }`}
    >
      {type === 'success' ? (
        <IconCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
      ) : (
        <IconX className="w-4 h-4 mt-0.5 flex-shrink-0" />
      )}
      <span>{msg}</span>
    </div>
  );
}

function Avatar({
  src,
  name,
  size = 'md',
}: {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls =
    size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm';
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${cls} rounded-full border border-[var(--border)] flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${cls} rounded-full bg-monad-500/15 border border-monad-500/25 flex items-center justify-center text-monad-400 font-light flex-shrink-0`}
    >
      {(name || 'U')[0]?.toUpperCase()}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 mt-0">
      <h2 className="text-lg font-light text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-light text-[var(--text-secondary)] mb-2.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full profile-input bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all duration-250 focus:border-purple-500/60 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] placeholder:text-[var(--text-muted)] font-light ${props.className ?? ''}`}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full profile-input bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all duration-250 focus:border-purple-500/60 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] placeholder:text-[var(--text-muted)] resize-none font-light ${props.className ?? ''}`}
    />
  );
}

function SaveButton({ loading, label = 'Save changes' }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-primary w-full py-3 rounded-2xl text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 transition-all duration-200 border-2 border-purple-500/40 hover:border-purple-500/60 text-purple-200 hover:text-purple-100"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('general');

  // General
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [genSaving, setGenSaving] = useState(false);
  const [genMsg, setGenMsg] = useState('');
  const [genErr, setGenErr] = useState('');

  // Social
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socSaving, setSocSaving] = useState(false);
  const [socMsg, setSocMsg] = useState('');
  const [socErr, setSocErr] = useState('');

  // Wallet
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMsg, setWalletMsg] = useState('');
  const [walletErr, setWalletErr] = useState('');

  // Connections
  const [unlinkingGitHub, setUnlinkingGitHub] = useState(false);
  const [conMsg, setConMsg] = useState('');
  const [conErr, setConErr] = useState('');

  // Friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendActionId, setFriendActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Security
  const [secMsg, setSecMsg] = useState('');
  const [secErr, setSecErr] = useState('');

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const [avatarErr, setAvatarErr] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Agent endpoint
  const [agentEndpoint, setAgentEndpoint] = useState('');
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentMsg, setAgentMsg] = useState('');
  const [agentErr, setAgentErr] = useState('');
  const [agentTestStatus, setAgentTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>(
    'idle',
  );
  const [agentTestDetail, setAgentTestDetail] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [enable2FAStep, setEnable2FAStep] = useState<'idle' | 'code'>('idle');
  const [enable2FACode, setEnable2FACode] = useState('');
  const [emailStep, setEmailStep] = useState<'idle' | 'form' | 'otp'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'otp'>('idle');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // API Keys
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);

  // Billing
  const [billingPlan, setBillingPlan] = useState('free');
  const [billingEmail, setBillingEmail] = useState('');

  // Notifications
  const [notifErrors, setNotifErrors] = useState(true);
  const [notifReports, setNotifReports] = useState(true);

  // Usage stats
  const [usageStats, setUsageStats] = useState<any>({
    totalCallsThisMonth: 0,
    maxCallsAllowed: 100000,
    activeAgents: 0,
    last24hCalls: 0,
    lastResetDate: new Date().toISOString(),
  });

  // Activity log
  const [activityLog, setActivityLog] = useState<any[]>([]);

  // Integrations
  const [integrations, setIntegrations] = useState<any[]>([]);

  // Init
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    setUsername(user.username || '');
    setDisplayName(user.displayName || '');
    setTwitterUrl((user as { twitterUrl?: string }).twitterUrl || '');
    setLinkedinUrl((user as { linkedinUrl?: string }).linkedinUrl || '');
    setWebsiteUrl((user as { websiteUrl?: string }).websiteUrl || '');
    setTwoFAEnabled(!!(user as { twoFactorEnabled?: boolean }).twoFactorEnabled);
    setAgentEndpoint((user as { agentEndpoint?: string }).agentEndpoint || '');

    // Billing email
    setBillingEmail((user as { email?: string }).email || '');
    setBillingPlan('pro');

    // Load real API keys from backend
    api.get<any>('/market/api-keys').then((keys) => {
      if (Array.isArray(keys)) {
        setApiKeys(keys);
      }
    }).catch(() => setApiKeys([]));

    // Load notification preferences
    api.get<any>('/users/preferences/notifications')
      .then((prefs) => {
        setNotifErrors(prefs.emailOnErrors || true);
        setNotifReports(prefs.emailWeeklyReport || true);
      })
      .catch(() => {});
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ bio?: string }>('/users/profile')
      .then((d) => {
        if (d.bio) setBio(d.bio);
      })
      .catch(() => {});
  }, [user]);

  // ?linked=github redirect  |  ?tab=wallet direct link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('linked') === 'github') {
      refresh();
      window.history.replaceState({}, '', '/profile');
      setTab('integrations');
      setConMsg('GitHub account linked successfully.');
    }
    const tabParam = params.get('tab') as Tab | null;
    if (
      tabParam &&
      ['general', 'social', 'wallet', 'friends', 'agent', 'api-keys', 'billing', 'usage', 'notifications', 'integrations', 'activity'].includes(
        tabParam,
      )
    ) {
      setTab(tabParam);
      window.history.replaceState({}, '', '/profile');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const [f, r] = await Promise.all([
        api.get<Friend[]>('/social/friends'),
        api.get<FriendRequest[]>('/social/friends/requests'),
      ]);
      setFriends(f);
      setFriendRequests(r);
    } catch {
      /* silent */
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadFriends();
  }, [user, loadFriends]);

  // Search debounce
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data.filter((u) => u.id !== user?.id));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Load data based on active tab
  useEffect(() => {
    if (!user) return;

    if (tab === 'activity') {
      api.get<any>('/users/activity-log?limit=50')
        .then((logs) => {
          setActivityLog(Array.isArray(logs) ? logs : []);
        })
        .catch(() => setActivityLog([]));
    }

    if (tab === 'usage') {
      api.get<any>('/users/usage-stats')
        .then((stats) => {
          setUsageStats(stats || {});
        })
        .catch(() => {});
    }

    if (tab === 'agent') {
      // Load both usage stats and activity log for the agent tab
      Promise.all([
        api.get<any>('/users/usage-stats').catch(() => ({})),
        api.get<any>('/users/activity-log?limit=50').catch(() => []),
      ])
        .then(([stats, logs]) => {
          setUsageStats(stats || {});
          setActivityLog(Array.isArray(logs) ? logs : []);
        });
    }

    if (tab === 'integrations') {
      api.get<any>('/users/integrations')
        .then((ints) => {
          setIntegrations(Array.isArray(ints) ? ints : []);
        })
        .catch(() => setIntegrations([]));
    }
  }, [tab, user]);

  // ── Formatting Utilities ──────────────────────────────────────────────────────

  /**
   * Format a number with comma separators (e.g., 2847 -> "2,847")
   */
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };

  /**
   * Format a timestamp to relative time (e.g., "2m ago", "15m ago", "3h ago")
   */
  const formatTimeAgo = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'Unknown';

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setGenErr('Username is required.');
      return;
    }
    setGenSaving(true);
    setGenErr('');
    setGenMsg('');
    try {
      await api.patch('/users/profile', {
        username: username.trim(),
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await refresh();
      setGenMsg('Profile saved successfully.');
      setTimeout(() => setGenMsg(''), 3000);
    } catch (err) {
      setGenErr(err instanceof ApiError ? err.message : 'Failed to save profile.');
    } finally {
      setGenSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarErr('');
    setAvatarMsg('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_URL}/users/upload-avatar`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = Array.isArray(data.message) ? data.message[0] : data.message || 'Upload failed';
        throw new Error(String(msg));
      }
      await refresh();
      setAvatarMsg('Avatar updated.');
      setTimeout(() => setAvatarMsg(''), 3000);
    } catch (err) {
      setAvatarErr(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocSaving(true);
    setSocErr('');
    setSocMsg('');
    try {
      await api.patch('/users/profile', {
        twitterUrl: twitterUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      setSocMsg('Social links saved.');
      setTimeout(() => setSocMsg(''), 3000);
    } catch (err) {
      setSocErr(err instanceof ApiError ? err.message : 'Failed to save social links.');
    } finally {
      setSocSaving(false);
    }
  };

  const handleConnectWallet = async () => {
    setWalletLoading(true);
    setWalletErr('');
    setWalletMsg('');
    try {
      const eth = getMetaMaskProvider();
      if (!eth) {
        setWalletErr('MetaMask not detected. Please install the MetaMask extension.');
        return;
      }
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts[0];
      if (!address) {
        setWalletErr('No account selected in MetaMask.');
        return;
      }
      const { nonce, message } = await api.post<{ nonce: string; message: string }>(
        '/auth/link/wallet/nonce',
        { address },
      );
      const signature = (await eth.request({
        method: 'personal_sign',
        params: [message, address],
      })) as string;
      await api.post('/auth/link/wallet', { address, signature, nonce });
      await refresh();
      setWalletMsg('MetaMask wallet linked to your account.');
    } catch (err) {
      setWalletErr(err instanceof ApiError ? err.message : 'Wallet connection failed.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    if (!confirm('Remove MetaMask wallet from your account?')) return;
    setWalletLoading(true);
    setWalletErr('');
    setWalletMsg('');
    try {
      await api.delete('/auth/link/wallet');
      await refresh();
      setWalletMsg('Wallet removed from your account.');
    } catch (err) {
      setWalletErr(err instanceof ApiError ? err.message : 'Failed to remove wallet.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleLinkGitHub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
    const callbackUrl =
      process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL ||
      'http://localhost:3001/api/v1/auth/github/callback';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=read%3Auser%20repo`;
  };

  const handleUnlinkGitHub = async () => {
    if (!confirm('Unlink your GitHub account?')) return;
    setUnlinkingGitHub(true);
    setConErr('');
    setConMsg('');
    try {
      await api.delete('/auth/link/github');
      await refresh();
      setConMsg('GitHub account unlinked.');
    } catch (err) {
      setConErr(err instanceof ApiError ? err.message : 'Failed to unlink GitHub.');
    } finally {
      setUnlinkingGitHub(false);
    }
  };

  const handleCopyAPIKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const handleDeleteAPIKey = async (id: string) => {
    try {
      await api.delete(`/market/api-keys/${id}`);
      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const handleGenerateAPIKey = async (name: string) => {
    try {
      const newKey = await api.post<APIKey>('/market/api-keys', { name });
      setApiKeys([...apiKeys, newKey]);
    } catch (err) {
      console.error('Failed to generate API key:', err);
    }
  };

  const handleSaveAgentEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentSaving(true);
    setAgentErr('');
    setAgentMsg('');
    try {
      await api.patch('/users/profile', { agentEndpoint: agentEndpoint.trim() || null });
      await refresh();
      setAgentMsg('Agent endpoint saved.');
      setTimeout(() => setAgentMsg(''), 3000);
    } catch (err) {
      setAgentErr(err instanceof ApiError ? err.message : 'Failed to save endpoint.');
    } finally {
      setAgentSaving(false);
    }
  };

  const handleTestAgentEndpoint = async () => {
    if (!agentEndpoint.trim()) return;
    setAgentTestStatus('testing');
    setAgentTestDetail('');
    try {
      const res = await fetch(agentEndpoint.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Bolty-Event': 'negotiation.ping' },
        body: JSON.stringify({
          event: 'negotiation.ping',
          negotiationId: 'ping-test',
          listing: { id: 'test', title: 'Ping Test', price: 1, currency: 'ETH', minPrice: 0.5 },
          messages: [],
          currentOffer: 1,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setAgentTestStatus('ok');
        setAgentTestDetail(
          `HTTP ${res.status} — action: "${data?.action || '?'}", price: ${data?.proposedPrice ?? '?'}`,
        );
      } else {
        setAgentTestStatus('fail');
        setAgentTestDetail(`HTTP ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      setAgentTestStatus('fail');
      setAgentTestDetail(
        err?.message?.includes('timeout')
          ? 'Timeout after 8s — endpoint too slow'
          : err?.message || 'Network error',
      );
    }
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    setFriendActionId(requestId);
    try {
      await api.post(`/social/friends/respond/${requestId}`, { accept });
      await loadFriends();
    } catch {
      /* silent */
    } finally {
      setFriendActionId(null);
    }
  };

  const handleUnfriend = async (targetId: string) => {
    setFriendActionId(targetId);
    try {
      await api.delete(`/social/friends/${targetId}`);
      await loadFriends();
    } catch {
      /* silent */
    } finally {
      setFriendActionId(null);
    }
  };

  const handleSendFriendRequest = async (targetId: string) => {
    setSendingTo(targetId);
    try {
      await api.post('/social/friends/request', { targetId });
      setSearchResults((prev) => prev.filter((u) => u.id !== targetId));
    } catch {
      /* silent */
    } finally {
      setSendingTo(null);
    }
  };

  const handle2FAToggle = async () => {
    setSecErr('');
    setSecMsg('');
    setToggling2FA(true);
    try {
      if (twoFAEnabled) {
        await api.post('/auth/2fa/disable', { password: disable2FAPassword });
        setTwoFAEnabled(false);
        setDisable2FAPassword('');
        setSecMsg('Two-factor authentication disabled.');
      } else {
        await api.post('/auth/2fa/enable/request', {});
        setEnable2FAStep('code');
        setSecMsg('Verification code sent to your email.');
      }
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to update 2FA setting.');
    } finally {
      setToggling2FA(false);
    }
  };

  const handleEnable2FAConfirm = async () => {
    setSecErr('');
    setToggling2FA(true);
    try {
      await api.post('/auth/2fa/enable', { code: enable2FACode });
      setTwoFAEnabled(true);
      setEnable2FAStep('idle');
      setEnable2FACode('');
      setSecMsg('2FA enabled. A code will be emailed to you on your next login.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code.');
    } finally {
      setToggling2FA(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecErr('');
    setSecMsg('');
    setEmailLoading(true);
    try {
      await api.post('/auth/email/change-request', { newEmail, password: emailPassword });
      setEmailStep('otp');
      setSecMsg(`Verification code sent to ${newEmail}.`);
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to send verification code.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecErr('');
    setSecMsg('');
    setEmailLoading(true);
    try {
      await api.post('/auth/email/confirm', { code: emailOtp });
      await refresh();
      setEmailStep('idle');
      setNewEmail('');
      setEmailPassword('');
      setEmailOtp('');
      setSecMsg('Email address updated successfully.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestDeleteAccount = async () => {
    setSecErr('');
    setSecMsg('');
    setRequestingDelete(true);
    try {
      await api.post('/auth/account/delete-request', {});
      setDeleteStep('otp');
      setSecMsg('A confirmation code has been sent to your email.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to send confirmation code.');
    } finally {
      setRequestingDelete(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecErr('');
    setDeleting(true);
    try {
      await api.delete('/auth/account', { code: deleteOtp });
      router.push('/');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code.');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] border-t-monad-400 animate-spin" />
      </div>
    );
  }

  const walletAddress = (user as { walletAddress?: string })?.walletAddress;
  const userTag = (user as { userTag?: string })?.userTag;
  const githubLogin = (user as { githubLogin?: string })?.githubLogin;
  const userEmail = (user as { email?: string })?.email;
  const profileUrl = username ? `/u/${username}` : null;

  return (
    <div className="profile-container min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* ── Sidebar Menu ──────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <nav className="profile-menu-sidebar sticky top-20 lg:space-y-2 lg:space-x-0 space-x-2 space-y-0 flex lg:flex-col overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {[
                { id: 'general' as Tab, label: 'General', Icon: IconUser },
                { id: 'social' as Tab, label: 'Social', Icon: IconGlobe },
                { id: 'wallet' as Tab, label: 'Wallet', Icon: IconWallet },
                { id: 'api-keys' as Tab, label: 'API Keys', Icon: IconLink },
                { id: 'billing' as Tab, label: 'Billing', Icon: IconWallet },
                { id: 'usage' as Tab, label: 'Usage', Icon: IconCpu },
                { id: 'notifications' as Tab, label: 'Notifications', Icon: IconShield },
                { id: 'integrations' as Tab, label: 'Integrations', Icon: IconLink },
                { id: 'friends' as Tab, label: 'Friends', Icon: IconUsers },
                { id: 'activity' as Tab, label: 'Activity', Icon: IconCpu },
                { id: 'agent' as Tab, label: 'AI Agent', Icon: IconCpu },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`profile-menu-item ${tab === id ? 'active' : ''} min-w-fit lg:w-full lg:min-w-0`}
                  title={label}
                >
                  <div className="profile-menu-icon">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="profile-menu-label">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* ── Main content panel ───────────────────────────────────── */}
          <div className="lg:col-span-3 profile-content">
          {/* ════════════════════════════════════════════
          GENERAL
      ════════════════════════════════════════════ */}
          {tab === 'general' && (
            <div className="profile-content-card">
              <SectionHeader
                title="General Information"
                subtitle="Your public identity on Bolty."
              />
              <Alert type="success" msg={genMsg} />
              <Alert type="error" msg={genErr} />

              {/* Avatar upload */}
              <div className="flex items-center gap-6 p-6 rounded-xl border border-[rgba(168,85,247,0.15)] bg-gradient-to-r from-[rgba(168,85,247,0.05)] to-transparent mb-6">
                <div
                  className="relative group flex-shrink-0 cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Avatar
                    src={user?.avatarUrl}
                    name={user?.displayName || user?.username}
                    size="lg"
                  />
                  <div className="absolute inset-0 rounded-full bg-gray-950/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarUploading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-light text-[var(--text)] mb-0.5">Profile photo</div>
                  <div className="text-xs text-[var(--text-muted)] mb-2">
                    PNG, JPG or WebP · max 3 MB
                  </div>
                  {avatarMsg && typeof avatarMsg === 'string' && (
                    <div className="text-xs text-emerald-400">{avatarMsg}</div>
                  )}
                  {avatarErr && typeof avatarErr === 'string' && (
                    <div className="text-xs text-red-400">{avatarErr}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-monad-500/30 text-[var(--text-muted)] hover:text-monad-400 transition-all disabled:opacity-50"
                  >
                    {avatarUploading ? 'Uploading...' : 'Change photo'}
                  </button>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <form onSubmit={handleSaveGeneral} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Username">
                    <div className="flex items-center gap-0 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-monad-500/50 focus-within:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] transition-all duration-200">
                      <span className="px-3 text-monad-400 font-mono text-sm select-none">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                        }
                        className="flex-1 bg-transparent py-2.5 pr-4 text-sm text-[var(--text)] font-mono outline-none placeholder:text-[var(--text-muted)]"
                        maxLength={30}
                        required
                        placeholder="yourhandle"
                      />
                    </div>
                  </Field>
                  <Field label="Display Name">
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={50}
                      placeholder="Your full name"
                    />
                  </Field>
                </div>

                <Field label="Bio">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="A short description about yourself..."
                  />
                  <div className="text-right text-xs text-[var(--text-muted)] mt-1">
                    {bio.length} / 300
                  </div>
                </Field>

                {userTag && (
                  <div className="flex items-center justify-between bg-monad-500/5 border border-monad-500/15 rounded-xl px-4 py-3">
                    <div>
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-0.5">
                        User ID
                      </div>
                      <div className="font-mono text-monad-400 font-light">#{userTag}</div>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] text-right leading-relaxed">
                      Others can find you
                      <br />
                      by searching #{userTag}
                    </div>
                  </div>
                )}

                <SaveButton loading={genSaving} />
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════
          SOCIAL  — blue tint
      ════════════════════════════════════════════ */}
          {tab === 'social' && (
            <div className="profile-content-card">
              <SectionHeader
                title="Social Links"
                subtitle="Connect your online presence to your Bolty profile."
              />
              <Alert type="success" msg={socMsg} />
              <Alert type="error" msg={socErr} />

              <form onSubmit={handleSaveSocial} className="space-y-6">
                {(
                  [
                    {
                      key: 'twitter',
                      label: 'X / Twitter',
                      icon: (
                        <svg
                          className="w-4 h-4 text-[var(--text-muted)]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      ),
                      value: twitterUrl,
                      setter: setTwitterUrl,
                      placeholder: 'https://x.com/yourhandle',
                    },
                    {
                      key: 'linkedin',
                      label: 'LinkedIn',
                      icon: (
                        <svg
                          className="w-4 h-4 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      ),
                      value: linkedinUrl,
                      setter: setLinkedinUrl,
                      placeholder: 'https://linkedin.com/in/yourprofile',
                    },
                    {
                      key: 'website',
                      label: 'Website',
                      icon: <IconGlobe className="w-4 h-4 text-[var(--text-muted)]" />,
                      value: websiteUrl,
                      setter: setWebsiteUrl,
                      placeholder: 'https://yourwebsite.com',
                    },
                  ] as Array<{
                    key: string;
                    label: string;
                    icon: React.ReactNode;
                    value: string;
                    setter: (v: string) => void;
                    placeholder: string;
                  }>
                ).map((item) => (
                  <Field key={item.key} label={item.label}>
                    <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] px-4 py-3 focus-within:border-purple-500/60 focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all duration-200">
                      {item.icon}
                      <input
                        type="url"
                        value={item.value}
                        onChange={(e) => item.setter(e.target.value)}
                        placeholder={item.placeholder}
                        className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] font-light"
                      />
                      {item.value && (
                        <button
                          type="button"
                          onClick={() => item.setter('')}
                          className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                        >
                          <IconX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </Field>
                ))}

                <div className="pt-2">
                  <SaveButton loading={socSaving} label="Save social links" />
                </div>
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════
          FRIENDS
      ════════════════════════════════════════════ */}
          {tab === 'friends' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="profile-content-card">
                <SectionHeader
                  title="Professional Network"
                  subtitle="Build meaningful connections with developers and expand your professional community."
                />
                <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-monad-500/50 focus-within:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] transition-all duration-200">
                  <IconSearch className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by @username or user ID..."
                    className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                  {searching ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-monad-400 animate-spin flex-shrink-0" />
                  ) : (
                    searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-3 rounded-xl border border-[var(--border)] overflow-hidden">
                    {searchResults.map((u, i) => (
                      <div
                        key={u.id}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                      >
                        <Avatar src={u.avatarUrl} name={u.displayName || u.username} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-light text-[var(--text)] truncate">
                            {u.displayName || u.username}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                            {u.username && <span>@{u.username}</span>}
                            {u.userTag && <span className="text-monad-400/70">#{u.userTag}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendFriendRequest(u.id)}
                          disabled={sendingTo === u.id}
                          className="text-xs text-monad-400 border border-monad-500/30 hover:border-monad-400/60 hover:bg-monad-500/8 px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 shrink-0"
                        >
                          {sendingTo === u.id ? '...' : '+ Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.trim() && !searching && searchResults.length === 0 && (
                  <div className="mt-3 text-center py-6 text-xs text-[var(--text-muted)] font-mono border border-[var(--border)] rounded-xl">
                    No users found for &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>

              {/* Requests + list */}
              <div className="profile-content-card">
                {friendsLoading ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-xs text-[var(--text-muted)]">
                    <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-monad-400 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Pending requests */}
                    {friendRequests.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                            {friendRequests.length} pending request
                            {friendRequests.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {friendRequests.map((req) => (
                            <div
                              key={req.id}
                              className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3"
                            >
                              <Avatar
                                src={req.from.avatarUrl}
                                name={req.from.displayName || req.from.username}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/u/${req.from.username}`}
                                  className="text-sm font-light text-[var(--text)] hover:text-monad-300 transition-colors"
                                >
                                  {req.from.displayName || req.from.username}
                                </Link>
                                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                                  {req.from.username && <span>@{req.from.username}</span>}
                                  {req.from.userTag && (
                                    <span className="text-monad-400/60">#{req.from.userTag}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleRespondToRequest(req.id, true)}
                                  disabled={friendActionId === req.id}
                                  className="text-xs text-emerald-400 border border-emerald-500/25 hover:border-emerald-400/50 hover:bg-emerald-500/8 px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRespondToRequest(req.id, false)}
                                  disabled={friendActionId === req.id}
                                  className="text-xs text-[var(--text-muted)] border border-[var(--border)] hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Friends list */}
                    {friends.length === 0 && friendRequests.length === 0 ? (
                      <div className="text-center py-10">
                        <IconUsers className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-30" />
                        <p className="text-sm text-[var(--text-muted)]">
                          Start building your network — search for developers to connect with.
                        </p>
                      </div>
                    ) : friends.length > 0 ? (
                      <div>
                        {friendRequests.length > 0 && (
                          <div className="border-t border-[var(--border)] pt-4" />
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {friends.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2.5 group hover:border-monad-500/40 hover:shadow-lg transition-all duration-200"
                            >
                              <Avatar
                                src={f.friend.avatarUrl}
                                name={f.friend.displayName || f.friend.username}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/u/${f.friend.username}`}
                                  className="text-xs font-light text-[var(--text)] hover:text-monad-300 transition-colors truncate block"
                                >
                                  {f.friend.displayName || f.friend.username}
                                </Link>
                                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                                  {f.friend.username && <span>@{f.friend.username}</span>}
                                  {f.friend.userTag && (
                                    <span className="text-monad-400/50">#{f.friend.userTag}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link
                                  href={`/dm?peer=${f.friend.id}`}
                                  className="text-xs text-monad-400 border border-monad-500/25 hover:border-monad-400/50 hover:bg-monad-500/8 px-2 py-1 rounded-lg transition-all duration-200"
                                  title="Direct message"
                                >
                                  DM
                                </Link>
                                <button
                                  onClick={() => handleUnfriend(f.friend.id)}
                                  disabled={friendActionId === f.friend.id}
                                  className="text-xs text-[var(--text-muted)] hover:text-red-400 border border-[var(--border)] hover:border-red-400/25 px-2 py-1 rounded-lg transition-all duration-200 disabled:opacity-50"
                                  title="Remove friend"
                                >
                                  <IconX className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
          AI AGENT — Professional SaaS Dashboard
      ════════════════════════════════════════════ */}
          {tab === 'agent' && <AgentDashboard />}

          {/* LEGACY AGENT CONTENT - KEPT FOR REFERENCE
          {tab === 'agent' && (
            <div className="space-y-5" style={{display: 'none'}}>
              {/* Header with Status */}
              <div className="profile-content-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-light text-[var(--text)]">AI Agent Dashboard</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Configure and manage your autonomous agent</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-green-500/15 transition-all duration-200" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-green-400">Active</span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-monad-500/40 hover:shadow-lg transition-all duration-200">
                    <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">Total Calls</div>
                    <div className="text-lg font-light text-[var(--text)]">{formatNumber(usageStats.totalCallsThisMonth) || 'N/A'}</div>
                    <div className="text-xs text-emerald-400 mt-0.5">
                      {usageStats.totalCallsThisMonth ?
                        `${Math.round((usageStats.totalCallsThisMonth / (usageStats.maxCallsAllowed || 100000)) * 100)}% of limit this month`
                        : 'No data yet'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-monad-500/40 hover:shadow-lg transition-all duration-200">
                    <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">Active Agents</div>
                    <div className="text-lg font-light text-[var(--text)]">{formatNumber(usageStats.activeAgents) || 'N/A'}</div>
                    <div className="text-xs text-emerald-400 mt-0.5">{usageStats.activeAgents > 0 ? 'Excellent' : 'No agents'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-monad-500/40 hover:shadow-lg transition-all duration-200">
                    <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">Last 24h Calls</div>
                    <div className="text-lg font-light text-[var(--text)]">{formatNumber(usageStats.last24hCalls) || 'N/A'}</div>
                    <div className="text-xs text-emerald-400 mt-0.5">{usageStats.last24hCalls > 0 ? 'Active' : 'Idle'}</div>
                  </div>
                </div>
              </div>

              {/* Configuration Panel */}
              <div className="profile-content-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.25)' }}>
                    <IconCpu className="w-3 h-3 text-monad-400" />
                  </div>
                  <h3 className="text-sm font-light text-[var(--text)]">Agent Configuration</h3>
                </div>

                <Alert type="success" msg={agentMsg} />
                <Alert type="error" msg={agentErr} />

                <form onSubmit={handleSaveAgentEndpoint} className="space-y-5">
                  <Field label="Webhook Endpoint URL">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 hover:border-monad-500/30 focus-within:border-monad-500/50 focus-within:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] transition-all duration-200">
                          <IconCpu className="w-4 h-4 text-monad-400/60 flex-shrink-0" />
                          <input
                            type="url"
                            value={agentEndpoint}
                            onChange={(e) => {
                              setAgentEndpoint(e.target.value);
                              setAgentTestStatus('idle');
                              setAgentTestDetail('');
                            }}
                            placeholder="https://api.example.com/agent/webhook"
                            className="flex-1 bg-transparent text-sm text-[var(--text)] font-mono outline-none placeholder:text-[var(--text-muted)]"
                          />
                          {agentEndpoint && (
                            <button
                              type="button"
                              onClick={() => {
                                setAgentEndpoint('');
                                setAgentTestStatus('idle');
                              }}
                              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex-shrink-0"
                            >
                              <IconX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleTestAgentEndpoint}
                          disabled={!agentEndpoint.trim() || agentTestStatus === 'testing'}
                          className="text-xs px-4 py-2.5 rounded-xl border transition-all duration-200 disabled:opacity-40 shrink-0 hover:bg-monad-500/20 hover:border-monad-500/40"
                          style={{
                            borderColor: 'rgba(131,110,249,0.3)',
                            color: '#a78bfa',
                            background: 'rgba(131,110,249,0.08)',
                          }}
                        >
                          {agentTestStatus === 'testing' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-monad-400 border-t-transparent animate-spin" />
                              testing...
                            </span>
                          ) : (
                            'Verify'
                          )}
                        </button>
                      </div>

                      {/* Test result */}
                      {agentTestStatus === 'ok' && (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                          style={{
                            background: 'rgba(34,197,94,0.07)',
                            border: '1px solid rgba(34,197,94,0.2)',
                          }}
                        >
                          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                          <span className="text-green-400">Connection verified</span>
                          <span className="text-zinc-500 ml-1">{agentTestDetail}</span>
                        </div>
                      )}
                      {agentTestStatus === 'fail' && (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                          style={{
                            background: 'rgba(239,68,68,0.07)',
                            border: '1px solid rgba(239,68,68,0.2)',
                          }}
                        >
                          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                          <span className="text-red-400">Connection failed</span>
                          <span className="text-zinc-500 ml-1">{agentTestDetail}</span>
                        </div>
                      )}

                      <p className="text-xs text-[var(--text-muted)] leading-relaxed px-1">
                        Your agent endpoint receives negotiation state as JSON and must respond with an action within 5 seconds.
                      </p>
                    </div>
                  </Field>

                  <SaveButton loading={agentSaving} label="Save Configuration" />
                </form>
              </div>

              {/* Activity Log */}
              <div className="profile-content-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.25)' }}>
                    <IconCpu className="w-3 h-3 text-monad-400" />
                  </div>
                  <h3 className="text-sm font-light text-[var(--text)]">Recent Activity</h3>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activityLog && activityLog.length > 0 ? (
                    activityLog.map((log: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-all duration-200 cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[var(--text)]">{log.action || 'Unknown Action'}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {log.resource && log.resourceId
                              ? `${log.resource}: ${log.resourceId}`
                              : log.metadata
                                ? JSON.stringify(log.metadata).substring(0, 100)
                                : 'No details'}
                          </div>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{formatTimeAgo(log.createdAt)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center p-4 text-center">
                      <p className="text-xs text-[var(--text-muted)]">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documentation & Examples */}
              <div className="profile-content-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.25)' }}>
                    <IconCpu className="w-3 h-3 text-monad-400" />
                  </div>
                  <h3 className="text-sm font-light text-[var(--text)]">Quick Start</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-monad-500/40 hover:shadow-lg transition-all duration-200">
                    <div className="text-xs font-semibold text-monad-300 mb-2">Request Format</div>
                    <div className="text-xs text-[var(--text-muted)] font-mono bg-black/30 hover:bg-black/40 p-2 rounded border border-[var(--border)] overflow-x-auto transition-all duration-200">
                      {`POST /webhook\n{\n  "negotiationId": "neg_123",\n  "state": {...},\n  "history": [...]\n}`}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-monad-500/40 hover:shadow-lg transition-all duration-200">
                    <div className="text-xs font-semibold text-monad-300 mb-2">Response Format</div>
                    <div className="text-xs text-[var(--text-muted)] font-mono bg-black/30 hover:bg-black/40 p-2 rounded border border-[var(--border)] overflow-x-auto transition-all duration-200">
                      {`{\n  "action": "accept"|"counter"|"decline",\n  "terms": {...},\n  "reasoning": "..."\n}`}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <Link
                    href="/docs/agent-api"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-monad-400 hover:text-monad-300 transition-colors"
                  >
                    <IconArrow className="w-3 h-3" />
                    View Complete API Documentation
                  </Link>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="profile-content-card border-red-500/20 bg-red-500/3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <IconCpu className="w-3 h-3 text-red-400" />
                  </div>
                  <h3 className="text-sm font-light text-red-300">Danger Zone</h3>
                </div>

                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Disabling your agent will fall back to the built-in AI. Active negotiations may fail.
                </p>

                <button className="text-xs px-4 py-2 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/8 transition-all duration-200">
                  Disable Agent
                </button>
              </div>
            </div>
          )}
          */}

          {/* BILLING */}
          {tab === 'billing' && (
            <BillingSection
              data={{
                plan: billingPlan as 'free' | 'pro' | 'enterprise',
                email: billingEmail,
                nextBillingDate: billingPlan === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
                amount: billingPlan === 'pro' ? 99 : undefined,
                status: 'active',
                cardLast4: billingPlan === 'pro' ? '4242' : undefined,
              }}
            />
          )}

          {/* USAGE */}
          {tab === 'usage' && (
            <UsageSection
              data={{
                totalCalls: usageStats.totalCallsThisMonth || 0,
                maxCalls: usageStats.maxCallsAllowed || 100000,
                activeAgents: usageStats.activeAgents || 0,
                last24hCalls: usageStats.last24hCalls || 0,
                lastResetDate: usageStats.lastResetDate || new Date().toISOString(),
              }}
            />
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <NotificationsSection
              settings={{
                emailOnErrors: notifErrors,
                weeklyReport: notifReports,
                monthlyReport: false,
                deploymentAlerts: true,
              }}
              billingEmail={billingEmail}
              onUpdate={async (settings) => {
                setNotifErrors(settings.emailOnErrors);
                setNotifReports(settings.weeklyReport);
              }}
            />
          )}

          {/* INTEGRATIONS */}
          {tab === 'integrations' && (
            <IntegrationsSection
              integrations={(() => {
                // Build default list with user's real state
                const defaults = [
                  {
                    id: 'metamask',
                    category: 'wallet',
                    name: 'MetaMask',
                    description: 'Connect your MetaMask wallet for transactions',
                    connected: !!walletAddress,
                    connectedAs: walletAddress?.slice(0, 10) + '...' || undefined,
                    verified: true,
                  },
                  {
                    id: 'walletconnect',
                    category: 'wallet',
                    name: 'WalletConnect',
                    description: 'Connect via WalletConnect protocol',
                    connected: false,
                  },
                  {
                    id: 'ledger',
                    category: 'wallet',
                    name: 'Ledger',
                    description: 'Hardware wallet integration',
                    connected: false,
                  },
                  {
                    id: 'twitter',
                    category: 'social',
                    name: 'Twitter/X',
                    description: 'Share your achievements and activity',
                    connected: !!twitterUrl,
                    connectedAs: twitterUrl ? new URL(twitterUrl).pathname.slice(1) : undefined,
                  },
                  {
                    id: 'discord',
                    category: 'social',
                    name: 'Discord',
                    description: 'Join community updates and notifications',
                    connected: false,
                  },
                  {
                    id: 'github-social',
                    category: 'social',
                    name: 'GitHub',
                    description: 'Link your development profile',
                    connected: !!githubLogin,
                    connectedAs: githubLogin || undefined,
                  },
                  {
                    id: 'two-factor',
                    category: 'security',
                    name: '2FA Authentication',
                    description: 'Enable two-factor authentication',
                    connected: twoFAEnabled,
                  },
                  {
                    id: 'api-keys',
                    category: 'security',
                    name: 'API Keys',
                    description: 'Manage API keys for programmatic access',
                    connected: true,
                  },
                ];

                // Deduplicate: use API data if available, otherwise use defaults
                const seen = new Set<string>();
                const merged: any[] = [];

                // First add from API integrations
                if (integrations.length > 0) {
                  integrations.forEach((int: any) => {
                    const integrationConfig: Record<string, any> = {
                      'metamask': { category: 'wallet' },
                      'walletconnect': { category: 'wallet' },
                      'ledger': { category: 'wallet' },
                      'twitter': { category: 'social' },
                      'discord': { category: 'social' },
                      'github-social': { category: 'social' },
                      'two-factor': { category: 'security' },
                      'api-keys': { category: 'security' },
                    };
                    const config = integrationConfig[int.id] || { category: int.category || 'service' };
                    const item = {
                      id: int.id,
                      category: config.category,
                      name: int.name || int.provider,
                      description: int.description || 'Connect this integration',
                      connected: int.connected,
                      connectedAs: int.connectedAs,
                      lastUsedAt: int.lastUsedAt,
                      verified: int.verified,
                    };
                    if (!seen.has(int.id)) {
                      merged.push(item);
                      seen.add(int.id);
                    }
                  });
                }

                // Then add defaults that aren't already in merged list
                defaults.forEach((def) => {
                  if (!seen.has(def.id)) {
                    merged.push(def);
                    seen.add(def.id);
                  } else {
                    // Update with real state if default
                    const idx = merged.findIndex((m) => m.id === def.id);
                    if (idx !== -1 && !integrations.length) {
                      merged[idx] = { ...merged[idx], ...def };
                    }
                  }
                });

                return merged;
              })()}
              onConnect={async (id: string) => {
                try {
                  await api.post('/users/integrations', {
                    provider: id,
                    name: id,
                  });
                  const ints = await api.get<any>('/users/integrations');
                  setIntegrations(Array.isArray(ints) ? ints : []);
                } catch (err) {
                  console.error('Failed to connect:', err);
                }
              }}
              onDisconnect={async (id: string) => {
                try {
                  await api.delete(`/users/integrations/${id}`);
                  const ints = await api.get<any>('/users/integrations');
                  setIntegrations(Array.isArray(ints) ? ints : []);
                } catch (err) {
                  console.error('Failed to disconnect:', err);
                }
              }}
            />
          )}

          {/* ACTIVITY LOG */}
          {tab === 'activity' && (
            <div className="profile-content-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-light text-[var(--text)]">Activity Log</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Timeline of your account and platform activity</p>
                </div>
                <select className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)]">
                  <option>All Activities</option>
                  <option>Login</option>
                  <option>API Calls</option>
                  <option>Settings</option>
                  <option>Security</option>
                </select>
              </div>

              {activityLog && activityLog.length > 0 ? (
                <div className="space-y-1">
                  {activityLog.map((log: any, idx: number) => {
                    const timestamp = new Date(log.timestamp || log.createdAt);
                    const now = new Date();
                    const diffMs = now.getTime() - timestamp.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    let timeStr = 'just now';
                    if (diffMins < 60) {
                      timeStr = diffMins <= 0 ? 'just now' : `${diffMins}m ago`;
                    } else if (diffHours < 24) {
                      timeStr = `${diffHours}h ago`;
                    } else if (diffDays < 7) {
                      timeStr = `${diffDays}d ago`;
                    } else {
                      timeStr = timestamp.toLocaleDateString();
                    }

                    // Determine activity type and color
                    const action = log.action || log.type || 'Activity';
                    let typeColor = 'text-zinc-400';
                    let typeBg = 'bg-zinc-500/10';
                    if (action.toLowerCase().includes('login')) {
                      typeColor = 'text-emerald-400';
                      typeBg = 'bg-emerald-500/10';
                    } else if (action.toLowerCase().includes('api')) {
                      typeColor = 'text-monad-400';
                      typeBg = 'bg-monad-500/10';
                    } else if (action.toLowerCase().includes('error') || action.toLowerCase().includes('failed')) {
                      typeColor = 'text-red-400';
                      typeBg = 'bg-red-500/10';
                    } else if (action.toLowerCase().includes('update') || action.toLowerCase().includes('change')) {
                      typeColor = 'text-amber-400';
                      typeBg = 'bg-amber-500/10';
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-4 border border-[var(--border)] rounded-xl hover:border-monad-500/20 hover:bg-monad-500/2 transition-all duration-200 group"
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${typeColor.replace('text-', 'bg-')}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-mono px-2 py-1 rounded ${typeBg} ${typeColor}`}>
                              {action}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] ml-auto">
                              {timeStr}
                            </span>
                          </div>
                          {log.description && (
                            <p className="text-sm text-[var(--text-muted)] mb-1">
                              {log.description}
                            </p>
                          )}
                          {log.metadata && (
                            <div className="text-xs text-[var(--text-muted)] font-mono bg-black/20 p-2 rounded border border-[var(--border)] overflow-x-auto max-w-full">
                              {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata, null, 2).substring(0, 200)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                    <IconCpu className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">No activity recorded yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Your account activity will appear here</p>
                </div>
              )}
            </div>
          )}
          </div>
          {/* end main content panel */}
        </div>
        {/* end grid */}
      </div>
      {/* end container */}
    </div>
  );
}
