import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { useReducedMotion } from '../media/useDataSaver';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-LINE TOGGLE FOR LENIS SMOOTH SCROLLING
 * Set to false to disable smooth scrolling entirely.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const ENABLE_LENIS_SMOOTH_SCROLL = true;

/** Global reference to active Lenis instance for modal/drawer scroll-locking */
export let activeLenisInstance: Lenis | null = null;

let lockCount = 0;

/** Pause Lenis smooth scrolling (e.g. when a modal, drawer, or sheet locks the body) */
export function pauseLenis(): void {
  lockCount++;
  if (activeLenisInstance && lockCount > 0) {
    activeLenisInstance.stop();
  }
}

/** Resume Lenis smooth scrolling (when all modals/drawers close) */
export function resumeLenis(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (activeLenisInstance && lockCount === 0) {
    activeLenisInstance.start();
  }
}

/**
 * Optional smooth scrolling with Lenis.
 * - Automatically disabled when user prefers reduced motion or data-saver.
 * - Pauses when modals/drawers lock the body.
 * - Ignores nested scroll containers marked with data-lenis-prevent.
 * - Complete RAF lifecycle and instance cleanup on unmount.
 */
export function useSmoothScroll(): void {
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const isStudio = location.pathname.startsWith('/studio');

  useEffect(() => {
    if (!ENABLE_LENIS_SMOOTH_SCROLL || reducedMotion || isChat || isStudio) {
      if (activeLenisInstance) {
        activeLenisInstance.destroy();
        activeLenisInstance = null;
      }
      return;
    }
    if (typeof window === 'undefined') return;

    let lenis: Lenis | null = null;
    let rafId: number | null = null;

    try {
      lenis = new Lenis({
        duration: 1.0,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        infinite: false,
        prevent: (node: HTMLElement) => {
          return Boolean(node && node.closest && node.closest('[data-lenis-prevent]'));
        },
      });

      activeLenisInstance = lenis;

      const onRaf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(onRaf);
      };

      rafId = requestAnimationFrame(onRaf);
    } catch {
      // Graceful fallback if WebGL or window is unavailable
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
      if (activeLenisInstance === lenis) {
        activeLenisInstance = null;
      }
    };
  }, [reducedMotion, isChat, location.pathname]);
}
