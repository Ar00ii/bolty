'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

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
    api
      .get<PublicProfile>(`/users/${username}`)
      .then((p) => {
        setProfile(p);
        if (isAuthenticated && currentUser) {
          if (currentUser.id === p.id) {
            setFriendStatus('self');
          } else {
            api
              .get<{ status: FriendStatus; requestId?: string }>(`/social/friends/status/${p.id}`)
              .then((s) => {
                setFriendStatus(s.status);
                setFriendRequestId(s.requestId);
              })
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
    } finally {
      setFriendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-bolty-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-mono text-zinc-700 mb-2">404</div>
          <div className="text-zinc-400 text-sm">User not found</div>
          <Link href="/" className="text-bolty-400 text-sm hover:text-bolty-300 mt-3 inline-block">
            ← back home
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.displayName || profile.username;
  const joinedDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      <div
        className="absolute -top-32 -right-20 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-60 -left-24 w-[360px] h-[360px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
      />
      <div className="relative max-w-4xl mx-auto px-4 py-10">
        {/* Profile header */}
        <div
          className="relative rounded-2xl overflow-hidden p-6 mb-8"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          <div className="relative flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName || ''}
                  className="w-24 h-24 rounded-2xl"
                  style={{
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 32px -6px rgba(131,110,249,0.5)',
                  }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-light text-[#b4a7ff]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.35), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 32px -6px rgba(131,110,249,0.5)',
                  }}
                >
                  {displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
                <div>
                  <h1 className="text-2xl font-light text-white tracking-[0.005em]">
                    {displayName}
                  </h1>
                  <p className="text-zinc-500 font-mono text-sm">@{profile.username}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {profile.role === 'ADMIN' && (
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] font-medium px-2 py-0.5 rounded-md text-[#b4a7ff]"
                      style={{
                        background: 'rgba(131,110,249,0.12)',
                        boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
                      }}
                    >
                      Admin
                    </span>
                  )}
                  {isAuthenticated && friendStatus !== 'self' && (
                    <button
                      onClick={handleFriendAction}
                      disabled={friendLoading || friendStatus === 'pending_sent'}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[11.5px] font-medium transition-all disabled:opacity-50 hover:brightness-110"
                      style={
                        friendStatus === 'friends'
                          ? {
                              color: '#d4d4d8',
                              background: 'rgba(255,255,255,0.04)',
                              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                            }
                          : friendStatus === 'pending_received'
                            ? {
                                color: '#fff',
                                background:
                                  'linear-gradient(180deg, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0.1) 100%)',
                                boxShadow:
                                  'inset 0 0 0 1px rgba(16,185,129,0.45), 0 0 14px -4px rgba(16,185,129,0.5)',
                              }
                            : friendStatus === 'pending_sent'
                              ? {
                                  color: '#71717a',
                                  background: 'rgba(255,255,255,0.03)',
                                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                                }
                              : {
                                  color: '#fff',
                                  background:
                                    'linear-gradient(180deg, rgba(131,110,249,0.28) 0%, rgba(131,110,249,0.1) 100%)',
                                  boxShadow:
                                    'inset 0 0 0 1px rgba(131,110,249,0.4), 0 0 14px -4px rgba(131,110,249,0.5)',
                                }
                      }
                    >
                      {friendLoading
                        ? '...'
                        : friendStatus === 'friends'
                          ? 'Friends'
                          : friendStatus === 'pending_received'
                            ? 'Accept request'
                            : friendStatus === 'pending_sent'
                              ? 'Pending'
                              : 'Add friend'}
                    </button>
                  )}
                  {friendMsg && <span className="text-[11px] text-emerald-300">{friendMsg}</span>}
                </div>
              </div>

              {profile.bio && (
                <p className="text-zinc-300 text-sm mt-2 leading-relaxed">{profile.bio}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                <span className="text-[11px] text-zinc-500 font-mono">Joined {joinedDate}</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {profile._count.repositories} repos
                </span>
                {profile.walletAddress && (
                  <span className="text-[11px] text-zinc-600 font-mono">
                    ETH: {profile.walletAddress.slice(0, 6)}…{profile.walletAddress.slice(-4)}
                  </span>
                )}
              </div>

              {/* Social links */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {profile.githubLogin && (
                  <a
                    href={`https://github.com/${profile.githubLogin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
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
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X / Twitter
                  </a>
                )}

                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                )}

                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium text-zinc-300 hover:text-white transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Repositories */}
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium mb-4 flex items-center gap-2">
            Repositories
            <span className="text-zinc-600 normal-case tracking-normal text-[11px]">
              · {profile._count.repositories}
            </span>
          </h2>

          {profile.repositories.length === 0 ? (
            <div
              className="relative rounded-2xl overflow-hidden p-12 text-center"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
                }}
              />
              <p className="text-[13px] text-zinc-500">No public repositories yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.repositories.map((repo, idx) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(idx * 0.04, 0.4),
                    duration: 0.32,
                    ease: [0.22, 0.61, 0.36, 1],
                  }}
                  whileHover={{ y: -3 }}
                  className="group relative rounded-xl overflow-hidden p-4 transition-all"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.5) 50%, transparent 100%)',
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'rgba(131,110,249,0.18)' }}
                  />
                  <div className="relative flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {repo.isLocked && <span className="text-amber-300 shrink-0">🔒</span>}
                      {repo.isLocked ? (
                        <span className="text-amber-300 font-mono font-light text-sm truncate">
                          {repo.name}
                        </span>
                      ) : (
                        <a
                          href={repo.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#b4a7ff] font-mono font-light text-sm truncate hover:text-white transition-colors"
                        >
                          {repo.name}
                        </a>
                      )}
                    </div>
                    {repo.language && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded text-zinc-400 shrink-0 ml-2"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                        }}
                      >
                        {repo.language}
                      </span>
                    )}
                  </div>

                  {repo.isLocked && repo.lockedPriceUsd ? (
                    <div
                      className="relative text-[11px] text-amber-300 font-mono px-2 py-0.5 rounded inline-block mb-2"
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.25)',
                      }}
                    >
                      ${repo.lockedPriceUsd.toFixed(2)} USD to unlock
                    </div>
                  ) : (
                    repo.description && (
                      <p className="relative text-zinc-400 text-xs leading-relaxed mb-2 line-clamp-2">
                        {repo.description}
                      </p>
                    )
                  )}

                  <div className="relative flex items-center gap-3 text-zinc-500 text-[11px] font-mono">
                    <span>★ {repo.stars}</span>
                    <span>⑂ {repo.forks}</span>
                    <span>↓ {repo.downloadCount}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
