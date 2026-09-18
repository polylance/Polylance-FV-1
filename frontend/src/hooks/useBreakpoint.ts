import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointState {
  isMobile: boolean;    // < 640px
  isCompact: boolean;   // < 390px (compact phones)
  isTablet: boolean;    // 640px - 1023px
  isDesktop: boolean;   // >= 1024px (untouched desktop layout)
  breakpoint: Breakpoint;
  width: number;
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isCompact: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'lg',
        width: 1200,
      };
    }

    const w = window.innerWidth;
    return getBreakpointState(w);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: number;
    const handleResize = () => {
      // Debounce slightly to minimize thrashing on orientation change
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setState(getBreakpointState(window.innerWidth));
      }, 50);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}

function getBreakpointState(w: number): BreakpointState {
  let breakpoint: Breakpoint = 'xs';
  if (w >= 1536) breakpoint = '2xl';
  else if (w >= 1280) breakpoint = 'xl';
  else if (w >= 1024) breakpoint = 'lg';
  else if (w >= 768) breakpoint = 'md';
  else if (w >= 640) breakpoint = 'sm';

  return {
    isMobile: w < 640,
    isCompact: w < 390,
    isTablet: w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    breakpoint,
    width: w,
  };
}
