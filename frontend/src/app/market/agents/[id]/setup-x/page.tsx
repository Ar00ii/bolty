'use client';

import {
  Bot,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  PlayCircle,
  Twitter,
  X as XIcon,
} from 'lucide-react';
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
  const justConnected = search?.get('agent_x_connected');
  const oauthError = search?.get('agent_x_error');

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
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              Link this agent&apos;s X account
            </h1>
            <p className="text-[13px] text-zinc-500 font-semibold mt-2 max-w-xl">
              Generate 4 keys on developer.x.com, paste them here, click Link.
              Done. No OAuth dance, no callback URLs to register, works on X
              Free tier.
            </p>
          </div>
          <Link
            href="/docs/agent-x/agent-x-setup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white transition hover:brightness-110 shrink-0"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 241, 149,0.55) 0%, rgba(20, 241, 149,0.4) 100%)',
              boxShadow:
                '0 0 0 1px rgba(20, 241, 149,0.5), 0 0 24px -8px rgba(20, 241, 149,0.7)',
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
            <div className="text-[13px] text-emerald-200 font-semibold flex items-center gap-2">
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
          <p className="mt-2 text-[11.5px] text-emerald-200/70 font-semibold">
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
        <ol className="text-[12.5px] text-zinc-300 font-semibold leading-relaxed space-y-1.5 list-decimal pl-5">
          <li>
            Go to{' '}
            <a
              href="https://developer.x.com/en/portal/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7DFFBF] hover:text-white underline decoration-dotted underline-offset-2"
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

      {/* Step 2 — paste + link. Labels MIRROR what X's portal calls them
          (Consumer Key, Secret Key, Access Token, Access Token Secret)
          so there is zero translation between the two screens. */}
      <Section index="02" title="Paste the 4 keys" subtitle="They are encrypted before they touch our database.">
        <div className="grid grid-cols-1 gap-3">
          <Field label="Consumer Key">
            <input
              value={consumerKey}
              onChange={(e) => setConsumerKey(e.target.value.trim().slice(0, 200))}
              placeholder="X portal → Consumer Keys → API Key (a.k.a. Consumer Key)"
              className="input-std font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Secret Key">
            <input
              type="password"
              value={consumerSecret}
              onChange={(e) => setConsumerSecret(e.target.value.trim().slice(0, 200))}
              placeholder="X portal → Consumer Keys → Secret Key (a.k.a. API Key Secret)"
              className="input-std font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Access Token">
            <input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value.trim().slice(0, 200))}
              placeholder="X portal → Authentication Tokens → Access Token"
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
              placeholder="X portal → Authentication Tokens → Access Token Secret"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 241, 149,0.55) 0%, rgba(20, 241, 149,0.4) 100%)',
              boxShadow: '0 0 0 1px rgba(20, 241, 149,0.5), 0 0 20px -8px rgba(20, 241, 149,0.6)',
            }}
          >
            {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
            {status?.connected ? 'Re-link X account' : 'Link X account'}
          </button>
          <p className="text-[11px] text-zinc-500 font-semibold">
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

      {/* Phase 2 — autonomous tweeting. Only renders once X is linked
          via OAuth 1.0a, the only auth path that can reliably post. */}
      {status?.connected && status.authMethod === 'oauth1' && (
        <AutonomousPanel listingId={listingId} />
      )}

      <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
        <Link
          href={`/market/agents/${listingId}`}
          className="text-[12px] text-zinc-400 hover:text-white inline-flex items-center gap-1.5"
        >
          <ExternalLink className="w-3 h-3" /> View listing
        </Link>
        <Link
          href="/docs/agent-x/agent-x"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-[#7DFFBF] hover:text-white underline decoration-dotted underline-offset-2"
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
          box-shadow: inset 0 0 0 1px rgba(20, 241, 149, 0.5);
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
            background: 'rgba(20, 241, 149,0.14)',
            boxShadow: 'inset 0 0 0 1px rgba(20, 241, 149,0.3)',
            color: '#C9BEFF',
          }}
        >
          {index}
        </span>
        <div>
          <h2 className="text-sm font-normal text-white">{title}</h2>
          <p className="text-[11.5px] font-semibold text-white/50 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/**
 * Phase 2 panel — autonomous tweet config + the approval queue.
 *
 * Two columns of UX:
 *  1. Toggles + interval slider that PATCH /social/agent-x/:listingId/autonomous
 *  2. Pending tweets list (when requireApproval=true) with Approve/Reject
 *
 * Purposefully kept as a sub-component of setup-x rather than its own
 * page so the seller flips on autonomy in the same place they paste
 * keys. Keeps the mental model "your agent's X account, all knobs in
 * one screen."
 */
function AutonomousPanel({ listingId }: { listingId: string }) {
  type Config = {
    autonomousEnabled: boolean;
    postIntervalHours: number;
    requireApproval: boolean;
    mentionsEnabled: boolean;
    lastAutonomousAt: string | null;
    mentionsLastSyncedAt: string | null;
  };
  type Queued = {
    id: string;
    text: string;
    reason: string | null;
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'POSTED' | 'FAILED';
    triggerType: 'SCHEDULED' | 'MENTION_REPLY' | 'MANUAL';
    inReplyToTweetId: string | null;
    createdAt: string;
    failureReason: string | null;
    tweetId: string | null;
  };

  const [config, setConfig] = useState<Config | null>(null);
  const [queue, setQueue] = useState<Queued[]>([]);
  const [busy, setBusy] = useState(false);
  const [decideBusy, setDecideBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decideMsg, setDecideMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [cfg, q] = await Promise.all([
        api.get<Config>(`/social/agent-x/${listingId}/autonomous`),
        api.get<Queued[]>(`/social/agent-x/${listingId}/queue`),
      ]);
      setConfig(cfg);
      setQueue(q);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'failed to load autonomous config');
    }
  }, [listingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const patch = useCallback(
    async (changes: Partial<Config>) => {
      if (!config) return;
      setBusy(true);
      setError(null);
      // Optimistic — flip locally so toggles feel instant, revert on error.
      const next = { ...config, ...changes };
      setConfig(next);
      try {
        await api.patch(`/social/agent-x/${listingId}/autonomous`, changes);
      } catch (err) {
        setConfig(config);
        setError(err instanceof ApiError ? err.message : 'update failed');
      } finally {
        setBusy(false);
      }
    },
    [config, listingId],
  );

  const approve = useCallback(
    async (postId: string) => {
      try {
        await api.post(`/social/agent-x/${listingId}/queue/${postId}/approve`, {});
        await refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'approve failed');
      }
    },
    [listingId, refresh],
  );

  const reject = useCallback(
    async (postId: string) => {
      try {
        await api.post(`/social/agent-x/${listingId}/queue/${postId}/reject`, {});
        await refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'reject failed');
      }
    },
    [listingId, refresh],
  );

  const decideNow = useCallback(async () => {
    setDecideBusy(true);
    setDecideMsg(null);
    setError(null);
    try {
      const res = await api.post<{ queued: boolean; postId?: string; reason?: string }>(
        `/social/agent-x/${listingId}/decide-now`,
        {},
      );
      if (res.queued) {
        setDecideMsg('Agent decided to tweet — proposal added to the queue.');
        await refresh();
      } else {
        setDecideMsg(`Agent declined: ${res.reason ?? 'no reason given'}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'decide-now failed');
    } finally {
      setDecideBusy(false);
    }
  }, [listingId, refresh]);

  if (!config) {
    return (
      <div className="mt-6 text-[12px] text-zinc-500 font-semibold">
        <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />
        Loading autonomous settings…
      </div>
    );
  }

  const pending = queue.filter((q) => q.status === 'PENDING_APPROVAL');
  const recent = queue.filter((q) => q.status !== 'PENDING_APPROVAL').slice(0, 5);

  return (
    <div className="mt-8 space-y-5">
      <Section
        index="03"
        title="Let the AI agent post on its own"
        subtitle="Cron asks your agent every N hours whether to tweet. Optional human approval before each post."
      >
        {error && (
          <div className="mb-3 rounded-lg p-2.5 text-[11.5px] text-rose-300 font-semibold"
            style={{ background: 'rgba(239,68,68,0.06)', boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.25)' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          <ToggleRow
            label="Enable autonomous posting"
            sub="Bolty calls your agent webhook on schedule with token context. Agent decides if/what to tweet."
            checked={config.autonomousEnabled}
            disabled={busy}
            onChange={(v) => patch({ autonomousEnabled: v })}
          />
          <IntervalRow
            value={config.postIntervalHours}
            disabled={busy || !config.autonomousEnabled}
            onChange={(v) => patch({ postIntervalHours: v })}
          />
          <ToggleRow
            label="Require human approval before posting"
            sub="When ON: tweet proposals queue here and you click Approve. When OFF: agent posts directly."
            checked={config.requireApproval}
            disabled={busy || !config.autonomousEnabled}
            onChange={(v) => patch({ requireApproval: v })}
          />
          <ToggleRow
            label="Reply to mentions"
            sub="Bolty polls your @handle every 5 min. New mentions go to your agent for an optional reply."
            checked={config.mentionsEnabled}
            disabled={busy || !config.autonomousEnabled}
            onChange={(v) => patch({ mentionsEnabled: v })}
          />

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={decideNow}
              disabled={decideBusy || !config.autonomousEnabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition disabled:opacity-50"
              style={{ background: 'rgba(20, 241, 149,0.15)', boxShadow: 'inset 0 0 0 1px rgba(20, 241, 149,0.4)' }}
            >
              {decideBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
              Ask agent now (test)
            </button>
            {decideMsg && (
              <span className="text-[11.5px] text-zinc-400 font-semibold">{decideMsg}</span>
            )}
          </div>
        </div>
      </Section>

      {config.autonomousEnabled && config.requireApproval && (
        <Section
          index="04"
          title={`Pending tweets — ${pending.length}`}
          subtitle="Click Approve to post · Reject to drop. Posting drains your X dev account credits (~$0.015 each)."
        >
          {pending.length === 0 ? (
            <div className="text-[12px] text-zinc-500 font-semibold italic">
              No proposals waiting. The cron checks every hour — try &quot;Ask agent now&quot; above to test.
            </div>
          ) : (
            <ul className="space-y-2">
              {pending.map((p) => (
                <QueueItem
                  key={p.id}
                  item={p}
                  onApprove={() => approve(p.id)}
                  onReject={() => reject(p.id)}
                />
              ))}
            </ul>
          )}
        </Section>
      )}

      {config.autonomousEnabled && recent.length > 0 && (
        <Section
          index={config.requireApproval ? '05' : '04'}
          title="Recent autonomous activity"
          subtitle="Last 5 results. Failed rows include the verbatim X error so you can diagnose."
        >
          <ul className="space-y-2">
            {recent.map((p) => (
              <RecentItem key={p.id} item={p} />
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
      <div className="flex-1">
        <div className="text-[12.5px] text-white font-semibold">{label}</div>
        <div className="text-[11px] text-zinc-500 font-semibold">{sub}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition disabled:opacity-50 ${
          checked ? 'bg-[#14F195]' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

function IntervalRow({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  const presets = [1, 6, 12, 24, 48];
  return (
    <div>
      <div className="text-[12.5px] text-white font-semibold">Post interval</div>
      <div className="text-[11px] text-zinc-500 font-semibold mb-2">
        Minimum hours between autonomous posts. Agent may still decline.
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {presets.map((h) => (
          <button
            key={h}
            type="button"
            disabled={disabled}
            onClick={() => onChange(h)}
            className={`px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition disabled:opacity-50 ${
              value === h
                ? 'bg-[#14F195]/20 text-white'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
            style={{
              boxShadow: value === h ? 'inset 0 0 0 1px rgba(20, 241, 149,0.5)' : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          >
            {h === 1 ? '1 h' : h === 24 ? '24 h (daily)' : `${h} h`}
          </button>
        ))}
      </div>
    </div>
  );
}

function QueueItem({
  item,
  onApprove,
  onReject,
}: {
  item: { id: string; text: string; reason: string | null; triggerType: string; inReplyToTweetId: string | null; createdAt: string };
  onApprove: () => void;
  onReject: () => void;
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const handle = async (which: 'approve' | 'reject', cb: () => void | Promise<void>) => {
    setBusy(which);
    try {
      await cb();
    } finally {
      setBusy(null);
    }
  };
  return (
    <li
      className="rounded-lg p-3"
      style={{ background: 'rgba(255,255,255,0.03)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-2 mb-1.5 text-[11px] text-zinc-500 font-semibold">
        <Bot className="w-3 h-3" />
        {item.triggerType === 'MENTION_REPLY' ? 'Reply to mention' : item.triggerType === 'MANUAL' ? 'Manual trigger' : 'Scheduled'}
        <span className="text-zinc-700">·</span>
        <span>{new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <div className="text-[12.5px] text-zinc-200 font-semibold whitespace-pre-wrap">{item.text}</div>
      {item.reason && (
        <div className="mt-1.5 text-[11px] text-zinc-500 italic font-semibold">Why: {item.reason}</div>
      )}
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => handle('approve', onApprove)}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] text-emerald-300 font-semibold transition disabled:opacity-50"
          style={{ background: 'rgba(34,197,94,0.08)', boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.25)' }}
        >
          {busy === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Approve & post
        </button>
        <button
          type="button"
          onClick={() => handle('reject', onReject)}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] text-rose-300 font-semibold transition disabled:opacity-50"
          style={{ background: 'rgba(239,68,68,0.06)', boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.25)' }}
        >
          {busy === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XIcon className="w-3 h-3" />}
          Reject
        </button>
      </div>
    </li>
  );
}

function RecentItem({
  item,
}: {
  item: { id: string; text: string; status: string; tweetId: string | null; failureReason: string | null; createdAt: string };
}) {
  const colour = item.status === 'POSTED' ? '#22c55e' : item.status === 'FAILED' ? '#ef4444' : '#a1a1aa';
  return (
    <li
      className="rounded-lg p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        boxShadow: `inset 0 0 0 1px ${colour}33`,
      }}
    >
      <div className="flex items-center gap-2 mb-1 text-[11px] font-semibold" style={{ color: colour }}>
        {item.status === 'POSTED' ? '✓ Posted' : item.status === 'FAILED' ? '✗ Failed' : '— ' + item.status}
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-500">{new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <div className="text-[12px] text-zinc-300 font-semibold whitespace-pre-wrap">{item.text}</div>
      {item.failureReason && (
        <div className="mt-1.5 text-[11px] text-rose-300/80 font-semibold">
          {item.failureReason}
        </div>
      )}
    </li>
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
