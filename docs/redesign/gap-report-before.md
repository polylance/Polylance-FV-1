# PolyLance UI Gap Audit Report (BEFORE)

**Date:** 2026-10-13T04:09:09.230Z
**Audited Routes:** 26
**Viewports:** 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (wide desktop)

## Summary of Violations

| Route | Path | Viewport | Vertical Gaps (>48px / 96px) | Underfilled Cards (<50%) | Empty Grid Slots (>240px) | Horizontal Blank Regions (>320px) | Text Width (>80ch / 720px) | Total |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| landing | `/` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| dashboard | `/dashboard` | 768px | 0 | 1 | 0 | 0 | 0 | **1** |
| dashboard | `/dashboard` | 1280px | 0 | 1 | 0 | 0 | 0 | **1** |
| dashboard | `/dashboard` | 1920px | 0 | 1 | 0 | 0 | 0 | **1** |
| findjobs | `/jobs` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| jobdetail | `/jobs/sample-job-1` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| postjob | `/post-job` | 768px | 0 | 0 | 0 | 1 | 0 | **1** |
| postjob | `/post-job` | 1280px | 0 | 0 | 0 | 1 | 1 | **2** |
| postjob | `/post-job` | 1920px | 0 | 0 | 0 | 1 | 1 | **2** |
| workspace | `/workspace` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| chat | `/chat` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| profile | `/profile` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| reputation | `/reputation` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| settings | `/settings` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| certifiedpass | `/certifiedpass` | 375px | 6 | 0 | 0 | 0 | 0 | **6** |
| certifiedpass | `/certifiedpass` | 768px | 6 | 0 | 0 | 0 | 0 | **6** |
| certifiedpass | `/certifiedpass` | 1280px | 6 | 0 | 0 | 0 | 0 | **6** |
| certifiedpass | `/certifiedpass` | 1920px | 6 | 0 | 0 | 0 | 4 | **10** |
| certificate | `/certificate/1` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| attestation | `/attestation/1` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| audit | `/audit` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| judge | `/judge` | 768px | 0 | 1 | 0 | 0 | 0 | **1** |
| judge | `/judge` | 1280px | 0 | 1 | 0 | 0 | 0 | **1** |
| judge | `/judge` | 1920px | 0 | 1 | 0 | 0 | 0 | **1** |
| dao | `/dao` | 1280px | 0 | 0 | 0 | 0 | 1 | **1** |
| dao | `/dao` | 1920px | 0 | 0 | 0 | 0 | 1 | **1** |
| treasury | `/treasury` | 768px | 0 | 1 | 0 | 0 | 0 | **1** |
| treasury | `/treasury` | 1280px | 0 | 1 | 0 | 0 | 0 | **1** |
| treasury | `/treasury` | 1920px | 0 | 1 | 0 | 0 | 0 | **1** |
| analytics | `/analytics` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| login | `/login` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| help | `/help` | 1280px | 0 | 0 | 1 | 0 | 1 | **2** |
| help | `/help` | 1920px | 0 | 0 | 1 | 0 | 1 | **2** |
| demo | `/demo` | 375px | 4 | 0 | 0 | 0 | 0 | **4** |
| demo | `/demo` | 768px | 4 | 1 | 0 | 0 | 0 | **5** |
| demo | `/demo` | 1280px | 4 | 1 | 0 | 0 | 1 | **6** |
| demo | `/demo` | 1920px | 4 | 1 | 0 | 0 | 1 | **6** |
| terms | `/terms` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| privacy | `/privacy` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| security | `/security` | 1280px | 0 | 0 | 0 | 0 | 1 | **1** |
| security | `/security` | 1920px | 0 | 0 | 0 | 0 | 1 | **1** |
| disclaimer | `/disclaimer` | 768px | 0 | 1 | 0 | 0 | 0 | **1** |
| disclaimer | `/disclaimer` | 1280px | 0 | 1 | 0 | 0 | 0 | **1** |
| disclaimer | `/disclaimer` | 1920px | 0 | 1 | 0 | 0 | 0 | **1** |
| manifesto | `/manifesto` | 375px | 3 | 0 | 0 | 0 | 0 | **3** |
| manifesto | `/manifesto` | 768px | 3 | 0 | 0 | 0 | 0 | **3** |
| manifesto | `/manifesto` | 1280px | 3 | 0 | 0 | 0 | 1 | **4** |
| manifesto | `/manifesto` | 1920px | 3 | 0 | 0 | 0 | 1 | **4** |

### Aggregate Metrics

- **Total Violations:** 88
- **Excessive Vertical Gaps:** 52
- **Underfilled Cards (<50%):** 15
- **Empty Grid Slots:** 2
- **Horizontal Blank Regions:** 3
- **Text Blocks >80ch:** 16

## Detailed Violations by Route

### dashboard (`/dashboard`)

- **[768px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 232px, content only 112px (48%)
- **[1280px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 216px, content only 96px (44%)
- **[1920px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 216px, content only 96px (44%)

### postjob (`/post-job`)

- **[768px] Horizontal Blank Regions:**
  - `mt-8 grid grid-cols-1 lg:grid-cols-12 ga`: Shorter right column leaves **1336px** blank region
- **[1280px] Horizontal Blank Regions:**
  - `mt-8 grid grid-cols-1 lg:grid-cols-12 ga`: Shorter right column leaves **1336px** blank region
- **[1280px] Text >80ch Width:**
  - Width 761px: "After work is submitted, the client has 7 days to ..."
- **[1920px] Horizontal Blank Regions:**
  - `mt-8 grid grid-cols-1 lg:grid-cols-12 ga`: Shorter right column leaves **1336px** blank region
- **[1920px] Text >80ch Width:**
  - Width 761px: "After work is submitted, the client has 7 days to ..."

### certifiedpass (`/certifiedpass`)

- **[375px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[768px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[1280px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[1920px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[1920px] Text >80ch Width:**
  - Width 890px: "The deliverable bundle is signed off-chain by the ..."
  - Width 890px: "CertifiedPass directly queries Polygon Mainnet con..."
  - Width 890px: "The milestone work deliverable is pinned to IPFS u..."
  - Width 890px: "Commercial compensation terms and private escrow v..."

### judge (`/judge`)

- **[768px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 232px, content only 112px (48%)
- **[1280px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 216px, content only 96px (44%)
- **[1920px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 216px, content only 96px (44%)

### dao (`/dao`)

- **[1280px] Text >80ch Width:**
  - Width 1126px: "Governance rule: Arbitrator elections require a mi..."
- **[1920px] Text >80ch Width:**
  - Width 1126px: "Governance rule: Arbitrator elections require a mi..."

### treasury (`/treasury`)

- **[768px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 232px, content only 112px (48%)
- **[1280px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 216px, content only 96px (44%)
- **[1920px] Underfilled Cards:**
  - `md:col-span-4 bg-[#FFFFFF] border border`: Height 216px, content only 96px (44%)

### help (`/help`)

- **[1280px] Text >80ch Width:**
  - Width 768px: "Learn how to set up non-custodial escrows, submit ..."
- **[1920px] Text >80ch Width:**
  - Width 768px: "Learn how to set up non-custodial escrows, submit ..."

### demo (`/demo`)

- **[375px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[768px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[768px] Underfilled Cards:**
  - `relative w-full aspect-video bg-[#F6F7F9`: Height 403px, content only 142px (35%)
- **[1280px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[1280px] Underfilled Cards:**
  - `relative w-full aspect-video bg-[#F6F7F9`: Height 336px, content only 161px (48%)
- **[1280px] Text >80ch Width:**
  - Width 1148px: "Project budget is transferred from the client wall..."
- **[1920px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[1920px] Underfilled Cards:**
  - `relative w-full aspect-video bg-[#F6F7F9`: Height 336px, content only 161px (48%)
- **[1920px] Text >80ch Width:**
  - Width 1148px: "Project budget is transferred from the client wall..."

### security (`/security`)

- **[1280px] Text >80ch Width:**
  - Width 768px: "PolyLance smart contracts are built using OpenZepp..."
- **[1920px] Text >80ch Width:**
  - Width 768px: "PolyLance smart contracts are built using OpenZepp..."

### disclaimer (`/disclaimer`)

- **[768px] Underfilled Cards:**
  - `max-w-[720px] mx-auto bg-white border bo`: Height 150px, content only 70px (47%)
- **[1280px] Underfilled Cards:**
  - `max-w-[720px] mx-auto bg-white border bo`: Height 150px, content only 70px (47%)
- **[1920px] Underfilled Cards:**
  - `max-w-[720px] mx-auto bg-white border bo`: Height 150px, content only 70px (47%)

### manifesto (`/manifesto`)

- **[375px] Vertical Gaps:**
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
  - `section -> section`: **64px** (Limit: 48px)
- **[768px] Vertical Gaps:**
  - `section -> section`: **80px** (Limit: 48px)
  - `section -> section`: **80px** (Limit: 48px)
  - `section -> section`: **80px** (Limit: 48px)
- **[1280px] Vertical Gaps:**
  - `section -> section`: **80px** (Limit: 48px)
  - `section -> section`: **80px** (Limit: 48px)
  - `section -> section`: **80px** (Limit: 48px)
- **[1280px] Text >80ch Width:**
  - Width 768px: "We are building a global, permissionless labor mar..."
- **[1920px] Vertical Gaps:**
  - `section -> section`: **80px** (Limit: 48px)
  - `section -> section`: **80px** (Limit: 48px)
  - `section -> section`: **80px** (Limit: 48px)
- **[1920px] Text >80ch Width:**
  - Width 768px: "We are building a global, permissionless labor mar..."

