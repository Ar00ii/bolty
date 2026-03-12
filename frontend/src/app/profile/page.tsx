'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type Tab = 'general' | 'social' | 'wallet' | 'conexiones' | 'amigos' | 'seguridad';

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

function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  if (!msg) return null;
  return (
    <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
      {msg}
    </div>
  );
}

function Avatar({ src, name, size = 'md' }: { src?: string | null; name?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-sm';
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${sizeClass} rounded-full border-2 border-zinc-700 flex-shrink-0`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-monad-500/20 border-2 border-monad-500/30 flex items-center justify-center text-monad-400 font-bold flex-shrink-0`}>
      {(name || 'U')[0]?.toUpperCase()}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'general',    label: 'General',     icon: '👤' },
  { id: 'social',     label: 'Social',      icon: '🌐' },
  { id: 'wallet',     label: 'Wallet',      icon: '💳' },
  { id: 'conexiones', label: 'Conexiones',  icon: '🔗' },
  { id: 'amigos',     label: 'Amigos',      icon: '👥' },
  { id: 'seguridad',  label: 'Seguridad',   icon: '🔒' },
];

export default function ProfilePage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('general');

  // ── General
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [genSaving, setGenSaving] = useState(false);
  const [genMsg, setGenMsg] = useState('');
  const [genErr, setGenErr] = useState('');

  // ── Social
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socSaving, setSocSaving] = useState(false);
  const [socMsg, setSocMsg] = useState('');
  const [socErr, setSocErr] = useState('');

  // ── Wallet (MetaMask)
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMsg, setWalletMsg] = useState('');
  const [walletErr, setWalletErr] = useState('');

  // ── Conexiones (GitHub)
  const [unlinkingGitHub, setUnlinkingGitHub] = useState(false);
  const [conMsg, setConMsg] = useState('');
  const [conErr, setConErr] = useState('');

  // ── Amigos
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendActionId, setFriendActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Security
  const [secMsg, setSecMsg] = useState('');
  const [secErr, setSecErr] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [emailStep, setEmailStep] = useState<'idle' | 'form' | 'otp'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'otp'>('idle');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Init from user
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
      .then((data) => { if (data.bio) setBio(data.bio); })
      .catch(() => {});
  }, [user]);

  // Handle ?linked=github
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('linked') === 'github') {
        refresh();
        window.history.replaceState({}, '', '/profile');
        setTab('conexiones');
        setConMsg('GitHub account linked successfully.');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load friends
  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.get<Friend[]>('/social/friends'),
        api.get<FriendRequest[]>('/social/friends/requests'),
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch { /* silent */ }
    finally { setFriendsLoading(false); }
  }, []);

  useEffect(() => { if (user) loadFriends(); }, [user, loadFriends]);

  // ── User search with debounce
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

  // ── Handlers

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setGenErr('Username is required'); return; }
    setGenSaving(true); setGenErr(''); setGenMsg('');
    try {
      await api.patch('/users/profile', {
        username: username.trim(),
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      await refresh();
      setGenMsg('Profile saved.');
      setTimeout(() => setGenMsg(''), 2500);
    } catch (err) {
      setGenErr(err instanceof ApiError ? err.message : 'Failed to save');
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
      setTimeout(() => setSocMsg(''), 2500);
    } catch (err) {
      setSocErr(err instanceof ApiError ? err.message : 'Failed to save');
    } finally { setSocSaving(false); }
  };

  const handleConnectWallet = async () => {
    setWalletLoading(true); setWalletErr(''); setWalletMsg('');
    try {
      const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
      if (!eth) { setWalletErr('MetaMask not detected. Please install MetaMask.'); return; }
      const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[];
      const address = accounts[0];
      if (!address) { setWalletErr('No account selected in MetaMask.'); return; }
      const { nonce, message } = await api.post<{ nonce: string; message: string }>('/auth/link/wallet/nonce', { address });
      const signature = await eth.request({ method: 'personal_sign', params: [message, address] }) as string;
      await api.post('/auth/link/wallet', { address, signature, nonce });
      await refresh();
      setWalletMsg('MetaMask wallet linked successfully.');
    } catch (err) {
      setWalletErr(err instanceof ApiError ? err.message : 'Failed to connect wallet');
    } finally { setWalletLoading(false); }
  };

  const handleDisconnectWallet = async () => {
    if (!confirm('Unlink your MetaMask wallet?')) return;
    setWalletLoading(true); setWalletErr(''); setWalletMsg('');
    try {
      await api.delete('/auth/link/wallet');
      await refresh();
      setWalletMsg('Wallet unlinked.');
    } catch (err) {
      setWalletErr(err instanceof ApiError ? err.message : 'Failed to unlink wallet');
    } finally { setWalletLoading(false); }
  };

  const handleLinkGitHub = () => { window.location.href = `${API_URL}/auth/github`; };

  const handleUnlinkGitHub = async () => {
    if (!confirm('Unlink your GitHub account?')) return;
    setUnlinkingGitHub(true); setConErr(''); setConMsg('');
    try {
      await api.delete('/auth/link/github');
      await refresh();
      setConMsg('GitHub unlinked.');
    } catch (err) {
      setConErr(err instanceof ApiError ? err.message : 'Failed to unlink GitHub');
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
        await api.post('/auth/2fa/enable', {});
        setTwoFAEnabled(true);
        setSecMsg('2FA enabled. A code will be sent to your email on next login.');
      }
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to update 2FA');
    } finally { setToggling2FA(false); }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault(); setSecErr(''); setSecMsg(''); setEmailLoading(true);
    try {
      await api.post('/auth/email/change-request', { newEmail, password: emailPassword });
      setEmailStep('otp');
      setSecMsg(`Verification code sent to ${newEmail}.`);
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to request email change');
    } finally { setEmailLoading(false); }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault(); setSecErr(''); setSecMsg(''); setEmailLoading(true);
    try {
      await api.post('/auth/email/confirm', { code: emailOtp });
      await refresh();
      setEmailStep('idle'); setNewEmail(''); setEmailPassword(''); setEmailOtp('');
      setSecMsg('Email updated successfully.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code');
    } finally { setEmailLoading(false); }
  };

  const handleRequestDeleteAccount = async () => {
    setSecErr(''); setSecMsg(''); setRequestingDelete(true);
    try {
      await api.post('/auth/account/delete-request', {});
      setDeleteStep('otp');
      setSecMsg('Confirmation code sent to your email.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to send code');
    } finally { setRequestingDelete(false); }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault(); setSecErr(''); setDeleting(true);
    try {
      await api.delete('/auth/account', { code: deleteOtp });
      router.push('/');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code');
    } finally { setDeleting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-monad-400 animate-spin" />
      </div>
    );
  }

  const profileUrl = username ? `/u/${username}` : null;
  const walletAddress = (user as { walletAddress?: string })?.walletAddress;
  const userTag = (user as { userTag?: string })?.userTag;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Header card ── */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatarUrl} name={user?.displayName || user?.username} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-lg">{user?.displayName || user?.username || 'New User'}</span>
              {userTag && (
                <span className="text-xs font-mono bg-monad-500/15 text-monad-400 border border-monad-500/25 px-2 py-0.5 rounded-full">
                  #{userTag}
                </span>
              )}
            </div>
            {user?.username && (
              <div className="text-xs text-zinc-500 font-mono mt-0.5">@{user.username}</div>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {(user as { githubLogin?: string })?.githubLogin && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <GitHubLogo className="w-3 h-3" />
                  <span>{(user as { githubLogin?: string }).githubLogin}</span>
                </div>
              )}
              {walletAddress && (
                <div className="text-xs text-zinc-600 font-mono">
                  ETH: {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </div>
              )}
            </div>
          </div>
          {profileUrl && (
            <Link
              href={profileUrl}
              target="_blank"
              className="text-xs font-mono text-monad-400 hover:text-monad-300 border border-monad-400/30 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              ver perfil ↗
            </Link>
          )}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-monad-500/20 text-monad-300 border border-monad-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB: GENERAL
      ══════════════════════════════════════════════ */}
      {tab === 'general' && (
        <div>
          <h2 className="text-base font-semibold text-white mb-1">Perfil General</h2>
          <p className="text-xs text-zinc-500 mb-5">Tu nombre de usuario, nombre público y bio.</p>

          <Alert type="success" msg={genMsg} />
          <Alert type="error" msg={genErr} />

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 font-mono mb-1.5">Username *</label>
                <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-monad-500/50 transition-colors">
                  <span className="text-monad-400 font-mono text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="flex-1 bg-transparent text-white text-sm font-mono outline-none placeholder:text-zinc-600"
                    maxLength={30}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 font-mono mb-1.5">Nombre visible</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-monad-500/50 transition-colors"
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 font-mono mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-monad-500/50 transition-colors resize-none"
                maxLength={300}
                placeholder="Cuéntanos algo sobre ti..."
              />
              <div className="text-right text-xs text-zinc-600 mt-1">{bio.length}/300</div>
            </div>

            {userTag && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500 font-mono mb-0.5">Tu ID de usuario</div>
                  <div className="text-sm font-mono text-monad-400">#{userTag}</div>
                </div>
                <div className="text-xs text-zinc-600">Los demás pueden buscarte con este ID</div>
              </div>
            )}

            <button
              type="submit"
              disabled={genSaving}
              className="w-full py-3 rounded-xl bg-monad-500 hover:bg-monad-400 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {genSaving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: SOCIAL
      ══════════════════════════════════════════════ */}
      {tab === 'social' && (
        <div>
          <h2 className="text-base font-semibold text-white mb-1">Redes Sociales</h2>
          <p className="text-xs text-zinc-500 mb-5">Tus enlaces de redes sociales y sitio web.</p>

          <Alert type="success" msg={socMsg} />
          <Alert type="error" msg={socErr} />

          <form onSubmit={handleSaveSocial} className="space-y-3">
            {([
              {
                key: 'twitter',
                label: 'X / Twitter',
                icon: (
                  <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
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
                label: 'Sitio web',
                icon: (
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                value: websiteUrl,
                setter: setWebsiteUrl,
                placeholder: 'https://yourwebsite.com',
              },
            ] as Array<{ key: string; label: string; icon: React.ReactNode; value: string; setter: (v: string) => void; placeholder: string }>).map((item) => (
              <div key={item.key}>
                <label className="block text-xs text-zinc-400 font-mono mb-1.5">{item.label}</label>
                <div className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-600 transition-colors">
                  {item.icon}
                  <input
                    type="url"
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                    placeholder={item.placeholder}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                  />
                  {item.value && (
                    <button
                      type="button"
                      onClick={() => item.setter('')}
                      className="text-zinc-600 hover:text-zinc-400 text-xs"
                    >✕</button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={socSaving}
              className="w-full py-3 rounded-xl bg-monad-500 hover:bg-monad-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {socSaving ? 'Guardando...' : 'Guardar redes sociales'}
            </button>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: WALLET
      ══════════════════════════════════════════════ */}
      {tab === 'wallet' && (
        <div>
          <h2 className="text-base font-semibold text-white mb-1">Wallet de Pagos</h2>
          <p className="text-xs text-zinc-500 mb-5">
            Vincula tu MetaMask para realizar y recibir pagos en el marketplace.
            Tu cuenta Bolty se crea con GitHub o email — la wallet es opcional y solo para pagos.
          </p>

          <Alert type="success" msg={walletMsg} />
          <Alert type="error" msg={walletErr} />

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.315 14.485C20.44 18.121 16.992 20.8 13 20.8c-4.418 0-8-3.582-8-8s3.582-8 8-8c2.133 0 4.068.833 5.498 2.188L16.5 9H21V4.5l-1.641 1.641C17.634 4.31 15.399 3.2 13 3.2 7.808 3.2 3.6 7.408 3.6 12.6S7.808 22 13 22c4.836 0 8.878-3.395 9.75-7.877l-1.435.362z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">MetaMask</div>
                {walletAddress ? (
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    {walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 mt-0.5">No vinculada</div>
                )}
              </div>
              {walletAddress ? (
                <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">Conectada</span>
              ) : (
                <span className="text-xs text-zinc-600 bg-zinc-800/60 border border-zinc-700 px-2 py-1 rounded-lg">Sin vincular</span>
              )}
            </div>

            {walletAddress ? (
              <div className="space-y-3">
                <div className="bg-zinc-800/40 rounded-xl p-3">
                  <div className="text-xs text-zinc-500 mb-1">Dirección completa</div>
                  <div className="text-xs font-mono text-zinc-300 break-all">{walletAddress}</div>
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  disabled={walletLoading}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {walletLoading ? 'Desvinculando...' : 'Desvincular MetaMask'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Al vincular tu wallet, se te pedirá firmar un mensaje para verificar que eres el propietario.
                  Esta acción <strong className="text-zinc-300">no genera ninguna transacción</strong> en la blockchain.
                </p>
                <button
                  onClick={handleConnectWallet}
                  disabled={walletLoading}
                  className="w-full py-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {walletLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-orange-500/40 border-t-orange-400 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    'Conectar MetaMask'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: CONEXIONES
      ══════════════════════════════════════════════ */}
      {tab === 'conexiones' && (
        <div>
          <h2 className="text-base font-semibold text-white mb-1">Cuentas Conectadas</h2>
          <p className="text-xs text-zinc-500 mb-5">Vincula servicios externos para ampliar tus funciones en Bolty.</p>

          <Alert type="success" msg={conMsg} />
          <Alert type="error" msg={conErr} />

          <div className="space-y-3">
            {/* GitHub */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <GitHubLogo className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">GitHub</div>
                  {(user as { githubLogin?: string })?.githubLogin ? (
                    <div className="text-xs text-zinc-400 font-mono mt-0.5">@{(user as { githubLogin?: string }).githubLogin}</div>
                  ) : (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      Necesario para importar repositorios y crear listings de código.
                    </div>
                  )}
                </div>
                {(user as { githubLogin?: string })?.githubLogin ? (
                  <button
                    onClick={handleUnlinkGitHub}
                    disabled={unlinkingGitHub}
                    className="text-xs text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {unlinkingGitHub ? 'Desvinculando...' : 'Desvincular'}
                  </button>
                ) : (
                  <button
                    onClick={handleLinkGitHub}
                    className="text-xs text-monad-400 hover:text-monad-300 border border-monad-400/30 hover:border-monad-400/60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Vincular
                  </button>
                )}
              </div>
            </div>

            {/* Solana — future */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.396 8.404a.42.42 0 00-.297-.124H4.25a.21.21 0 00-.148.36l2.454 2.453a.42.42 0 00.297.124h12.847a.21.21 0 00.148-.36l-2.452-2.453zm0 7.193a.42.42 0 00-.297-.124H4.25a.21.21 0 00-.148.36l2.454 2.453a.42.42 0 00.297.124h12.847a.21.21 0 00.148-.36l-2.452-2.453zM4.25 11.719a.21.21 0 00-.148.36l2.454 2.453a.42.42 0 00.297.124h12.847a.21.21 0 00.148-.36l-2.452-2.453a.42.42 0 00-.297-.124H4.25z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-400">Phantom (Solana)</div>
                  <div className="text-xs text-zinc-600 mt-0.5">Próximamente</div>
                </div>
                <span className="text-xs text-zinc-600 border border-zinc-800 px-3 py-1.5 rounded-lg">Coming soon</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: AMIGOS
      ══════════════════════════════════════════════ */}
      {tab === 'amigos' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-white">Amigos</h2>
            <span className="text-xs text-zinc-600 font-mono">{friends.length} amigo{friends.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-xs text-zinc-500 mb-5">Busca personas por @username o por su ID de usuario (#1234).</p>

          {/* Search */}
          <div className="mb-6">
            <div className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-700 rounded-xl px-4 py-3 focus-within:border-monad-500/50 transition-colors">
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1016.65 16.65z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por @username o #1234..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600 font-mono"
              />
              {searching && <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 border-t-monad-400 animate-spin flex-shrink-0" />}
              {searchQuery && !searching && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-zinc-800 rounded-xl overflow-hidden">
                {searchResults.map((u, i) => (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors ${i > 0 ? 'border-t border-zinc-800/60' : ''}`}
                  >
                    <Avatar src={u.avatarUrl} name={u.displayName || u.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{u.displayName || u.username}</div>
                      <div className="text-xs text-zinc-500 font-mono">
                        {u.username && <span>@{u.username}</span>}
                        {u.userTag && <span className="ml-2 text-monad-400">#{u.userTag}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(u.id)}
                      disabled={sendingTo === u.id}
                      className="text-xs text-monad-400 border border-monad-400/30 hover:border-monad-400/60 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      {sendingTo === u.id ? '...' : '+ Añadir'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.trim() && !searching && searchResults.length === 0 && (
              <div className="mt-2 text-center py-6 text-zinc-600 text-xs font-mono border border-zinc-800/50 rounded-xl">
                No se encontraron usuarios para &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          {/* Pending requests */}
          {friendsLoading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500 py-4">
              <div className="w-3 h-3 rounded-full border border-zinc-700 border-t-monad-400 animate-spin" />
              Cargando...
            </div>
          ) : (
            <div className="space-y-4">
              {friendRequests.length > 0 && (
                <div>
                  <div className="text-xs text-amber-400 font-mono mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {friendRequests.length} solicitud{friendRequests.length !== 1 ? 'es' : ''} pendiente{friendRequests.length !== 1 ? 's' : ''}
                  </div>
                  <div className="space-y-2">
                    {friendRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                        <Avatar src={req.from.avatarUrl} name={req.from.displayName || req.from.username} size="sm" />
                        <div className="flex-1 min-w-0">
                          <Link href={`/u/${req.from.username}`} className="text-sm font-medium text-white hover:text-monad-300 transition-colors">
                            {req.from.displayName || req.from.username}
                          </Link>
                          <div className="text-xs text-zinc-500 font-mono">
                            {req.from.username && <span>@{req.from.username}</span>}
                            {req.from.userTag && <span className="ml-2 text-monad-400/70">#{req.from.userTag}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleRespondToRequest(req.id, true)}
                            disabled={friendActionId === req.id}
                            className="text-xs text-green-400 border border-green-400/30 hover:border-green-400/60 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(req.id, false)}
                            disabled={friendActionId === req.id}
                            className="text-xs text-zinc-500 border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends list */}
              {friends.length === 0 && friendRequests.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 text-xs font-mono border border-zinc-800/50 rounded-xl">
                  Aún no tienes amigos. Usa el buscador de arriba para encontrar personas.
                </div>
              ) : friends.length > 0 ? (
                <div>
                  <div className="text-xs text-zinc-500 font-mono mb-2">Tus amigos</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {friends.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl px-3 py-2.5 group hover:border-zinc-700 transition-colors">
                        <Avatar src={f.friend.avatarUrl} name={f.friend.displayName || f.friend.username} size="sm" />
                        <div className="flex-1 min-w-0">
                          <Link href={`/u/${f.friend.username}`} className="text-xs font-medium text-white hover:text-monad-300 transition-colors truncate block">
                            {f.friend.displayName || f.friend.username}
                          </Link>
                          <div className="text-xs text-zinc-600 font-mono flex items-center gap-1.5">
                            {f.friend.username && <span>@{f.friend.username}</span>}
                            {f.friend.userTag && <span className="text-monad-400/60">#{f.friend.userTag}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dm?peer=${f.friend.id}`}
                            className="text-xs text-monad-400 border border-monad-400/30 hover:border-monad-400/60 px-2 py-1 rounded-lg transition-colors"
                            title="Enviar mensaje"
                          >
                            DM
                          </Link>
                          <button
                            onClick={() => handleUnfriend(f.friend.id)}
                            disabled={friendActionId === f.friend.id}
                            className="text-xs text-zinc-600 hover:text-red-400 border border-zinc-800 hover:border-red-400/30 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar amigo"
                          >
                            ✕
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
      )}

      {/* ══════════════════════════════════════════════
          TAB: SEGURIDAD
      ══════════════════════════════════════════════ */}
      {tab === 'seguridad' && (
        <div>
          <h2 className="text-base font-semibold text-white mb-1">Seguridad</h2>
          <p className="text-xs text-zinc-500 mb-5">Gestiona la seguridad de tu cuenta.</p>

          <Alert type="success" msg={secMsg} />
          <Alert type="error" msg={secErr} />

          <div className="space-y-4">

            {/* 2FA */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Autenticación de dos factores</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {twoFAEnabled
                      ? 'Activado — se te enviará un código por email al iniciar sesión'
                      : 'Desactivado — actívalo para mayor seguridad'}
                  </div>
                </div>
                <button
                  onClick={() => { if (!twoFAEnabled) handle2FAToggle(); else setToggling2FA((v) => !v); }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    twoFAEnabled
                      ? 'text-red-400 border-red-400/30 hover:border-red-400/60'
                      : 'text-monad-400 border-monad-400/30 hover:border-monad-400/60'
                  }`}
                >
                  {twoFAEnabled ? 'Desactivar' : 'Activar'}
                </button>
              </div>
              {twoFAEnabled && toggling2FA && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-400 mb-2">Introduce tu contraseña para desactivar el 2FA:</p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={disable2FAPassword}
                      onChange={(e) => setDisable2FAPassword(e.target.value)}
                      placeholder="Contraseña actual"
                      className="flex-1 bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-monad-500/60 transition-all placeholder:text-zinc-600"
                    />
                    <button
                      onClick={handle2FAToggle}
                      disabled={!disable2FAPassword}
                      className="text-xs text-red-400 border border-red-400/30 px-3 py-2 rounded-xl hover:border-red-400/60 transition-colors disabled:opacity-40"
                    >
                      Confirmar
                    </button>
                    <button onClick={() => setToggling2FA(false)} className="text-xs text-zinc-500 px-2 py-2">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Change email */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-white">Correo electrónico</div>
                  <div className="text-xs text-zinc-500 mt-0.5 font-mono">
                    {(user as { email?: string })?.email || 'No configurado'}
                  </div>
                </div>
                {emailStep === 'idle' && (
                  <button
                    onClick={() => setEmailStep('form')}
                    className="text-xs text-monad-400 border border-monad-400/30 hover:border-monad-400/60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              {emailStep === 'form' && (
                <form onSubmit={handleRequestEmailChange} className="space-y-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Nuevo email"
                    required
                    className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-monad-500/60 transition-all placeholder:text-zinc-600"
                  />
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="Contraseña actual"
                    className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-monad-500/60 transition-all placeholder:text-zinc-600"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={emailLoading || !newEmail}
                      className="flex-1 py-2 rounded-xl bg-monad-500 hover:bg-monad-400 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {emailLoading ? 'Enviando...' : 'Enviar código de verificación'}
                    </button>
                    <button type="button" onClick={() => { setEmailStep('idle'); setSecErr(''); setSecMsg(''); }} className="text-xs text-zinc-500 px-3">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {emailStep === 'otp' && (
                <form onSubmit={handleConfirmEmailChange} className="space-y-3">
                  <p className="text-xs text-zinc-400">Introduce el código enviado a <span className="text-white font-mono">{newEmail}</span>:</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2 text-white text-center text-xl font-mono tracking-[0.5em] outline-none focus:border-monad-500/60 transition-all placeholder:text-zinc-700 placeholder:tracking-normal"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={emailLoading || emailOtp.length !== 6}
                      className="flex-1 py-2 rounded-xl bg-monad-500 hover:bg-monad-400 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {emailLoading ? 'Verificando...' : 'Confirmar cambio'}
                    </button>
                    <button type="button" onClick={() => { setEmailStep('idle'); setSecErr(''); setSecMsg(''); }} className="text-xs text-zinc-500 px-3">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Delete account */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-red-400">Eliminar cuenta</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Elimina permanentemente tu cuenta y todos tus datos</div>
                </div>
                {deleteStep === 'idle' && (
                  <button
                    onClick={() => setDeleteStep('confirm')}
                    className="text-xs text-red-400 border border-red-400/30 hover:border-red-400/60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              {deleteStep === 'confirm' && (
                <div className="mt-3 pt-3 border-t border-red-500/20 space-y-3">
                  <p className="text-xs text-red-300 leading-relaxed">
                    <strong>Esta acción es irreversible.</strong> Todos tus datos, listings y repositorios serán eliminados permanentemente. Te enviaremos un código de confirmación a tu email.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRequestDeleteAccount}
                      disabled={requestingDelete}
                      className="flex-1 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {requestingDelete ? 'Enviando código...' : 'Enviar código de confirmación'}
                    </button>
                    <button type="button" onClick={() => { setDeleteStep('idle'); setSecErr(''); }} className="text-xs text-zinc-500 px-3">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 'otp' && (
                <form onSubmit={handleDeleteAccount} className="mt-3 pt-3 border-t border-red-500/20 space-y-3">
                  <p className="text-xs text-zinc-400">
                    Introduce el código enviado a <span className="text-white font-mono">{(user as { email?: string })?.email}</span>:
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-zinc-900/70 border border-red-500/30 rounded-xl px-3 py-2 text-white text-center text-xl font-mono tracking-[0.5em] outline-none focus:border-red-500/60 transition-all placeholder:text-zinc-700 placeholder:tracking-normal"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={deleting || deleteOtp.length !== 6}
                      className="flex-1 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Eliminando...' : 'Eliminar mi cuenta permanentemente'}
                    </button>
                    <button type="button" onClick={() => { setDeleteStep('idle'); setDeleteOtp(''); setSecErr(''); }} className="text-xs text-zinc-500 px-3">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
