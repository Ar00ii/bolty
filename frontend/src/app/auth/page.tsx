'use client';

import {
  Lock,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
  User,
  KeyRound,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { BoltyLogo } from '@/components/ui/BoltyLogo';
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
      (msg.includes('exist') || msg.includes('taken') || msg.includes('use') || msg.includes('registered'))
    ) {
      return 'This email is already in use.';
    }
    if (msg.includes('username') && (msg.includes('exist') || msg.includes('taken') || msg.includes('use'))) {
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
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 items-center">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              n <= str ? meta.color : 'bg-zinc-800'
            }`}
          />
        ))}
        {meta.label && (
          <span
            className={`text-xs ml-1 font-light ${
              str === 1 ? 'text-red-400' : str === 2 ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            {meta.label}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {PWD_CHECKS.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.test(password) ? (
              <svg
                className="w-3 h-3 text-green-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-3 h-3 rounded-full border border-zinc-700 flex-shrink-0" />
            )}
            <span className={`text-xs ${c.test(password) ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
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
  const isPassword = type === 'password';
  const inputType = isPassword && showToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      <label className="block text-sm font-light text-zinc-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full px-4 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-white
                     placeholder:text-zinc-700 text-sm
                     focus:outline-none focus:border-monad-500/50 focus:ring-1 focus:ring-monad-500/20
                     transition-all duration-200"
        />
        {showToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-zinc-600 mt-1">{hint}</p>}
    </div>
  );
}

// -- Error & Success Banners ----
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" strokeWidth={2} />
      <p className="text-red-400 text-sm leading-snug">{message}</p>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-2.5 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 mb-4">
      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" strokeWidth={2} />
      <p className="text-green-400 text-sm leading-snug">{message}</p>
    </div>
  );
}

// -- Main Component ----
export default function AuthPage() {
  const { isAuthenticated, isLoading: authLoading, refresh } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset-sent'>('login');

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
      await api.post('/auth/login/2fa', { tempToken, code: twoFactorCode });
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
      setSuccess('Account created! You can now sign in.');
      setTimeout(() => {
        setTab('login');
        clearMessages();
        setRegEmail('');
        setRegUsername('');
        setRegPassword('');
        setRegConfirm('');
        setLoginIdentifier(regEmail.trim());
      }, 1500);
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
      await api.post('/auth/forgot-password', { identifier: forgotIdentifier.trim() });
      setTab('reset-sent');
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(null);
    }
  };

  // -- Render ----
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative px-4 py-8"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #0f0f1e 50%, #1a0033 100%)',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(131,110,249,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(131,110,249,0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div
              className="p-3 rounded-xl"
              style={{ background: 'rgba(131,110,249,0.1)', border: '1px solid rgba(131,110,249,0.2)' }}
            >
              <BoltyLogo size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight mb-2">
            {twoFactorPending
              ? 'Verify your identity'
              : tab === 'login'
                ? 'Welcome back'
                : tab === 'register'
                  ? 'Create account'
                  : tab === 'forgot'
                    ? 'Reset password'
                    : 'Check your email'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {twoFactorPending
              ? 'Enter the 6-digit code sent to your email'
              : tab === 'login'
                ? 'Sign in to start building'
                : tab === 'register'
                  ? 'Join the Bolty developer community'
                  : tab === 'forgot'
                    ? 'Enter your email or username'
                    : 'A reset link has been sent to your inbox'}
          </p>
        </div>

        {/* Tab switcher */}
        {!twoFactorPending && tab !== 'forgot' && tab !== 'reset-sent' && (
          <div className="flex gap-2 mb-8 bg-zinc-900/30 p-1.5 rounded-lg border border-zinc-800">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  clearMessages();
                }}
                className={`flex-1 py-2 text-sm font-light rounded-md transition-all duration-200 ${
                  tab === t
                    ? 'bg-monad-500/30 text-monad-300 border border-monad-500/50'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
          {/* Error/Success messages */}
          {error && <ErrorBanner message={error} />}
          {success && <SuccessBanner message={success} />}

          {/* 2FA Form */}
          {twoFactorPending && (
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div
                className="p-4 rounded-lg border border-monad-500/20"
                style={{ background: 'rgba(131,110,249,0.05)' }}
              >
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Two-factor authentication is enabled. Enter the 6-digit code from your email. It expires in 10
                  minutes.
                </p>
              </div>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  className="w-full px-4 py-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-white
                           text-center text-2xl font-mono tracking-[0.3em] outline-none
                           focus:border-monad-500/50 focus:ring-1 focus:ring-monad-500/20
                           transition-all placeholder:text-zinc-700"
                />
              </div>
              <button
                type="submit"
                disabled={loading === '2fa' || twoFactorCode.length !== 6}
                className="w-full py-2.5 rounded-lg bg-monad-500 hover:bg-monad-600 text-white font-light transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading === '2fa' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify and sign in'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetTwoFactor();
                  clearMessages();
                }}
                className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                ← Back to sign in
              </button>
            </form>
          )}

          {/* Login Form */}
          {!twoFactorPending && tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
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
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      clearMessages();
                    }}
                    className="text-xs text-zinc-500 hover:text-monad-400 transition-colors font-light"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={anyLoading}
                className="w-full py-2.5 rounded-lg bg-monad-500 hover:bg-monad-600 text-white font-light transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
              >
                {loading === 'email' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    Sign in
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {!twoFactorPending && tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field
                label="Email"
                type="email"
                value={regEmail}
                onChange={setRegEmail}
                placeholder="you@email.com"
                autoComplete="email"
                hint="We'll never share your email"
              />
              <Field
                label="Username"
                type="text"
                value={regUsername}
                onChange={(v) => setRegUsername(v.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="your_username"
                autoComplete="username"
                hint="Letters, numbers, _ and -"
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
              <button
                type="submit"
                disabled={anyLoading}
                className="w-full py-2.5 rounded-lg bg-monad-500 hover:bg-monad-600 text-white font-light transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
              >
                {loading === 'email' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Create account
                  </>
                )}
              </button>
              <p className="text-xs text-center text-zinc-600 mt-4">
                By creating an account you agree to our{' '}
                <span className="text-zinc-500 hover:text-monad-400 cursor-pointer transition-colors">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-zinc-500 hover:text-monad-400 cursor-pointer transition-colors">
                  Privacy Policy
                </span>
                .
              </p>
            </form>
          )}

          {/* Forgot Password Form */}
          {!twoFactorPending && tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div
                className="p-4 rounded-lg border border-white/10"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enter your email or username and we'll send you a link to reset your password. The link expires in
                  30 minutes.
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
              <button
                type="submit"
                disabled={loading === 'forgot'}
                className="w-full py-2.5 rounded-lg bg-monad-500 hover:bg-monad-600 text-white font-light transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
              >
                {loading === 'forgot' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Send reset link
                  </>
                )}
              </button>
            </form>
          )}

          {/* Reset sent confirmation */}
          {!twoFactorPending && tab === 'reset-sent' && (
            <div className="space-y-4">
              <div className="flex gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-4">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-green-400 text-sm font-light">Check your email</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    If an account exists, you'll receive a reset link within a few minutes. Don't forget to check your
                    spam folder.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  clearMessages();
                  setForgotIdentifier('');
                }}
                className="w-full py-2.5 rounded-lg bg-monad-500 hover:bg-monad-600 text-white font-light transition-all"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-xs text-zinc-600">
          <p>
            Need help?{' '}
            <a href="mailto:support@bolty.network" className="text-monad-400 hover:text-monad-300 transition-colors">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
