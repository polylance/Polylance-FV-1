# PolyLance Overlay Architecture & Diagnostic Report (Part A1)

## 1. Executive Summary & Root Cause Diagnosis

### Root Cause A: Popups Not Appearing in View (User Must Scroll)
- **Primary Mechanism**: Lack of a document-level Portal (`createPortal` / Radix Dialog Portal) mounted at the root `<body>`.
- **Offending Pattern & Files**:
  - `frontend/src/components/common/Modal.tsx` (Lines 49–53)
  - `frontend/src/components/WalletBalanceModal.tsx` (Lines 217–234)
  - `frontend/src/components/FundEscrowModal.tsx` (Lines 76–85)
  - `frontend/src/components/PaymentReleasedModal.tsx` (Lines 88–95)
  - `frontend/src/components/GithubVerifyModal.tsx` (Lines 95–102)
  - `frontend/src/components/ModifyJobModal.tsx` (Lines 118–125)
  - `frontend/src/components/InsufficientFundsModal.tsx` (Lines 60–68)
  - `frontend/src/components/RaiseDisputeModal.tsx` (Lines 105–115)
  - `frontend/src/components/NegotiationProposalModal.tsx` (Lines 70–80)
- **Detailed Explanation**:
  These modal components were rendered inline inside nested page components (such as `PageContainer`, `JobDetail`, or components wrapped with `motion.div` from Framer Motion). When an ancestor element applies a CSS `transform`, `filter`, `perspective`, or `contain` property, the CSS standard dictates that this element becomes the containing block for all descendant elements with `position: fixed`. As a result, the modal's `fixed inset-0` bounds were clamped to the transformed parent's coordinate space rather than the browser viewport. When the user was scrolled down the page, the modal rendered off-screen at the page's top or relative offset, forcing the user to scroll to find it.

### Root Cause B: Notifications & Wallet Balance Dropdowns Not Scrolling
- **Primary Mechanism**:
  1. **Notifications Dropdown** in `frontend/src/components/Navbar.tsx` (Lines 517–573):
     - Rendered inline with `absolute top-full right-0` inside a `sticky top-0 z-50` header.
     - Lacked `overscroll-behavior: contain`. When scrolling inside the dropdown, wheel events propagated directly to the document body behind it.
     - Hardcoded `notifications.slice(0, 6)` capped notifications, hiding longer lists from keyboard and scroll navigation.
     - Lacked collision detection and viewport boundary clamping (`min(480px, available space)`).
  2. **Wallet Balance Modal / Popover** in `frontend/src/components/WalletBalanceModal.tsx` (Lines 217–311):
     - Rendered inline in `Navbar.tsx` inside the header DOM tree.
     - Fixed `max-h-[92vh]` modal with nested non-contained scroll regions caused wheel events to bubble to the main page.
     - Lacked body scroll lock and proper internal overscroll containment (`overscroll-behavior: contain`).

---

## 2. Complete Inventory of PolyLance Overlays

| Overlay Name | Component File | Rendering Method (Before) | Position Method | Target Architecture (After) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Connect Wallet Modal** | `LoginModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal>` via `<OverlayRoot>` portal | Migrated |
| **Wallet Balance Dropdown / Popover** | `WalletBalanceModal.tsx` | Inline `fixed inset-0` inside Navbar | Centered modal | Anchored Popover / `<Modal>` via `<OverlayRoot>` | Migrated |
| **Notifications Dropdown** | `Navbar.tsx` | Inline `absolute top-full` | Unanchored absolute | Radix Popover with internal scroll & sticky header/footer | Migrated |
| **Account Menu Popover** | `Navbar.tsx` | Inline `absolute top-full` | Unanchored absolute | Radix DropdownMenu via Portal | Migrated |
| **More Menu Popover** | `Navbar.tsx` | Inline `absolute top-full` | Unanchored absolute | Radix DropdownMenu via Portal | Migrated |
| **Top-Up / Deposit Modal** | `WalletBalanceModal.tsx` & `InsufficientFundsModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="sm">` via `<OverlayRoot>` | Migrated |
| **Post Job Confirmation** | `PostProgressModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="md">` via `<OverlayRoot>` | Migrated |
| **Fund Escrow Modal** | `FundEscrowModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="md">` via `<OverlayRoot>` | Migrated |
| **Payment Released Modal** | `PaymentReleasedModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="md">` via `<OverlayRoot>` | Migrated |
| **Propose Price / Terms Modal** | `NegotiationProposalModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="md">` via `<OverlayRoot>` | Migrated |
| **Appoint Judge / Arbitrator** | `AdminJudgeManagementPanel.tsx` | Inline dialog | Centered viewport | `<Modal maxWidth="md">` via `<OverlayRoot>` | Migrated |
| **Treasury Proposal Confirm** | `Treasury.tsx` | Inline dialog | Centered viewport | `<ConfirmDialog>` via `<OverlayRoot>` | Migrated |
| **Edit Profile Dialog** | `UserProfileBioModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="lg">` via `<OverlayRoot>` | Migrated |
| **Delete Account Confirm** | `Settings.tsx` | Native alert/inline dialog | Centered viewport | Typed `<ConfirmDialog>` (destructive) | Migrated |
| **GitHub Verify Modal** | `GithubVerifyModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="sm">` via `<OverlayRoot>` | Migrated |
| **Raise Dispute Modal** | `RaiseDisputeModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="md">` via `<OverlayRoot>` | Migrated |
| **Modify Job Modal** | `ModifyJobModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="md">` via `<OverlayRoot>` | Migrated |
| **PolyLance Alert Modal** | `PolyLanceAlertModal.tsx` | Inline `fixed inset-0` | Centered viewport | `<Modal maxWidth="sm">` via `<OverlayRoot>` | Migrated |
| **Video Modal** | `components/video/VideoModal.tsx`| Portal | Centered viewport | Standardized `<Modal maxWidth="xl">` | Migrated |
| **Workspace Contract Switcher**| `JobWorkspace.tsx` | Inline absolute dropdown | Relative | `cmdk` Popover via `<OverlayRoot>` | Migrated |
| **Filter Drawer (Mobile)** | `FindJobs.tsx` | Inline fixed container | Bottom/Side | `<Sheet>` via `<OverlayRoot>` | Migrated |
| **Toasts** | `sonner` | Top/Bottom portal | Fixed portal | Standardized 500 z-index Sonner provider | Migrated |
| **Tooltips** | `components/common/Tooltip.tsx` | Inline relative hover | Hover container | Radix Tooltip via Portal | Migrated |

---

## 3. Z-Index Token Architecture
To prevent any overlay from rendering under headers or behind modal backdrops:
- `Header`: `z-index: 100`
- `Dropdown & Popover`: `z-index: 200`
- `Drawer & Mobile Sheet`: `z-index: 300`
- `Modal & Dialog`: `z-index: 400`
- `Toast`: `z-index: 500`
- `Tooltip`: `z-index: 600`

---

## 4. Scroll & Collision Architecture (A3 & A4)
1. **Modal Visibility**: Every modal is mounted via `<OverlayRoot>` in `#overlay-root` at the document root with `position: fixed; inset: 0; z-index: 400; height: 100dvh; display: flex; align-items: center; justify-content: center;`.
2. **Scroll Lock**: Opening any modal or sheet locks document body scrolling without layout shift using `scrollbar-gutter: stable`.
3. **Internal Containment**: All scrollable bodies apply `overscroll-behavior: contain; overflow-y: auto;`.
4. **Collision Clamping**: Anchored popovers enforce `max-height: min(480px, calc(100dvh - 32px))` and automatic flip/shift positioning via Radix Popper.
