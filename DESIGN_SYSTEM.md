# PolyLance Design System Specification

## 1. Brand Identity & Color Tokens

PolyLance uses a restrained, high-trust visual language built around **Cobalt Blue (`#0047AB`)**, clean white/slate surfaces, and dark navy accent cards. Generic purple/violet gradient soups are strictly eliminated from standard product surfaces.

### 1.1 Core Palette

| Token Name | Value | Usage |
| :--- | :--- | :--- |
| `--color-primary` / `--color-polylance` | `#0047AB` | Primary actions, brand highlights, active states |
| `--color-primary-hover` | `#00388A` | Primary button hover |
| `--color-primary-pressed` | `#002C6C` | Primary button active/pressed |
| `--color-primary-tint` | `#EFF6FF` | Focus rings, light selection chips, badge backgrounds |
| `--color-bg` | `#FFFFFF` | Default page background |
| `--color-bg-subtle` | `#F6F7F9` | Section backgrounds, card groupings |
| `--color-surface` | `#FFFFFF` | Card surfaces, modals, popovers |
| `--color-border` | `#E5E7EB` | Subtle structural borders |
| `--color-ink` | `#0B0B0F` | Primary headings, high-contrast text |
| `--color-ink-2` | `#4B5563` | Body copy, secondary labels |
| `--color-ink-3` | `#6B7280` | Tertiary captions, timestamps, placeholder text |

### 1.2 Dark Card & Surface Tokens (Status Banners, Web3 Badges)

| Token Name | Value | Usage |
| :--- | :--- | :--- |
| `dark-card-bg` | `#0A1120` | Persistent system cards, auth banners, Web3 status |
| `dark-card-border` | `#1E293B` | Structural dark card borders |
| `dark-card-ink` | `#F8FAFC` | Primary text on dark cards |
| `dark-card-muted` | `#94A3B8` | Subtext and secondary labels on dark cards |

### 1.3 Semantic Status Tokens

| Semantic State | Foreground | Background Tint | Border |
| :--- | :--- | :--- | :--- |
| **Success** | `#166534` | `#F0FDF4` | `#BBF7D0` |
| **Warning** | `#92400E` | `#FFFBEB` | `#FDE68A` |
| **Error / Destructive** | `#991B1B` | `#FEF2F2` | `#FECACA` |
| **Information** | `#1D4ED8` | `#EFF6FF` | `#BFDBFE` |

---

## 2. Typography

Self-hosted variable fonts ensure zero Layout Shift (CLS: 0) and crisp rendering across devices:

- **Primary UI & Headings**: `Plus Jakarta Sans` (weights 400, 500, 600, 700, 800)
- **Data, Metrics & Numbers**: `Manrope` (tabular figures, weights 500, 600, 700)
- **Technical & Monospace**: `Geist Mono` / System Monospace

### Type Scale

- **Display**: `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`
- **H1**: `text-3xl sm:text-4xl font-bold tracking-tight text-[#0B0B0F]`
- **H2**: `text-2xl sm:text-3xl font-bold text-[#0B0B0F]`
- **H3**: `text-xl font-semibold text-[#0B0B0F]`
- **Body Large**: `text-base sm:text-lg text-[#4B5563] leading-relaxed`
- **Body Default**: `text-sm text-[#4B5563] leading-normal`
- **Caption / Meta**: `text-xs text-[#6B7280] font-medium`

---

## 3. Component Architecture & Patterns

### 3.1 Buttons

- **Primary Button**:
  - `bg-[#0047AB] hover:bg-[#00388A] active:bg-[#002C6C] text-white font-medium shadow-sm transition-all duration-150 rounded-xl px-5 py-2.5`
- **Secondary / Outline Button**:
  - `bg-white hover:bg-slate-50 border border-[#E5E7EB] text-[#0B0B0F] font-medium rounded-xl px-5 py-2.5 transition-colors`
- **Ghost Button**:
  - `hover:bg-slate-100 text-[#4B5563] hover:text-[#0B0B0F] font-medium rounded-xl px-4 py-2 transition-colors`
- **Destructive Button**:
  - `bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-medium rounded-xl px-4 py-2 transition-colors`

### 3.2 Badges & Chips

- **Polygon Mainnet Chip**:
  - `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#8247E5]/10 text-[#8247E5] border border-[#8247E5]/20`
- **Status Chips**:
  - Completed: `bg-emerald-50 text-emerald-700 border-emerald-200`
  - In Progress: `bg-blue-50 text-blue-700 border-blue-200`
  - Under Review: `bg-amber-50 text-amber-700 border-amber-200`
  - Cancelled: `bg-slate-100 text-slate-600 border-slate-200`

### 3.3 Cards & Modals

- **Content Card**: `bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all`
- **Interactive Elevated Card**: `bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow`
- **Modal Dialog**: `bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl backdrop-blur-md`

---

## 4. Motion & Transitions

PolyLance motion principles derive from Apple Human Interface Guidelines:
- **Spatial Continuity**: Elements scale from origin and translate naturally along the Y axis (`y: 12 -> 0`).
- **Timing Curves**: Fast in, gentle out (`easeOutCubic`, 200–350ms duration).
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by zeroing translations and relying solely on instant opacity or static displays.
- **Micro-interactions**: Button click transforms (`active:scale-[0.98]`), tooltip fades, toast slide-ins.

---

## 5. Web3 & Network Invariants

- **Chain Focus**: Exclusively **Polygon (Chain ID 137)** or **Polygon Amoy (Chain ID 80002)**.
- **Copy Restrictions**: Never display "Ethereum mainnet" or default to Chain ID 1.
- **Addresses**: Display checksummed EVM addresses (`0x...`) formatted as `0x1234...5678`.
- **Currency**: `USDC` (6 decimals) and `POL` (18 decimals).
