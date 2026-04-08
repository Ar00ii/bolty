'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface PublicRepo {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  githubUrl: string;
  topics: string[];
  downloadCount: number;
  isLocked: boolean;
  lockedPriceUsd: number | null;
}

interface PublicProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  githubLogin: string | null;
  walletAddress: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  role: string;
  createdAt: string;
  repositories: PublicRepo[];
  _count: { repositories: number };
}

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { user: currentUser, isAuthenticated } = useAuth();
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [friendRequestId, setFriendRequestId] = useState<string | undefined>();
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendMsg, setFriendMsg] = useState('');

  useEffect(() => {
    if (!username) return;
    api.get<PublicProfile>(`/users/${username}`)
      .then(p => {
        setProfile(p);
        if (isAuthenticated && currentUser) {
          if (currentUser.id === p.id) {
            setFriendStatus('self');
          } else {
            api.get<{ status: FriendStatus; requestId?: string }>(`/social/friends/status/${p.id}`)
              .then(s => { setFriendStatus(s.status); setFriendRequestId(s.requestId); })
              .catch(() => {});
          }
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  const handleFriendAction = async () => {
    if (!isAuthenticated || friendStatus === 'self') return;
    setFriendLoading(true);
    setFriendMsg('');
    try {
      if (friendStatus === 'none') {
        await api.post('/social/friends/request', { username: profile?.username });
        setFriendStatus('pending_sent');
        setFriendMsg('Friend request sent');
      } else if (friendStatus === 'pending_received' && friendRequestId) {
        await api.post(`/social/friends/respond/${friendRequestId}`, { accept: true });
        setFriendStatus('friends');
        setFriendMsg('Now friends');
      } else if (friendStatus === 'friends' && profile) {
        await api.delete(`/social/friends/${profile.id}`);
        setFriendStatus('none');
      }
    } catch (err) {
      setFriendMsg(err instanceof ApiError ? err.message : 'Action failed');
    } finally { setFriendLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-monad-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-mono text-zinc-700 mb-2">404</div>
          <div className="text-zinc-400 text-sm">User not found</div>
          <Link href="/" className="text-monad-400 text-sm hover:text-monad-300 mt-3 inline-block">← back home</Link>
        </div>
      </div>
    );
  }

  const displayName = profile.displayName || profile.username;
  const joinedDate = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {/* Avatar */}
        <div className="shrink-0">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={displayName || ''}
              className="w-24 h-24 rounded-2xl border-2 border-zinc-700"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-monad-500/20 border-2 border-monad-500/30 flex items-center justify-center text-monad-400 text-4xl font-light">
              {displayName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
            <div>
              <h1 className="text-2xl font-light text-white">{displayName}</h1>
              <p className="text-zinc-500 font-mono text-sm">@{profile.username}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {profile.role === 'ADMIN' && (
                <span className="text-xs font-mono bg-monad-500/10 text-monad-400 border border-monad-500/20 px-2 py-0.5 rounded">admin</span>
              )}
              {isAuthenticated && friendStatus !== 'self' && (
                <button
                  onClick={handleFriendAction}
                  disabled={friendLoading || friendStatus === 'pending_sent'}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                    friendStatus === 'friends'
                      ? 'border-zinc-700 text-zinc-400 hover:border-red-500/50 hover:text-red-400'
                      : friendStatus === 'pending_received'
                        ? 'border-green-500/40 text-green-400 hover:bg-green-500/10'
                        : friendStatus === 'pending_sent'
                          ? 'border-zinc-700 text-zinc-500 cursor-default'
                          : 'border-monad-500/40 text-monad-400 hover:bg-monad-500/10'
                  }`}
                >
                  {friendLoading ? '...'
                    : friendStatus === 'friends' ? 'Friends'
                    : friendStatus === 'pending_received' ? 'Accept request'
                    : friendStatus === 'pending_sent' ? 'Pending'
                    : 'Add friend'}
                </button>
              )}
              {friendMsg && <span className="text-xs text-green-400">{friendMsg}</span>}
            </div>
          </div>

          {profile.bio && (
            <p className="text-zinc-300 text-sm mt-2 leading-relaxed">{profile.bio}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <span className="text-xs text-zinc-500 font-mono">Joined {joinedDate}</span>
            <span className="text-xs text-zinc-500 font-mono">{profile._count.repositories} repos</span>
            {profile.walletAddress && (
              <span className="text-xs text-zinc-600 font-mono">
                ETH: {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
              </span>
            )}
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {profile.githubLogin && (
              <a
                href={`https://github.com/${profile.githubLogin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            )}

            {profile.twitterUrl && (
              <a
                href={profile.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X / Twitter
              </a>
            )}

            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}

            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Repositories */}
      <div>
        <h2 className="text-lg font-light text-white mb-4 font-mono">
          Repositories <span className="text-zinc-600 font-normal text-sm">({profile._count.repositories})</span>
        </h2>

        {profile.repositories.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-mono text-sm border border-zinc-800/50 rounded-xl">
            No public repositories yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.repositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {repo.isLocked && <span className="text-yellow-400 shrink-0">🔒</span>}
                    {repo.isLocked ? (
                      <span className="text-yellow-400 font-mono font-light text-sm truncate">{repo.name}</span>
                    ) : (
                      <a
                        href={repo.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-monad-400 font-mono font-light text-sm truncate hover:text-monad-300"
                      >
                        {repo.name}
                      </a>
                    )}
                  </div>
                  {repo.language && (
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded shrink-0 ml-2">{repo.language}</span>
                  )}
                </div>

                {repo.isLocked && repo.lockedPriceUsd ? (
                  <div className="text-xs text-yellow-400 font-mono bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-0.5 inline-block mb-2">
                    ${repo.lockedPriceUsd.toFixed(2)} USD to unlock
                  </div>
                ) : (
                  repo.description && (
                    <p className="text-zinc-400 text-xs leading-relaxed mb-2 line-clamp-2">{repo.description}</p>
                  )
                )}

                <div className="flex items-center gap-3 text-zinc-600 text-xs font-mono">
                  <span>★ {repo.stars}</span>
                  <span>⑂ {repo.forks}</span>
                  <span>↓ {repo.downloadCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
