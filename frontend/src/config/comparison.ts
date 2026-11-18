/**
 * Comparison data configuration for "Why PolyLance" section.
 * 
 * HARD RULE:
 * - Do NOT hard-code unverified competitor numbers.
 * - Only render comparison items if every item has `verified: true`.
 * - Marked with placeholder status until verified by research/legal.
 */

export interface ComparisonRow {
  feature: string;
  category: 'safety' | 'fees' | 'reputation';
  polylance: string;
  traditionalPlatforms: string;
  verified: boolean; // TODO: verify before publishing
  notes?: string;
}

export const PLATFORM_COMPARISON: ComparisonRow[] = [
  {
    feature: 'Payment Safety',
    category: 'safety',
    polylance: 'Non-custodial smart contract escrow on Polygon (EIP-1167). Funds release upon milestone verification.',
    traditionalPlatforms: 'Centralized holding accounts. Platforms can withhold or freeze funds arbitrarily.',
    verified: false, // TODO: verify before publishing
    notes: 'Legal & terms review needed'
  },
  {
    feature: 'Platform Fees',
    category: 'fees',
    polylance: 'Transparent 2.5% platform fee. Zero withdrawal fees, zero subscription dues.',
    traditionalPlatforms: 'Up to 10% - 20% commission on freelancer earnings plus withdrawal currency conversion spreads.',
    verified: false, // TODO: verify before publishing
    notes: 'Competitor fee schedules must be formally verified'
  },
  {
    feature: 'Reputation You Own',
    category: 'reputation',
    polylance: 'Immutable ERC-721 Soulbound work certificates stored directly in your connected wallet.',
    traditionalPlatforms: 'Proprietary platform databases. Ratings and client reviews cannot be exported or transferred.',
    verified: false, // TODO: verify before publishing
    notes: 'Verify token standard and patent claims'
  }
];

export function isComparisonVerified(): boolean {
  return PLATFORM_COMPARISON.length > 0 && PLATFORM_COMPARISON.every((row) => row.verified === true);
}
