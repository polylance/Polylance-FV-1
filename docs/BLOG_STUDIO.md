# PolyLance Blog Studio Guide & Operations Manual

The **PolyLance Blog Studio** (`/studio/blog`) is a secure, role-restricted, server-side-authorized authoring platform that enables core team members to compose, review, revise, schedule, and publish blog articles without modifying code or triggering code redeployments.

---

## 1. Architecture & Security Invariants

### 1.1 Concealment from Public Visitors
- **Strict Route Obfuscation**: Visiting `/studio/*` without an authorized session renders PolyLance's standard `<NotFound />` 404 page. The application never renders an "Access Denied" or login barrier on this route to completely conceal the studio's existence from public users and automated scanners.
- **Search Engine Blocking**: `robots.txt` explicitly disallows `/studio/` and `/studio/*`. All studio views inject `<meta name="robots" content="noindex, nofollow" />`.
- **Sitemap Exclusion**: Neither sitemaps, RSS feeds, search indexes, nor `llms.txt` include studio routes or unpublished drafts.
- **Navigation Placement**: The "Blog Studio" link appears exclusively in the authenticated user's avatar dropdown menu for verified team members (`admin`, `blog_editor`, `blog_author`). It is excluded from public navbars, footers, and mobile drawers.

### 1.2 Defense-in-Depth Authorization
Every studio operation requires server-side authentication (`requireBlogRole` middleware in `polylance-chat-service`):
- Cryptographically signed wallet session token (Bearer token or session cookie).
- Wallet address lookup against the team registry (`blogState.team`).
- Automatic fallback verification against system administrator addresses (`VITE_ADMIN_ADDRESS_1..N`).
- Non-public post statuses (`draft`, `in_review`, `archived`) are strictly filtered out by the public blog API (`/api/blog/posts`).

### 1.3 Invariant: The Last Admin Safeguard
To prevent accidental team lockout or orphan states:
- **The last active administrator can NEVER be removed or demoted**.
- If a team admin attempts to demote their own role or another admin's role when `activeAdminCount <= 1`, the server rejects the request with HTTP 400: `"Cannot demote or remove the last active Blog Studio administrator"`.

### 1.4 Post Revisions & Rollback
- Every manual save, autosave, or status change automatically records a full snapshot in `blogState.revisions`.
- The studio retains the last 30 snapshots per article.
- Editors and admins can compare diffs and rollback any post to an earlier revision with a single click.

### 1.5 IDOR-Safe Unguessable Preview Links
- Drafts and articles under review can be shared with external reviewers using cryptographically generated 24-byte hex tokens (`crypto.randomBytes(24)`).
- Previews expire automatically after 48 hours (configurable).
- Tokens can be revoked immediately from the Studio editor side panel.

---

## 2. Roles & Permissions Matrix

| Capability | `admin` | `blog_editor` | `blog_author` | Public / Non-Team |
| :--- | :---: | :---: | :---: | :---: |
| Access `/studio/blog` | Yes | Yes | Yes | **404 Not Found** |
| Create new drafts | Yes | Yes | Yes | No |
| Edit own drafts | Yes | Yes | Yes | No |
| Edit other authors' drafts | Yes | Yes | No | No |
| Submit draft for review | Yes | Yes | Yes | No |
| Publish article directly | Yes | Yes | **No** (Must submit for review) | No |
| Unpublish / Archive article | Yes | Yes | No | No |
| Rollback to past revisions | Yes | Yes | No | No |
| Upload media with alt text | Yes | Yes | Yes | No |
| Generate / Revoke preview links | Yes | Yes | Yes | No |
| Manage team members & roles | **Yes** | No | No | No |
| View audit logs | **Yes** | No | No | No |

---

## 3. Team Management & Admin Onboarding

### 3.1 Initial Seeding
When the backend starts up, it automatically seeds any wallet address registered in the system's admin environment variables (`VITE_ADMIN_ADDRESS_1` through `VITE_ADMIN_ADDRESS_10`) into the Blog Studio team with the `admin` role.

### 3.2 Adding or Modifying Team Members
1. Sign in with an authorized `admin` wallet address.
2. Open your avatar menu in the top navigation bar and select **Blog Studio**.
3. Click the **Team** tab in the Studio header.
4. Enter the new member's 42-character checksummed or lowercase Ethereum/Polygon wallet address (`0x...`).
5. Select their role (`Admin`, `Editor`, or `Author`) and click **Add Member**.
6. To modify an existing member's role or deactivate access, use the role selector or click the trash icon. Note that attempting to deactivate the sole remaining admin is blocked by the backend.

---

## 4. Writer & Style Guide

All PolyLance articles must meet strict visual, technical, and regulatory compliance standards.

### 4.1 Required Dynamic Fee Tokens
**Never hardcode fee percentages, days, or settlement periods in article text.** PolyLance fees and parameters may evolve via DAO governance. Always use dynamic template tokens which are automatically resolved at render time:

| Token | Resolves To | Description |
| :--- | :--- | :--- |
| `{{PLATFORM_FEE_PERCENT}}` | `2.5%` | Standard PolyLance platform escrow fee |
| `{{PLATFORM_FEE_TOTAL}}` | `5.0%` | Total combined fee (2.5% client + 2.5% freelancer) |
| `{{REVIEW_WINDOW_DAYS}}` | `14` | Client milestone inspection window in days |

### 4.2 Prohibited Competitor Terms & Content Hygiene
Articles must focus exclusively on PolyLance's verifiable on-chain protocol architecture.
- **Zero Competitor Mentions**: Do not reference Web2 or Web3 competitor platforms (e.g., Upwork, Fiverr, Freelancer, Toptal, Braintrust, LaborX).
- **No Unverifiable Comparative Claims**: Avoid claims like "cheapest in the industry" or "10x faster than others". State exact facts: *"PolyLance smart contracts enforce non-custodial milestone escrow with a 2.5% fee on Polygon."*
- Refer to `docs/BLOG_CLAIMS_TO_VERIFY.md` for full contract cross-references.

### 4.3 Typography & Formatting Components
Articles support GitHub Flavored Markdown (GFM) and custom extended callout blocks:

#### Callout Cards
Use the standard blockquote syntax with alert tags:

```markdown
> [!INFO]
> Platform fees are collected atomically upon milestone release.

> [!TIP]
> Freelancers should always request milestone funding before beginning deliverable work.

> [!WARNING]
> Funds locked in an active dispute cannot be withdrawn until arbitrator consensus is reached.

> [!KEY]
> Smart contract escrow guarantees that neither party can unilaterally seize funds.

> [!TAKEAWAYS]
> - Non-custodial escrow eliminates counterparty default risk.
> - SBT soulbound reputation proves past delivery on Polygon.
> - JudgeDAO provides decentralized dispute arbitration.
```

#### Numbered Step Workflows
Structure multi-step guides using ordered lists:
```markdown
1. **Connect Polygon Wallet**: Ensure your wallet has sufficient POL for gas.
2. **Fund Escrow Milestone**: Deposit USDC or POL directly into the JobEscrow contract.
3. **Submit Deliverables**: Provide cryptographically verifiable work links.
4. **Approve & Release**: Client releases funds directly to the freelancer's wallet.
```

#### Tables
Ensure all markdown tables include header delimiters (`| :--- | :--- |`) so they render as modern scrollable tables:
```markdown
| Escrow State | Client Action | Freelancer Action | On-Chain Status |
| :--- | :--- | :--- | :--- |
| Created | Deposit Funds | Await Deposit | Unfunded |
| Active | Inspect Work | Submit Work | Locked |
| Completed | Release Payment | Receive Payment | Settled |
```

---

## 5. Publishing Workflow

```
[ Author Draft ] ──> [ Submit for Review ] ──> [ Editor / Admin Review ] ──> [ Publish ]
      │                                                │                          │
      ▼                                                ▼                          ▼
Autosaved to DB                             Unguessable 48h Preview         Socket.IO Event
30 Snapshots Retained                       Live Split & Mobile Reader      Real-time Sync
```

1. **Drafting**:
   - The editor automatically performs debounced autosaving every 2.5 seconds.
   - Character and word count trackers provide real-time feedback on article length, SEO title length (recommended 50-60 chars), and meta description (recommended 140-160 chars).
2. **Pre-Publish Checklist**:
   The editor validates key quality gates before permitting publication:
   - Title is present and sufficiently descriptive.
   - Content exceeds minimum threshold (at least 300 words).
   - Valid URL slug format (`^[a-z0-9-]+$`).
   - SEO meta description provided.
   - At least 2 section headings (`h2` / `h3`) for the Table of Contents.
   - No prohibited competitor terms detected.
3. **Submission & Approval**:
   - Authors click **Submit for Review**.
   - Editors or Admins review the live preview on desktop and mobile viewports.
   - Editors or Admins click **Publish Article**.
4. **Real-Time Distribution**:
   - Publishing triggers a `blog:event` message via WebSockets (`Socket.IO`).
   - Active readers on `/blog` or `/blog/:slug` immediately receive an in-app banner notifying them of new content or revisions.

---

## 6. Media Library & Uploads

- **Supported Formats**: WebP, PNG, JPEG, SVG.
- **Maximum File Size**: 5 MB per image.
- **Accessibility Requirement**: All uploaded media must include descriptive `alt` text before insertion into an article.
- **Drag-and-Drop**: Images can be uploaded directly within the editor via drag-and-drop or through the **Media Library** modal.

---

## 7. Operational Runbook: Backup & Restore

### Local Fallback State
In addition to PostgreSQL persistence in production, the blog service maintains dual-persistence locally:
- **Location**: `polylance-chat-service/polylance_blog_state.json`
- **Revisions**: `blogState.revisions` holds the 30 most recent revision trees.
- **Audit History**: `blogState.auditLog` holds the 5,000 most recent actions.

### Manual Backup Procedure
To snapshot the active blog state:
```bash
# In polylance-chat-service
cp polylance_blog_state.json backups/polylance_blog_state_$(date +%Y%m%d_%H%M%S).json
```

### Emergency Restore
To restore from a backup:
1. Stop `polylance-chat-service`.
2. Replace `polylance_blog_state.json` with the desired backup file.
3. Restart `polylance-chat-service`.
4. The service will load the restored state and broadcast the updated cache to all connected clients.
