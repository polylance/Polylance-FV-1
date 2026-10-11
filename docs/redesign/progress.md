# PolyLance Redesign Progress Ledger

This document tracks the redesign status of every route, page, modal, and shared foundation component against `docs/redesign/SPEC.md`.

## Legend
- **TODO**: Not yet audited/updated.
- **IN PROGRESS**: Changes being applied or verified.
- **DONE**: Fully compliant with design tokens, PageContainer, typography, states, responsive checks, tests passing, and screenshots captured at 1280px and 375px.

---

## 1. Foundations & Shared Components (Step 2)

| Item | File | Status | 1280 Screenshot | 375 Screenshot | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| CSS Tokens & Variables | `frontend/src/index.css` | DONE | - | - | Core tokens: Cobalt `#0047AB`, Ink `#0B0B0F`, Text `#374151`, Muted `#6B7280`, Subtle `#F6F7F9`, Border `#E5E7EB`. |
| PageContainer | `frontend/src/components/layout/PageContainer.tsx` | DONE | - | - | 1280px max-width, responsive padding (24px desktop, 16px mobile). |
| PageHeader | `frontend/src/components/layout/PageHeader.tsx` | DONE | - | - | Consistent title, subtitle, eyebrow, breadcrumbs. |
| Button & IconButton | `frontend/src/components/common/Button.tsx` | DONE | - | - | Variants: primary, secondary, outline, ghost, danger. 44px/52px heights, accessible focus rings. |
| StatusBadge & TierBadge | `frontend/src/components/common/StatusBadge.tsx` | DONE | - | - | Standard status tints: Open, Negotiating, Funded, In progress, Submitted, Completed, Disputed. |
| Form Controls (Input, Select, Textarea) | `frontend/src/components/common/FormControls.tsx` | DONE | - | - | 44px inputs with visible `#D1D5DB` borders, focus rings, helper/error text. |
| PolyLanceSelect | `frontend/src/components/PolyLanceSelect.tsx` | DONE | - | - | Clean select with chevron and neutral styling. |
| Card & StatCard | `frontend/src/components/common/Card.tsx` | DONE | - | - | White surface, 1px `#E5E7EB` border, 12px radius, zero drop shadow. |
| Amount Display | `frontend/src/components/common/Amount.tsx` | DONE | - | - | Token amount first with official logo, fiat second in muted gray. |
| FeeBreakdown | `frontend/src/components/common/FeeBreakdown.tsx` | DONE | - | - | Standard 2.5% fee breakdown across all escrow flows. |
| Brand Logos (Polygon, Tokens, Wallets) | `frontend/src/components/brand/PolygonLogo.tsx`, `TokenIcon.tsx` | DONE | - | - | Official SVG assets for Polygon, USDC, USDT, MetaMask, Coinbase, WalletConnect. |
| AddressChip | `frontend/src/components/common/AddressChip.tsx` | DONE | - | - | Monospace address chip with checksum formatting, copy button, full value tooltip. |
| Avatar | `frontend/src/components/common/Avatar.tsx` | DONE | - | - | Identicon or initials with neutral border. |
| EmptyState & ErrorState | `frontend/src/components/common/EmptyState.tsx` | DONE | - | - | Standard iconography, action button, zero layout jump. |
| SkillSelector | `frontend/src/components/SkillSelector.tsx` | DONE | - | - | High-contrast white on cobalt active pill, `.no-scrollbar`, domain subcategories. |

---

## 2. Batch 1: App Shell

| Item | File | Status | 1280 Screenshot | 375 Screenshot | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Navbar | `frontend/src/components/Navbar.tsx` | DONE | `navbar-1280.png` | `navbar-375.png` | Solid white, 1px border, sliding cobalt active indicator, balance chip with official Polygon logo. |
| Account Menu Popover | `frontend/src/components/Navbar.tsx` | DONE | `account-menu-1280.png` | `account-menu-375.png` | Popover with short address, profile, settings, disconnect actions. |
| Notifications Dropdown | `frontend/src/components/Navbar.tsx` | DONE | `notifications-1280.png` | `notifications-375.png` | 360px wide dropdown with unread status indicators. |
| More Menu Popover | `frontend/src/components/Navbar.tsx` | DONE | `more-menu-1280.png` | `more-menu-375.png` | Grouped links (Reputation, Governance, Resources). Only highlights when active on sub-routes. |
| Footer | `frontend/src/components/Footer.tsx` | DONE | `footer-1280.png` | `footer-375.png` | Dark band (`#0B0B0F`), 4 columns, official Polygon badge, fee disclosure line. |
| Route Transitions | `frontend/src/App.tsx`, `index.css` | DONE | - | - | 150ms smooth cross-fade, scroll-to-top on route change. |

---

## 3. Batch 2: Core User Pages

| Item | File | Status | 1280 Screenshot | 375 Screenshot | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Dashboard | `frontend/src/pages/Dashboard.tsx` | DONE | `dashboard-1280.png` | `dashboard-375.png` | Checklist, stats, contracts list with Active/Completed tabs, right rail, Cobalt metric index removed. |
| Find Jobs | `frontend/src/pages/FindJobs.tsx` | DONE | `findjobs-1280.png` | `findjobs-375.png` | Default Open filter, non-truncated fiat selector, domain filters, responsive job cards. |
| Job Detail | `frontend/src/pages/JobDetail.tsx` | DONE | `jobdetail-1280.png` | `jobdetail-375.png` | Milestone stepper, FeeBreakdown budget card, applicant table, factual client summary, IPFS chip. |

---

## 4. Batch 3: Workflow & Messaging

| Item | File | Status | 1280 Screenshot | 375 Screenshot | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Post Job | `frontend/src/pages/PostJob.tsx` | DONE | `postjob-1280.png` | `postjob-375.png` | Numbered sections, sticky fee summary, funding confirmation modal, zero duplicate summaries. |
| Workspace | `frontend/src/pages/JobWorkspace.tsx` | DONE | `workspace-1280.png` | `workspace-375.png` | Contract switcher popover, milestone timeline stepper, single StatusBadge, clean listing link. |
| Messages / Chat | `frontend/src/pages/Chat.tsx` | DONE | `chat-1280.png` | `chat-375.png` | 3 panes, legible channel names, FeeBreakdown sidebar, sentence-case headers, restyled Judges tab. |

---

## 5. Batch 4: Identity & Configuration

| Item | File | Status | 1280 Screenshot | 375 Screenshot | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Profile & Edit Profile | `frontend/src/pages/Profile.tsx` | DONE | `profile-1280.png` | `profile-375.png` | 4 tabs (Overview, Portfolio, Certificates, Reviews), neutral skill chips, modal. |
| GitHub EKYC Card | `frontend/src/components/GithubEkycCard.tsx` | DONE | `github-card-1280.png` | `github-card-375.png` | Neutral card, cobalt language bar (no purple/orange), score and tier chip. |
| Settings | `frontend/src/pages/Settings.tsx` | DONE | `settings-1280.png` | `settings-375.png` | Sticky left navigation, Telegram alerts, appearance, danger zone with typed "DELETE" confirmation. |

---

## 6. Batch 5: Reputation & Attestations

| Item | File | Status | 1280 Screenshot | 375 Screenshot | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Leaderboard & Reputation | `frontend/src/pages/Reputation.tsx` | DONE | `reputation-1280.png` | `reputation-375.png` | Single dark hero, neutral tier thresholds, cobalt progress bars, tabular numerals, single-line badges. |
| Attestations List | `frontend/src/pages/JobAttestationReport.tsx` | DONE | `attestations-1280.png` | `attestations-375.png` | 3-column certificate grid, neutral share buttons with current X logo, Proof of Work filters. |
| Certificate Viewer | `frontend/src/pages/Certificate.tsx` | DONE | `certificate-1280.png` | `certificate-375.png` | Preserved certificate artwork, neutral share actions, Soulbound chip. |

---

## 7. Batch 6: Governance & Protocol Administration

| Item | File | Status | 1280 Screenshot | 375 Screenshot | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Judge Panel | `frontend/src/pages/Judge.tsx` | DONE | `judge-1280.png` | `judge-375.png` | Dispute queue, visible active tab text (white on cobalt), appointed judges list. |
| DAO Governance | `frontend/src/pages/Dao.tsx` | DONE | `dao-1280.png` | `dao-375.png` | Single "Propose arbitrator candidate" action, cobalt-tinted governance info banner, voting bars. |
| Treasury Admin | `frontend/src/pages/Treasury.tsx` | DONE | `treasury-1280.png` | `treasury-375.png` | Token stats, visible border inputs, Overview and Activity log tabs, zero purple accents. |

---

## 8. Batch 7: Compliance, Informational & Modals

| Item | File | Status | 1280 Screenshot | 375 Screenshot | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| Terms of Service | `frontend/src/pages/Terms.tsx` | DONE | `terms-1280.png` | `terms-375.png` | PageContainer with 720px reading column, sticky index with cobalt active tint (no black pill), typo fixed. |
| Privacy Policy | `frontend/src/pages/Privacy.tsx` | DONE | `privacy-1280.png` | `privacy-375.png` | PageContainer with 720px column, neutral icon tiles, single readable dark band, sentence-case labels. |
| Disclaimer | `frontend/src/pages/Disclaimer.tsx` | DONE | `disclaimer-1280.png` | `disclaimer-375.png` | PageContainer with 720px column, neutral icon tiles, design tokens, sentence-case labels. |
| CertifiedPass | `frontend/src/pages/CertifiedPass.tsx` | DONE | `certifiedpass-1280.png` | `certifiedpass-375.png` | Explore CertifiedPass shown once, real verify results, collapsible developer API section. |
| Help | `frontend/src/pages/Help.tsx` | DONE | `help-1280.png` | `help-375.png` | Click-to-load video cards, protocol FAQ, PageContainer. |
| Demo | `frontend/src/pages/Demo.tsx` | DONE | `demo-1280.png` | `demo-375.png` | Interactive tour banner, sample data indicators, PageContainer. |
| Login / Connect Wallet Modal | `frontend/src/pages/Login.tsx`, `LoginModal.tsx` | DONE | `login-1280.png` | `login-375.png` | Web3 wallet rows only (MetaMask, WalletConnect, Coinbase), zero email or password fields. |
| Fund Escrow Modal | `frontend/src/components/FundEscrowModal.tsx` | DONE | `fund-modal-1280.png` | `fund-modal-375.png` | Milestone deposit breakdown, confirm button, design tokens. |
| Payment Released Modal | `frontend/src/components/PaymentReleasedModal.tsx` | DONE | `payment-modal-1280.png` | `payment-modal-375.png` | Milestone payout celebration, SBT preview, design tokens. |
| Insufficient Funds Modal | `frontend/src/components/InsufficientFundsModal.tsx` | DONE | `funds-modal-1280.png` | `funds-modal-375.png` | Low balance alert, top-up link, neutral styling. |
| Wallet Balance Modal | `frontend/src/components/WalletBalanceModal.tsx` | DONE | `balance-modal-1280.png` | `balance-modal-375.png` | Official token balances, top-up guides, official Polygon and token logos. |

---

## 9. Batch 8: Mobile Pass, Motion & QA Audit

| Task | Scope | Status | Notes |
| :--- | :--- | :---: | :--- |
| Mobile Viewport Sweep | 375px & 768px across all routes | DONE | All 31 pages and components verified at 375px; 0 horizontal scroll, tap targets >= 44px. |
| Motion Tokens Audit | 100ms/150ms/250ms, Reduced Motion | DONE | Respects `useReducedMotion`, CSS transitions adhere to tokens, non-decorative. |
| Codebase Grep Sweep | 0 hex colors outside tokens, 0 uppercase mono | DONE | Token compliance verified across pages; 0 non-standard purple tints in redesign scope. |
| Final Test Suite | Vitest 9/9 passing, Build clean | DONE | 9/9 tests pass (100%), `tsc -b && vite build` succeeds with zero errors. |
