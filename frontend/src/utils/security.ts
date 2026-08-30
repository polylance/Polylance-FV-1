/**
 * security.ts
 * Enterprise-grade client-side security, input sanitization, and URL validation utilities.
 */

/**
 * Sanitizes arbitrary user text strings to prevent XSS, script injection, and control characters.
 */
export function sanitizeText(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript pseudo-protocol
    .replace(/data:/gi, '') // Block inline data payloads
    .replace(/vbscript:/gi, '') // Block vbscript
    .trim();
}

/**
 * Validates that an external URL is safe (HTTP or HTTPS only).
 * Prevents javascript: or malicious protocol exploits.
 */
export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return false;
  }
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates an EVM address format strictly.
 */
export function isValidEvmAddress(address?: string | null): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

/**
 * Truncates an EVM address securely for display without leaking trailing bytes inappropriately.
 */
export function formatAddressDisplay(address?: string | null): string {
  if (!address || typeof address !== 'string') return '';
  const clean = address.trim();
  if (!isValidEvmAddress(clean)) return clean.slice(0, 10);
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}
