/**
 * PolyLance Blog Studio — Server-Backed Role Hook
 *
 * Implements:
 * 1. Single source of truth for Blog Studio role across avatar menu, mobile menu,
 *    route guard, and studio screens.
 * 2. Server-verified via GET /api/studio/me returning 200 { role, active, address }.
 * 3. Client state machine: unknown -> loading -> loaded(role|null) | error.
 *    Never treats error as null; preserves last-known role on error with exponential backoff + jitter.
 * 4. Cache: Positive results cached up to 10 minutes; negative results at most 30 seconds.
 * 5. sessionStorage persistence for instant rendering after reload (revalidated immediately).
 * 6. Automatic refetches on: sign-in, wallet switch, focus/visibility, reconnect, every 5m,
 *    and when avatar menu opens if data is older than 60s.
 * 7. Dev warning logged when role request fails.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../../../context/Web3Context';
import { useAuth } from '../../../context/AuthContext';
import { fetchStudioMe, StudioAuthError } from '../api';
import { BlogRole } from '../types';

export type RoleState = 'unknown' | 'loading' | 'loaded' | 'error';

export interface BlogRoleSnapshot {
  state: RoleState;
  role: BlogRole | null;
  active: boolean;
  address: string | null;
  sessionId: string | null;
  timestamp: number;
  error: Error | null;
  lastPositiveRole: BlogRole | null;
}

const POSITIVE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const NEGATIVE_CACHE_TTL_MS = 30 * 1000;      // 30 seconds
const MENU_REFETCH_STALE_MS = 60 * 1000;      // 60 seconds
const SESSION_STORAGE_KEY_PREFIX = 'polylance_blog_role_';

// Global shared snapshot for all consumers (Navbar desktop, mobile, guard, studio)
let globalSnapshot: BlogRoleSnapshot = {
  state: 'unknown',
  role: null,
  active: false,
  address: null,
  sessionId: null,
  timestamp: 0,
  error: null,
  lastPositiveRole: null,
};

const listeners = new Set<(snapshot: BlogRoleSnapshot) => void>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn(globalSnapshot);
    } catch {
      /* ignore subscriber error */
    }
  });
}

// In-memory cache by query key `${address.toLowerCase()}:${sessionId}`
interface CacheEntry {
  role: BlogRole | null;
  active: boolean;
  address: string;
  timestamp: number;
}
const queryCache = new Map<string, CacheEntry>();

let activeFetchPromise: Promise<BlogRoleSnapshot> | null = null;
let retryTimeoutId: any = null;
let retryAttempt = 0;

function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      localStorage.getItem('polylance_auth_token') ||
      localStorage.getItem('polylance_session_token') ||
      sessionStorage.getItem('polylance_auth_token') ||
      sessionStorage.getItem('polylance_session_token') ||
      null
    );
  } catch {
    return null;
  }
}

function getStoredPositiveRole(address: string): BlogRole | null {
  if (typeof window === 'undefined' || !address) return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${address.toLowerCase()}`);
    if (raw === 'admin' || raw === 'blog_editor' || raw === 'blog_author') {
      return raw as BlogRole;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persistPositiveRole(address: string, role: BlogRole | null) {
  if (typeof window === 'undefined' || !address) return;
  try {
    const key = `${SESSION_STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
    if (role) {
      sessionStorage.setItem(key, role);
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export function clearBlogRoleState() {
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId);
    retryTimeoutId = null;
  }
  retryAttempt = 0;
  activeFetchPromise = null;
  queryCache.clear();

  if (typeof window !== 'undefined') {
    try {
      // Clear all polylance_blog_role_* from sessionStorage
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith(SESSION_STORAGE_KEY_PREFIX)) {
          sessionStorage.removeItem(k);
        }
      });
    } catch {}
  }

  globalSnapshot = {
    state: 'unknown',
    role: null,
    active: false,
    address: null,
    sessionId: null,
    timestamp: 0,
    error: null,
    lastPositiveRole: null,
  };
  notifyListeners();
}

/**
 * Execute role request against server with state machine transitions.
 */
export async function executeRoleFetch(
  targetAddress: string | null,
  targetSessionId: string | null,
  force = false
): Promise<BlogRoleSnapshot> {
  const normAddress = targetAddress ? targetAddress.toLowerCase().trim() : null;
  const cacheKey = `${normAddress || 'anon'}:${targetSessionId || 'none'}`;

  // If not signed in and no address, resolve to null immediately without error
  if (!normAddress || !targetSessionId) {
    globalSnapshot = {
      state: 'loaded',
      role: null,
      active: false,
      address: normAddress,
      sessionId: null,
      timestamp: Date.now(),
      error: null,
      lastPositiveRole: null,
    };
    notifyListeners();
    return globalSnapshot;
  }

  // Check in-memory cache validity if not forced
  if (!force) {
    const cached = queryCache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      const ttl = cached.role ? POSITIVE_CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS;
      if (age < ttl) {
        globalSnapshot = {
          state: 'loaded',
          role: cached.role,
          active: cached.active,
          address: cached.address,
          sessionId: targetSessionId,
          timestamp: cached.timestamp,
          error: null,
          lastPositiveRole: cached.role || globalSnapshot.lastPositiveRole,
        };
        notifyListeners();
        return globalSnapshot;
      }
    }
  }

  // Deduplicate ongoing request
  if (activeFetchPromise) {
    return activeFetchPromise;
  }

  // Transition to loading while keeping last known role
  const lastPositive = normAddress ? getStoredPositiveRole(normAddress) : null;
  globalSnapshot = {
    ...globalSnapshot,
    state: 'loading',
    address: normAddress,
    sessionId: targetSessionId,
    lastPositiveRole: lastPositive || globalSnapshot.lastPositiveRole,
  };
  notifyListeners();

  activeFetchPromise = (async () => {
    try {
      const res = await fetchStudioMe();
      retryAttempt = 0;

      const isAllowed = Boolean(res.role && res.active);
      const verifiedRole = isAllowed ? res.role : null;

      // Update cache
      queryCache.set(cacheKey, {
        role: verifiedRole,
        active: res.active,
        address: normAddress,
        timestamp: Date.now(),
      });

      // Persist or clear positive role in sessionStorage
      if (verifiedRole) {
        persistPositiveRole(normAddress, verifiedRole);
      } else {
        persistPositiveRole(normAddress, null);
      }

      globalSnapshot = {
        state: 'loaded',
        role: verifiedRole,
        active: res.active,
        address: normAddress,
        sessionId: targetSessionId,
        timestamp: Date.now(),
        error: null,
        lastPositiveRole: verifiedRole,
      };
      notifyListeners();
      return globalSnapshot;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.warn('[PolyLance BlogRole Warning] Role request failed:', err?.message || err);
      }

      const status = err instanceof StudioAuthError ? err.status : 500;

      if (status === 401) {
        // Wait for sign-in; do not retry with backoff on 401
        globalSnapshot = {
          state: 'loaded',
          role: null,
          active: false,
          address: normAddress,
          sessionId: null,
          timestamp: Date.now(),
          error: err instanceof Error ? err : new Error(String(err)),
          lastPositiveRole: null,
        };
        persistPositiveRole(normAddress, null);
        notifyListeners();
        return globalSnapshot;
      }

      // Network / 5xx / 429: Transition to error, preserve last known role, schedule exponential backoff + jitter
      globalSnapshot = {
        ...globalSnapshot,
        state: 'error',
        error: err instanceof Error ? err : new Error(String(err)),
      };
      notifyListeners();

      // Schedule retry with exponential backoff + jitter if under 5 attempts
      if (retryAttempt < 5) {
        retryAttempt++;
        const baseDelay = Math.min(16000, 1000 * Math.pow(2, retryAttempt - 1));
        const jitter = Math.random() * 500;
        const delay = baseDelay + jitter;

        if (retryTimeoutId) clearTimeout(retryTimeoutId);
        retryTimeoutId = setTimeout(() => {
          retryTimeoutId = null;
          executeRoleFetch(normAddress, targetSessionId, true).catch(() => {});
        }, delay);
      }

      return globalSnapshot;
    } finally {
      activeFetchPromise = null;
    }
  })();

  return activeFetchPromise;
}

// Global window event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('polylance:authenticated', () => {
    const token = getSessionToken();
    const addr = localStorage.getItem('polylance_auth_wallet') || localStorage.getItem('polylance_mock_address') || globalSnapshot.address;
    if (addr && token) {
      executeRoleFetch(addr, token, true).catch(() => {});
    }
  });

  window.addEventListener('polylance:signed-out', () => {
    clearBlogRoleState();
  });

  window.addEventListener('online', () => {
    const token = getSessionToken();
    if (globalSnapshot.address && token) {
      executeRoleFetch(globalSnapshot.address, token, true).catch(() => {});
    }
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const token = getSessionToken();
      if (globalSnapshot.address && token) {
        const age = Date.now() - globalSnapshot.timestamp;
        const ttl = globalSnapshot.role ? POSITIVE_CACHE_TTL_MS : NEGATIVE_CACHE_TTL_MS;
        if (age >= ttl) {
          executeRoleFetch(globalSnapshot.address, token, true).catch(() => {});
        }
      }
    }
  });

  // 5-minute background refresh
  setInterval(() => {
    const token = getSessionToken();
    if (globalSnapshot.address && token && document.visibilityState === 'visible') {
      executeRoleFetch(globalSnapshot.address, token, true).catch(() => {});
    }
  }, 5 * 60 * 1000);
}

/**
 * useBlogRole()
 * Primary unified hook for role checks across PolyLance.
 */
export function useBlogRole() {
  const { address, isConnected } = useWeb3();
  const { isAuthenticated, isAuthLoading } = useAuth();
  const [snapshot, setSnapshot] = useState<BlogRoleSnapshot>(() => {
    const norm = address ? address.toLowerCase().trim() : null;
    if (norm && !globalSnapshot.lastPositiveRole) {
      const stored = getStoredPositiveRole(norm);
      if (stored) {
        return {
          ...globalSnapshot,
          lastPositiveRole: stored,
        };
      }
    }
    return globalSnapshot;
  });

  const lastAddressRef = useRef<string | null>(address ? address.toLowerCase().trim() : null);

  useEffect(() => {
    const listener = (newSnap: BlogRoleSnapshot) => {
      setSnapshot(newSnap);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Sync on address change or auth transitions
  useEffect(() => {
    const norm = address ? address.toLowerCase().trim() : null;
    const sessionToken = getSessionToken();

    if (!isConnected || !norm) {
      if (globalSnapshot.address !== null || globalSnapshot.state !== 'unknown') {
        clearBlogRoleState();
      }
      return;
    }

    // Account switch: reset query cache and load new account's stored role
    if (norm !== lastAddressRef.current) {
      lastAddressRef.current = norm;
      const stored = getStoredPositiveRole(norm);
      globalSnapshot = {
        state: stored ? 'loading' : 'unknown',
        role: null,
        active: false,
        address: norm,
        sessionId: sessionToken,
        timestamp: 0,
        error: null,
        lastPositiveRole: stored,
      };
      notifyListeners();
    }

    if (!isAuthLoading && sessionToken) {
      executeRoleFetch(norm, sessionToken).catch(() => {});
    }
  }, [address, isConnected, isAuthenticated, isAuthLoading]);

  // Method to check freshness when opening menus (refetches if older than 60s)
  const checkFreshness = useCallback(() => {
    const norm = address ? address.toLowerCase().trim() : null;
    const sessionToken = getSessionToken();
    if (!norm || !sessionToken) return;

    const age = Date.now() - snapshot.timestamp;
    if (age > MENU_REFETCH_STALE_MS || snapshot.state === 'error' || snapshot.state === 'unknown') {
      executeRoleFetch(norm, sessionToken, true).catch(() => {});
    }
  }, [address, snapshot.timestamp, snapshot.state]);

  const refetch = useCallback(async () => {
    const norm = address ? address.toLowerCase().trim() : null;
    const sessionToken = getSessionToken();
    return executeRoleFetch(norm, sessionToken, true);
  }, [address]);

  // Display conditions:
  // - Show item when role is verified OR when revalidating with last-known positive role
  // - Hide immediately when loaded with role === null
  const effectiveRole = snapshot.role || (snapshot.state === 'loading' ? snapshot.lastPositiveRole : null);
  const hasAccess = Boolean(effectiveRole && (snapshot.role ? snapshot.active : true));

  // Badge label matches exact role
  const badgeLabel: 'Admin' | 'Editor' | 'Author' =
    effectiveRole === 'admin'
      ? 'Admin'
      : effectiveRole === 'blog_editor'
      ? 'Editor'
      : 'Author';

  return {
    state: snapshot.state,
    role: effectiveRole,
    verifiedRole: snapshot.role,
    active: snapshot.active,
    address: snapshot.address,
    loading: snapshot.state === 'loading' || isAuthLoading,
    isLoading: snapshot.state === 'loading' || isAuthLoading,
    isError: snapshot.state === 'error',
    error: snapshot.error,
    status: snapshot.error instanceof StudioAuthError ? snapshot.error.status : (snapshot.state === 'loaded' ? 200 : null),
    hasAccess,
    badgeLabel,
    refetch,
    checkFreshness,
  };
}
