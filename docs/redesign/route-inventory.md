# PolyLance Route & Component Inventory

## 1. Application Routes (App.tsx)

| Path | Component | Access / Role | Description |
| :--- | :--- | :--- | :--- |
| `/` | `Landing.tsx` (or `CertifiedPass` on subdomain) | Public | Main landing page (UNTOUCHED per user directive) |
| `/overview` | `Landing.tsx` / `CertifiedPass` | Public | Overview alias |
| `/dashboard` | `Dashboard.tsx` | Authenticated | User dashboard with stats, checklist, active escrows, rail |
| `/jobs` | `FindJobs.tsx` | Public | Job marketplace search & domain filter |
| `/jobs/:id` | `JobDetail.tsx` | Public | Milestone escrow job detail & proposal flow |
| `/jobs/post`, `/post-job` | `PostJob.tsx` | Authenticated | Multi-section job creation & funding form |
| `/workspace` | `JobWorkspace.tsx` | Authenticated | Active contract workspace, deliverables, reviews |
| `/chat`, `/chat/:jobId` | `Chat.tsx` | Authenticated | 3-pane decentralized messaging & dispute arbitration chat |
| `/profile`, `/profile/:address`| `Profile.tsx` | Public / Authenticated | User profile, reputation, portfolio, SBT certificates |
| `/reputation` | `Reputation.tsx` | Public / Authenticated | On-chain reputation score, tiers, leaderboard |
| `/settings` | `Settings.tsx` | Authenticated | User settings (Appearance, Telegram, Privacy, Danger Zone) |
| `/certifiedpass`, `/verify` | `CertifiedPass.tsx` | Public | Certificate verification engine & explorer |
| `/certificate/:tokenId` | `Certificate.tsx` | Public | Full-screen verifiable Soulbound Token certificate viewer |
| `/c/:id`, `/attestation/:id` | `JobAttestationReport.tsx` | Public | Individual job attestation report |
| `/audit`, `/audit/:address` | `AuditReport.tsx` | Public | Trust & reputation audit report |
| `/judge` | `Judge.tsx` | Role-gated (Judge/Admin) | Dispute arbitration queue, appointed judges |
| `/dao` | `Dao.tsx` | Role-gated (Governor) | Protocol governance, arbitrator proposals & voting |
| `/treasury` | `Treasury.tsx` | Role-gated (Admin) | Treasury status, multi-sig disbursement proposals |
| `/analytics` | `Analytics.tsx` | Authenticated | Platform metrics, volume, settlement charts |
| `/login` | `Login.tsx` | Public | Dedicated Web3 wallet connection view |
| `/help` | `Help.tsx` | Public | Video tutorials and protocol FAQ |
| `/demo` | `Demo.tsx` | Public | Guided interactive demo tour |
| `/terms` | `Terms.tsx` | Public | Terms of Service with sticky index |
| `/privacy` | `Privacy.tsx` | Public | Privacy Policy with section navigation |
| `/security` | `Security.tsx` | Public | Protocol security & smart contract guarantees |
| `/disclaimer` | `Disclaimer.tsx` | Public | Risk notices & protocol disclaimers |
| `/manifesto` | `Manifesto.tsx` | Public | Decentralized vision manifesto |
| `/maintenance` | `MaintenancePage.tsx` | Public / Admin bypass | Standalone platform maintenance lock screen |

## 2. Modals, Drawers & Popovers Inventory

- `LoginModal` / `ConnectWalletModal`: Web3 wallet login (MetaMask, WalletConnect, Coinbase Wallet).
- `FundEscrowModal`: Client milestone deposit & transaction lifecycle.
- `PaymentReleasedModal`: Milestone payout completion & SBT celebration modal.
- `InsufficientFundsModal`: Low balance warning and top-up prompt.
- `WalletBalanceModal` / Top-up modal: Connected wallet balance & POL/USDC deposit guide.
- `EditProfileModal`: Profile metadata & skill tags update dialog.
- `DeliverableSubmissionModal`: Work proof, IPFS hashes, external deliverables submission.
- Mobile Drawer (`Drawer.tsx`): Filter drawers on mobile FindJobs and navigation drawer.
- Contract Switcher Popover: Dropdown/command palette on JobWorkspace.
- Account Popover: Header account menu (Profile, Settings, Attestations, Disconnect).
- Notifications Dropdown: 360px wide dropdown with unread status.
- More Menu Popover: Grouped links (Reputation, Governance, Resources).

## 3. Major Forms Inventory

- Post Job Wizard (`PostJob.tsx`): Title, domain category, skills, markdown description, budget & token, milestone review period.
- Job Proposal Form (`JobDetail.tsx`): Cover letter, bid amount, timeline, portfolio links.
- Deliverable Submission (`DeliverableWorkSubmissionPanel.tsx`): Submission notes, IPFS hash proofs, file attachments.
- Edit Profile Form (`EditProfileModal.tsx`): Display name, title, bio, hourly rate, GitHub username, skills.
- Treasury Disbursement Form (`Treasury.tsx`): Recipient address, token, amount, memo.
- DAO Arbitrator Proposal Form (`Dao.tsx`): Candidate wallet address, credentials, rationale.
- Settings Danger Zone Form (`Settings.tsx`): Typed "DELETE" confirmation for account removal.
