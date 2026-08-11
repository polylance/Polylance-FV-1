/**
 * PolyLance Motion Token System
 * Apple-inspired motion language — centralized constants for consistent
 * interaction quality across the entire application.
 */

// ─────────────────────────────────────────────────────────────────
// PRIMARY EASING — Apple's signature spring-like cubic bezier
// ─────────────────────────────────────────────────────────────────
export const appleEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─────────────────────────────────────────────────────────────────
// DURATIONS
// ─────────────────────────────────────────────────────────────────
export const duration = {
  micro:   0.18,  // icon swaps, checkbox ticks
  fast:    0.22,  // hover states, small badge changes
  normal:  0.32,  // section transitions, tab changes
  medium:  0.38,  // page transitions, dropdowns
  slow:    0.55,  // card reveals, scroll-in sections
  xslow:   0.80,  // number count-ups, progress bars
} as const;

// ─────────────────────────────────────────────────────────────────
// SPRING CONFIG — physical, bouncy-but-controlled
// ─────────────────────────────────────────────────────────────────
export const spring = {
  default: { type: 'spring' as const, stiffness: 420, damping: 32 },
  snappy:  { type: 'spring' as const, stiffness: 500, damping: 36 },
  gentle:  { type: 'spring' as const, stiffness: 280, damping: 28 },
};

// ─────────────────────────────────────────────────────────────────
// TRANSITIONS — pre-built for common use cases
// ─────────────────────────────────────────────────────────────────
export const transition = {
  micro:     { duration: duration.micro,  ease: appleEase },
  fast:      { duration: duration.fast,   ease: appleEase },
  normal:    { duration: duration.normal, ease: appleEase },
  medium:    { duration: duration.medium, ease: appleEase },
  slow:      { duration: duration.slow,   ease: appleEase },
  page:      { duration: duration.medium, ease: appleEase },
  spring:    spring.default,
  springSnappy: spring.snappy,
} as const;

// ─────────────────────────────────────────────────────────────────
// PAGE TRANSITION — fade + slide + blur (Apple-style route change)
// ─────────────────────────────────────────────────────────────────
export const pageVariants = {
  initial: {
    opacity: 0,
    x: 18,
    scale: 0.985,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    x: -12,
    scale: 0.99,
    filter: 'blur(8px)',
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// SECTION TRANSITION — switching content within same page
// ─────────────────────────────────────────────────────────────────
export const sectionVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -8, filter: 'blur(4px)' },
} as const;

// ─────────────────────────────────────────────────────────────────
// SCROLL REVEAL — section entering the viewport
// ─────────────────────────────────────────────────────────────────
export const scrollReveal = {
  initial: { opacity: 0, y: 20, filter: 'blur(6px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: duration.slow, ease: appleEase },
} as const;

// ─────────────────────────────────────────────────────────────────
// STAGGER CONTAINER / ITEM — for card lists, leaderboards, etc.
// ─────────────────────────────────────────────────────────────────
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
} as const;

export const staggerItem = {
  hidden: { opacity: 0, y: 14, filter: 'blur(5px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: duration.slow, ease: appleEase },
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// DROPDOWN — fast blur-fade scale-in
// ─────────────────────────────────────────────────────────────────
export const dropdownVariants = {
  initial: { opacity: 0, y: -6, scale: 0.98, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -4, scale: 0.99, filter: 'blur(2px)' },
} as const;

// ─────────────────────────────────────────────────────────────────
// MODAL — scale + blur entrance
// ─────────────────────────────────────────────────────────────────
export const modalOverlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
} as const;

export const modalContentVariants = {
  initial: { opacity: 0, scale: 0.96, y: 12, filter: 'blur(8px)' },
  animate: { opacity: 1, scale: 1,    y: 0,  filter: 'blur(0px)' },
  exit:    { opacity: 0, scale: 0.97, y: 8,  filter: 'blur(6px)' },
} as const;

// ─────────────────────────────────────────────────────────────────
// TOAST / NOTIFICATION — slide in from side
// ─────────────────────────────────────────────────────────────────
export const toastVariants = {
  initial: { opacity: 0, x: 30, scale: 0.96 },
  animate: { opacity: 1, x: 0,  scale: 1    },
  exit:    { opacity: 0, x: 20, scale: 0.98 },
} as const;

// ─────────────────────────────────────────────────────────────────
// METRIC / NUMBER — fade + slide up on appear
// ─────────────────────────────────────────────────────────────────
export const metricVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: appleEase } },
} as const;

// ─────────────────────────────────────────────────────────────────
// FADE ONLY — simplest entrance, no movement
// ─────────────────────────────────────────────────────────────────
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
} as const;
