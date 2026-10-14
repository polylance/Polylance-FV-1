/**
 * PolyLance Centralized Shared Poller & In-Flight Request Deduplicator
 * Solves 429 Too Many Requests by:
 * 1. Reusing in-flight promises across concurrent callers
 * 2. Pausing polling when document.hidden === true
 * 3. Exponential backoff on 429 / honoring Retry-After
 * 4. Storing last-known-good responses for graceful offline fallback
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SharedPollerService {
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private backoffDelays: Map<string, number> = new Map(); // endpoint -> ms
  private backoffUntil: Map<string, number> = new Map(); // endpoint -> timestamp ms

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Document became visible - reset transient backoffs and trigger refresh
          this.backoffDelays.clear();
          this.backoffUntil.clear();
        }
      });
    }
  }

  /**
   * Fetches JSON with deduplication, cache-on-429, and background pausing.
   */
  async fetchDeduplicated<T = any>(
    url: string,
    options: RequestInit = {},
    optionsExtra?: {
      cacheTtlMs?: number;
      skipIfHidden?: boolean;
    }
  ): Promise<T> {
    const skipIfHidden = optionsExtra?.skipIfHidden ?? true;
    const cacheTtlMs = optionsExtra?.cacheTtlMs ?? 5000;

    // 1. If tab is in background and skipIfHidden is enabled, return cached data if present
    if (typeof document !== 'undefined' && document.hidden && skipIfHidden) {
      const cached = this.cache.get(url);
      if (cached) return cached.data;
    }

    // 2. Check if currently in exponential backoff from a previous 429
    const now = Date.now();
    const until = this.backoffUntil.get(url) || 0;
    if (now < until) {
      const cached = this.cache.get(url);
      if (cached) return cached.data;
      throw new Error(`Rate limit cooldown active. Try again in ${Math.ceil((until - now) / 1000)}s`);
    }

    // 3. Request Deduplication: If this exact request is currently running, reuse the promise
    const dedupeKey = `${options.method || 'GET'}:${url}:${options.headers ? JSON.stringify(options.headers) : ''}`;
    const inFlight = this.inFlightRequests.get(dedupeKey);
    if (inFlight) {
      return inFlight as Promise<T>;
    }

    const requestPromise = (async () => {
      try {
        const res = await fetch(url, options);

        if (res.status === 429) {
          // Handle 429 Too Many Requests gracefully
          const retryAfterHeader = res.headers.get('Retry-After');
          let delayMs = 4000;
          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
              delayMs = parsedSeconds * 1000;
            }
          } else {
            const prevDelay = this.backoffDelays.get(url) || 2000;
            delayMs = Math.min(prevDelay * 2, 60000); // 2s -> 4s -> 8s -> ... max 60s
          }
          this.backoffDelays.set(url, delayMs);
          this.backoffUntil.set(url, Date.now() + delayMs);
          console.warn(`[SharedPoller] 429 Rate limit on ${url}. Backing off for ${delayMs}ms`);

          // If we have cached data, return it without throwing a loud error
          const cached = this.cache.get(url);
          if (cached) return cached.data;
          return null;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        // Reset backoff on success
        this.backoffDelays.delete(url);
        this.backoffUntil.delete(url);
        this.cache.set(url, { data, timestamp: Date.now() });
        return data;
      } finally {
        this.inFlightRequests.delete(dedupeKey);
      }
    })();

    this.inFlightRequests.set(dedupeKey, requestPromise);
    return requestPromise;
  }

  /**
   * Clears cache for an endpoint or all endpoints.
   */
  invalidateCache(urlPrefix?: string) {
    if (!urlPrefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(urlPrefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const sharedPoller = new SharedPollerService();
