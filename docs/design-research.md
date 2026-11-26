# PolyLance Marketplace Design Research (`docs/design-research.md`)

**Date:** 2026-11-25  
**Scope:** Structural analysis of 7 benchmark freelance marketplaces — **Upwork, Fiverr, Contra, Toptal, Freelancer.com, Truelancer, and Braintrust** — mapped to PolyLance's core product principles and updated Rules Update.

---

## Browsing Availability Note

Logged-out public structure and documented UI patterns for all 7 platforms were gathered via live web search (`search_web`). Authenticated/logged-in views require platform accounts and were not bypassed; patterns for logged-in workflows reflect published workflow documentation alongside standard marketplace interaction conventions: search-first entry, persistent category rail below header, split entry for clients and workers, portfolio-first profiles, verified skill/payment badges, milestone escrow states, and scannable job rows.

---

## 1. Benchmark Comparison Table

| Pattern / Surface | Who Uses It | Borrow, Avoid, or Do Differently on PolyLance |
| :--- | :--- | :--- |
| **Header & Primary Navigation** | **Upwork** (Find Talent / Find Work + Search), **Fiverr** (Search + Order/Messages icons + Avatar), **Contra** (Explore / Jobs / Portfolio / Search) | **Borrow & Simplify:** Single-row `<= 1200px` max-width container with strict `min-width: 0` + flex shrink. Limit primary nav links to 4 items. **Do Differently:** Move *Dashboard* into the avatar menu (clicking the PolyLance logo goes to `/dashboard` when logged in); keep **Messages** and **Notifications** icon-only so zero controls ever clip at `1280px–1920px`. |
| **Category Discovery (Hero, Rail, Mega-Menu, Directory)** | **Fiverr** (persistent horizontal category rail under header + hover mega-menu), **Upwork** (discipline directory cards + sub-skills), **Truelancer** (broad category buckets + skill lists), **Braintrust** (focused engineering/product taxonomy) | **Borrow:** Add a persistent single-row **CategoryRail** directly under the header / above explorers, a scannable **MegaMenu** showing *category and subcategory names only*, and a clean `/categories` directory + `/categories/:slug` landing hubs—explicitly highlighting **Creators & Brand Collabs** alongside technical domains. **Avoid:** Fiverr's dense scrolling carousels inside mega-menus; PolyLance's current 720px verbose mega-menu with skill descriptions that clips at top. |
| **Hero Entry Structure** | **Upwork & Freelancer.com** (split Client vs Freelancer CTA + headline CTA), **Fiverr** (search-first hero), **Toptal** (trust proof + primary conversion CTA) | **Borrow:** Search-first / dual-role entry (*"I want to work"* / *"I want to hire"*) with zero jargon. **Do Differently:** Pair plain-language promise (*"Get paid for every milestone, protected by a smart contract"*) with our signature **Receipt** visual showing locked milestone money before work begins—zero code windows, zero fake chat mockups, and zero unverified claims. |
| **Trust Signals & Escrow Proof** | **Toptal** (enterprise social proof + risk-free trial), **Freelancer.com** (Milestone Payment System banner), **Truelancer** (Safe Deposit funded status), **Braintrust** (verified enterprise hiring) | **Avoid:** Toptal's unverified marquee logos or Truelancer's pop-up warning banners; "Sample" widgets pretending to show fake transactions. **Do Differently:** Express fund safety honestly through the **Receipt** metaphor (`LOCKED` / `APPROVED` / `PAID` stamp + line items + Polygonscan link via config only), showing *each named fact (escrow-protected, 2.5% per side, 7-day review, Polygon)* once per page. |
| **Job Feed & Job Rows** | **Upwork & Truelancer** (dense tabular/list job rows: title, fixed/milestone budget, 1-line summary, skill tags, posted timestamp, proposal count), **Freelancer.com** (compact bid cards) | **Borrow:** Dense, scannable horizontal job rows on `/jobs` (`1px` border Cards, tabular amounts in `--font-body` using `font-variant-numeric: tabular-nums`, plain text Tags). **Avoid:** Multi-line puffy rounded cards with large empty whitespace or fake dollar estimates. |
| **Profile & Proof of Work** | **Contra** (portfolio-first case studies, zero-fee creator branding, external imports like GitHub/Dribbble/YouTube), **Braintrust & Toptal** (verified credentials, domain badges, completion rate) | **Borrow:** **Portfolio-first profiles** supporting BOTH **GitHub contribution verification** for developers AND **media/case-study proof + Certificates** for non-tech & **Creators & Brand Collabs** (`YouTube`, `UGC`, `Design`, `Writing`). **Avoid:** Overflowing 15-pill skill clouds above the bio or horizontal tab bars that clip on 375px screens. |
| **Onboarding Flow** | **Contra** (fast role selection + instant profile card preview), **Fiverr** (progressive seller checklist) | **Borrow:** Fast, clear role-first onboarding (`/welcome`) connected directly to user's wallet intent. **Do Differently:** Unify `/welcome` with the light editorial palette + yellow highlighter/offset accents (eliminating today's jarring black brutalist split theme) and use `"Example"` labels on generic onboarding illustrations without fake rates like `"$50 USDC/hr"`. |
| **Empty States** | **Upwork / Contra** (clear next action when search or dashboard queue has 0 items) | **Do Differently:** Keep empty states compact, honest (`0` real items shown plainly), and actionable—replacing giant blank dashed boxes on Dashboard and Find Jobs with concise editorial prompts (`Receipt` or `Card`) linking directly to Post a Job or Explore Categories. |
| **Mobile Navigation (`360px–768px`)** | **Fiverr** (App bottom bar + hamburger drawer), **Upwork / Contra** (compact top header + slide-over navigation sheet) | **Borrow:** Clean 64px top bar (Logo + compact Search/Connect + Menu trigger) paired with bottom sheet drawers (`BottomSheet`) and properly bottom-padded page content so fixed bottom bars never obscure submit buttons or footer links. |

---

## 2. How PolyLance Expresses Its Four Core Principles

1. **Money Locked Before Work Starts (Receipt Metaphor):**
   Every financial moment—hero overview, milestone deposit breakdown, platform fee math (`2.5% per side`), escrow release, and completion attestation—uses the perforated **Receipt** card: itemised lines, tabular figures in `--font-body`, total, bold status stamp (`LOCKED`, `APPROVED`, `PAID`), and one `--font-mono` hash/chain ID line at the bottom. Visitors grasp how escrow protects both sides in under 5 seconds without reading Web3 jargon.
2. **Proof of Work Across Technical & Creative Disciplines:**
   Profiles and reputation treat verified **GitHub OAuth proof** (tech), **project portfolio links & media** (designers, writers, video editors, marketers, creators), and signed **Completion Certificates** equally—no second-class non-developer experience.
3. **Complete Category Breadth Including Creators & Brand Collabs:**
   Navigation rails, `/categories`, and job filters surface all 10 taxonomy disciplines clearly—putting **Creators & Brand Collabs**, **Video, Audio & Animation**, and **Design & Creative** alongside **Development & IT**, **AI & Automation**, and **Web3 & Blockchain**.
4. **Radical Honesty (Real Numbers Only):**
   Zero fabricated testimonials, zero invented user counts, zero unlabeled "Sample" balances or hardcoded TVL/volume fallbacks, and honest `Independent audit: Pending` disclosures. Generic explanatory visuals are explicitly labelled `"Example"` with zero invented figures.
