# PolyLance UI Gap Audit Report (AFTER)

**Date:** 2026-10-13T06:12:27.323Z
**Audited Routes:** 26
**Viewports:** 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (wide desktop)

## Summary of Violations

| Route | Path | Viewport | Vertical Gaps (>48px / 96px) | Underfilled Cards (<50%) | Empty Grid Slots (>240px) | Horizontal Blank Regions (>320px) | Text Width (>80ch / 720px) | Total |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| landing | `/` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| dashboard | `/dashboard` | 768px | 0 | 0 | 0 | 1 | 0 | **1** |
| dashboard | `/dashboard` | 1280px | 0 | 0 | 0 | 1 | 0 | **1** |
| dashboard | `/dashboard` | 1920px | 0 | 0 | 0 | 1 | 0 | **1** |
| findjobs | `/jobs` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| jobdetail | `/jobs/sample-job-1` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| postjob | `/post-job` | 768px | 0 | 0 | 0 | 1 | 0 | **1** |
| postjob | `/post-job` | 1280px | 0 | 0 | 0 | 1 | 0 | **1** |
| postjob | `/post-job` | 1920px | 0 | 0 | 0 | 1 | 0 | **1** |
| workspace | `/workspace` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| chat | `/chat` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| profile | `/profile` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| reputation | `/reputation` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| settings | `/settings` | 768px | 0 | 0 | 0 | 1 | 0 | **1** |
| settings | `/settings` | 1280px | 0 | 0 | 0 | 1 | 0 | **1** |
| settings | `/settings` | 1920px | 0 | 0 | 0 | 1 | 0 | **1** |
| certifiedpass | `/certifiedpass` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| certificate | `/certificate/1` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| attestation | `/attestation/1` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| audit | `/audit` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| judge | `/judge` | 768px | 0 | 0 | 0 | 1 | 0 | **1** |
| judge | `/judge` | 1280px | 0 | 0 | 0 | 1 | 0 | **1** |
| judge | `/judge` | 1920px | 0 | 0 | 0 | 1 | 0 | **1** |
| dao | `/dao` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| treasury | `/treasury` | 768px | 0 | 0 | 0 | 1 | 0 | **1** |
| treasury | `/treasury` | 1280px | 0 | 0 | 0 | 1 | 0 | **1** |
| treasury | `/treasury` | 1920px | 0 | 0 | 0 | 1 | 0 | **1** |
| analytics | `/analytics` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| login | `/login` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| help | `/help` | 1280px | 0 | 0 | 1 | 0 | 0 | **1** |
| help | `/help` | 1920px | 0 | 0 | 1 | 0 | 0 | **1** |
| demo | `/demo` | 768px | 0 | 1 | 0 | 0 | 0 | **1** |
| demo | `/demo` | 1280px | 0 | 1 | 0 | 0 | 0 | **1** |
| demo | `/demo` | 1920px | 0 | 1 | 0 | 0 | 0 | **1** |
| terms | `/terms` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| privacy | `/privacy` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| security | `/security` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| disclaimer | `/disclaimer` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |
| manifesto | `/manifesto` | 1280px | 0 | 0 | 0 | 0 | 0 | **0** |

### Aggregate Metrics

- **Total Violations:** 20
- **Excessive Vertical Gaps:** 0
- **Underfilled Cards (<50%):** 3
- **Empty Grid Slots:** 2
- **Horizontal Blank Regions:** 15
- **Text Blocks >80ch:** 0

## Detailed Violations by Route

### dashboard (`/dashboard`)

- **[768px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **653px** blank region
- **[1280px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **625px** blank region
- **[1920px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **625px** blank region

### postjob (`/post-job`)

- **[768px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **1240px** blank region
- **[1280px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **1240px** blank region
- **[1920px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **1240px** blank region

### settings (`/settings`)

- **[768px] Horizontal Blank Regions:**
  - `flex flex-col lg:flex-row gap-6 items-st`: Shorter left column leaves **344px** blank region
- **[1280px] Horizontal Blank Regions:**
  - `flex flex-col lg:flex-row gap-6 items-st`: Shorter left column leaves **344px** blank region
- **[1920px] Horizontal Blank Regions:**
  - `flex flex-col lg:flex-row gap-6 items-st`: Shorter left column leaves **344px** blank region

### judge (`/judge`)

- **[768px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **653px** blank region
- **[1280px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **625px** blank region
- **[1920px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **625px** blank region

### treasury (`/treasury`)

- **[768px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **653px** blank region
- **[1280px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **625px** blank region
- **[1920px] Horizontal Blank Regions:**
  - `grid grid-cols-1 lg:grid-cols-12 gap-6 i`: Shorter right column leaves **625px** blank region

### help (`/help`)


### demo (`/demo`)

- **[768px] Underfilled Cards:**
  - `relative w-full aspect-video bg-[#F6F7F9`: Height 403px, content only 142px (35%)
- **[1280px] Underfilled Cards:**
  - `relative w-full aspect-video bg-[#F6F7F9`: Height 336px, content only 161px (48%)
- **[1920px] Underfilled Cards:**
  - `relative w-full aspect-video bg-[#F6F7F9`: Height 336px, content only 161px (48%)

