'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';
import { connectMetaMask, isMetaMaskInstalled } from '@/lib/wallet/ethereum';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ── SVG Logos ────────────────────────────────────────────────
function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function MetaMaskLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 35 33" fill="none" aria-hidden="true">
      <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.04858 1L15.0707 10.809L12.7396 4.99098L2.04858 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.2295 23.5335L24.7348 28.872L32.2023 30.9324L34.3517 23.6507L28.2295 23.5335Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M0.664612 23.6507L2.80256 30.9324L10.2594 28.872L6.77627 23.5335L0.664612 23.6507Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.86406 14.6491L7.77908 17.8088L15.1606 18.1377L14.9054 10.2405L9.86406 14.6491Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M25.1418 14.6491L20.0218 10.1513L19.8452 18.1377L27.2268 17.8088L25.1418 14.6491Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.2594 28.8721L14.7173 26.7031L10.878 23.7012L10.2594 28.8721Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.2886 26.7031L24.7359 28.8721L24.1279 23.7012L20.2886 26.7031Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24.7359 28.872L20.2886 26.703L20.6358 29.609L20.5997 30.8429L24.7359 28.872Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.2595 28.872L14.406 30.8429L14.3806 29.609L14.7173 26.703L10.2595 28.872Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32.0264 16.6918L25.1418 14.6491L27.2268 17.8088L24.1279 23.7012L28.2294 23.6507H34.3516L32.0264 16.6918Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.86407 14.6491L2.9795 16.6918L0.664612 23.6507H6.77627L10.878 23.7012L7.77908 17.8088L9.86407 14.6491Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.8452 18.1377L20.2886 10.3714L22.2666 4.99099H12.7396L14.6954 10.3714L15.1601 18.1377L15.3246 20.6449L15.3353 26.2966H19.6699L19.6806 20.6449L19.8452 18.1377Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Floating numbers background ───────────────────────────────
interface FloatingNum {
  id: number;
  value: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

function FloatingNumbers({ hovered }: { hovered: boolean }) {
  const [nums, setNums] = useState<FloatingNum[]>([]);

  useEffect(() => {
    const chars = '0123456789ABCDEFabcdef01';
    const generated: FloatingNum[] = Array.from({ length: 36 }, (_, i) => ({
      id: i,
      value: chars[Math.floor(Math.random() * chars.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 10 + Math.floor(Math.random() * 16),
      duration: 10 + Math.random() * 16,
      delay: Math.random() * 12,
    }));
    setNums(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {nums.map((n) => (
        <span
          key={n.id}
          className="absolute font-mono font-bold text-monad-400 transition-opacity duration-700"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            fontSize: `${n.size}px`,
            opacity: hovered ? 0.11 : 0.035,
            animation: `floatUp ${n.duration}s ${n.delay}s infinite linear`,
          }}
        >
          {n.value}
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0px) rotate(0deg); }
          50%  { transform: translateY(-18px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

// ── Trust badge ───────────────────────────────────────────────
function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-zinc-500 text-xs">
      <span className="text-monad-400/60">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────
function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm
                   outline-none focus:border-monad-500/60 focus:bg-zinc-900 transition-all
                   placeholder:text-zinc-600"
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AuthPage() {
  const { isAuthenticated, isLoading: authLoading, refresh } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [hovered, setHovered] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const [loading, setLoading] = useState<'email' | 'github' | 'metamask' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [metamaskInstalled, setMetamaskInstalled] = useState(false);

  useEffect(() => { setMetamaskInstalled(isMetaMaskInstalled()); }, []);
  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push('/');
  }, [isAuthenticated, authLoading, router]);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!loginEmail || !loginPassword) { setError('Please fill in all fields'); return; }
    setLoading('email');
    try {
      await api.post('/auth/login/email', { email: loginEmail, password: loginPassword });
      await refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!regEmail || !regUsername || !regPassword) { setError('Please fill in all fields'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading('email');
    try {
      await api.post('/auth/register', { email: regEmail, username: regUsername, password: regPassword });
      await refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleGitHub = () => {
    clearMessages();
    setLoading('github');
    window.location.href = `${API_URL}/auth/github`;
  };

  const handleMetaMask = async () => {
    clearMessages();
    setLoading('metamask');
    try {
      await connectMetaMask();
      await refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MetaMask connection failed.');
    } finally {
      setLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-monad-400 animate-spin" />
      </div>
    );
  }

  const anyLoading = loading !== null;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative px-4 py-12"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Floating numbers background */}
      <FloatingNumbers hovered={hovered} />

      {/* Radial gradient center glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo + brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-monad-500/10 border border-monad-500/20 mb-4">
            <svg className="w-7 h-7 text-monad-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bolty</h1>
          <p className="text-sm text-zinc-500 mt-1">The AI agent platform for developers</p>
        </div>

        {/* Main card */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-2xl shadow-black/40">

          {/* Tabs */}
          <div className="flex bg-zinc-900/60 rounded-xl p-1 mb-6 border border-zinc-800/60">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); clearMessages(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t
                    ? 'bg-monad-500/20 text-monad-300 border border-monad-500/30 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Error / success */}
          {error && (
            <div className="flex gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126zM12 15.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Email form */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field
                label="Email"
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="you@email.com"
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="submit"
                disabled={anyLoading}
                className="w-full py-3 rounded-xl bg-monad-500 hover:bg-monad-400 text-white font-semibold text-sm
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading === 'email' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field
                label="Email"
                type="email"
                value={regEmail}
                onChange={setRegEmail}
                placeholder="you@email.com"
                autoComplete="email"
              />
              <Field
                label="Username"
                type="text"
                value={regUsername}
                onChange={(v) => setRegUsername(v.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="myusername"
                autoComplete="username"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Password"
                  type="password"
                  value={regPassword}
                  onChange={setRegPassword}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <Field
                  label="Confirm"
                  type="password"
                  value={regConfirm}
                  onChange={setRegConfirm}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={anyLoading}
                className="w-full py-3 rounded-xl bg-monad-500 hover:bg-monad-400 text-white font-semibold text-sm
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {loading === 'email' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create account'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Social buttons */}
          <div className="space-y-2.5">
            {/* GitHub */}
            <button
              onClick={handleGitHub}
              disabled={anyLoading}
              className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl
                         hover:bg-zinc-800/70 hover:border-zinc-700 transition-all duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <GitHubLogo className="w-4 h-4 text-white" />
              </div>
              <span className="flex-1 text-left text-sm text-white font-medium">GitHub</span>
              {loading === 'github'
                ? <span className="w-4 h-4 rounded-full border-2 border-zinc-400/30 border-t-zinc-400 animate-spin" />
                : <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              }
            </button>

            {/* MetaMask */}
            {metamaskInstalled ? (
              <button
                onClick={handleMetaMask}
                disabled={anyLoading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl
                           hover:bg-zinc-800/70 hover:border-zinc-700 transition-all duration-150
                           disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <MetaMaskLogo className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left text-sm text-white font-medium">MetaMask</span>
                {loading === 'metamask'
                  ? <span className="w-4 h-4 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
                  : <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                }
              </button>
            ) : (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl
                           hover:border-zinc-700 transition-all duration-150 group"
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <MetaMaskLogo className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Install MetaMask</span>
                <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Trust signals */}
        <div className="mt-5 flex items-center justify-center gap-6 flex-wrap">
          <TrustBadge
            icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            text="No third-party data"
          />
          <TrustBadge
            icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
            text="Encrypted passwords"
          />
          <TrustBadge
            icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>}
            text="Link GitHub from your profile"
          />
        </div>
      </div>
    </div>
  );
}
