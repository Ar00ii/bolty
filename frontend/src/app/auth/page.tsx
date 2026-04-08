'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';
import { Waves } from '@/components/ui/wave-background';
import { BoltyLogo } from '@/components/ui/BoltyLogo';
import {
  Shield,
  Lock,
  CheckCircle,
  Code2,
  Bot,
  Coins,
  MessageSquare,
  Users,
  Star,
  Zap,
  AlertTriangle,
} from 'lucide-react';

// -- Error mapping ------------------------------------------------------------
function mapError(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Cannot connect to server. Please try again.';
  }
  if (err instanceof ApiError) {
    const msg = err.message?.toLowerCase() ?? '';
    if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong') || msg.includes('credentials') || msg.includes('unauthorized')) {
      return 'Incorrect login or password.';
    }
    if (msg.includes('email') && (msg.includes('exist') || msg.includes('taken') || msg.includes('use') || msg.includes('registered'))) {
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
    // Return the original message if it's clean enough
    if (err.message && err.message.length < 120) return err.message;
  }
  return 'Something went wrong. Please try again.';
}

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
function Field({ label, type, value, onChange, placeholder, autoComplete, showToggle, hint }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; showToggle?: boolean; hint?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const inputType = showToggle ? (visible ? 'text' : 'password') : type;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium text-zinc-400">{label}</label>
        {hint && <span className="text-xs text-zinc-600">{hint}</span>}
      </div>
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

// -- Brand panel (compact, for card left side) --------------------------------
const BRAND_STATS = [
  { value: '1,200+', label: 'Developers', icon: Users },
  { value: '3,400+', label: 'Repos', icon: Code2 },
  { value: '240+', label: 'AI Agents', icon: Bot },
  { value: '18.4 ETH', label: 'Earned', icon: Coins },
];

const BRAND_FEATURES = [
  { icon: Code2, title: 'Publish & monetize repos', desc: 'Earn ETH from your locked repositories.' },
  { icon: Bot, title: 'Deploy AI agents', desc: 'List tools and bots on the marketplace.' },
  { icon: MessageSquare, title: 'Global dev community', desc: 'Real-time chat with devs worldwide.' },
  { icon: Zap, title: 'Built-in AI assistant', desc: 'Instant code help without leaving.' },
];

const BRAND_TESTIMONIAL = {
  text: 'Published my first locked repo on Bolty and earned 0.12 ETH in the first week.',
  name: 'Alex R.',
  role: 'Senior Dev',
};

function BrandPanel() {
  return (
    <div className="flex flex-col px-8 py-10 h-full justify-center">
      {/* Logo + title */}
      <div className="flex flex-col items-center text-center mb-6">
        <div style={{ filter: 'drop-shadow(0 0 28px rgba(131,110,249,0.7))' }} className="mb-4">
          <BoltyLogo size={140} />
        </div>
        <div className="text-xs text-zinc-500">The developer platform</div>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed mb-6 text-center">
        Publish AI agents, monetize code, and connect with a global community.
      </p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {BRAND_STATS.map(s => (
          <div key={s.label} className="border border-white/[0.06] rounded-xl p-2.5 text-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-center mb-0.5">
              <s.icon className="w-3 h-3 text-monad-400" strokeWidth={1.5} />
            </div>
            <div className="text-sm font-light text-monad-400 leading-none mb-0.5">{s.value}</div>
            <div className="text-[10px] text-zinc-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature list */}
      <div className="space-y-2 mb-6">
        {BRAND_FEATURES.map(f => (
          <div key={f.title} className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(131,110,249,0.12)' }}>
              <f.icon className="w-3 h-3 text-monad-400" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[11px] font-light text-zinc-300">{f.title}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div className="border border-white/[0.06] rounded-xl p-3"
        style={{ background: 'rgba(131,110,249,0.04)' }}>
        <div className="flex gap-0.5 mb-1.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-2.5 h-2.5 text-monad-400 fill-monad-400" />
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed mb-2">&ldquo;{BRAND_TESTIMONIAL.text}&rdquo;</p>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-light text-monad-400 flex-shrink-0"
            style={{ background: 'rgba(131,110,249,0.15)' }}>
            {BRAND_TESTIMONIAL.name.charAt(0)}
          </div>
          <span className="text-[10px] font-medium text-zinc-300">{BRAND_TESTIMONIAL.name}</span>
          <span className="text-[10px] text-zinc-600">{BRAND_TESTIMONIAL.role}</span>
          <CheckCircle className="w-3 h-3 text-monad-400/50 ml-auto" strokeWidth={1.5} />
        </div>
      </div>

      {/* Security badges */}
      <div className="flex flex-col gap-1.5 mt-5">
        {[
          { icon: Lock, label: 'End-to-end encrypted' },
          { icon: Shield, label: 'OWASP compliant' },
          { icon: CheckCircle, label: '2FA supported' },
        ].map(b => (
          <span key={b.label} className="flex items-center gap-1.5 text-[10px] text-zinc-600">
            <b.icon className="w-3 h-3" strokeWidth={2} />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// -- Progress steps (register) ------------------------------------------------
function RegisterProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {[1, 2].map(s => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-light transition-all ${
              s < step
                ? 'bg-monad-500 text-white'
                : s === step
                  ? 'border-2 border-monad-500 text-monad-400'
                  : 'border border-zinc-700 text-zinc-600'
            }`}>
              {s < step
                ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                : s
              }
            </div>
            <span className={`text-xs ${s === step ? 'text-zinc-300 font-medium' : 'text-zinc-600'}`}>
              {s === 1 ? 'Account' : 'Profile'}
            </span>
          </div>
          {s < 2 && <div className={`flex-1 h-px transition-all ${s < step ? 'bg-monad-500' : 'bg-zinc-800'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// -- Error / success banners --------------------------------------------------
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-3.5 py-3 mb-4">
      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-red-400 text-sm leading-snug">{message}</p>
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl px-3.5 py-3 mb-4">
      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-green-400 text-sm leading-snug">{message}</p>
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
    if (!loginIdentifier.trim()) { setError('Please enter your email or username.'); return; }
    if (!loginPassword) { setError('Please enter your password.'); return; }
    setLoading('email');
    try {
      const result = await api.post<{ twoFactorRequired?: boolean; tempToken?: string }>(
        '/auth/login/email', { identifier: loginIdentifier.trim(), password: loginPassword }
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
    } finally { setLoading(null); }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (twoFactorCode.length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading('2fa');
    try {
      await api.post('/auth/2fa/verify', { tempToken, code: twoFactorCode });
      await refresh();
      router.push('/');
    } catch (err) {
      setError(mapError(err));
    } finally { setLoading(null); }
  };

  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!regEmail.trim()) { setError('Please enter your email address.'); return; }
    if (!regUsername.trim()) { setError('Please choose a username.'); return; }
    if (!regPassword) { setError('Please create a password.'); return; }
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    if (passwordStrength(regPassword) < 3) {
      setError('Password is too weak. Please meet all requirements shown below.');
      return;
    }
    setRegStep(2);
  };

  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!regGender) { setError('Please select your gender.'); return; }
    setLoading('email');
    try {
      await api.post('/auth/register', {
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
        gender: regGender,
        occupation: regOccupation,
      });
      await refresh();
      router.push('/');
    } catch (err) {
      setError(mapError(err));
    } finally { setLoading(null); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!forgotIdentifier.trim()) { setError('Please enter your email or username.'); return; }
    setLoading('forgot');
    try {
      await api.post('/auth/password/forgot', { identifier: forgotIdentifier.trim() });
      setTab('reset-sent');
    } catch (err) {
      setError(mapError(err));
    } finally { setLoading(null); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-monad-400 animate-spin" />
      </div>
    );
  }

  // -- Render -----------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">

      {/* Full-page wave background */}
      <Waves
        strokeColor="rgba(131,110,249,0.75)"
        backgroundColor="transparent"
        opacity={0.32}
        pointerSize={0}
      />

      {/* Centered card */}
      <div className="relative z-10 w-full max-w-4xl flex rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(9,9,11,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 0 0 1px rgba(131,110,249,0.06), 0 32px 80px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(24px)',
        }}>

        {/* Left: Brand panel */}
        <div className="hidden lg:flex lg:w-[42%] flex-col relative"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(131,110,249,0.03)' }}>
          {/* Decorative rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full pointer-events-none"
            style={{ border: '1px solid rgba(131,110,249,0.07)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ border: '1px solid rgba(131,110,249,0.03)' }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(131,110,249,0.05) 0%, transparent 65%)' }} />
          <div className="relative z-10 h-full overflow-y-auto">
            <BrandPanel />
          </div>
        </div>

        {/* Right: Form panel */}
        <div className="flex-1 flex flex-col px-8 py-10 overflow-y-auto" style={{ minWidth: 0 }}>

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-7 lg:hidden">
            <BoltyLogo size={56} />
            <span className="text-sm font-light text-zinc-300">Bolty</span>
          </div>

          {/* Tab switcher */}
          {!twoFactorPending && tab !== 'forgot' && tab !== 'reset-sent' && (
            <div className="flex gap-1 mb-6 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
              {(['login', 'register'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); if (t === 'register') setRegStep(1); clearMessages(); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    tab === t
                      ? 'bg-monad-500/20 text-monad-300 border border-monad-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {t === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          {/* Heading */}
          <div className="mb-5">
            <h1 className="text-xl font-light text-white tracking-tight mb-1">
              {twoFactorPending ? 'Two-factor verification'
                : tab === 'login' ? 'Sign in to Bolty'
                : tab === 'register' ? (regStep === 1 ? 'Create your account' : 'Tell us about yourself')
                : tab === 'forgot' ? 'Reset your password'
                : 'Check your email'}
            </h1>
            <p className="text-sm text-zinc-500">
              {twoFactorPending ? 'Enter the 6-digit code sent to your email.'
                : tab === 'login' ? (
                  <span>
                    {"Don't have an account? "}
                    <button onClick={() => { setTab('register'); setRegStep(1); clearMessages(); }}
                      className="text-monad-400 hover:text-monad-300 font-medium transition-colors">Sign up</button>
                  </span>
                )
                : tab === 'register' && regStep === 1 ? (
                  <span>
                    {'Already have an account? '}
                    <button onClick={() => { setTab('login'); clearMessages(); }}
                      className="text-monad-400 hover:text-monad-300 font-medium transition-colors">Sign in</button>
                  </span>
                )
                : tab === 'register' && regStep === 2 ? 'Step 2 of 2 — Optional profile details'
                : tab === 'forgot' ? (
                  <span>
                    {'Remember it? '}
                    <button onClick={() => { setTab('login'); clearMessages(); }}
                      className="text-monad-400 hover:text-monad-300 font-medium transition-colors">Sign in</button>
                  </span>
                )
                : 'We sent a password reset link to your inbox.'}
            </p>
          </div>

          {/* Register step progress */}
          {!twoFactorPending && tab === 'register' && (
            <RegisterProgress step={regStep} />
          )}

          {/* Error / success banners */}
          {error && <ErrorBanner message={error} />}
          {success && <SuccessBanner message={success} />}

          {/* -- 2FA step ---------------------------------------------------- */}
          {twoFactorPending && (
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div className="rounded-xl border border-monad-500/20 p-4"
                style={{ background: 'rgba(131,110,249,0.05)' }}>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Two-factor authentication is enabled on this account. We sent a 6-digit code to your email.
                  It expires in 10 minutes.
                </p>
              </div>
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
                <p className="text-xs text-zinc-600 mt-1.5 text-center">Enter the 6-digit code from your inbox</p>
              </div>
              <button type="submit" disabled={loading === '2fa' || twoFactorCode.length !== 6}
                className="w-full py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {loading === '2fa'
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Verifying...</span>
                  : 'Verify and sign in'}
              </button>
              <button type="button" onClick={() => { resetTwoFactor(); clearMessages(); }}
                className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1">
                ← Back to sign in
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
                className="w-full py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {loading === 'email'
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in...</span>
                  : 'Sign in'}
              </button>
            </form>
          )}

          {/* -- Forgot password form ---------------------------------------- */}
          {!twoFactorPending && tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] p-4"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Enter your email or username and we&apos;ll send you a link to reset your password.
                  The link expires in 30 minutes.
                </p>
              </div>
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
                placeholder="you@email.com" autoComplete="email" hint="We'll never share your email" />
              <Field label="Username" type="text" value={regUsername}
                onChange={v => setRegUsername(v.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="your_username" autoComplete="username" hint="Letters, numbers, _ and -" />
              <div>
                <Field label="Password" type="password" value={regPassword} onChange={setRegPassword}
                  placeholder="Create a strong password" autoComplete="new-password" showToggle />
                <PasswordStrengthMeter password={regPassword} />
              </div>
              <Field label="Confirm password" type="password" value={regConfirm} onChange={setRegConfirm}
                placeholder="Repeat your password" autoComplete="new-password" showToggle />
              <button type="submit" disabled={anyLoading}
                className="w-full py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                Continue to step 2 →
              </button>
              <p className="text-[11px] text-center text-zinc-700">
                You can link your GitHub account after signing up.
              </p>
            </form>
          )}

          {/* -- Register form: Step 2 --------------------------------------- */}
          {!twoFactorPending && tab === 'register' && regStep === 2 && (
            <form onSubmit={handleRegisterStep2} className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] p-4"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Help us personalize your experience. Gender is required; everything else is optional.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Gender <span className="text-red-500">*</span></label>
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
                placeholder="e.g. Software Engineer, Student, Freelancer..." hint="Optional" />

              <div className="rounded-xl border border-monad-500/15 p-4"
                style={{ background: 'rgba(131,110,249,0.04)' }}>
                <p className="text-xs font-medium text-monad-400 mb-2">You&apos;re about to unlock:</p>
                <div className="space-y-1.5">
                  {[
                    'Publish and monetize code repos',
                    'Deploy AI agents to the marketplace',
                    'Join the global developer community',
                    'Link your GitHub account',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                      <CheckCircle className="w-3 h-3 text-monad-400 flex-shrink-0" strokeWidth={2} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setRegStep(1); clearMessages(); }}
                  className="flex-1 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-300
                             hover:bg-zinc-800/70 hover:border-zinc-700 transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={anyLoading}
                  className="flex-1 py-3 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading === 'email'
                    ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating...</span>
                    : 'Create account'}
                </button>
              </div>

              <p className="text-xs text-center text-zinc-700">
                By creating an account you agree to our{' '}
                <span className="text-zinc-500 hover:text-monad-400 cursor-pointer transition-colors">Terms of Service</span>
                {' '}and{' '}
                <span className="text-zinc-500 hover:text-monad-400 cursor-pointer transition-colors">Privacy Policy</span>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
