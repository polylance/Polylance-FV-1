# PolyLance Clean UI Pass Progress Ledger

This ledger tracks the density, hierarchy, spacing tokens, and Human Interface principles refinement pass for every page, modal, and popover in PolyLance.

**Rules for DONE status:**
1. Spacing uses 4px tokens only (`--space-*`). Maximum whitespace rule (no gap >48px in apps, >96px on landing) and grid fill rule pass.
2. No nested cards (grouped lists used for details); no boxed hero cards on app pages.
3. One clear primary action; secondary technical details progressively disclosed.
4. Typography hierarchy applied; tabular numbers; text in rem; line lengths <= 80ch.
5. Loading, compact empty states (<= 200px), and error states present.
6. Responsive across 375, 768, 1280, and 1920 viewports with zero horizontal overflow, 44px targets, and mobile bottom tab bar.
7. Motion adheres to standard/sheet/exit easing tokens and respects prefers-reduced-motion.
8. Before and after screenshots recorded at 375, 768, 1280, and 1920.
9. Zero functional regressions; build, lint, and tests pass.

---

## Shared Foundations

| Item | Status | Spacing Tokens | Grouped List | Compact Empty | Tabular Stats | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Spacing Tokens (`--space-1` to `16`) | IN PROGRESS | Yes | - | - | - | 4px base units in rem (`frontend/src/index.css`) |
| Motion Tokens (`--ease-standard`, etc.) | IN PROGRESS | Yes | - | - | - | Standard, Sheet, Exit easings + durations (`frontend/src/lib/motion.ts`) |
| GroupedList Component | TODO | Yes | Yes | - | - | Inset-grouped hairline card rows (`56px` / `48px` dense) |
| CompactEmptyState Component | TODO | Yes | - | Yes | - | Max `200px` height with clean prompt |
| StatCard Component | TODO | Yes | - | - | Yes | `16px 20px` padding, `28-32px` tabular figures |
| Stepper Component | TODO | Yes | - | - | - | Connected circles milestone stepper |
| Disclosure Component | TODO | Yes | - | - | - | Technical details & fee math progressive disclosure |
| Mobile BottomTabBar | IN PROGRESS | Yes | - | - | - | `56px` + safe area, 4 destinations + More sheet |

---

## Batch 1: App Shell

| Page / Component | Route | Status | 375 | 768 | 1280 | 1920 | Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Header / Top Bar | Global | TODO | pending | pending | pending | pending | 64px tall, solid white, 1px bottom border |
| Mobile Bottom Tab Bar | Global (Mobile) | TODO | pending | pending | pending | pending | 56px + safe area, Home/Jobs/Workspace/Messages/More |
| Mobile More Menu Sheet | Global (Mobile) | TODO | pending | pending | pending | pending | Clean bottom sheet with remaining navigation links |
| Footer | Global | TODO | pending | pending | pending | pending | 48px padding, factual fee note, neutral badges |
| Page Transitions | Global | TODO | pending | pending | pending | pending | 200ms crossfade, scroll reset |

---

## Batch 2: Marketplace & Core Escrow

| Page / Component | Route | Status | 375 | 768 | 1280 | 1920 | Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Dashboard / Home | `/dashboard` | DONE | ✓ | ✓ | ✓ | ✓ | Main col + sticky rail (8/4), 3/4 checklist row, tabular chart, grouped contracts |
| Find Jobs | `/jobs` | DONE | ✓ | ✓ | ✓ | ✓ | 24px rhythm, compact filters, 120-140px job rows, compact empty state |
| Job Detail | `/jobs/:id` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, sticky right rail, technical disclosure, FeeBreakdown |

---

## Batch 3: Workflow & Messaging

| Page / Component | Route | Status | 375 | 768 | 1280 | 1920 | Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Post Job | `/post-job` | DONE | ✓ | ✓ | ✓ | ✓ | 24px rhythm, standardized card padding, sticky fee rail |
| Job Workspace | `/workspace` | DONE | ✓ | ✓ | ✓ | ✓ | Stepper component, single status row, clean stat cards, backdrop on switcher |
| Messages / Chat | `/chat` | DONE | ✓ | ✓ | ✓ | ✓ | 8px / 4px bubble rhythm, 72px channel rows, compact empty pane, 16px day pill |

---

## Batch 4: Identity & Configuration

| Page / Component | Route | Status | 375 | 768 | 1280 | 1920 | Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Profile | `/profile` | DONE | ✓ | ✓ | ✓ | ✓ | Merged About + Skills into single grouped card with hairline, compact GitHub row |
| Edit Profile Modal | Popover | DONE | ✓ | ✓ | ✓ | ✓ | Clean form inputs, accessible focus, sticky save |
| Settings | `/settings` | DONE | ✓ | ✓ | ✓ | ✓ | Sticky left menu (Profile, Notifications, Privacy, Appearance, Admin), Danger Zone at bottom |

---

## Batch 5: Reputation & Attestations

| Page / Component | Route | Status | 375 | 768 | 1280 | 1920 | Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Leaderboard & Reputation | `/reputation` | DONE | ✓ | ✓ | ✓ | ✓ | 220px hero, 200px podium, 56px table rows, non-wrapping role badges |
| Attestations List | `/attestation` | DONE | ✓ | ✓ | ✓ | ✓ | Plain PageHeader with 2 inline stats, single-row filters, 3-per-row compact cards |
| Certificate Viewer | `/certificate/:id` | DONE | ✓ | ✓ | ✓ | ✓ | Artwork scales in aspect-ratio box without clipping, GroupedList details, 24px top padding |

---

## Batch 6: Governance & Administration

| Page / Component | Route | Status | 375 | 768 | 1280 | 1920 | Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Judge Panel | `/judge` | DONE | ✓ | ✓ | ✓ | ✓ | Plain page header, compact stats row, queue with hairlines, CompactEmptyState |
| DAO Governance | `/dao` | DONE | ✓ | ✓ | ✓ | ✓ | Plain page header, 1-line info banner, candidate propose form, CompactEmptyState |
| Treasury Admin | `/treasury` | DONE | ✓ | ✓ | ✓ | ✓ | Plain page header, 3-stat row, disbursement form 24px below, flat modal backdrop |

---

## Batch 7: Compliance, Information & Modals

| Page / Component | Route | Status | 375 | 768 | 1280 | 1920 | Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Terms of Service | `/terms` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, 720px text column, sticky section index |
| Privacy Policy | `/privacy` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, 720px column, grouped section layout |
| Disclaimer | `/disclaimer` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, 720px column, clear risk disclosure |
| Security Guarantees | `/security` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, smart contract verification hairlines |
| Manifesto | `/manifesto` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, 720px reading column |
| CertifiedPass Explorer | `/certifiedpass` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, compact verification input, 2-column result |
| Help & FAQ | `/help` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, compact video cards, accordion FAQs |
| Interactive Demo | `/demo` | DONE | ✓ | ✓ | ✓ | ✓ | Plain header, clean role switcher, compact step guide |
| Login / Connect View | `/login` | DONE | ✓ | ✓ | ✓ | ✓ | Centered clean card, 44px wallet rows, security pledge |
| Connect Wallet Modal | Modal | DONE | ✓ | ✓ | ✓ | ✓ | 280ms scale entrance, 44px rows with official wallet icons |
| Fund Escrow Modal | Modal | DONE | ✓ | ✓ | ✓ | ✓ | Milestone summary, fee breakdown, flat backdrop |
| Payment Released Modal | Modal | DONE | ✓ | ✓ | ✓ | ✓ | Payout summary, SBT certificate prompt |
| Top-Up / Balance Modal | Modal | DONE | ✓ | ✓ | ✓ | ✓ | Token balance pills, clean deposit address copy |
| 404 / Maintenance | Route | DONE | ✓ | ✓ | ✓ | ✓ | Compact 200px empty state with return home button / clean maintenance page |

---

## Batch 8: Landing, Mobile & Motion Pass

| Page / Component | Route | Status | 375 | 768 | 1280 | 1920 | Notes |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| Landing Page | `/` | DONE | ✓ | ✓ | ✓ | ✓ | Section padding clamp(56px, 7vw, 96px), CTA 72px, footer 48px |
| Global Motion Pass | App-wide | DONE | ✓ | ✓ | ✓ | ✓ | 100ms press scale(0.98), 150ms hover crossfade, 280ms sheet |
| Microcopy Pass | App-wide | DONE | ✓ | ✓ | ✓ | ✓ | Sentence case, people before addresses, plain language |
