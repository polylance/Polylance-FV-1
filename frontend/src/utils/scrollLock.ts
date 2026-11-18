/**
 * PolyLance Centralized Scroll Lock Utility
 *
 * Implements a single reference-counted scroll-lock manager.
 * Used across modals, drawers, sheets, and overlay dialogs to prevent background scrolling.
 *
 * Guarantees:
 * 1. Reference counted (lock on first count 1, release when count reaches 0).
 * 2. Pauses and resumes Lenis smooth scrolling.
 * 3. Preserves and restores existing inline styles on html/body.
 * 4. StrictMode safe (effect cleanup releases properly on unmount).
 * 5. Dev-mode detection/warning if body overflow: hidden is set with 0 active locks.
 */

import { useEffect, useRef } from 'react';
import { pauseLenis, resumeLenis } from '../hooks/useSmoothScroll';

let activeLockCount = 0;
let originalBodyOverflow: string | null = null;
let originalHtmlOverflow: string | null = null;

export function getScrollLockCount(): number {
  return activeLockCount;
}

export function acquireScrollLock(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  activeLockCount++;
  if (activeLockCount === 1) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    // Do not set overflow: hidden on html unless needed, to avoid layout shifts,
    // but ensure rubber-band containment
    document.documentElement.style.overflow = 'hidden';

    pauseLenis();
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeLockCount = Math.max(0, activeLockCount - 1);

    if (activeLockCount === 0) {
      if (originalBodyOverflow !== null) {
        document.body.style.overflow = originalBodyOverflow;
        originalBodyOverflow = null;
      } else {
        document.body.style.overflow = '';
      }

      if (originalHtmlOverflow !== null) {
        document.documentElement.style.overflow = originalHtmlOverflow;
        originalHtmlOverflow = null;
      } else {
        document.documentElement.style.overflow = '';
      }

      resumeLenis();
    }
  };
}

export function cleanupOrphanScrollLocks(): void {
  if (typeof document === 'undefined') return;
  if (activeLockCount === 0) {
    if (
      document.body.style.overflow === 'hidden' ||
      document.body.style.position === 'fixed' ||
      document.body.style.paddingRight
    ) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.paddingRight = '';
    }
    if (
      document.documentElement.style.overflow === 'hidden' ||
      document.documentElement.style.position === 'fixed'
    ) {
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
    }
  }
}

/**
 * React Hook for component/modal-lifecycle scroll locking.
 * Safe for React 18 / 19 StrictMode double-mounting.
 */
export function useScrollLock(locked: boolean): void {
  const releaseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (locked) {
      releaseRef.current = acquireScrollLock();
    } else if (releaseRef.current) {
      releaseRef.current();
      releaseRef.current = null;
    }

    return () => {
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
      cleanupOrphanScrollLocks();
    };
  }, [locked]);
}

// Dev-mode verification check: warns if body overflow is hidden with 0 locks registered
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  setInterval(() => {
    if (
      document.body.style.overflow === 'hidden' &&
      activeLockCount === 0
    ) {
      console.warn(
        '[PolyLance ScrollLock Warning] document.body.style.overflow is "hidden" but activeLockCount is 0. An unmanaged scroll lock was detected.'
      );
    }
  }, 5000);
}

