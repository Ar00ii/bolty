'use client';

export const dynamic = 'force-dynamic';

import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Zap,
} from 'lucide-react';

import { FlickeringGrid } from '@/components/ui/flickering-grid';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState, useEffect } from 'react';

import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

// -- Error mapping ----
function mapError(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Cannot connect to server. Please try again.';
  }
  if (err instanceof ApiError) {
    const msg = err.message?.toLowerCase() ?? '';
    if (
      msg.includes('invalid') ||
      msg.includes('incorrect') ||
      msg.includes('wrong') ||
      msg.includes('credentials') ||
      msg.includes('unauthorized')
    ) {
      return 'Incorrect email/username or password.';
    }
    if (
      msg.includes('email') &&
      (msg.includes('exist') ||
        msg.includes('taken') ||
        msg.includes('use') ||
        msg.includes('registered'))
    ) {
      return 'This email is already in use.';
    }
    if (
      msg.includes('username') &&
      (msg.includes('exist') || msg.includes('taken') || msg.includes('use'))
    ) {
      return 'This username is already taken.';
    }
    if (msg.includes('not found') || msg.includes('no account')) {
      return 'No account found with that email or username.';
    }
    if (msg.includes('password') && msg.includes('weak')) {
      return 'Password is too weak. Please meet all requirements.';
    }
    if (msg.includes('expired')) {
      return 'Your session or code has expired. Please try again.';
    }
    if (msg.includes('rate') || msg.includes('too many')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (err.message && err.message.length < 120) return err.message;
  }
  return 'Something went wrong. Please try again.';
}

// -- Password strength ----
const PWD_CHECKS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number (0-9)', test: (p: string) => /\d/.test(p) },
  {
    label: 'Special character',
    test: (p: string) => /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(p),
  },
];

function passwordStrength(p: string): 0 | 1 | 2 | 3 {
  const passed = PWD_CHECKS.filter((c) => c.test(p)).length;
  if (!p) return 0;
  if (passed <= 2) return 1;
  if (passed <= 3) return 2;
  return 3;
}

const STR_META = {
  0: { label: '', color: 'bg-zinc-700' },
  1: { label: 'Weak', color: 'bg-red-500' },
  2: { label: 'Fair', color: 'bg-yellow-500' },
  3: { label: 'Strong', color: 'bg-green-500' },
} as const;

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const str = passwordStrength(password);
  const meta = STR_META[str];
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3 space-y-2"
    >
      <div className="flex gap-1 items-center">
        {[1, 2, 3].map((n) => (
          <motion.div
            key={n}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: n * 0.05, duration: 0.3 }}
            className={`h-1 flex-1 rounded-full origin-left ${n <= str ? meta.color : 'bg-zinc-800'}`}
          />
        ))}
        {meta.label && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className={`text-xs ml-1 font-light ${
              str === 1 ? 'text-red-400' : str === 2 ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            {meta.label}
          </motion.span>
        )}
      </div>
      <div className="space-y-1">
        {PWD_CHECKS.map((c, idx) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            {c.test(password) ? (
              <motion.svg
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-3 h-3 text-green-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            ) : (
              <div className="w-3 h-3 rounded-full border border-zinc-700 flex-shrink-0" />
            )}
            <span className={`text-xs ${c.test(password) ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {c.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// -- Input Field ----
function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  showToggle,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  showToggle?: boolean;
  hint?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block text-sm font-light text-zinc-400 mb-2">{label}</label>
      <div className="relative">
        <motion.input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-white
                     placeholder:text-zinc-600 text-sm
                     focus:outline-none focus:border-bolty-500/60 focus:bg-zinc-900
                     transition-all duration-200"
          animate={{
            borderColor: focused ? 'rgba(131, 110, 249, 0.6)' : 'rgb(39, 39, 42)',
            backgroundColor: focused ? 'rgba(9, 9, 11, 1)' : 'rgba(9, 9, 11, 0.5)',
          }}
        />
        {showToggle && isPassword && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              overflow: 'visible',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <motion.div animate={{ rotate: showPassword ? 0 : 180 }} transition={{ duration: 0.2 }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </motion.div>
          </motion.button>
        )}
      </div>
      {hint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-zinc-600 mt-1"
        >
          {hint}
        </motion.p>
      )}
    </motion.div>
  );
}

// -- Error & Success Banners ----
function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4"
    >
      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-red-400 text-sm leading-snug">{message}</p>
    </motion.div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 mb-4"
    >
      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-green-400 text-sm leading-snug">{message}</p>
    </motion.div>
  );
}

// -- Main Component ----
export default function AuthPageWrapper() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  );
}

function AuthPage() {
  const { isAuthenticated, isLoading: authLoading, refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset-sent'>(initialTab);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Forgot password
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  // General state
  const [loading, setLoading] = useState<'email' | '2fa' | 'forgot' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 2FA
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.push('/');
  }, [isAuthenticated, authLoading, router]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetTwoFactor = () => {
    setTwoFactorPending(false);
    setTempToken('');
    setTwoFactorCode('');
  };

  const anyLoading = loading !== null;

  // -- Handlers ----

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!loginIdentifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }
    setLoading('email');
    try {
      const result = await api.post<{ twoFactorRequired?: boolean; tempToken?: string }>(
        '/auth/login/email',
        { identifier: loginIdentifier.trim(), password: loginPassword },
      );
      if (result.twoFactorRequired && result.tempToken) {
        setTempToken(result.tempToken);
        setTwoFactorPending(true);
        setSuccess('Check your email for the 6-digit verification code.');
        return;
      }
      await refresh();
      router.push('/');
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(null);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    setLoading('2fa');
    try {
      await api.post('/auth/2fa/verify', { tempToken, code: twoFactorCode });
      await refresh();
      router.push('/');
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regEmail.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!regUsername.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (!regPassword) {
      setError('Please enter a password.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }
    const str = passwordStrength(regPassword);
    if (str < 3) {
      setError('Password is too weak. Please meet all requirements.');
      return;
    }

    setLoading('email');
    try {
      await api.post('/auth/register', {
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
      });
      // Registration also signs the user in via http-only cookies. Send them
      // straight to the mandatory 2FA setup screen — Bolty requires every
      // account to be protected.
      setSuccess('Account created. Setting up two-factor authentication...');
      setRegEmail('');
      setRegUsername('');
      setRegPassword('');
      setRegConfirm('');
      window.location.href = '/onboarding/2fa';
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(null);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!forgotIdentifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }
    setLoading('forgot');
    try {
      await api.post('/auth/password/forgot', { identifier: forgotIdentifier.trim() });
      setTab('reset-sent');
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(null);
    }
  };

  const handleBack = () => {
    if (typeof window === 'undefined') return;
    const referrer = document.referrer;
    const sameOrigin = referrer && new URL(referrer).origin === window.location.origin;
    if (sameOrigin) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

  // -- Render ----
  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center relative px-4 py-8 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0f1a 50%, #1a0033 100%)',
      }}
    >
      {/* Flickering grid — sits between gradient and orbs, masked to fade at edges */}
      <FlickeringGrid
        className="absolute inset-0 z-0 pointer-events-none"
        squareSize={4}
        gridGap={6}
        color="#836EF9"
        maxOpacity={0.35}
        flickerChance={0.12}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 0%, rgba(10,10,14,0.7) 55%, rgba(10,10,14,0.95) 100%)',
        }}
      />

      {/* Animated background orbs */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, rgba(131,110,249,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        animate={{
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(circle, rgba(131,110,249,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto px-1"
      >
        {/* Back button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-zinc-400 hover:text-white transition-colors"
            style={{
              background: 'rgba(9,9,11,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            Back
          </button>
        </div>

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl font-light text-white tracking-tight mb-2">
            {twoFactorPending
              ? 'Verify identity'
              : tab === 'login'
                ? 'Welcome back'
                : tab === 'register'
                  ? 'Build with us'
                  : tab === 'forgot'
                    ? 'Recover account'
                    : 'Check inbox'}
          </h1>
          <p className="text-zinc-500 text-sm font-light">
            {twoFactorPending
              ? 'Enter the 6-digit code from your email'
              : tab === 'login'
                ? 'Sign in to your account'
                : tab === 'register'
                  ? 'Create your developer account'
                  : tab === 'forgot'
                    ? "We'll send you a reset link"
                    : 'Password reset link sent'}
          </p>
        </motion.div>

        {/* Tab switcher */}
        <AnimatePresence>
          {!twoFactorPending && tab !== 'forgot' && tab !== 'reset-sent' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative flex gap-1 mb-8 p-1 rounded-lg"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {(['login', 'register'] as const).map((t) => (
                <motion.button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    clearMessages();
                  }}
                  className={`relative flex-1 py-2 text-[12.5px] font-medium rounded-md transition-colors tracking-[0.005em] ${
                    tab === t ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                >
                  {tab === t && (
                    <motion.span
                      layoutId="auth-tab-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-md"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                        boxShadow:
                          'inset 0 0 0 1px rgba(131,110,249,0.35), 0 0 14px -4px rgba(131,110,249,0.45)',
                      }}
                    />
                  )}
                  <span className="relative z-10">
                    {t === 'login' ? 'Sign in' : 'Create account'}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative rounded-2xl p-8 overflow-hidden backdrop-blur-lg"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 36px -20px rgba(0,0,0,0.55)',
          }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          {/* Error/Success messages */}
          <AnimatePresence mode="wait">
            {error && <ErrorBanner key="error" message={error} />}
            {success && <SuccessBanner key="success" message={success} />}
          </AnimatePresence>

          {/* 2FA Form */}
          <AnimatePresence mode="wait">
            {twoFactorPending && (
              <motion.form
                key="2fa"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handle2FAVerify}
                className="space-y-4"
              >
                <div
                  className="p-4 rounded-lg border border-bolty-500/20"
                  style={{ background: 'rgba(131,110,249,0.05)' }}
                >
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Two-factor authentication enabled. Enter the 6-digit code from your email.
                    Expires in 10 minutes.
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-white
                             text-center text-2xl font-mono tracking-[0.3em] outline-none
                             focus:border-bolty-500/50 focus:ring-1 focus:ring-bolty-500/20
                             transition-all placeholder:text-zinc-700"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={loading === '2fa' || twoFactorCode.length !== 6}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-lg text-white font-medium text-[13px] tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.35) 0%, rgba(131,110,249,0.12) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.45), 0 0 22px -4px rgba(131,110,249,0.5)',
                  }}
                >
                  {loading === '2fa' ? (
                    <>
                      <motion.span
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Verifying...
                    </>
                  ) : (
                    'Verify and sign in'
                  )}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    resetTwoFactor();
                    clearMessages();
                  }}
                  whileHover={{ color: 'rgb(163, 230, 53)' }}
                  className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  ← Back to sign in
                </motion.button>
              </motion.form>
            )}

            {/* Login Form */}
            {!twoFactorPending && tab === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <Field
                    label="Email or username"
                    type="text"
                    value={loginIdentifier}
                    onChange={setLoginIdentifier}
                    placeholder="you@email.com"
                    autoComplete="username"
                  />
                  <div>
                    <Field
                      label="Password"
                      type="password"
                      value={loginPassword}
                      onChange={setLoginPassword}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      showToggle
                    />
                    <div className="mt-2 text-right">
                      <motion.button
                        type="button"
                        onClick={() => {
                          setTab('forgot');
                          clearMessages();
                        }}
                        whileHover={{ color: '#a78bfa' }}
                        className="text-xs text-zinc-600 hover:text-bolty-400 transition-colors font-light"
                      >
                        Forgot password?
                      </motion.button>
                    </div>
                  </div>
                </div>
                <motion.button
                  type="submit"
                  disabled={anyLoading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-lg bg-bolty-500 hover:bg-bolty-600 text-white font-light transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
                >
                  {loading === 'email' ? (
                    <>
                      <motion.span
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Sign in
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* Register Form */}
            {!twoFactorPending && tab === 'register' && (
              <motion.form
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleRegister}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <Field
                    label="Email"
                    type="email"
                    value={regEmail}
                    onChange={setRegEmail}
                    placeholder="you@email.com"
                    autoComplete="email"
                    hint="We never share your email"
                  />
                  <Field
                    label="Username"
                    type="text"
                    value={regUsername}
                    onChange={(v) => setRegUsername(v.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="your_username"
                    autoComplete="username"
                    hint="Letters, numbers, _, -"
                  />
                  <div>
                    <Field
                      label="Password"
                      type="password"
                      value={regPassword}
                      onChange={setRegPassword}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      showToggle
                    />
                    <PasswordStrengthMeter password={regPassword} />
                  </div>
                  <Field
                    label="Confirm password"
                    type="password"
                    value={regConfirm}
                    onChange={setRegConfirm}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    showToggle
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={anyLoading}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-lg bg-bolty-500 hover:bg-bolty-600 text-white font-light transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
                >
                  {loading === 'email' ? (
                    <>
                      <motion.span
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      Create account
                    </>
                  )}
                </motion.button>
                <p className="text-xs text-center text-zinc-600 mt-4">
                  By creating an account you agree to our{' '}
                  <Link
                    href="/terms"
                    className="text-zinc-500 hover:text-bolty-400 underline underline-offset-2 transition-colors"
                  >
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-zinc-500 hover:text-bolty-400 underline underline-offset-2 transition-colors"
                  >
                    Privacy
                  </Link>
                  .
                </p>
              </motion.form>
            )}

            {/* Forgot Password Form */}
            {!twoFactorPending && tab === 'forgot' && (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                <div
                  className="p-4 rounded-lg border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Enter your email or username. We&apos;ll send a reset link that expires in 30
                    minutes.
                  </p>
                </div>
                <Field
                  label="Email or username"
                  type="text"
                  value={forgotIdentifier}
                  onChange={setForgotIdentifier}
                  placeholder="you@email.com"
                  autoComplete="username"
                />
                <motion.button
                  type="submit"
                  disabled={loading === 'forgot'}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-lg bg-bolty-500 hover:bg-bolty-600 text-white font-light transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
                >
                  {loading === 'forgot' ? (
                    <>
                      <motion.span
                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Send reset link
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* Reset sent confirmation */}
            {!twoFactorPending && tab === 'reset-sent' && (
              <motion.div
                key="reset-sent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-4">
                  <CheckCircle
                    className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                    strokeWidth={2}
                  />
                  <div>
                    <p className="text-green-400 text-sm font-light">Check your email</p>
                    <p className="text-zinc-400 text-xs mt-1">
                      If an account exists, you&apos;ll receive a reset link. Check spam folder too.
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    clearMessages();
                    setForgotIdentifier('');
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 rounded-lg text-white font-medium text-[13px] tracking-[0.005em] transition-all hover:brightness-110"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.35) 0%, rgba(131,110,249,0.12) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.45), 0 0 22px -4px rgba(131,110,249,0.5)',
                  }}
                >
                  Back to sign in
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
