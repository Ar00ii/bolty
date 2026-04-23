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

import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

type Protocol = 'webhook' | 'sandbox' | 'hybrid';

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
  uploadedFile: UploadedFileMeta | null;
  model: string;
  framework: string;
  contextLength: string;
  avgLatency: string;
  license: string;
  price: string;
  minPrice: string;
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
  uploadedFile: null,
  model: 'gpt-4o-mini',
  framework: 'custom',
  contextLength: '128k',
  avgLatency: '~1s',
  license: 'MIT',
  price: '0.001',
  minPrice: '',
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

const MODELS = [
  'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo',
  'claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4',
  'gemini-2.0-pro', 'gemini-2.0-flash',
  'llama-3.3-70b', 'llama-3.3-8b',
  'mistral-large', 'mixtral-8x22b',
  'deepseek-v3', 'qwen-2.5-72b',
  'custom',
];

const FRAMEWORKS = ['custom', 'langchain', 'llamaindex', 'autogen', 'crewai', 'pydantic-ai', 'vercel-ai-sdk', 'openai-sdk', 'anthropic-sdk'];
const LICENSES = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3', 'Proprietary', 'Other'];
const CONTEXT_LENGTHS = ['4k', '8k', '16k', '32k', '128k', '200k', '1M', '2M'];

export default function PublishAgentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [endpointMsg, setEndpointMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent('/market/agents/publish')}`);
    }
  }, [isAuthenticated, isLoading, router]);

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
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<UploadedFileMeta>('/market/upload', formData);
      set('uploadedFile', result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const testEndpoint = useCallback(async () => {
    const url = form.agentEndpoint.trim();
    if (!url) return;
    setTestingEndpoint(true);
    setEndpointStatus('idle');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Bolty-Event': 'health_check' },
        body: JSON.stringify({ event: 'health_check', prompt: 'ping' }),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        setEndpointStatus('ok');
        setEndpointMsg(`Responded with ${res.status}`);
      } else {
        setEndpointStatus('fail');
        setEndpointMsg(`Responded with ${res.status}`);
      }
    } catch (err) {
      setEndpointStatus('fail');
      setEndpointMsg(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setTestingEndpoint(false);
    }
  }, [form.agentEndpoint]);

  const canSubmit = useMemo(() => {
    if (!form.title.trim()) return false;
    if (!form.tagline.trim()) return false;
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return false;
    const hasEndpoint = form.protocol !== 'sandbox' && form.agentEndpoint.trim().length > 0;
    const hasSandbox = form.protocol !== 'webhook' && !!form.uploadedFile;
    if (!hasEndpoint && !hasSandbox) return false;
    return true;
  }, [form]);

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
      const proto =
        `\n\n## Integration\n\n` +
        (form.protocol === 'webhook'
          ? '- **Protocol**: webhook (POST with `event`, `prompt`)\n'
          : form.protocol === 'sandbox'
            ? '- **Protocol**: sandboxed file\n'
            : '- **Protocol**: webhook + sandbox fallback\n');

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
      };
      if (form.minPrice && Number(form.minPrice) > 0) {
        payload.minPrice = Number(form.minPrice);
      }
      if (form.protocol !== 'sandbox' && form.agentEndpoint.trim()) {
        payload.agentEndpoint = form.agentEndpoint.trim();
      }
      if (form.protocol !== 'webhook' && form.uploadedFile) {
        payload.fileKey = form.uploadedFile.fileKey;
        payload.fileName = form.uploadedFile.fileName;
        payload.fileSize = form.uploadedFile.fileSize;
        payload.fileMimeType = form.uploadedFile.fileMimeType;
      }

      const res = await api.post<{ id: string }>('/market', payload);
      if (res?.id) {
        router.push(`/market/agents/${res.id}`);
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
                technical specs, and pricing — everything your buyers need before
                they hit Negotiate.
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
              title="Protocol"
              description="How does a buyer invoke your agent?"
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <ProtocolOption
                  active={form.protocol === 'webhook'}
                  icon={Globe}
                  name="Webhook"
                  tagline="Buyers POST JSON to your URL."
                  onClick={() => set('protocol', 'webhook')}
                />
                <ProtocolOption
                  active={form.protocol === 'sandbox'}
                  icon={FileCode}
                  name="Sandboxed file"
                  tagline="Upload code, Bolty runs it."
                  onClick={() => set('protocol', 'sandbox')}
                />
                <ProtocolOption
                  active={form.protocol === 'hybrid'}
                  icon={Cloud}
                  name="Hybrid"
                  tagline="Webhook + file fallback."
                  onClick={() => set('protocol', 'hybrid')}
                />
              </div>

              {form.protocol !== 'sandbox' && (
                <Field
                  label="Webhook URL"
                  required
                  hint="POST endpoint that accepts { event, prompt, negotiation? } and returns a JSON response."
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

              {form.protocol !== 'webhook' && (
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
            </Section>

            {/* Section: Technical */}
            <Section
              icon={Cpu}
              step="03"
              title="Technical details"
              description="Help developers understand what's under the hood."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Base model">
                  <select
                    value={form.model}
                    onChange={(e) => set('model', e.target.value)}
                    className="input-std"
                  >
                    {MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Framework">
                  <select
                    value={form.framework}
                    onChange={(e) => set('framework', e.target.value)}
                    className="input-std"
                  >
                    {FRAMEWORKS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
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
              description="Price + a floor if you want negotiation support."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Ask price" required>
                  <input
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value.replace(/,/g, '.'))}
                    placeholder="0.001"
                    className="input-std"
                  />
                </Field>
                <Field label="Negotiation floor" hint="Minimum you'll accept. Optional.">
                  <input
                    inputMode="decimal"
                    value={form.minPrice}
                    onChange={(e) => set('minPrice', e.target.value.replace(/,/g, '.'))}
                    placeholder="0.0005"
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
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  tagline: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-start gap-2 rounded-xl p-3 text-left transition ${
        active ? 'ring-2 ring-[#836EF9]/60' : 'ring-1 ring-white/5 hover:ring-white/15'
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
      {active && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#836EF9]/20 px-1.5 py-[1px] text-[9.5px] uppercase tracking-wide text-[#C9BEFF]">
          <Check className="h-2.5 w-2.5" />
          Selected
        </span>
      )}
    </button>
  );
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
          <Plus className="mt-0.5 h-3 w-3 shrink-0 text-[#C9BEFF]" />
          Set a floor price to unlock <em>Negotiate</em> — buyers&apos; agents will haggle down to it.
        </li>
        <li className="flex gap-1.5">
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-[#C9BEFF]" />
          Payments go through escrow, held until the buyer confirms.
        </li>
      </ul>
    </div>
  );
}
