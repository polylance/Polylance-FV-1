import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import { UserBytecodeMatrix } from '../utils/githubOracle';
import { AddressChip } from './common/AddressChip';

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
  const tier = (bytecodeMatrix.reputationTier || 'BRONZE').toUpperCase();

  // Curated high-contrast recognizable palette for programming languages
  const LANGUAGE_COLOR_MAP: Record<string, string> = {
    TypeScript: '#0047AB', // Cobalt
    JavaScript: '#F59E0B', // Amber
    Solidity: '#6366F1',   // Indigo
    Python: '#059669',     // Emerald
    HTML: '#EA580C',       // Orange
    CSS: '#0284C7',        // Sky
    Dart: '#0891B2',       // Cyan
    'C++': '#7C3AED',      // Violet
    C: '#475569',          // Slate
    Go: '#2563EB',         // Royal Blue
    Rust: '#DC2626',       // Red
    Shell: '#10B981',      // Green
    Java: '#D97706',       // Warm Amber
  };

  const fallbackShades = [
    '#0047AB',
    '#6366F1',
    '#0284C7',
    '#059669',
    '#F59E0B',
    '#EA580C',
    '#7C3AED',
    '#475569',
  ];

  const getLanguageColor = (lang: string, idx: number) => {
    return LANGUAGE_COLOR_MAP[lang] || fallbackShades[idx % fallbackShades.length];
  };

  // Filter out 0% entries to prevent UI clutter and confusion
  const rawLangs = bytecodeMatrix.languagesWithPercentages || [];
  const activeLangs = rawLangs.filter((item) => (item.percentage || 0) > 0);
  const langs = activeLangs.length > 0 ? activeLangs : rawLangs.slice(0, 6);

  return (
    <div
      className={`bg-white rounded-[12px] p-5 border border-[#E5E7EB] shadow-xs space-y-4 ${className}`}
    >
      {/* Header: Title, Verified check, Score, Tier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#0B0B0F] shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-[#0B0B0F]">GitHub verification</h3>
              {isVerified && (
                <span title="Verified on-chain">
                  <CheckCircle2 size={14} className="text-[#166534]" />
                </span>
              )}
            </div>
            <p className="text-xs text-[#4B5563] truncate">On-chain code activity and developer score</p>
          </div>
        </div>

        {/* Score & Tier Badge with fixed whitespace-nowrap and crisp layout */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1 whitespace-nowrap">
              <span className="text-xl font-bold tracking-tight text-[#0B0B0F]">
                {bytecodeMatrix.primaryScore}
              </span>
              <span className="text-xs font-medium text-[#6B7280]">/ 1000</span>
              <span
                className="inline-flex text-[#6B7280] hover:text-[#0B0B0F] cursor-help ml-0.5"
                title="Calculated from public commit frequency, repository quality, audited languages, and on-chain deliverables."
              >
                <Info size={13} />
              </span>
            </div>
            <div className="text-[11px] text-[#6B7280] whitespace-nowrap">Verification score</div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-[8px] bg-[#F6F7F9] text-[#0B0B0F] border border-[#E5E7EB] shrink-0">
            {tier}
          </span>
        </div>
      </div>

      {/* Language Contributions: Distinct high-contrast colors and filtered active languages */}
      {langs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between text-xs text-[#4B5563]">
            <span>Language contributions</span>
            <span className="text-[#6B7280]">
              {langs.length} {langs.length === 1 ? 'language' : 'languages'}
            </span>
          </div>

          {/* Stacked Bar */}
          <div className="w-full h-2 rounded-[8px] overflow-hidden flex bg-[#F6F7F9]">
            {langs.map((item, idx) => (
              <div
                key={item.language}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: getLanguageColor(item.language, idx),
                }}
                title={`${item.language}: ${item.percentage}%`}
              />
            ))}
          </div>

          {/* Percentage List with matching color dots */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
            {langs.map((item, idx) => (
              <div
                key={item.language}
                className="flex items-center gap-1.5 text-xs text-[#4B5563]"
                title={`${item.bytes.toLocaleString()} bytes analyzed`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getLanguageColor(item.language, idx) }}
                />
                <span className="font-medium text-[#0B0B0F]">{item.language}</span>
                <span className="text-[#6B7280] font-medium">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attestation Hash as AddressChip */}
      {bytecodeMatrix.attestationHash && (
        <div className="pt-2 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#6B7280]">Attestation hash:</span>
          <AddressChip address={bytecodeMatrix.attestationHash} />
        </div>
      )}

      {!isVerified && onboardingLink && (
        <div className="pt-2 border-t border-[#E5E7EB] text-center">
          <Link
            to="/settings"
            className="text-xs text-[#0047AB] font-medium hover:underline inline-flex items-center gap-1"
          >
            <span>Connect GitHub to verify credentials</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default GithubEkycCard;
