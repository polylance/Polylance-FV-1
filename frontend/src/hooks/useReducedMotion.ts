import { useMediaQuery } from './useMediaQuery';

/**
 * Detects if the user has requested reduced motion via operating system settings.
 * Complies with WCAG 2.1 AA accessibility guidelines.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
