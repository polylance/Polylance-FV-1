# PolyLance Multi-Viewport UI Audit (`docs/UI-AUDIT.md`)

**Date:** 2026-11-25  
**Viewports Inspected:** `375×812` (mobile) and `1280×800` (desktop), plus user-reported logged-in captures at desktop width (`media_1795602922058_57220f9f.jpg`, `media_1795602974285_ebfa453d.jpg`).  
**Screenshot Directory:** `C:/Users/sunny/.gemini/antigravity/brain/af6fc47a-d55c-450c-869d-71eafc3699d3/audit_screenshots/`

---

## 1. Confirmed Bugs & Code-Level Root Causes

| # | Bug Confirmed | Where Observed | Exact Code / Visual Root Cause |
| :--- | :--- | :--- | :--- |
| **B1** | **Header right edge clipped (wallet balance & avatar dropdown cut off) at 1280–1920px** | User screenshot #2 (`media_1795602974285_ebfa453d.jpg`), [Navbar.tsx](file:///c:/Movies/Polylance/polylance/frontend/src/components/Navbar.tsx#L403-L437) | When `isConnected` is true, `<nav className="... shrink-0">` renders 7 items (`Dashboard`, `Find Jobs`, `Categories`, `Workspace`, `Messages`, `Post a job`, `More`) alongside an unrestricted `w-full` header bar (`flex-1 min-w-[180px]` search + Balance chip + Avatar chip `shrink-0`). Total width exceeds `1280px` and overflows the right viewport edge, slicing the avatar dropdown chevron. |
| **B2** | **Mega-menu text clipped and overlapping hero content** | `megamenu_1280.png`, [CategoriesMegaMenu.tsx](file:///c:/Movies/Polylance/polylance/frontend/src/components/navigation/CategoriesMegaMenu.tsx#L92-L175) | Dropdown uses `w-[720px]` anchored at `left-0` under `#categories-megamenu-trigger`, `max-h-[420px]` with scrollable inner panels that clip the top description of the right column under sticky banners, while cramming icons, counters, 2-line descriptions, and 3-skill preview lines per subcategory on top of the hero. |
| **B3** | **Cropped / squeezed thumbnails inside cards** | `06_post_job_1280.png`, `06_post_job_375.png` | `PostJob.tsx` renders 10 miniature SVG/graphic preview cards in a 5-col desktop / 2-col mobile grid where labels truncate abruptly (`"Creators & Brand..."`, `"Video, Audio &..."`), and currency selector boxes wrap awkwardly onto 3 uneven lines at `375px`. |
| **B4** | **Large empty areas inside cards & banners** | `07_dashboard_1280.png`, `03_category_detail_1280.png`, `04_find_jobs_1280.png` | `Dashboard` renders a tall empty dashed square inside `"Needs your attention"`, a giant empty `Jun–Nov` bar chart frame (`Monthly milestone settlement`), and huge vertical padding inside `"No active contracts"` / `"No active jobs"`. |
| **B5** | **Categories Explorer right panel scrolls out of alignment** | User screenshot #1 (`media_1795602922058_57220f9f.jpg`), [LandingCategoriesSection.tsx](file:///c:/Movies/Polylance/polylance/frontend/src/components/landing/LandingCategoriesSection.tsx) | As visitors scroll down through the tall 10-row left category list, the right preview stage scrolls upward / out of viewport sync instead of staying pinned as a `StickyStage`. |
| **B6** | **Squeezed word spacing (`"Post a job"` reads `"Postajob"`)** | User screenshot #2, `04_find_jobs_375.png`, `06_post_job_375.png`, `Navbar.tsx` L434 | Tight tracking (`tracking-tight` / `-0.02em`) applied on small `12px` UI text in Red Hat Display/Text compresses space glyphs so adjacent short words (`Post a job`, `0.00POL`, `Search jobs`) visually merge. |
| **B7** | **Forbidden fake/chrome UI & jargon above the fold** | `01_landing_1280.png`, `megamenu_1280.png`, `10_onboarding_1280.png` | `HeroProductTheater` shows code-editor chrome (`polylance · escrow-flow.sol`, 3 dots), `"SAMPLE FLOW"`, `"bytecode"`, `"SBT"`, `"Non-custodial bytecode"`, and 3 icon tiles; `DemoBanner` says `"SAMPLE DEMO"`; `/welcome` displays fake `"50 USDC/hr"` rate + `"sovereign"` / `"SBT"` jargon on a clashing dark background. |
| **B8** | **Mobile tab bar overflow, fixed footer overlap & broken auth fallback chrome** | `08_profile_375.png`, `09_leaderboard_375.png`, `12_messages_1280.png`, `02_categories_1280.png` | `Profile` tabs clip `"Reviews 3"` (`"R..."`) at `375px`; Leaderboard pagination wraps `"1 / 2"` vertically onto 3 lines; `/messages?demo=true` renders an unframed blank white `"Wallet Not Connected"` page with zero header/footer; `LandingFooter` still renders secondary status text next to `"PolyLance Protocol"`. |

---

## 2. Screen-by-Screen Audit Scores (12 Routes × 2 Viewports)

| # | Screen & Route | Score | Key Findings at `1280px` & `375px` |
| :- | :--- | :-: | :--- |
| 1 | **Landing** (`/`) | **6 / 10** | Light hierarchy is much clearer after initial pass, **but fails Updated Rules**: code-window chrome + `"SAMPLE FLOW"` in Hero, `"bytecode"` / `"SBT"` / `"non-custodial"` above the fold, repeated `"escrow-protected"` & `"2.5% per side"` claims across bands, Category right panel not sticky while scrolling list (`B5`), and logged-in header overflows (`B1`, `B6`). |
| 2 | **Categories Directory** (`/categories`) | **5.5 / 10** | Clean 10-card inventory with `"Creators & Brand Collabs"` visible, **but** suffers from uniform equal-card monotony (`3×3+1`), repetitive `"0 open jobs"` corner pills, large blank vertical whitespace under shorter cards (`B4`), `"Non-custodial"` jargon in subtitle, and overly tall `6944px` mobile stack (`375px`). |
| 3 | **Category Detail** (`/categories/development-it`) | **6 / 10** | Good hero + horizontal subcategory chips, **but** horizontal subcategory bar overflows flush right without smooth fade/scroll affordance, uses `"non-custodial"`, `"Inspect Sample Blueprint"` (`B7`), and large centered blank empty box (`B4`). |
| 4 | **Find Jobs** (`/jobs`) | **5.5 / 10** | Sidebar filter structure works well at `1280px`, **but** empty main pane shows a huge blank white rectangle (`B4`), `"Post a job"` has tight word spacing (`B6`), `"Fiat: US USD"` button shows duplicated text (`US USD`), and mobile has no compact summary chip strip. |
| 5 | **Job Detail** (`/jobs/0`) | **4.5 / 10** | When an ID isn't active (`jobs/0` with unseeded local chain), it renders a stark minimalist error box, and for active jobs lacks the signature perforated **Receipt** metaphor for locked escrow, milestones, and review windows. Needs cohesive Receipt + StickyStage architecture. |
| 6 | **Post Job** (`/jobs/post?demo=true`) | **5.5 / 10** | Clear right-hand live breakdown sticky panel, **but** Step 1 10-category thumbnail grid crops titles (`"Creators & Brand..."` `B3`), uses tight `"Post a job"` spacing (`B6`), `375px` currency buttons wrap unevenly (`"POL - $0.0890 USD"`), mentions `"Automatic Soulbound"` & `"SAMPLE DEMO"` banner (`B7`), and total mobile scroll height hits `5069px`. |
| 7 | **Dashboard** (`/dashboard?demo=true`) | **5 / 10** | Good semantic grouping, **but** heavily damaged by massive blank placeholder boxes (`Needs your attention` empty rect, `Monthly milestone settlement` empty 6-month chart `B4`), `"0.00POL"`/`"0.00USDC"` missing space after numbers, clipped mobile checklist text (`"Connected to Polygon Main..."`), and `"SAMPLE DEMO"` banner. |
| 8 | **Profile** (`/profile/0x05dd...8706`) | **6 / 10** | Displays both `Reviews`, `Portfolio`, `Certificates`, and `GitHub verification` cleanly (`100%` / `740/1000`), **but** `375px` tab strip clips `"Reviews"` off-screen (`"R"` visible in `08_profile_375.png`), skill tags wrap into 17 dense boxes, and Portfolio/Certificate receipts aren't highlighted first per contra-style portfolio focus. |
| 9 | **Leaderboard** (`/reputation`) | **5 / 10** | Clear deterministic table & GitHub badges, **but** opens with an incoherent heavy dark banner (`#0B0B0F`), uniform boxed Top-3 cards, awkward `"320\npts"` 2-line wraps inside desktop cells (`1280px`), and broken `"1\n/\n2"` mobile pagination wrap (`375px`). |
| 10 | **Onboarding** (`/welcome`) | **4.5 / 10** | Expresses bold personality (`yellow`/`red`/`ink` accents), **but** completely breaks design consistency (pitch-black `#0B0B0F` full viewport vs light site), introduces fake preview stats (`"50 USDC/hr"`, `"Development & IT Expert"` `B7`), uses banned jargon (`"non-custodial"`, `"SBT"`, `"sovereign"`), and misses mobile preview parity (`375px` drops preview entirely). |
| 11 | **Workspace** (`/workspace?demo=true`) | **4 / 10** | Even in `?demo=true` inspection mode, renders only a generic locked gate (`"Authentication required / Connect wallet to access workspace"`) instead of a cohesive authenticated view or clean demo workspace preview without fake labels. |
| 12 | **Messages** (`/messages?demo=true`) | **3 / 10** | **Severe layout defect:** renders an empty white viewport (`headerHeight: 0`, no navbar, no back navigation, no footer) with a centered orange exclamation circle saying `"Wallet Not Connected"`. Users arriving here have zero way to navigate back cleanly. |

**Current Composite Baseline:** **5.1 / 10** across all 12 screens. Target after full Token, Component, Typography, Motion, and Page rebuilds: **9.0+ / 10** verified against `docs/UI-RUBRIC.md`.

---

## 3. Architectural Plan for Steps 3–8 (Awaiting User Approval)

Upon approval of Steps 1–2, execution will proceed cleanly in the following order:

### Step 3 — Typography System (`--font-display`, `--font-body`, `--font-mono`)
- **Type A (Default):** `Bricolage Grotesque` (`700`, `800`) for display headings + `Public Sans` (`400`, `500`, `600`) for body/UI + `JetBrains Mono` (`400`, `500`) **strictly** for wallet addresses, transaction hashes, and chain IDs.
- **Type B (Dev Switch via `?type=b`):** `Schibsted Grotesk` (`800` headings, `400/500/600` body) + `IBM Plex Mono` (`400/500`), persisted/toggled via `<html data-type="b">` / CSS custom property override in dev mode (`import.meta.env.DEV`).
- **Self-Hosting & Cleanup:** Download verified **Latin-subset WOFF2** fonts (via official `@fontsource` / Font Squirrel / Google Fonts static Latin subsets verified for license), preload *only* the regular heading (`Bricolage Grotesque 700`) and regular body (`Public Sans 400`) WOFF2 files with `font-display: swap` and metric-matched `@font-face` fallbacks (`size-adjust`, `ascent-override`, `descent-override`). Remove unused `red-hat-*` font files and third-party font links.
- **Scale & Tracking Rules:**
  - Body `16px / 1.6`, `h1: clamp(2.25rem, 1.4rem + 4vw, 4rem)`, `h2: clamp(1.75rem, 1.2rem + 2.2vw, 2.75rem)`, `h3: 1.375rem`, `text-wrap: balance` on headings, `max-width: 62ch` on prose.
  - Minimum text `14px` everywhere (`12px` reserved strictly for rare small labels).
  - `letter-spacing: -0.02em` *only* on headings `>= 40px`; `0` everywhere else (`+0.05em` on rare small uppercase labels); `word-spacing: normal`; `font-variant-numeric: tabular-nums` on `--font-body` for currency/counters (never mono).
- **Visual Type Specimen Verification:** Build a clean interactive Type A / B specimen strip (`"Post a job"`, `"Find open jobs"`, `"Every job starts with client funds"`) at `14px`, `16px`, `18px`, and `24px` rendered on a real section, screenshotted and checked to confirm wide, unmistakable spaces.

### Step 4 — Semantic Tokens, Palette Roles & AA Contrast Audit (`frontend/src/styles/tokens.css`)
- **Palette Tokens:** Ink `--color-ink: #0B0B0C`, White `--color-white: #FFFFFF`, Surface Subtle `--color-surface-subtle: #F5F6F8`, Border `--color-border: #E2E5EA`, Muted Text `--color-muted: #4B5563`, Brand Cobalt `--color-cobalt: #0047AB` (hover `#00388A`), Yellow `--color-yellow: #FFC21A`, Orange `--color-orange: #FF6A1F`, Red `--color-red: #B1122B`. **Zero gradients, zero glow, zero backdrop blur anywhere.**
- **Surface Roles:**
  - *Light surfaces:* Cobalt = primary buttons & links; Yellow = highlighter marks, badges, selection fills (always `#0B0B0C` black text); Orange = progress tracks, hover accents, secondary highlights (`#0B0B0C` black text); Red = alerts, disputes, & at most one headline accent per page (`#FFFFFF` white text on `#B1122B` fill; never red text or thin red lines on dark ink); Ink = headings, borders, footer & dark bands.
  - *Dark (`#0B0B0C`) surfaces:* `#FFFFFF` white text, `#FFC21A` yellow primary buttons with `#0B0B0C` black text, cobalt/light links where AA compliant (we will compute & verify exact contrast of `#0047AB` on `#0B0B0C` in Step 4 and flag/tune if lighter link tint or pill surface is needed for WCAG AA `>= 4.5:1`), never red text on black.
- **Geometry & Grid Tokens:** Radius `6px / 10px / 14px` (buttons & inputs `8px`), `4px` spacing scale, section padding `72px` desktop / `48px` mobile, single `1200px` main container + `720px` reading measure sharing one crisp left vertical alignment edge.
- Deliver complete computed WCAG AA contrast matrix before proceeding to page rebuilds.

### Step 5 — Signature Hand-Crafted Details
1. **`<HighlightMark />`:** One key word per H2 underlined/swiped behind with a subtle `#FFC21A` SVG/clip-path marker stroke (`240ms` one-shot scroll reveal; static under `prefers-reduced-motion`).
2. **Offset Blocks:** Interactive primary buttons, selected category/tier tiles, and key action panels carry a `2px solid #0B0B0C` outline + crisp solid `4px 4px 0 #0B0B0C` offset shadow (zero blur) translating `+2px, +2px` / shrinking shadow on `:active` press.
3. **`<Receipt />`:** Signature perforated top/bottom ticket container with itemised rows, tabular amounts (`--font-body`), total row, crisp stamp badge (`LOCKED`, `APPROVED`, or `PAID`), and `--font-mono` tx/escrow hash line at bottom—reused for escrow explanations, fee breakdowns, and certificates.
- Remove *all* decorative icon tiles, corner pills, mono feature tags, uniform equal-card grids, 3D visuals, and code-editor window chromes.

### Step 6 — Reusable Primitive & Chrome Rebuild (Props Backward-Compatible)
- Rebuild/create cleanly without breaking page callers: `Button`, `Link`, `Tabs` (horizontal scrollable with zero mobile clip), `Tag` (text-only), `Card` (`1px` border, zero blur/drop shadow), `Accordion`, `SectionHeader`, `Skeleton`, `BottomSheet`, `Receipt`, `HighlightMark`, `StickyStage`, `CategoryRail`, clean names-only `MegaMenu`, `Footer` (bottom line strictly `"PolyLance Protocol"`, zero copyright), and `Navbar` (`min-width: 0`, `1200px` max container, logo routes to `/dashboard` when connected, Dashboard moved into avatar dropdown, icon-only Messages & Notifications, zero clipping from `360px` to `1920px`).

### Step 7 — Lean CSS + WAAPI Motion System (`docs` + `frontend/src/styles/motion.ts`)
- **Tokens:** `120ms` (hover/press), `240ms` (reveal/UI transitions), `600ms` (orchestrated step sequences); single unified cubic-bezier curve `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Utilities:** `Reveal` (`12px` vertical rise + opacity, 1-shot `IntersectionObserver` stagger), `CountUp` (`1-shot`, fixed/tabular width), `StickyStage`, and lightweight WAAPI `sequence()` helper.
- **Zero-Library Rationale:** Standard CSS Transitions + Keyframes + Web Animations API (`element.animate`) handle hover, press, scroll-triggered reveals, highlighter clip-paths, and staggered step sequences at ~2 KB vs keeping `framer-motion` (~260 KB chunk observed in Vite build)—reducing JS parse/hydration cost dramatically on Slow 4G mobile (`4x CPU`) while preserving `prefers-reduced-motion` instant final state.

### Step 8 — Quality Rubric (`docs/UI-RUBRIC.md`)
- Author the 9/10 evaluation checklist covering: 5-second non-technical clarity, zero banned jargon above the fold, Type A/B visual spacing verification, zero clipping/overflow from `360px` to `1920px`, 1-shot GPU motion only, CWV targets on Slow 4G + 4× CPU throttling (`CLS < 0.05`, fast LCP/INP), WCAG AA contrast & keyboard navigation, real-data honesty, and signature details presence (`Receipt`, `HighlightMark`, Offset Blocks).
