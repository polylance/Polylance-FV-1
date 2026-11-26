# UI Tools & Capabilities Audit

Audit of available design, animation, accessibility, and testing capabilities in the PolyLance workspace.

## 1. Project Dependencies & Installed UI Tooling
PolyLance uses an established, accessible UI stack in `frontend/package.json`:
- **Headless Accessible Primitives**: `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`, `@radix-ui/react-tabs`, `@radix-ui/react-slot` for ARIA roles, focus trapping, and keyboard navigation.
- **Inline SVG + CSS Keyframes / WAAPI**: Used for all Category Explorer scenes and mini tab icons. Zero extra animation bundle weight, off-main-thread GPU compositing (`transform`, `opacity`, `stroke-dashoffset` only), zero video/GIF assets, and deterministic control over first frame, loop cap (max 2 loops), pause offscreen/hidden, replay, and reduced motion.
- **Icons**: `lucide-react` (`v0.577.0`) for UI controls (Replay icon, category fallback/UI arrows).
- **Motion Library**: `motion` (`v13.5.1`) / `framer-motion` (`v12.43.0`) available if needed, though Category Scenes stay purely SVG + CSS/WAAPI to keep the Explorer bundle under 40 KB gzip and scenes lazy-loaded individually.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with `frontend/src/styles/tokens.css` and `frontend/src/index.css` defining ink `#0B0B0F`, cobalt `#0047AB` + tints (`#EAF1FB`, `#C9DAF2`, `#7FA3DB`, `#A9C1E8`, `#2F6BC9`, `#003A8C`), semantic green `#0B7A55` / `#E8F7EF`, grays, and self-hosted Red Hat fonts.

## 2. Antigravity Skills Applied
- **animate** (`.agents/skills/animate/SKILL.md`): Purposeful motion gating, GPU-only properties (`transform`, `opacity`), custom easing curves (`cubic-bezier(0.23, 1, 0.32, 1)`), reduced-motion & pointer-hover gating.
- **emil-design-eng** (`.agents/skills/emil-design-eng/SKILL.md`): Tactile press feedback, calm UI transitions, zero layout shift, clean hierarchy.

## 3. Accessibility, Performance & Testing Tools
- **Playwright** (`@playwright/test` v1.64.1 & `playwright-core` with Chrome/Edge): Multi-viewport automated rendering, DOM/CLS/keyboard assertions, and screenshot capture at 375, 390, 414, 768, 1280, and 1920px.
- **axe-core** (Browser accessibility auditing via Playwright): Automated WCAG 2.1 AA contrast, tablist ARIA, and landmark verification.
- **Lighthouse / Web Vitals** (via Chrome/Playwright performance & `layout-shift` PerformanceObserver): CLS = 0 verification, LCP stability, and gzip bundle size analysis (`vite build`).
- **Vitest + React Testing Library** (`vitest v5.0.5`, `@testing-library/react v16.3.3`): Unit and integration tests for scene registry, keyword matching, fallback warning, playback hook, tablist keyboard navigation, and reduced-motion enforcement.
- **Oxlint & Custom CI Guards**: `npm run lint`, `npm run lint:banned-terms`, `npm run lint:no-mock-data`.
