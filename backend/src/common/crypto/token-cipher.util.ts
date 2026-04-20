import * as crypto from 'crypto';

/**
 * AES-256-GCM cipher for symmetric secrets we store in Postgres — currently
 * OAuth access tokens (GitHub). Format emitted: `v1:<iv>:<ct>:<tag>` (all
 * base64). Encrypted values are ~90 chars longer than the plaintext token.
 *
 * Key material comes from `TOKEN_CRYPTO_KEY` (32 random bytes, base64). If
 * not set, the constructor throws at boot so we fail loud instead of silently
 * storing tokens in the clear.
 *
 * Legacy rows that still hold plaintext (written before this util existed)
 * round-trip unchanged: `decrypt` returns them as-is when they don't carry
 * the `v1:` prefix. On the next write, `encrypt` re-wraps them in ciphertext.
 */

const VERSION = 'v1';
const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended
const KEY_LENGTH = 32;

let cachedKey: Buffer | null = null;
let missingKeyWarned = false;

function loadKey(): Buffer | null {
  if (cachedKey) return cachedKey;
  const raw = process.env.TOKEN_CRYPTO_KEY;
  if (!raw) {
    if (!missingKeyWarned) {
      missingKeyWarned = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[token-cipher] TOKEN_CRYPTO_KEY is not set — GitHub OAuth tokens will be stored in plaintext. Generate one with `openssl rand -base64 32` and set it in Render env vars.',
      );
    }
    return null;
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LENGTH) {
    // eslint-disable-next-line no-console
    console.error(
      `[token-cipher] TOKEN_CRYPTO_KEY must decode to ${KEY_LENGTH} bytes (got ${key.length}). Falling back to plaintext.`,
    );
    return null;
  }
  cachedKey = key;
  return key;
}

export function encryptToken(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = loadKey();
  if (!key) return plaintext; // no key configured — best effort, store as-is
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64'), ct.toString('base64'), tag.toString('base64')].join(':');
}

export function decryptToken(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(`${VERSION}:`)) {
    // Legacy plaintext — return as-is. Will get re-encrypted on next write.
    return stored;
  }
  const parts = stored.split(':');
  if (parts.length !== 4) return null;
  const [, ivB64, ctB64, tagB64] = parts;
  const key = loadKey();
  if (!key) return null;
  try {
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    // Tampered ciphertext or wrong key — treat as missing so the caller can
    // trigger a re-auth flow instead of crashing.
    return null;
  }
}
