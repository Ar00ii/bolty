import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { Injectable, Logger, BadRequestException } from '@nestjs/common';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'market');
const SANDBOX_TIMEOUT_MS = 10_000;

/**
 * ⚠️ SECURITY: Agent Sandbox Limitations
 *
 * This sandbox uses simple process spawning without container isolation.
 * It provides basic protection but is NOT suitable for untrusted code in production.
 *
 * Current limitations:
 * - No memory/CPU limits (except timeout)
 * - Filesystem access not isolated (can read other files)
 * - Can make outbound network requests
 * - No resource quotas
 *
 * For production use with untrusted agents, recommend:
 * - Docker containers with resource limits
 * - gVisor/Firecracker for stronger isolation
 * - Network egress filtering
 * - Filesystem mounts restricted to specific paths
 *
 * See SECURITY FIX #1 for container isolation plan.
 */

export interface SandboxContext {
  event: 'negotiation.start' | 'negotiation.message';
  negotiationId: string;
  listingId: string;
  listing: { title: string; askingPrice: number; currency: string; minPrice?: number | null };
  message?: string;
  proposedPrice?: number;
  history: Array<{ role: string; content: string; proposedPrice?: number | null; timestamp: Date }>;
}

export interface SandboxResponse {
  reply: string;
  proposedPrice?: number;
  action?: 'accept' | 'reject' | 'counter';
}

@Injectable()
export class AgentSandboxService {
  private readonly logger = new Logger(AgentSandboxService.name);

  /** Detect runtime from original filename extension */
  private detectRuntime(fileName: string, fileMimeType: string): 'node' | 'python3' | null {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'js' || ext === 'mjs' || ext === 'cjs') return 'node';
    if (ext === 'ts') return 'node'; // transpiled by ts-node if available, else skip
    if (ext === 'py') return 'python3';
    if (fileMimeType === 'application/javascript' || fileMimeType === 'text/javascript')
      return 'node';
    if (fileMimeType === 'text/x-python' || fileMimeType === 'application/x-python')
      return 'python3';
    return null;
  }

  async run(
    fileKey: string,
    fileName: string,
    fileMimeType: string,
    context: SandboxContext,
  ): Promise<SandboxResponse | null> {
    // Hard gate: this spawn()-based sandbox is a stopgap, not a security
    // boundary. Running arbitrary user-uploaded code on the API host in
    // production is unacceptable — require explicit opt-in via
    // AGENT_SANDBOX_ALLOW_UNSAFE=true (set only for local dev/CI).
    const allowUnsafe = (process.env.AGENT_SANDBOX_ALLOW_UNSAFE || '').toLowerCase() === 'true';
    if (process.env.NODE_ENV === 'production' && !allowUnsafe) {
      this.logger.error('Refusing to run user agent script in production without isolated runtime');
      return null;
    }

    const runtime = this.detectRuntime(fileName, fileMimeType);
    if (!runtime) {
      this.logger.warn(`Unsupported runtime for file: ${fileName}`);
      return null;
    }

    // ── Path traversal prevention ─────────────────────────────────────────
    // Validate that fileKey doesn't escape the uploads directory
    const scriptPath = path.join(UPLOADS_DIR, fileKey);
    const normalizedPath = path.normalize(scriptPath);
    const normalizedDir = path.normalize(UPLOADS_DIR);

    if (!normalizedPath.startsWith(normalizedDir)) {
      this.logger.error(`Path traversal attempt detected: ${fileKey}`);
      throw new BadRequestException('Invalid file key');
    }

    if (!fs.existsSync(scriptPath)) {
      this.logger.warn(`Script file not found: ${fileKey}`);
      return null;
    }

    const input = JSON.stringify(context);

    return new Promise((resolve) => {
      const child = spawn(runtime, [scriptPath], {
        env: {
          // Only expose minimal env vars — no secrets
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          TMPDIR: process.env.TMPDIR,
        },
        timeout: SANDBOX_TIMEOUT_MS,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdin.write(input);
      child.stdin.end();

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        this.logger.warn(`Agent script timed out: ${fileKey}`);
        resolve(null);
      }, SANDBOX_TIMEOUT_MS + 500);

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          this.logger.warn(`Agent script exited with code ${code}: ${stderr.slice(0, 500)}`);
          resolve(null);
          return;
        }
        try {
          // Find the first JSON object in stdout
          const match = stdout.match(/\{[\s\S]*\}/);
          if (!match) {
            resolve(null);
            return;
          }
          const parsed = JSON.parse(match[0]) as SandboxResponse;
          if (!parsed.reply) {
            resolve(null);
            return;
          }
          const action = (['accept', 'reject', 'counter'] as const).includes(
            parsed.action as 'accept' | 'reject' | 'counter',
          )
            ? parsed.action
            : 'counter';
          resolve({
            reply: String(parsed.reply).slice(0, 1000),
            proposedPrice:
              parsed.proposedPrice !== null && parsed.proposedPrice !== undefined
                ? Number(parsed.proposedPrice)
                : undefined,
            action,
          });
        } catch {
          this.logger.warn(`Could not parse agent script output: ${stdout.slice(0, 200)}`);
          resolve(null);
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        this.logger.warn(`Agent script spawn error: ${err.message}`);
        resolve(null);
      });
    });
  }
}
