import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, ShieldCheck, Code2 } from 'lucide-react';
import { UserBytecodeMatrix } from '../utils/githubOracle';

// Precise language color mapping matching Image 2 reference aesthetics
export const LANGUAGE_DISPLAY_COLORS: Record<string, string> = {
  TypeScript: '#2563EB', // Royal Blue
  Solidity: '#7C3AED',   // Royal Purple
  CSS: '#8B5CF6',        // Violet
  JavaScript: '#D97706', // Amber Gold
  HTML: '#E11D48',       // Crimson Red
  Nix: '#3B82F6',        // Steel Blue
  Rust: '#EA580C',       // Rust Orange
  Python: '#059669',     // Emerald
  Go: '#0891B2',         // Cyan
  Dart: '#0284C7',       // Sky
  Vyper: '#4338CA',      // Indigo
  Cairo: '#BE185D',      // Magenta
  Swift: '#F97316',      // Orange
  Kotlin: '#A855F7',     // Purple
  Java: '#B45309',       // Brown/Amber
};

// Tier styling for the soft glowing crown pill
interface TierConfig {
  crownBg: string;
  crownBorder: string;
  crownColor: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  pillShadow: string;
}

const TIER_STYLES: Record<string, TierConfig> = {
  PLATINUM: {
    crownBg: 'bg-[#EDE9FE]',
    crownBorder: 'border-[#DDD6FE]',
    crownColor: 'text-[#9333EA] fill-[#9333EA]',
    pillBg: 'bg-[#F5EEFF]',
    pillBorder: 'border-[#E0CCFF]',
    pillText: 'text-[#7E22CE]',
    pillShadow: 'shadow-[0_2px_12px_rgba(168,85,247,0.16)]',
  },
  GOLD: {
    crownBg: 'bg-[#FEF3C7]',
    crownBorder: 'border-[#FDE68A]',
    crownColor: 'text-[#D97706] fill-[#D97706]',
    pillBg: 'bg-[#FFFBEB]',
    pillBorder: 'border-[#FDE68A]',
    pillText: 'text-[#B45309]',
    pillShadow: 'shadow-[0_2px_12px_rgba(245,158,11,0.16)]',
  },
  SILVER: {
    crownBg: 'bg-[#F1F5F9]',
    crownBorder: 'border-[#CBD5E1]',
    crownColor: 'text-[#475569] fill-[#475569]',
    pillBg: 'bg-[#F8FAFC]',
    pillBorder: 'border-[#CBD5E1]',
    pillText: 'text-[#334155]',
    pillShadow: 'shadow-[0_2px_10px_rgba(100,116,139,0.10)]',
  },
  BRONZE: {
    crownBg: 'bg-[#FFEDD5]',
    crownBorder: 'border-[#FED7AA]',
    crownColor: 'text-[#9A3412] fill-[#9A3412]',
    pillBg: 'bg-[#FFF7ED]',
    pillBorder: 'border-[#FED7AA]',
    pillText: 'text-[#9A3412]',
    pillShadow: 'shadow-[0_2px_10px_rgba(234,88,12,0.12)]',
  },
};

export interface GithubEkycCardProps {
  bytecodeMatrix: UserBytecodeMatrix;
  userProfile?: {
    githubVerified?: boolean;
    githubUsername?: string;
  } | null;
  onboardingLink?: boolean;
  className?: string;
}

export const GithubEkycCard: React.FC<GithubEkycCardProps> = ({
  bytecodeMatrix,
  userProfile,
  onboardingLink = true,
  className = '',
}) => {
  const isVerified = Boolean(userProfile?.githubVerified);
  const tier = bytecodeMatrix.reputationTier || 'BRONZE';
  const tierStyle = TIER_STYLES[tier] || TIER_STYLES.BRONZE;

  return (
    <div
      className={`
        bg-white rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-4.5
        border border-slate-200/80
        shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.03)]
        space-y-3 sm:space-y-3.5 select-none transition-all
        ${className}
      `}
    >
      {/* ── TOP HEADER ROW: GitHub Info + Score + Tier Pill in ONE Unified Line ── */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-nowrap min-w-0">
        {/* Left: GitHub Squircle Logo + Title (Never covered by score) */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
          {/* Squircle Container */}
          <div className="relative shrink-0">
            <div className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-[12px] sm:rounded-[14px] bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1px_rgba(255,255,255,1)] flex items-center justify-center">
              {/* GitHub Octocat Silhouette SVG */}
              <svg
                viewBox="0 0 24 24"
                className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-900 fill-current"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </div>

            {/* Verified Green Badge at bottom-right of squircle */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ${
                isVerified ? 'bg-[#10B981]' : 'bg-purple-600'
              } border-[1.5px] border-white shadow-2xs flex items-center justify-center text-white`}
              title={isVerified ? 'Verified on-chain via GitHub E-KYC' : 'Sovereign On-Chain Attestation'}
            >
              {isVerified ? (
                <Check size={8} strokeWidth={3.5} />
              ) : (
                <ShieldCheck size={8} strokeWidth={3} />
              )}
            </div>
          </div>

          {/* Titles */}
          <div className="min-w-0 shrink-0">
            <h3 className="text-[11px] sm:text-[12px] font-black text-slate-900 leading-tight tracking-tight whitespace-nowrap">
              {isVerified ? 'GitHub E-KYC' : 'PolyLance E-KYC'}
            </h3>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 leading-tight whitespace-nowrap">
              Attestation
            </div>
            <div className="text-[5.5px] sm:text-[6px] font-mono tracking-[0.1em] text-slate-400 font-medium mt-0.5 uppercase flex items-center gap-1 whitespace-nowrap">
              <span>VERIFIED</span>
              <span>•</span>
              <span>TRUSTED</span>
            </div>
          </div>
        </div>

        {/* Right: Rank Tier Pill ABOVE Score Box (Vertical Stack) */}
        <div className="flex flex-col items-end gap-1 shrink-0 ml-auto">
          {/* Rank Tier Badge placed above the score card */}
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${tierStyle.pillBg} border ${tierStyle.pillBorder} ${tierStyle.pillShadow} shrink-0`}
          >
            <Crown size={8.5} className={`${tierStyle.crownColor} shrink-0`} />
            <span
              className={`text-[7.5px] sm:text-[8px] font-black tracking-wider ${tierStyle.pillText} uppercase font-mono leading-none`}
            >
              {tier}
            </span>
          </div>

          {/* Score Pill Box (Minty Green - with Increased Score Size) */}
          <div className="px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-[#E6F9F0] border border-[#B9F0D6] shadow-[inset_0_1px_1px_rgba(255,255,255,0.75)] flex flex-col justify-center shrink-0">
            <span className="text-[7px] sm:text-[7.5px] font-semibold text-emerald-800 leading-none mb-0.5">
              Score
            </span>
            <div className="flex items-baseline leading-none">
              <span className="text-[14px] sm:text-[15.5px] font-black text-slate-900 font-sans tracking-tight">
                {bytecodeMatrix.primaryScore}
              </span>
              <span className="text-[8px] sm:text-[8.5px] text-slate-500 font-bold ml-1 font-mono">
                / 1000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUB-HEADER ROW: Language Contributions & Total Bytes (Always 1 Line) ── */}
      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100/90 whitespace-nowrap min-w-0">
        <span className="text-[7px] sm:text-[7.5px] font-bold font-mono tracking-[0.1em] text-slate-400 uppercase truncate">
          LANGUAGE CONTRIBUTIONS
        </span>
        <div className="flex items-center gap-1 text-[7px] sm:text-[7.5px] font-mono text-slate-400 shrink-0 whitespace-nowrap">
          <Code2 size={9} className="text-slate-400 stroke-[2] shrink-0" />
          <span className="font-semibold uppercase tracking-wider text-slate-400">TOTAL</span>
          <span className="text-[8px] sm:text-[8.5px] font-bold text-[#1E293B] font-mono whitespace-nowrap">
            {bytecodeMatrix.totalBytes.toLocaleString()} Bytes
          </span>
        </div>
      </div>

      {/* ── LANGUAGE CONTRIBUTIONS PILL ROWS (Matching Image 2 Reference) ─── */}
      {bytecodeMatrix.languagesWithPercentages.length > 0 ? (
        <div className="space-y-1 sm:space-y-1.5">
          {bytecodeMatrix.languagesWithPercentages.map((item) => {
            const langColor =
              LANGUAGE_DISPLAY_COLORS[item.language] ||
              item.color ||
              '#2563EB';

            return (
              <div
                key={item.language}
                className="w-full bg-white rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:border-slate-200 transition-all flex items-center justify-between group"
              >
                {/* Left: Language Dot + Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: langColor }}
                  />
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                    {item.language}
                  </span>
                </div>

                {/* Right: Formatted Byte Count in Language Signature Color */}
                <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <span
                    className="text-[9.5px] sm:text-[10px] font-black font-mono whitespace-nowrap"
                    style={{ color: langColor }}
                  >
                    {item.bytes.toLocaleString()} Bytes
                  </span>
                  {item.percentage > 0 && (
                    <span className="text-[8px] sm:text-[8.5px] font-mono text-slate-400 font-medium whitespace-nowrap">
                      ({item.percentage}%)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200 text-center space-y-1">
          <p className="font-bold text-[11px] text-slate-700">No Audited Code Detected</p>
          <p className="text-[10px] text-slate-500 font-sans">
            0 GitHub repositories / 0 on-chain escrow deliverables detected.
          </p>
          {onboardingLink && !isVerified && (
            <div className="pt-1.5">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10.5px] shadow-xs transition-all"
              >
                Connect GitHub Profile &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Footer Attestation Hash & Prompt */}
      {bytecodeMatrix.attestationHash && (
        <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[9.5px] text-slate-400 font-mono">
          <span>
            Attestation Hash:{' '}
            <code className="text-slate-700 font-bold bg-slate-100 px-1 py-0.5 rounded">
              {bytecodeMatrix.attestationHash.slice(0, 8)}...
              {bytecodeMatrix.attestationHash.slice(-6)}
            </code>
          </span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified On-Chain
          </span>
        </div>
      )}
    </div>
  );
};
