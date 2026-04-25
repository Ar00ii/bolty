'use client';

import { Download, FileArchive, Github, Loader2, Shield, ShieldAlert, ShieldCheck, ShieldX, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { api, API_URL, ApiError } from '@/lib/api/client';

interface ScanFinding {
  rule: string;
  severity: string;
  file?: string;
  line?: number;
  message: string;
  fix?: string;
}

interface ScanResponse {
  score: number;
  worstSeverity?: string | null;
  findings: ScanFinding[];
  summary: string;
  scanner?: string;
  files?: Array<{ path: string; score: number; findingCount: number }>;
  source?: { kind: 'github'; owner: string; repo: string; ref: string | null };
  tier: 'holder' | 'free';
  holding: string;
  minHolding: string;
}

const FILE_EXTENSIONS = [
  { value: '.ts', label: 'TypeScript' },
  { value: '.js', label: 'JavaScript' },
  { value: '.py', label: 'Python' },
  { value: '.go', label: 'Go' },
  { value: '.rb', label: 'Ruby' },
  { value: '.java', label: 'Java' },
];

/**
 * NestJS sometimes returns `message` as a string, sometimes an array
 * of strings (validation errors), sometimes an object. Normalise so
 * the UI never shows "[object Object]" or a JSON blob.
 */
function extractErrorMessage(
  body:
    | { message?: string | string[]; error?: string; statusCode?: number }
    | null,
  fallbackStatus: number,
): string {
  if (!body) return `Scan failed (${fallbackStatus})`;
  const m = body.message;
  if (typeof m === 'string' && m.trim()) return m;
  if (Array.isArray(m) && m.length) return m.filter(Boolean).join(' · ');
  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  return `Scan failed (${fallbackStatus})`;
}

/**
 * Heuristic: does this look like source code, or did the user type a
 * sentence? We don't gate the scan on it — server still runs — but the
 * client surfaces a clearer message when the input is plainly natural
 * language so users don't think the green "Secure" verdict is the AI
 * answering "Hello" back to them.
 */
function looksLikeCode(s: string): boolean {
  const t = s.trim();
  if (t.length < 8) return false;
  // Multi-line is usually code.
  if (t.includes('\n')) return true;
  // Punctuation that's rare in prose, common in source.
  if (/[{};=()<>[\]]/.test(t)) return true;
  // Common keywords across our supported languages.
  if (
    /\b(function|const|let|var|class|def|import|from|return|if|else|for|while|async|await|public|private|fn|package)\b/.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}

const SAMPLES: Record<string, { label: string; ext: string; code: string }> = {
  evalRce: {
    label: 'Python: eval RCE',
    ext: '.py',
    code: `def handle(user_input):\n    # CRITICAL: eval on attacker-controlled input → RCE.\n    return eval(user_input)\n`,
  },
  hardcodedKey: {
    label: 'JS: hardcoded API key',
    ext: '.js',
    code: `const OPENAI_KEY = "sk-proj-AbCd1234EfGh5678IjKl9012MnOp";\n\nasync function ask(q) {\n  return fetch("https://api.openai.com/v1/chat/completions", {\n    headers: { Authorization: "Bearer " + OPENAI_KEY },\n    body: JSON.stringify({ messages: [{ role: "user", content: q }] }),\n  });\n}\n`,
  },
  shellInjection: {
    label: 'TS: shell injection',
    ext: '.ts',
    code: `import { exec } from "child_process";\n\nexport function run(cmd: string) {\n  // HIGH: no allowlist, command may come from an LLM.\n  exec(cmd, (err, stdout) => console.log(stdout));\n}\n`,
  },
};

export default function BoltyGuardPage() {
  const [mode, setMode] = useState<'paste' | 'zip' | 'repo'>('paste');
  const [code, setCode] = useState('');
  const [fileExt, setFileExt] = useState('.ts');
  const [isAgent, setIsAgent] = useState(true);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  function loadSample(key: keyof typeof SAMPLES) {
    const s = SAMPLES[key];
    setCode(s.code);
    setFileExt(s.ext);
    setResult(null);
    setError(null);
  }

  function downloadReport() {
    if (!result) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boltyguard-report-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (mode === 'paste') {
      if (!code.trim()) return;
      setLoading(true);
      try {
        const data = await api.post<ScanResponse>('/boltyguard/scan', {
          code,
          fileName: `snippet${fileExt}`,
          isAgent,
        });
        setResult(data);
      } catch (e2) {
        setError(e2 instanceof ApiError ? e2.message : 'Scan failed');
      } finally {
        setLoading(false);
      }
      return;
    }
    // ZIP mode — multipart upload via raw fetch since the api client
    // is JSON-only.
    if (!zipFile) {
      setError('Select a ZIP file first.');
      return;
    }
    if (zipFile.size > 5 * 1024 * 1024) {
      setError('ZIP exceeds 5MB cap.');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', zipFile);
      fd.append('isAgent', String(isAgent));
      const res = await fetch(`${API_URL}/boltyguard/scan-bundle`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const json = (await res.json().catch(() => null)) as
        | ScanResponse
        | { message?: string | string[]; error?: string; statusCode?: number }
        | null;
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error('[boltyguard] scan-bundle failed', { status: res.status, body: json });
        throw new Error(
          extractErrorMessage(
            json as
              | { message?: string | string[]; error?: string; statusCode?: number }
              | null,
            res.status,
          ),
        );
      }
      setResult(json as ScanResponse);
    } catch (e2) {
      // eslint-disable-next-line no-console
      console.error('[boltyguard] scan-bundle threw', e2);
      setError(e2 instanceof Error ? e2.message : 'Scan failed (see devtools console)');
    } finally {
      setLoading(false);
    }
  }

  async function onScanRepo() {
    if (!repoUrl.trim()) {
      setError('Paste a github.com URL or owner/repo first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.post<ScanResponse>('/boltyguard/scan-repo', {
        url: repoUrl.trim(),
        isAgent,
      });
      setResult(data);
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : 'Scan failed');
<<<<<<< HEAD
=======
    } finally {
      setLoading(false);
    }
  }

  async function onScanRepo() {
    if (!repoUrl.trim()) {
      setError('Paste a github.com URL or owner/repo first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.post<ScanResponse>('/boltyguard/scan-repo', {
        url: repoUrl.trim(),
        isAgent,
      });
      setResult(data);
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : 'Scan failed');
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center"
              style={{
                background: 'rgba(131,110,249,0.18)',
                border: '1px solid rgba(131,110,249,0.5)',
              }}
            >
              <Shield className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-[28px] text-white font-medium tracking-tight">
                BoltyGuard
              </h1>
              <p className="text-[13.5px] text-zinc-400 font-light mt-0.5">
                Static security scanner — paste source code or upload a zip.
                Not a chat. Returns a 0–100 score, findings + fixes.
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-3.5 text-[12.5px] text-zinc-300 font-light leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Free tier: 5 scans / day. Hold $BOLTY in a linked wallet to unlock
            unmetered scans. The scanner combines Semgrep (deterministic rules)
            with Claude (reasoning + AI-agent-specific checks: prompt injection,
            tool-call abuse, secret exposure).
          </div>
        </header>

        <div className="mb-3 inline-flex items-center gap-1 p-1 rounded-xl"
          style={{
            background: '#0a0a0c',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('paste')}
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition"
            style={{
              background: mode === 'paste' ? 'rgba(131,110,249,0.22)' : 'transparent',
              color: mode === 'paste' ? '#ffffff' : '#a1a1aa',
            }}
          >
            Paste code
          </button>
          <button
            type="button"
            onClick={() => setMode('zip')}
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition inline-flex items-center gap-1.5"
            style={{
              background: mode === 'zip' ? 'rgba(131,110,249,0.22)' : 'transparent',
              color: mode === 'zip' ? '#ffffff' : '#a1a1aa',
            }}
          >
            <FileArchive className="w-3.5 h-3.5" />
            Upload ZIP
          </button>
          <button
            type="button"
            onClick={() => setMode('repo')}
            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition inline-flex items-center gap-1.5"
            style={{
              background: mode === 'repo' ? 'rgba(131,110,249,0.22)' : 'transparent',
              color: mode === 'repo' ? '#ffffff' : '#a1a1aa',
            }}
          >
            <Github className="w-3.5 h-3.5" />
            GitHub repo
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: '#0a0a0c',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              {mode === 'paste' && (
                <label className="flex items-center gap-2 text-[12px] text-zinc-300">
                  <span className="text-zinc-400">Language:</span>
                  <select
                    value={fileExt}
                    onChange={(e) => setFileExt(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-[12.5px] text-white focus:outline-none focus:ring-2 focus:ring-[#836EF9]/50"
                  >
                    {FILE_EXTENSIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2 text-[12px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={isAgent}
                  onChange={(e) => setIsAgent(e.target.checked)}
                  className="accent-[#836EF9]"
                />
                Treat as AI agent (extra checks)
              </label>
            </div>

            {mode === 'paste' ? (
              <>
                <div className="flex items-center gap-1.5 flex-wrap text-[11.5px] text-zinc-400">
                  <span>Try a sample:</span>
                  {(Object.keys(SAMPLES) as Array<keyof typeof SAMPLES>).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => loadSample(k)}
                      className="px-2 py-1 rounded-md text-[11px] text-zinc-300 hover:text-white transition"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {SAMPLES[k].label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste source code (Python, TS, JS, Go, Ruby, Java...). BoltyGuard is a security scanner — not a chat. Try one of the samples above to see findings."
                  rows={14}
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-xl text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#836EF9]/50 transition-all font-mono"
                  style={{
                    background: '#000000',
                    border: '1px solid rgba(255,255,255,0.12)',
                    resize: 'vertical',
                  }}
                />
                {code.trim().length > 0 && !looksLikeCode(code) && (
                  <div
                    className="rounded-lg px-3 py-2 text-[11.5px] text-amber-300 flex items-start gap-2"
                    style={{
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.3)',
                    }}
                  >
                    <span>⚠</span>
                    <span>
                      That looks like text, not code. BoltyGuard is a static
                      security scanner — paste a function, file, or zip and it
                      will return vulnerabilities + fixes. It is not a chat.
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div
                className="rounded-xl p-6 text-center cursor-pointer transition hover:brightness-125"
                style={{
                  background: '#000000',
                  border: '1px dashed rgba(255,255,255,0.18)',
                }}
                onClick={() => zipInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) setZipFile(f);
                }}
              >
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  className="hidden"
                  onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
                />
                {zipFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileArchive className="w-5 h-5 text-[#b4a7ff]" />
                    <div className="text-left">
                      <div className="text-[13px] text-white font-medium">
                        {zipFile.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {(zipFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setZipFile(null);
                      }}
                      className="ml-3 text-[11px] text-zinc-500 hover:text-white"
                    >
                      remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <Upload className="w-6 h-6" strokeWidth={1.6} />
                    <div className="text-[13px] text-white font-medium">
                      Drop a ZIP or click to upload
                    </div>
                    <div className="text-[11px] font-light">
                      Up to 5MB · 100 files · 10MB uncompressed.
                      Bombs / traversal / symlinks are auto-rejected.
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'repo' && (
              <>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: '#000000',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <Github className="w-4 h-4 text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="github.com/owner/repo · or owner/repo · or .../tree/branch"
                    className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-white placeholder-zinc-600 font-mono"
                  />
                </div>
                <div className="text-[11px] text-zinc-500 font-light">
                  Public repos only · max 5MB zipball · scans every
                  source file with the same caps as ZIP uploads. Each
                  repo scan counts as one against your daily quota.
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type={mode === 'repo' ? 'button' : 'submit'}
                onClick={mode === 'repo' ? onScanRepo : undefined}
                disabled={
                  loading ||
                  (mode === 'paste'
                    ? !code.trim()
                    : mode === 'zip'
                      ? !zipFile
                      : !repoUrl.trim())
                }
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.6) 0%, rgba(131,110,249,0.4) 100%)',
                  border: '1px solid rgba(131,110,249,0.55)',
                  boxShadow: '0 4px 20px -8px rgba(131,110,249,0.7)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning…
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" /> Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div
            className="mt-4 rounded-xl p-3 text-[12.5px] text-red-300"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            {error}
          </div>
        )}

        {result && <ResultPanel result={result} onDownload={downloadReport} />}
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  onDownload,
}: {
  result: ScanResponse;
  onDownload: () => void;
}) {
  const colour =
    result.score >= 85
      ? { bg: 'rgba(34,197,94,0.08)', text: '#22c55e', label: 'Secure', Icon: ShieldCheck }
      : result.score >= 70
        ? { bg: 'rgba(56,189,248,0.08)', text: '#38bdf8', label: 'OK', Icon: Shield }
        : result.score >= 40
          ? { bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', label: 'Risky', Icon: ShieldAlert }
          : { bg: 'rgba(239,68,68,0.08)', text: '#ef4444', label: 'Unsafe', Icon: ShieldX };
  const Icon = colour.Icon;

  // Severity counts so the user immediately sees "1 critical, 2 high"
  // before scrolling the list.
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 } as Record<
    string,
    number
  >;
  for (const f of result.findings) {
    const sev = f.severity.toUpperCase();
    if (sev in counts) counts[sev]++;
  }

  // What to fix first: the highest-severity findings, top 3.
  const SEV_RANK: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    INFO: 0,
  };
  const sortedFindings = [...result.findings].sort(
    (a, b) =>
      (SEV_RANK[b.severity.toUpperCase()] ?? 0) -
      (SEV_RANK[a.severity.toUpperCase()] ?? 0),
  );
  const topPriority = sortedFindings.slice(0, 3);

  return (
    <div className="mt-6 space-y-4">
      <div
        className="rounded-2xl p-5"
        style={{
          background: colour.bg,
          border: `1px solid ${colour.text}55`,
        }}
      >
        <div className="flex items-center gap-4">
          <Icon className="w-10 h-10 shrink-0" strokeWidth={1.6} style={{ color: colour.text }} />
          <div className="flex-1 min-w-0">
            <div
              className="text-[28px] font-medium tracking-tight"
              style={{ color: colour.text }}
            >
              {result.score} / 100 · {colour.label}
            </div>
            <div className="text-[13px] text-white/85 mt-0.5">{result.summary}</div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              scanner: {result.scanner} · tier: {result.tier} ({result.holding} $BOLTY)
              {result.source?.kind === 'github' && (
                <>
                  {' · '}repo: {result.source.owner}/{result.source.repo}
                  {result.source.ref ? `@${result.source.ref}` : ''}
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] text-white transition hover:brightness-125"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            title="Download the full report as JSON"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
        {/* Severity tally — shown when there are findings. */}
        {result.findings.length > 0 && (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const).map((sev) => {
              const c =
                sev === 'CRITICAL'
                  ? '#ef4444'
                  : sev === 'HIGH'
                    ? '#f59e0b'
                    : sev === 'MEDIUM'
                      ? '#38bdf8'
                      : sev === 'LOW'
                        ? '#a1a1aa'
                        : '#71717a';
              return (
                <div
                  key={sev}
                  className="rounded-lg p-2 text-center"
                  style={{
                    background: counts[sev] > 0 ? `${c}14` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${counts[sev] > 0 ? `${c}40` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div
                    className="text-[18px] font-medium tabular-nums"
                    style={{ color: counts[sev] > 0 ? c : '#52525b' }}
                  >
                    {counts[sev]}
                  </div>
                  <div className="text-[9.5px] uppercase tracking-[0.14em] font-medium text-zinc-500">
                    {sev.toLowerCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* What to fix first — only meaningful when ≥ MEDIUM. */}
      {topPriority.length > 0 && topPriority[0].severity.toUpperCase() !== 'INFO' && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: '#0a0a0c',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="text-[12px] uppercase tracking-[0.16em] text-zinc-500 font-medium mb-3">
            Fix these first
          </div>
          <ol className="space-y-2 list-decimal list-inside text-[12.5px] text-white/85">
            {topPriority.map((f, i) => (
              <li key={i}>
                <span className="font-mono text-zinc-300">{f.rule}</span>
                {f.file && (
                  <span className="font-mono text-zinc-500 text-[11px]">
                    {' '}· {f.file}{f.line ? `:${f.line}` : ''}
                  </span>
                )}
                {' — '}
                <span className="font-light">{f.message}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Per-file breakdown when scanning a bundle / repo. */}
      {result.files && result.files.length > 1 && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: '#0a0a0c',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="text-[12px] uppercase tracking-[0.16em] text-zinc-500 font-medium mb-3">
            Files (worst first)
          </div>
          <ul className="space-y-1.5">
            {result.files.slice(0, 20).map((f, i) => {
              const c =
                f.score >= 85
                  ? '#22c55e'
                  : f.score >= 70
                    ? '#38bdf8'
                    : f.score >= 40
                      ? '#f59e0b'
                      : '#ef4444';
              return (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 text-[12.5px]"
                >
                  <span className="font-mono text-white/85 truncate">{f.path}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[10.5px] text-zinc-500 font-mono">
                      {f.findingCount} finding{f.findingCount === 1 ? '' : 's'}
                    </span>
                    <span
                      className="font-medium font-mono tabular-nums px-1.5 py-0.5 rounded"
                      style={{
                        color: c,
                        background: `${c}14`,
                        border: `1px solid ${c}40`,
                      }}
                    >
                      {f.score}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {result.findings.length > 0 && (
        <ul className="space-y-2">
          {result.findings.map((f, i) => {
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
                className="rounded-xl p-4"
                style={{
                  background: '#0a0a0c',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className="text-[10px] uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color: sevColour,
                      background: `${sevColour}14`,
                      border: `1px solid ${sevColour}40`,
                    }}
                  >
                    {sev}
                  </span>
                  <span className="text-[11.5px] font-mono text-zinc-300">{f.rule}</span>
                  {f.line && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      :{f.line}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-white/85 font-light leading-relaxed">
                  {f.message}
                </p>
                {f.fix && (
                  <p className="mt-1 text-[12.5px] text-emerald-300/85 font-light leading-relaxed">
                    Fix: {f.fix}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
