/**
 * PolyLance Centralized API Client
 * - Unified fetch wrapper with credentials: 'include'
 * - Strips identity query parameters (identity comes ONLY from authenticated session)
 * - Intercepts 401 to trigger session-expired events and stop looping pollers
 * - Handles 429 exponential backoff with Retry-After honoring
 */

export interface ApiClientOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Global listeners for auth events
type AuthEventListener = (event: { status: number; code?: string }) => void;
const authListeners = new Set<AuthEventListener>();

export function onAuthEvent(listener: AuthEventListener): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function notifyAuthEvent(event: { status: number; code?: string }) {
  authListeners.forEach((l) => {
    try { l(event); } catch {}
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('polylance:auth-event', { detail: event }));
  }
}

// 429 backoff registry
const backoffDelays = new Map<string, number>();
const backoffUntil = new Map<string, number>();

export function getBaseApiUrl(): string {
  if (typeof window !== 'undefined') {
    // If running in development (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return (import.meta.env.VITE_BACKEND_SYNC_URL || 'http://localhost:3001').replace(/\/$/, '');
    }
    // Production / Staging
    return (import.meta.env.VITE_BACKEND_SYNC_URL || 'https://polylance-fv-1-45wy.onrender.com').replace(/\/$/, '');
  }
  return 'http://localhost:3001';
}

const ALLOWED_IDENTITY_PARAM_ENDPOINTS = [
  '/api/auth/nonce',
  '/api/account/balances',
];

/**
 * Clean URL by removing ?address= and ?wallet= identity params.
 * Identity MUST come strictly from the authenticated server session,
 * except for public query endpoints like /api/account/balances and /api/auth/nonce.
 */
export function sanitizeApiUrl(url: string): string {
  try {
    const isFullUrl = url.startsWith('http://') || url.startsWith('https://');
    const dummyBase = 'http://dummy.local';
    const parsed = new URL(url, dummyBase);
    const isWhitelisted = ALLOWED_IDENTITY_PARAM_ENDPOINTS.some((ep) => parsed.pathname.includes(ep));
    if (!isWhitelisted) {
      parsed.searchParams.delete('address');
      parsed.searchParams.delete('wallet');
    }
    const pathAndSearch = parsed.pathname + (parsed.search ? parsed.search : '');
    return isFullUrl ? `${parsed.origin}${pathAndSearch}` : pathAndSearch;
  } catch {
    if (ALLOWED_IDENTITY_PARAM_ENDPOINTS.some((ep) => url.includes(ep))) return url;
    return url.replace(/([?&])(address|wallet)=[^&]*&?/g, '$1').replace(/[?&]$/, '');
  }
}

export async function apiClient<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const baseUrl = getBaseApiUrl();
  const rawUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const cleanUrl = sanitizeApiUrl(rawUrl);

  // 1. Check active 429 backoff
  const now = Date.now();
  const until = backoffUntil.get(cleanUrl) || 0;
  if (now < until) {
    const remainingSec = Math.ceil((until - now) / 1000);
    throw new ApiError(`Rate limit cooldown active. Retry in ${remainingSec}s`, 429, 'RATE_LIMITED');
  }

  // 2. Build headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  // Anti-CSRF header: custom header forces CORS preflight for cross-origin requests
  headers.set('X-Requested-With', 'XMLHttpRequest');
  headers.set('X-PolyLance-Client', 'web-client');

  const token = typeof window !== 'undefined' ? localStorage.getItem('polylance_auth_token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always send and accept session cookies
  };

  try {
    const res = await fetch(cleanUrl, fetchOptions);

    // Handle 429 Too Many Requests
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      let delayMs = 4000;
      if (retryAfter) {
        const sec = parseInt(retryAfter, 10);
        if (!isNaN(sec) && sec > 0) delayMs = sec * 1000;
      } else {
        const prev = backoffDelays.get(cleanUrl) || 2000;
        delayMs = Math.min(prev * 2, 60000);
      }
      backoffDelays.set(cleanUrl, delayMs);
      backoffUntil.set(cleanUrl, Date.now() + delayMs);
      throw new ApiError('Too many requests. Please slow down.', 429, 'RATE_LIMITED');
    }

    // Handle 401 Unauthorized
    if (res.status === 401) {
      let code = 'NO_SESSION';
      let errorMsg = 'Authentication required';
      try {
        const errJson = await res.json();
        if (errJson.code) code = errJson.code;
        if (errJson.error) errorMsg = errJson.error;
      } catch {}

      notifyAuthEvent({ status: 401, code });
      throw new ApiError(errorMsg, 401, code);
    }

    // Handle 403 Forbidden
    if (res.status === 403) {
      let code = 'FORBIDDEN';
      let errorMsg = 'Access denied';
      try {
        const errJson = await res.json();
        if (errJson.code) code = errJson.code;
        if (errJson.error) errorMsg = errJson.error;
      } catch {}
      throw new ApiError(errorMsg, 403, code);
    }

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
      let data: any = null;
      try {
        data = await res.json();
        if (data && data.error) errorMsg = data.error;
      } catch {}
      throw new ApiError(errorMsg, res.status, undefined, data);
    }

    // Reset 429 backoff on success
    backoffDelays.delete(cleanUrl);
    backoffUntil.delete(cleanUrl);

    // Parse JSON if response is json
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return (await res.text()) as any;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Network request failed', 0, 'NETWORK_ERROR');
  }
}

apiClient.get = <T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T = any>(endpoint: string, body?: any, options?: ApiClientOptions): Promise<T> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined && typeof body !== 'string' ? JSON.stringify(body) : body,
  });

apiClient.put = <T = any>(endpoint: string, body?: any, options?: ApiClientOptions): Promise<T> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined && typeof body !== 'string' ? JSON.stringify(body) : body,
  });

apiClient.delete = <T = any>(endpoint: string, options?: ApiClientOptions): Promise<T> =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });
