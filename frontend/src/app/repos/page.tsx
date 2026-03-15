'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  isPrivate: boolean;
  isLocked: boolean;
  lockedPriceUsd: number | null;
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

  // Lock publish modal state
  const [lockModal, setLockModal] = useState<{ repo: GitHubRepo } | null>(null);
  const [lockPrice, setLockPrice] = useState('');
  const [lockType, setLockType] = useState<'public' | 'locked'>('public');

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

  const [ghNeedsReauth, setGhNeedsReauth] = useState(false);

  const loadGhRepos = async () => {
    setShowPublish(true);
    setGhNeedsReauth(false);
    try {
      // Clear cache first to always get fresh data from GitHub
      await api.delete('/repos/github/cache').catch(() => {});
      const data = await api.get<GitHubRepo[]>('/repos/github');
      const raw = Array.isArray(data) ? data : [];
      // Check if backend says the token was revoked and needs re-auth
      const needsReauth = raw.some((r: Record<string, unknown>) => (r as Record<string, unknown>)._bolty_reauth);
      if (needsReauth) {
        setGhNeedsReauth(true);
        setGhRepos([]);
      } else {
        setGhRepos(raw as GitHubRepo[]);
      }
    } catch {
      setError("Failed to fetch GitHub repos. Make sure you're logged in with GitHub.");
    }
  };

  const openLockModal = (repo: GitHubRepo) => {
    setLockModal({ repo });
    setLockType('public');
    setLockPrice('');
  };

  const publishRepo = async (repo: GitHubRepo, isLocked: boolean, lockedPriceUsd?: number) => {
    setPublishing(repo.id);
    setLockModal(null);
    try {
      // Send only the fields the DTO expects — extra GitHub fields cause 400 with forbidNonWhitelisted
      await api.post('/repos/publish', {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        topics: repo.topics,
        private: repo.private,
        isLocked,
        lockedPriceUsd: isLocked ? lockedPriceUsd : undefined,
      });
      await fetchRepos();
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish');
    } finally {
      setPublishing(null);
    }
  };

  const confirmPublish = () => {
    if (!lockModal) return;
    const price = lockType === 'locked' ? parseFloat(lockPrice) : undefined;
    if (lockType === 'locked' && (!price || price <= 0)) {
      setError('Enter a valid price in USD');
      return;
    }
    publishRepo(lockModal.repo, lockType === 'locked', price);
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

  const payAndUnlock = async (repo: Repository) => {
    if (!repo.lockedPriceUsd) return;

    // Fetch seller wallet from repo details
    let sellerWallet: string | null = null;
    try {
      const details = await api.get<{ user: { walletAddress: string } }>(`/repos/${repo.id}`);
      sellerWallet = details.user?.walletAddress;
    } catch {
      setError('Could not fetch seller wallet');
      return;
    }

    if (!sellerWallet) {
      setError('Seller has no Ethereum wallet linked');
      return;
    }

    const tokenContract = process.env.NEXT_PUBLIC_TOKEN_CONTRACT || '';
    const tokenSymbol = process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'ETH';
    const tokenPriceUsd = parseFloat(process.env.NEXT_PUBLIC_TOKEN_PRICE_USD || '0');

    try {
      const ethereum = (window as Window & { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
      if (!ethereum) { setError('MetaMask not found'); return; }

      let txHash: string;

      if (tokenContract && tokenPriceUsd > 0) {
        // ERC-20 token payment
        const tokenAmount = BigInt(Math.ceil(repo.lockedPriceUsd / tokenPriceUsd));
        const decimals = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '18');
        const amount = tokenAmount * BigInt(10 ** decimals);
        // transfer(address,uint256) selector
        const data =
          '0xa9059cbb' +
          sellerWallet.slice(2).padStart(64, '0') +
          amount.toString(16).padStart(64, '0');

        txHash = (await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ from: undefined, to: tokenContract, data }],
        })) as string;
      } else {
        // ETH payment — get current ETH price from our API
        let ethPrice = 2000; // fallback
        try {
          const priceData = await api.get<{ price: number }>('/chart/price');
          if (priceData.price) ethPrice = priceData.price;
        } catch { /* use fallback */ }

        const ethAmount = repo.lockedPriceUsd / ethPrice;
        const weiHex = '0x' + Math.ceil(ethAmount * 1e18).toString(16);

        txHash = (await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ to: sellerWallet, value: weiHex }],
        })) as string;
      }

      setError('');
      // Verify and record purchase on backend
      const result = await api.post<{ success: boolean; downloadUrl: string }>(
        `/repos/${repo.id}/purchase`,
        { txHash },
      );
      if (result.success && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
        await fetchRepos();
      }
      alert(`Payment sent! ${tokenSymbol} transaction: ${txHash.slice(0, 12)}...`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('rejected') || msg.includes('denied')) {
        setError('Payment cancelled');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Payment failed: ' + msg.slice(0, 80));
      }
    }
  };

  return (
    <div className="bg-page-repos max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{color:"var(--text)"}}>Repository Showcase</h1>
        <p className="text-terminal-muted text-sm font-mono">
          {'// Community repositories. Public & locked. Discover, vote, download.'}
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
            <span className="text-neon-400 text-sm font-mono">
              Your GitHub Repos <span className="text-terminal-muted text-xs">(public & private)</span>
            </span>
            <button
              onClick={() => setShowPublish(false)}
              className="text-terminal-muted hover:text-terminal-text text-xs"
            >
              [close]
            </button>
          </div>
          {ghNeedsReauth && (
            <div className="mb-3 p-3 border border-yellow-500/30 bg-yellow-500/5 rounded text-sm text-yellow-400 font-mono text-center">
              <p className="mb-2">Tu token de GitHub no tiene acceso a repos privados.</p>
              <p className="mb-3 text-xs text-yellow-500">Se ha revocado el token viejo. Haz clic abajo para reconectar con permisos completos.</p>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/github`}
                className="inline-block px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded hover:bg-yellow-500/30 transition-colors text-yellow-300 text-xs"
              >
                Reconectar GitHub
              </a>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {ghRepos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between p-2 border border-terminal-border rounded hover:border-neon-400/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {repo.private && (
                      <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    )}
                    <div className="text-terminal-text text-xs font-mono truncate">{repo.name}</div>
                  </div>
                  {repo.language && (
                    <span className="terminal-badge">{repo.language}</span>
                  )}
                </div>
                <button
                  onClick={() => openLockModal(repo)}
                  disabled={publishing === repo.id}
                  className="btn-neon text-xs py-1 px-2 ml-2 shrink-0 disabled:opacity-50"
                >
                  {publishing === repo.id ? '...' : 'publish'}
                </button>
              </div>
            ))}
            {ghRepos.length === 0 && (
              <p className="text-terminal-muted text-xs col-span-2 text-center py-4">
                No repos found. Make sure you logged in with GitHub.
              </p>
            )}
          </div>
        </TerminalCard>
      )}

      {/* Lock / Price Modal */}
      {lockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-neon-400/30 rounded-xl p-6">
            <h3 className="text-neon-400 font-mono font-bold mb-1">Publish Options</h3>
            <p className="text-terminal-muted text-xs font-mono mb-5">
              {lockModal.repo.name} {lockModal.repo.private && '· private repo'}
            </p>

            <div className="space-y-3 mb-5">
              <button
                onClick={() => setLockType('public')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  lockType === 'public'
                    ? 'border-neon-400/50 bg-neon-400/5 text-neon-400'
                    : 'border-terminal-border text-terminal-muted hover:border-zinc-600'
                }`}
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                <div className="text-left">
                  <div className="text-sm font-mono font-semibold">Public — Free</div>
                  <div className="text-xs opacity-70">Anyone can see and download</div>
                </div>
              </button>

              <button
                onClick={() => setLockType('locked')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  lockType === 'locked'
                    ? 'border-yellow-400/50 bg-yellow-400/5 text-yellow-400'
                    : 'border-terminal-border text-terminal-muted hover:border-zinc-600'
                }`}
              >
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                <div className="text-left">
                  <div className="text-sm font-mono font-semibold">Locked — Paid Access</div>
                  <div className="text-xs opacity-70">Users pay to unlock download</div>
                </div>
              </button>
            </div>

            {lockType === 'locked' && (
              <div className="mb-5">
                <label className="text-terminal-muted text-xs font-mono block mb-1">
                  Price (USD)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-terminal-muted font-mono">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="9.99"
                    value={lockPrice}
                    onChange={(e) => setLockPrice(e.target.value)}
                    className="terminal-input flex-1"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setLockModal(null)}
                className="flex-1 px-4 py-2 text-xs font-mono text-terminal-muted border border-terminal-border rounded hover:border-zinc-600 transition-colors"
              >
                cancel
              </button>
              <button
                onClick={confirmPublish}
                className="flex-1 btn-neon text-xs py-2"
              >
                confirm publish
              </button>
            </div>
          </div>
        </div>
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
                  <div className="flex items-center gap-1 min-w-0">
                    {repo.isLocked && (
                      <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    )}
                    <a
                      href={repo.isLocked ? '#' : repo.githubUrl}
                      target={repo.isLocked ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      className={`font-mono font-semibold text-sm transition-colors truncate ${
                        repo.isLocked
                          ? 'text-yellow-400 hover:text-yellow-300 cursor-default'
                          : 'text-neon-400 hover:text-neon-300'
                      }`}
                    >
                      {repo.name}
                    </a>
                  </div>
                  {repo.language && (
                    <span className="terminal-badge ml-2 shrink-0">{repo.language}</span>
                  )}
                </div>

                {repo.isLocked && repo.lockedPriceUsd && (
                  <div className="inline-flex items-center gap-1 text-xs font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded px-2 py-0.5 mb-2">
                    <span>$</span>
                    <span>{repo.lockedPriceUsd.toFixed(2)}</span>
                    <span className="text-yellow-400/60">USD to unlock</span>
                  </div>
                )}

                {repo.description && (
                  <p className="text-terminal-muted text-xs leading-relaxed mb-3 line-clamp-2">
                    {repo.isLocked ? '████ ███████ ██████ ██████ ████' : repo.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-terminal-muted text-xs font-mono mb-3">
                  <span>★ {repo.stars}</span>
                  <span>⑂ {repo.forks}</span>
                  <span>↓ {repo.downloadCount}</span>
                </div>
                {!repo.isLocked && repo.topics.length > 0 && (
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
                {repo.isLocked ? (
                  <button
                    className="text-xs py-1 px-3 font-mono bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded hover:bg-yellow-400/20 transition-colors"
                    onClick={() => payAndUnlock(repo)}
                  >
                    Unlock — ${repo.lockedPriceUsd} USD
                  </button>
                ) : (
                  <button
                    onClick={() => download(repo.id, repo.githubUrl)}
                    className="btn-neon text-xs py-1 px-3"
                  >
                    download
                  </button>
                )}
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
