import { Injectable } from '@nestjs/common';

import { McpAdapter } from './protocols/mcp.adapter';
import { OpenAiAdapter } from './protocols/openai.adapter';
import {
  AgentEndpointConfig,
  AgentTestResult,
  IProtocolAdapter,
  ProtocolKind,
} from './protocols/protocol-adapter.interface';
import { WebhookAdapter } from './protocols/webhook.adapter';

/**
 * Server-side "Test deploy" runner. The publish form calls this so we
 * can probe the seller's agent without hitting CORS — most agents block
 * cross-origin from arbitrary browsers, so the in-page fetch we used
 * before failed for a huge fraction of perfectly working endpoints.
 *
 * The service is a thin dispatcher: pick the right adapter for the
 * declared protocol, run a health check + a sample invoke, return a
 * structured result the FE renders inline.
 */
@Injectable()
export class AgentsTestService {
  private readonly adapters: Record<ProtocolKind, IProtocolAdapter>;

  constructor(
    private readonly webhook: WebhookAdapter,
    private readonly mcp: McpAdapter,
    private readonly openai: OpenAiAdapter,
  ) {
    this.adapters = {
      webhook: this.webhook,
      mcp: this.mcp,
      openai: this.openai,
    };
  }

  /** Validate-only path. The form uses this on every keystroke to gate
   *  the "Test live" button without hitting the network. */
  validate(protocol: ProtocolKind, config: AgentEndpointConfig): { ok: boolean; reason?: string } {
    const adapter = this.adapters[protocol];
    if (!adapter) return { ok: false, reason: `unknown_protocol:${protocol}` };
    const reason = adapter.validateConfig(config);
    return reason ? { ok: false, reason } : { ok: true };
  }

  /** Full network test: health check + sample invoke. */
  async test(
    protocol: ProtocolKind,
    config: AgentEndpointConfig,
    samplePrompt: string = 'Say "ok" so we can verify the round-trip.',
  ): Promise<AgentTestResult> {
    const adapter = this.adapters[protocol];
    if (!adapter) {
      return {
        protocol,
        health: { healthy: false, latencyMs: 0, reason: `unknown_protocol:${protocol}` },
      };
    }

    const validation = adapter.validateConfig(config);
    if (validation) {
      return {
        protocol,
        health: { healthy: false, latencyMs: 0, reason: validation },
      };
    }

    const health = await adapter.healthCheck(config);
    if (!health.healthy) {
      // Don't waste an invoke roundtrip if the agent isn't even up.
      return { protocol, health };
    }

    try {
      const out = await adapter.invoke(config, { prompt: samplePrompt });
      const ok = out.reply.length > 0;
      return {
        protocol,
        health,
        invoke: {
          ok,
          latencyMs: out.latencyMs,
          reply: out.reply.slice(0, 500),
          schemaValid: ok,
          error: ok ? undefined : describeInvokeFailure(out.raw),
        },
      };
    } catch (err) {
      return {
        protocol,
        health,
        invoke: {
          ok: false,
          latencyMs: 0,
          schemaValid: false,
          error: err instanceof Error ? err.message : 'unknown',
        },
      };
    }
  }
}

/** Try to surface the most useful single-line error from a raw payload. */
function describeInvokeFailure(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return 'no_reply_field';
  const obj = raw as Record<string, unknown>;
  if (typeof obj.error === 'string') return String(obj.error).slice(0, 200);
  if (obj.error && typeof obj.error === 'object') {
    const e = obj.error as { message?: unknown; code?: unknown };
    if (typeof e.message === 'string') return e.message.slice(0, 200);
    if (typeof e.code !== 'undefined') return `error_code_${e.code}`;
  }
  if (typeof obj.status !== 'undefined') return `http_${obj.status}`;
  return 'no_reply_field';
}
