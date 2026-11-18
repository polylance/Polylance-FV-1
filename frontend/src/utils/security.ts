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

export interface DeliverableUrlValidationResult {
  valid: boolean;
  error?: string;
  domain?: string;
}

/**
 * Validates deliverable URLs submitted by freelancers.
 * - Strict HTTPS only (no http, file, javascript, data)
 * - Blocks localhost, 127.0.0.1, ::1, and RFC 1918 private IP ranges
 * - Blocks cloud instance metadata services (169.254.x.x)
 * - Blocks recursive links to the PolyLance application itself
 * - Returns the clean domain for UI display
 */
export function validateDeliverableUrl(rawUrl?: string | null): DeliverableUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { valid: false, error: 'A deliverable URL is required.' };
  }
  const clean = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return { valid: false, error: 'Invalid URL format. Please provide a complete URL starting with https://' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Deliverable link must use HTTPS for security (http://, file://, and javascript: are rejected).' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Reject localhost and local loopback
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    return { valid: false, error: 'Localhost and loopback links (127.0.0.1) cannot be accessed by clients or arbitrators. Please provide a publicly accessible HTTPS link.' };
  }

  // Reject private RFC 1918 / carrier-grade NAT / cloud metadata IP ranges
  const isPrivateIp = (ip: string): boolean => {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return false;
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true; // Link-local / Cloud metadata
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    return false;
  };
  if (isPrivateIp(hostname)) {
    return { valid: false, error: 'Private network and internal cloud metadata IP addresses are strictly prohibited.' };
  }

  // Reject links pointing back to our own app domain
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname.toLowerCase();
    if (hostname === currentHost || (currentHost.includes('polylance') && hostname.includes('polylance'))) {
      return { valid: false, error: 'Deliverable link must point to an external repository or deployed preview, not the PolyLance app itself.' };
    }
  }

  return { valid: true, domain: hostname };
}
