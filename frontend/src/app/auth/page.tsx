'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { useAuth } from '@/lib/auth/AuthProvider';
import { connectMetaMask, isMetaMaskInstalled } from '@/lib/wallet/ethereum';
import { connectPhantom, isPhantomInstalled } from '@/lib/wallet/solana';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
      <path d="M14.4806 21.8586L10.7754 20.7979L13.3776 19.6279L14.4806 21.8586Z" fill="#233447" stroke="#233447" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.5249 21.8586L21.6279 19.6279L24.2407 20.7979L20.5249 21.8586Z" fill="#233447" stroke="#233447" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.2594 28.872L10.9098 23.5335L6.77619 23.6507L10.2594 28.872Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24.0957 23.5335L24.7354 28.872L28.2293 23.6507L24.0957 23.5335Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M27.2268 17.8088L19.8452 18.1377L20.5248 21.8586L21.6278 19.6279L24.2406 20.7979L27.2268 17.8088Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.7753 20.7979L13.3775 19.6279L14.4805 21.8586L15.1601 18.1377L7.77905 17.8088L10.7753 20.7979Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.77905 17.8088L10.878 23.7012L10.7753 20.7979L7.77905 17.8088Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24.2406 20.7979L24.1279 23.7012L27.2268 17.8088L24.2406 20.7979Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.1601 18.1377L14.4805 21.8586L15.3353 26.2966L15.5265 20.6341L15.1601 18.1377Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.8452 18.1377L19.4894 20.6235L19.6699 26.2966L20.5248 21.8586L19.8452 18.1377Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.5248 21.8586L19.6699 26.2966L20.2886 26.703L24.1279 23.7012L24.2406 20.7979L20.5248 21.8586Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.7754 20.7979L10.878 23.7012L14.7173 26.703L15.3353 26.2966L14.4806 21.8586L10.7754 20.7979Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.5997 30.8429L20.6358 29.609L20.3099 29.3262H14.6954L14.3806 29.609L14.406 30.8429L10.2595 28.872L11.6945 30.053L14.6528 32.0957H20.353L23.3219 30.053L24.7461 28.872L20.5997 30.8429Z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.2886 26.703L19.6699 26.2966H15.3353L14.7173 26.703L14.3806 29.609L14.6954 29.3262H20.3099L20.6358 29.609L20.2886 26.703Z" fill="#161616" stroke="#161616" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M33.5168 11.3069L34.6024 6.09326L32.9582 1L20.2886 10.3714L25.1418 14.6491L32.0264 16.6918L33.5807 14.8989L32.9263 14.4265L33.9479 13.4977L33.1461 12.8971L34.1677 12.119L33.5168 11.3069Z" fill="#763E1A" stroke="#763E1A" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M0.403687 6.09326L1.48936 11.3069L0.827637 12.119L1.84924 12.8971L1.04747 13.4977L2.06907 14.4265L1.41465 14.8989L2.95762 16.6918L9.84219 14.6491L14.6954 10.3714L2.04861 1L0.403687 6.09326Z" fill="#763E1A" stroke="#763E1A" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32.0264 16.6918L25.1418 14.6491L27.2268 17.8088L24.1279 23.7012L28.2294 23.6507H34.3516L32.0264 16.6918Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.86407 14.6491L2.9795 16.6918L0.664612 23.6507H6.77627L10.878 23.7012L7.77908 17.8088L9.86407 14.6491Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.8452 18.1377L20.2886 10.3714L22.2666 4.99099H12.7396L14.6954 10.3714L15.1601 18.1377L15.3246 20.6449L15.3353 26.2966H19.6699L19.6806 20.6449L19.8452 18.1377Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PhantomLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <rect width="128" height="128" rx="24" fill="#AB9FF2"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M63.9507 28.0293C45.1979 28.0293 30.0811 42.4653 30.0811 60.3635V80.8016C30.0811 91.4085 38.7207 100 49.3879 100H78.7135C89.3807 100 98.0202 91.4085 98.0202 80.8016V60.3635C98.0202 42.4653 82.9034 28.0293 63.9507 28.0293ZM55.0528 71.9787C55.0528 76.5697 51.3028 80.2948 46.6801 80.2948C42.0574 80.2948 38.3073 76.5697 38.3073 71.9787V66.0682C38.3073 61.4773 42.0574 57.7521 46.6801 57.7521C51.3028 57.7521 55.0528 61.4773 55.0528 66.0682V71.9787ZM81.0787 71.9787C81.0787 76.5697 77.3287 80.2948 72.7059 80.2948C68.0832 80.2948 64.3332 76.5697 64.3332 71.9787V66.0682C64.3332 61.4773 68.0832 57.7521 72.7059 57.7521C77.3287 57.7521 81.0787 61.4773 81.0787 66.0682V71.9787Z" fill="white"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M94.8673 55.3405H98.0473C101.124 55.3405 103.617 57.8341 103.617 60.9118V75.1427C103.617 78.2204 101.124 80.7139 98.0473 80.7139H94.8673V55.3405ZM29.3834 55.3405H32.5634V80.7139H29.3834C26.3067 80.7139 23.813 78.2204 23.813 75.1427V60.9118C23.813 57.8341 26.3067 55.3405 29.3834 55.3405Z" fill="white"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M64.0214 99.1071C60.1274 99.1071 56.3748 98.2618 52.9934 96.7327C52.1173 96.3335 51.144 97.0417 51.2879 97.9949C51.6437 100.333 52.1958 102.627 52.9354 104.848C56.5084 105.64 60.2181 106.053 64.0214 106.053C68.0636 106.053 71.9911 105.597 75.7567 104.73C76.4932 102.538 77.0393 100.274 77.3864 97.9677C77.5249 97.0127 76.5507 96.3108 75.6769 96.7136C72.2363 98.2548 68.2273 99.1071 64.0214 99.1071Z" fill="white"/>
    </svg>
  );
}

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
      setSuccess('Connected with MetaMask successfully.');
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
      setSuccess('Connected with Phantom successfully.');
      setTimeout(() => router.push('/'), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phantom connection failed');
    } finally {
      setLoading(null);
    }
  };

  const handleGitHub = () => {
    setLoading('github');
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-monad-500/10 border border-monad-500/20 mb-4">
            <svg className="w-7 h-7 text-monad-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
            Connect to Bolty
          </h1>
          <p className="text-sm text-slate-400">
            Sign in with your wallet or GitHub account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Auth buttons */}
        <div className="space-y-3">
          {/* MetaMask */}
          <button
            onClick={handleMetaMask}
            disabled={loading !== null}
            className="auth-provider-btn group"
          >
            <div className="auth-provider-icon bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20">
              <MetaMaskLogo className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-white">MetaMask</div>
              <div className="text-xs text-slate-400">Ethereum wallet</div>
            </div>
            {loading === 'metamask' ? (
              <div className="w-4 h-4 rounded-full border-2 border-orange-400/30 border-t-orange-400 animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {/* Phantom */}
          <button
            onClick={handlePhantom}
            disabled={loading !== null}
            className="auth-provider-btn group"
          >
            <div className="auth-provider-icon bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/20">
              <PhantomLogo className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-white">Phantom</div>
              <div className="text-xs text-slate-400">Solana wallet</div>
            </div>
            {loading === 'phantom' ? (
              <div className="w-4 h-4 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="text-slate-500 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>

          {/* GitHub */}
          <button
            onClick={handleGitHub}
            disabled={loading !== null}
            className="auth-provider-btn group"
          >
            <div className="auth-provider-icon bg-slate-700/40 border-slate-600/30 group-hover:bg-slate-700/60">
              <GitHubLogo className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-white">GitHub</div>
              <div className="text-xs text-slate-400">Sign in and showcase repos</div>
            </div>
            {loading === 'github' ? (
              <div className="w-4 h-4 rounded-full border-2 border-slate-400/30 border-t-slate-400 animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          Authentication uses cryptographic signatures.
          <br />
          No passwords stored. Replay-attack protected.
        </p>
      </div>
    </div>
  );
}
