'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError, API_URL } from '@/lib/api/client';
import { PaymentConsentModal } from '@/components/ui/payment-consent-modal';
import { ActionSearchBar, Action } from '@/components/ui/action-search-bar';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch, Lock, Globe, Star, Download, ArrowUp, ArrowDown,
  Trash2, Plus, Users, Wallet, X, Upload,
} from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { getMetaMaskProvider } from '@/lib/wallet/ethereum';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Collaborator {
  id: string;
  name: string;
  type: 'USER' | 'AI_AGENT' | 'PROGRAM';
  role: string | null;
  url: string | null;
  user: { id: string; username: string | null; avatarUrl: string | null; reputationPoints: number } | null;
}

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
  logoUrl: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  user: { id?: string; username: string | null; avatarUrl: string | null };
  collaborators?: Collaborator[];
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

// ── Constants ──────────────────────────────────────────────────────────────────

const LANGUAGES = [
  'All', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin',
  'Swift', 'Dart', 'Ruby', 'PHP', 'C', 'C++', 'C#', 'Solidity', 'Move', 'Anchor',
  'Bash', 'Shell', 'Other',
];
const SORTS = [
  { value: 'recent', label: 'latest' },
  { value: 'votes', label: 'top voted' },
  { value: 'stars', label: 'most starred' },
  { value: 'downloads', label: 'most downloaded' },
];
const GITHUB_OAUTH_URL = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ''}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/github/callback')}&scope=read%3Auser%20repo`;

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// Language color dots — GitHub style
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Go: '#00add8',
  Rust: '#dea584', Java: '#b07219', Kotlin: '#A97BFF', Swift: '#F05138',
  Ruby: '#701516', PHP: '#4F5D95', 'C++': '#f34b7d', 'C#': '#178600',
  C: '#555555', Solidity: '#AA6746', Dart: '#00B4AB', Shell: '#89e051',
  Bash: '#89e051', Move: '#4a9eda', Anchor: '#9945FF',
};

function LanguageDot({ lang }: { lang: string }) {
  const color = LANG_COLORS[lang] || '#8b949e';
  return (
    <span className="flex items-center gap-1.5 text-xs text-[#8b949e]">
      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
      {lang}
    </span>
  );
}

function RepoCard({ repo, isAuthenticated, onVote, onDownload, onUnlock }: {
  repo: Repository; isAuthenticated: boolean; userId?: string;
  onVote: (id: string, v: 'UP' | 'DOWN') => void;
  onDownload: (id: string, url: string) => void;
  onUnlock: (repo: Repository) => void;
}) {
  return (
    <div className="flex flex-col bg-[#0d1117] border border-[#30363d] rounded-lg hover:border-[#58a6ff]/40 hover:shadow-[0_0_0_1px_rgba(88,166,255,0.08)] transition-all duration-200 overflow-hidden">
      <div className="p-4 flex-1">
        {/* Repo header */}
        <div className="flex items-start gap-3 mb-3">
          {repo.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={repo.logoUrl.startsWith('/api') ? `${API_URL.replace('/api/v1', '')}${repo.logoUrl}` : repo.logoUrl}
              alt={repo.name} className="w-9 h-9 rounded-md object-cover border border-[#30363d] shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-9 h-9 rounded-md border border-[#30363d] bg-[#161b22] flex items-center justify-center shrink-0">
              <GitBranch className="w-4 h-4 text-[#8b949e]" strokeWidth={1.5} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-sm font-semibold text-[#58a6ff] hover:underline truncate">{repo.name}</h3>
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] border ${
                repo.isLocked
                  ? 'bg-[#388bfd]/10 border-[#388bfd]/30 text-[#58a6ff]'
                  : 'bg-transparent border-[#30363d] text-[#8b949e]'
              }`}>
                {repo.isLocked ? 'Paid' : 'Public'}
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">@{repo.user.username || 'anon'}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#8b949e] leading-relaxed line-clamp-2 mb-3 min-h-[2.5rem]">
          {repo.description || <span className="italic text-[#6e7681]">No description</span>}
        </p>

        {/* Topics */}
        {repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {repo.topics.slice(0, 4).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#388bfd]/10 text-[#58a6ff] border border-[#388bfd]/20">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-[#8b949e]">
          {repo.language && <LanguageDot lang={repo.language} />}
          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{repo.stars}</span>
          <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{repo.forks}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{repo.downloadCount}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#21262d]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => isAuthenticated && onVote(repo.id, 'UP')}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[#8b949e] hover:text-emerald-400 hover:bg-emerald-400/8 transition-all disabled:opacity-50"
            disabled={!isAuthenticated}
          >
            <ArrowUp className="w-3.5 h-3.5" />{repo.upvotes}
          </button>
          <button
            onClick={() => isAuthenticated && onVote(repo.id, 'DOWN')}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[#8b949e] hover:text-red-400 hover:bg-red-400/8 transition-all disabled:opacity-50"
            disabled={!isAuthenticated}
          >
            <ArrowDown className="w-3.5 h-3.5" />{repo.downvotes}
          </button>
        </div>
        <div>
          {repo.isLocked && repo.lockedPriceUsd ? (
            <button
              onClick={() => onUnlock(repo)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#238636] border border-[#2ea043]/50 hover:bg-[#2ea043] transition-all"
            >
              Unlock — ${repo.lockedPriceUsd}
            </button>
          ) : (
            <button
              onClick={() => onDownload(repo.id, repo.githubUrl)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-[#e6edf3] bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] transition-all"
            >
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── My Repo Card (publications) ────────────────────────────────────────────────

function MyRepoCard({ repo, onDelete }: { repo: Repository; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showCollabs, setShowCollabs] = useState(false);

  const handleDelete = async () => {
    setDeleting(true); setDeleteError('');
    try {
      await api.delete(`/repos/${repo.id}`);
      onDelete(repo.id);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-xl border transition-colors" style={{ borderColor: showCollabs ? 'rgba(131,110,249,0.2)' : 'rgba(255,255,255,0.07)', background: '#0a0a12' }}>
      <div className="flex items-center gap-3 p-3">
        {/* Logo / icon */}
        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {repo.logoUrl ? (
            <img
              src={repo.logoUrl.startsWith('/api') ? `${API_URL.replace('/api/v1', '')}${repo.logoUrl}` : repo.logoUrl}
              alt={repo.name} className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : <GitBranch className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-zinc-100 truncate">{repo.name}</h3>
            {repo.isLocked && <Badge className="rounded-full px-2 py-0 text-xs font-mono" style={{ background: 'rgba(131,110,249,0.12)', border: '1px solid rgba(131,110,249,0.25)', color: '#a78bfa' }}>locked ${repo.lockedPriceUsd}</Badge>}
            {repo.isPrivate && <Badge className="rounded-full bg-zinc-800/50 border border-white/06 px-2 py-0 text-xs font-mono text-zinc-600">private</Badge>}
          </div>
          <p className="text-xs text-zinc-600 font-mono mt-0.5">
            <span className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5" />{repo.stars}</span>
              <span className="flex items-center gap-1"><Download className="w-2.5 h-2.5" />{repo.downloadCount}</span>
              <span className="flex items-center gap-1"><ArrowUp className="w-2.5 h-2.5 text-green-500" />{repo.upvotes}</span>
              {(repo.collaborators?.length ?? 0) > 0 && <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{repo.collaborators?.length} collab{repo.collaborators!.length !== 1 ? 's' : ''}</span>}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a href={repo.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono px-2.5 py-1.5 rounded-lg text-zinc-500 border border-dashed border-zinc-700/40 hover:text-zinc-300 hover:border-zinc-600/60 transition-all">GitHub</a>
          <button onClick={() => setShowCollabs(p => !p)} className="flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 rounded-lg transition-all" style={{ background: showCollabs ? 'rgba(131,110,249,0.15)' : 'transparent', border: `1px solid ${showCollabs ? 'rgba(131,110,249,0.3)' : 'rgba(255,255,255,0.08)'}`, color: showCollabs ? '#c4b5fd' : '#71717a' }}>
            <Users className="w-3 h-3" /> collabs
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={handleDelete} disabled={deleting} className="text-xs font-mono px-2 py-1.5 rounded-lg text-red-400 disabled:opacity-40 transition-all" style={{ border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)' }}>{deleting ? '...' : 'confirm'}</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs font-mono px-2 py-1.5 rounded-lg text-zinc-500 transition-all" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/5 transition-all" title="Delete repo">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {deleteError && <p className="text-red-400 font-mono text-xs px-3 pb-2">{deleteError}</p>}
      {showCollabs && <CollaboratorsPanel repoId={repo.id} collaborators={repo.collaborators ?? []} />}
    </div>
  );
}

// ── Collaborators Panel ────────────────────────────────────────────────────────

function CollaboratorsPanel({ repoId, collaborators: initial }: { repoId: string; collaborators: Collaborator[] }) {
  const [collabs, setCollabs] = useState<Collaborator[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'USER' | 'AI_AGENT' | 'PROGRAM'>('USER');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<Array<{ id: string; username: string; avatarUrl: string | null; reputationPoints: number }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const searchUsers = async (q: string) => {
    if (q.length < 2) { setUserResults([]); return; }
    try {
      const results = await api.get<any[]>(`/users/search?q=${encodeURIComponent(q)}&limit=5`);
      setUserResults(Array.isArray(results) ? results : []);
    } catch { setUserResults([]); }
  };

  const addCollab = async () => {
    if (!name.trim() && !selectedUserId) { setError('Name or user required'); return; }
    setAdding(true); setError('');
    try {
      const result = await api.post<Collaborator>(`/repos/${repoId}/collaborators`, {
        targetUserId: selectedUserId || undefined,
        name: name.trim() || undefined,
        type, role: role.trim() || undefined, url: url.trim() || undefined,
      });
      setCollabs(p => [...p, result]);
      setName(''); setRole(''); setUrl(''); setUserSearch(''); setSelectedUserId(null); setShowForm(false);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to add'); }
    finally { setAdding(false); }
  };

  const removeCollab = async (id: string) => {
    setRemovingId(id);
    try {
      await api.delete(`/repos/${repoId}/collaborators/${id}`);
      setCollabs(p => p.filter(c => c.id !== id));
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to remove'); }
    finally { setRemovingId(null); }
  };

  return (
    <div className="mx-3 mb-3 rounded-xl border" style={{ borderColor: 'rgba(131,110,249,0.12)', background: 'rgba(131,110,249,0.02)' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgba(131,110,249,0.08)' }}>
        <Users className="w-3 h-3 text-monad-400" />
        <span className="text-monad-400 font-mono text-xs font-bold">Collaborators</span>
      </div>
      <div className="px-3 py-2 space-y-2">
        {collabs.length === 0 && <p className="text-zinc-600 font-mono text-xs py-1">no collaborators</p>}
        {collabs.map(c => (
          <div key={c.id} className="flex items-center gap-2">
            {c.user?.avatarUrl ? (
              <img src={c.user.avatarUrl} alt="" className="w-5 h-5 rounded-full border border-white/10 object-cover shrink-0" />
            ) : <div className="w-5 h-5 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center shrink-0"><span className="text-zinc-500 text-xs">{(c.name || '?').charAt(0)}</span></div>}
            <div className="flex-1 min-w-0">
              <span className="text-zinc-300 font-mono text-xs">{c.user?.username ? `@${c.user.username}` : c.name}</span>
              {c.role && <span className="text-zinc-600 font-mono text-xs ml-2">· {c.role}</span>}
              <span className="text-zinc-700 font-mono text-xs ml-2 capitalize">[{c.type.toLowerCase()}]</span>
            </div>
            <button onClick={() => removeCollab(c.id)} disabled={removingId === c.id} className="text-zinc-700 hover:text-red-400 transition-colors disabled:opacity-40">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {showForm ? (
          <div className="pt-2 border-t space-y-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1">
              {(['USER', 'AI_AGENT', 'PROGRAM'] as const).map(t => (
                <button key={t} onClick={() => setType(t)} className={`text-xs font-mono px-2 py-1 rounded-lg transition-all ${type === t ? 'bg-monad-500/20 border-monad-500/30 text-monad-300' : 'border-white/08 text-zinc-600 hover:text-zinc-400'} border`}>{t.toLowerCase().replace('_', ' ')}</button>
              ))}
            </div>
            {type === 'USER' ? (
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); setSelectedUserId(null); searchUsers(e.target.value); }}
                  placeholder="Search username..."
                  className="w-full text-xs px-2 py-1.5 rounded-lg font-mono"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }}
                />
                {userResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 rounded-lg border z-10 overflow-hidden" style={{ background: '#0f0f18', borderColor: 'rgba(131,110,249,0.2)' }}>
                    {userResults.map(u => (
                      <button key={u.id} onClick={() => { setSelectedUserId(u.id); setName(u.username); setUserSearch(u.username); setUserResults([]); }} className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-monad-500/10 transition-colors text-left">
                        {u.avatarUrl && <img src={u.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />}
                        <span className="text-xs font-mono text-zinc-300">@{u.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name *" className="w-full text-xs px-2 py-1.5 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
            )}
            <div className="flex gap-2">
              <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Role (optional)" className="flex-1 text-xs px-2 py-1.5 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
              {type !== 'USER' && <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (optional)" className="flex-1 text-xs px-2 py-1.5 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />}
            </div>
            {error && <p className="text-red-400 font-mono text-xs">{error}</p>}
            <div className="flex gap-2">
              <button onClick={addCollab} disabled={adding} className="text-xs font-mono px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all" style={{ background: 'rgba(131,110,249,0.15)', border: '1px solid rgba(131,110,249,0.3)', color: '#c4b5fd' }}>{adding ? '...' : 'add'}</button>
              <button onClick={() => { setShowForm(false); setError(''); }} className="text-xs font-mono px-3 py-1.5 rounded-lg text-zinc-500 transition-all" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-xs font-mono text-zinc-600 hover:text-monad-400 transition-colors py-0.5">
            <Plus className="w-3 h-3" /> add collaborator
          </button>
        )}
      </div>
    </div>
  );
}

// ── Publish Repo Modal ─────────────────────────────────────────────────────────

function PublishRepoModal({ ghRepo, onPublished, onClose }: {
  ghRepo: GitHubRepo;
  onPublished: (repo: Repository) => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [lockType, setLockType] = useState<'public' | 'locked'>('public');
  const [lockPrice, setLockPrice] = useState('');
  const [description, setDescription] = useState(ghRepo.description || '');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) { setError('Only PNG, JPG, WebP, SVG allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5MB'); return; }
    setLogoUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<{ logoUrl: string }>('/repos/upload-logo', formData);
      setLogoUrl((result as any).logoUrl || '');
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Logo upload failed'); }
    finally { setLogoUploading(false); }
  };

  const handlePublish = async () => {
    const price = lockType === 'locked' ? parseFloat(lockPrice) : undefined;
    if (lockType === 'locked' && (!price || price <= 0)) { setError('Enter a valid price'); return; }
    setPublishing(true); setError('');
    try {
      const published = await api.post<{ id: string }>('/repos/publish', {
        id: ghRepo.id, name: ghRepo.name, full_name: ghRepo.full_name,
        description: description.trim() || ghRepo.description, language: ghRepo.language,
        stargazers_count: ghRepo.stargazers_count, forks_count: ghRepo.forks_count,
        html_url: ghRepo.html_url, clone_url: ghRepo.clone_url,
        topics: ghRepo.topics, private: ghRepo.private,
        isLocked: lockType === 'locked',
        lockedPriceUsd: price,
        logoUrl: logoUrl || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
      });
      const full = await api.get<Repository>(`/repos/${(published as any).id}`);
      onPublished(full);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to publish'); }
    finally { setPublishing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-y-auto" style={{ maxHeight: '90vh', background: '#0e0e18', border: '1px solid rgba(131,110,249,0.2)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h3 className="font-bold text-zinc-100 text-sm">Publish Repository</h3>
            <p className="text-zinc-600 font-mono text-xs mt-0.5">{ghRepo.name}{ghRepo.private ? ' · private' : ''}</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Description */}
          <div>
            <label className="text-xs text-zinc-500 font-mono block mb-1.5">Description <span className="text-zinc-700">(what is this repo?)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain what this repository does..." rows={3} maxLength={500} className="w-full text-sm px-3 py-2 rounded-xl font-mono resize-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
          </div>
          {/* Visibility */}
          <div className="space-y-2">
            {([['public', 'Public — Free', 'Anyone can see and download', <Globe key="g" className="w-4 h-4" />], ['locked', 'Locked — Paid Access', 'Users pay to unlock download', <Lock key="l" className="w-4 h-4" />]] as const).map(([val, label, desc, icon]) => (
              <button key={val} onClick={() => setLockType(val)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${lockType === val ? 'border-monad-500/40' : 'border-white/06 hover:border-white/12'}`} style={{ background: lockType === val ? 'rgba(131,110,249,0.08)' : 'rgba(255,255,255,0.02)' }}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${lockType === val ? 'bg-monad-500/20 text-monad-400' : 'bg-white/04 text-zinc-600'}`}>{icon}</div>
                <div><p className={`text-sm font-medium ${lockType === val ? 'text-monad-300' : 'text-zinc-400'}`}>{label}</p><p className="text-xs text-zinc-600">{desc}</p></div>
              </button>
            ))}
          </div>
          {lockType === 'locked' && (
            <div>
              <label className="text-xs text-zinc-500 font-mono block mb-1.5">Price in USD <span className="text-zinc-700">(paid via ETH on Base)</span></label>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                <span className="text-zinc-600 font-mono text-sm">$</span>
                <input type="number" min="0.01" step="0.01" placeholder="9.99" value={lockPrice} onChange={e => setLockPrice(e.target.value)} className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-700" />
              </div>
            </div>
          )}
          {/* Branding */}
          <div className="border-t pt-4 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-mono text-zinc-600">Branding (optional)</p>
            <div>
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
              <button onClick={() => logoInputRef.current?.click()} className="w-full rounded-xl border-2 border-dashed py-4 text-center transition-colors hover:border-monad-500/30" style={{ borderColor: logoUrl ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)' }}>
                {logoUploading ? (
                  <p className="text-xs font-mono text-monad-400 animate-pulse">uploading...</p>
                ) : logoUrl ? (
                  <div className="flex items-center justify-center gap-3">
                    <img src={logoUrl.startsWith('/api') ? `${API_URL.replace('/api/v1', '')}${logoUrl}` : logoUrl} alt="logo" className="w-8 h-8 rounded-lg object-cover" />
                    <p className="text-xs font-mono text-green-400">logo uploaded</p>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-zinc-600 flex items-center justify-center gap-1.5"><Upload className="w-3 h-3" /> upload logo</p>
                )}
              </button>
            </div>
            <input type="url" placeholder="Website URL" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
            <input type="url" placeholder="Twitter/X URL" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg font-mono" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7', outline: 'none' }} />
          </div>
          {/* Wallet warning */}
          {!user?.walletAddress && (
            <div className="rounded-xl p-3 text-xs font-mono flex items-center gap-2" style={{ background: 'rgba(131,110,249,0.05)', border: '1px solid rgba(131,110,249,0.15)' }}>
              <Wallet className="w-3.5 h-3.5 text-monad-400/60 shrink-0" strokeWidth={1.5} />
              <span className="text-zinc-500">No wallet linked — <Link href="/profile?tab=wallet" className="text-monad-400 hover:text-monad-300">link wallet</Link> to receive payments</span>
            </div>
          )}
          {error && <p className="text-red-400 font-mono text-xs">{error}</p>}
          <button onClick={handlePublish} disabled={publishing} className="w-full py-2.5 rounded-xl font-mono font-bold text-sm disabled:opacity-40 transition-all" style={{ background: 'linear-gradient(135deg, rgba(131,110,249,0.4), rgba(99,102,241,0.3))', border: '1px solid rgba(131,110,249,0.4)', color: '#e2d9ff' }}>
            {publishing ? 'publishing...' : 'publish →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ReposMarketPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--bg)' }} />}>
      <ReposMarketPageContent />
    </Suspense>
  );
}

function ReposMarketPageContent() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'mine' ? 'mine' : 'market';

  const [activeTab, setActiveTab] = useState<'market' | 'mine'>(initialTab);

  // Market tab state
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'votes' | 'stars' | 'downloads'>('recent');
  const [error, setError] = useState('');

  // My repos tab state
  const [myRepos, setMyRepos] = useState<Repository[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [publishingRepo, setPublishingRepo] = useState<GitHubRepo | null>(null);
  const [ghNeedsConnect, setGhNeedsConnect] = useState(false);
  const [ghNeedsReauth, setGhNeedsReauth] = useState(false);
  const [ghLoading, setGhLoading] = useState(false);

  // Payment
  const [consentModal, setConsentModal] = useState<{ repo: Repository; sellerWallet: string; buyerAddress: string; sellerWei: bigint; platformWei: bigint; totalWei: bigint; totalUsd: number } | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(tab === 'mine' ? 'mine' : 'market');
  }, [searchParams]);

  const fetchRepos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ sortBy });
      if (search) params.set('search', search);
      if (language && language !== 'All') params.set('language', language);
      const data = await api.get<{ data: Repository[] }>(`/repos?${params}`);
      setRepos(data.data);
    } catch { setError('Failed to load repositories'); } finally { setLoading(false); }
  }, [search, language, sortBy]);

  const fetchMyRepos = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setMyLoading(true);
    try {
      const params = new URLSearchParams({ sortBy: 'recent' });
      const data = await api.get<{ data: Repository[] }>(`/repos?${params}`);
      setMyRepos(data.data.filter(r => r.user?.username === user.username));
    } catch { setError('Failed to load your repos'); } finally { setMyLoading(false); }
  }, [isAuthenticated, user]);

  useEffect(() => { fetchRepos(); }, [fetchRepos]);

  useEffect(() => {
    if (activeTab === 'mine' && isAuthenticated) fetchMyRepos();
  }, [activeTab, fetchMyRepos, isAuthenticated]);

  const switchTab = (tab: 'market' | 'mine') => {
    setActiveTab(tab);
    router.push(tab === 'mine' ? '/market/repos?tab=mine' : '/market/repos', { scroll: false });
  };

  const loadGhRepos = async () => {
    if (!user?.githubLogin) { setGhNeedsConnect(true); setShowPublishPanel(true); return; }
    setGhLoading(true); setGhNeedsReauth(false); setGhNeedsConnect(false); setShowPublishPanel(true);
    try {
      await api.delete('/repos/github/cache').catch(() => {});
      const data = await api.get<GitHubRepo[]>('/repos/github');
      const raw = Array.isArray(data) ? data : [];
      const needsReauth = raw.some((r: any) => r._bolty_reauth);
      if (needsReauth) { setGhNeedsReauth(true); setGhRepos([]); }
      else setGhRepos(raw);
    } catch { setError('Failed to fetch GitHub repos'); } finally { setGhLoading(false); }
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

  const unlock = async (repo: Repository) => {
    if (!repo.lockedPriceUsd) return;
    let sellerWallet: string | null = null;
    try {
      const details = await api.get<any>(`/repos/${repo.id}`);
      sellerWallet = details?.user?.walletAddress;
    } catch { setError('Could not fetch seller wallet'); return; }
    if (!sellerWallet) { setError('Seller has no wallet linked'); return; }
    const ethereum = getMetaMaskProvider();
    if (!ethereum) { setError('MetaMask not found'); return; }
    let ethPrice = 2000;
    try { const p = await api.get<any>('/chart/eth-price'); if (p.price) ethPrice = p.price; } catch {}
    const totalUsd = repo.lockedPriceUsd;
    const totalWei = BigInt(Math.ceil((totalUsd / ethPrice) * 1e18));
    const sellerWei = (totalWei * BigInt(975)) / BigInt(1000);
    const platformWei = totalWei - sellerWei;
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      setConsentModal({ repo, sellerWallet, buyerAddress: accounts[0], sellerWei, platformWei, totalWei, totalUsd });
    } catch { setError('Could not connect to MetaMask'); }
  };

  const executeRepoPurchase = async (signature: string, message: string) => {
    if (!consentModal) return;
    const { repo, sellerWallet, buyerAddress, sellerWei, platformWei } = consentModal;
    setConsentModal(null);
    const ethereum = getMetaMaskProvider();
    if (!ethereum) { setError('MetaMask not found'); return; }
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
    try {
      const txHash = (await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: buyerAddress, to: sellerWallet, value: '0x' + sellerWei.toString(16) }] })) as string;
      let platformFeeTxHash: string | undefined;
      if (platformWallet) {
        platformFeeTxHash = (await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: buyerAddress, to: platformWallet, value: '0x' + platformWei.toString(16) }] })) as string;
      }
      const result = await api.post<{ success: boolean; downloadUrl?: string }>(`/repos/${repo.id}/purchase`, { txHash, platformFeeTxHash, consentSignature: signature, consentMessage: message });
      if (result.success && result.downloadUrl) window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      await fetchRepos();
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg.includes('rejected') ? 'Payment cancelled' : err instanceof ApiError ? err.message : 'Payment failed: ' + msg.slice(0, 80));
    }
  };

  const ghActions: Action[] = ghRepos.map(r => ({
    id: String(r.id), label: r.name, icon: <GitBranch className="w-4 h-4 text-monad-400" strokeWidth={1.5} />,
    description: r.language || '', short: r.private ? 'private' : 'public', end: 'publish',
  }));

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <BackgroundBeams className="opacity-40" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-20 pb-16">

        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[#21262d]">
          <div className="flex items-center gap-2 text-xs text-[#8b949e] mb-4">
            <Link href="/market" className="hover:text-[#58a6ff] transition-colors">Market</Link>
            <span className="text-[#30363d]">/</span>
            <span className="text-[#e6edf3]">Repositories</span>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[#e6edf3] mb-1">Repositories</h1>
              <p className="text-[#8b949e] text-sm">Discover, vote on, and download community code repositories.</p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => { switchTab('mine'); loadGhRepos(); }}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-all text-white bg-[#238636] border border-[#2ea043]/50 hover:bg-[#2ea043]"
              >
                <Plus className="w-4 h-4" /> Publish Repo
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-[#21262d]">
          {([['market', 'Marketplace', <Globe key="g" className="w-3.5 h-3.5" />], ['mine', 'My Repos', <GitBranch key="b" className="w-3.5 h-3.5" />]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === id
                  ? 'border-[#f78166] text-[#e6edf3]'
                  : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ── Marketplace tab ── */}
        {activeTab === 'market' && (
          <>
            {/* Search + filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full text-sm px-4 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-[#e6edf3] placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none transition-colors"
                />
              </div>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="text-sm px-3 py-2 rounded-md bg-[#161b22] border border-[#30363d] text-[#e6edf3] focus:border-[#58a6ff] focus:outline-none transition-colors"
              >
                {LANGUAGES.map(l => <option key={l} value={l === 'All' ? '' : l}>{l}</option>)}
              </select>
              <div className="flex gap-1.5 flex-wrap">
                {SORTS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSortBy(s.value as typeof sortBy)}
                    className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                      sortBy === s.value
                        ? 'bg-[#388bfd]/15 border-[#388bfd]/40 text-[#58a6ff]'
                        : 'bg-transparent border-[#30363d] text-[#8b949e] hover:border-[#8b949e] hover:text-[#e6edf3]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-lg border border-[#21262d] bg-[#0d1117] h-56 animate-pulse" />)}
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[#30363d] rounded-lg">
                <GitBranch className="w-10 h-10 text-[#30363d] mx-auto mb-3" strokeWidth={1} />
                <p className="text-[#8b949e] text-sm">No repositories found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {repos.map(r => <RepoCard key={r.id} repo={r} isAuthenticated={isAuthenticated} userId={user?.id} onVote={vote} onDownload={download} onUnlock={unlock} />)}
              </div>
            )}
          </>
        )}

        {/* ── My Publications tab ── */}
        {activeTab === 'mine' && (
          <>
            {!isAuthenticated ? (
              <div className="text-center py-20">
                <p className="text-zinc-500 font-mono text-sm mb-4">sign in to manage your repos</p>
                <Link href="/auth" className="text-xs font-mono px-4 py-2 rounded-xl" style={{ background: 'rgba(131,110,249,0.15)', border: '1px solid rgba(131,110,249,0.3)', color: '#c4b5fd' }}>sign in</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-zinc-500 font-mono">{myRepos.length} repo{myRepos.length !== 1 ? 's' : ''} published</p>
                  <button onClick={() => { setShowPublishPanel(p => !p); if (!showPublishPanel) loadGhRepos(); }} className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg transition-all" style={{ background: 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.3)', color: '#c4b5fd' }}>
                    <Plus className="w-3 h-3" /> {showPublishPanel ? 'close' : 'publish new'}
                  </button>
                </div>

                {/* GitHub repos panel */}
                {showPublishPanel && (
                  <div className="mb-5 rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-mono text-zinc-400">Your GitHub repositories</p>
                      <button onClick={() => setShowPublishPanel(false)} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">close</button>
                    </div>
                    {ghNeedsConnect && (
                      <div className="p-4 rounded-xl border text-center mb-3" style={{ borderColor: 'rgba(131,110,249,0.2)', background: 'rgba(131,110,249,0.05)' }}>
                        <p className="text-sm text-zinc-400 mb-3">Connect GitHub to publish repos</p>
                        {process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ? (
                          <a href={GITHUB_OAUTH_URL} className="inline-block px-4 py-2 rounded-xl border border-monad-500/30 text-monad-400 text-xs font-mono hover:bg-monad-500/10 transition-colors">Connect GitHub</a>
                        ) : (
                          <p className="text-xs font-mono text-zinc-600">GitHub OAuth not configured — set NEXT_PUBLIC_GITHUB_CLIENT_ID</p>
                        )}
                      </div>
                    )}
                    {ghNeedsReauth && (
                      <div className="p-4 rounded-xl border text-center mb-3" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                        <p className="text-sm text-zinc-400 mb-1">GitHub token expired</p>
                        <a href={GITHUB_OAUTH_URL} className="inline-block mt-2 px-4 py-2 rounded-xl border border-monad-500/30 text-monad-400 text-xs font-mono hover:bg-monad-500/10 transition-colors">Reconnect GitHub</a>
                      </div>
                    )}
                    {ghLoading && <p className="text-zinc-600 font-mono text-xs animate-pulse py-2">loading your repos...</p>}
                    {!ghNeedsConnect && !ghNeedsReauth && !ghLoading && (
                      <ActionSearchBar
                        actions={ghActions}
                        placeholder="Search your repos..."
                        label="Select a repo to publish"
                        onSelect={(action) => { const r = ghRepos.find(x => String(x.id) === action.id); if (r) setPublishingRepo(r); }}
                      />
                    )}
                  </div>
                )}

                {myLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0a0a12] h-20 animate-pulse" />)}
                  </div>
                ) : myRepos.length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <GitBranch className="w-10 h-10 text-zinc-700 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-zinc-600 font-mono text-sm mb-2">no repos published yet</p>
                    <button onClick={() => { setShowPublishPanel(true); loadGhRepos(); }} className="text-xs font-mono text-monad-400 hover:text-monad-300 transition-colors">publish your first repo →</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRepos.map(r => <MyRepoCard key={r.id} repo={r} onDelete={(id) => setMyRepos(p => p.filter(x => x.id !== id))} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Modals */}
        {publishingRepo && (
          <PublishRepoModal
            ghRepo={publishingRepo}
            onPublished={(r) => { setMyRepos(p => [r, ...p]); setPublishingRepo(null); setShowPublishPanel(false); }}
            onClose={() => setPublishingRepo(null)}
          />
        )}
        {consentModal && (
          <PaymentConsentModal
            listingTitle={consentModal.repo.name}
            sellerAddress={consentModal.sellerWallet}
            sellerAmountETH={(Number(consentModal.sellerWei) / 1e18).toFixed(6)}
            platformFeeETH={(Number(consentModal.platformWei) / 1e18).toFixed(6)}
            totalETH={(Number(consentModal.totalWei) / 1e18).toFixed(6)}
            totalUsd={consentModal.totalUsd.toFixed(2)}
            buyerAddress={consentModal.buyerAddress}
            onConsent={executeRepoPurchase}
            onCancel={() => setConsentModal(null)}
          />
        )}
      </div>
    </div>
  );
}
