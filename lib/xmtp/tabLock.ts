/**
 * lib/xmtp/tabLock.ts
 *
 * Ensures only one browser tab accesses the active XMTP OPFS database
 * lock at any given time using the Web Locks API (navigator.locks).
 */

const LOCK_NAME = "polylance_xmtp_client_tab_lock";

export interface TabLockResult {
  acquired: boolean;
  release?: () => void;
}

export async function acquireTabLock(
  onLockAcquired: () => Promise<void>,
  onLockConflict: () => void
): Promise<void> {
  if (typeof window === "undefined" || !("locks" in navigator)) {
    // Non-browser or Web Locks API unavailable — proceed directly
    await onLockAcquired();
    return;
  }

  try {
    // Try to acquire exclusive lock without waiting if already held by another tab
    await navigator.locks.request(
      LOCK_NAME,
      { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          onLockConflict();
          return;
        }
        await onLockAcquired();
      }
    );
  } catch (err) {
    console.warn("Web Locks API error:", err);
    await onLockAcquired();
  }
}
