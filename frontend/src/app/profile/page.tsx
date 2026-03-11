'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Friend {
  id: string;
  friend: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null };
  since: string;
}

interface FriendRequest {
  id: string;
  from: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null };
  createdAt: string;
}

function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [unlinkingGitHub, setUnlinkingGitHub] = useState(false);

  // Security section
  const [secMsg, setSecMsg] = useState('');
  const [secErr, setSecErr] = useState('');

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');

  // Change email
  const [emailStep, setEmailStep] = useState<'idle' | 'form' | 'otp'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Delete account
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'otp'>('idle');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [requestingDelete, setRequestingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendActionId, setFriendActionId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/auth'); return; }
    setUsername(user.username || '');
    setDisplayName(user.displayName || '');
    setTwitterUrl(user.twitterUrl || '');
    setLinkedinUrl(user.linkedinUrl || '');
    setWebsiteUrl(user.websiteUrl || '');
    setTwoFAEnabled(!!user.twoFactorEnabled);
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.get<{ bio?: string }>('/users/profile')
      .then((data) => { if (data.bio) setBio(data.bio); })
      .catch(() => {});
  }, [user]);

  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.get<Friend[]>('/social/friends'),
        api.get<FriendRequest[]>('/social/friends/requests'),
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch {
      // silent
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadFriends();
  }, [user, loadFriends]);

  // Handle ?linked=github param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('linked') === 'github') {
        refresh();
        window.history.replaceState({}, '', '/profile');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username is required'); return; }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch('/users/profile', {
        username: username.trim(),
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handle2FAToggle = async () => {
    setSecErr(''); setSecMsg('');
    setToggling2FA(true);
    try {
      if (twoFAEnabled) {
        await api.post('/auth/2fa/disable', { password: disable2FAPassword });
        setTwoFAEnabled(false);
        setDisable2FAPassword('');
        setSecMsg('Two-factor authentication disabled.');
      } else {
        await api.post('/auth/2fa/enable', {});
        setTwoFAEnabled(true);
        setSecMsg('Two-factor authentication enabled. A code will be sent to your email on next login.');
      }
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to update 2FA settings');
    } finally {
      setToggling2FA(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecErr(''); setSecMsg('');
    setEmailLoading(true);
    try {
      await api.post('/auth/email/change-request', { newEmail, password: emailPassword });
      setEmailStep('otp');
      setSecMsg(`Verification code sent to ${newEmail}. Enter it below.`);
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to request email change');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecErr(''); setSecMsg('');
    setEmailLoading(true);
    try {
      await api.post('/auth/email/confirm', { code: emailOtp });
      await refresh();
      setEmailStep('idle');
      setNewEmail(''); setEmailPassword(''); setEmailOtp('');
      setSecMsg('Email address updated successfully.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestDeleteAccount = async () => {
    setSecErr(''); setSecMsg('');
    setRequestingDelete(true);
    try {
      await api.post('/auth/account/delete-request', {});
      setDeleteStep('otp');
      setSecMsg('A confirmation code has been sent to your email.');
    } catch (err) {
      setSecErr(err instanceof ApiError ? err.message : 'Failed to send confirmation code');
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
      setSecErr(err instanceof ApiError ? err.message : 'Invalid or expired code');
    } finally {
      setDeleting(false);
    }
  };

  const handleUnlinkGitHub = async () => {
    if (!confirm('Unlink your GitHub account?')) return;
    setUnlinkingGitHub(true);
    try {
      await api.delete('/auth/link/github');
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to unlink GitHub');
    } finally {
      setUnlinkingGitHub(false);
    }
  };

  const handleLinkGitHub = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    setFriendActionId(requestId);
    try {
      await api.post(`/social/friends/respond/${requestId}`, { accept });
      await loadFriends();
    } catch {
      // silent
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
      // silent
    } finally {
      setFriendActionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-monad-400 animate-spin" />
      </div>
    );
  }

  const profileUrl = username ? `/u/${username}` : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Profile</h1>
          <p className="text-sm text-zinc-400">Manage your public identity</p>
        </div>
        {profileUrl && (
          <Link
            href={profileUrl}
            target="_blank"
            className="text-xs font-mono text-monad-400 hover:text-monad-300 border border-monad-400/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            view public profile ↗
          </Link>
        )}
      </div>

      {/* ── Identity card ── */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full border-2 border-zinc-700 flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-monad-500/20 border-2 border-monad-500/30 flex items-center justify-center text-monad-400 text-2xl font-bold flex-shrink-0">
              {(user?.displayName || user?.username || 'U')[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-white font-semibold">{user?.displayName || user?.username}</div>

            {/* Bolty username */}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="inline-flex items-center justify-center w-4 h-4 rounded bg-monad-500/20">
                <svg className="w-2.5 h-2.5 text-monad-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                Bolty: <span className="text-monad-400">@{user?.username || '—'}</span>
              </span>
            </div>

            {/* GitHub username */}
            {user?.githubLogin && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <GitHubLogo className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-mono">
                  GitHub: <span className="text-zinc-300">@{user.githubLogin}</span>
                </span>
              </div>
            )}

            {/* Wallet */}
            {user?.walletAddress && (
              <div className="text-xs text-zinc-600 font-mono mt-0.5">
                ETH: {user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-green-400 text-sm">Profile saved successfully.</p>
        </div>
      )}

      {/* ── Profile form ── */}
      <form onSubmit={handleSave} className="space-y-4">
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
            <label className="block text-xs text-zinc-400 font-mono mb-1.5">Display Name</label>
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
          />
        </div>

        {/* Social links */}
        <div className="border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500 font-mono mb-3">Social Links</p>
          <div className="space-y-3">
            {[
              {
                key: 'twitter',
                icon: (
                  <svg className="w-4 h-4 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                ),
                value: twitterUrl,
                setter: setTwitterUrl,
                placeholder: 'https://x.com/yourhandle',
              },
              {
                key: 'linkedin',
                icon: (
                  <svg className="w-4 h-4 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                ),
                value: linkedinUrl,
                setter: setLinkedinUrl,
                placeholder: 'https://linkedin.com/in/yourprofile',
              },
              {
                key: 'website',
                icon: (
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                value: websiteUrl,
                setter: setWebsiteUrl,
                placeholder: 'https://yourwebsite.com',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 focus-within:border-zinc-600 transition-colors">
                {item.icon}
                <input
                  type="url"
                  value={item.value}
                  onChange={(e) => item.setter(e.target.value)}
                  placeholder={item.placeholder}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-monad-500 hover:bg-monad-400 text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* ── Connected Accounts ── */}
      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h2 className="text-sm font-semibold text-white mb-1">Connected Accounts</h2>
        <p className="text-xs text-zinc-500 mb-4">Link external services to expand your Bolty features.</p>

        <div className="space-y-3">
          {/* GitHub */}
          <div className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <GitHubLogo className="w-4.5 h-4.5 text-white w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">GitHub</div>
              {user?.githubLogin ? (
                <div className="text-xs text-zinc-400 font-mono mt-0.5">@{user.githubLogin}</div>
              ) : (
                <div className="text-xs text-zinc-600 mt-0.5">Not linked</div>
              )}
            </div>
            {user?.githubLogin ? (
              <button
                onClick={handleUnlinkGitHub}
                disabled={unlinkingGitHub}
                className="text-xs text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {unlinkingGitHub ? 'Unlinking...' : 'Unlink'}
              </button>
            ) : (
              <button
                onClick={handleLinkGitHub}
                className="text-xs text-monad-400 hover:text-monad-300 border border-monad-400/30 hover:border-monad-400/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                Link
              </button>
            )}
          </div>

          {/* LinkedIn — link only (no OAuth, just profile URL) */}
          <div className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 opacity-60">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-400">LinkedIn</div>
              <div className="text-xs text-zinc-600 mt-0.5">Add your URL in the Social Links section above</div>
            </div>
            <span className="text-xs text-zinc-600 border border-zinc-800 px-3 py-1.5 rounded-lg">Coming soon</span>
          </div>
        </div>
      </div>

      {/* ── Friends & Connections ── */}
      <div className="mt-8 border-t border-zinc-800 pt-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-white">Friends</h2>
          <span className="text-xs text-zinc-600 font-mono">{friends.length} friend{friends.length !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Manage your friend connections.</p>

        {friendsLoading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500 py-4">
            <div className="w-3 h-3 rounded-full border border-zinc-700 border-t-monad-400 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="space-y-3">
            {/* Incoming requests */}
            {friendRequests.length > 0 && (
              <div>
                <p className="text-xs text-amber-400 font-mono mb-2">
                  {friendRequests.length} pending request{friendRequests.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {friendRequests.map((req) => (
                    <div key={req.id} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                      {req.from.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={req.from.avatarUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-monad-500/20 border border-monad-500/30 flex items-center justify-center text-monad-400 text-xs font-bold flex-shrink-0">
                          {(req.from.displayName || req.from.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link href={`/u/${req.from.username}`} className="text-sm font-medium text-white hover:text-monad-300 transition-colors">
                          {req.from.displayName || req.from.username}
                        </Link>
                        {req.from.username && (
                          <div className="text-xs text-zinc-500 font-mono">@{req.from.username}</div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleRespondToRequest(req.id, true)}
                          disabled={friendActionId === req.id}
                          className="text-xs text-green-400 border border-green-400/30 hover:border-green-400/60 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(req.id, false)}
                          disabled={friendActionId === req.id}
                          className="text-xs text-zinc-500 border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
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
              <div className="text-center py-8 text-zinc-600 text-xs font-mono border border-zinc-800/50 rounded-xl">
                No friends yet. Visit a user&apos;s profile to send a friend request.
              </div>
            ) : friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl px-3 py-2.5 group hover:border-zinc-700 transition-colors">
                    {f.friend.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.friend.avatarUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-monad-500/20 border border-monad-500/30 flex items-center justify-center text-monad-400 text-xs font-bold flex-shrink-0">
                        {(f.friend.displayName || f.friend.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/u/${f.friend.username}`} className="text-xs font-medium text-white hover:text-monad-300 transition-colors truncate block">
                        {f.friend.displayName || f.friend.username}
                      </Link>
                      {f.friend.username && (
                        <div className="text-xs text-zinc-600 font-mono">@{f.friend.username}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/dm?peer=${f.friend.id}`}
                        className="text-xs text-monad-400 border border-monad-400/30 hover:border-monad-400/60 px-2 py-1 rounded-lg transition-colors"
                        title="Send message"
                      >
                        DM
                      </Link>
                      <button
                        onClick={() => handleUnfriend(f.friend.id)}
                        disabled={friendActionId === f.friend.id}
                        className="text-xs text-zinc-600 hover:text-red-400 border border-zinc-800 hover:border-red-400/30 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                        title="Unfriend"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Security ── */}
      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h2 className="text-sm font-semibold text-white mb-1">Security</h2>
        <p className="text-xs text-zinc-500 mb-4">Manage your account security settings.</p>

        {secMsg && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-green-400 text-sm">{secMsg}</p>
          </div>
        )}
        {secErr && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">{secErr}</p>
          </div>
        )}

        <div className="space-y-4">

          {/* ── 2FA Toggle ── */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Two-Factor Authentication</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {twoFAEnabled ? 'Enabled — a code will be emailed to you on login' : 'Disabled — enable for extra login security'}
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
                {twoFAEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            {/* Disable form — password required */}
            {twoFAEnabled && toggling2FA && (
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-400 mb-2">Enter your password to disable 2FA:</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={disable2FAPassword}
                    onChange={(e) => setDisable2FAPassword(e.target.value)}
                    placeholder="Current password"
                    className="flex-1 bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-monad-500/60 transition-all placeholder:text-zinc-600"
                  />
                  <button
                    onClick={handle2FAToggle}
                    disabled={!disable2FAPassword}
                    className="text-xs text-red-400 border border-red-400/30 px-3 py-2 rounded-xl hover:border-red-400/60 transition-colors disabled:opacity-40"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setToggling2FA(false)}
                    className="text-xs text-zinc-500 px-2 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Change Email ── */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">Email Address</div>
                <div className="text-xs text-zinc-500 mt-0.5 font-mono">
                  {user?.email || 'No email set'}
                </div>
              </div>
              {emailStep === 'idle' && (
                <button
                  onClick={() => setEmailStep('form')}
                  className="text-xs text-monad-400 border border-monad-400/30 hover:border-monad-400/60 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            {emailStep === 'form' && (
              <form onSubmit={handleRequestEmailChange} className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  required
                  className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-monad-500/60 transition-all placeholder:text-zinc-600"
                />
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-monad-500/60 transition-all placeholder:text-zinc-600"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={emailLoading || !newEmail}
                    className="flex-1 py-2 rounded-xl bg-monad-500 hover:bg-monad-400 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {emailLoading ? 'Sending...' : 'Send verification code'}
                  </button>
                  <button type="button" onClick={() => { setEmailStep('idle'); setSecErr(''); setSecMsg(''); }} className="text-xs text-zinc-500 px-3">Cancel</button>
                </div>
              </form>
            )}

            {emailStep === 'otp' && (
              <form onSubmit={handleConfirmEmailChange} className="space-y-3">
                <p className="text-xs text-zinc-400">Enter the 6-digit code sent to <span className="text-white font-mono">{newEmail}</span>:</p>
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
                    {emailLoading ? 'Verifying...' : 'Confirm change'}
                  </button>
                  <button type="button" onClick={() => { setEmailStep('idle'); setSecErr(''); setSecMsg(''); }} className="text-xs text-zinc-500 px-3">Cancel</button>
                </div>
              </form>
            )}
          </div>

          {/* ── Delete Account ── */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-400">Delete Account</div>
                <div className="text-xs text-zinc-500 mt-0.5">Permanently remove your account and all data</div>
              </div>
              {deleteStep === 'idle' && (
                <button
                  onClick={() => setDeleteStep('confirm')}
                  className="text-xs text-red-400 border border-red-400/30 hover:border-red-400/60 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
            </div>

            {deleteStep === 'confirm' && (
              <div className="mt-3 pt-3 border-t border-red-500/20 space-y-3">
                <p className="text-xs text-red-300 leading-relaxed">
                  <strong>This action is irreversible.</strong> All your data, listings, and repositories will be permanently deleted. We will send a confirmation code to your email address to verify this request.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestDeleteAccount}
                    disabled={requestingDelete}
                    className="flex-1 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {requestingDelete ? 'Sending code...' : 'Send confirmation code to my email'}
                  </button>
                  <button type="button" onClick={() => { setDeleteStep('idle'); setSecErr(''); }} className="text-xs text-zinc-500 px-3">Cancel</button>
                </div>
              </div>
            )}

            {deleteStep === 'otp' && (
              <form onSubmit={handleDeleteAccount} className="mt-3 pt-3 border-t border-red-500/20 space-y-3">
                <p className="text-xs text-zinc-400">Enter the 6-digit code sent to <span className="text-white font-mono">{user?.email}</span>:</p>
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
                    {deleting ? 'Deleting...' : 'Permanently delete my account'}
                  </button>
                  <button type="button" onClick={() => { setDeleteStep('idle'); setDeleteOtp(''); setSecErr(''); }} className="text-xs text-zinc-500 px-3">Cancel</button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
