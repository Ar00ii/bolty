import Link from 'next/link';
import React from 'react';

export default function BoltyGuardDocsPage() {
  return (
    <div>
      <h1>BoltyGuard</h1>
      <p>
        BoltyGuard is the security layer for every agent on Atlas. It combines{' '}
        <strong>Semgrep</strong> (deterministic AST-level static analysis) with{' '}
        <strong>Claude</strong> (reasoning, prompt-injection awareness, custom
        AI-agent checks) and produces a single score from 0 to 100.
      </p>

      <h2>What gets scanned</h2>
      <ul>
        <li>
          Every sandbox bundle uploaded through{' '}
          <Link href="/market/agents/publish">/market/agents/publish</Link>{' '}
          is scanned on the spot. The score blocks publish below 40 and warns
          below 70.
        </li>
        <li>
          Anything you paste or upload to{' '}
          <Link href="/boltyguard">/boltyguard</Link> is scanned via the public
          API.
        </li>
        <li>
          Token launches in <Link href="/docs/launchpad">AI-launch mode</Link>{' '}
          are gated on the linked agent listing&apos;s score being ≥ 70.
        </li>
      </ul>

      <h2>Score</h2>
      <pre>
        <code>{`score = max(0, 100 − Σ severity_weight × finding)

CRITICAL  −35
HIGH      −18
MEDIUM     −8
LOW        −3
INFO       0`}</code>
      </pre>
      <p>
        Bands surfaced in the UI:
      </p>
      <ul>
        <li><code>≥ 85</code> — Secure (green)</li>
        <li><code>≥ 70</code> — OK (blue)</li>
        <li><code>≥ 40</code> — Risky (amber)</li>
        <li><code>{'< 40'}</code> — Unsafe (red, blocks publish + AI-launch)</li>
      </ul>

      <h2>Custom AI-agent rules</h2>
      <p>
        On top of Semgrep&apos;s registry-of-the-week, BoltyGuard ships rules
        specifically for AI agents. Source lives in{' '}
        <code>backend/src/modules/boltyguard/rules/</code>:
      </p>
      <ul>
        <li>
          <strong>eval-llm-output</strong> — flags{' '}
          <code>eval / new Function / __import__ / exec</code> in JS &amp;
          Python. Severity <code>CRITICAL</code>: the LLM controls the input,
          you don&apos;t.
        </li>
        <li>
          <strong>secret-exposure</strong> — hardcoded API keys and PEM private
          keys. Anyone who downloads your agent gets the keys. Severity{' '}
          <code>HIGH / CRITICAL</code>.
        </li>
        <li>
          <strong>tool-call-allowlist</strong> — child_process / subprocess
          with <code>shell=True</code> or no allowlist. AI agents that call
          shells with LLM-derived strings are RCE-pending. Severity{' '}
          <code>HIGH</code>.
        </li>
      </ul>

      <h2>Public API</h2>
      <p>
        Two endpoints. Both return a score, summary, and findings array.
      </p>
      <pre>
        <code>{`POST /api/v1/boltyguard/scan
Content-Type: application/json

{
  "code": "<your code>",
  "fileName": "agent.py",
  "isAgent": true
}

# Response
{
  "score": 87,
  "worstSeverity": "MEDIUM",
  "summary": "Found 2 issues: 1 medium, 1 low.",
  "findings": [
    { "rule": "…", "severity": "MEDIUM", "line": 42,
      "message": "…", "fix": "…" }
  ],
  "scanner": "semgrep+claude",
  "tier": "free" | "holder",
  "holding": "0",
  "minHolding": "1000"
}`}</code>
      </pre>
      <pre>
        <code>{`POST /api/v1/boltyguard/scan-bundle
Content-Type: multipart/form-data

# Field: file (.zip, max 5MB)
# Field: isAgent ("true" | "false")

# Response — same shape as /scan plus:
{
  "files": [
    { "path": "src/agent.py", "score": 65, "findingCount": 2 },
    …
  ]
}`}</code>
      </pre>

      <h2>Pricing</h2>
      <ul>
        <li><strong>Free tier</strong>: 5 scans / day per user (or per IP if anonymous).</li>
        <li>
          <strong>Holder tier</strong>: hold ≥ 1,000 $ATLAS in any wallet
          linked to your account → unmetered. Read-only, no token burn.
        </li>
      </ul>

      <h2>Defence in depth</h2>
      <p>
        BoltyGuard treats every uploaded ZIP as adversarial. Hard caps applied
        before extraction:
      </p>
      <ul>
        <li>5MB on the wire (Multer-enforced).</li>
        <li>End-of-Central-Directory signature sniffed before opening.</li>
        <li>100 entries max.</li>
        <li>500KB per file uncompressed.</li>
        <li>10MB total uncompressed.</li>
        <li>200:1 compression ratio cap (zip-bomb defence).</li>
        <li>Rejects path traversal, absolute paths, null bytes, Windows drive letters, symlinks.</li>
        <li>Only scans whitelisted text extensions (.ts, .js, .py, .go, .rb, .sol, .yaml, .json, …).</li>
      </ul>

      <h2>What BoltyGuard does NOT do</h2>
      <ul>
        <li>
          Runtime sandboxing — that&apos;s a separate layer when the agent is
          actually invoked.
        </li>
        <li>
          Dependency vulnerability scanning (npm audit / pip-audit equivalent)
          — coming next.
        </li>
        <li>
          Continuous monitoring — scans run on upload, not continuously.
        </li>
      </ul>
    </div>
  );
}
