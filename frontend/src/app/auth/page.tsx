'use client';

export const dynamic = 'force-dynamic';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { connectMetaMask, getMetaMaskProvider } from '@/lib/wallet/ethereum';
import {
  isWalletConnectConfigured,
  linkWalletConnect,
} from '@/lib/wallet/walletconnect';

/**
 * Atlas auth page — wallet-only.
 *
 * The previous /auth was a 1,000-line surface with email
 * registration, password strength meters, 2FA, and "forgot
 * password" flows. None of that fits how a Web3 platform should
 * onboard: identity belongs to the wallet, not to a username +
 * password pair.
 *
 * This rewrite cuts the surface down to: connect MetaMask, or
 * WalletConnect on mobile. One signed nonce → JWT → done.
 *
 * Backend email endpoints (/auth/register, /auth/login/email,
 * /auth/password/*, /auth/2fa/*) are NOT removed by this commit —
 * they stay live so any existing email-only accounts keep working.
 * They're just unreachable from the UI; new users are funnelled
 * straight into the wallet path.
 */
function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refresh } = useAuth();
  const redirect = searchParams?.get('redirect') ?? '/market';

  const [phase, setPhase] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasMM, setHasMM] = useState(false);
  const [hasWC, setHasWC] = useState(false);

  useEffect(() => {
    setHasMM(!!getMetaMaskProvider());
    setHasWC(isWalletConnectConfigured());
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, redirect, router]);

  const onConnectMetaMask = useCallback(async () => {
    setError(null);
    setPhase('connecting');
    try {
      // connectMetaMask handles nonce → sign → verify in one call.
      await connectMetaMask();
      setPhase('success');
      await refresh();
      router.replace(redirect);
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Wallet connection failed');
    }
  }, [refresh, redirect, router]);

  const onConnectWC = useCallback(async () => {
    setError(null);
    setPhase('connecting');
    try {
      await linkWalletConnect();
      setPhase('success');
      await refresh();
      router.replace(redirect);
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'WalletConnect failed');
    }
  }, [refresh, redirect, router]);

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(20,241,149,0.16), rgba(20,241,149,0) 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-light text-zinc-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Link>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(10, 10, 14, 0.6)',
            backdropFilter: 'blur(12px)',
            boxShadow:
              '0 16px 40px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Heading */}
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #14F195 0%, #6b21a8 100%)',
                boxShadow: '0 4px 14px rgba(20, 241, 149, 0.25)',
              }}
            >
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="font-light text-white"
                style={{ fontSize: '20px', letterSpacing: '-0.3px' }}
              >
                Connect wallet
              </h1>
              <p className="font-light text-zinc-400" style={{ fontSize: '12.5px' }}>
                Sign one short message — no email, no password
              </p>
            </div>
          </div>

          {/* Connect buttons */}
          <div className="mt-6 space-y-2">
            <ConnectButton
              label="MetaMask / Injected"
              icon="🦊"
              available={hasMM}
              busy={phase === 'connecting'}
              onClick={onConnectMetaMask}
              cta={!hasMM ? 'Install MetaMask' : undefined}
              installHref={!hasMM ? 'https://metamask.io/download/' : undefined}
            />
            <ConnectButton
              label="WalletConnect (mobile)"
              icon="🌐"
              available={hasWC}
              busy={phase === 'connecting'}
              onClick={onConnectWC}
              cta={!hasWC ? 'Not configured' : undefined}
            />
          </div>

          {phase === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 text-[12px] font-light text-emerald-400"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Signed in. Redirecting…
            </motion.div>
          )}

          {phase === 'error' && error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg p-2.5 text-[12px] font-light"
              style={{
                background: 'rgba(248,113,113,0.08)',
                color: '#f87171',
                boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.25)',
              }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Reassurance */}
          <div
            className="mt-5 pt-5 text-[11.5px] font-light text-zinc-400"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <div className="flex items-start gap-2">
              <ShieldCheck
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: '#14F195' }}
              />
              <p>
                We only read your address and ask you to sign a short
                message to prove ownership.{' '}
                <strong className="text-white font-normal">
                  Atlas never holds your private keys
                </strong>{' '}
                and never asks for a transaction at sign-in.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] font-light text-zinc-500">
          By connecting you accept the{' '}
          <Link href="/terms" className="hover:text-white transition" style={{ color: '#b4a7ff' }}>
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="hover:text-white transition" style={{ color: '#b4a7ff' }}>
            privacy policy
          </Link>
          .
        </p>
      </motion.div>
    </div>
  );
}

function ConnectButton({
  label,
  icon,
  available,
  busy,
  onClick,
  cta,
  installHref,
}: {
  label: string;
  icon: string;
  available: boolean;
  busy: boolean;
  onClick: () => void;
  cta?: string;
  installHref?: string;
}) {
  if (!available && installHref) {
    return (
      <a
        href={installHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:translate-x-0.5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          color: '#a1a1aa',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <span className="flex items-center gap-3">
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <span className="text-[13.5px] font-light">{label}</span>
        </span>
        <span className="text-[11px] font-light" style={{ color: '#b4a7ff' }}>
          {cta} →
        </span>
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available || busy}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:translate-x-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'rgba(255,255,255,0.03)',
        color: 'white',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <span className="flex items-center gap-3">
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span className="text-[13.5px] font-light">{label}</span>
      </span>
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#b4a7ff' }} />
      ) : cta ? (
        <span className="text-[11px] font-light text-zinc-500">{cta}</span>
      ) : (
        <span className="text-[11.5px] font-light" style={{ color: '#b4a7ff' }}>
          Sign in →
        </span>
      )}
    </button>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}
