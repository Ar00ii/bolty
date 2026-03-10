'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';

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

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/auth'); return; }
    setUsername(user.username || '');
    setDisplayName(user.displayName || '');
    setTwitterUrl(user.twitterUrl || '');
    setLinkedinUrl(user.linkedinUrl || '');
    setWebsiteUrl(user.websiteUrl || '');
  }, [user, isLoading, router]);

  // Load bio from full profile
  useEffect(() => {
    if (!user) return;
    api.get<{ bio?: string }>('/users/profile')
      .then((data) => { if (data.bio) setBio(data.bio); })
      .catch(() => {});
  }, [user]);

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

      {/* Avatar + wallet info */}
      <div className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 mb-6">
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full border-2 border-zinc-700" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-monad-500/20 border-2 border-monad-500/30 flex items-center justify-center text-monad-400 text-2xl font-bold">
            {(user?.displayName || user?.username || 'U')[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-white font-semibold">{user?.displayName || user?.username}</div>
          {user?.walletAddress && (
            <div className="text-xs text-zinc-500 font-mono mt-0.5">
              ETH: {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
            </div>
          )}
          {user?.githubLogin && (
            <div className="text-xs text-zinc-500 font-mono mt-0.5">
              GitHub: @{user.githubLogin}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-green-400 text-sm">Profile saved!</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Username */}
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

          {/* Display Name */}
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

        {/* Bio */}
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

        {/* Social Links */}
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
    </div>
  );
}
