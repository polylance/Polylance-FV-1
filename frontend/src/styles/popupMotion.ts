import type { Variants, Transition } from 'framer-motion';

/**
 * Single Source of Truth for PolyLance Popup Motion Design Tokens.
 * Every modal, dialog, drawer, popover, dropdown, tooltip, and toast adheres strictly to these values.
 */

export const POPUP_TIMINGS = {
  modal: {
    enterDuration: 0.22, // 220ms
    exitDuration: 0.16,  // 160ms (exit is always faster)
    spring: {
      type: 'spring' as const,
      stiffness: 320,
      damping: 30,
      mass: 1,
    },
  },
  popover: {
    enterDuration: 0.14, // 140ms
    exitDuration: 0.10,  // 100ms
  },
  toast: {
    enterDuration: 0.24, // 240ms
    exitDuration: 0.18,  // 180ms
  },
  tooltip: {
    enterDuration: 0.14, // 140ms
    exitDuration: 0.10,  // 100ms
  },
  reducedMotion: {
    duration: 0.12,      // 120ms simple fade
  },
  ease: {
    enter: [0.16, 1, 0.3, 1] as [number, number, number, number],
    exit: [0.4, 0, 1, 1] as [number, number, number, number],
  },
  stagger: 0.04,         // 40ms stagger for content sections
  progressFill: 0.60,    // 600ms smooth scaleX fill
} as const;

/**
 * Standard overlay/backdrop variants (pure opacity fade, no layout shift).
 */
export const backdropVariants: Variants = {
  closed: {
    opacity: 0,
    transition: {
      duration: POPUP_TIMINGS.modal.exitDuration,
      ease: POPUP_TIMINGS.ease.exit,
    },
  },
  open: {
    opacity: 1,
    transition: {
      duration: POPUP_TIMINGS.modal.enterDuration,
      ease: POPUP_TIMINGS.ease.enter,
    },
  },
};

/**
 * Center Modal & Dialog Variants (Desktop & Tablets).
 * Opacity 0 → 1, scale 0.96 → 1, translateY 12px → 0.
 * Transform origin centered.
 */
export const centerModalVariants: Variants = {
  closed: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: {
      duration: POPUP_TIMINGS.modal.exitDuration,
      ease: POPUP_TIMINGS.ease.exit,
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: POPUP_TIMINGS.modal.spring,
  },
};

/**
 * Mobile Bottom Sheet Variants (< 640px).
 * Slides up from bottom (translateY 100% → 0) with physical soft spring.
 */
export const bottomSheetVariants: Variants = {
  closed: {
    y: '100%',
    transition: {
      duration: POPUP_TIMINGS.modal.exitDuration,
      ease: POPUP_TIMINGS.ease.exit,
    },
  },
  open: {
    y: 0,
    transition: POPUP_TIMINGS.modal.spring,
  },
};

/**
 * Side Drawer Variants (Left or Right Edge Slide).
 */
export const sideDrawerVariants = (side: 'left' | 'right'): Variants => ({
  closed: {
    x: side === 'right' ? '100%' : '-100%',
    opacity: 0.6,
    transition: {
      duration: POPUP_TIMINGS.modal.exitDuration,
      ease: POPUP_TIMINGS.ease.exit,
    },
  },
  open: {
    x: 0,
    opacity: 1,
    transition: POPUP_TIMINGS.modal.spring,
  },
});

/**
 * Popover & Dropdown Menu Variants.
 * Opacity + scale 0.97 → 1 + translateY 4px → 0.
 * Origin aligns with trigger side.
 */
export const popoverVariants: Variants = {
  closed: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: {
      duration: POPUP_TIMINGS.popover.exitDuration,
      ease: POPUP_TIMINGS.ease.exit,
    },
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: POPUP_TIMINGS.popover.enterDuration,
      ease: POPUP_TIMINGS.ease.enter,
    },
  },
};

/**
 * Tooltip Variants.
 * Opacity + 2px offset, quick 140ms in / 100ms out.
 */
export const tooltipVariants: Variants = {
  closed: {
    opacity: 0,
    y: 2,
    transition: {
      duration: POPUP_TIMINGS.tooltip.exitDuration,
      ease: POPUP_TIMINGS.ease.exit,
    },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      duration: POPUP_TIMINGS.tooltip.enterDuration,
      ease: POPUP_TIMINGS.ease.enter,
    },
  },
};

/**
 * Stacking Toast Variants.
 * Corner slide-in with fade, smooth layout reflow limited to transforms.
 */
export const toastVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.94,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: POPUP_TIMINGS.toast.enterDuration,
      ease: POPUP_TIMINGS.ease.enter,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -8,
    transition: {
      duration: POPUP_TIMINGS.toast.exitDuration,
      ease: POPUP_TIMINGS.ease.exit,
    },
  },
};

/**
 * Success / Status Icon Pop Variant.
 * Scale 0.8 → 1 with subtle playful spring.
 */
export const iconPopVariants: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      delay: 0.08,
    },
  },
};

/**
 * Reduced-Motion Variants (WCAG 2.1 AA Compliant).
 * Replaces all physical movements, slides, and scaling with simple 120ms opacity fade.
 */
export const reducedMotionVariants: Variants = {
  closed: {
    opacity: 0,
    transition: { duration: POPUP_TIMINGS.reducedMotion.duration },
  },
  open: {
    opacity: 1,
    transition: { duration: POPUP_TIMINGS.reducedMotion.duration },
  },
};

/**
 * Step Cross-Fade Transition (e.g. TransactionTracker stages).
 * 160ms cross-fade between steps with zero vertical jump.
 */
export const stepTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    x: 8,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.16,
      ease: POPUP_TIMINGS.ease.enter,
    },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: {
      duration: 0.12,
      ease: POPUP_TIMINGS.ease.exit,
    },
  },
};
