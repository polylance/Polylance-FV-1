# Logic & Data Bugs (To Be Tracked)

The following logic and data bugs were identified during the front-end audit:

| Bug ID | Component / File | Description | Impact & Recommended Fix |
| :--- | :--- | :--- | :--- |
| **LB-01** | `Dashboard.tsx`, `JobWorkspace.tsx` | Token Decimals: USDC amounts occasionally display as `0.00 USDC` or `0.01 USDC` when raw contract balances represent 6-decimal values instead of 18-decimal values. | Apply unified `formatTokenAmount(amount, 'USDC')` handling 6 decimals for USDC/USDT and 18 decimals for POL. |
| **LB-02** | `Chat.tsx` | Selected channel styling: the selected channel in the messages list historically had poor contrast (`--cobalt-50` background with light blue or white text) making the recipient name and job title hard to read. | Restyle selected channel row with dark readable text (`#0B0B0F` for title, `#374151` for snippet), 2px solid cobalt left border, and `#EAF1FB` tint background. |
| **LB-03** | `FindJobs.tsx` | Filter defaulting: Find Jobs should filter `status === 'Open'` by default so completed or disputed jobs don't clutter the initial view unless explicitly filtered. | Enforce `isJobOpen` filter as the default state with completed jobs accessible via filter or search. |
| **LB-04** | `PostJob.tsx` | Budget calculation and platform fee breakdown: Ensure the client deposit reflects `+2.5%` platform fee while the freelancer receives `amount - 2.5%`. | Use shared `<FeeBreakdown>` component with config-driven rate. |
| **LB-05** | `Navbar.tsx` | Active state on 'More' menu item: on child or external routes, the 'More' item would sometimes falsely show an active blue indicator. | Refine active route matching so 'More' only highlights when on `/dao`, `/judge`, `/treasury`, or `/analytics`. |
