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
  micro:   0.10,  // icon swaps, checkbox ticks
  fast:    0.14,  // hover states, small badge changes
  normal:  0.18,  // section transitions, tab changes
  medium:  0.22,  // page transitions, dropdowns
  slow:    0.35,  // card reveals, scroll-in sections
  xslow:   0.50,  // number count-ups, progress bars
} as const;

// ─────────────────────────────────────────────────────────────────
// SPRING CONFIG — physical, bouncy-but-controlled
// ─────────────────────────────────────────────────────────────────
export const spring = {
  default: { type: 'spring' as const, stiffness: 450, damping: 35 },
  snappy:  { type: 'spring' as const, stiffness: 520, damping: 38 },
  gentle:  { type: 'spring' as const, stiffness: 300, damping: 30 },
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
// PAGE TRANSITION — fluid GPU fade + slide (Butter smooth 60fps)
// ─────────────────────────────────────────────────────────────────
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -4,
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// SECTION TRANSITION — switching content within same page
// ─────────────────────────────────────────────────────────────────
export const sectionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
} as const;

// ─────────────────────────────────────────────────────────────────
// SCROLL REVEAL — section entering the viewport
// ─────────────────────────────────────────────────────────────────
export const scrollReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.12 },
  transition: { duration: duration.normal, ease: appleEase },
} as const;

// ─────────────────────────────────────────────────────────────────
// STAGGER CONTAINER / ITEM — for card lists, leaderboards, etc.
// ─────────────────────────────────────────────────────────────────
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
} as const;

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: appleEase },
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// DROPDOWN — fast scale-fade entrance
// ─────────────────────────────────────────────────────────────────
export const dropdownVariants = {
  initial: { opacity: 0, y: -4, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: -3, scale: 0.99 },
} as const;

// ─────────────────────────────────────────────────────────────────
// MODAL — crisp scale entrance
// ─────────────────────────────────────────────────────────────────
export const modalOverlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
} as const;

export const modalContentVariants = {
  initial: { opacity: 0, scale: 0.97, y: 10 },
  animate: { opacity: 1, scale: 1,    y: 0 },
  exit:    { opacity: 0, scale: 0.98, y: 6 },
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
