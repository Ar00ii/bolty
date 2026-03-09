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
  return /^[a-zA-Z0-9_\-\.]+$/.test(input);
}

// Validate URL safety (prevent SSRF)
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['https:', 'http:'];
    if (!allowedProtocols.includes(parsed.protocol)) return false;

    // Block internal/private IP ranges (SSRF prevention)
    const hostname = parsed.hostname;
    const blocked = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^::1$/,
      /^0\.0\.0\.0$/,
      /^169\.254\./,
      /^fc00:/i,
      /^fe80:/i,
    ];

    return !blocked.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
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
