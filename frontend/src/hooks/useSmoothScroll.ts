import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
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
 * Programmatic smooth scroll to any element or selector
 */
export function smoothScrollTo(target: string | HTMLElement, offset = -80): void {
  if (activeLenisInstance) {
    activeLenisInstance.scrollTo(target, { offset, duration: 1.1 });
  } else if (typeof document !== 'undefined') {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

/**
 * High-performance smooth scrolling with Lenis.
 * - Automatically disabled when user prefers reduced motion or data-saver.
 * - Pauses when modals/drawers lock the body.
 * - Smoothly navigates in-page anchor links (#why-polylance, #faq, etc.).
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
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        infinite: false,
        prevent: (node: HTMLElement) => {
          return Boolean(
            node &&
              node.closest &&
              node.closest('[data-lenis-prevent], [data-lenis-prevent-wheel]')
          );
        },
      });

      activeLenisInstance = lenis;

      const onRaf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(onRaf);
      };

      rafId = requestAnimationFrame(onRaf);

      // Intercept in-page anchor links for silky smooth animation
      const handleAnchorClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement)?.closest('a');
        if (!target) return;
        const href = target.getAttribute('href');
        if (!href) return;
        const hashIndex = href.indexOf('#');
        if (hashIndex === -1) return;
        const pathPart = href.slice(0, hashIndex);
        const hashPart = href.slice(hashIndex);
        const isCurrentRoot = pathPart === '' || pathPart === '/' || pathPart === window.location.pathname;
        if (isCurrentRoot && hashPart.length > 1) {
          const el = document.querySelector(hashPart);
          if (el) {
            e.preventDefault();
            lenis?.scrollTo(el as HTMLElement, { offset: -116, duration: 1.0 });
          }
        }
      };

      document.addEventListener('click', handleAnchorClick);

      return () => {
        document.removeEventListener('click', handleAnchorClick);
        if (rafId) cancelAnimationFrame(rafId);
        lenis?.destroy();
        if (activeLenisInstance === lenis) {
          activeLenisInstance = null;
        }
      };
    } catch {
      // Graceful fallback
    }
  }, [reducedMotion, isChat, isStudio]);

  // Route transition scroll reset
  useEffect(() => {
    if (activeLenisInstance && !location.hash) {
      activeLenisInstance.scrollTo(0, { immediate: true });
    }
  }, [location.pathname, location.hash]);
}
