/**
 * PolyLance Human Interface Motion System
 * Motion is purposeful, brief, precise, and tied to user action.
 * Shows where elements emerge from and recede to. Reversible and interruptible.
 */

// ─────────────────────────────────────────────────────────────────
// EASING TOKENS
// ─────────────────────────────────────────────────────────────────
// Movement and fades
export const easeStandard: [number, number, number, number] = [0.2, 0, 0, 1];

// Smooth deceleration for sheets, drawers, popovers
export const easeSheet: [number, number, number, number] = [0.32, 0.72, 0, 1];

// Dismissal / exit curves
export const easeExit: [number, number, number, number] = [0.4, 0, 1, 1];

export const fluidEase = easeStandard;

// ─────────────────────────────────────────────────────────────────
// DURATIONS (in seconds)
// ─────────────────────────────────────────────────────────────────
export const duration = {
  press:   0.10,  // button scale/press feedback (100ms)
  micro:   0.10,  // icon swaps, toggle ticks
  hover:   0.15,  // hover states (150ms)
  state:   0.15,  // list selection crossfade (150ms)
  fast:    0.15,  // state changes
  popover: 0.18,  // popover reveal (180ms)
  page:    0.20,  // page transition crossfade (200ms)
  normal:  0.20,  // standard transitions
  sheet:   0.28,  // bottom sheet slide-up (280ms)
  modal:   0.28,  // dialog scale-up (280ms)
  counter: 0.80,  // initial number count-up on first view (800ms)
} as const;

// ─────────────────────────────────────────────────────────────────
// SPRING CONFIG
// ─────────────────────────────────────────────────────────────────
export const spring = {
  default: { type: 'spring' as const, stiffness: 450, damping: 35 },
  snappy:  { type: 'spring' as const, stiffness: 520, damping: 38 },
  gentle:  { type: 'spring' as const, stiffness: 300, damping: 30 },
};

// ─────────────────────────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────────────────────────
export const transition = {
  press:     { duration: duration.press,   ease: easeStandard },
  hover:     { duration: duration.hover,   ease: easeStandard },
  state:     { duration: duration.state,   ease: easeStandard },
  micro:     { duration: duration.micro,   ease: easeStandard },
  fast:      { duration: duration.fast,    ease: easeStandard },
  popover:   { duration: duration.popover, ease: easeSheet },
  normal:    { duration: duration.normal,  ease: easeStandard },
  medium:    { duration: duration.normal,  ease: easeStandard },
  slow:      { duration: duration.modal,   ease: easeStandard },
  base:      { duration: duration.normal,  ease: easeStandard },
  page:      { duration: duration.page,    ease: easeStandard },
  sheet:     { duration: duration.sheet,   ease: easeSheet },
  modal:     { duration: duration.modal,   ease: easeStandard },
  spring:    spring.default,
  springSnappy: spring.snappy,
} as const;

export const transitions = transition;

// ─────────────────────────────────────────────────────────────────
// PAGE TRANSITION — 200ms smooth cross-fade + micro-slide
// ─────────────────────────────────────────────────────────────────
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.page,
      ease: easeStandard,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.12,
      ease: easeExit,
    },
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// SECTION TRANSITION — switching content within same page
// ─────────────────────────────────────────────────────────────────
export const sectionVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easeStandard } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.1, ease: easeExit } },
} as const;

// ─────────────────────────────────────────────────────────────────
// SCROLL REVEAL — subtle section entry
// ─────────────────────────────────────────────────────────────────
export const scrollReveal = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: duration.normal, ease: easeStandard },
} as const;

// ─────────────────────────────────────────────────────────────────
// STAGGER CONTAINER / ITEM
// ─────────────────────────────────────────────────────────────────
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
} as const;

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast, ease: easeStandard },
  },
} as const;

// ─────────────────────────────────────────────────────────────────
// POPOVER & DROPDOWN — 180ms fade + 4px shift from trigger
// ─────────────────────────────────────────────────────────────────
export const dropdownVariants = {
  initial: { opacity: 0, y: -4, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1, transition: { duration: duration.popover, ease: easeSheet } },
  exit:    { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12, ease: easeExit } },
} as const;

// ─────────────────────────────────────────────────────────────────
// MODAL & SHEET — 280ms
// ─────────────────────────────────────────────────────────────────
export const modalOverlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.fast } },
  exit:    { opacity: 0, transition: { duration: 0.12 } },
} as const;

export const modalContentVariants = {
  initial: { opacity: 0, scale: 0.98, y: 8 },
  animate: { opacity: 1, scale: 1,    y: 0, transition: { duration: duration.modal, ease: easeStandard } },
  exit:    { opacity: 0, scale: 0.98, y: 6, transition: { duration: 0.15, ease: easeExit } },
} as const;

export const sheetVariants = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0, transition: { duration: duration.sheet, ease: easeSheet } },
  exit:    { opacity: 0, y: '100%', transition: { duration: 0.20, ease: easeExit } },
} as const;

// ─────────────────────────────────────────────────────────────────
// TOAST / NOTIFICATION
// ─────────────────────────────────────────────────────────────────
export const toastVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0,  scale: 1, transition: { duration: duration.fast, ease: easeStandard } },
  exit:    { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.12, ease: easeExit } },
} as const;

// ─────────────────────────────────────────────────────────────────
// METRIC / NUMBER
// ─────────────────────────────────────────────────────────────────
export const metricVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.40, ease: easeStandard } },
} as const;

// ─────────────────────────────────────────────────────────────────
// FADE ONLY
// ─────────────────────────────────────────────────────────────────
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.fast } },
  exit:    { opacity: 0, transition: { duration: 0.10 } },
} as const;
