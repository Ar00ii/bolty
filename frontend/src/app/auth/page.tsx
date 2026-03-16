'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';
import { Waves } from '@/components/ui/wave-background';
import { BoltyLogo } from '@/components/ui/BoltyLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// -- Password strength --------------------------------------------------------
const PWD_CHECKS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number (0-9)', test: (p: string) => /\d/.test(p) },
  { label: 'Special character', test: (p: string) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?`~]/.test(p) },
];

function passwordStrength(p: string): 0 | 1 | 2 | 3 {
  const passed = PWD_CHECKS.filter(c => c.test(p)).length;
  if (!p) return 0;
  if (passed <= 2) return 1;
  if (passed <= 3) return 2;
  return 3;
}

const STR_META = {
  0: { label: '', color: '' },
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
        {[1, 2, 3].map(n => (
          <div key={n} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${n <= str ? meta.color : 'bg-zinc-800'}`} />
        ))}
        {meta.label && (
          <span className={`text-xs ml-1 font-medium ${str === 1 ? 'text-red-400' : str === 2 ? 'text-yellow-400' : 'text-green-400'}`}>
            {meta.label}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {PWD_CHECKS.map(c => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.test(password)
              ? <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              : <div className="w-3 h-3 rounded-full border border-zinc-700 flex-shrink-0" />
            }
            <span className={`text-xs ${c.test(password) ? 'text-zinc-400' : 'text-zinc-600'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Field --------------------------------------------------------------------
function Field({ label, type, value, onChange, placeholder, autoComplete, showToggle }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; showToggle?: boolean;
}) {
  const [visible, setVisible] = React.useState(false);
  const inputType = showToggle ? (visible ? 'text' : 'password') : type;
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={inputType} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete={autoComplete}
          className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all
            bg-zinc-900/70 border border-zinc-800 text-white placeholder:text-zinc-600
            focus:border-monad-500/60 focus:bg-zinc-900 focus:ring-1 focus:ring-monad-500/20
            ${showToggle ? 'pr-11' : ''}`}
        />
        {showToggle && (
          <button type="button" onClick={() => setVisible(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            tabIndex={-1}
          >
            {visible
              ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

// -- Brand panel --------------------------------------------------------------
function BrandPanel() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-12">
      {/* New logo with glow */}
      <div className="relative mb-8" style={{ filter: 'drop-shadow(0 0 32px rgba(131,110,249,0.55))' }}>
        <BoltyLogo size={120} />
      </div>

      <h2 className="text-3xl font-black tracking-tight text-white mb-4">Bolty</h2>
      <p className="text-zinc-400 text-base leading-relaxed max-w-sm mb-10">
        The developer platform for publishing AI agents, monetizing code, and connecting with a global community.
      </p>

      <div className="space-y-3 w-full max-w-xs">
        {[
          'Publish repos and AI agents',
          'Earn ETH from locked content',
          'Chat with developers globally',
          'Built-in AI assistant',
        ].map(text => (
          <div key={text} className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="text-monad-400 text-xs">&#9656;</span>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Main ---------------------------------------------------------------------
export default function AuthPage() {
  const { isAuthenticated, isLoading: authLoading, refresh } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset-sent'>('login');

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state - step 1
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Register state - step 2
  const [regGender, setRegGender] = useState('');
  const [regOccupation, setRegOccupation] = useState('');
  const [regWhatDoYouDo, setRegWhatDoYouDo] = useState('');

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

  const clearMessages = () => { setError(''); setSuccess(''); };
  const resetTwoFactor = () => { setTwoFactorPending(false); setTempToken(''); setTwoFactorCode(''); };
  const anyLoading = loading !== null;

  // -- Handlers ---------------------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!loginIdentifier || !loginPassword) { setError('Please fill in all fields'); return; }
    setLoading('email');
    try {
      const result = await api.post<{ twoFactorRequired?: boolean; tempToken?: string }>(
        '/auth/login/email', { identifier: loginIdentifier, password: loginPassword }
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
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Cannot connect to server');
      } else {
        setError('Invalid credentials');
      }
    } finally { setLoading(null); }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (twoFactorCode.length !== 6) { setError('Enter the 6-digit code from your email'); return; }
    setLoading('2fa');
    try {
      await api.post('/auth/2fa/verify', { tempToken, code: twoFactorCode });
      await refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid or expired code.');
    } finally { setLoading(null); }
  };

  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!regEmail || !regUsername || !regPassword) { setError('Please fill in all fields'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match'); return; }
    if (passwordStrength(regPassword) < 3) {
      setError('Password is too weak. Meet all requirements below.');
      return;
    }
    setRegStep(2);
  };

  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!regGender) { setError('Please select your gender'); return; }
    setLoading('email');
    try {
      await api.post('/auth/register', {
        email: regEmail,
        username: regUsername,
        password: regPassword,
        gender: regGender,
        occupation: regOccupation,
      });
      await refresh();
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Cannot connect to server');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally { setLoading(null); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!forgotIdentifier) { setError('Please enter your email or username'); return; }
    setLoading('forgot');
    try {
      await api.post('/auth/password/forgot', { identifier: forgotIdentifier });
      setTab('reset-sent');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Cannot connect to server');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally { setLoading(null); }
  };

  // -- Loading spinner --------------------------------------------------------

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-monad-400 animate-spin" />
      </div>
    );
  }

  // -- Heading helpers --------------------------------------------------------

  const getHeading = () => {
    if (twoFactorPending) return 'Two-factor verification';
    if (tab === 'login') return 'Sign in to Bolty';
    if (tab === 'register') return regStep === 1 ? 'Create your account' : 'Tell us about yourself';
    if (tab === 'forgot') return 'Reset your password';
    return 'Check your email';
  };

  const getSubheading = () => {
    if (twoFactorPending) return 'Enter the code we sent to your email';
    if (tab === 'login') {
      return (
        <>
          {"Don't have an account? "}
          <button onClick={() => { setTab('register'); setRegStep(1); clearMessages(); }}
            className="text-monad-400 hover:text-monad-300 font-medium transition-colors">Sign up</button>
        </>
      );
    }
    if (tab === 'register') {
      if (regStep === 1) {
        return (
          <>
            {'Already have an account? '}
            <button onClick={() => { setTab('login'); clearMessages(); }}
              className="text-monad-400 hover:text-monad-300 font-medium transition-colors">Sign in</button>
          </>
        );
      }
      return 'Step 2 of 2 - Optional profile details';
    }
    if (tab === 'forgot') {
      return (
        <>
          {'Remember it? '}
          <button onClick={() => { setTab('login'); clearMessages(); }}
            className="text-monad-400 hover:text-monad-300 font-medium transition-colors">Sign in</button>
        </>
      );
    }
    return 'We sent a password reset link to your inbox.';
  };

  // -- Render -----------------------------------------------------------------

  return (
    <div className="min-h-screen flex relative overflow-hidden">

      {/* -- Full-page wave background --------------------------------------- */}
      <Waves
        strokeColor="rgba(131,110,249,0.75)"
        backgroundColor="transparent"
        opacity={0.32}
        pointerSize={0}
      />

      {/* -- Left side: Form ------------------------------------------------- */}
      <div className="w-full lg:w-[55%] flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <BoltyLogo size={32} />
            <span className="font-bold text-lg text-white">Bolty</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              {getHeading()}
            </h1>
            <p className="text-sm text-zinc-500">
              {getSubheading()}
            </p>
          </div>

          {/* Error / success messages */}
          {error && (
            <div className="flex gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0L21.303 16.126zM12 15.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* -- 2FA step ---------------------------------------------------- */}
          {twoFactorPending && (
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Verification code</label>
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={twoFactorCode}
                  onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" autoComplete="one-time-code"
                  className="w-full rounded-xl px-4 py-3 bg-zinc-900/70 border border-zinc-800 text-white
                             text-center text-2xl font-mono tracking-[0.5em] outline-none
                             focus:border-monad-500/60 transition-all placeholder:text-zinc-700 placeholder:tracking-normal"
                />
              </div>
              <button type="submit" disabled={loading === '2fa' || twoFactorCode.length !== 6}
                className="w-full py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {loading === '2fa'
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Verifying...</span>
                  : 'Verify and sign in'}
              </button>
              <button type="button" onClick={() => { resetTwoFactor(); clearMessages(); }}
                className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1">
                Back to sign in
              </button>
            </form>
          )}

          {/* -- Login form -------------------------------------------------- */}
          {!twoFactorPending && tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email or username" type="text" value={loginIdentifier} onChange={setLoginIdentifier}
                placeholder="you@email.com or your_username" autoComplete="username" />
              <div>
                <Field label="Password" type="password" value={loginPassword} onChange={setLoginPassword}
                  placeholder="Your password" autoComplete="current-password" showToggle />
                <div className="mt-1.5 text-right">
                  <button type="button" onClick={() => { setTab('forgot'); clearMessages(); }}
                    className="text-xs text-zinc-500 hover:text-monad-400 transition-colors">
                    Forgot your password?
                  </button>
                </div>
              </div>
              <button type="submit" disabled={anyLoading}
                className="w-full py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-1">
                {loading === 'email'
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in...</span>
                  : 'Sign in'}
              </button>
            </form>
          )}

          {/* -- Forgot password form ---------------------------------------- */}
          {!twoFactorPending && tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Field label="Email or username" type="text" value={forgotIdentifier} onChange={setForgotIdentifier}
                placeholder="you@email.com or your_username" autoComplete="username" />
              <button type="submit" disabled={loading === 'forgot'}
                className="w-full py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {loading === 'forgot'
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending...</span>
                  : 'Send reset link'}
              </button>
            </form>
          )}

          {/* -- Reset sent confirmation ------------------------------------- */}
          {!twoFactorPending && tab === 'reset-sent' && (
            <div className="space-y-4">
              <div className="flex gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-4">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-green-400 text-sm font-medium">Reset link sent</p>
                  <p className="text-zinc-400 text-xs mt-0.5">If an account with that email exists, you will receive a link within a few minutes. Check your spam folder too.</p>
                </div>
              </div>
              <button type="button" onClick={() => { setTab('login'); clearMessages(); setForgotIdentifier(''); }}
                className="w-full py-3 rounded-xl btn-primary">
                Back to sign in
              </button>
            </div>
          )}

          {/* -- Register form: Step 1 --------------------------------------- */}
          {!twoFactorPending && tab === 'register' && regStep === 1 && (
            <form onSubmit={handleRegisterStep1} className="space-y-4">
              <Field label="Email" type="email" value={regEmail} onChange={setRegEmail}
                placeholder="you@email.com" autoComplete="email" />
              <Field label="Username" type="text" value={regUsername}
                onChange={v => setRegUsername(v.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="your_username" autoComplete="username" />
              <div>
                <Field label="Password" type="password" value={regPassword} onChange={setRegPassword}
                  placeholder="Create a strong password" autoComplete="new-password" showToggle />
                <PasswordStrengthMeter password={regPassword} />
              </div>
              <Field label="Confirm password" type="password" value={regConfirm} onChange={setRegConfirm}
                placeholder="Repeat your password" autoComplete="new-password" showToggle />
              <button type="submit" disabled={anyLoading}
                className="w-full py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-1">
                Continue
              </button>
            </form>
          )}

          {/* -- Register form: Step 2 --------------------------------------- */}
          {!twoFactorPending && tab === 'register' && regStep === 2 && (
            <form onSubmit={handleRegisterStep2} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Gender</label>
                <select
                  value={regGender}
                  onChange={e => setRegGender(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all
                    bg-zinc-900/70 border border-zinc-800 text-white
                    focus:border-monad-500/60 focus:bg-zinc-900 focus:ring-1 focus:ring-monad-500/20
                    appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              <Field label="Occupation" type="text" value={regOccupation} onChange={setRegOccupation}
                placeholder="Your occupation" />
              <Field label="What do you do?" type="text" value={regWhatDoYouDo} onChange={setRegWhatDoYouDo}
                placeholder="e.g. Full-stack developer, Student, Designer..." />
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => { setRegStep(1); clearMessages(); }}
                  className="flex-1 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-300
                             hover:bg-zinc-800/70 hover:border-zinc-700 transition-all">
                  Back
                </button>
                <button type="submit" disabled={anyLoading}
                  className="flex-1 py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading === 'email'
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating account...</span>
                    : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {/* Trust badges */}
          {!twoFactorPending && (
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-zinc-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                End-to-end encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                OWASP compliant
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                2FA supported
              </span>
            </div>
          )}
        </div>
      </div>

      {/* -- Right side: Brand panel ----------------------------------------- */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center z-10">
        {/* Background rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ border: '1px solid rgba(131,110,249,0.1)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ border: '1px solid rgba(131,110,249,0.08)' }} />
        <BrandPanel />
      </div>
    </div>
  );
}
