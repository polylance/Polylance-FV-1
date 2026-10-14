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

/**
 * Optional smooth scrolling with Lenis.
 * - Automatically disabled when user prefers reduced motion or data-saver.
 * - Respects sticky navigation and pinned escrow animations.
 * - Complete RAF lifecycle and instance cleanup on unmount.
 */
export function useSmoothScroll(): void {
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');

  useEffect(() => {
    if (!ENABLE_LENIS_SMOOTH_SCROLL || reducedMotion || isChat) return;
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
      });

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
    };
  }, [reducedMotion]);
}
