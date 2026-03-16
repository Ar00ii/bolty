'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Timeline } from '@/components/ui/timeline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type Tab = 'general' | 'social' | 'wallet' | 'connections' | 'friends' | 'security';

interface Friend {
  id: string;
  friend: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null; userTag?: string | null };
  since: string;
}

interface FriendRequest {
  id: string;
  from: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null; userTag?: string | null };
  createdAt: string;
}

interface UserSearchResult {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  userTag: string | null;
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  );
}
function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}
function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}
function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconArrow({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

// ── Small UI helpers ───────────────────────────────────────────────────────────

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  if (!msg) return null;
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3 mb-5 text-sm animate-[fade-in_0.3s_ease] ${
        type === 'success'
          ? 'bg-emerald-500/8 border border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/8 border border-red-500/20 text-red-400'
      }`}
    >
      {type === 'success'
        ? <IconCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
        : <IconX className="w-4 h-4 mt-0.5 flex-shrink-0" />}
      <span>{msg}</span>
    </div>
  );
}

function Avatar({ src, name, size = 'md' }: { src?: string | null; name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm';
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${cls} rounded-full border border-[var(--border)] flex-shrink-0`} />;
  return (
    <div className={`${cls} rounded-full bg-monad-500/15 border border-monad-500/25 flex items-center justify-center text-monad-400 font-semibold flex-shrink-0`}>
      {(name || 'U')[0]?.toUpperCase()}
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-[var(--text)] tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none transition-all duration-200 focus:border-monad-500/50 focus:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] placeholder:text-[var(--text-muted)] ${props.className ?? ''}`}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] outline-none transition-all duration-200 focus:border-monad-500/50 focus:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] placeholder:text-[var(--text-muted)] resize-none ${props.className ?? ''}`}
    />
  );
}

function SaveButton({ loading, label = 'Save changes' }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-primary w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          Saving...
        </>
      ) : label}
    </button>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'general',     label: 'General',     Icon: IconUser   },
  { id: 'social',      label: 'Social',      Icon: IconGlobe  },
  { id: 'wallet',      label: 'Wallet',      Icon: IconWallet },
  { id: 'connections', label: 'Connections', Icon: IconLink   },
  { id: 'friends',     label: 'Friends',     Icon: IconUsers  },
  { id: 'security',    label: 'Security',    Icon: IconShield },
];

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

  // Init
  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/auth'); return; }
    setUsername(user.username || '');
    setDisplayName(user.displayName || '');
    setTwitterUrl((user as { twitterUrl?: string }).twitterUrl || '');
    setLinkedinUrl((user as { linkedinUrl?: string }).linkedinUrl || '');
    setWebsiteUrl((user as { websiteUrl?: string }).websiteUrl || '');
    setTwoFAEnabled(!!(user as { twoFactorEnabled?: boolean }).twoFactorEnabled);
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.get<{ bio?: string }>('/users/profile')
      .then((d) => { if (d.bio) setBio(d.bio); })
      .catch(() => {});
  }, [user]);

  // ?linked=github redirect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('linked') === 'github') {
      refresh();
      window.history.replaceState({}, '', '/profile');
      setTab('connections');
      setConMsg('GitHub account linked successfully.');
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
    } catch { /* silent */ }
    finally { setFriendsLoading(false); }
  }, []);

  useEffect(() => { if (user) loadFriends(); }, [user, loadFriends]);

  // Search debounce
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data.filter((u) => u.id !== user?.id));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setGenErr('Username is required.'); return; }
    setGenSaving(true); setGenErr(''); setGenMsg('');
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
    } finally { setGenSaving(false); }
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocSaving(true); setSocErr(''); setSocMsg('');
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
    } finally { setSocSaving(false); }
  };

  const handleConnectWallet = async () => {
    setWalletLoading(true); setWalletErr(''); setWalletMsg('');
    try {
      const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
      if (!eth) { setWalletErr('MetaMask not detected. Please install the MetaMask extension.'); return; }
      const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[];
      const address = accounts[0];
      if (!address) { setWalletErr('No account selected in MetaMask.'); return; }
      const { nonce, message } = await api.post<{ nonce: string; message: string }>('/auth/link/wallet/nonce', { address });
      const signature = await eth.request({ method: 'personal_sign', params: [message, address] }) as string;
      await api.post('/auth/link/wallet', { address, signature, nonce });
      await refresh();
      setWalletMsg('MetaMask wallet linked to your account.');
    } catch (err) {
      setWalletErr(err instanceof ApiError ? err.message : 'Wallet connection failed.');
    } finally { setWalletLoading(false); }
  };

  const handleDisconnectWallet = async () => {
    if (!confirm('Remove MetaMask wallet from your account?')) return;
    setWalletLoading(true); setWalletErr(''); setWalletMsg('');
    try {
      await api.delete('/auth/link/wallet');
      await refresh();
      setWalletMsg('Wallet removed from your account.');
    } catch (err) {
      setWalletErr(err instanceof ApiError ? err.message : 'Failed to remove wallet.');
    } finally { setWalletLoading(false); }
  };

  const handleLinkGitHub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23liO79MvZtWDEdy2a';
    const callbackUrl = process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/github/callback';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=read%3Auser%20repo`;
  };

  const handleUnlinkGitHub = async () => {
    if (!confirm('Unlink your GitHub account?')) return;
    setUnlinkingGitHub(true); setConErr(''); setConMsg('');
    try {
      await api.delete('/auth/link/github');
      await refresh();
      setConMsg('GitHub account unlinked.');
    } catch (err) {
      setConErr(err instanceof ApiError ? err.message : 'Failed to unlink GitHub.');
    } finally { setUnlinkingGitHub(false); }
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    setFriendActionId(requestId);
    try {
      await api.post(`/social/friends/respond/${requestId}`, { accept });
      await loadFriends();
    } catch { /* silent */ }
    finally { setFriendActionId(null); }
  };

  const handleUnfriend = async (targetId: string) => {
    setFriendActionId(targetId);
    try {
      await api.delete(`/social/friends/${targetId}`);
      await loadFriends();
    } catch { /* silent */ }
    finally { setFriendActionId(null); }
  };

  const handleSendFriendRequest = async (targetId: string) => {
    setSendingTo(targetId);
    try {
      await api.post('/social/friends/request', { targetId });
      setSearchResults((prev) => prev.filter((u) => u.id !== targetId));
    } catch { /* silent */ }
    finally { setSendingTo(null); }
  };

  const handle2FAToggle = async () => {
    setSecErr(''); setSecMsg(''); setToggling2FA(true);
    try {
      if (twoFAEnabled) {
        await api.post('/auth/2fa/disable', { password: disable2FAPassword });
        setTwoFAEnabled(false); setDisable2FAPassword('');
        setSecMsg('Two-factor authentication disabled.');
      } else {
        await api.post('/auth/2fa/enable/request', {});
        setEnable2FAStep('code');
        setSecMsg('Verification code sent to your email.');
      }
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to update 2FA setting.');
    } finally { setToggling2FA(false); }
  };

  const handleEnable2FAConfirm = async () => {
    setSecErr(''); setToggling2FA(true);
    try {
      await api.post('/auth/2fa/enable', { code: enable2FACode });
      setTwoFAEnabled(true);
      setEnable2FAStep('idle');
      setEnable2FACode('');
      setSecMsg('2FA enabled. A code will be emailed to you on your next login.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code.');
    } finally { setToggling2FA(false); }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault(); setSecErr(''); setSecMsg(''); setEmailLoading(true);
    try {
      await api.post('/auth/email/change-request', { newEmail, password: emailPassword });
      setEmailStep('otp');
      setSecMsg(`Verification code sent to ${newEmail}.`);
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to send verification code.');
    } finally { setEmailLoading(false); }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault(); setSecErr(''); setSecMsg(''); setEmailLoading(true);
    try {
      await api.post('/auth/email/confirm', { code: emailOtp });
      await refresh();
      setEmailStep('idle'); setNewEmail(''); setEmailPassword(''); setEmailOtp('');
      setSecMsg('Email address updated successfully.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code.');
    } finally { setEmailLoading(false); }
  };

  const handleRequestDeleteAccount = async () => {
    setSecErr(''); setSecMsg(''); setRequestingDelete(true);
    try {
      await api.post('/auth/account/delete-request', {});
      setDeleteStep('otp');
      setSecMsg('A confirmation code has been sent to your email.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to send confirmation code.');
    } finally { setRequestingDelete(false); }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault(); setSecErr(''); setDeleting(true);
    try {
      await api.delete('/auth/account', { code: deleteOtp });
      router.push('/');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code.');
    } finally { setDeleting(false); }
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
    <div className="max-w-4xl mx-auto px-4 py-10 animate-[fade-in_0.4s_ease]">

      {/* ── Hero header card ─────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden mb-7 border border-[var(--border)]"
        style={{ background: 'linear-gradient(135deg, #18181b 0%, #1c1c1f 100%)' }}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(131,110,249,0.5), transparent)' }} />
        {/* Subtle radial glow */}
        <div className="absolute top-0 right-0 w-64 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(131,110,249,0.08) 0%, transparent 70%)' }} />

        <div className="relative px-6 py-5 flex items-center gap-5">
          <div className="relative">
            <Avatar src={user?.avatarUrl} name={user?.displayName || user?.username} size="lg" />
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#18181b]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[var(--text)] font-semibold text-lg leading-tight">
                {user?.displayName || user?.username || 'New User'}
              </span>
              {userTag && (
                <span className="font-mono text-xs text-monad-400 bg-monad-500/10 border border-monad-500/20 px-2 py-0.5 rounded-md">
                  #{userTag}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              {username && (
                <span className="text-xs text-[var(--text-muted)] font-mono">@{username}</span>
              )}
              {githubLogin && (
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <IconGitHub className="w-3 h-3" />
                  <span>{githubLogin}</span>
                </div>
              )}
              {walletAddress && (
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
              )}
            </div>
          </div>

          {profileUrl && (
            <Link
              href={profileUrl}
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-monad-400 border border-monad-500/30 hover:border-monad-400/60 hover:bg-monad-500/8 px-3 py-2 rounded-lg transition-all duration-200 shrink-0"
            >
              View profile
              <IconArrow className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Settings Navigation Grid ─────────────────────────────── */}
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {[
          { id: 'general' as Tab, label: 'General', desc: 'Username, display name and bio', Icon: IconUser },
          { id: 'social' as Tab, label: 'Social', desc: 'Link your X, LinkedIn and website', Icon: IconGlobe },
          { id: 'wallet' as Tab, label: 'Wallet', desc: 'Connect MetaMask for payments', Icon: IconWallet },
          { id: 'connections' as Tab, label: 'Connections', desc: 'Manage linked GitHub account', Icon: IconLink },
          { id: 'friends' as Tab, label: 'Friends', desc: 'Find and manage your contacts', Icon: IconUsers },
          { id: 'security' as Tab, label: 'Security', desc: '2FA, email and account settings', Icon: IconShield },
        ].map(({ id, label, desc, Icon }) => (
          <li key={id} className="min-h-[8rem] list-none">
            <button
              onClick={() => setTab(id)}
              className="relative h-full w-full rounded-2xl border border-[var(--border)] p-2 text-left transition-all duration-200 hover:border-monad-500/30"
              style={{
                background: tab === id
                  ? 'linear-gradient(135deg, rgba(131,110,249,0.12) 0%, var(--bg-card) 60%)'
                  : 'var(--bg-card)',
              }}
            >
              <GlowingEffect
                spread={30}
                glow={tab === id}
                disabled={tab !== id}
                proximity={48}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <div className="relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-xl border border-[var(--border)] px-4 py-4"
                style={{ background: 'var(--bg-elevated)' }}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                  tab === id
                    ? 'bg-monad-500/15 border-monad-500/30'
                    : 'bg-[var(--bg-card)] border-[var(--border)]'
                }`}>
                  <Icon className={`w-4 h-4 ${tab === id ? 'text-monad-400' : 'text-[var(--text-muted)]'}`} />
                </div>
                <div>
                  <div className={`text-sm font-semibold leading-tight tracking-tight ${tab === id ? 'text-monad-300' : 'text-[var(--text)]'}`}>
                    {label}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{desc}</div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* ════════════════════════════════════════════
          GENERAL  — monad purple tint
      ════════════════════════════════════════════ */}
      {tab === 'general' && (
        <TerminalCard title="profile.json" showDots className="[background:linear-gradient(160deg,rgba(131,110,249,0.06)_0%,var(--bg-card)_40%)]">
          <SectionHeader
            title="General Information"
            subtitle="Your public identity on Bolty."
          />
          <Alert type="success" msg={genMsg} />
          <Alert type="error" msg={genErr} />

          <form onSubmit={handleSaveGeneral} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Username">
                <div className="flex items-center gap-0 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden focus-within:border-monad-500/50 focus-within:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] transition-all duration-200">
                  <span className="px-3 text-monad-400 font-mono text-sm select-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
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
              <div className="text-right text-xs text-[var(--text-muted)] mt-1">{bio.length} / 300</div>
            </Field>

            {userTag && (
              <div className="flex items-center justify-between bg-monad-500/5 border border-monad-500/15 rounded-xl px-4 py-3">
                <div>
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-0.5">User ID</div>
                  <div className="font-mono text-monad-400 font-semibold">#{userTag}</div>
                </div>
                <div className="text-xs text-[var(--text-muted)] text-right leading-relaxed">
                  Others can find you<br />by searching #{userTag}
                </div>
              </div>
            )}

            <SaveButton loading={genSaving} />
          </form>
        </TerminalCard>
      )}

      {/* ════════════════════════════════════════════
          SOCIAL  — blue tint
      ════════════════════════════════════════════ */}
      {tab === 'social' && (
        <TerminalCard title="social-links.json" showDots className="[background:linear-gradient(160deg,rgba(59,130,246,0.07)_0%,var(--bg-card)_45%)]">
          <SectionHeader
            title="Social Links"
            subtitle="Connect your online presence to your Bolty profile."
          />
          <Alert type="success" msg={socMsg} />
          <Alert type="error" msg={socErr} />

          <form onSubmit={handleSaveSocial} className="space-y-4">
            {([
              {
                key: 'twitter',
                label: 'X / Twitter',
                icon: (
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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
            ] as Array<{ key: string; label: string; icon: React.ReactNode; value: string; setter: (v: string) => void; placeholder: string }>).map((item) => (
              <Field key={item.key} label={item.label}>
                <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 focus-within:border-monad-500/50 focus-within:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] transition-all duration-200">
                  {item.icon}
                  <input
                    type="url"
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                    placeholder={item.placeholder}
                    className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                  {item.value && (
                    <button type="button" onClick={() => item.setter('')}
                      className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Field>
            ))}

            <div className="pt-1">
              <SaveButton loading={socSaving} label="Save social links" />
            </div>
          </form>
        </TerminalCard>
      )}

      {/* ════════════════════════════════════════════
          WALLET
      ════════════════════════════════════════════ */}
      {tab === 'wallet' && (
        <div className="space-y-4">
          {/* Info card */}
          <div className="relative rounded-2xl border border-[var(--border)] overflow-hidden px-5 py-4"
            style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.05) 0%, rgba(24,24,27,1) 60%)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.3), transparent)' }} />
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconWallet className="w-4.5 h-4.5 text-orange-400 w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text)] mb-0.5">Payment Wallet</div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Your Bolty account uses GitHub or email for authentication. Link MetaMask separately to buy and sell on the marketplace. Linking only requires a message signature — <span className="text-[var(--text)]">no blockchain transaction is made</span>.
                </p>
              </div>
            </div>
          </div>

          <TerminalCard title="metamask.connect" showDots className="[background:linear-gradient(160deg,rgba(251,146,60,0.08)_0%,var(--bg-card)_50%)]">
            <Alert type="success" msg={walletMsg} />
            <Alert type="error" msg={walletErr} />

            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(251,146,60,0.05))', border: '1px solid rgba(251,146,60,0.2)' }}>
                <svg className="w-6 h-6 text-orange-400" viewBox="0 0 318 239" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M298.9 0L176.6 89.3l22.4-52.7L298.9 0z" fill="#E2761B"/>
                  <path d="M18.9 0l121.2 90.1-21.3-53.5L18.9 0z" fill="#E4761B"/>
                  <path d="M255.8 172.7l-32.5 49.7 69.6 19.1 20-67.8-57.1-1zm-207.5 1 19.9 67.8 69.5-19.1-32.4-49.7-57 1z" fill="#E4761B"/>
                  <path d="M134.5 102.9l-19.4 29.3 69.1 3.1-2.3-74.2-47.4 41.8zm48.8 0 48-42.6-2.6 74.9 69-3.1-19.3-29.2-95.1 0z" fill="#E4761B"/>
                  <path d="M138.2 222.4l41.6-20.3-35.9-28-5.7 48.3zm0 0" fill="#D7C1B3"/>
                  <path d="M180 222.4l-35.8-20.3 5.5 48.3 30.3-28z" fill="#C0AD9E"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--text)]">MetaMask</div>
                {walletAddress ? (
                  <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5 truncate">{walletAddress}</div>
                ) : (
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Not connected</div>
                )}
              </div>
              {walletAddress
                ? <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-mono shrink-0">Connected</span>
                : <span className="security-badge shrink-0">Disconnected</span>
              }
            </div>

            {walletAddress ? (
              <div className="space-y-3">
                <div className="bg-[var(--bg-elevated)] rounded-xl p-3 border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Full address</div>
                  <div className="text-xs font-mono text-[var(--text)] break-all">{walletAddress}</div>
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  disabled={walletLoading}
                  className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/8 hover:border-red-500/40 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {walletLoading ? 'Removing...' : 'Remove wallet'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={walletLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,146,60,0.18), rgba(251,146,60,0.08))',
                  border: '1px solid rgba(251,146,60,0.25)',
                  color: '#fb923c',
                  boxShadow: walletLoading ? 'none' : '0 4px 15px rgba(251,146,60,0.1)',
                }}
              >
                {walletLoading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" /> Connecting...</>
                ) : 'Connect MetaMask'}
              </button>
            )}
          </TerminalCard>
        </div>
      )}

      {/* ════════════════════════════════════════════
          CONNECTIONS
      ════════════════════════════════════════════ */}
      {tab === 'connections' && (
        <TerminalCard title="linked-accounts.json" showDots className="[background:linear-gradient(160deg,rgba(40,200,64,0.05)_0%,var(--bg-card)_45%)]">
          <SectionHeader
            title="Connected Accounts"
            subtitle="Link external services to unlock more Bolty features."
          />
          <Alert type="success" msg={conMsg} />
          <Alert type="error" msg={conErr} />

          <div className="space-y-3">
            {/* GitHub */}
            <div className={`flex items-center gap-4 rounded-xl p-4 border transition-all duration-200 ${githubLogin ? 'bg-[var(--bg-elevated)] border-emerald-500/20' : 'bg-[var(--bg-elevated)] border-[var(--border)]'}`}>
              <div className="w-11 h-11 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                <IconGitHub className="w-5 h-5 text-[var(--text)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">GitHub</span>
                  {githubLogin && <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">Linked</span>}
                </div>
                {githubLogin
                  ? <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">@{githubLogin}</div>
                  : <div className="text-xs text-[var(--text-muted)] mt-0.5">Required to import repositories and publish repo listings.</div>
                }
              </div>
              {githubLogin ? (
                <button
                  onClick={handleUnlinkGitHub}
                  disabled={unlinkingGitHub}
                  className="text-xs text-[var(--text-muted)] hover:text-red-400 border border-[var(--border)] hover:border-red-400/30 px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 shrink-0"
                >
                  {unlinkingGitHub ? 'Unlinking...' : 'Unlink'}
                </button>
              ) : (
                <button
                  onClick={handleLinkGitHub}
                  className="text-xs text-monad-400 border border-monad-500/30 hover:border-monad-400/60 hover:bg-monad-500/8 px-3 py-1.5 rounded-lg transition-all duration-200 shrink-0"
                >
                  Link
                </button>
              )}
            </div>

          </div>
        </TerminalCard>
      )}

      {/* ════════════════════════════════════════════
          FRIENDS
      ════════════════════════════════════════════ */}
      {tab === 'friends' && (
        <div className="space-y-4">
          {/* Search */}
          <TerminalCard title="user-search" showDots className="[background:linear-gradient(160deg,rgba(251,191,36,0.06)_0%,var(--bg-card)_45%)]">
            <SectionHeader
              title="Find People"
              subtitle="Search by @username or exact user ID — for example #1234."
            />
            <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-monad-500/50 focus-within:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] transition-all duration-200">
              <IconSearch className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="@username or #1234"
                className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] font-mono"
              />
              {searching
                ? <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-monad-400 animate-spin flex-shrink-0" />
                : searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                    <IconX className="w-4 h-4" />
                  </button>
                )
              }
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
                      <div className="text-sm font-medium text-[var(--text)] truncate">{u.displayName || u.username}</div>
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
          </TerminalCard>

          {/* Requests + list */}
          <TerminalCard title={`friends (${friends.length})`} showDots className="[background:linear-gradient(160deg,rgba(251,191,36,0.04)_0%,var(--bg-card)_45%)]">
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
                        {friendRequests.length} pending request{friendRequests.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {friendRequests.map((req) => (
                        <div key={req.id}
                          className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                          <Avatar src={req.from.avatarUrl} name={req.from.displayName || req.from.username} size="sm" />
                          <div className="flex-1 min-w-0">
                            <Link href={`/u/${req.from.username}`}
                              className="text-sm font-medium text-[var(--text)] hover:text-monad-300 transition-colors">
                              {req.from.displayName || req.from.username}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                              {req.from.username && <span>@{req.from.username}</span>}
                              {req.from.userTag && <span className="text-monad-400/60">#{req.from.userTag}</span>}
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
                    <p className="text-xs text-[var(--text-muted)] font-mono">No connections yet. Use the search above to find people.</p>
                  </div>
                ) : friends.length > 0 ? (
                  <div>
                    {friendRequests.length > 0 && <div className="border-t border-[var(--border)] pt-4" />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {friends.map((f) => (
                        <div key={f.id}
                          className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2.5 group hover:border-monad-500/25 transition-all duration-200">
                          <Avatar src={f.friend.avatarUrl} name={f.friend.displayName || f.friend.username} size="sm" />
                          <div className="flex-1 min-w-0">
                            <Link href={`/u/${f.friend.username}`}
                              className="text-xs font-medium text-[var(--text)] hover:text-monad-300 transition-colors truncate block">
                              {f.friend.displayName || f.friend.username}
                            </Link>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                              {f.friend.username && <span>@{f.friend.username}</span>}
                              {f.friend.userTag && <span className="text-monad-400/50">#{f.friend.userTag}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/dm?peer=${f.friend.id}`}
                              className="text-xs text-monad-400 border border-monad-500/25 hover:border-monad-400/50 hover:bg-monad-500/8 px-2 py-1 rounded-lg transition-all duration-200"
                              title="Direct message">
                              DM
                            </Link>
                            <button
                              onClick={() => handleUnfriend(f.friend.id)}
                              disabled={friendActionId === f.friend.id}
                              className="text-xs text-[var(--text-muted)] hover:text-red-400 border border-[var(--border)] hover:border-red-400/25 px-2 py-1 rounded-lg transition-all duration-200 disabled:opacity-50"
                              title="Remove friend">
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
          </TerminalCard>
        </div>
      )}

      {/* ════════════════════════════════════════════
          SECURITY
      ════════════════════════════════════════════ */}
      {tab === 'security' && (
        <div className="space-y-4">
          <Alert type="success" msg={secMsg} />
          <Alert type="error" msg={secErr} />

          {/* 2FA */}
          <TerminalCard title="two-factor-auth" showDots className="[background:linear-gradient(160deg,rgba(16,185,129,0.06)_0%,var(--bg-card)_45%)]">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${twoFAEnabled ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-[var(--bg-elevated)] border border-[var(--border)]'}`}>
                <IconShield className={`w-5 h-5 ${twoFAEnabled ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">Two-Factor Authentication</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {twoFAEnabled
                        ? 'Active — a code will be emailed to you at every login.'
                        : 'Disabled — enable for additional login security.'}
                    </div>
                  </div>
                  <button
                    onClick={() => { if (!twoFAEnabled) handle2FAToggle(); else setToggling2FA((v) => !v); }}
                    disabled={enable2FAStep === 'code'}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                      twoFAEnabled
                        ? 'text-red-400 border-red-500/25 hover:border-red-400/50 hover:bg-red-500/8'
                        : 'text-monad-400 border-monad-500/25 hover:border-monad-400/50 hover:bg-monad-500/8'
                    } disabled:opacity-40`}
                  >
                    {twoFAEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                {/* Enable 2FA — enter email code */}
                {!twoFAEnabled && enable2FAStep === 'code' && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-3">Enter the 6-digit code sent to your email:</p>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={enable2FACode}
                        onChange={(e) => setEnable2FACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="flex-1"
                        maxLength={6}
                      />
                      <button
                        onClick={handleEnable2FAConfirm}
                        disabled={enable2FACode.length !== 6 || toggling2FA}
                        className="text-xs text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/8 px-4 rounded-xl transition-all duration-200 disabled:opacity-40 shrink-0"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => { setEnable2FAStep('idle'); setEnable2FACode(''); setSecMsg(''); }}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-2 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Disable 2FA — enter password */}
                {twoFAEnabled && toggling2FA && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-3">Enter your password to disable 2FA:</p>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={disable2FAPassword}
                        onChange={(e) => setDisable2FAPassword(e.target.value)}
                        placeholder="Current password"
                        className="flex-1"
                      />
                      <button
                        onClick={handle2FAToggle}
                        disabled={!disable2FAPassword}
                        className="text-xs text-red-400 border border-red-500/25 hover:bg-red-500/8 px-4 rounded-xl transition-all duration-200 disabled:opacity-40 shrink-0"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setToggling2FA(false)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-2 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TerminalCard>

          {/* Email */}
          <TerminalCard title="email-address" showDots className="[background:linear-gradient(160deg,rgba(59,130,246,0.06)_0%,var(--bg-card)_45%)]">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-sm font-medium text-[var(--text)]">Email Address</div>
                <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{userEmail || 'Not set'}</div>
              </div>
              {emailStep === 'idle' && (
                <button
                  onClick={() => setEmailStep('form')}
                  className="text-xs text-monad-400 border border-monad-500/25 hover:border-monad-400/50 hover:bg-monad-500/8 px-3 py-1.5 rounded-lg transition-all duration-200"
                >
                  Change
                </button>
              )}
            </div>

            {emailStep === 'form' && (
              <form onSubmit={handleRequestEmailChange} className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" required />
                <Input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} placeholder="Current password" />
                <div className="flex gap-2">
                  <button type="submit" disabled={emailLoading || !newEmail}
                    className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {emailLoading ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sending...</> : 'Send verification code'}
                  </button>
                  <button type="button" onClick={() => { setEmailStep('idle'); setSecErr(''); setSecMsg(''); }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-3 transition-colors">Cancel</button>
                </div>
              </form>
            )}

            {emailStep === 'otp' && (
              <form onSubmit={handleConfirmEmailChange} className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Enter the 6-digit code sent to <span className="text-[var(--text)] font-mono">{newEmail}</span>:
                </p>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-3 text-[var(--text)] text-center text-2xl font-mono tracking-[0.6em] outline-none focus:border-monad-500/50 focus:shadow-[0_0_0_3px_rgba(131,110,249,0.08)] transition-all duration-200 placeholder:text-[var(--text-muted)] placeholder:tracking-normal"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={emailLoading || emailOtp.length !== 6}
                    className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {emailLoading ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Verifying...</> : 'Confirm change'}
                  </button>
                  <button type="button" onClick={() => { setEmailStep('idle'); setSecErr(''); setSecMsg(''); }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-3 transition-colors">Cancel</button>
                </div>
              </form>
            )}
          </TerminalCard>

          {/* Delete account — danger zone */}
          <div className="relative rounded-2xl border border-red-500/20 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, var(--bg-card) 60%)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }} />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-red-400">Delete Account</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Permanently remove your account and all associated data.</div>
                </div>
                {deleteStep === 'idle' && (
                  <button
                    onClick={() => setDeleteStep('confirm')}
                    className="text-xs text-red-400 border border-red-500/25 hover:border-red-400/50 hover:bg-red-500/8 px-3 py-1.5 rounded-lg transition-all duration-200 shrink-0"
                  >
                    Delete
                  </button>
                )}
              </div>

              {deleteStep === 'confirm' && (
                <div className="mt-4 pt-4 border-t border-red-500/15 space-y-3">
                  <p className="text-xs text-red-300/80 leading-relaxed">
                    <strong className="text-red-300">This action is permanent and irreversible.</strong> All repositories, listings, messages, and account data will be deleted. We will send a confirmation code to verify this request.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRequestDeleteAccount}
                      disabled={requestingDelete}
                      className="flex-1 py-2.5 rounded-xl border border-red-500/25 text-red-400 hover:bg-red-500/10 hover:border-red-400/40 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      {requestingDelete ? 'Sending code...' : 'Send confirmation code'}
                    </button>
                    <button type="button" onClick={() => { setDeleteStep('idle'); setSecErr(''); }}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-3 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              {deleteStep === 'otp' && (
                <form onSubmit={handleDeleteAccount} className="mt-4 pt-4 border-t border-red-500/15 space-y-3">
                  <p className="text-xs text-[var(--text-muted)]">
                    Enter the 6-digit code sent to <span className="text-[var(--text)] font-mono">{userEmail}</span>:
                  </p>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-[var(--bg-elevated)] border border-red-500/20 rounded-xl px-3 py-3 text-[var(--text)] text-center text-2xl font-mono tracking-[0.6em] outline-none focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.08)] transition-all duration-200 placeholder:text-[var(--text-muted)] placeholder:tracking-normal"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={deleting || deleteOtp.length !== 6}
                      className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50">
                      {deleting ? 'Deleting...' : 'Permanently delete my account'}
                    </button>
                    <button type="button" onClick={() => { setDeleteStep('idle'); setDeleteOtp(''); setSecErr(''); }}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-3 transition-colors">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── Build Timeline ─────────────────────────────────────────── */}
      <div className="mt-20 border-t border-[var(--border)] pt-16">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">How Bolty was built</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 max-w-lg">
            From a blank terminal to a full AI developer platform. Here is the build log.
          </p>
        </div>
        <Timeline
          data={[
            {
              title: "Foundation",
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Started with the core infrastructure — Next.js 14, NestJS backend, PostgreSQL via Prisma, and GitHub OAuth. Built authentication, JWT sessions and the user profile system from scratch.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {['Next.js 14 App Router', 'NestJS REST API', 'GitHub OAuth + JWT', 'Prisma + PostgreSQL', 'User profile & settings'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-monad-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              title: "Marketplace",
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Launched the Repository Showcase — developers can publish their GitHub repos, lock them behind ETH payments, and let the community vote and download. Integrated MetaMask and ERC-20 token payments.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {['Repository publish & discovery', 'ETH & ERC-20 payments', 'Upvote / downvote system', 'Locked repo access control', 'MetaMask wallet linking'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-monad-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              title: "AI Agents",
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Added the AI Agent marketplace — sell bots, scripts and live AI agents. Sellers can post price updates via API keys. Real-time negotiation system with agent-to-agent chat powered by WebSockets.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {['AI agent listings & discovery', 'Live agent endpoints', 'Agent API key system', 'Price negotiation chat', 'WebSocket real-time messaging'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-monad-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              title: "Community",
              content: (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Built the social layer — friends system with requests and search, direct messages, community feed and public profiles. Added 2FA email authentication and full account security controls.
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {['Friends & DMs', 'Public user profiles', 'Community feed', '2FA email authentication', 'Account deletion flow'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-monad-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>

    </div>
  );
}
