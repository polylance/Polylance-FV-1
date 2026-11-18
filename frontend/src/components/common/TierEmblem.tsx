import React from 'react';

export type TierType = 'bronze' | 'silver' | 'gold' | 'diamond' | 'platinum';

export interface TierEmblemProps {
  tier: TierType | string;
  size?: 20 | 32 | 48 | 96 | 140 | number;
  isCurrent?: boolean;
  isLocked?: boolean;
  className?: string;
}

export const normalizeTier = (raw: string | undefined): 'bronze' | 'silver' | 'gold' | 'diamond' => {
  const t = (raw || 'bronze').toLowerCase().trim();
  if (t === 'diamond' || t === 'platinum') return 'diamond';
  if (t === 'gold') return 'gold';
  if (t === 'silver') return 'silver';
  return 'bronze';
};

export const TierEmblem: React.FC<TierEmblemProps> = ({
  tier: rawTier,
  size = 32,
  isCurrent = false,
  isLocked = false,
  className = '',
}) => {
  const tier = normalizeTier(rawTier);

  // Locked state styling
  if (isLocked) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 select-none ${className}`}
        aria-label={`${tier} tier locked`}
      >
        <path
          d="M 32 6 L 56 19 L 56 46 L 32 58 L 8 46 L 8 19 Z"
          fill="#F8FAFC"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinejoin="round"
        />
        {/* Subtle lock icon */}
        <rect x="25" y="30" width="14" height="11" rx="2" fill="#94A3B8" />
        <path
          d="M 28 30 V 26 C 28 23.8 29.8 22 32 22 C 34.2 22 36 23.8 36 26 V 30"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  // Active / Current border stroke
  const currentRing = isCurrent ? (
    <path
      d="M 32 3 L 59 17.5 L 59 47.5 L 32 61 L 5 47.5 L 5 17.5 Z"
      fill="none"
      stroke="#0047AB"
      strokeWidth="2"
      strokeLinejoin="round"
      opacity="0.85"
    />
  ) : null;

  if (tier === 'bronze') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 select-none ${className}`}
        aria-label="Bronze Tier Emblem"
      >
        {currentRing}
        {/* Bronze Shield: slate #64748B, subtle warm-gray fill #F1F5F9 */}
        <path
          d="M 32 6 L 56 19 L 56 46 L 32 58 L 8 46 L 8 19 Z"
          fill="#F1F5F9"
          stroke="#64748B"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner subtle bevel */}
        <path
          d="M 32 10 L 52 21 L 52 44 L 32 54 L 12 44 L 12 21 Z"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Single Chevron */}
        <path
          d="M 22 30 L 32 36 L 42 30"
          stroke="#64748B"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  if (tier === 'silver') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 select-none ${className}`}
        aria-label="Silver Tier Emblem"
      >
        {currentRing}
        {/* Silver Shield: cool silver #7C93B8, ice-tint fill #EAF1FB */}
        <path
          d="M 32 6 L 56 19 L 56 46 L 32 58 L 8 46 L 8 19 Z"
          fill="#EAF1FB"
          stroke="#7C93B8"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner bevel */}
        <path
          d="M 32 10 L 52 21 L 52 44 L 32 54 L 12 44 L 12 21 Z"
          fill="none"
          stroke="#C9DAF2"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Double Chevron */}
        <path
          d="M 22 25 L 32 31 L 42 25"
          stroke="#7C93B8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 22 35 L 32 41 L 42 35"
          stroke="#7C93B8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  if (tier === 'gold') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 select-none ${className}`}
        aria-label="Gold Tier Emblem"
      >
        {currentRing}
        {/* Gold Shield: rich cobalt #0047AB, tint fill #C9DAF2 */}
        <path
          d="M 32 6 L 56 19 L 56 46 L 32 58 L 8 46 L 8 19 Z"
          fill="#C9DAF2"
          stroke="#0047AB"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner bevel */}
        <path
          d="M 32 10 L 52 21 L 52 44 L 32 54 L 12 44 L 12 21 Z"
          fill="none"
          stroke="#7FA3DB"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Small 4-point star at top */}
        <path
          d="M 32 12 Q 32 17 37 17 Q 32 17 32 22 Q 32 17 27 17 Q 32 17 32 12 Z"
          fill="#0047AB"
        />
        {/* Triple Chevron */}
        <path
          d="M 23 27 L 32 32 L 41 27"
          stroke="#0047AB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 23 35 L 32 40 L 41 35"
          stroke="#0047AB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 23 43 L 32 48 L 41 43"
          stroke="#0047AB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  // Diamond: faceted hexagon gem with 6 triangular facets
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-label="Diamond Tier Emblem"
    >
      {currentRing}
      {/* 6 Triangular facets connecting to center (32, 32) */}
      {/* Top facet */}
      <polygon points="32,6 56,19 32,32" fill="#EAF1FB" />
      {/* Top right facet */}
      <polygon points="56,19 56,46 32,32" fill="#C9DAF2" />
      {/* Bottom right facet */}
      <polygon points="56,46 32,58 32,32" fill="#7FA3DB" />
      {/* Bottom left facet */}
      <polygon points="32,58 8,46 32,32" fill="#2F6BC9" />
      {/* Top left facet */}
      <polygon points="8,46 8,19 32,32" fill="#C9DAF2" />
      {/* Top-most left facet */}
      <polygon points="8,19 32,6 32,32" fill="#FFFFFF" />

      {/* Internal facet strokes in cobalt */}
      <line x1="32" y1="32" x2="32" y2="6" stroke="#0047AB" strokeWidth="1.5" />
      <line x1="32" y1="32" x2="56" y2="19" stroke="#0047AB" strokeWidth="1.5" />
      <line x1="32" y1="32" x2="56" y2="46" stroke="#0047AB" strokeWidth="1.5" />
      <line x1="32" y1="32" x2="32" y2="58" stroke="#0047AB" strokeWidth="1.5" />
      <line x1="32" y1="32" x2="8" y2="46" stroke="#0047AB" strokeWidth="1.5" />
      <line x1="32" y1="32" x2="8" y2="19" stroke="#0047AB" strokeWidth="1.5" />

      {/* Outer Hexagon Shield Boundary */}
      <path
        d="M 32 6 L 56 19 L 56 46 L 32 58 L 8 46 L 8 19 Z"
        fill="none"
        stroke="#0047AB"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Center brilliant glint */}
      <circle cx="32" cy="32" r="2.5" fill="#FFFFFF" />
    </svg>
  );
};

export interface RankEmblemProps {
  rank: number;
  size?: 24 | 32 | 40 | number;
  className?: string;
}

export const RankEmblem: React.FC<RankEmblemProps> = ({ rank, size = 32, className = '' }) => {
  if (rank === 1) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 select-none ${className}`}
        aria-label="Rank 1 Crowned Shield"
      >
        {/* Cobalt Shield with 1 */}
        <path
          d="M 32 12 L 54 23 L 54 48 L 32 59 L 10 48 L 10 23 Z"
          fill="#0047AB"
          stroke="#003A8C"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* 3-Point Crown atop shield */}
        <path
          d="M 23 15 L 21 8 L 27 12 L 32 6 L 37 12 L 43 8 L 41 15 Z"
          fill="#0047AB"
          stroke="#C9DAF2"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="21" cy="7" r="1.5" fill="#C9DAF2" />
        <circle cx="32" cy="5" r="1.5" fill="#C9DAF2" />
        <circle cx="43" cy="7" r="1.5" fill="#C9DAF2" />
        {/* Bold Numeral 1 */}
        <text
          x="32"
          y="42"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="22"
        >
          1
        </text>
      </svg>
    );
  }

  if (rank === 2) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 select-none ${className}`}
        aria-label="Rank 2 Silver Shield"
      >
        <path
          d="M 32 8 L 54 20 L 54 46 L 32 58 L 10 46 L 10 20 Z"
          fill="#EAF1FB"
          stroke="#7C93B8"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text
          x="32"
          y="41"
          textAnchor="middle"
          fill="#0B0B0F"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="22"
        >
          2
        </text>
      </svg>
    );
  }

  if (rank === 3) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 select-none ${className}`}
        aria-label="Rank 3 Bronze Shield"
      >
        <path
          d="M 32 8 L 54 20 L 54 46 L 32 58 L 10 46 L 10 20 Z"
          fill="#F1F5F9"
          stroke="#64748B"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text
          x="32"
          y="41"
          textAnchor="middle"
          fill="#0B0B0F"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="22"
        >
          3
        </text>
      </svg>
    );
  }

  // Ranks 4+: Clean monospaced numeral in subtle circle
  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full bg-[#F6F7F9] border border-slate-200 text-slate-700 font-mono font-medium text-xs tabular-nums select-none ${className}`}
    >
      {rank}
    </div>
  );
};

export interface CompactTierChipProps {
  tier: TierType | string;
  className?: string;
}

export const CompactTierChip: React.FC<CompactTierChipProps> = ({ tier: rawTier, className = '' }) => {
  const tier = normalizeTier(rawTier);
  const capitalized = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F6F7F9] border border-slate-200 text-slate-800 text-xs font-medium ${className}`}
    >
      <TierEmblem tier={tier} size={20} />
      <span>{capitalized}</span>
    </span>
  );
};
