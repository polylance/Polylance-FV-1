import { useState, useEffect } from 'react';

/**
 * Custom hook to subscribe to CSS media query changes.
 * Safe for SSR and client-side execution.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    const updateMatch = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', updateMatch);
      return () => mediaQueryList.removeEventListener('change', updateMatch);
    } else {
      // Legacy fallback
      mediaQueryList.addListener(updateMatch);
      return () => mediaQueryList.removeListener(updateMatch);
    }
  }, [query]);

  return matches;
}
