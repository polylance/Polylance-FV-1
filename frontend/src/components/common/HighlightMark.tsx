import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../media/useDataSaver';

export interface HighlightMarkProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Signature Yellow Highlighter Mark behind a single key word per H2.
 * Animates once on scroll via clip-path reveal; static under reduced motion.
 */
export const HighlightMark: React.FC<HighlightMarkProps> = ({
  children,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    if (el.getBoundingClientRect().top <= window.innerHeight * 1.1) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const isVisible = reducedMotion || revealed;

  return (
    <span ref={ref} className={`relative isolate inline-block ${className}`}>
      <span className="relative z-10 bg-gradient-to-r from-[#0A52B8] via-[#2563EB] to-[#0066FF] bg-clip-text text-transparent">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-[0.04em] h-[0.11em] z-0 bg-gradient-to-r from-[#0A52B8] via-[#2563EB] to-[#38BDF8] rounded-full opacity-90"
        style={{
          transformOrigin: 'left center',
          transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
          transitionProperty: 'transform',
          transitionDuration: reducedMotion ? '0ms' : '520ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </span>
  );
};

export default HighlightMark;
