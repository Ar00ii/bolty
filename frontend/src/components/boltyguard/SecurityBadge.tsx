'use client';

import { Loader2, Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

export interface ScanResult {
  id: string;
  score: number;
  worstSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | null;
  summary: string | null;
  scanner: string;
  scannedAt: string;
  findings: Array<{
    rule: string;
    severity: string;
    file?: string;
    line?: number;
    message: string;
    fix?: string;
  }>;
}

/**
 * Light fetcher hook for the persisted BoltyGuard scan of a listing.
 *
 * Now accepts an optional `initialScan` so callers that already got
 * the scan baked into the listing payload (from `GET /market` or
 * `GET /market/:id`) don't need to fire another network request just
 * to render the badge. Pass `initialScan={listing.latestScan}` and
 * the hook resolves immediately with no fetch.
 */
export function useSecurityScan(
  listingId: string | null | undefined,
  initialScan?: ScanResult | null,
) {
  const [scan, setScan] = useState<ScanResult | null>(initialScan ?? null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!listingId) return;
    if (initialScan !== undefined) {
      // Caller seeded the badge — no fetch needed.
      setScan(initialScan ?? null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get<ScanResult | null>(`/boltyguard/listings/${listingId}/latest`)
      .then((r) => {
        if (cancelled) return;
        setScan(r ?? null);
      })
      .catch(() => {
        if (!cancelled) setScan(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, initialScan]);
  return { scan, loading };
}

function colourFor(score: number) {
  if (score >= 85)
    return {
      ring: 'rgba(34,197,94,0.45)',
      bg: 'rgba(34,197,94,0.08)',
      text: '#22c55e',
      label: 'Secure',
      icon: ShieldCheck,
    };
  if (score >= 70)
    return {
      ring: 'rgba(56,189,248,0.45)',
      bg: 'rgba(56,189,248,0.08)',
      text: '#38bdf8',
      label: 'OK',
      icon: Shield,
    };
  if (score >= 40)
    return {
      ring: 'rgba(245,158,11,0.5)',
      bg: 'rgba(245,158,11,0.08)',
      text: '#f59e0b',
      label: 'Risky',
      icon: ShieldAlert,
    };
  return {
    ring: 'rgba(239,68,68,0.5)',
    bg: 'rgba(239,68,68,0.08)',
    text: '#ef4444',
    label: 'Unsafe',
    icon: ShieldX,
  };
}

/**
 * Compact pill rendered in the agent detail header. Hover shows a
 * tooltip with the scanner summary; the full findings list lives in
 * the dedicated `<SecurityFindings>` panel below.
 */
export function SecurityBadge({
  listingId,
  initialScan,
}: {
  listingId: string;
  initialScan?: ScanResult | null;
}) {
  const { scan, loading } = useSecurityScan(listingId, initialScan);
  if (loading) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-[0.16em] font-medium text-zinc-500"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Scanning
      </span>
    );
  }
  if (!scan) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-[0.16em] font-medium text-zinc-500"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        title="No security scan yet"
      >
        <Shield className="w-3 h-3" />
        Unscanned
      </span>
    );
  }
  const c = colourFor(scan.score);
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] uppercase tracking-[0.16em] font-medium"
      style={{
        color: c.text,
        background: c.bg,
        border: `1px solid ${c.ring}`,
      }}
      title={`BoltyGuard ${c.label} · ${scan.score}/100${scan.summary ? ` — ${scan.summary}` : ''}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2} />
      {c.label} · {scan.score}
    </span>
  );
}

/**
 * Expanded panel listing every finding from the latest scan. Renders
 * nothing when there are none (clean code → just the badge).
 */
export function SecurityFindings({ listingId }: { listingId: string }) {
  const { scan, loading } = useSecurityScan(listingId);
  if (loading || !scan) return null;
  if (!scan.findings || scan.findings.length === 0) return null;
  return (
    <section
      className="rounded-xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[12px] text-white font-medium tracking-tight">
            BoltyGuard report
          </span>
        </div>
        <span className="text-[10.5px] text-zinc-500 font-mono">
          {scan.scanner} · {new Date(scan.scannedAt).toLocaleString()}
        </span>
      </div>
      <ul className="space-y-2">
        {scan.findings.map((f, i) => {
          const sev = f.severity.toUpperCase();
          const colour =
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
              className="rounded-lg p-3"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9.5px] uppercase tracking-[0.14em] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    color: colour,
                    background: `${colour}14`,
                    border: `1px solid ${colour}40`,
                  }}
                >
                  {sev}
                </span>
                <span className="text-[11px] font-mono text-zinc-300">
                  {f.rule}
                </span>
                {f.line && (
                  <span className="text-[10.5px] font-mono text-zinc-500">
                    :{f.line}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-white/85 font-light leading-relaxed">
                {f.message}
              </p>
              {f.fix && (
                <p className="mt-1 text-[11.5px] text-emerald-300/80 font-light leading-relaxed">
                  Fix: {f.fix}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
