/**
 * Smoothly scrolls to a specific section element by ID, with an optional highlight pulse effect.
 */
export const scrollToSection = (sectionId: string, delay = 120): void => {
  if (typeof window === 'undefined') return;
  const cleanId = sectionId.replace(/^#/, '').trim();
  if (!cleanId) return;

  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior: ScrollBehavior = prefersReducedMotion ? 'instant' : 'smooth';

  setTimeout(() => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(cleanId);
    if (el) {
      el.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
      el.classList.add('highlight-section-pulse');
      setTimeout(() => el.classList.remove('highlight-section-pulse'), 2400);
    } else {
      // Retry once after additional render cycle in case component was mounting
      setTimeout(() => {
        const retryEl = document.getElementById(cleanId);
        if (retryEl) {
          retryEl.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
          retryEl.classList.add('highlight-section-pulse');
          setTimeout(() => retryEl.classList.remove('highlight-section-pulse'), 2400);
        }
      }, 350);
    }
  }, delay);
};

/**
 * Extracts a target section ID from search params, hash, or route state.
 */
export const extractTargetSection = (
  searchStr?: string,
  hashStr?: string,
  stateObj?: any
): string | null => {
  try {
    if (searchStr) {
      const params = new URLSearchParams(searchStr);
      const s = params.get('section');
      if (s) return s.replace(/^#/, '').trim();
    }
    if (hashStr) {
      // Support both BrowserRouter (#section-id) and legacy HashRouter (#/route#section-id)
      const parts = hashStr.split('#').filter(Boolean);
      if (parts.length > 0) {
        const last = parts[parts.length - 1];
        if (last && !last.startsWith('/')) {
          return last.trim();
        }
      }
    }
    if (stateObj && typeof stateObj === 'object' && stateObj.targetSection) {
      return String(stateObj.targetSection).replace(/^#/, '').trim();
    }
  } catch {}
  return null;
};

