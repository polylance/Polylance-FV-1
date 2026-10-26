# PolyLance: Full App Redesign Prompt for Antigravity

**Goal:** redesign every page of the PolyLance app so it matches the new landing page (colors, type, buttons, cards, 3D visuals, motion), with **no change to functionality**, and a smoother, clearer experience for users.

**How to use this file**
1. Give Antigravity this whole file as the task. Ask it to work phase by phase (A, B, C, D, E, F, G), commit after each phase on a separate git branch, and report after each phase.
2. If it loses context, tell it to re-read sections 1 and 2 before continuing.
3. Before you start, put the official brand logo files in `public/brand/` (Polygon, USDC, USDT, MetaMask, WalletConnect, Coinbase). Antigravity must never redraw them.
4. This prompt covers the UI only. The certificate token (SBT) minting and artwork is a separate task.

---

## 1. Master rules

### 1.1 What must not change (functionality invariants)
- Do **not** change smart contract code or ABIs, wallet connection logic, XMTP messaging logic, API or backend calls, IPFS/Filebase logic, routing structure or route paths, data models, permissions, or business rules.
- Keep every existing feature, button action, form, filter, sort, role check, notification and flow working exactly as before. You may restyle, restructure layout, rename visible labels, add confirmation steps in front of existing actions, and add loading/empty/error states. You may not remove or alter what an action does.
- No mainnet transactions, ever. Test with the existing demo mode, a local chain, or Polygon Amoy testnet only. No private keys or secrets in code, logs or commits.
- If you find a bug that can only be fixed by changing logic or data, do **not** fix it silently: list it in the final report under "Needs a logic fix" with file and line.

### 1.2 Before touching anything
- Run install, lint, tests and build; record the results as the baseline.
- List every route, modal, dropdown, popover and form in the app. Write `docs/redesign/route-inventory.md`.
- Record a Lighthouse baseline (performance, accessibility, best practices) for landing, dashboard, jobs, job detail, messages.
- Take "before" screenshots of every route at 375, 768, 1280 and 1920 widths into `docs/redesign/before/` (use Playwright).
- Write down the list of key flows you will re-test after each phase (section 8).

### 1.3 Working rules
- Discover first: read `package.json`, the router, the styling approach, the shared components, the token file and the landing page implementation. The landing page is the visual reference; reuse its tokens and components instead of inventing new ones.
- Avoid new dependencies. If one is truly needed, list it with a one-line reason. At most one animation library, loaded lazily.
- Build must pass after every phase. If a phase breaks something, fix it before moving on.
- After each phase: list files changed, assumptions, and anything skipped.
- Do not invent data, testimonials, statistics, or claims. Demo or sample content is labeled "Sample". Real numbers only.
- Where a visible sentence looks like an unverified claim (security, privacy, legal, fees), do not rewrite it yourself; restyle it and record it in `docs/redesign/claims-to-verify.md` (see section 7).

---

## 2. Design system (extracted from the landing page)

### 2.1 Color (CSS variables, no hard-coded colors anywhere)
| Token | Value | Use |
|---|---|---|
| `--cobalt` | #0047AB | primary actions, links, active states, focus rings |
| `--cobalt-hover` | #003A8C | primary hover |
| `--cobalt-press` | #002F73 | primary pressed |
| `--cobalt-50` | #EAF1FB | soft tint backgrounds (selected rows, info banners) |
| `--ink` | #0B0B0F | headings, dark band background |
| `--text` | #374151 | body text (AA on white) |
| `--text-muted` | #6B7280 | captions (AA on white, never lighter) |
| `--bg` | #FFFFFF | page |
| `--bg-subtle` | #F6F7F9 | alternate bands, input wells |
| `--border` | #E5E7EB | 1px borders |
| `--border-strong` | #D1D5DB | inputs and secondary buttons |
| `--on-dark` | #FFFFFF | text on ink or cobalt |
| `--on-dark-muted` | #C7D2E5 | secondary text on ink or cobalt (must pass AA) |
| `--success` / `--warning` / `--danger` | #15803D / #B45309 / #B91C1C with 50-tint backgrounds | status only, never decoration |

Rules:
- Our own UI uses black, white, grays and cobalt only. **Remove** every other decorative hue: orange, red, pink, teal, green and amber tinted icon tiles, purple, navy-and-neon bands, multicolor language bars, rainbow tags, gold-colored cards.
- **Exception:** third-party brand logos keep their official colors (Polygon, USDC, USDT, MetaMask, WalletConnect, Coinbase).
- No gradients, glows, blurs or colored shadows. No translucent blurred headers: the top bar is solid white with a 1px bottom border.
- Dark surfaces: at most **one** near-black band or panel per page (Reputation hero, Safe-by-design, footer). Text on dark always uses `--on-dark` tokens. Fix every case of invisible text on dark or cobalt (black pill buttons with no label, dark headings on navy, dark blue eyebrow on black).

### 2.2 Typography
- One family everywhere: the landing page font (Plus Jakarta Sans variable) through a single `--font-sans` token, self-hosted, `font-display: swap`, metric-adjusted fallback. Monospace **only** for wallet addresses, hashes, contract addresses, IDs and code.
- Letter-spacing: display -0.02em, h2 -0.015em, h3 -0.01em, everything else 0. Word spaces must render everywhere (check placeholders like "Search jobs...").
- App scale (landing uses a larger fluid scale): page title 28/36 semibold; section title 20/28 semibold; card title 16/24 semibold; body 14-15/22; caption 12-13/18; stat numerals 32-40 semibold with `font-variant-numeric: tabular-nums`. Minimum text size 12px.
- Labels are sentence case, 12-13px, weight 500-600, `--text-muted`. **Remove all uppercase tracked mono labels** (for example "ESCROW BUDGET", "RECIPIENT WALLET ADDRESS *", "ACTIVE ESCROW CHANNELS", "CATEGORY", "VERIFIED CREDENTIALS").
- Numbers, amounts and balances use sans with tabular numerals, never mono (including the nav balance chip).
- Headings are one color. No two-tone headlines ("Risk Notice" in blue, "Data Control" in blue, "Gold League" in color, "Certified**Pass**" and similar).
- Eyebrow text: 13px, weight 600, cobalt, sentence case. On dark bands use `--on-dark-muted`.
- Headings `text-wrap: balance`; paragraphs `text-wrap: pretty`, max width 62ch.

### 2.3 Layout
- One shared `<PageContainer>`: max-width 1280px, centered, padding 24px desktop / 16px mobile. **Every** page uses it: legal pages, CertifiedPass, Treasury, Judge Panel, DAO, Settings, Attestations, certificate viewer, Messages shell, Workspace. No page has its own edge offsets (today edges differ: 187px, 197px, 227px, 317px, or cards touching the screen edge).
- Text-heavy pages (legal, help, certified pass copy): content column max 720px inside the container.
- Spacing scale 4, 8, 12, 16, 24, 32, 48, 64. Sections 32-48px apart. Page top padding 32px under the header.
- App pages use a white background with `--bg-subtle` wells for grouping; avoid putting white cards on white with only a faint shadow.
- Dashboard-type pages use a 12-column grid with a main column and a right rail; no big empty areas on either side (see page specs).

### 2.4 Buttons (replace every button in the app with one `<Button>`)
Props: `variant`, `size`, `as` (button, a or router link), `leadingIcon`, `trailingIcon`, `loading`, `fullWidth`. Never nest a button inside a link or the reverse. Inventory and migrate every `<button>`, link styled as a button, and legacy `btn` class, including black pills, brand-colored share buttons, old dark buttons and uppercase mono buttons ("EXPLORE CERTIFIEDPASS", "RUN VERIFICATION").
- Sizes: sm 36px, md 44px, lg 52px. Padding 0 16 / 20 / 24px. Font 15px (lg 16px), weight 600, no uppercase, no letter-spacing. Icon 18px, 8px gap, one row.
- Radius 10px (lg 12px). No shadows.
- **Primary:** solid cobalt, white text; hover `--cobalt-hover`; pressed `--cobalt-press`; trailing arrow nudges 2px on hover.
- **Secondary:** white, 1px `--border-strong`, `--ink` text; hover border `--ink` and `--bg-subtle`.
- **Ghost / link:** no background, underline on hover, 3px offset.
- **Inverse** (on dark or cobalt): white background, ink text. **Outline-inverse:** transparent, 1px white at 60%, white text.
- **Danger:** white with red text and border; destructive confirm: solid red.
- **Disabled:** `--border` background, muted text, no pointer. **Loading:** spinner replaces the icon, width stays fixed.
- Focus-visible: 2px cobalt ring with 2px offset (white ring on dark and cobalt). Pressed: scale 0.98 over 100ms.
- Icon buttons: 40px square minimum (44px on mobile), aria-label required.
- Segmented controls (Work/Hire, All/Active/Completed, Judges/Job escrows, All time/Monthly): one component, white track with `--bg-subtle`, selected segment white with 1px border and ink text, **not** black pills.
- Chips for filters: white, 1px border; selected: `--cobalt-50` background, cobalt text, cobalt border. No black selected chips.
- Share buttons (X, LinkedIn, link, PNG, PDF): one neutral icon-button set (outline, 40px) using the current X logo and a neutral LinkedIn glyph.
- Use the arrow-out icon only for real external links. In-app links get no arrow-out icon. Remove duplicate actions that appear twice on one screen ("Open messages", "Propose price & timeline", "Propose arbitrator candidate", "Explore CertifiedPass", "Edit profile" plus "Edit profile & skills").

### 2.5 Surfaces and components
- **Card:** white, 1px `--border`, radius 12px, padding 20-24px, no shadow (one subtle `0 1px 2px rgba(0,0,0,0.05)` is allowed on floating layers only: dropdowns, popovers, modals).
- **Stat card:** label (12-13px muted), value (32-40px tabular), optional delta or helper line. Value uses `<Amount>` for money.
- **Badges and status:** one `<StatusBadge>` with the set Open, Negotiating, Funded, In progress, Submitted, Completed, Disputed. Neutral gray for Open and Negotiating, cobalt tint for Funded and In progress, green tint for Completed, amber for Submitted, red for Disputed. Dot + label, sentence case. Tier badges (Silver, Gold, Diamond) use one neutral chip style with an outline medal icon, no orange or green fills.
- **Inputs, selects, textareas, search:** 44px, 1px `--border-strong`, radius 10px, white background, visible border always (the Treasury form currently has no visible input boxes). Label above, helper below, error text in `--danger`. One focus ring (never double rings; the Workspace search currently has two).
- **Tabs:** flat underline, cobalt active text and 2px cobalt underline that slides; counts as small gray chips.
- **Tables:** header row on `--bg-subtle`, 1px row dividers, explicit column widths, sticky header on long tables, horizontal scroll container on small screens, tabular numerals, role badges never wrap onto two lines.
- **Modals and drawers:** centered modal radius 12px on desktop, bottom sheet on mobile, flat dark overlay (no blur), focus trap, Esc closes, focus returns to the trigger.
- **Popovers and dropdowns** (account menu, notifications, More menu, contract switcher): white, 1px border, radius 12px, subtle shadow, 8px offset, keyboard navigable.
- **Toasts:** bottom right, slide in, auto dismiss in 5s, pause on hover/focus.
- **Empty states:** outline icon or one of the existing 3D images (see 2.7), one-line title, one-line explanation, one primary action.
- **Loading states:** skeletons that match the final layout (no full-page spinner); reserve exact dimensions (CLS 0).
- **Error states:** short plain message, what the user can do, a "Try again" button.
- **Banners:** info banners use `--cobalt-50` with a cobalt icon; warnings use amber tint; never full-saturation yellow.
- **Address chip:** mono, first 6 + last 4 characters (one casing everywhere), copy button, full value on hover.
- **Avatar:** one component; fallback is the wallet identicon or initials on a neutral background.

### 2.6 Shared formatters (display only)
- `<Amount>`: token amount first, fiat second and gray: "10 POL ~ $1.02". Never "$10 POL", "$1 USDC" ordering errors. Always show the official token logo (POL, USDC, USDT) next to the symbol.
- `<FeeBreakdown>`: Job budget, Platform fee (2.5%, read from the fee config), Total client deposit, Freelancer receives, plus the line "Client pays +2.5%. Freelancer receives 2.5% less." Use it everywhere fees appear. Never hard-code "0%" or "2.5%" in page copy; read the value from the same config.
- One date style: "Oct 1, 2026" and relative "9 days ago". When two dates appear for one object, label what each is ("Posted", "Escrow created", "Applied"), because today the same job shows "9d ago" and "22d ago" with no labels.
- One percentile and rank helper. One address formatter. One token-decimals helper (see Phase C).
- Rendering of markdown in descriptions (no raw asterisks); previews clamp to two lines.

### 2.7 Visual language (from the landing page)
- Calm, light, spacious. Large confident headings, generous whitespace, thin borders.
- The 3D visuals on the landing page (soft gray studio backdrop with cobalt-blue isometric objects: vault, wallet, tokens, certificate) are the illustration style. **Reuse existing 3D assets found in the codebase** for page headers, empty states and feature cards. Do not generate new imagery, do not use images that contain readable text or third-party logos.
- Icons: one outline icon set, 1.5px stroke, 20px, cobalt or muted gray. Remove colored icon tiles; icons sit in a neutral `--bg-subtle` rounded square (40px) or inline.
- The device-frame treatment (thin border, three neutral dots) is only for product previews, not for ordinary cards.

### 2.8 Brand logos
- `<PolygonLogo>`, `<TokenIcon symbol>`, `<WalletLogo name>` read official SVGs from `public/brand/`. Replace every generic chain icon that stands for Polygon or POL (nav balance chip, token cards, network rows, stat cards, treasury, certificates, tables, lists) with the official logo. Do not recolor or add effects. If a file is missing, show the plain text label and list the missing files in the report. The text "POL" must not be purple.

### 2.9 Motion
- Tokens: 100ms, 150ms, 250ms, 400ms; ease-standard `cubic-bezier(0.2, 0, 0, 1)`; exit `cubic-bezier(0.4, 0, 1, 1)`. Animate only transform and opacity.
- Page transition: 150ms cross-fade, scroll to top, focus to the page heading.
- Hover: border color change on cards and rows (no lift). Buttons: color change and arrow nudge.
- First view of a page: stat values count up once, charts draw in once, cards stagger 50ms (max 8 items), lists fade in. Nothing replays on scroll back.
- Dropdowns and popovers fade and move 4px; modals scale from 0.98; drawers slide; toasts slide in.
- Honor the existing Settings "Animations: Follow system / Reduced / Full". Under reduced motion keep opacity-only fades.
- Never animate decoratively in the app (no pulsing, glowing, floating, parallax).

### 2.10 Labels, "Sample" and "Coming soon"
- Anything demo is labeled "Sample" (small neutral chip). That includes the "4.95 / 5.0", "Certificate #3821", "3 of 3 consensus" style tiles on the landing page and in demo mode.
- "Coming soon" chips and disabled video buttons appear **only** in development builds (`import.meta.env.DEV`) and never in production. Today they show in Judge Panel, Messages, Job detail and Dashboard.
- Remove the VideoManager HUD from every public page; keep it behind Settings > Developer > "Show media diagnostics" (default off).

---

## 3. Phases

### Phase A: Audit and report (no visual changes)
1. Complete everything in section 1.2.
2. Grep and report counts before and after for: hard-coded hex colors outside the token file, gradients, colored or blurred shadows, purple/violet values, uppercase tracked labels, `font-family: mono` or monospace used outside addresses and code, font sizes under 12px, legacy button classes, per-page max-width or margin overrides, generic chain icons, duplicate component implementations, "Coming soon" strings, the word "email" in wallet or login UI.
3. Write `docs/redesign/claims-to-verify.md` (see section 7) and `docs/redesign/logic-bugs.md` (anything that needs a logic change).

### Phase B: Foundations
1. Tokens, font, container, spacing, radius, elevation (sections 2.1 to 2.3). Delete duplicated styles.
2. Build or fix shared components: Button (and IconButton, SegmentedControl, FilterChip), Card, StatCard, StatusBadge, TierBadge, Input, Select, Textarea, SearchField, TagInput, Tabs, Table, Modal, Drawer, Popover, Dropdown, Tooltip, Toast, EmptyState, ErrorState, Skeleton, Banner, AddressChip, Avatar, Amount, FeeBreakdown, PolygonLogo, TokenIcon, WalletLogo, PageHeader, PageContainer.
3. **Top bar:** solid white, 1px bottom border, logo, nav links (Dashboard, Find Jobs, Workspace, Messages, More), search, messages icon with unread badge, notifications bell with unread badge, balance chip (official Polygon logo, sans tabular numerals), account pill (identicon, short address, chevron). Active nav item: cobalt text and a 2px cobalt underline that slides. Fix the "More" item: it must not look active on pages outside it. Sticky with no blur.
4. **Account menu:** identity header (identicon, name or short address, copy), links Profile, Settings, Attestations, Help, Disconnect wallet (danger text). Keyboard operable.
5. **Notifications dropdown:** 360px wide, latest 8 items with icon, text, time and an unread dot; "Mark all as read"; empty state; each item links to its page.
6. **More menu:** grouped with small headings (Reputation: Leaderboard, Reputation, Attestations, CertifiedPass; Governance: Judge Panel, DAO, Treasury; Resources: Help, Demo, Terms, Privacy, Disclaimer). Role-gated items stay role-gated exactly as today.
7. **Footer:** near-black band, four columns (Product, Protocol, Resources, Legal) with logo and one-sentence description, official Polygon chip, fee line from config, copyright.
8. Add the shared `PageContainer` to every route and delete page-level width hacks.

### Phase C: Data display and consistency (display only)
Fix these in the shared formatters and components. If the value is wrong in the data source itself, report it in `logic-bugs.md` instead.
1. **USDC and token decimals:** Dashboard "Active Contracts" and "Recent workspace" show "0.00 USDC" and "0.01 USDC" for jobs listed as $10 and $15 USDC elsewhere. Use one decimals helper per token (USDC and USDT 6 decimals, POL 18) everywhere; show 2 decimals for amounts of at least 0.01, "< 0.01" otherwise.
2. **Amount format:** replace every "$X POL", "$0.01 POL", "$10 POL", "$0.1 USDC", "$2.60 USDC" with `<Amount>`.
3. **Messages budget mismatch:** the channel row shows 1.00 USDC, the banner "$1 POL" and the right panel 10 POL for one job. Label each value explicitly (Listed budget, Proposed in chat, Escrow) and read each from its own source; report any real mismatch.
4. **Counts:** Dashboard shows 7 certificates, Attestations 6; landing stats show 18 vs 19 jobs earlier. Use one selector per metric and report differences.
5. **Dates:** label each date's meaning (Posted, Escrow created, Applied, Completed).
6. **Labels:** "Smart contract settled" on an open job's fee card should reflect the real status ("Escrow not funded yet" when open). "Active Contracts (4)" lists completed jobs: add tabs Active | Completed and show the right items by tab. Find Jobs defaults to **Open** jobs with Completed behind a filter (keep all existing filters working).
7. **Tier badges:** one style (see 2.5); "Gold" is currently green on the dashboard and orange on Reputation.
8. **Fee naming:** "Platform fee" everywhere (replace "site maintenance fees", "protocol fee", "protocol resolution fee"; the Judge Panel may say "Arbitration fee" only if that is a distinct fee).
9. **Token standard name:** use one name (ERC-5192 soulbound) consistently; "Soulbound" chip, not "ERC-5192" mono pills.
10. **Fiat selector** on Find Jobs shows "US U.. Unite..": use "USD ($)" and "INR (₹)" with full labels, no truncation.
11. Remove raw markdown, duplicate title/description text, and raw wallet addresses where a display name exists (address stays as a small chip).

### Phase D: Page-by-page redesign
For each page: keep content and actions, apply the design system, and fix the listed issues. Every page gets loading, empty and error states.

**D1. Home (connected) and Dashboard**
- Header card: avatar, name, tier badge, address chip, network chip with the official Polygon logo; segmented Work | Hire; primary action by role (Work: Find jobs; Hire: Post a job); secondary Edit profile.
- Main column: Getting started checklist (neutral tiles, cobalt check on completion, "3/4 complete", the "Add funds" tile has a visible action; hide the whole card once all four are done), Recent workspace (compact row with StatusBadge and Open workspace button), Needs your attention (empty state with a small illustration and "All caught up"), Escrow funding account (official token logos, balances, Top-up primary), stat cards (Completed jobs, Net earned, Reputation score, plus profile completeness as a compact progress row, not a tall card with a gap above the bar), Monthly settlement chart (axis, month labels, hover values with units, one cobalt series, draws in once, empty state when no data; delete the phrase "Cobalt metric index"), Contracts list with tabs Active | Completed.
- Right rail: Verified work certificates (thumbnails, soulbound chip, View certificate), GitHub verification card (neutral, see D8), profile completeness if not 100%.
- No large empty regions: on desktop the rail starts at the same top as the main column.

**D2. Find Jobs**
- Page header with title, subtitle, fiat selector and Saved (count) button.
- Left filter panel (Category, Skills with tag input, Budget min/max with fiat hint, Posted date, Minimum reputation, Verified clients only, Applicants), "Clear all" and removable chips above results; mobile: "Filters" button opens a drawer with the active-filter count.
- Results: result count, sort select, job rows (title, budget via `<Amount>`, two-line clamp description, skill chips, meta line with posted time, Verified client, applicants, "Requires 700+ reputation"), bookmark icon button, StatusBadge. Whole row is clickable. Hover: border only.
- States: skeleton rows, "No jobs match your filters" with Clear filters, error with Try again. Pagination or load more as today.

**D3. Job detail**
- Header: back link, StatusBadge, client chip (avatar, name, verified check, links to profile), title, meta line (category, Posted date, Review window), "View on explorer" small link. Remove duplicate status and date lines.
- Left: description card (markdown rendered; the IPFS CID becomes a small chip "Stored on IPFS" with copy and a tooltip), status panel (one panel combining "Proposal active" and "Discuss terms": state, what happens next, one primary button "Open messages"), applicants list.
- Applicants: avatar, name, Verified chip, address chip once, reputation and GitHub score chips with tooltip, "View details" (expand) and "View profile", proposal text ("No cover note provided" when empty), skills chips, applied date; expanded view shows performance, certificates and GitHub activity as three neutral stat blocks.
- Right rail (sticky): Budget card with `<FeeBreakdown>`, one primary action by role and state (Apply, Open messages, Fund escrow, Submit work, Release payment), **escrow timeline** rebuilt as a vertical stepper with the landing-page look: numbered circles on a connecting line, completed steps with a cobalt check, current step highlighted with one-line "what happens next", dates under completed steps, tx hashes as address chips. Client summary card (factual stats, "New client" label when under 5 jobs; no star rating).
- "Coming soon" and video buttons: dev only.

**D4. Post Job**
- Left-aligned title and subtitle. Single column of numbered sections: 1 Basics (title, category cards, skills tag input), 2 Description (markdown toolbar kept, Write/Preview, counter), 3 Budget and payment (POL/USDC/USDT cards with official logos and live price, amount, optional local-currency toggle, presets), 4 Timeline and review window (with plain helper text), 5 Review.
- Sticky right summary with `<FeeBreakdown>`, exchange rate with refresh, three guarantees (plain wording). Remove duplicated summary cards inside the form and the repeated feature tiles at the bottom.
- Submit: "Review and post job" primary (disabled until valid with a list of what is missing), "Save draft" secondary. The existing submit logic runs after a confirmation modal (summary, fee breakdown, balance) with "Confirm and fund escrow". Insufficient balance state with a Top-up link. Use the shared transaction-stage component for progress (real wallet events only).

**D5. Workspace**
- Contract switcher: replace the loose panel with a proper popover or command palette (backdrop, shadow, focus trap, Esc, one focus ring). Rows show title, role chip (Applicant / Freelancer / Client, neutral), `<Amount>`, short address chip, date and StatusBadge.
- Header row for the selected contract with Messages and Listing buttons (no arrow-out icons).
- Milestone timeline: stepper with connectors (Funded, In progress, Submitted, Approved, Paid) in the landing style; current state highlighted; one StatusBadge only (today "Open" appears three times).
- Negotiation or status panel: icon should match meaning (message icon for negotiation, not the scales); three stat cards (Listed budget, Review period, Candidates) in sentence-case labels with `<Amount>`.
- Actions: one primary, one secondary.

**D6. Messages (Job escrows and Judges)**
- Three panes inside the container: channels (tabs All / Active / Completed, Judges | Job escrows segmented control, search), chat, details.
- Channel rows: avatar, counterpart name (never truncated to "Su..."; allow two lines), job title, last message, time, unread badge, StatusBadge, `<Amount>`. Selected row: `--cobalt-50` background, 2px cobalt left border, **dark readable text** (today the selected row shows white text on light blue and the job title is unreadable; the Judges channel name is also invisible).
- Chat: sans bubbles (own: cobalt with white; other: `--bg-subtle`), "You" labels, day separators, delivered ticks, timestamps 12px, tight spacing. Header: counterpart, role chip, address chip, Job Details (no arrow), Hide/Show job details. Judges chat: Approve Payment and Job Details as normal buttons.
- Composer: attach, input, emoji, secondary "Propose price & timeline" and primary Send. XMTP microcopy at 12px readable gray.
- Right pane: job summary, `<FeeBreakdown>`, escrow contract chip, StatusBadge, View job, "Protected by decentralized arbitration" as an info row with tooltip; arbitrator profile (Cases resolved, Average resolution) for the Judges tab with sentence-case labels.
- Mobile: one pane at a time with back navigation; details as a bottom sheet.
- Test content ("hi", "hey", "hello"): keep real user data; if it is seed or demo data, label "Sample".

**D7. Profile and Edit profile**
- Header: avatar, name, Verified chip, tier badge, address chip, copy link, rate chip; owner: Edit profile (single button); visitor: Hire and Message if those flows exist.
- Stats row, then tabs Overview | Portfolio | Certificates | Reviews with counts.
- Overview: About, Skills (neutral chips), GitHub verification card. Portfolio: merged completed jobs, two columns, no raw markdown, certificate links. Certificates: list with thumbnails and neutral share buttons. Reviews: rating, text, job, date; empty state.
- Edit profile: single column form with sections, inline validation, Save/Cancel, unsaved-changes warning. Behavior unchanged.

**D8. GitHub verification card (reused on Dashboard and Profile)**
- Neutral card, GitHub icon, "GitHub verification" with a verified check, score "566 / 1000" with tooltip, tier chip. Language contributions: single stacked bar in cobalt shades and grays (no purple, orange, yellow), list with language and percentage, attestation hash chip with copy. Bar fills once on first view.

**D9. Leaderboard and Reputation**
- Leaderboard: header, search and role select, tie-break note as an info row, podium cards (Silver, Leader, Bronze become neutral rank chips; the leader card has a cobalt border), table with fixed columns, role badges on one line, tabular numerals, avatars via the shared Avatar, links to profiles, "You" chip.
- Reputation: **one** dark hero (rank, tier, points) using on-dark tokens, score card, point breakdown with cobalt progress bars (not green), tier thresholds as a vertical list: current tier gets a cobalt-50 background and a "Current" chip; locked tiers show a lock icon and "Inspect". No orange or green tier colors.

**D10. Attestations and certificate viewer**
- Attestations header card with the two stats, search and sort, filter chips (All, Proof of work, Patronage with counts), grid of certificate cards (3 per row desktop, equal heights, token logo plus `<Amount>`, soulbound chip, certificate id chip, "View certificate" secondary, neutral share icon buttons).
- Viewer: PageContainer width; toolbar with Soulbound chip, certificate id chip, "Verify on CertifiedPass" (secondary, external icon), Share group (X, LinkedIn, Copy link), Save PNG, Print / PDF as one overflow-friendly button group; the existing ornate certificate artwork stays as the centerpiece (do not redraw it), only its surrounding UI changes.

**D11. Judge Panel, DAO and Treasury**
- Judge Panel: title, role chip, tabs (Dispute queue and verdicts | Appointed judges; the active tab text must be visible), three stat cards (sentence-case labels, `<Amount>` for fees), Open dispute queue card with an empty state ("All smart contract escrows are in good standing") or a table of cases, "Invite / Appoint Judge" primary.
- DAO: title, "Governor" chip, "Propose arbitrator candidate" once (header only; the empty state links to the same action as a secondary), the governance rule as an info banner (`--cobalt-50`), proposals list with vote progress bars, empty state with an existing 3D image.
- Treasury admin: restricted-access chip; three stat cards with official token logos; tabs Overview | Terminal log (sentence case; "CLI Terminal Log" becomes "Activity log"); the disbursement form with visible inputs, labels in sentence case, address field in mono, helper text, primary "Create withdrawal proposal". Role gating unchanged.

**D12. Settings**
- Left sticky side menu (Profile, Notifications, Privacy and data, Appearance, and Admin only for admin roles) and a content column. Page title "Settings" (not "Identity Studio").
- Profile card, Telegram alerts (Linked chip, Disconnect as secondary danger), Trust & audit certificate (View & download PDF), Appearance (segmented Animations: Follow system / Reduced / Full), Developer (Show media diagnostics, off by default).
- Admin controls (protocol parameters): same functionality, shown only to the same roles, in the Admin section.
- Delete account: the existing actions stay, but put them in a Danger zone card with plain wording (describe in neutral terms that profile and off-chain records are removed and that blockchain data cannot be deleted; copy needs your approval, record it in claims-to-verify), a typed confirmation ("DELETE") before the existing action runs, and the scheduled option as secondary.

**D13. Legal pages (Terms, Privacy, Disclaimer)**
- PageContainer plus a 720px text column. Header: eyebrow, one-color title, one-paragraph summary, neutral "Last updated" and "Version" chips (sans).
- Terms: sticky index on the left (neutral list; selected item has cobalt-50 background and a cobalt left border, **not** a black pill), content card on the right with numbered sections, in-page anchors, "Back to top".
- Privacy and Disclaimer: numbered section cards in a single column, neutral icons (no colored tiles), checklist rows in sans (not mono).
- Replace the navy "Privacy Health Guarantee" band with a neutral info card or the single dark band with correct on-dark text.
- Do not rewrite legal substance. Fix obvious typos ("agree to bound yourself" becomes "agree to be bound by"; "Privacy Health Guarantee" becomes "Privacy summary") and restyle. Everything else goes to `claims-to-verify.md`.
- The "Have questions" block: one primary and one secondary button, both with visible labels.

**D14. CertifiedPass**
- Hero: shield tile, eyebrow, one-color title "CertifiedPass", one-sentence description, actions: primary "Verify a certificate", secondary "How it works", secondary "Leaderboard". Show "Explore CertifiedPass" **once** (it currently appears twice).
- Sections: What is CertifiedPass (three neutral feature cards), Verify a certificate (the tool: certificate id field, primary "Verify", and a four-row result list: each check shows idle, checking (spinner), pass or fail using the **actual results the existing function returns**; no invented checks), How verification works (four numbered cards), How to use it (two cards: freelancers, clients), Developer section (collapsed by default, code block in `--ink` with a copy button; show the curl example only if the endpoint exists and responds, record in claims-to-verify), closing line.
- Replace jargon ("Sovereign", "trustless", "cross-protocol attestation engine") with plain wording in headings only if it is a label; otherwise record in claims-to-verify.

**D15. Help, Demo, Connect Wallet, Top-Up, 404**
- Help: video grid shells and FAQ in landing style; videos load only on click.
- Demo: banner and tour styling per the landing page; read-only behavior unchanged.
- Connect Wallet modal (desktop modal, mobile bottom sheet): title, "Your wallet is your PolyLance login. No email or password.", rows for MetaMask (Recommended), WalletConnect, Coinbase Wallet with official logos, installed-wallet detection if already implemented, states (connecting, rejected, not installed, wrong network with Switch to Polygon). **Remove every email option** and any "OR" divider (login is Web3 wallets only). Header button states: Connect wallet (primary, wallet icon), Connecting, Wrong network (amber outline "Switch to Polygon"), connected pill.
- Top-Up modal: plain explanation, balances with logos, existing funding methods only, primary action.
- 404: simple page with the existing 3D image, "Page not found", primary "Go to Home".

### Phase E: Responsive and mobile (375 to 1920)
- Header collapses into logo, search icon, messages, notifications, wallet and a hamburger drawer (links, search, role switch, Connect wallet). Sticky bottom action bar on Find Jobs, Job detail and Workspace with the main action.
- Grids collapse: dashboards to one column (rail below main), stat cards 2 per row then 1, tables scroll horizontally inside containers, bento and certificate grids to one column.
- Filters, contract switcher and details panes become drawers or bottom sheets.
- Tap targets at least 44px, text at least 14px for body, inputs 16px on mobile to avoid zoom.
- Check 375, 390, 414, 768, 1024, 1280, 1440, 1920 on every route; no horizontal page scroll, no clipped text, no overlapping sticky elements.

### Phase F: Motion and polish
- Apply section 2.9: page transition, count-ups, chart draw-in, staggers, popover and modal transitions, skeletons everywhere data loads.
- Hover, focus and pressed states audited on every interactive element.
- Smoothness: debounced search and filters (250ms), optimistic UI for saves where the existing logic already supports it, no layout jumps (reserve space), scroll position restored on back navigation, focus handled on route change.
- Performance: lazy-load images and below-the-fold components, split heavy routes, `content-visibility: auto` on long lists, font preload for the main file only, no animation on more than ~50 elements at once.

### Phase G: QA and final report
1. Re-run lint, tests, build. Compare with baseline.
2. Run the key flows (section 8) on demo mode or testnet; confirm identical behavior.
3. Playwright screenshot sweep (all routes, all widths) into `docs/redesign/after/`; produce a before/after index.
4. Accessibility: axe on every route (zero critical or serious), keyboard-only pass on nav, popovers, modals, forms, tables, tabs; visible focus; contrast AA; aria-labels on icon buttons; reduced-motion check.
5. Lighthouse: performance, accessibility and best practices not worse than baseline; CLS 0.
6. Repeat the Phase A greps and show before/after counts; all targets must reach zero.
7. Write the final report (section 9).

---

## 4. Navigation and role invariants (do not change, only restyle)
- Which links are visible to which roles (judge, admin, DAO, treasury) stays identical.
- The Hire / Work switch keeps its behavior and persistence.
- Notification and message data sources stay as they are.

## 5. Copy rules
- Plain language in labels and headings: escrow, certificate, judges, your reputation. Technical terms (EIP-1167, ERC-5192, CID, ECDSA, XMTP, multisig) go in tooltips or secondary text, not headlines.
- Sentence case for all labels, buttons and headings.
- Do not add new promises. Do not delete existing legal text. Do not state security, privacy or compliance facts that the code does not enforce.

## 6. Accessibility rules
- WCAG 2.2 AA. Visible 2px cobalt focus rings. All interactive elements keyboard reachable. Menus: Arrow keys, Esc, focus return. Modals trap focus.
- Status is never conveyed by color alone (text or icon too).
- Charts have text alternatives and a data table toggle or tooltip values.
- Motion respects the OS setting and the in-app Appearance setting.

## 7. Claims to verify (create `docs/redesign/claims-to-verify.md`)
List each sentence below (and any similar ones you find) with file, line and current wording. Do not rewrite them; restyle only. The owner will confirm the facts.
1. **Fee:** Terms says "0% platform fee on beta" and the admin panel says "Protocol fee rate 0.0%" and "0% sovereign fee model enforced across all escrow contracts", while the app charges and displays 2.5%. Bind displayed values to the fee config and flag every hard-coded fee.
2. **Privacy:** "PII collected: 0 bytes", "0 days retention (non-custodial)", "no analytics", "no signup forms", versus Telegram linking and an off-chain database that stores profiles, messages and records.
3. **Zero-knowledge and confidentiality:** "Zero-Knowledge Privacy Preservation", "financial contracts permanently shielded", versus public on-chain amounts and public payout figures in certificates and stats.
4. **Decentralization:** "No centralized entity or team member holds custody at any point", "no central administrator", "Autonomous", "Sovereign", versus an Oracle node signing deliverables, a protocol admin role, treasury multisig, and "platform admins step in if DAO quorum is not reached".
5. **Legal:** "In full compliance with GDPR Article 17" and similar compliance statements need legal review.
6. **Audits:** "View Contract Audits", "Slither Audited" (automated analysis is not a formal audit), "Security Audit Rating 100% Passed".
7. **Developer endpoint:** the CertifiedPass curl example and "REST v1 active" if the endpoint is not live.
8. **Guarantees:** "100% payment certainty", "cannot be pulled back arbitrarily", "no arbitrary account freezes", "guaranteed".
9. **Sample data on public pages:** ratings, certificate numbers, consensus counts that are not real.
10. **Counts and totals:** mismatches such as certificates 7 vs 6, completed projects 18 vs 19.

## 8. Key flows to re-test after every phase (demo mode or testnet only)
Connect wallet, switch Hire/Work, browse and filter jobs, save a job, open job detail, apply, open messages and send a message, propose price and timeline, post a job (validation, save draft, confirmation), fund escrow (transaction stages), submit work, approve and release, raise a dispute and judge verdict, view certificate, share and print certificate, verify a certificate id, edit profile and save, change Appearance, link and disconnect Telegram, notifications open and mark as read, search, role-gated pages (Judge Panel, DAO, Treasury) for allowed and not-allowed roles, disconnect wallet.

## 9. Final report format
1. Summary of what changed per phase, with before/after screenshot index.
2. Files created, changed, deleted; dependencies added (with reason).
3. Before/after counts from the Phase A greps.
4. `Needs a logic fix` list (from `logic-bugs.md`).
5. `Claims to verify` list (from `claims-to-verify.md`).
6. Missing assets (brand logos, 3D images) and exact paths expected.
7. Flow test results (section 8), accessibility and Lighthouse results versus baseline.
8. Assumptions made and anything skipped, with reasons.

## 10. Acceptance checklist
- [ ] No gradients, glows, blurs, purple, rainbow tags, tinted icon tiles, two-tone headings or uppercase mono labels remain (except third-party logos).
- [ ] Every page uses PageContainer; no page has custom edge offsets; legal and CertifiedPass pages no longer touch the screen edges.
- [ ] One font family; mono only for addresses, hashes, IDs and code; amounts and the balance chip are sans with tabular numerals; no text under 12px.
- [ ] One Button system app-wide; no black pills; no invisible text on dark or cobalt surfaces; no duplicate actions; arrow-out icons only on external links.
- [ ] Official Polygon, token and wallet logos in place (or listed as missing); no generic chain icon stands for Polygon.
- [ ] Top bar solid and consistent; More item not falsely active; notifications and account menus styled and keyboard operable.
- [ ] Amounts, fees, dates, counts, tier badges and statuses are consistent everywhere; USDC decimals correct; Find Jobs defaults to Open.
- [ ] Every page in Phase D matches its spec, with loading, empty and error states.
- [ ] Messages selected row, Judges channel name and Judge Panel active tab are readable.
- [ ] "Coming soon" chips and the media HUD are absent in production builds.
- [ ] No email login option anywhere; Connect Wallet modal is wallet-only.
- [ ] Mobile layouts pass at 375, 390, 414, 768; no horizontal scroll.
- [ ] Motion follows the tokens, respects reduced motion and the Appearance setting, and nothing animates decoratively.
- [ ] All key flows behave exactly as before; build, lint and tests pass; Lighthouse and CLS are no worse than baseline; axe reports no critical or serious issues.
- [ ] `claims-to-verify.md` and `logic-bugs.md` delivered; no legal or security wording was rewritten without approval.
