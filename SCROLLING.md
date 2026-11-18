# PolyLance Scrolling Architecture & Guidelines

## 1. Overview
PolyLance uses [Lenis](https://github.com/darkroomengineering/lenis) for smooth, momentum-based scrolling at the window/document level. Because Lenis intercepts wheel and touch gestures on `window`, any nested sub-container (dropdowns, modals, sheets, side panels, previews, code blocks) must follow strict encapsulation rules to prevent scroll hijacking, locked inner containers, or broken wheel events.

---

## 2. Core Rules

### Rule 1: Always Opt Out of Lenis for Sub-Containers
Any HTML element or component that possesses independent scroll (`overflow-y-auto`, `overflow-y-scroll`, `overflow-x-auto`) **MUST** include:
```html
data-lenis-prevent="true"
```
Lenis is configured with:
```ts
prevent: (node) => Boolean(node.closest('[data-lenis-prevent]'))
```
When this attribute is present, wheel and touch events within the container pass directly to the native browser scrolling engine.

### Rule 2: Contain Scroll Chaining (`overscroll-contain`)
Always apply `overscroll-contain` to nested scrollable regions. This prevents scroll chaining (where scrolling reaches the end of the dropdown/modal and begins violently scrolling the page behind it).

### Rule 3: Guard Nested Flex/Grid Heights (`min-h-0` / `min-w-0`)
CSS flex children default to `min-height: auto`. If a scroll container is nested inside a flex column, it will refuse to shrink and scroll unless the flex parent or container itself has:
```html
min-h-0
```
Always pair `flex-1 overflow-y-auto` with `min-h-0`.

### Rule 4: Use the `<ScrollArea />` Primitive
Whenever creating a new scrollable region, prefer using:
```tsx
import { ScrollArea } from '../components/common/ScrollArea';

<ScrollArea maxHeight="380px" fadeShadows>
  {/* Content */}
</ScrollArea>
```
`<ScrollArea />` automatically provides:
- `data-lenis-prevent="true"`
- `overscroll-contain`
- `min-h-0` & `min-w-0`
- Keyboard scrollability (`tabIndex={0}`, `role="region"`)
- Optional top/bottom edge fade indicators (`fadeShadows={true}`)
- Native custom scrollbar styling (`custom-scrollbar`)

### Rule 5: Modals and Sheets Must Pause Lenis
When full overlays (Modal, Sheet, Drawer) mount with a body scroll-lock (`document.body.style.overflow = 'hidden'`), they must call:
```ts
import { pauseLenis, resumeLenis } from '../../hooks/useSmoothScroll';

useEffect(() => {
  pauseLenis();
  return () => resumeLenis();
}, []);
```
This guarantees that momentum scroll buffers are reset and mouse-wheel events are not swallowed.

---

## 3. Dropdowns & Selects (e.g., PolyLanceSelect)
1. **Dropdown Trigger**: If width is constrained (e.g. `min-w-[110px]`), use `compactTrigger` to display `FLAG  CODE` (e.g., `🇮🇳  INR` or `IN  INR`) instead of long labels with ellipses.
2. **Options Menu**: Wrap option lists in `data-lenis-prevent="true"` with `overscroll-contain`.
3. **Auto-Scroll Selected**: On menu open, auto-scroll the selected option into view via `element.scrollIntoView({ block: 'nearest' })`.
4. **Keyboard Navigation**: Support `ArrowDown`, `ArrowUp`, `Enter`, and `Escape`.

---

## 4. Linting & CI Protection
A linting script is provided at `scripts/lint-scrolling.mjs`.

To run the check:
```bash
node scripts/lint-scrolling.mjs
```
The script inspects all TSX/JSX files under `frontend/src` and reports any element with `overflow-y-auto`, `overflow-auto`, or `overflow-scroll` that lacks `data-lenis-prevent` or isn't using `<ScrollArea />`.
