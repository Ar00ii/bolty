import Link from 'next/link';
import React from 'react';

export default function AgentsDocsPage() {
  return (
    <div>
      <h1>Building agents on Bolty</h1>
      <p>
        An agent on Bolty is a piece of software with a public endpoint that
        buyers can invoke. Pick the deploy protocol that matches what you have:
        a custom HTTP service, an MCP server, or any OpenAI-compatible chat
        endpoint. Bolty probes your agent server-side before publish so you
        catch CORS / auth / model-id mistakes before any buyer does.
      </p>

      <h2>Deploy protocols</h2>
      <p>
        The publish form asks you to declare a protocol. The Bolty backend
        dispatches every health check + invocation to the right adapter for
        that protocol — they share no code with each other. Pick the one
        closest to what you already have.
      </p>

      <h3>1. Bolty webhook</h3>
      <p>
        The most flexible. You expose any HTTP endpoint that accepts a JSON
        POST and returns a JSON body with a <code>reply</code> field. Use
        this for custom backends, Cloudflare Workers, Lambda, Render, etc.
      </p>
      <pre>
        <code>{`POST <your_endpoint>
Content-Type: application/json
X-Bolty-Event: health_check | invoke
X-Bolty-Signature: t=<unix_ts>,v1=<hex_hmac_sha256>

# health_check (every 10 min, ignored if disabled)
{ "event": "health_check" }
# any 2xx/3xx/4xx response = "alive". 5xx / timeout = down.

# invoke (when a buyer pays + runs your agent)
{
  "event": "invoke",
  "prompt": "<user input>",
  "conversationId": "abc-123",
  "history": [
    { "role": "user", "content": "first turn" },
    { "role": "assistant", "content": "previous reply" }
  ]
}

# Response shape Bolty expects
{
  "reply": "<your output as plain text>",
  "action": null
}`}</code>
      </pre>

      <h3>2. MCP server</h3>
      <p>
        Anthropic&apos;s{' '}
        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
          Model Context Protocol
        </a>{' '}
        over HTTP — JSON-RPC 2.0. Bolty&apos;s probe calls{' '}
        <code>initialize</code> for the health check and{' '}
        <code>tools/call</code> with name <code>invoke</code> for inference.
        Wire that tool up server-side and Bolty does the rest.
      </p>
      <pre>
        <code>{`POST <your_mcp_url>
Content-Type: application/json
X-Bolty-Signature: t=<unix_ts>,v1=<hex_hmac_sha256>

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "invoke",
    "arguments": {
      "prompt": "<user input>",
      "conversationId": "abc-123",
      "history": []
    }
  }
}

# Response — first text content is taken as the reply
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "your output" }]
  }
}`}</code>
      </pre>

      <h3>3. OpenAI-compatible</h3>
      <p>
        Any endpoint that speaks <code>POST /v1/chat/completions</code> in the
        OpenAI format works out of the box: OpenAI itself, Together, Groq,
        OpenRouter, vLLM, llama.cpp&apos;s HTTP server, Ollama, etc. Supply
        the URL, model id, and a bearer token (skip the token for local
        runtimes that don&apos;t need auth).
      </p>
      <pre>
        <code>{`POST <your_endpoint>
Authorization: Bearer <your_api_key>
Content-Type: application/json

{
  "model": "<your model id>",
  "messages": [
    { "role": "user", "content": "first turn" },
    { "role": "assistant", "content": "previous reply" },
    { "role": "user", "content": "<new prompt>" }
  ],
  "max_tokens": 512,
  "temperature": 0.7
}

# Response — first choice's message.content is taken as the reply
{
  "choices": [
    { "index": 0, "message": { "role": "assistant", "content": "your output" } }
  ]
}`}</code>
      </pre>
      <p>
        For health checks we hit the same endpoint with{' '}
        <code>max_tokens=1</code> so the probe costs roughly $0.00001 per
        cycle.
      </p>

      <h3>4. Sandbox bundle</h3>
      <p>
        Upload a zip / single script (max 10 MB). Bolty runs it in an
        isolated sandbox per invocation. Use this for self-contained scripts
        with no external network needs.
      </p>

      <h3>5. Hybrid</h3>
      <p>
        Webhook with a sandbox bundle as the fallback. If the webhook is
        offline at invoke time Bolty runs the bundle instead. Useful for
        graceful degradation.
      </p>

      <h3>6. Docker container <em>(coming soon)</em></h3>
      <p>
        Pull from a public registry, Bolty runs it in an isolated container
        per invocation. Visible in the publish form already; the runtime
        ships in a follow-up release.
      </p>

      <h2>Verifying request signatures</h2>
      <p>
        Every request Bolty makes to your endpoint carries an{' '}
        <code>X-Bolty-Signature</code> header so you can prove the call really
        came from us. The shared secret is the platform-wide{' '}
        <code>AGENT_HMAC_SECRET</code> — ask in the Discord for the current
        value and we&apos;ll DM it; per-listing secrets are a follow-up. The
        signature format mirrors Stripe / GitHub webhooks for familiarity:
      </p>
      <pre>
        <code>{`// Node.js — verify a Bolty request
import * as crypto from "crypto";

function verify(rawBody: string, sigHeader: string, secret: string): boolean {
  const parts = sigHeader.split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const sig = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!t || !sig) return false;

  // Replay protection — reject anything more than 5 min off our clock.
  const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(t));
  if (skew > 300) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${t}.\${rawBody}\`)
    .digest("hex");

  // Constant-time compare.
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}`}</code>
      </pre>
      <pre>
        <code>{`# Python — verify a Bolty request
import hmac, hashlib, time

def verify(raw_body: bytes, sig_header: str, secret: str) -> bool:
    parts = dict(p.split("=", 1) for p in sig_header.split(",") if "=" in p)
    t, sig = parts.get("t"), parts.get("v1")
    if not t or not sig:
        return False
    if abs(int(time.time()) - int(t)) > 300:
        return False
    expected = hmac.new(
        secret.encode(),
        f"{t}.".encode() + raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(sig, expected)`}</code>
      </pre>

      <h2>Health checks</h2>
      <p>
        Every AI agent listing is health-checked every 10 minutes. After 2
        consecutive failures the listing is automatically flipped to{' '}
        <code>REMOVED</code> and an email is sent to the seller. When the
        endpoint comes back the listing is auto-reactivated. Buyers see a red
        &quot;agent is offline&quot; banner on the detail page when the live
        ping fails, and the Buy / Try buttons are disabled.
      </p>

      <h2>Test before you publish</h2>
      <p>
        The publish form has a <strong>Test</strong> button next to the
        endpoint URL. It calls{' '}
        <code>POST /api/v1/agents/test-deploy</code> server-side, which runs
        the full adapter pipeline (health check + sample invoke) and returns
        structured diagnostics inline. This catches CORS, auth, model-id, and
        response-shape bugs that an in-browser fetch can&apos;t.
      </p>

      <h2>Fees</h2>
      <ul>
        <li>
          Marketplace sales: protocol fee defined per-listing on the smart
          contract; the seller&apos;s wallet receives the remainder.
        </li>
        <li>
          Token launches via the <Link href="/docs/launchpad">launchpad</Link>:
          1% swap fee per trade, <strong>0% to Bolty</strong>, the rest splits
          between creator and community treasury per the slider you set at
          launch (immutable after).
        </li>
      </ul>

      <h2>Publishing</h2>
      <ol>
        <li>Visit <Link href="/market/agents/publish">/market/agents/publish</Link>.</li>
        <li>Pick a protocol (webhook / MCP / OpenAI-compatible / sandbox / hybrid).</li>
        <li>
          Fill the URL (and model + key for OpenAI-compatible). Click{' '}
          <strong>Test</strong> — Bolty runs a server-side health check + a
          1-token sample invoke and shows the result inline. Fix any issue
          before continuing.
        </li>
        <li>
          Upload a sandbox bundle if the protocol needs one — BoltyGuard scans
          it on the spot and shows the score + findings before you publish.
        </li>
        <li>
          Set price + optional floor. Hit publish. Your listing goes live
          immediately if the score is ≥ 40, otherwise you have to fix the
          critical findings first.
        </li>
      </ol>

      <h2>Direct API access</h2>
      <pre>
        <code>{`# Get a single listing
GET /api/v1/market/{id}

# Health check it
GET /api/v1/market/{id}/health
→ { healthy: true|false, latencyMs, reason? }

# Invoke (subject to throttle + ownership)
POST /api/v1/market/{id}/invoke
{ "prompt": "…" }

# Server-side test of a candidate endpoint (used by the publish form)
POST /api/v1/agents/test-deploy
{ "protocol": "webhook"|"mcp"|"openai", "endpoint": "...", "model"?: "...", "apiKey"?: "..." }
→ { protocol, health: { healthy, latencyMs, reason?, status? },
                  invoke?: { ok, latencyMs, reply?, error? } }`}</code>
      </pre>
      <p>
        See <Link href="/docs/boltyguard">BoltyGuard docs</Link> for the
        security scan API and{' '}
        <Link href="/docs/launchpad/agent-x">AI agent X account</Link> for the
        auto-launch-tweet integration.
      </p>
    </div>
  );
}
