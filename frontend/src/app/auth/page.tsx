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
 * Wallet-only auth page.
 *
 * Bolty's previous /auth offered email + password as a sign-in path
 * — that surface is gone with the ETH-mainnet pivot. The only way
 * to identify on Bolty now is to sign a nonce with an Ethereum
 * wallet (MetaMask, browser injected, or WalletConnect for mobile).
 *
 * Visual is intentionally bare: one big "Connect wallet" call, the
 * nonce-sign explanation in plain language, and the chain pill so
 * the user knows which network they're authing against.
 */
function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refresh } = useAuth();
  const redirect = searchParams?.get('redirect') ?? '/';

  const [phase, setPhase] = useState<
    'idle' | 'connecting' | 'signing' | 'verifying' | 'success' | 'error'
  >('idle');
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
      // connectMetaMask covers nonce → sign → verify in one call.
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
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(98,126,234,0.18), rgba(98,126,234,0) 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* ── Top: chain badge + back link ─────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-light text-[var(--text-muted)] hover:text-[var(--text)] transition"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </Link>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-light"
            style={{
              background: 'var(--brand-dim)',
              color: 'var(--brand)',
              boxShadow: 'inset 0 0 0 1px var(--brand-dim)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'var(--brand)' }}
            />
            Ethereum Mainnet
          </span>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-lg), inset 0 0 0 1px var(--border)',
          }}
        >
          {/* Heading */}
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)',
                boxShadow: 'var(--shadow-brand)',
              }}
            >
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="font-light"
                style={{
                  fontSize: '20px',
                  color: 'var(--text)',
                  letterSpacing: '-0.3px',
                }}
              >
                Connect wallet
              </h1>
              <p
                className="font-light text-[var(--text-muted)]"
                style={{ fontSize: '12.5px' }}
              >
                Sign a one-time message · no email, no password
              </p>
            </div>
          </div>

          {/* Connect buttons */}
          <div className="mt-6 space-y-2">
            <ConnectButton
              label="MetaMask / Injected"
              icon="🦊"
              available={hasMM}
              busy={phase === 'connecting' || phase === 'signing' || phase === 'verifying'}
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

          {/* Phase / error pill */}
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
                color: 'var(--error)',
                boxShadow: 'inset 0 0 0 1px rgba(248,113,113,0.25)',
              }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* What we do with your wallet */}
          <div
            className="mt-5 pt-5 text-[11.5px] font-light"
            style={{
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div className="flex items-start gap-2">
              <ShieldCheck
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: 'var(--brand)' }}
              />
              <p>
                We only read your address and ask you to sign a short
                message to prove ownership. <strong>Bolty never holds
                your private keys</strong> and never asks for a
                transaction at sign-in.
              </p>
            </div>
          </div>
        </div>

        <p
          className="mt-4 text-center text-[11px] font-light"
          style={{ color: 'var(--text-muted)' }}
        >
          By connecting you accept the{' '}
          <Link
            href="/terms"
            className="hover:underline"
            style={{ color: 'var(--brand)' }}
          >
            terms
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="hover:underline"
            style={{ color: 'var(--brand)' }}
          >
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
          background: 'var(--bg-card2)',
          color: 'var(--text-muted)',
          boxShadow: 'inset 0 0 0 1px var(--border)',
        }}
      >
        <span className="flex items-center gap-3">
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <span className="text-[13.5px] font-light">{label}</span>
        </span>
        <span
          className="text-[11px] font-light"
          style={{ color: 'var(--brand)' }}
        >
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
        background: 'var(--bg-card2)',
        color: 'var(--text)',
        boxShadow: 'inset 0 0 0 1px var(--border)',
      }}
    >
      <span className="flex items-center gap-3">
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span className="text-[13.5px] font-light">{label}</span>
      </span>
      {busy ? (
        <Loader2
          className="w-4 h-4 animate-spin"
          style={{ color: 'var(--brand)' }}
        />
      ) : cta ? (
        <span
          className="text-[11px] font-light"
          style={{ color: 'var(--text-muted)' }}
        >
          {cta}
        </span>
      ) : (
        <span
          className="text-[11.5px] font-light"
          style={{ color: 'var(--brand)' }}
        >
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
