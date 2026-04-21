'use client';

export const dynamic = 'force-dynamic';

import { Loader2, ShieldCheck, Smartphone, Copy, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';

import { GradientText } from '@/components/ui/GradientText';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

type Step = 'loading' | 'scan' | 'verify' | 'done';

export default function Onboarding2FAPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06060a] grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
        </div>
      }
    >
      <Onboarding2FAInner />
    </Suspense>
  );
}

function Onboarding2FAInner() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/profile';

  const [step, setStep] = useState<Step>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth?tab=login');
      return;
    }
    if (
      (user as { twoFactorEnabled?: boolean }).twoFactorEnabled &&
      !initialised.current
    ) {
      router.replace(next);
      return;
    }
    if (initialised.current) return;
    initialised.current = true;
    void requestEnroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user]);

  async function requestEnroll() {
    setError(null);
    setStep('loading');
    try {
      const res = await api.post<{ qrCode?: string; secret?: string }>(
        '/auth/2fa/enable/request',
        {},
      );
      setQrCode(res.qrCode || null);
      setSecret(res.secret || null);
      setStep('scan');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start 2FA setup');
      setStep('scan');
    }
  }

  async function handleVerify() {
    if (code.length !== 6) {
      setError('Enter the 6-digit code from your app');
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await api.post('/auth/2fa/enable', { code });
      await refresh();
      setStep('done');
      setTimeout(() => router.replace(next), 800);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Invalid or expired code');
    } finally {
      setWorking(false);
    }
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-[#06060a] text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 10%, rgba(131,110,249,0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.10), transparent 45%)',
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{
              background: 'rgba(131,110,249,0.12)',
              border: '1px solid rgba(131,110,249,0.35)',
            }}
          >
            <ShieldCheck className="w-6 h-6 text-purple-300" strokeWidth={1.75} />
          </div>
          <h1 className="text-3xl font-light tracking-tight mb-1">
            Secure your account with <GradientText>2FA</GradientText>
          </h1>
          <p className="text-sm text-zinc-400 font-light">
            Bolty requires two-factor authentication for every account. It only takes a minute.
          </p>
        </div>

        {step === 'loading' && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
          </div>
        )}

        {step !== 'loading' && step !== 'done' && (
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                {qrCode ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCode}
                    alt="Authenticator QR code"
                    className="rounded-xl bg-white p-2"
                    style={{ width: 168, height: 168 }}
                  />
                ) : (
                  <div
                    className="rounded-xl grid place-items-center"
                    style={{
                      width: 168,
                      height: 168,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start gap-2 text-[13px] text-zinc-300 font-light leading-snug">
                  <Smartphone
                    className="w-4 h-4 text-purple-300 mt-0.5 flex-shrink-0"
                    strokeWidth={1.75}
                  />
                  <div>
                    Open Google Authenticator, 1Password, or any TOTP app and scan the QR code.
                  </div>
                </div>
                {secret && (
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wider text-zinc-500 mb-1">
                      Manual setup key
                    </div>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="w-full text-left font-mono text-[12.5px] px-3 py-2 rounded-lg flex items-center justify-between gap-2 hover:bg-white/5 transition"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <span className="truncate">{secret}</span>
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <label className="block text-[11.5px] uppercase tracking-wider text-zinc-500 mb-2">
                Enter the 6-digit code from your app
              </label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleVerify();
                  }}
                  placeholder="••••••"
                  className="flex-1 text-center sm:text-left font-mono tracking-[0.4em] text-xl py-3 px-4 rounded-lg bg-transparent text-white outline-none"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  aria-label="Verification code"
                />
                <ShimmerButton
                  onClick={handleVerify}
                  disabled={working || code.length !== 6}
                  className="px-6"
                >
                  {working ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying
                    </span>
                  ) : (
                    'Activate 2FA'
                  )}
                </ShimmerButton>
              </div>
              {error && <div className="mt-2 text-[12px] text-red-300">{error}</div>}
              <p className="mt-3 text-[11.5px] text-zinc-500 leading-snug">
                Save your recovery codes once 2FA is active. Without your authenticator and your
                recovery codes you may lose access to your account.
              </p>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background:
                'linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 100%)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <ShieldCheck className="w-10 h-10 mx-auto text-emerald-300 mb-3" strokeWidth={1.5} />
            <div className="text-lg font-light mb-1">Two-factor authentication enabled</div>
            <div className="text-[13px] text-zinc-400">Redirecting you to Bolty...</div>
          </div>
        )}
      </div>
    </div>
  );
}
