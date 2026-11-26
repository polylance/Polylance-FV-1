# Future Official Social Connections Architecture (Design Only — No Scraping)

This document specifies how optional future social identity proofs for tech and non-tech tracks must be integrated strictly via **official OAuth APIs** (no HTML scraping, no headless browsers, no credential sharing), preserving PolyLance's **"no email or phone stored"** guarantee.

## 1. Candidate Official Providers, Scopes & Cost

| Platform | Official API | Minimum OAuth Scopes (Excludes Email/Phone/DM) | Data Captured (Public Metrics Only) | Platform Cost & Quotas | App-Review Requirements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LinkedIn** | LinkedIn Sign In / Profile API v2 (`r_liteprofile` / OIDC `profile` ONLY — **omit `email`**) | `profile` (strictly omit `email` / `r_emailaddress`) | Provider subject ID, vanity slug/URL if authorized, public headline (no email, phone, or connections list) | Free standard developer tier; strict QPS/daily quotas | Developer app verification + LinkedIn Product review explaining non-hiring identity verification use case; privacy policy URL required |
| **X (Twitter)** | X API v2 (`/2/users/me` with `user.fields=public_metrics,created_at,verified_type`) | `users.read` ONLY (**omit `tweet.read` / `offline.access` if single-use**) | Account ID, `@handle`, account age, public followers/following counts (no email, DMs, or private lists) | Paid Basic tier (~USD 100/mo) or Pay-Per-Use credits required for reliable `/2/users/me` volume; Free tier is write-heavy and tightly capped | X Developer Portal Project registration + OAuth 2.0 PKCE callback allowlist |
| **Behance / Adobe** | *Note:* Adobe discontinued public Behance API keys for new third-party apps. **Alternative:** Portfolio links validated syntactically (Part 3) rather than scraping. | N/A | N/A | N/A | N/A — never scrape `behance.net` |
| **Dribbble** | Dribbble OAuth 2.0 v2 (`GET /v2/user`, `GET /v2/user/shots`) | `public` | User ID, login/HTML URL, public shot count | Free for registered OAuth apps; low rate limits (~60 req/min) | Dribbble OAuth app registration & portfolio review |
| **YouTube** | Google YouTube Data API v3 (`channels.list?mine=true&part=snippet,statistics`) | `https://www.googleapis.com/auth/youtube.readonly` ONLY (**omit `userinfo.email` / `profile`**) | Channel ID, custom URL, subscriber count (rounded by Google), public video count | Free quota: 10,000 units/day (`channels.list` costs 1 unit/call) | Google OAuth Verification required for sensitive/restricted `youtube.readonly` scope (~2–6 weeks + privacy policy + demo video) |
| **Figma** | Figma REST API v1 (`GET /v1/me`?) — *Caution:* `GET /v1/me` returns `email`; **discard `email` at fetch time or prefer curated HTTPS Portfolio Links** | `file_read` / OAuth identity if strict PII stripping is audited; recommended: **Portfolio Links only** unless Figma adds email-free scope | Public profile ID & handle only (never persist returned `email`) | Free developer API tier | Figma OAuth App registration |

## 2. Consent Copy & Token Lifecycle
- **User Consent Screen Text (Plain Language):**
  > "Connect your public [Provider] profile so PolyLance can verify you control this handle and record public work stats (followers/works count, handle, sync date). PolyLance uses single-use read-only public access, discards the OAuth token right away, and never requests or stores your email address, phone number, or private messages."
- **Single-Use Token Rule:**
  1. Generate HMAC-SHA256 signed `state` + PKCE `code_challenge` bound to authenticated wallet session (10-minute TTL).
  2. Exchange OAuth `code` on backend, execute the single public read request (`user` + `public_metrics`), strip any incidental `email`/`phone` field from JSON immediately, store `{ provider, provider_user_id, handle, public_stats, last_synced_at }`, and **discard `access_token` and `refresh_token`** on function return (no token columns in DB).
  3. Support one-click `DELETE /me/proof/:provider` to delete the stored snapshot and decouple the identity.
