/**
 * Central Motion Design Tokens & WAAPI Utilities for PolyLance
 *
 * Rules:
 * - Durations: 120ms (hover/press), 240ms (reveal/enter), 600ms (sequence)
 * - Single harmonious ease curve: cubic-bezier(0.22, 1, 0.36, 1)
 * - Animate only transform and opacity (one-shot triggers via IntersectionObserver)
 * - Instant final state under prefers-reduced-motion
 */

export const MOTION = {
  duration: {
    hover: 120,     // hover, active press, micro-state switches
    reveal: 240,    // scroll reveal, drawers, modals, accordions
    sequence: 600,  // multi-step sequences & CountUp
    fast: 120,      // hover, active press, micro-state switches
    standard: 240,  // scroll reveal, drawers, modals, accordions
    slow: 600,      // multi-step sequences & CountUp
    max: 600,
  },
  ease: {
    brand: 'cubic-bezier(0.22, 1, 0.36, 1)',
    brandCss: 'cubic-bezier(0.22, 1, 0.36, 1)',
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  stagger: {
    micro: 40,
    fast: 60,
    cards: 80,
  },
  distance: {
    sm: 6,
    md: 12, // 12px rise + fade for Reveal
    lg: 12,
  },
} as const;

export const TRANSITIONS = {
  cardLift: `transform ${MOTION.duration.fast}ms ${MOTION.ease.brand}, border-color ${MOTION.duration.fast}ms ${MOTION.ease.brand}`,
  fadeQuick: `opacity ${MOTION.duration.fast}ms ${MOTION.ease.brand}`,
  fadeStandard: `opacity ${MOTION.duration.standard}ms ${MOTION.ease.brand}`,
  revealText: `opacity ${MOTION.duration.standard}ms ${MOTION.ease.brand}, transform ${MOTION.duration.standard}ms ${MOTION.ease.brand}`,
  revealCard: `opacity ${MOTION.duration.standard}ms ${MOTION.ease.brand}, transform ${MOTION.duration.standard}ms ${MOTION.ease.brand}`,
  button: `transform ${MOTION.duration.fast}ms ${MOTION.ease.brand}, box-shadow ${MOTION.duration.fast}ms ${MOTION.ease.brand}, background-color ${MOTION.duration.fast}ms ${MOTION.ease.brand}, border-color ${MOTION.duration.fast}ms ${MOTION.ease.brand}`,
};

export interface SequenceStep {
  element: HTMLElement | null;
  keyframes: Keyframe[];
  duration?: number;
  delay?: number;
}

/**
 * Lightweight Web Animations API (WAAPI) sequence helper.
 * Respects reduced motion by applying the final keyframe state immediately.
 */
export function runSequence(
  steps: SequenceStep[],
  prefersReducedMotion: boolean
): () => void {
  const animations: Animation[] = [];

  steps.forEach(({ element, keyframes, duration = MOTION.duration.sequence, delay = 0 }) => {
    if (!element || keyframes.length === 0) return;

    if (prefersReducedMotion || typeof element.animate !== 'function') {
      const finalFrame = keyframes[keyframes.length - 1];
      Object.assign(element.style, finalFrame);
      return;
    }

    const anim = element.animate(keyframes, {
      duration,
      delay,
      easing: MOTION.ease.brand,
      fill: 'forwards',
    });
    animations.push(anim);
  });

  return () => {
    animations.forEach((a) => {
      try {
        a.cancel();
      } catch {
        // Ignore already-finished animations
      }
    });
  };
}
