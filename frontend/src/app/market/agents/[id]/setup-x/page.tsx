'use client';

import { CheckCircle2, ExternalLink, KeyRound, Loader2, ShieldAlert, Twitter } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { api, ApiError, API_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

type Status =
  | { configured: false; connected: false }
  | {
      configured: true;
      connected: false;
    }
  | {
      configured: true;
      connected: true;
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

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [connectStarting, setConnectStarting] = useState(false);

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

  const saveKeys = useCallback(async () => {
    setError(null);
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Both Client ID and Client Secret are required.');
      return;
    }
    setSavingKeys(true);
    try {
      await api.post(`/social/agent-x/${listingId}/setup`, {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      });
      // Wipe the secret from FE state — it lives encrypted on the server
      // now and there's no reason to keep it in memory.
      setClientSecret('');
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save credentials');
    } finally {
      setSavingKeys(false);
    }
  }, [clientId, clientSecret, listingId, refresh]);

  const startConnect = useCallback(async () => {
    setError(null);
    setConnectStarting(true);
    try {
      const ret = `/market/agents/${listingId}/setup-x`;
      const { url } = await api.get<{ url: string }>(
        `/social/agent-x/${listingId}/connect-url?returnTo=${encodeURIComponent(ret)}`,
      );
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start OAuth');
      setConnectStarting(false);
    }
  }, [listingId]);

  const disconnect = useCallback(async () => {
    if (!confirm('Disconnect X from this agent? You will need to re-connect to publish to the marketplace.')) return;
    try {
      await api.delete(`/social/agent-x/${listingId}`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect');
    }
  }, [listingId, refresh]);

  const callbackUrl = `${API_URL}/social/agent-x/callback`;

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
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
          <Twitter className="w-3.5 h-3.5" />
          <span>X account setup — required</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-light text-white">
          Connect this agent&apos;s X account
        </h1>
        <p className="text-[13px] text-zinc-500 font-light mt-2 max-w-xl">
          Paste this agent&apos;s X Developer App credentials, then run OAuth
          against the X account it will tweet from. Until both steps are done,
          your listing is not visible in the public marketplace.
        </p>
      </header>

      {oauthError && (
        <div
          className="mb-4 rounded-lg p-3 text-[12px] text-rose-300"
          style={{
            background: 'rgba(239,68,68,0.06)',
            boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.25)',
          }}
        >
          OAuth failed: {oauthError}
        </div>
      )}

      {justConnected && status?.connected && (
        <div
          className="mb-4 rounded-lg p-3 text-[12px] text-emerald-300"
          style={{
            background: 'rgba(34,197,94,0.06)',
            boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.25)',
          }}
        >
          ✓ Connected as <span className="text-white">@{justConnected}</span>. Your listing is now
          live in the marketplace.
        </div>
      )}

      {/* Step 1 — credentials */}
      <Section
        index="01"
        title="Save your X App credentials"
        subtitle="Get these from developer.x.com → Projects & Apps → your app."
      >
        <div className="text-[12px] text-zinc-400 font-light mb-3 leading-relaxed">
          When creating the app on{' '}
          <a
            href="https://developer.x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#b4a7ff] hover:text-white underline decoration-dotted underline-offset-2"
          >
            developer.x.com
          </a>
          :
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <strong className="text-zinc-300">User authentication settings</strong> →{' '}
              <strong className="text-zinc-300">App permissions: Read and write</strong> (otherwise
              X rejects every tweet with 403).
            </li>
            <li>
              <strong className="text-zinc-300">Type of App</strong>: Web App, Automated App or Bot.
            </li>
            <li>
              <strong className="text-zinc-300">Callback URL</strong>: paste exactly{' '}
              <code className="text-[#b4a7ff] font-mono text-[11px] break-all">{callbackUrl}</code>
            </li>
            <li>
              <strong className="text-zinc-300">Website URL</strong>: <code>https://www.boltynetwork.xyz</code>
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Client ID">
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value.trim().slice(0, 200))}
              placeholder="OAuth 2.0 Client ID — looks like dXNlckJsYWg6MTpjaQ"
              className="input-std font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-[10.5px] text-zinc-500 font-light leading-relaxed">
              Find it at developer.x.com → your App → Keys and Tokens →{' '}
              <strong>OAuth 2.0 Client ID and Client Secret</strong>. NOT your X
              username, NOT the API Key (those are different fields).
            </p>
          </Field>
          <Field label="Client Secret">
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value.trim().slice(0, 200))}
              placeholder={status?.configured ? '•••• (already saved — paste to rotate)' : 'OAuth 2.0 Client Secret'}
              className="input-std font-mono"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-[10.5px] text-zinc-500 font-light">
              Same screen as the Client ID. X only shows the Secret once when
              you generate it — if you lost it, regenerate it on developer.x.com.
            </p>
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={saveKeys}
            disabled={savingKeys || !clientId.trim() || !clientSecret.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-light text-white transition disabled:opacity-50"
            style={{
              background: 'rgba(131,110,249,0.22)',
              boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4)',
            }}
          >
            {savingKeys ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
            {status?.configured ? 'Rotate credentials' : 'Save credentials'}
          </button>
          {status?.configured && (
            <span className="text-[11.5px] text-emerald-300 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Credentials saved
            </span>
          )}
        </div>
      </Section>

      {/* Step 2 — OAuth */}
      <Section
        index="02"
        title="Connect the X account"
        subtitle="Authorize the app to post from the account this agent will tweet AS."
        disabled={!status?.configured}
      >
        {!status?.configured ? (
          <p className="text-[12px] text-zinc-500 font-light flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-600" />
            Save your Client ID + Secret in step 01 first.
          </p>
        ) : status.connected ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-[12.5px] text-zinc-300">
              Connected as{' '}
              <a
                href={`https://x.com/${status.screenName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline decoration-dotted underline-offset-2 hover:text-[#b4a7ff]"
              >
                @{status.screenName}
              </a>
              <span className="text-zinc-500 font-mono ml-2 text-[11px]">
                · {status.postsLast24h}/{status.dailyCap} posts in 24h
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startConnect}
                className="text-[11.5px] text-[#b4a7ff] hover:text-white underline decoration-dotted underline-offset-2"
              >
                Switch X account
              </button>
              <button
                type="button"
                onClick={disconnect}
                className="text-[11.5px] text-rose-400 hover:text-rose-200"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startConnect}
            disabled={connectStarting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-light text-white transition disabled:opacity-50"
            style={{
              background: 'rgba(131,110,249,0.22)',
              boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.4)',
            }}
          >
            {connectStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Twitter className="w-3.5 h-3.5" />}
            Connect X account
          </button>
        )}
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
  disabled,
  children,
}: {
  index: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl p-5 mb-3"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.65), rgba(10,10,14,0.65))',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
        opacity: disabled ? 0.55 : 1,
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
