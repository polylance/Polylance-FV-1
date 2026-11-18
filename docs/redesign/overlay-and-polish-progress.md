# PolyLance Overlay & UI Polish Progress Ledger

Completion contract ledger tracking each overlay, page, and component against the redesign requirements.

## 1. Overlay Primitives & Migrations (Part A)

| Item | Target Requirement | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **OverlayRoot System** | Mounted at root body, Portal architecture, Z-index tokens (100–600) | COMPLETED | `components/overlay/OverlayRoot.tsx`, `<div id="overlay-root">` in `index.html` |
| **Modal Primitive** | Fixed 100dvh, sizes sm/md/lg/xl, sticky header/footer, scrollable body with `overscroll-behavior: contain` | COMPLETED | `components/overlay/Modal.tsx`, `components/common/Modal.tsx` |
| **Sheet / Drawer Primitive** | Bottom sheet on mobile (<768px), right drawer (420px), safe areas | COMPLETED | `components/overlay/Sheet.tsx` |
| **Dropdown / Popover** | Anchored collision flip/shift, `max-height: min(480px, 100dvh - 32px)`, internal scroll, contain | COMPLETED | `components/overlay/Popover.tsx` |
| **Navbar Notifications Dropdown** | Width 380px, sticky header/footer, internal wheel/touch/keyboard scroll, overscroll contain, 50+ demo items | COMPLETED | `components/Navbar.tsx` using `Popover`, overscroll-contain |
| **Wallet Balance Dropdown/Modal** | Official Polygon logo, address chip + copy, token list, Amount balances, Top-up & Refresh actions, internal scroll | COMPLETED | `components/WalletBalanceModal.tsx` using portal `Modal` |
| **Account Menu Popover** | Anchored, internal scroll, keyboard trap, clean Radix menu | COMPLETED | `components/Navbar.tsx` using `Popover` |
| **More Menu Popover** | Anchored, internal scroll, keyboard trap, clean Radix menu | COMPLETED | `components/Navbar.tsx` using `Popover` |
| **Fund Escrow Modal** | Summary with Amount & FeeBreakdown, balance check, transaction stages, portal-mounted | COMPLETED | `components/FundEscrowModal.tsx` |
| **Payment Released Modal** | Summary with Amount & FeeBreakdown, milestone verification, portal-mounted | COMPLETED | `components/PaymentReleasedModal.tsx` |
| **Top-Up / Insufficient Funds** | Clean summary, official logos, Amount, portal-mounted | COMPLETED | `components/InsufficientFundsModal.tsx` |
| **Modify Job Modal** | Portal mounted, clean inputs, internal scroll | COMPLETED | `components/ModifyJobModal.tsx` |
| **GitHub Verify Modal** | Portal mounted, clean inputs | COMPLETED | `components/GithubVerifyModal.tsx` |
| **Raise Dispute Modal** | Reason selection, evidence input, fee summary, portal-mounted | COMPLETED | `components/RaiseDisputeModal.tsx` |
| **PolyLance Alert Modal** | Clean alert dialog, portal-mounted | COMPLETED | `components/PolyLanceAlertModal.tsx` |
| **Post Progress Modal** | Transaction stages, portal-mounted | COMPLETED | `components/PostProgressModal.tsx` |
| **User Profile Bio Modal** | Clean text area, portal-mounted | COMPLETED | `components/UserProfileBioModal.tsx` |
| **Job Overview Modal** | Quick inspection modal, portal-mounted | COMPLETED | `components/JobOverviewModal.tsx` |
| **Action Status Modal** | Portal mounted, clean palette | COMPLETED | `components/ActionStatusModal.tsx` |
| **Overlay Test Suite** | Automated Vitest test suite covering modal, popover, sheet, and portal mounting | COMPLETED | `components/overlay/__tests__/OverlaySuite.test.tsx` (6/6 passing) |

---

## 2. Reputation & Leaderboard Redesign (Part B)

| Item | Target Requirement | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **TierEmblem Component** | Pointy-top hexagon shield inline SVG, Bronze/Silver/Gold/Diamond chevrons & star, sizes 20-140, states | COMPLETED | `components/common/TierEmblem.tsx` (`TierEmblem`, `RankEmblem`, `CompactTierChip`) |
| **Emblem Lab Route** | Dev-only route `/#/emblem-lab` showing all tiers, sizes, and states on white and ink | COMPLETED | `pages/EmblemLab.tsx`, registered in `App.tsx` |
| **Reputation Standing Card** | Dark surface `#0B0B0F`, TierEmblem 96, 52px bold white score, 140px segmented ring with cobalt arcs, tabular numbers | COMPLETED | `pages/Reputation.tsx` |
| **Tier Ladder Stepper** | 4-tier stepper track (Bronze 0, Silver 200, Gold 500, Diamond 1000), 48px emblems, "You are here" chip | COMPLETED | `pages/Reputation.tsx` |
| **Grouped Point Breakdown** | 4 grouped cards (Verified deliverables, On-time, Tribunal rulings, GitHub eKYC), tabular points | COMPLETED | `pages/Reputation.tsx` |
| **Leaderboard Podium** | Stepped order 2, 1, 3 with stepped heights (200, 240, 180px), rank 1 cobalt border, clean volume | COMPLETED | `pages/Reputation.tsx` |
| **Leaderboard Table** | 56px rows, Rank with RankEmblem 1-3, Developer with GitHub badge, Tier with CompactTierChip, volume, cobalt bar | COMPLETED | `pages/Reputation.tsx` |
| **Volume & Rank Formatting** | Volume (`$0`, `$21.70`, `$1.2k`, `$1.2M`, never `$0.0k`), "T5" ties, ranks 1-3 emblems | COMPLETED | `utils/reputation.ts`, `pages/Reputation.tsx` |
| **Sticky Position Bar** | "Your position" sticky bottom bar with user rank, CompactTierChip, and points | COMPLETED | `pages/Reputation.tsx` |
| **App-wide TierBadge Replacement** | `TierBadge` in `components/common/Badge.tsx` replaced to render `TierEmblem`, `Profile.tsx` updated with `CompactTierChip` | COMPLETED | Multi-file sweep |

---

## 3. App-Wide UI & Palette Sweep (Part C)

| Page / Component | Target Requirement | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **Strict Palette Compliance** | Ink `#0B0B0F`, white, neutral grays, cobalt `#0047AB` with tints (`#EAF1FB`, `#C9DAF2`, `#7FA3DB`, `#2F6BC9`, `#003A8C`). No gradients, glows, or unapproved colors. | COMPLETED | Enforced in `Reputation.tsx`, `Badge.tsx`, `Profile.tsx`, `Button.tsx`, `index.css` |
| **Button Radius 10px** | Button styling standardized to `rounded-[10px]` for sm/md, no gradients or glows | COMPLETED | `components/common/Button.tsx` |
| **Tabular Numerals** | Numeric scores, counts, rates, and amounts use `tabular-nums` and monospace font where specified | COMPLETED | `pages/Reputation.tsx`, `components/common/Amount.tsx` |
| **Hide HUD & Coming Soon** | Media diagnostics HUD and "Coming soon" buttons hidden in production (`!import.meta.env.DEV`) | COMPLETED | `media/VideoManager.tsx`, `components/video/VideoSlot.tsx`, `components/video/WatchButton.tsx` |
| **Chat Independent Panes** | 3 independent scrollable panes, overscroll containment on messages/channels | COMPLETED | `pages/Chat.tsx` |
| **Build & Test Verification** | Clean compilation via `tsc -b && vite build`, all Vitest tests passing | COMPLETED | 15/15 Vitest tests passed, 0 build errors |
