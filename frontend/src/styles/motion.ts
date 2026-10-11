/**
 * Central Motion Design Tokens for PolyLance
 *
 * Rules:
 * - Durations: 200ms (fast/micro), 350ms (standard/interaction), 600ms (entrance/scrolling), capped at 800ms
 * - Single harmonious ease curve: cubic-bezier(0.22, 1, 0.36, 1)
 * - Animate only transform and opacity whenever possible
 * - Completely disable or simplify under reduced-motion / data-saver
 */

export const MOTION = {
  duration: {
    fast: 200,      // ms: buttons, tooltips, chips, micro-interactions
    standard: 350,  // ms: cards, drawer, modal, hover lifts
    slow: 600,      // ms: scroll reveal, section entrance
    max: 800,       // ms: hard ceiling for any animation
  },
  ease: {
    // Brand curve: snappy start with silky deceleration
    brand: 'cubic-bezier(0.22, 1, 0.36, 1)',
    brandCss: 'cubic-bezier(0.22, 1, 0.36, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  stagger: {
    micro: 50,      // ms
    fast: 80,       // ms: text elements (eyebrow, headline, subhead)
    cards: 100,     // ms: card grid items
  },
  distance: {
    sm: 8,          // px
    md: 16,         // px: section header rise
    lg: 24,         // px: card entrance rise
  },
} as const;

/**
 * Standard CSS transition strings for consistent motion across all components
 */
export const TRANSITIONS = {
  cardLift: `transform ${MOTION.duration.standard}ms ${MOTION.ease.brand}, box-shadow ${MOTION.duration.standard}ms ${MOTION.ease.brand}, border-color ${MOTION.duration.standard}ms ${MOTION.ease.brand}`,
  fadeQuick: `opacity ${MOTION.duration.fast}ms ${MOTION.ease.brand}`,
  fadeStandard: `opacity ${MOTION.duration.standard}ms ${MOTION.ease.brand}`,
  revealText: `opacity ${MOTION.duration.slow}ms ${MOTION.ease.brand}, transform ${MOTION.duration.slow}ms ${MOTION.ease.brand}`,
  revealCard: `opacity ${MOTION.duration.slow}ms ${MOTION.ease.brand}, transform ${MOTION.duration.slow}ms ${MOTION.ease.brand}`,
  button: `transform ${MOTION.duration.fast}ms ${MOTION.ease.brand}, background-color ${MOTION.duration.fast}ms ${MOTION.ease.brand}, border-color ${MOTION.duration.fast}ms ${MOTION.ease.brand}`,
};
