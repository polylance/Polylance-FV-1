import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user's browser has requested Data Saver mode
 * or is on a 2G / slow connection.
 */
export function useDataSaver(): boolean {
  const [isDataSaver, setIsDataSaver] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return false;
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!conn) return false;
    return Boolean(conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g');
  });

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!conn || !conn.addEventListener) return;

    const updateConnection = () => {
      setIsDataSaver(Boolean(conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g'));
    };

    conn.addEventListener('change', updateConnection);
    return () => conn.removeEventListener('change', updateConnection);
  }, []);

  return isDataSaver;
}

export type MotionMode = 'system' | 'reduced' | 'full';

export function getMotionMode(): MotionMode {
  if (typeof window === 'undefined') return 'system';
  const pref = localStorage.getItem('polylance_motion_mode');
  if (pref === 'reduced' || pref === 'full') return pref;
  const legacy = localStorage.getItem('polylance_reduced_motion');
  if (legacy === 'true') return 'reduced';
  if (legacy === 'false') return 'full';
  return 'system';
}

export function setMotionMode(mode: MotionMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('polylance_motion_mode', mode);
  window.dispatchEvent(new CustomEvent('polylance_motion_preference_changed', { detail: mode }));
}

/**
 * Helper to get user motion preference.
 * - 'full' strictly overrides OS reduced-motion to enable animations.
 * - 'reduced' strictly forces reduced-motion.
 * - 'system' delegates to window.matchMedia('(prefers-reduced-motion: reduce)').
 */
export function getStoredOrSystemMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  const mode = getMotionMode();
  if (mode === 'reduced') return true;
  if (mode === 'full') return false; // Overrides system preference for this site only
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setReducedMotionPreference(value: boolean | null): void {
  if (value === null) setMotionMode('system');
  else if (value) setMotionMode('reduced');
  else setMotionMode('full');
}

/**
 * Hook to detect if the user has reduced motion active.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(getStoredOrSystemMotionPreference);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomEvent = () => {
      setReducedMotion(getStoredOrSystemMotionPreference());
    };

    window.addEventListener('polylance_motion_preference_changed', handleCustomEvent);
    window.addEventListener('storage', handleCustomEvent);

    if (typeof window.matchMedia !== 'function') {
      return () => {
        window.removeEventListener('polylance_motion_preference_changed', handleCustomEvent);
        window.removeEventListener('storage', handleCustomEvent);
      };
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      setReducedMotion(getStoredOrSystemMotionPreference());
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(onChange);
    }

    return () => {
      window.removeEventListener('polylance_motion_preference_changed', handleCustomEvent);
      window.removeEventListener('storage', handleCustomEvent);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', onChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(onChange);
      }
    };
  }, []);

  return reducedMotion;
}
