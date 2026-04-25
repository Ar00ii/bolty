import * as fs from 'fs';
import * as path from 'path';

import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScanSeverity } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'market');
const MAX_SCAN_BYTES = 200_000;

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Finding {
  rule: string;
  severity: Severity;
  file?: string;
  line?: number;
  message: string;
  fix?: string;
}

export interface ScanReport {
  score: number; // 0-100
  worstSeverity: Severity | null;
  findings: Finding[];
  summary: string;
  scanner: string;
}

const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  INFO: 0,
};

const PRISMA_SEVERITY: Record<Severity, ScanSeverity> = {
  CRITICAL: ScanSeverity.CRITICAL,
  HIGH: ScanSeverity.HIGH,
  MEDIUM: ScanSeverity.MEDIUM,
  LOW: ScanSeverity.LOW,
  INFO: ScanSeverity.INFO,
};

/**
 * BoltyGuard — security scanner for marketplace listings + a public API.
 *
 * Today the scanner is LLM-only (Claude). The interface is shaped so
 * we can layer Semgrep on top in a follow-up: each pass produces a
 * `Finding[]`, BoltyGuard merges them, computes a 0–100 score, persists
 * the report. The score is what gates AI-launch + drives the badge.
 */
@Injectable()
export class BoltyGuardService {
  private readonly logger = new Logger(BoltyGuardService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY') ?? '',
    });
  }

  /** Latest persisted scan for a listing — used by the agent detail
   *  page badge and by the launchpad to gate AI-launch. */
  async getLatest(listingId: string) {
    return this.prisma.securityScan.findFirst({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Run a fresh scan on a listing's uploaded file (script / repo
   *  bundle). Persists the report. Returns the report. */
  async scanListing(listingId: string): Promise<ScanReport> {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { id: true, fileKey: true, fileName: true, type: true },
    });
    if (!listing) throw new NotFoundException('listing not found');

    const code = listing.fileKey
      ? await this.readFile(listing.fileKey)
      : null;

    const report = code
      ? await this.scanCode(code, {
          fileName: listing.fileName ?? 'unknown',
          isAgent: listing.type === 'AI_AGENT',
        })
      : EMPTY_REPORT;

    await this.prisma.securityScan.create({
      data: {
        listingId: listing.id,
        score: report.score,
        worstSeverity: report.worstSeverity
          ? PRISMA_SEVERITY[report.worstSeverity]
          : null,
        findings: report.findings as unknown as object,
        scanner: report.scanner,
        fileKey: listing.fileKey ?? null,
        summary: report.summary || null,
      },
    });

    return report;
  }

  /** Scan an arbitrary code string. Used by the public API endpoint.
   *  Doesn't persist anything — caller decides whether to record. */
  async scanCode(
    code: string,
    opts: { fileName?: string; isAgent?: boolean } = {},
  ): Promise<ScanReport> {
    const trimmed = code.slice(0, MAX_SCAN_BYTES);
    if (!trimmed.trim()) return EMPTY_REPORT;

    try {
      const findings = await this.runClaudePass(trimmed, opts);
      return buildReport(findings, 'claude');
    } catch (err) {
      this.logger.error('Claude pass failed', err);
      // Don't fail the publish — return a low-confidence neutral score
      // and let the seller try again or have a moderator review.
      return {
        score: 75,
        worstSeverity: null,
        findings: [],
        summary: 'Automated scan unavailable. Manual review recommended.',
        scanner: 'unavailable',
      };
    }
  }

  // ── Internals ──────────────────────────────────────────────────────

  private async readFile(fileKey: string): Promise<string | null> {
    const filePath = path.join(UPLOADS_DIR, fileKey);
    if (!fs.existsSync(filePath)) return null;
    try {
      const buf = Buffer.alloc(MAX_SCAN_BYTES);
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buf, 0, MAX_SCAN_BYTES, 0);
      fs.closeSync(fd);
      return buf.subarray(0, bytesRead).toString('utf-8');
    } catch {
      return null;
    }
  }

  private async runClaudePass(
    code: string,
    opts: { fileName?: string; isAgent?: boolean },
  ): Promise<Finding[]> {
    const aiContext = opts.isAgent
      ? `This code is an AI agent. Pay extra attention to:
- eval/exec on LLM output
- Tool calls without an allowlist
- Prompt injection that leads to data exfil
- Webhook handlers without auth
- Secret exposure (API keys, env vars, private keys)`
      : 'This is a general script / repo. Focus on OWASP Top 10 + supply-chain risks.';

    const prompt = `You are BoltyGuard, an application-security analyst.
Audit the following code and return a strict JSON object — nothing else.

File: ${opts.fileName ?? 'unknown'}
${aiContext}

Code:
\`\`\`
${code}
\`\`\`

Return JSON of this exact shape:
{
  "summary": "1-2 sentence verdict",
  "findings": [
    {
      "rule": "short-kebab-id",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "file": "${opts.fileName ?? 'unknown'}",
      "line": <int or null>,
      "message": "what's wrong, 1-2 sentences",
      "fix": "concrete code-level fix, 1-2 sentences"
    }
  ]
}

Rules:
- Empty findings array if the code is clean.
- Max 10 findings. Pick the most important.
- Severity discipline: CRITICAL = exploit gives RCE / fund theft / total compromise; HIGH = data exfil or auth bypass; MEDIUM = injection without immediate compromise; LOW = best-practice / hygiene; INFO = informational.
- Don't invent. If a line isn't visible, set "line": null.`;

    const res = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (res.content[0] as { type: string; text: string }).text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];

    const parsed = JSON.parse(match[0]) as { findings?: Finding[]; summary?: string };
    const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
    return findings
      .map((f) => ({
        rule: String(f.rule || 'unspecified').slice(0, 80),
        severity: normaliseSeverity(f.severity),
        file: f.file ? String(f.file).slice(0, 120) : undefined,
        line: typeof f.line === 'number' ? f.line : undefined,
        message: String(f.message || '').slice(0, 400),
        fix: f.fix ? String(f.fix).slice(0, 400) : undefined,
      }))
      .slice(0, 10);
  }
}

const EMPTY_REPORT: ScanReport = {
  score: 100,
  worstSeverity: null,
  findings: [],
  summary: 'No code to scan.',
  scanner: 'noop',
};

function normaliseSeverity(s: unknown): Severity {
  const u = String(s || '').toUpperCase();
  if (u === 'CRITICAL' || u === 'HIGH' || u === 'MEDIUM' || u === 'LOW' || u === 'INFO') {
    return u;
  }
  return 'MEDIUM';
}

/**
 * Score formula: every finding subtracts a penalty proportional to
 * severity. Capped at 0; clean code scores 100. The summary is the
 * model's verdict, fed back into the report so the badge tooltip
 * has something human-readable.
 */
function buildReport(findings: Finding[], scanner: string): ScanReport {
  const PENALTY: Record<Severity, number> = {
    CRITICAL: 35,
    HIGH: 18,
    MEDIUM: 8,
    LOW: 3,
    INFO: 0,
  };
  const totalPenalty = findings.reduce((s, f) => s + PENALTY[f.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));
  const worst =
    findings.length === 0
      ? null
      : (findings.reduce<Severity>(
          (worst, f) =>
            SEVERITY_RANK[f.severity] > SEVERITY_RANK[worst] ? f.severity : worst,
          'INFO',
        ) as Severity);
  const summary = summarise(findings);
  return { score, worstSeverity: worst, findings, summary, scanner };
}

function summarise(findings: Finding[]): string {
  if (findings.length === 0) return 'No issues found.';
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  };
  for (const f of findings) counts[f.severity]++;
  const parts = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[])
    .filter((s) => counts[s] > 0)
    .map((s) => `${counts[s]} ${s.toLowerCase()}`);
  return `Found ${findings.length} issue${findings.length === 1 ? '' : 's'}: ${parts.join(', ')}.`;
}
