'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';

interface Repository {
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
  upvotes: number;
  downvotes: number;
  score: number;
  user: { username: string | null; avatarUrl: string | null };
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  clone_url: string;
  topics?: string[];
  private: boolean;
}

const LANGUAGES = ['All', 'TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Solidity'];
const SORTS = [
  { value: 'recent', label: 'latest' },
  { value: 'votes', label: 'top voted' },
  { value: 'stars', label: 'most starred' },
  { value: 'downloads', label: 'most downloaded' },
];

export default function ReposPage() {
  const { isAuthenticated, user } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'votes' | 'stars' | 'downloads'>('recent');
  const [showPublish, setShowPublish] = useState(false);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState<number | null>(null);

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sortBy });
      if (search) params.set('search', search);
      if (language && language !== 'All') params.set('language', language);

      const data = await api.get<{ data: Repository[] }>(`/repos?${params}`);
      setRepos(data.data);
    } catch {
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  }, [search, language, sortBy]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const loadGhRepos = async () => {
    setShowPublish(true);
    try {
      const data = await api.get<GitHubRepo[]>('/repos/github');
      setGhRepos(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to fetch GitHub repos. Make sure you\'re logged in with GitHub.');
    }
  };

  const publishRepo = async (repo: GitHubRepo) => {
    setPublishing(repo.id);
    try {
      await api.post('/repos/publish', repo);
      await fetchRepos();
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish');
    } finally {
      setPublishing(null);
    }
  };

  const vote = async (repoId: string, value: 'UP' | 'DOWN') => {
    if (!isAuthenticated) return;
    try {
      await api.post(`/repos/${repoId}/vote`, { value });
      await fetchRepos();
    } catch {
      setError('Vote failed');
    }
  };

  const download = async (repoId: string, githubUrl: string) => {
    try {
      const { downloadUrl } = await api.post<{ downloadUrl: string }>(
        `/repos/${repoId}/download`,
        {},
      );
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(githubUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-neon-400 font-mono font-black text-3xl mb-2">REPO_SHOWCASE</h1>
        <p className="text-terminal-muted text-sm font-mono">
          {'// Community repositories. Discover, vote, download.'}
        </p>
      </div>

      {/* Controls */}
      <TerminalCard className="mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="terminal-input flex-1 min-w-48"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="terminal-input w-40"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l === 'All' ? '' : l}>{l}</option>
            ))}
          </select>
          <div className="flex gap-1">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value as typeof sortBy)}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                  sortBy === s.value
                    ? 'bg-neon-400/10 text-neon-400 border border-neon-400/30'
                    : 'text-terminal-muted hover:text-terminal-text'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {isAuthenticated && user?.githubLogin && (
            <button onClick={loadGhRepos} className="btn-neon text-xs py-1.5 px-4">
              + publish
            </button>
          )}
        </div>
      </TerminalCard>

      {/* Publish Modal */}
      {showPublish && (
        <TerminalCard title="publish_repository" className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-neon-400 text-sm font-mono">Your GitHub Repos</span>
            <button
              onClick={() => setShowPublish(false)}
              className="text-terminal-muted hover:text-terminal-text text-xs"
            >
              [close]
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {ghRepos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between p-2 border border-terminal-border rounded hover:border-neon-400/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-terminal-text text-xs font-mono truncate">{repo.name}</div>
                  {repo.language && (
                    <span className="terminal-badge">{repo.language}</span>
                  )}
                </div>
                <button
                  onClick={() => publishRepo(repo)}
                  disabled={publishing === repo.id}
                  className="btn-neon text-xs py-1 px-2 ml-2 shrink-0 disabled:opacity-50"
                >
                  {publishing === repo.id ? '...' : 'publish'}
                </button>
              </div>
            ))}
            {ghRepos.length === 0 && (
              <p className="text-terminal-muted text-xs col-span-2 text-center py-4">
                No public repos found
              </p>
            )}
          </div>
        </TerminalCard>
      )}

      {error && (
        <div className="text-red-400 text-sm font-mono mb-4 px-1">ERROR: {error}</div>
      )}

      {/* Repos Grid */}
      {loading ? (
        <div className="text-neon-400 font-mono animate-pulse text-center py-16">
          Loading repositories...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <TerminalCard key={repo.id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <a
                    href={repo.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neon-400 font-mono font-semibold text-sm hover:text-neon-300 transition-colors truncate"
                  >
                    {repo.name}
                  </a>
                  {repo.language && (
                    <span className="terminal-badge ml-2 shrink-0">{repo.language}</span>
                  )}
                </div>
                {repo.description && (
                  <p className="text-terminal-muted text-xs leading-relaxed mb-3 line-clamp-2">
                    {repo.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-terminal-muted text-xs font-mono mb-3">
                  <span>★ {repo.stars}</span>
                  <span>⑂ {repo.forks}</span>
                  <span>↓ {repo.downloadCount}</span>
                </div>
                {repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {repo.topics.slice(0, 3).map((t) => (
                      <span key={t} className="terminal-badge">{t}</span>
                    ))}
                  </div>
                )}
                <div className="text-terminal-muted text-xs flex items-center gap-1">
                  <span className="text-neon-400">@</span>
                  {repo.user.username}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-terminal-border">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => vote(repo.id, 'UP')}
                    disabled={!isAuthenticated}
                    className="px-2 py-1 text-xs font-mono text-neon-400 hover:bg-neon-400/10 rounded transition-colors disabled:opacity-40"
                  >
                    ▲ {repo.upvotes}
                  </button>
                  <button
                    onClick={() => vote(repo.id, 'DOWN')}
                    disabled={!isAuthenticated}
                    className="px-2 py-1 text-xs font-mono text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-40"
                  >
                    ▼ {repo.downvotes}
                  </button>
                </div>
                <button
                  onClick={() => download(repo.id, repo.githubUrl)}
                  className="btn-neon text-xs py-1 px-3"
                >
                  download
                </button>
              </div>
            </TerminalCard>
          ))}
          {repos.length === 0 && !loading && (
            <div className="col-span-3 text-center py-16 text-terminal-muted font-mono text-sm">
              {'// No repositories found. Be the first to publish!'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
