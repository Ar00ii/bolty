'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GridPattern, genRandomPattern } from '@/components/ui/grid-feature-cards';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { ActionSearchBar, Action } from '@/components/ui/action-search-bar';
import { GitBranch, Lock, Globe, Star, Download, ArrowUp, ArrowDown } from 'lucide-react';

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

  const [lockModal, setLockModal] = useState<{ repo: GitHubRepo } | null>(null);
  const [lockPrice, setLockPrice] = useState('');
  const [lockType, setLockType] = useState<'public' | 'locked'>('public');

  const [consentModal, setConsentModal] = useState<{
    repo: Repository;
    sellerWallet: string;
    buyerAddress: string;
    sellerWei: bigint;
    platformWei: bigint;
    totalWei: bigint;
  } | null>(null);

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

  useEffect(() => { fetchRepos(); }, [fetchRepos]);

  const [ghNeedsReauth, setGhNeedsReauth] = useState(false);
  const [ghNeedsConnect, setGhNeedsConnect] = useState(false);

  const GITHUB_OAUTH_URL = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23liO79MvZtWDEdy2a'}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/github/callback')}&scope=read%3Auser%20repo`;

  const loadGhRepos = async () => {
    setShowPublish(true);
    setGhNeedsReauth(false);
    setGhNeedsConnect(false);
    if (!user?.githubLogin) { setGhNeedsConnect(true); return; }
    try {
      await api.delete('/repos/github/cache').catch(() => {});
      const data = await api.get<GitHubRepo[]>('/repos/github');
      const raw = Array.isArray(data) ? data : [];
      const needsReauth = raw.some((r) => (r as unknown as Record<string, unknown>)._bolty_reauth);
      if (needsReauth) { setGhNeedsReauth(true); setGhRepos([]); }
      else { setGhRepos(raw as GitHubRepo[]); }
    } catch {
      setError('Failed to fetch GitHub repos.');
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
      await api.post('/repos/publish', {
        id: repo.id, name: repo.name, full_name: repo.full_name,
        description: repo.description, language: repo.language,
        stargazers_count: repo.stargazers_count, forks_count: repo.forks_count,
        html_url: repo.html_url, clone_url: repo.clone_url,
        topics: repo.topics, private: repo.private,
        isLocked, lockedPriceUsd: isLocked ? lockedPriceUsd : undefined,
      });
      await fetchRepos();
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to publish');
    } finally { setPublishing(null); }
  };

  const confirmPublish = () => {
    if (!lockModal) return;
    const price = lockType === 'locked' ? parseFloat(lockPrice) : undefined;
    if (lockType === 'locked' && (!price || price <= 0)) { setError('Enter a valid price in USD'); return; }
    publishRepo(lockModal.repo, lockType === 'locked', price);
  };

  const vote = async (repoId: string, value: 'UP' | 'DOWN') => {
    if (!isAuthenticated) return;
    try { await api.post(`/repos/${repoId}/vote`, { value }); await fetchRepos(); }
    catch { setError('Vote failed'); }
  };

  const download = async (repoId: string, githubUrl: string) => {
    try {
      const { downloadUrl } = await api.post<{ downloadUrl: string }>(`/repos/${repoId}/download`, {});
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch { window.open(githubUrl, '_blank', 'noopener,noreferrer'); }
  };

  const payAndUnlock = async (repo: Repository) => {
    if (!repo.lockedPriceUsd) return;
    let sellerWallet: string | null = null;
    try {
      const details = await api.get<{ user: { walletAddress: string } }>(`/repos/${repo.id}`);
      sellerWallet = (details as any).user?.walletAddress;
    } catch { setError('Could not fetch seller wallet'); return; }
    if (!sellerWallet) { setError('Seller has no Ethereum wallet linked'); return; }
    const ethereum = (window as any).ethereum;
    if (!ethereum) { setError('MetaMask not found'); return; }
    let ethPrice = 2000;
    try {
      const priceData = await api.get<{ price: number }>('/chart/price');
      if ((priceData as any).price) ethPrice = (priceData as any).price;
    } catch { /* fallback */ }
    const totalWei = BigInt(Math.ceil((repo.lockedPriceUsd / ethPrice) * 1e18));
    const sellerWei = (totalWei * BigInt(975)) / BigInt(1000);
    const platformWei = totalWei - sellerWei;
    let buyerAddress: string;
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      buyerAddress = accounts[0];
    } catch { setError('Could not connect to MetaMask'); return; }
    setConsentModal({ repo, sellerWallet, buyerAddress, sellerWei, platformWei, totalWei });
  };

  const executeRepoPurchase = async (signature: string, message: string) => {
    if (!consentModal) return;
    const { repo, sellerWallet, buyerAddress, sellerWei, platformWei } = consentModal;
    setConsentModal(null);
    const ethereum = (window as any).ethereum;
    if (!ethereum) { setError('MetaMask not found'); return; }
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
    try {
      const txHash = (await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: buyerAddress, to: sellerWallet, value: '0x' + sellerWei.toString(16) }],
      })) as string;
      let platformFeeTxHash: string | undefined;
      if (platformWallet) {
        platformFeeTxHash = (await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ from: buyerAddress, to: platformWallet, value: '0x' + platformWei.toString(16) }],
        })) as string;
      }
      const result = await api.post<{ success: boolean; downloadUrl?: string }>(
        `/repos/${repo.id}/purchase`,
        { txHash, platformFeeTxHash, consentSignature: signature, consentMessage: message },
      );
      setError('');
      if (result.success && result.downloadUrl) window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      await fetchRepos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('rejected') || msg.includes('denied')) setError('Payment cancelled');
      else if (err instanceof ApiError) setError(err.message);
      else setError('Payment failed: ' + msg.slice(0, 80));
    }
  };

  // Build ActionSearchBar actions from ghRepos
  const ghRepoActions: Action[] = ghRepos.map(repo => ({
    id: String(repo.id),
    label: repo.name,
    icon: <GitBranch className="w-4 h-4 text-monad-400" strokeWidth={1.5} />,
    description: repo.language || '',
    short: repo.private ? 'private' : 'public',
    end: publishing === repo.id ? '...' : 'publish',
  }));

  const handleRepoSelect = (action: Action) => {
    const repo = ghRepos.find(r => String(r.id) === action.id);
    if (repo) openLockModal(repo);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <DottedSurface />

      <div className="mb-8">
        <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-2">Repository Showcase</p>
        <h1 className="text-2xl font-bold text-white mb-1">Explore repos</h1>
        <p className="text-sm text-zinc-500">Community repositories — public &amp; locked. Discover, vote, download.</p>
      </div>

      {/* Controls */}
      <div className="border border-white/06 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-xl px-4 py-2 text-sm bg-zinc-900/70 border border-zinc-800 text-white placeholder:text-zinc-600 outline-none focus:border-monad-500/50 transition-colors"
        />
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm bg-zinc-900/70 border border-zinc-800 text-white outline-none focus:border-monad-500/50 transition-colors appearance-none cursor-pointer"
        >
          {LANGUAGES.map(l => (
            <option key={l} value={l === 'All' ? '' : l}>{l}</option>
          ))}
        </select>
        <div className="flex gap-1 flex-wrap">
          {SORTS.map(s => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value as typeof sortBy)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                sortBy === s.value
                  ? 'bg-monad-500/15 text-monad-400 border border-monad-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {isAuthenticated && (
          <button
            onClick={loadGhRepos}
            className="text-xs font-mono px-4 py-2 rounded-xl border border-monad-500/30 text-monad-400 hover:bg-monad-500/10 transition-colors"
          >
            + publish repo
          </button>
        )}
      </div>

      {/* Publish panel */}
      {showPublish && (
        <div className="border border-white/08 rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-zinc-300">Your GitHub repositories</p>
            <button onClick={() => setShowPublish(false)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">close</button>
          </div>

          {ghNeedsConnect && (
            <div className="mb-4 p-4 border border-monad-500/20 rounded-xl text-center" style={{ background: 'rgba(131,110,249,0.05)' }}>
              <p className="text-sm text-zinc-400 mb-3">Connect your GitHub account to publish repos.</p>
              <a href={GITHUB_OAUTH_URL} className="inline-block px-4 py-2 rounded-xl border border-monad-500/30 text-monad-400 text-xs font-mono hover:bg-monad-500/10 transition-colors">
                Connect GitHub
              </a>
            </div>
          )}

          {ghNeedsReauth && (
            <div className="mb-4 p-4 border border-white/08 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-sm text-zinc-400 mb-1">Your GitHub token needs to be refreshed.</p>
              <p className="text-xs text-zinc-600 mb-3">Reconnect to access private repos.</p>
              <a
                href={`https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23liO79MvZtWDEdy2a'}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/github/callback')}&scope=read%3Auser%20repo`}
                className="inline-block px-4 py-2 rounded-xl border border-monad-500/30 text-monad-400 text-xs font-mono hover:bg-monad-500/10 transition-colors"
              >
                Reconnect GitHub
              </a>
            </div>
          )}

          {!ghNeedsConnect && !ghNeedsReauth && (
            <ActionSearchBar
              actions={ghRepoActions}
              placeholder="Search your repos..."
              label="Select a repo to publish"
              onSelect={handleRepoSelect}
            />
          )}
        </div>
      )}

      {/* Publish modal */}
      {lockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#1a1a1f', border: '1px solid rgba(131,110,249,0.2)' }}>
            <h3 className="font-semibold text-monad-400 mb-1 font-mono">Publish Options</h3>
            <p className="text-zinc-500 text-xs mb-5">
              {lockModal.repo.name}{lockModal.repo.private ? ' · private repo' : ''}
            </p>

            <div className="space-y-2.5 mb-5">
              <button
                onClick={() => setLockType('public')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${lockType === 'public' ? 'border-monad-500/50' : 'border-white/08 hover:border-white/15'}`}
                style={{ background: lockType === 'public' ? 'rgba(131,110,249,0.1)' : 'rgba(255,255,255,0.02)' }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${lockType === 'public' ? 'bg-monad-500/20' : 'bg-white/05'}`}>
                  <Globe className={`w-4 h-4 ${lockType === 'public' ? 'text-monad-400' : 'text-zinc-500'}`} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-medium ${lockType === 'public' ? 'text-monad-300' : 'text-zinc-400'}`}>Public — Free</div>
                  <div className="text-xs text-zinc-600">Anyone can see and download</div>
                </div>
              </button>

              <button
                onClick={() => setLockType('locked')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${lockType === 'locked' ? 'border-monad-500/50' : 'border-white/08 hover:border-white/15'}`}
                style={{ background: lockType === 'locked' ? 'rgba(131,110,249,0.1)' : 'rgba(255,255,255,0.02)' }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${lockType === 'locked' ? 'bg-monad-500/20' : 'bg-white/05'}`}>
                  <Lock className={`w-4 h-4 ${lockType === 'locked' ? 'text-monad-400' : 'text-zinc-500'}`} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-medium ${lockType === 'locked' ? 'text-monad-300' : 'text-zinc-400'}`}>Locked — Paid Access</div>
                  <div className="text-xs text-zinc-600">Users pay to unlock download</div>
                </div>
              </button>
            </div>

            {lockType === 'locked' && (
              <div className="mb-5">
                <label className="text-xs text-zinc-500 font-mono block mb-1.5">Price (USD)</label>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border border-zinc-800 bg-zinc-900/70 focus-within:border-monad-500/50 transition-colors">
                  <span className="text-zinc-600 font-mono text-sm">$</span>
                  <input
                    type="number" min="0.01" step="0.01" placeholder="9.99"
                    value={lockPrice} onChange={e => setLockPrice(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-700"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setLockModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-mono text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-all"
              >
                cancel
              </button>
              <button
                onClick={confirmPublish}
                className="flex-1 py-2.5 rounded-xl text-xs font-mono text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#836EF9,#6b4fe0)' }}
              >
                confirm publish
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-red-400 text-xs font-mono mb-4 px-1">{error}</div>}

      {/* Repos Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-monad-400 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-dashed border border-dashed border-white/08">
          {repos.map(repo => {
            const squares = genRandomPattern();
            return (
              <div key={repo.id} className="relative overflow-hidden p-5 flex flex-col group hover:bg-monad-500/4 transition-colors duration-200">
                <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(white,transparent)]">
                  <div className="absolute inset-0 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
                    <GridPattern width={20} height={20} x="-12" y="4" squares={squares}
                      className="fill-white/3 stroke-white/6 absolute inset-0 h-full w-full mix-blend-overlay" />
                  </div>
                </div>

                <div className="relative z-10 flex-1">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {repo.isLocked && <Lock className="w-3.5 h-3.5 text-monad-400/60 flex-shrink-0" strokeWidth={1.5} />}
                      <a
                        href={repo.isLocked ? '#' : repo.githubUrl}
                        target={repo.isLocked ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        className="font-mono font-semibold text-sm text-monad-400 hover:text-monad-300 transition-colors truncate"
                      >
                        {repo.name}
                      </a>
                    </div>
                    {repo.language && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-lg border border-monad-500/15 bg-monad-500/5 text-monad-400/70 ml-auto shrink-0">
                        {repo.language}
                      </span>
                    )}
                  </div>

                  {repo.isLocked && repo.lockedPriceUsd && (
                    <div className="inline-flex items-center gap-1 text-xs font-mono text-monad-400 border border-dashed border-monad-500/25 rounded-lg px-2 py-0.5 mb-2">
                      ${repo.lockedPriceUsd.toFixed(2)} USD
                    </div>
                  )}

                  {repo.description && (
                    <p className="text-zinc-500 text-xs leading-relaxed mb-3 line-clamp-2">
                      {repo.isLocked ? '████ ███████ ██████ ████ ██████' : repo.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-zinc-600 text-xs font-mono mb-3">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" strokeWidth={1.5} /> {repo.stars}</span>
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" strokeWidth={1.5} /> {repo.forks}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" strokeWidth={1.5} /> {repo.downloadCount}</span>
                  </div>

                  {!repo.isLocked && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {repo.topics.slice(0, 3).map(t => (
                        <span key={t} className="text-xs font-mono px-1.5 py-0.5 rounded border border-dashed border-white/08 text-zinc-600">{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="text-zinc-600 text-xs flex items-center gap-1">
                    <span className="text-monad-400/50">@</span>{repo.user.username}
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-3 pt-3 border-t border-dashed border-white/06">
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => vote(repo.id, 'UP')} disabled={!isAuthenticated}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-monad-400 hover:bg-monad-400/10 rounded transition-colors disabled:opacity-30">
                      <ArrowUp className="w-3 h-3" strokeWidth={2} /> {repo.upvotes}
                    </button>
                    <button onClick={() => vote(repo.id, 'DOWN')} disabled={!isAuthenticated}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-zinc-500 hover:bg-zinc-500/10 rounded transition-colors disabled:opacity-30">
                      <ArrowDown className="w-3 h-3" strokeWidth={2} /> {repo.downvotes}
                    </button>
                  </div>
                  {repo.isLocked ? (
                    <button onClick={() => payAndUnlock(repo)}
                      className="text-xs py-1.5 px-3 font-mono text-monad-400 border border-dashed border-monad-500/25 rounded-lg hover:bg-monad-500/10 transition-colors">
                      Unlock — ${repo.lockedPriceUsd} USD
                    </button>
                  ) : (
                    <button onClick={() => download(repo.id, repo.githubUrl)}
                      className="text-xs py-1.5 px-3 font-mono text-zinc-400 border border-dashed border-white/10 rounded-lg hover:bg-white/05 hover:text-zinc-300 transition-colors">
                      download
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {repos.length === 0 && !loading && (
            <div className="col-span-3 text-center py-20 text-zinc-600 font-mono text-sm">
              No repositories found. Be the first to publish.
            </div>
          )}
        </div>
      )}

      {consentModal && (
        <PaymentConsentModal
          listingTitle={consentModal.repo.name}
          sellerAddress={consentModal.sellerWallet}
          sellerAmountETH={(Number(consentModal.sellerWei) / 1e18).toFixed(6)}
          platformFeeETH={(Number(consentModal.platformWei) / 1e18).toFixed(6)}
          totalETH={(Number(consentModal.totalWei) / 1e18).toFixed(6)}
          buyerAddress={consentModal.buyerAddress}
          onConsent={executeRepoPurchase}
          onCancel={() => setConsentModal(null)}
        />
      )}
    </div>
  );
}
