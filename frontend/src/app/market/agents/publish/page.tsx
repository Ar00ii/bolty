'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Cpu,
  FileCode,
  Globe,
  Loader2,
  Lock,
  Plus,
  Radio,
  Rocket,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { api, API_URL, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

// `webhook` | `mcp` | `openai` map directly onto the backend's
// AgentsTestService dispatcher. `sandbox` keeps the upload-a-bundle
// path; `hybrid` (webhook + sandbox fallback) is preserved for legacy
// listings. `docker` ships in a follow-up — disabled in the picker
// with a "coming soon" badge.
type Protocol = 'webhook' | 'mcp' | 'openai' | 'sandbox' | 'hybrid' | 'docker';

interface UploadedFileMeta {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  scanPassed?: boolean;
  scanNote?: string;
}

interface FormState {
  title: string;
  tagline: string;
  description: string;
  tags: string[];
  category: string;
  protocol: Protocol;
  agentEndpoint: string;
  agentModel: string;
  agentApiKey: string;
  uploadedFile: UploadedFileMeta | null;
  model: string;
  framework: string;
  contextLength: string;
  avgLatency: string;
  license: string;
  price: string;
  currency: 'ETH' | 'USD' | 'BOLTY';
}

const EMPTY: FormState = {
  title: '',
  tagline: '',
  description: '',
  tags: [],
  category: 'assistant',
  protocol: 'webhook',
  agentEndpoint: '',
  agentModel: '',
  agentApiKey: '',
  uploadedFile: null,
  model: '',
  framework: '',
  contextLength: '128k',
  avgLatency: '~1s',
  license: 'MIT',
  price: '0.001',
  currency: 'ETH',
};

const CATEGORIES = [
  { id: 'assistant', label: 'Assistant' },
  { id: 'code', label: 'Code' },
  { id: 'research', label: 'Research' },
  { id: 'data', label: 'Data / ETL' },
  { id: 'writing', label: 'Writing' },
  { id: 'vision', label: 'Vision' },
  { id: 'voice', label: 'Voice / Audio' },
  { id: 'trading', label: 'Trading' },
  { id: 'automation', label: 'Automation' },
  { id: 'security', label: 'Security' },
];

// Free-text inputs — sellers type whatever model / framework their
// agent is built on instead of picking from a hardcoded list.
const LICENSES = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3', 'Proprietary', 'Other'];
const CONTEXT_LENGTHS = ['4k', '8k', '16k', '32k', '128k', '200k', '1M', '2M'];

export default function PublishAgentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Draft persistence — the publish form is long enough that losing
  // it to an accidental refresh felt painful. Seed from localStorage
  // on mount, then autosave the form on every change. Cleared after a
  // successful publish.
  const DRAFT_KEY = 'bolty:publish-agent-draft:v1';
  const [form, setForm] = useState<FormState>(EMPTY);
  const [draftRestored, setDraftRestored] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [endpointMsg, setEndpointMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // BoltyGuard pre-publish scan. Fires automatically right after the
  // user uploads the file. Score < 40 = block publish; < 70 = warn.
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    score: number;
    summary: string;
    findings: Array<{
      rule: string;
      severity: string;
      file?: string;
      line?: number;
      message: string;
      fix?: string;
    }>;
    files?: Array<{ path: string; score: number; findingCount: number }>;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent('/market/agents/publish')}`);
    }
  }, [isAuthenticated, isLoading, router]);

  // Restore draft on mount — only once. Broken/out-of-shape payloads
  // are ignored instead of crashing the form.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormState>;
      if (parsed && typeof parsed === 'object' && (parsed.title || parsed.description)) {
        setForm((prev) => ({ ...prev, ...parsed }));
        setDraftRestored(true);
        setTimeout(() => setDraftRestored(false), 5000);
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  // Autosave — debounced so we're not touching localStorage on every
  // keystroke. Skips the pristine EMPTY state.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (form.title.trim() === '' && form.description.trim() === '') return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {
        /* storage full / disabled — not fatal */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form]);

  const clearDraft = React.useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = () => {
    const raw = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (!raw || form.tags.includes(raw) || form.tags.length >= 8) return;
    setForm((p) => ({ ...p, tags: [...p.tags, raw] }));
    setTagInput('');
  };
  const removeTag = (t: string) => setForm((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }));

  const onFilePicked = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Sandbox files must be under 10MB.');
      return;
    }
    setUploading(true);
    setError(null);
    setScanResult(null);
    setScanError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<UploadedFileMeta>('/market/upload', formData);
      set('uploadedFile', result);

      // Fire BoltyGuard scan in parallel with the rest of the form
      // filling. The publish CTA is gated on the result. Bundle path
      // for zips, single-file path for everything else.
      setScanning(true);
      try {
        const isZip =
          /\.zip$/i.test(file.name) ||
          file.type === 'application/zip' ||
          file.type === 'application/x-zip-compressed';
        if (isZip) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('isAgent', 'true');
          const res = await fetch(`${API_URL}/boltyguard/scan-bundle`, {
            method: 'POST',
            body: fd,
            credentials: 'include',
          });
          const j = (await res.json().catch(() => null)) as
            | typeof scanResult
            | { message?: string }
            | null;
          if (!res.ok) {
            throw new Error(
              (j as { message?: string } | null)?.message ?? `Scan failed (${res.status})`,
            );
          }
          setScanResult(j as typeof scanResult);
        } else {
          const code = await file.text();
          const j = await api.post<typeof scanResult>('/boltyguard/scan', {
            code,
            fileName: file.name,
            isAgent: true,
          });
          setScanResult(j);
        }
      } catch (scanErr) {
        setScanError(
          scanErr instanceof Error ? scanErr.message : 'Pre-publish scan failed',
        );
      } finally {
        setScanning(false);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  // Server-side test runner. We used to do `fetch()` from the browser
  // directly to the seller's endpoint, which (a) hit CORS for any agent
  // without permissive headers (most of them) and (b) could only check
  // status, not the response body shape. The /agents/test-deploy
  // endpoint runs the full IProtocolAdapter pipeline server-side and
  // returns structured diagnostics we render inline.
  const testEndpoint = useCallback(async () => {
    const url = form.agentEndpoint.trim();
    if (!url) return;
    setTestingEndpoint(true);
    setEndpointStatus('idle');
    setEndpointMsg('');
    try {
      const result = await api.post<{
        protocol: string;
        health: { healthy: boolean; latencyMs: number; reason?: string; status?: number };
        invoke?: { ok: boolean; latencyMs: number; reply?: string; error?: string };
      }>('/agents/test-deploy', {
        protocol: form.protocol,
        endpoint: url,
        model: form.agentModel || undefined,
        apiKey: form.agentApiKey || undefined,
      });
      if (result.health.healthy && result.invoke?.ok) {
        setEndpointStatus('ok');
        const replySnippet = (result.invoke.reply ?? '').slice(0, 80);
        setEndpointMsg(
          `Healthy in ${result.health.latencyMs}ms · invoke replied "${replySnippet}" in ${result.invoke.latencyMs}ms`,
        );
      } else if (result.health.healthy) {
        setEndpointStatus('fail');
        setEndpointMsg(
          `Health passed but invoke failed: ${result.invoke?.error ?? 'no_reply'}`,
        );
      } else {
        setEndpointStatus('fail');
        const status = result.health.status ? ` (HTTP ${result.health.status})` : '';
        setEndpointMsg(`Health failed${status}: ${result.health.reason ?? 'unknown'}`);
      }
    } catch (err) {
      setEndpointStatus('fail');
      setEndpointMsg(err instanceof ApiError ? err.message : 'Request failed');
    } finally {
      setTestingEndpoint(false);
    }
  }, [form.agentEndpoint, form.protocol, form.agentModel, form.agentApiKey]);

  const canSubmit = useMemo(() => {
    if (!form.title.trim()) return false;
    if (!form.tagline.trim()) return false;
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return false;
    const hasEndpoint =
      needsHttpEndpoint(form.protocol) && form.agentEndpoint.trim().length > 0;
    const hasSandbox = needsSandboxFile(form.protocol) && !!form.uploadedFile;
    // OpenAI-compatible additionally requires a model id.
    if (form.protocol === 'openai' && !form.agentModel.trim()) return false;
    // Hybrid needs BOTH a webhook AND a sandbox; everything else needs
    // at least one of the two.
    if (form.protocol === 'hybrid' && !(hasEndpoint && hasSandbox)) return false;
    if (form.protocol !== 'hybrid' && !hasEndpoint && !hasSandbox) return false;
    // BoltyGuard: still scanning, or score below the unsafe floor → block.
    if (scanning) return false;
    if (scanResult && scanResult.score < 40) return false;
    return true;
  }, [form, scanning, scanResult]);

  const submit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Compose a structured description — the backend stores it as
      // markdown, we render it with our Markdown component.
      const tech =
        `\n\n## Technical details\n\n` +
        `- **Model**: ${form.model}\n` +
        `- **Framework**: ${form.framework}\n` +
        `- **Context length**: ${form.contextLength}\n` +
        `- **Avg latency**: ${form.avgLatency}\n` +
        `- **License**: ${form.license}\n`;
      const protocolBlurb: Record<Protocol, string> = {
        webhook: 'webhook (POST with `event`, `prompt`)',
        mcp: 'MCP server (JSON-RPC `tools/call` named `invoke`)',
        openai: `OpenAI-compatible (model: ${form.agentModel || 'unspecified'})`,
        sandbox: 'sandboxed file',
        hybrid: 'webhook + sandbox fallback',
        docker: 'docker container',
      };
      const proto = `\n\n## Integration\n\n- **Protocol**: ${protocolBlurb[form.protocol]}\n`;

      const fullDescription =
        (form.description.trim() || form.tagline.trim()) + tech + proto;

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: fullDescription,
        type: 'AI_AGENT',
        price: Number(form.price),
        currency: form.currency,
        tags: [form.category, form.model, form.framework, form.license.toLowerCase(), ...form.tags]
          .filter(Boolean)
          .slice(0, 12),
        agentProtocol: form.protocol,
      };
      if (needsHttpEndpoint(form.protocol) && form.agentEndpoint.trim()) {
        payload.agentEndpoint = form.agentEndpoint.trim();
      }
      if (form.protocol === 'openai') {
        if (form.agentModel.trim()) payload.agentModel = form.agentModel.trim();
        if (form.agentApiKey.trim()) payload.agentApiKey = form.agentApiKey.trim();
      }
      if (needsSandboxFile(form.protocol) && form.uploadedFile) {
        payload.fileKey = form.uploadedFile.fileKey;
        payload.fileName = form.uploadedFile.fileName;
        payload.fileSize = form.uploadedFile.fileSize;
        payload.fileMimeType = form.uploadedFile.fileMimeType;
      }

      const res = await api.post<{ id: string }>('/market', payload);
      if (res?.id) {
        clearDraft();
        // AI_AGENT listings need a connected X account before they show
        // in the public marketplace (per the BYO X model). Send the
        // seller straight to the X setup page instead of the detail
        // page so the listing actually goes live in one continuous flow.
        const isAgent = String(payload.type) === 'AI_AGENT';
        router.push(isAgent ? `/market/agents/${res.id}/setup-x` : `/market/agents/${res.id}`);
        return;
      }
      setError('Publish succeeded but no listing id returned.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, submitting, form, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070A]">
        <Loader2 className="h-5 w-5 animate-spin text-[#836EF9]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#07070A] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(1100px 650px at 15% -10%, rgba(131,110,249,0.15), transparent 60%), radial-gradient(900px 560px at 95% 10%, rgba(6,182,212,0.10), transparent 60%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-xs text-white/50">
          <Link href="/market/agents" className="flex items-center gap-1 transition hover:text-white">
            <ArrowLeft className="h-3 w-3" />
            Agents
          </Link>
          <ChevronRight className="h-3 w-3 text-white/30" />
          <span className="text-white/80">Deploy new</span>
        </div>

        {draftRestored && (
          <div
            className="mb-4 flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs"
            style={{
              background: 'rgba(131,110,249,0.08)',
              boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
              color: '#C9BEFF',
            }}
          >
            <span>Draft restored from your last session.</span>
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY);
                clearDraft();
                setDraftRestored(false);
              }}
              className="text-[11px] text-white/60 transition hover:text-white"
            >
              Start fresh
            </button>
          </div>
        )}

        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(131,110,249,0.22), rgba(6,182,212,0.14))',
                boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
              }}
            >
              <Rocket className="h-5 w-5 text-[#C9BEFF]" />
            </span>
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-white/40">
                <Sparkles className="h-3 w-3 text-[#836EF9]" />
                Agent deployment
              </div>
              <h1 className="mt-0.5 text-2xl font-light tracking-tight sm:text-3xl">
                Deploy a new agent
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-light text-white/60">
                Ship an AI agent to the Bolty marketplace. Configure its protocol,
                technical specs, and pricing — your buyers will be able to
                invoke it the moment you publish.
              </p>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* ── Form column ────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            {/* Section: Identity */}
            <Section
              icon={Bot}
              step="01"
              title="Identity"
              description="Give your agent a name and a one-line pitch."
            >
              <Field label="Name" required>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value.slice(0, 80))}
                  placeholder="e.g. Code Review Bot"
                  maxLength={80}
                  className="input-std"
                />
              </Field>
              <Field label="One-line description" required hint="Shown on every card — keep it punchy.">
                <input
                  value={form.tagline}
                  onChange={(e) => set('tagline', e.target.value.slice(0, 140))}
                  placeholder="Reviews pull requests for security, style, and correctness."
                  maxLength={140}
                  className="input-std"
                />
                <div className="mt-1 text-right text-[10px] text-white/40">
                  {form.tagline.length}/140
                </div>
              </Field>
              <Field label="Full description" hint="Markdown supported. Technical specs get appended automatically.">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value.slice(0, 4000))}
                  placeholder={`## What it does\n- Scans every PR opened in the last hour\n- Flags security + style issues inline\n\n## Example prompts\n- "review PR #123"\n- "only flag high severity"`}
                  rows={6}
                  maxLength={4000}
                  className="input-std font-mono text-[12.5px]"
                />
              </Field>
              <Field label="Category">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const active = form.category === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => set('category', c.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11.5px] transition ${
                          active
                            ? 'bg-[#836EF9]/20 text-white ring-1 ring-[#836EF9]/50'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Tags" hint={`Up to 8 — helps discoverability. (${form.tags.length}/8)`}>
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/80"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-white/50 hover:text-white"
                        aria-label={`Remove ${t}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {form.tags.length < 8 && (
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      onBlur={addTag}
                      placeholder="add tag + enter"
                      className="min-w-[120px] flex-1 bg-transparent text-[11.5px] text-white outline-none placeholder:text-white/25"
                    />
                  )}
                </div>
              </Field>
            </Section>

            {/* Section: Protocol */}
            <Section
              icon={Radio}
              step="02"
              title="Deploy protocol"
              description="Pick the contract your endpoint speaks. Bolty will probe it server-side before you publish."
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <ProtocolOption
                  active={form.protocol === 'webhook'}
                  icon={Globe}
                  name="Bolty webhook"
                  tagline="Bolty POSTs JSON, you reply { reply: string }."
                  onClick={() => set('protocol', 'webhook')}
                />
                <ProtocolOption
                  active={form.protocol === 'mcp'}
                  icon={Cpu}
                  name="MCP server"
                  tagline="Model Context Protocol over HTTP (JSON-RPC)."
                  onClick={() => set('protocol', 'mcp')}
                />
                <ProtocolOption
                  active={form.protocol === 'openai'}
                  icon={Bot}
                  name="OpenAI-compatible"
                  tagline="Any /v1/chat/completions endpoint with a model id."
                  onClick={() => set('protocol', 'openai')}
                />
                <ProtocolOption
                  active={form.protocol === 'sandbox'}
                  icon={FileCode}
                  name="Sandboxed file"
                  tagline="Upload code, Bolty runs it server-side."
                  onClick={() => set('protocol', 'sandbox')}
                />
                <ProtocolOption
                  active={form.protocol === 'hybrid'}
                  icon={Cloud}
                  name="Hybrid"
                  tagline="Webhook with sandbox bundle as a fallback."
                  onClick={() => set('protocol', 'hybrid')}
                />
                <ProtocolOption
                  active={false}
                  icon={Cpu}
                  name="Docker container"
                  tagline="Coming soon — pull from a registry, Bolty runs it isolated."
                  onClick={() => {
                    /* docker is coming-soon; the picker rejects clicks */
                  }}
                  disabled
                />
              </div>

              {needsHttpEndpoint(form.protocol) && (
                <Field
                  label={form.protocol === 'mcp' ? 'MCP server URL' : form.protocol === 'openai' ? 'API endpoint' : 'Webhook URL'}
                  required
                  hint={
                    form.protocol === 'mcp'
                      ? 'JSON-RPC 2.0 endpoint that supports `initialize` and a `tools/call` named `invoke`.'
                      : form.protocol === 'openai'
                        ? 'Any OpenAI-compatible /v1/chat/completions endpoint (OpenAI, Together, Groq, OpenRouter, vLLM, llama.cpp, etc.).'
                        : 'POST endpoint that accepts { event, prompt, conversationId?, history? } and returns { reply: string, action?: { type, data? } }.'
                  }
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={form.agentEndpoint}
                      onChange={(e) => {
                        set('agentEndpoint', e.target.value);
                        setEndpointStatus('idle');
                      }}
                      placeholder="https://your-agent.com/bolty"
                      className="input-std flex-1"
                    />
                    <button
                      type="button"
                      onClick={testEndpoint}
                      disabled={!form.agentEndpoint.trim() || testingEndpoint}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-[12px] font-normal text-white/80 transition hover:bg-white/10 disabled:opacity-40"
                    >
                      {testingEndpoint ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : endpointStatus === 'ok' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : endpointStatus === 'fail' ? (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                      Test
                    </button>
                  </div>
                  {endpointStatus !== 'idle' && (
                    <div
                      className={`mt-2 text-[11px] ${
                        endpointStatus === 'ok' ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {endpointStatus === 'ok' ? '✓ ' : '✗ '}
                      {endpointMsg}
                    </div>
                  )}
                </Field>
              )}

              {form.protocol === 'openai' && (
                <>
                  <Field
                    label="Model id"
                    required
                    hint="Whatever the endpoint accepts as `model` (e.g. gpt-4o-mini, claude-3-5-sonnet, llama-3-70b)."
                  >
                    <input
                      value={form.agentModel}
                      onChange={(e) => set('agentModel', e.target.value.slice(0, 80))}
                      placeholder="gpt-4o-mini"
                      className="input-std"
                    />
                  </Field>
                  <Field
                    label="API key"
                    hint="Bearer token forwarded as Authorization header. Optional for local runtimes (llama.cpp, vLLM)."
                  >
                    <input
                      type="password"
                      value={form.agentApiKey}
                      onChange={(e) => set('agentApiKey', e.target.value.slice(0, 256))}
                      placeholder="sk-…"
                      className="input-std"
                      autoComplete="off"
                    />
                  </Field>
                </>
              )}

              {needsSandboxFile(form.protocol) && (
                <Field
                  label="Sandbox bundle"
                  required
                  hint="Zip or script — max 10MB. Runs in an isolated sandbox when buyers invoke."
                >
                  {form.uploadedFile ? (
                    <div
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                      style={{
                        background: 'rgba(16,185,129,0.08)',
                        boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.3)',
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-normal">
                          {form.uploadedFile.fileName}
                        </div>
                        <div className="text-[10px] text-white/50">
                          {(form.uploadedFile.fileSize / 1024).toFixed(1)} KB
                          {form.uploadedFile.scanPassed === false && ' · scan: flagged'}
                          {form.uploadedFile.scanPassed === true && ' · scan: clean'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => set('uploadedFile', null)}
                        className="text-white/50 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-4 text-sm font-light text-white/70 transition hover:border-[#836EF9]/40 hover:bg-[#836EF9]/5 hover:text-white disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading ? 'Uploading…' : 'Upload sandbox file'}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={onFilePicked}
                  />
                </Field>
              )}

              <BoltyGuardScanPanel
                scanning={scanning}
                error={scanError}
                result={scanResult}
              />
            </Section>

            {/* Section: Technical */}
            <Section
              icon={Cpu}
              step="03"
              title="Technical details"
              description="Help developers understand what's under the hood."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Base model" hint="Free text — whatever powers your agent.">
                  <input
                    value={form.model}
                    onChange={(e) => set('model', e.target.value.slice(0, 60))}
                    placeholder="e.g. custom, fine-tuned, multi-model"
                    className="input-std"
                  />
                </Field>
                <Field label="Framework" hint="Optional — what your agent is built with.">
                  <input
                    value={form.framework}
                    onChange={(e) => set('framework', e.target.value.slice(0, 60))}
                    placeholder="e.g. custom stack"
                    className="input-std"
                  />
                </Field>
                <Field label="Context length">
                  <select
                    value={form.contextLength}
                    onChange={(e) => set('contextLength', e.target.value)}
                    className="input-std"
                  >
                    {CONTEXT_LENGTHS.map((c) => (
                      <option key={c} value={c}>{c} tokens</option>
                    ))}
                  </select>
                </Field>
                <Field label="Average latency">
                  <input
                    value={form.avgLatency}
                    onChange={(e) => set('avgLatency', e.target.value.slice(0, 24))}
                    placeholder="~1s, 800ms, 2-4s"
                    className="input-std"
                  />
                </Field>
                <Field label="License">
                  <select
                    value={form.license}
                    onChange={(e) => set('license', e.target.value)}
                    className="input-std"
                  >
                    {LICENSES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            {/* Section: Pricing */}
            <Section
              icon={Code2}
              step="04"
              title="Pricing"
              description="What buyers pay to invoke your agent."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Ask price" required>
                  <input
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value.replace(/,/g, '.'))}
                    placeholder="0.001"
                    className="input-std"
                  />
                </Field>
                <Field label="Currency">
                  <select
                    value={form.currency}
                    onChange={(e) => set('currency', e.target.value as FormState['currency'])}
                    className="input-std"
                  >
                    <option value="ETH">ETH</option>
                    <option value="USD">USD</option>
                    <option value="BOLTY">BOLTY</option>
                  </select>
                </Field>
              </div>
            </Section>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <Link
                href="/market/agents"
                className="text-[12.5px] text-white/60 transition hover:text-white"
              >
                Cancel
              </Link>
              <button
                onClick={submit}
                disabled={!canSubmit || submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#836EF9] to-[#6B4FE8] px-5 py-2.5 text-sm font-normal text-white shadow-[0_0_30px_-8px_#836EF9] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                Deploy agent
              </button>
            </div>
          </div>

          {/* ── Preview rail ───────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <PreviewCard form={form} />
            <TipsCard />
          </aside>
        </div>
      </div>

      <style jsx>{`
        .input-std {
          width: 100%;
          border-radius: 0.75rem;
          background: rgba(0, 0, 0, 0.4);
          padding: 0.6rem 0.8rem;
          font-size: 13px;
          font-weight: 300;
          color: white;
          outline: none;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
          transition: box-shadow 0.15s;
        }
        .input-std:focus {
          box-shadow: inset 0 0 0 1px rgba(131, 110, 249, 0.5);
        }
        textarea.input-std {
          resize: vertical;
          min-height: 96px;
          line-height: 1.55;
        }
        select.input-std {
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat: no-repeat;
          background-position: right 0.6rem center;
          padding-right: 2rem;
        }
      `}</style>
    </div>
  );
}

function Section({
  icon: Icon,
  step,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-mono tracking-wider"
          style={{
            background: 'rgba(131,110,249,0.14)',
            boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)',
            color: '#C9BEFF',
          }}
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-white/60" />
            <h2 className="text-sm font-normal tracking-tight text-white">{title}</h2>
          </div>
          <p className="mt-0.5 text-[12px] font-light text-white/50">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/45">
        {label}
        {required && <span className="text-rose-300">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10.5px] font-light text-white/40">{hint}</p>}
    </div>
  );
}

function ProtocolOption({
  active,
  icon: Icon,
  name,
  tagline,
  onClick,
  disabled,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  tagline: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`group relative flex flex-col items-start gap-2 rounded-xl p-3 text-left transition ${
        disabled
          ? 'cursor-not-allowed opacity-50 ring-1 ring-white/5'
          : active
            ? 'ring-2 ring-[#836EF9]/60'
            : 'ring-1 ring-white/5 hover:ring-white/15'
      }`}
      style={{
        background: active
          ? 'linear-gradient(180deg, rgba(131,110,249,0.18), rgba(131,110,249,0.06))'
          : 'rgba(255,255,255,0.02)',
      }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{
          background: active ? 'rgba(131,110,249,0.22)' : 'rgba(255,255,255,0.05)',
        }}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <div className="text-[13px] font-normal text-white">{name}</div>
        <div className="mt-0.5 text-[10.5px] font-light text-white/50">{tagline}</div>
      </div>
      {active && !disabled && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#836EF9]/20 px-1.5 py-[1px] text-[9.5px] uppercase tracking-wide text-[#C9BEFF]">
          <Check className="h-2.5 w-2.5" />
          Selected
        </span>
      )}
      {disabled && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-[1px] text-[9.5px] uppercase tracking-wide text-white/60">
          Soon
        </span>
      )}
    </button>
  );
}

/**
 * True for protocols where the publish form needs an HTTP endpoint
 * field. `sandbox` is the only fully-bundled path; everything else has
 * a remote endpoint we test server-side.
 */
function needsHttpEndpoint(p: Protocol): boolean {
  return p === 'webhook' || p === 'mcp' || p === 'openai' || p === 'hybrid';
}

/**
 * True for protocols where the publish form needs the user to upload
 * a sandbox bundle.
 */
function needsSandboxFile(p: Protocol): boolean {
  return p === 'sandbox' || p === 'hybrid';
}

function PreviewCard({ form }: { form: FormState }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,20,26,0.65) 0%, rgba(10,10,14,0.65) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
          Live preview
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-[1px] text-[9.5px] text-white/40">
          <Radio className="h-2.5 w-2.5" />
          card
        </span>
      </div>

      <div className="mt-3 rounded-xl p-3" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(131,110,249,0.24), rgba(6,182,212,0.14))',
              boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
            }}
          >
            <Bot className="h-4 w-4 text-[#C9BEFF]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-normal text-white">
              {form.title || 'Your agent name'}
            </div>
            <div className="truncate text-[10.5px] text-white/40">
              @you · {form.category}
            </div>
          </div>
          {form.agentEndpoint && (
            <span
              className="inline-flex items-center gap-0.5 rounded-md bg-[#836EF9]/15 px-1.5 py-[1px] text-[9px] text-[#C9BEFF]"
              style={{ boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.3)' }}
            >
              <span className="h-1 w-1 animate-pulse rounded-full bg-[#836EF9]" />
              AI
            </span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-[11.5px] font-light text-white/65">
          {form.tagline || 'Your one-line pitch shows here.'}
        </p>
        {form.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {form.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded bg-white/[0.04] px-1.5 py-[1px] text-[10px] text-white/55"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
          <div className="text-[13px] font-light text-white">
            {form.price || '—'}
            <span className="ml-1 text-[10px] text-white/40">{form.currency}</span>
          </div>
          <span className="text-[10px] text-white/35">
            {form.model} · {form.contextLength}
          </span>
        </div>
      </div>
    </div>
  );
}

function TipsCard() {
  return (
    <div
      className="mt-3 rounded-2xl p-4 text-[11.5px] font-light text-white/65"
      style={{
        background:
          'linear-gradient(135deg, rgba(131,110,249,0.12) 0%, rgba(6,182,212,0.06) 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.2)',
      }}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-white/55">
        <Sparkles className="h-3 w-3 text-[#C9BEFF]" />
        Tips
      </div>
      <ul className="space-y-1.5">
        <li className="flex gap-1.5">
          <Plus className="mt-0.5 h-3 w-3 shrink-0 text-[#C9BEFF]" />
          Your webhook gets a health-check ping every 10 min. Offline 20min+ and the listing is paused automatically.
        </li>
        <li className="flex gap-1.5">
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-[#C9BEFF]" />
          Payments go through escrow, held until the buyer confirms.
        </li>
      </ul>
    </div>
  );
}

function BoltyGuardScanPanel({
  scanning,
  error,
  result,
}: {
  scanning: boolean;
  error: string | null;
  result: {
    score: number;
    summary: string;
    findings: Array<{
      rule: string;
      severity: string;
      file?: string;
      line?: number;
      message: string;
      fix?: string;
    }>;
    files?: Array<{ path: string; score: number; findingCount: number }>;
  } | null;
}) {
  if (!scanning && !result && !error) return null;
  if (scanning) {
    return (
      <div
        className="rounded-xl p-4 mt-3 flex items-center gap-3"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="w-7 h-7 rounded-md grid place-items-center"
          style={{ background: 'rgba(131,110,249,0.18)' }}
        >
          <Loader2 className="w-4 h-4 animate-spin text-[#b4a7ff]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-white font-medium">
            BoltyGuard scanning your code…
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Semgrep + Claude. ~10s typical.
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        className="rounded-xl p-3 mt-3 text-[12.5px] text-amber-300"
        style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.3)',
        }}
      >
        BoltyGuard pre-scan failed ({error}). Listing will still be re-scanned in background after publish — you can retry the upload to scan now.
      </div>
    );
  }
  if (!result) return null;
  const colour =
    result.score >= 85
      ? { bg: 'rgba(34,197,94,0.06)', text: '#22c55e', label: 'Secure', border: 'rgba(34,197,94,0.4)' }
      : result.score >= 70
        ? { bg: 'rgba(56,189,248,0.06)', text: '#38bdf8', label: 'OK', border: 'rgba(56,189,248,0.4)' }
        : result.score >= 40
          ? { bg: 'rgba(245,158,11,0.06)', text: '#f59e0b', label: 'Risky', border: 'rgba(245,158,11,0.5)' }
          : { bg: 'rgba(239,68,68,0.06)', text: '#ef4444', label: 'Unsafe — publish blocked', border: 'rgba(239,68,68,0.55)' };
  return (
    <div
      className="rounded-xl p-4 mt-3 space-y-3"
      style={{ background: colour.bg, border: `1px solid ${colour.border}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="text-[24px] font-medium tracking-tight"
          style={{ color: colour.text }}
        >
          {result.score}
          <span className="text-[12px] text-zinc-400 font-light"> / 100</span>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: colour.text }}>
            BoltyGuard · {colour.label}
          </div>
          <div className="text-[11.5px] text-zinc-300 mt-0.5">{result.summary}</div>
        </div>
      </div>
      {result.findings.length > 0 && (
        <ul className="space-y-1.5 max-h-60 overflow-y-auto">
          {result.findings.slice(0, 12).map((f, i) => {
            const sev = f.severity.toUpperCase();
            const sevColour =
              sev === 'CRITICAL'
                ? '#ef4444'
                : sev === 'HIGH'
                  ? '#f59e0b'
                  : sev === 'MEDIUM'
                    ? '#38bdf8'
                    : '#a1a1aa';
            return (
              <li
                key={i}
                className="rounded-lg p-2.5 text-[11.5px]"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-[9px] uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color: sevColour,
                      background: `${sevColour}14`,
                      border: `1px solid ${sevColour}40`,
                    }}
                  >
                    {sev}
                  </span>
                  <span className="font-mono text-[10.5px] text-zinc-300">{f.rule}</span>
                  {f.file && (
                    <span className="font-mono text-[10.5px] text-zinc-500">
                      · {f.file}{f.line ? `:${f.line}` : ''}
                    </span>
                  )}
                </div>
                <div className="text-white/85 font-light">{f.message}</div>
                {f.fix && (
                  <div className="text-emerald-300/85 font-light mt-0.5">Fix: {f.fix}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {result.score < 40 && (
        <div className="text-[11.5px] text-red-300 font-medium">
          Publish is blocked while the score is below 40. Fix the critical findings and re-upload to rescan.
        </div>
      )}
    </div>
  );
}
