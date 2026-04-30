'use client';

export const dynamic = 'force-dynamic';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
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
import { signInWithSolana } from '@/lib/wallet/solana';

/**
 * Bolty auth page — Solana wallet only.
 *
 * Connect a Solana wallet (Phantom / Solflare via the wallet-adapter
 * modal), sign one short message — the backend verifies the ed25519
 * signature against the wallet pubkey, mints a JWT, sets HttpOnly
 * cookies. Identity = wallet pubkey. No email, no password, no 2FA.
 */
function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, refresh } = useAuth();
  const redirect = searchParams?.get('redirect') ?? '/market';

  const { publicKey, signMessage, connected, connecting, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();

  const [phase, setPhase] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [autoSigned, setAutoSigned] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirect);
    }
  }, [isAuthenticated, redirect, router]);

  const onSign = useCallback(async () => {
    if (!publicKey || !signMessage) return;
    setError(null);
    setPhase('signing');
    try {
      await signInWithSolana({
        publicKeyBase58: publicKey.toBase58(),
        signMessage,
      });
      setPhase('success');
      await refresh();
      router.replace(redirect);
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    }
  }, [publicKey, signMessage, refresh, redirect, router]);

  // Auto-trigger the sign-in handshake the first time a wallet connects so
  // the user isn't bounced through a second confirmation step. If they
  // reject the signature we still show the manual "Sign to continue"
  // button so they can retry.
  useEffect(() => {
    if (connected && publicKey && signMessage && !autoSigned && phase === 'idle') {
      setAutoSigned(true);
      void onSign();
    }
  }, [connected, publicKey, signMessage, autoSigned, phase, onSign]);

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(20, 241, 149,0.16), rgba(20, 241, 149,0) 60%)',
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
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-400 hover:text-white transition mb-6"
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
                className="font-semibold text-white"
                style={{ fontSize: '20px', letterSpacing: '-0.3px' }}
              >
                Connect Solana wallet
              </h1>
              <p className="font-semibold text-zinc-400" style={{ fontSize: '12.5px' }}>
                Sign one short message — no email, no password
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {!connected ? (
              <button
                type="button"
                onClick={() => setVisible(true)}
                disabled={connecting}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:translate-x-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  color: 'white',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <span className="flex items-center gap-3">
                  <span style={{ fontSize: '20px' }}>👻</span>
                  <span className="text-[13.5px] font-semibold">
                    {connecting ? 'Connecting…' : 'Phantom / Solflare / …'}
                  </span>
                </span>
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#b4a7ff' }} />
                ) : (
                  <span className="text-[11.5px] font-semibold" style={{ color: '#b4a7ff' }}>
                    Connect →
                  </span>
                )}
              </button>
            ) : (
              <>
                <div
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: 'rgba(34,197,94,0.06)',
                    color: '#86efac',
                    boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.18)',
                  }}
                >
                  <span className="flex items-center gap-2 text-[12px] font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {wallet?.adapter.name ?? 'Wallet'} connected
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void disconnect();
                      setAutoSigned(false);
                      setPhase('idle');
                      setError(null);
                    }}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-white transition"
                  >
                    Disconnect
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onSign}
                  disabled={phase === 'signing' || phase === 'success'}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 transition hover:translate-x-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, rgba(20, 241, 149,0.15) 0%, rgba(20, 241, 149,0.08) 100%)',
                    color: 'white',
                    boxShadow: 'inset 0 0 0 1px rgba(20, 241, 149,0.35)',
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Wallet className="w-4 h-4" style={{ color: '#b4a7ff' }} />
                    <span className="text-[13.5px] font-semibold">Sign to continue</span>
                  </span>
                  {phase === 'signing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#b4a7ff' }} />
                  ) : (
                    <span className="text-[11.5px] font-semibold" style={{ color: '#b4a7ff' }}>
                      Sign →
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {phase === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-emerald-400"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Signed in. Redirecting…
            </motion.div>
          )}

          {phase === 'error' && error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-lg p-2.5 text-[12px] font-semibold"
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

          <div
            className="mt-5 pt-5 text-[11.5px] font-semibold text-zinc-400"
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
                  Bolty never holds your private keys
                </strong>{' '}
                and never asks for a transaction at sign-in.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] font-semibold text-zinc-500">
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

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}
