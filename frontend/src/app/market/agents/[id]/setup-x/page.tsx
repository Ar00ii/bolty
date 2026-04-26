'use client';

import { BookOpen, CheckCircle2, ExternalLink, KeyRound, Loader2, Twitter } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

type Status =
  | { configured: false; connected: false; authMethod: null }
  | {
      configured: true;
      connected: false;
      authMethod: null;
    }
  | {
      configured: true;
      connected: true;
      authMethod: 'oauth1' | 'oauth2';
      screenName: string;
      postsLast24h: number;
      dailyCap: number;
      connectedAt: string | null;
    };

export default function SetupXPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SetupXContent />
    </Suspense>
  );
}

function SetupXContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const listingId = params.id;
  const justConnected = search.get('agent_x_connected');
  const oauthError = search.get('agent_x_error');

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accessTokenSecret, setAccessTokenSecret] = useState('');
  const [linking, setLinking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await api.get<Status>(`/social/agent-x/${listingId}/status`);
      setStatus(s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load X status');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth?redirect=${encodeURIComponent(`/market/agents/${listingId}/setup-x`)}`);
      return;
    }
    void refresh();
  }, [isAuthenticated, isLoading, listingId, refresh, router]);

  const link = useCallback(async () => {
    setError(null);
    if (
      !consumerKey.trim() ||
      !consumerSecret.trim() ||
      !accessToken.trim() ||
      !accessTokenSecret.trim()
    ) {
      setError('All four keys are required.');
      return;
    }
    setLinking(true);
    try {
      await api.post<{ ok: true; screenName: string }>(
        `/social/agent-x/${listingId}/setup-oauth1`,
        {
          consumerKey: consumerKey.trim(),
          consumerSecret: consumerSecret.trim(),
          accessToken: accessToken.trim(),
          accessTokenSecret: accessTokenSecret.trim(),
        },
      );
      // Wipe secrets from FE state — they live encrypted on the
      // backend now, no reason to keep them in memory.
      setConsumerKey('');
      setConsumerSecret('');
      setAccessToken('');
      setAccessTokenSecret('');
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not link X account');
    } finally {
      setLinking(false);
    }
  }, [consumerKey, consumerSecret, accessToken, accessTokenSecret, listingId, refresh]);

  const disconnect = useCallback(async () => {
    if (!confirm('Disconnect X from this agent? You will need to re-link to publish to the marketplace.')) return;
    try {
      await api.delete(`/social/agent-x/${listingId}`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect');
    }
  }, [listingId, refresh]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading X setup…
      </div>
    );
  }

  return (
    <div className="mk-app-page mx-auto max-w-3xl px-5 py-10">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
              <Twitter className="w-3.5 h-3.5" />
              <span>X account setup — required</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-white">
              Link this agent&apos;s X account
            </h1>
            <p className="text-[13px] text-zinc-500 font-light mt-2 max-w-xl">
              Generate 4 keys on developer.x.com, paste them here, click Link.
              Done. No OAuth dance, no callback URLs to register, works on X
              Free tier.
            </p>
          </div>
          <Link
            href="/docs/launchpad/agent-x-setup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-light text-white transition hover:brightness-110 shrink-0"
            style={{
              background: 'linear-gradient(180deg, rgba(131,110,249,0.55) 0%, rgba(131,110,249,0.4) 100%)',
              boxShadow:
                '0 0 0 1px rgba(131,110,249,0.5), 0 0 24px -8px rgba(131,110,249,0.7)',
            }}
          >
            <BookOpen className="w-4 h-4" strokeWidth={1.75} />
            Step-by-step guide
          </Link>
        </div>
      </header>

      {oauthError && (
        <div
          className="mb-4 rounded-lg p-3 text-[12px] text-rose-300"
          style={{
            background: 'rgba(239,68,68,0.06)',
            boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.25)',
          }}
        >
          {oauthError}
        </div>
      )}

      {status?.connected && (
        <div
          className="mb-5 rounded-xl p-4"
          style={{
            background: 'rgba(34,197,94,0.06)',
            boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.25)',
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-[13px] text-emerald-200 font-light flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Linked as{' '}
              <a
                href={`https://x.com/${status.screenName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline decoration-dotted underline-offset-2 hover:text-[#86efac]"
              >
                @{status.screenName}
              </a>
              <span className="text-emerald-400/70 font-mono text-[11px]">
                · {status.postsLast24h}/{status.dailyCap} posts in 24h
                {status.authMethod ? ` · ${status.authMethod}` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={disconnect}
              className="text-[11.5px] text-rose-400 hover:text-rose-200"
            >
              Disconnect
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-emerald-200/70 font-light">
            {justConnected
              ? `Done. Your listing is now live in the marketplace.`
              : `Your listing is live in the marketplace and the launch wizard auto-tweet will fire from this account.`}
          </p>
        </div>
      )}

      {/* Step 1 — where to find the keys */}
      <Section
        index="01"
        title="Get your 4 keys from developer.x.com"
        subtitle="Free tier works. ~3 minutes one-time setup."
      >
        <ol className="text-[12.5px] text-zinc-300 font-light leading-relaxed space-y-1.5 list-decimal pl-5">
          <li>
            Go to{' '}
            <a
              href="https://developer.x.com/en/portal/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b4a7ff] hover:text-white underline decoration-dotted underline-offset-2"
            >
              developer.x.com
            </a>{' '}
            → your Project → your App.
          </li>
          <li>
            Open <strong>User authentication settings</strong> → set{' '}
            <strong>App permissions: Read and write</strong> → save.{' '}
            <span className="text-zinc-500">(Required, otherwise X returns 403 on every tweet.)</span>
          </li>
          <li>
            Open <strong>Keys and Tokens</strong> tab.
          </li>
          <li>
            Under <strong>Consumer Keys</strong> → <em>API Key and Secret</em> → click{' '}
            <strong>Regenerate</strong>. Copy <strong>API Key</strong> and{' '}
            <strong>API Key Secret</strong>.
          </li>
          <li>
            Under <strong>Authentication Tokens</strong> →{' '}
            <em>Access Token and Secret</em> → click <strong>Generate</strong>{' '}
            (or Regenerate). Make sure the screen says &quot;Created with{' '}
            <strong>Read and Write</strong> permissions&quot; — if it says
            Read only, fix step 2 first then regenerate. Copy{' '}
            <strong>Access Token</strong> and <strong>Access Token Secret</strong>.
          </li>
          <li>
            Paste all 4 below.
          </li>
        </ol>
      </Section>

      {/* Step 2 — paste + link */}
      <Section index="02" title="Paste the 4 keys" subtitle="They are encrypted before they touch our database.">
        <div className="grid grid-cols-1 gap-3">
          <Field label="API Key (Consumer Key)">
            <input
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value.trim().slice(0, 200))}
              placeholder="From Consumer Keys → API Key"
              className="input-std font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="API Key Secret (Consumer Secret)">
            <input
              type="password"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value.trim().slice(0, 200))}
              placeholder="From Consumer Keys → API Key Secret"
              className="input-std font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Access Token">
            <input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value.trim().slice(0, 200))}
              placeholder="From Authentication Tokens → Access Token"
              className="input-std font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Access Token Secret">
            <input
              type="password"
              value={accessTokenSecret}
              onChange={(e) => setAccessTokenSecret(e.target.value.trim().slice(0, 200))}
              placeholder="From Authentication Tokens → Access Token Secret"
              className="input-std font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={link}
            disabled={
              linking ||
              !consumerKey.trim() ||
              !consumerSecret.trim() ||
              !accessToken.trim() ||
              !accessTokenSecret.trim()
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-light text-white transition disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg, rgba(131,110,249,0.55) 0%, rgba(131,110,249,0.4) 100%)',
              boxShadow: '0 0 0 1px rgba(131,110,249,0.5), 0 0 20px -8px rgba(131,110,249,0.6)',
            }}
          >
            {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
            {status?.connected ? 'Re-link X account' : 'Link X account'}
          </button>
          <p className="text-[11px] text-zinc-500 font-light">
            We verify the keys against X before saving. If anything is wrong
            you&apos;ll see the exact error from X.
          </p>
        </div>
      </Section>

      {error && (
        <div className="mt-4 rounded-lg p-3 text-[12px] text-rose-300"
          style={{
            background: 'rgba(239,68,68,0.06)',
            boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.25)',
          }}
        >
          {error}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
        <Link
          href={`/market/agents/${listingId}`}
          className="text-[12px] text-zinc-400 hover:text-white inline-flex items-center gap-1.5"
        >
          <ExternalLink className="w-3 h-3" /> View listing
        </Link>
        <Link
          href="/docs/launchpad/agent-x"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-[#b4a7ff] hover:text-white underline decoration-dotted underline-offset-2"
        >
          Read the BYO X setup docs →
        </Link>
      </div>

      <style jsx>{`
        .input-std {
          width: 100%;
          border-radius: 0.6rem;
          background: rgba(0, 0, 0, 0.4);
          padding: 0.55rem 0.75rem;
          font-size: 12.5px;
          font-weight: 300;
          color: white;
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
          transition: box-shadow 0.15s;
        }
        .input-std:focus {
          box-shadow: inset 0 0 0 1px rgba(131, 110, 249, 0.5);
        }
      `}</style>
    </div>
  );
}

function Section({
  index,
  title,
  subtitle,
  children,
}: {
  index: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl p-5 mb-3"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.65), rgba(10,10,14,0.65))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-mono"
          style={{
            background: 'rgba(131,110,249,0.14)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
            color: '#C9BEFF',
          }}
        >
          {index}
        </span>
        <div>
          <h2 className="text-sm font-normal text-white">{title}</h2>
          <p className="text-[11.5px] font-light text-white/50 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-[0.16em] text-zinc-500 font-medium">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
