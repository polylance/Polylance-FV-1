# PolyLance 9/10 UI Quality Rubric (`docs/UI-RUBRIC.md`)

This rubric defines the objective quality bar required across **every** PolyLance screen before release. Target passing score: **9.0 / 10+** with zero critical defects.

---

## 1. The 9-Point Evaluation Checklist

| # | Dimension | Pass Criteria (9/10 Standard) | Verification Method |
| :- | :--- | :--- | :--- |
| **1** | **5-Second Clarity Test** | First-time visitor understands within 5 seconds: *(a)* clients lock milestone money upfront in an escrow Receipt, *(b)* freelancers get paid upon milestone approval, *(c)* work covers both code and creative/brand roles. | Visual inspection + unprompted first-screen read |
| **2** | **Plain-Language Jargon Check** | Zero `bytecode`, `BigInt`, `EIP-xxxx`, `SBT`, `non-custodial`, or `on-chain verdict` above the fold or in section headings. Technical details sit behind `"Technical details"` links. Each named fact (*escrow-protected, 2.5% per side, 7-day review, Polygon*) appears as a labelled fact **once per page**. | Automated grep + manual heading audit |
| **3** | **Typography & Spacing** | Type A (`Bricolage Grotesque` 700/800 + `Public Sans` 400/500/600 + `JetBrains Mono` strictly for hashes/addresses/chain IDs) or dev Type B (`?type=b`). Headings `clamp()` with `text-wrap: balance`; body `16px/1.6`, `<= 62ch`; `letter-spacing: -0.02em` *only* `>= 40px`, `0` elsewhere; `word-spacing: normal`; zero squeezed spaces (`"Post a job"` crisp at `14/16/18/24px`); `14px` min body text (`12px` rare labels only); tabular figures in `--font-body`. | Multi-size specimen check (`14/16/18/24px`) + Type A/B renders |
| **4** | **Palette & WCAG AA Contrast** | Semantic tokens from [tokens.css](file:///c:/Movies/Polylance/polylance/frontend/src/styles/tokens.css) only (`#0B0B0C`, `#FFFFFF`, `#F5F6F8`, `#E2E5EA`, `#4B5563`, Cobalt `#0047AB`, `#FFC21A`, `#FF6A1F`, `#B1122B`). Zero gradients, glows, or blur. All text `>= 4.5:1` (`>= 3:1` large/UI); zero red text or thin red borders on dark surfaces. | Computed WCAG ratio matrix |
| **5** | **Layout Integrity (`360–1920px`)** | Shared `1200px` main / `720px` reading container left edge (`72px` desktop / `48px` mobile padding). Header never clips at `360, 768, 1024, 1280, 1440, 1920px`; Dashboard in avatar menu; logo goes to Dashboard when connected; MegaMenu shows names only without clipping. | Playwright multi-viewport check (`scrollWidth <= innerWidth` & right-edge rect bounds) |
| **6** | **Signature Hand-Crafted Details** | Present on key surfaces: `<HighlightMark />` (yellow swipe per H2), Offset Blocks (`2px` `#0B0B0C` border + `4px` shadow shrinking on press), and `<Receipt />` (`LOCKED`/`APPROVED`/`PAID` stamps + tabular lines + mono hash footer). Zero icon tiles, corner pills, code windows, or 3D blobs. | Component & page visual check |
| **7** | **Motion Craft (`120 / 240 / 600ms`)** | Single curve `cubic-bezier(0.22, 1, 0.36, 1)`; `transform` & `opacity` only; 1-shot `IntersectionObserver` reveals; instant final state under `prefers-reduced-motion`; CSS + WAAPI without blocking runtime animation bloat. | Reduced-motion emulation check |
| **8** | **Performance & Core Web Vitals** | Under **Slow 4G + 4× CPU throttling**: `CLS < 0.05`, fast LCP, zero render-blocking external font requests (Latin WOFF2 preloaded only for regular heading + regular body). | Headless Chromium throttling telemetry + `vite build` bundle inspection |
| **9** | **Radical Honesty** | Zero fake numbers, zero invented testimonials/users, zero `"SAMPLE"` widgets pretending to be real activity, generic diagrams labelled `"Example"`, audit status `"Independent audit: Pending"`, zero copyright notice (`"PolyLance Protocol"` footer bar only). | `lint:banned-terms`, `lint:no-mock-data`, visual review |

---

## 2. Initial Screen Evidence Summary (Pre-Rebuild Baseline vs System Foundations)

| Page | Pre-Rebuild Baseline (from `UI-AUDIT.md`) | Root Defect Addressed by Foundations (Steps 3–7) | Target Post-Rebuild |
| :--- | :---: | :--- | :---: |
| Landing (`/`) | 6.0 / 10 | Header clipping (`B1`), squeezed spacing (`B6`), jargon/chrome (`B7`), Category StickyStage (`B5`) | **9.5 / 10** |
| Categories (`/categories`) | 5.5 / 10 | CategoryRail + sticky hierarchy replacing equal boxed grids (`B4`) | **9.0 / 10** |
| Category Detail (`/categories/:slug`) | 6.0 / 10 | CategoryRail overflow fix + honest empty Receipt/Prompt state | **9.0 / 10** |
| Find Jobs (`/jobs`) | 5.5 / 10 | Crisp `"Post a job"` type (`B6`), tabular body budgets, dense row `Card` (`B4`) | **9.0 / 10** |
| Job Detail (`/jobs/:id`) | 4.5 / 10 | `<Receipt />` escrow breakdown + clear workflow state | **9.0 / 10** |
| Post Job (`/jobs/post`) | 5.5 / 10 | Remove cropped thumbnails (`B3`), crisp currency & form alignment | **9.0 / 10** |
| Dashboard (`/dashboard`) | 5.0 / 10 | Compact real KPI strip + Receipt certificates without giant empty rects (`B4`) | **9.0 / 10** |
| Profile (`/profile/:address`) | 6.0 / 10 | Scrollable `Tabs` zero clipping (`B8`), portfolio-first hierarchy | **9.0 / 10** |
| Leaderboard (`/reputation`) | 5.0 / 10 | Unified palette header + single-line tabular scores & mobile pagination | **9.0 / 10** |
| Onboarding (`/welcome`) | 4.5 / 10 | Light-first semantic tokens matching site, zero fake rates (`B7`) | **9.0 / 10** |
| Workspace (`/workspace`) | 4.0 / 10 | StickyStage + clear signed-in vs Example Preview state | **9.0 / 10** |
| Messages (`/messages`) | 3.0 / 10 | Preserved Header chrome & accessible back navigation even disconnected (`B8`) | **9.0 / 10** |
