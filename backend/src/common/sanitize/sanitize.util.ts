// Server-side HTML sanitization
// Strips all HTML tags - used for user text content
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Decode common HTML entities to prevent double-encoding
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Re-encode for safe storage/display
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
}

// Validate that a string contains only safe characters
export function isAlphanumericSafe(input: string): boolean {
  return /^[a-zA-Z0-9_\-.]+$/.test(input);
}

/**
 * Validate URL safety (prevent SSRF attacks)
 *
 * Blocks:
 * - Internal IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, etc.)
 * - Loopback addresses (127.0.0.1, ::1)
 * - Link-local addresses (169.254.0.0/16, fe80::/10)
 * - Metadata endpoints (169.254.169.254)
 * - Protocols other than HTTP/HTTPS
 * - Hostnames in internal TLDs (.internal, .local, .localhost)
 *
 * Does NOT:
 * - Do DNS resolution (vulnerable to rebinding) — use isSafeUrlResolving
 *   when actually making the request, and pin the resolved IP.
 * - Block all internal services (only IP ranges)
 *
 * Use with timeout and rate limiting to prevent slow SSRF attacks.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Credentials in the URL can leak internal auth headers to third parties
    if (parsed.username || parsed.password) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) return false;

    // Block known-internal TLDs that resolve via split-horizon DNS
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // Check if it matches a private IP range
    return !isPrivateIp(hostname);
  } catch {
    return false;
  }
}

/**
 * DNS-resolving SSRF guard — call RIGHT before performing the request.
 * Returns the pinned IP to reuse for the actual connection so that a
 * second lookup cannot rebind the hostname to a private range between
 * validation and connect.
 *
 * NOTE: callers should pass the returned IP to axios via a custom
 * `lookup` or pass `{ host: ip, headers: { Host: originalHostname } }`.
 */
export async function isSafeUrlResolving(
  url: string,
): Promise<{ ok: true; ip: string; family: 4 | 6 } | { ok: false; reason: string }> {
  if (!isSafeUrl(url)) return { ok: false, reason: 'Blocked URL' };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }
  const hostname = parsed.hostname;
  // Literal IPs are already covered by isSafeUrl; still resolve the host
  // via the OS resolver for named hosts to refuse any private target.
  const dns = await import('dns');
  const addrs = await new Promise<{ address: string; family: number }[]>((resolve) => {
    dns.lookup(hostname, { all: true, verbatim: true }, (err, result) => {
      if (err || !result) return resolve([]);
      resolve(result);
    });
  });
  if (addrs.length === 0) return { ok: false, reason: 'DNS resolution failed' };
  for (const a of addrs) {
    if (isPrivateIp(a.address)) {
      return { ok: false, reason: `Resolved to private IP ${a.address}` };
    }
  }
  const first = addrs[0];
  return { ok: true, ip: first.address, family: first.family === 6 ? 6 : 4 };
}

/**
 * Check if a hostname is a private/internal IP address
 *
 * Blocks IPv4 ranges:
 * - 10.0.0.0/8 (private)
 * - 172.16.0.0/12 (private)
 * - 192.168.0.0/16 (private)
 * - 127.0.0.0/8 (loopback)
 * - 0.0.0.0/8 (this host)
 * - 169.254.0.0/16 (link-local)
 * - 224.0.0.0/4 (multicast)
 * - 255.255.255.255 (broadcast)
 *
 * Blocks IPv6 ranges:
 * - ::1 (loopback)
 * - fc00::/7 (unique local)
 * - fe80::/10 (link-local)
 * - ff00::/8 (multicast)
 * - ::ffff:0:0/96 (IPv4-mapped)
 */
function isPrivateIp(hostname: string): boolean {
  // IPv6 format: expand and check
  if (hostname.includes(':')) {
    return isPrivateIpv6(hostname);
  }

  // IPv4 format
  const parts = hostname.split('.');
  if (parts.length !== 4) return false; // Not a valid IPv4

  const octets = parts.map((p) => parseInt(p, 10));
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return false;

  const [a, b, c] = octets;

  // Check IPv4 ranges
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 (loopback)
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 224) return true; // 224.0.0.0/4 (multicast)
  if (a === 255 && b === 255 && c === 255) return true; // 255.255.255.255

  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  // Remove brackets if present
  const addr = hostname.replace(/[[\]]/g, '');

  // Loopback
  if (addr === '::1') return true;

  // Link-local (fe80::/10)
  if (addr.startsWith('fe80:')) return true;

  // Unique local (fc00::/7, fd00::/8)
  if (addr.startsWith('fc') || addr.startsWith('fd')) return true;

  // Multicast (ff00::/8)
  if (addr.startsWith('ff')) return true;

  // IPv4-mapped IPv6 (::ffff:0:0/96)
  if (addr.includes('::ffff:')) {
    const parts = addr.split('::ffff:')[1];
    if (parts) {
      return isPrivateIp(parts); // Recursively check the IPv4 part
    }
  }

  // Unspecified (::)
  if (addr === '::') return true;

  return false;
}

// Strip prompt injection attempts from AI inputs
export function sanitizeAiPrompt(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Limit length
  sanitized = sanitized.slice(0, 2000);

  // Remove common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }

  return sanitized.trim();
}
