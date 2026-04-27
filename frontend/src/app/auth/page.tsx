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
import { BRAND_NAME_DISPLAY } from '@/lib/brand';
import { connectMetaMask, getMetaMaskProvider } from '@/lib/wallet/ethereum';
import {
  isWalletConnectConfigured,
  linkWalletConnect,
} from '@/lib/wallet/walletconnect';

/**
 * Wallet-only auth page in the base.org aesthetic.
 *
 * - White surface with the same soft top-of-page blue radial wash
 *   as the home dashboard.
 * - Centred Connect Wallet card on a generous airy canvas, NOT a
 *   floating modal. Card is white with a 1px hairline border and a
 *   subtle 8/24 shadow.
 * - Buttons: pill-shaped, 14px medium weight. Primary action uses
 *   solid Coinbase blue (#0052FF), secondary actions use white +
 *   border.
 * - Wordmark in the top-left as a back-link to /, mirroring the
 *   navigation idiom across the app.
 *
 * The functional surface is unchanged: still wallet-only,
 * MetaMask + WalletConnect, signed-nonce → JWT.
 */
function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refresh } = useAuth();
  const redirect = searchParams?.get('redirect') ?? '/';

  const [phase, setPhase] = useState<
    'idle' | 'connecting' | 'success' | 'error'
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
      className="min-h-screen relative"
      style={{ background: '#ffffff', color: 'var(--text)' }}
    >
      {/* Soft top wash, same idiom as dashboard. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 right-0 h-[600px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,82,255,0.08), rgba(0,82,255,0) 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 py-6">
        {/* Top bar — same as home */}
        <div className="flex items-center justify-between mb-20">
          <Link
            href="/"
            className="font-light tracking-tight inline-flex items-center gap-1.5 transition hover:opacity-70"
            style={{
              fontSize: '20px',
              color: 'var(--text)',
              letterSpacing: '-0.4px',
            }}
          >
            <ArrowLeft className="w-4 h-4 opacity-60" />
            {BRAND_NAME_DISPLAY}
          </Link>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-light"
            style={{
              background: '#ffffff',
              color: 'var(--text-secondary)',
              boxShadow: 'inset 0 0 0 1px var(--border)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#16A34A' }}
            />
            Ethereum Mainnet
          </span>
        </div>

        {/* ── Centred connect-wallet card ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-md"
        >
          {/* Hero text above the card — base.org-style oversized + lowercase */}
          <div className="mb-8 text-center">
            <h1
              style={{
                fontSize: 'clamp(36px, 4.4vw, 48px)',
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: '-1.5px',
                color: 'var(--text)',
              }}
            >
              connect your{' '}
              <span style={{ color: '#0052FF' }}>wallet</span>.
            </h1>
            <p
              className="mt-3"
              style={{
                fontSize: '15px',
                fontWeight: 400,
                lineHeight: 1.55,
                color: 'var(--text-muted)',
              }}
            >
              No email. No password. Sign one short message and you&apos;re in.
            </p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: '#ffffff',
              boxShadow: 'inset 0 0 0 1px var(--border), var(--shadow-md)',
            }}
          >
            <div className="space-y-2">
              <ConnectButton
                label="MetaMask"
                sub="Browser injected wallet"
                icon="🦊"
                available={hasMM}
                busy={phase === 'connecting'}
                onClick={onConnectMetaMask}
                installHref={!hasMM ? 'https://metamask.io/download/' : undefined}
              />
              <ConnectButton
                label="WalletConnect"
                sub="Mobile wallet via QR"
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
                className="mt-4 flex items-center gap-2 text-[12.5px] font-medium"
                style={{ color: '#16A34A' }}
              >
                <CheckCircle className="w-4 h-4" />
                Signed in. Redirecting…
              </motion.div>
            )}
            {phase === 'error' && error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl p-3 text-[12.5px] font-light"
                style={{
                  background: 'rgba(220,38,38,0.04)',
                  color: '#DC2626',
                  boxShadow: 'inset 0 0 0 1px rgba(220,38,38,0.18)',
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
              className="mt-5 pt-4 text-[11.5px] font-light"
              style={{
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div className="flex items-start gap-2">
                <ShieldCheck
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: '#0052FF' }}
                />
                <p>
                  We only read your address and ask you to sign a short
                  message to prove ownership.{' '}
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {BRAND_NAME_DISPLAY} never holds your private keys
                  </span>{' '}
                  and never asks for a transaction at sign-in.
                </p>
              </div>
            </div>
          </div>

          <p
            className="mt-5 text-center text-[11.5px] font-light"
            style={{ color: 'var(--text-muted)' }}
          >
            By connecting you accept the{' '}
            <Link
              href="/terms"
              className="hover:underline"
              style={{ color: '#0052FF' }}
            >
              terms
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="hover:underline"
              style={{ color: '#0052FF' }}
            >
              privacy policy
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function ConnectButton({
  label,
  sub,
  icon,
  available,
  busy,
  onClick,
  cta,
  installHref,
}: {
  label: string;
  sub: string;
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
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:bg-[var(--bg-muted)]"
        style={{
          background: '#ffffff',
          color: 'var(--text-muted)',
          boxShadow: 'inset 0 0 0 1px var(--border)',
        }}
      >
        <span className="flex items-center gap-3">
          <span style={{ fontSize: '22px' }}>{icon}</span>
          <span className="flex flex-col">
            <span
              className="text-[14px] font-medium"
              style={{ color: 'var(--text)' }}
            >
              {label}
            </span>
            <span className="text-[11px] font-light">{sub}</span>
          </span>
        </span>
        <span
          className="text-[11.5px] font-medium"
          style={{ color: '#0052FF' }}
        >
          Install →
        </span>
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available || busy}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:bg-[var(--bg-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: '#ffffff',
        color: 'var(--text)',
        boxShadow: 'inset 0 0 0 1px var(--border)',
      }}
    >
      <span className="flex items-center gap-3">
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <span className="flex flex-col text-left">
          <span
            className="text-[14px] font-medium"
            style={{ color: 'var(--text)' }}
          >
            {label}
          </span>
          <span
            className="text-[11px] font-light"
            style={{ color: 'var(--text-muted)' }}
          >
            {sub}
          </span>
        </span>
      </span>
      {busy ? (
        <Loader2
          className="w-4 h-4 animate-spin"
          style={{ color: '#0052FF' }}
        />
      ) : cta ? (
        <span
          className="text-[11.5px] font-light"
          style={{ color: 'var(--text-muted)' }}
        >
          {cta}
        </span>
      ) : (
        <Wallet
          className="w-4 h-4"
          style={{ color: '#0052FF' }}
        />
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
