'use client';

import { Loader2, Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import React, { useState } from 'react';

import { api, ApiError } from '@/lib/api/client';

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
  worstSeverity: string | null;
  findings: ScanFinding[];
  summary: string;
  scanner: string;
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

export default function BoltyGuardPage() {
  const [code, setCode] = useState('');
  const [fileExt, setFileExt] = useState('.ts');
  const [isAgent, setIsAgent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
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
                AI security scanner for code &amp; AI agents. Semgrep + Claude.
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: '#0a0a0c',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-3 flex-wrap">
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
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here…"
              rows={14}
              spellCheck={false}
              className="w-full px-4 py-3 rounded-xl text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#836EF9]/50 transition-all font-mono"
              style={{
                background: '#000000',
                border: '1px solid rgba(255,255,255,0.12)',
                resize: 'vertical',
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={loading || !code.trim()}
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

        {result && <ResultPanel result={result} />}
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: ScanResponse }) {
  const colour =
    result.score >= 85
      ? { bg: 'rgba(34,197,94,0.08)', text: '#22c55e', label: 'Secure', Icon: ShieldCheck }
      : result.score >= 70
        ? { bg: 'rgba(56,189,248,0.08)', text: '#38bdf8', label: 'OK', Icon: Shield }
        : result.score >= 40
          ? { bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', label: 'Risky', Icon: ShieldAlert }
          : { bg: 'rgba(239,68,68,0.08)', text: '#ef4444', label: 'Unsafe', Icon: ShieldX };
  const Icon = colour.Icon;
  return (
    <div className="mt-6 space-y-4">
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: colour.bg,
          border: `1px solid ${colour.text}55`,
        }}
      >
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
          </div>
        </div>
      </div>

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
