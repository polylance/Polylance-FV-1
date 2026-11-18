# PolyLance Redesign Before & After Screenshot Index

This document catalogs the visual transformation across all routes and components. All post-redesign artifacts are captured at **1280px** (Desktop) and **375px** (Mobile) and stored in `docs/redesign/after/`.

---

## 1. App Shell & Navigation

| Route / Component | 1280px Screenshot | 375px Screenshot | Key Redesign Transformations |
| :--- | :--- | :--- | :--- |
| **Navbar** | [`navbar-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/navbar-1280.png) | [`navbar-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/navbar-375.png) | Solid white background (no blur), 1px border, sliding cobalt active underline, balance chip in sans tabular numbers with official Polygon SVG, fixed active indicator logic. |
| **Account Menu Popover** | [`account-menu-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/account-menu-1280.png) | [`account-menu-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/account-menu-375.png) | Clean neutral popover; short checksum address; Profile, Settings, and Disconnect actions; focus trap and visible focus ring. |
| **Notifications Dropdown** | [`notifications-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/notifications-1280.png) | [`notifications-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/notifications-375.png) | 360px wide dropdown, neutral cards, unread status dots, mark-all-as-read action. |
| **More Menu Popover** | [`more-menu-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/more-menu-1280.png) | [`more-menu-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/more-menu-375.png) | Categorized links (Reputation, Governance, Resources); only active on sub-routes; no false highlights. |
| **Footer** | [`footer-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/footer-1280.png) | [`footer-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/footer-375.png) | Clean dark `#0B0B0F` band, 4 structured columns, official Polygon badge, platform fee disclosure line. |

---

## 2. Core User Pages

| Route / Component | 1280px Screenshot | 375px Screenshot | Key Redesign Transformations |
| :--- | :--- | :--- | :--- |
| **Dashboard (`/#/dashboard`)** | [`dashboard-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/dashboard-1280.png) | [`dashboard-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/dashboard-375.png) | Removed "Cobalt metric index"; single-pass activity chart with axes, month labels, hover values; compact profile completeness; Active Contracts partitioned into Active / Completed tabs; right rail cards. |
| **Find Jobs (`/#/jobs`)** | [`findjobs-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/findjobs-1280.png) | [`findjobs-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/findjobs-375.png) | Defaults to `Open` jobs; fiat selector label not truncated; sentence-case filter chips; responsive job card grid. |
| **Job Detail (`/#/jobs/:id`)** | [`jobdetail-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/jobdetail-1280.png) | [`jobdetail-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/jobdetail-375.png) | Escrow timeline rebuilt as landing-page stepper; Budget card uses `FeeBreakdown`; client summary with factual "New client" indicator; IPFS CID rendered as small copyable chip. |

---

## 3. Workflow & Messaging

| Route / Component | 1280px Screenshot | 375px Screenshot | Key Redesign Transformations |
| :--- | :--- | :--- | :--- |
| **Post Job (`/#/post-job`)** | [`postjob-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/postjob-1280.png) | [`postjob-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/postjob-375.png) | Numbered sections (1: Details, 2: Skills, 3: Budget); sticky fee summary card; confirmation modal before submission; zero duplicate summaries. |
| **Workspace (`/#/workspace`)** | [`workspace-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/workspace-1280.png) | [`workspace-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/workspace-375.png) | Contract switcher popover with focus trap and backdrop; single `StatusBadge`; stepper timeline; negotiation icon; removed external link icon from in-app link. |
| **Messages (`/#/chat`)** | [`chat-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/chat-1280.png) | [`chat-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/chat-375.png) | Selected channel has dark legible text (`#0B0B0F`) on cobalt tint; channel names not truncated; bubbles in landing style; right panel includes `FeeBreakdown`; Judges tab restyled in sentence case. |

---

## 4. Identity & Configuration

| Route / Component | 1280px Screenshot | 375px Screenshot | Key Redesign Transformations |
| :--- | :--- | :--- | :--- |
| **Profile (`/#/profile`)** | [`profile-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/profile-1280.png) | [`profile-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/profile-375.png) | 4 tabs (Overview, Portfolio, Certificates, Reviews); merged portfolio section; neutral skills chips. |
| **GitHub EKYC Card** | [`github-card-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/github-card-1280.png) | [`github-card-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/github-card-375.png) | Neutral stacked language bar in cobalt shades (removed purple/orange); score and tier chips. |
| **Settings (`/#/settings`)** | [`settings-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/settings-1280.png) | [`settings-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/settings-375.png) | Sticky left navigation; Telegram notification controls; Appearance mode toggles; Danger zone requires typed `"DELETE"` confirmation before trigger. |

---

## 5. Reputation & Attestations

| Route / Component | 1280px Screenshot | 375px Screenshot | Key Redesign Transformations |
| :--- | :--- | :--- | :--- |
| **Reputation (`/#/reputation`)** | [`reputation-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/reputation-1280.png) | [`reputation-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/reputation-375.png) | Single dark hero; tier list in single neutral style (no orange/green cards); cobalt progress bars; tabular numbers; single-line role badges. |
| **Attestations (`/#/attestation`)**| [`attestations-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/attestations-1280.png) | [`attestations-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/attestations-375.png) | 3-column certificate grid; neutral share buttons with current X logo; Proof of Work filters. |
| **Certificate Viewer** | [`certificate-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/certificate-1280.png) | [`certificate-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/certificate-375.png) | Preserved on-chain certificate artwork; neutral share buttons; Soulbound chip. |

---

## 6. Governance & Protocol Administration

| Route / Component | 1280px Screenshot | 375px Screenshot | Key Redesign Transformations |
| :--- | :--- | :--- | :--- |
| **Judge Panel (`/#/judge`)** | [`judge-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/judge-1280.png) | [`judge-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/judge-375.png) | Visible active tab text (white on cobalt); sentence-case queue headers; appointed arbitrators table. |
| **DAO (`/#/dao`)** | [`dao-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/dao-1280.png) | [`dao-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/dao-375.png) | Single "Propose arbitrator candidate" action in header; governance rules wrapped in cobalt-tinted banner; linear vote bars. |
| **Treasury (`/#/treasury`)** | [`treasury-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/treasury-1280.png) | [`treasury-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/treasury-375.png) | Inputs with visible `#D1D5DB` borders; `Overview | Activity log` tab structure; removed non-standard purple text. |

---

## 7. Legal, Compliance & Informational

| Route / Component | 1280px Screenshot | 375px Screenshot | Key Redesign Transformations |
| :--- | :--- | :--- | :--- |
| **Terms of Service (`/#/terms`)** | [`terms-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/terms-1280.png) | [`terms-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/terms-375.png) | `PageContainer` with 720px reading column; sticky index with `--cobalt-50` active tint and 2px cobalt left border (eliminated black pills); fixed grammar typo ("agree to be bound by"); back-to-top action. |
| **Privacy Policy (`/#/privacy`)** | [`privacy-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/privacy-1280.png) | [`privacy-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/privacy-375.png) | `PageContainer` with 720px column; neutral icon tiles; single high-contrast readable dark band; sentence-case labels. |
| **Disclaimer (`/#/disclaimer`)** | [`disclaimer-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/disclaimer-1280.png) | [`disclaimer-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/disclaimer-375.png) | `PageContainer` with 720px column; neutral icon tiles; design tokens; sentence-case labels. |
| **CertifiedPass (`/#/certifiedpass`)**| [`certifiedpass-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/certifiedpass-1280.png) | [`certifiedpass-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/certifiedpass-375.png) | "Explore CertifiedPass" shown once in dedicated showcase banner; real verification function results; collapsible Developer API section defaulting to collapsed. |
| **Help (`/#/help`)** | [`help-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/help-1280.png) | [`help-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/help-375.png) | Click-to-load video cards; interactive guides badge (removed "Coming soon" chip); protocol FAQ. |
| **Demo (`/#/demo`)** | [`demo-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/demo-1280.png) | [`demo-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/demo-375.png) | Interactive tour banner, sample data indicators, design tokens. |
| **Login (`/#/login`)** | [`login-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/login-1280.png) | [`login-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/login-375.png) | Web3-only connection modal (MetaMask, WalletConnect, Coinbase; zero email inputs). |

---

## 8. Modals

| Modal | 1280px Screenshot | 375px Screenshot | Key Redesign Transformations |
| :--- | :--- | :--- | :--- |
| **Fund Escrow Modal** | [`fund-modal-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/fund-modal-1280.png) | [`fund-modal-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/fund-modal-375.png) | Client milestone deposit & transaction lifecycle; design tokens; primary action. |
| **Payment Released Modal** | [`payment-modal-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/payment-modal-1280.png) | [`payment-modal-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/payment-modal-375.png) | Milestone payout completion & SBT celebration modal; design tokens. |
| **Insufficient Funds Modal** | [`funds-modal-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/funds-modal-1280.png) | [`funds-modal-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/funds-modal-375.png) | Low balance alert and top-up prompt; neutral styling. |
| **Wallet Balance Modal** | [`balance-modal-1280.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/balance-modal-1280.png) | [`balance-modal-375.png`](file:///c:/Movies/Polylance/polylance/docs/redesign/after/balance-modal-375.png) | Connected wallet balance & POL/USDC deposit guide with official token logos. |
