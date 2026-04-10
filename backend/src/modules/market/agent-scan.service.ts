import * as fs from 'fs';
import * as path from 'path';

import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'market');
const MAX_SCAN_BYTES = 100_000; // Read up to 100KB for scanning
const SCAN_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface ScanResult {
  passed: boolean;
  note: string;
  scannedAt: number;
}

@Injectable()
export class AgentScanService {
  private readonly logger = new Logger(AgentScanService.name);
  private readonly anthropic: Anthropic;
  private readonly cache = new Map<string, ScanResult>();

  constructor(private readonly config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY') ?? '',
    });
  }

  /** Scan an uploaded file for malicious code. Returns cached result if available. */
  async scan(fileKey: string, fileName: string): Promise<ScanResult> {
    const cached = this.cache.get(fileKey);
    if (cached && Date.now() - cached.scannedAt < SCAN_CACHE_TTL_MS) return cached;

    const filePath = path.join(UPLOADS_DIR, fileKey);
    if (!fs.existsSync(filePath)) {
      return { passed: false, note: 'File not found on server.', scannedAt: Date.now() };
    }

    let code: string;
    try {
      const buf = Buffer.alloc(MAX_SCAN_BYTES);
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buf, 0, MAX_SCAN_BYTES, 0);
      fs.closeSync(fd);
      code = buf.subarray(0, bytesRead).toString('utf-8');
    } catch {
      return { passed: false, note: 'Could not read file for scanning.', scannedAt: Date.now() };
    }

    try {
      const prompt = `You are a security analyst reviewing code uploaded to a marketplace. Analyze the following code for security threats.

File name: ${fileName}

\`\`\`
${code.slice(0, 8000)}
\`\`\`

Check for:
1. Malware, ransomware, spyware behavior
2. Data exfiltration (sending data to external servers without user consent)
3. Crypto miners
4. Reverse shells or backdoors
5. File system attacks (deleting, encrypting, or corrupting files)
6. Credential harvesting
7. Code injection or eval of untrusted input
8. Environment variable theft (reading and exfiltrating secrets)

This code is meant to be an AI negotiation agent that:
- Reads negotiation context from stdin (JSON)
- Outputs a JSON response: { reply, proposedPrice, action }
- Runs as a subprocess with limited permissions

Respond ONLY with JSON:
{"passed": true|false, "note": "brief explanation (max 150 chars)"}

If the code appears to be a legitimate negotiation agent or general script with no red flags, set passed=true.`;

      const res = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 128,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = (res.content[0] as { type: string; text: string }).text ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const result: ScanResult = {
          passed: Boolean(parsed.passed),
          note: String(parsed.note ?? '').slice(0, 150),
          scannedAt: Date.now(),
        };
        this.cache.set(fileKey, result);
        return result;
      }
    } catch (err) {
      this.logger.error('Claude scan failed', err);
    }

    // If Claude is unavailable, allow upload but flag as unscanned
    const fallback: ScanResult = {
      passed: true,
      note: 'Automated scan unavailable — review manually.',
      scannedAt: Date.now(),
    };
    this.cache.set(fileKey, fallback);
    return fallback;
  }

  /** Retrieve cached scan result without re-scanning */
  getCached(fileKey: string): ScanResult | null {
    return this.cache.get(fileKey) ?? null;
  }
}
