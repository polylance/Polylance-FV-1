# PolyLance Motion & Popup System Specification

This document defines the single source of truth for motion design, transition curves, and popup primitives across the PolyLance application.

---

## 1. Core Principles
1. **Never Animate Layout Dimensions**: Animate only `transform` (`translate`, `scale`) and `opacity`. Animate `filter` / `backdrop-filter` sparingly. Width, height, top, and left animations trigger layout thrashing and dropped frames.
2. **Exit is Faster Than Enter**:
   - Standard Enter: **220ms**
   - Standard Exit: **160ms**
   - Popovers & Tooltips: **140ms in / 100ms out**
   - Toasts: **240ms in / 180ms out**
3. **Physical Soft Spring for Modals**:
   - `type: 'spring', stiffness: 320, damping: 30` (maximum 2% overshoot, fluid feel without jarring bounces).
4. **Reduced Motion First**:
   - Every variant automatically respects `prefers-reduced-motion`.
   - When active, all spatial translation and scaling are replaced with a clean **120ms opacity fade** (`opacity: 0 <-> 1`).
5. **Zero Layout Shift (CLS 0)**:
   - When locking background scroll, the scrollbar gutter is compensated dynamically (`padding-right: ${window.innerWidth - clientWidth}px`). Page width and scroll position do not jump.
6. **Lenis Scroll Coordination**:
   - Every overlay primitive automatically calls `pauseLenis()` on open and `resumeLenis()` on close, with `data-lenis-prevent="true"` on internal scroll containers.

---

## 2. Shared Primitives Map

| Popup Type | Primitive Component | File Location | Motion Variant | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Center Modal / Dialog** | `<Modal />` | `frontend/src/components/overlay/Modal.tsx` | `centerModalVariants` (Desktop) / `bottomSheetVariants` (Mobile) | Automatically adapts to a bottom sheet on mobile screens (<640px). Supports nested modal dimming (`scale: 0.98`) and top-only Escape. |
| **Drawer / Bottom Sheet** | `<Sheet />` or `<Drawer />` | `frontend/src/components/overlay/Sheet.tsx` | `bottomSheetVariants` / `sideDrawerVariants` | Full viewport containment, grab handle on mobile bottom sheets, escape key handling. |
| **Popover / Dropdown** | `<Popover />` | `frontend/src/components/overlay/Popover.tsx` | `popoverVariants` | Dynamic `transformOrigin` based on viewport positioning (top/bottom, left/right). Esc key and outside click dismissal. |
| **Tooltip** | `<Tooltip />` | `frontend/src/components/common/Tooltip.tsx` | `tooltipVariants` | Short 140ms/100ms fade with subtle 2px offset. Pointer events none. |
| **Toast** | `<ToastContainer />` | `frontend/src/components/mobile/Toast.tsx` | `toastVariants` | Swipe to dismiss, layout animation for reflow, auto-dismiss pause on touch/hover. |
| **Status / Action Feedback** | `<ActionStatusModal />` | `frontend/src/components/ActionStatusModal.tsx` | `centerModalVariants` + `iconPopVariants` | Icon pop (`scale 0.8 -> 1`) + `scaleX` progress bar fill over 600ms. |
| **Transaction Tracker** | `<TransactionTracker />` | `frontend/src/components/common/TransactionTracker.tsx` | `stepTransitionVariants` | 160ms cross-fade between transaction states inside a reserved-height container. |

---

## 3. Motion Tokens (`frontend/src/styles/popupMotion.ts`)

```typescript
export const POPUP_TIMINGS = {
  enter: 0.22,      // 220ms
  exit: 0.16,       // 160ms
  smallEnter: 0.14, // 140ms
  smallExit: 0.10,  // 100ms
  toastEnter: 0.24, // 240ms
  toastExit: 0.18,  // 180ms
  reduced: 0.12,    // 120ms
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.4, 0, 1, 1],
  modalSpring: { stiffness: 320, damping: 30 },
};
```

---

## 4. Checklist for New Popups
When creating any new popup, dialog, drawer, or dropdown in PolyLance:
1. [ ] **Do NOT build raw `fixed inset-0` overlays**. Use `<Modal>`, `<Sheet>`, or `<Popover>`.
2. [ ] **Do NOT use early return `if (!isOpen) return null;`** without wrapping in `<AnimatePresence>`. Primitives manage presence internally.
3. [ ] **Preserve exit state during dismissal**: If component state unmounts props, cache them in a `useRef` so the 160ms exit animation completes cleanly.
4. [ ] **Always provide an accessible title** (`title` prop or `aria-label`).
5. [ ] **Verify mobile (<640px) behavior**: Ensure inputs are reachable, maximum height is capped at `90dvh` / `100dvh`, and inner scrolling container has `overscroll-contain`.
6. [ ] **Run the CI motion check**: `npm run ci:motion` to ensure zero un-migrated raw overlays exist.
