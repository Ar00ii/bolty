'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { useAuth } from '@/lib/auth/AuthProvider';
import { connectMetaMask, isMetaMaskInstalled } from '@/lib/wallet/ethereum';
import { connectPhantom, isPhantomInstalled } from '@/lib/wallet/solana';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function AuthPage() {
  const { isAuthenticated, refresh } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleMetaMask = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask not found. Please install the MetaMask browser extension.');
      return;
    }
    setLoading('metamask');
    setError('');
    try {
      await connectMetaMask();
      await refresh();
      setSuccess('Connected with MetaMask!');
      setTimeout(() => router.push('/'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MetaMask connection failed');
    } finally {
      setLoading(null);
    }
  };

  const handlePhantom = async () => {
    if (!isPhantomInstalled()) {
      setError('Phantom wallet not found. Please install the Phantom browser extension.');
      return;
    }
    setLoading('phantom');
    setError('');
    try {
      await connectPhantom();
      await refresh();
      setSuccess('Connected with Phantom!');
      setTimeout(() => router.push('/'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phantom connection failed');
    } finally {
      setLoading(null);
    }
  };

  const handleGitHub = () => {
    setLoading('github');
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <TerminalCard title="auth_terminal" className="w-full">
          <div className="text-center mb-8">
            <h1 className="text-neon-glow font-mono font-black text-3xl mb-2">
              [BOLTY]
            </h1>
            <p className="text-terminal-muted text-sm font-mono">
              authenticate to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded px-3 py-2 mb-4">
              <p className="text-red-400 text-xs font-mono">ERROR: {error}</p>
            </div>
          )}

          {success && (
            <div className="bg-neon-400/10 border border-neon-400/30 rounded px-3 py-2 mb-4">
              <p className="text-neon-400 text-xs font-mono">✓ {success}</p>
            </div>
          )}

          <div className="space-y-3">
            {/* MetaMask */}
            <button
              onClick={handleMetaMask}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-4 py-3 border border-terminal-border rounded font-mono text-sm text-terminal-text hover:border-orange-400/50 hover:bg-orange-400/5 hover:text-orange-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xl">🦊</span>
              <div className="flex-1 text-left">
                <div className="font-semibold">MetaMask</div>
                <div className="text-xs text-terminal-muted">Ethereum wallet</div>
              </div>
              {loading === 'metamask' && (
                <span className="text-xs animate-pulse">connecting...</span>
              )}
            </button>

            {/* Phantom */}
            <button
              onClick={handlePhantom}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-4 py-3 border border-terminal-border rounded font-mono text-sm text-terminal-text hover:border-purple-400/50 hover:bg-purple-400/5 hover:text-purple-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xl">👻</span>
              <div className="flex-1 text-left">
                <div className="font-semibold">Phantom</div>
                <div className="text-xs text-terminal-muted">Solana wallet</div>
              </div>
              {loading === 'phantom' && (
                <span className="text-xs animate-pulse">connecting...</span>
              )}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-terminal-border" />
              <span className="text-terminal-muted text-xs font-mono">or</span>
              <div className="flex-1 h-px bg-terminal-border" />
            </div>

            {/* GitHub */}
            <button
              onClick={handleGitHub}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-4 py-3 border border-terminal-border rounded font-mono text-sm text-terminal-text hover:border-neon-400/50 hover:bg-neon-400/5 hover:text-neon-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xl">🐙</span>
              <div className="flex-1 text-left">
                <div className="font-semibold">GitHub</div>
                <div className="text-xs text-terminal-muted">
                  Login and showcase repos
                </div>
              </div>
              {loading === 'github' && (
                <span className="text-xs animate-pulse">redirecting...</span>
              )}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-terminal-border">
            <p className="text-terminal-muted text-xs font-mono text-center leading-relaxed">
              {'// Authentication uses cryptographic signatures.'}
              <br />
              {'// No passwords stored. Replay-attack protected.'}
            </p>
          </div>
        </TerminalCard>
      </div>
    </div>
  );
}
