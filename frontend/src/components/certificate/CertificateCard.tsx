import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Copy, Check, ShieldCheck, Lock } from 'lucide-react';
import { truncateAddress } from '../../utils/formatters';

export interface CertificateCardProps {
  onchainTokenId: number | string;
  certificateNo?: number | string;
  jobTitle: string;
  variant?: 'work' | 'patronage';
  holderWallet?: string;
  clientWallet?: string;
  freelancerWallet?: string;
  amount?: number | string;
  tokenSymbol?: string;
  completedAt?: number | string;
  mintTxHash?: string;
  contractAddress?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

const DEFAULT_SBT_CONTRACT = '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879';

export const CertificateCard: React.FC<CertificateCardProps> = ({
  onchainTokenId,
  certificateNo,
  jobTitle,
  variant = 'work',
  holderWallet,
  clientWallet,
  freelancerWallet,
  amount,
  tokenSymbol = 'POL',
  completedAt,
  mintTxHash,
  contractAddress = DEFAULT_SBT_CONTRACT,
  isSelected = false,
  onSelect,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  const isPatronage = variant === 'patronage';
  const roleLabel = isPatronage ? 'Patronage' : 'Verified Work';
  const displayTokenId = `PL-SBT #${onchainTokenId}`;
  const displayCertNo = certificateNo !== undefined && certificateNo !== null && String(certificateNo) !== ''
    ? `Certificate No: #${certificateNo}`
    : undefined;

  const polygonscanNftUrl = `https://polygonscan.com/nft/${contractAddress}/${onchainTokenId}`;

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayTokenId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formattedDate = completedAt
    ? new Date(typeof completedAt === 'number' ? completedAt : String(completedAt)).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined;

  return (
    <div
      onClick={onSelect}
      className={`rounded-[12px] border p-4 bg-white transition-all cursor-pointer relative ${
        isSelected
          ? 'border-[#0047FF] ring-2 ring-[#0047FF]/20 shadow-md'
          : 'border-[#E2E6EC] hover:border-[#0047FF]/60 hover:shadow-sm'
      }`}
    >
      {/* Top Bar: Primary PL-SBT # and Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-[#0B0E14] tracking-tight">
            {displayTokenId}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            title="Copy SBT Token ID"
            className="text-gray-400 hover:text-[#0047FF] transition-colors p-0.5"
          >
            {copiedId ? <Check size={12} className="text-[#00D2FF]" /> : <Copy size={12} />}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-[4px] border ${
              isPatronage
                ? 'bg-[#0047FF]/10 text-[#0047FF] border-[#0047FF]/20'
                : 'bg-[#00D2FF]/10 text-[#0047FF] border-[#00D2FF]/30'
            }`}
          >
            {roleLabel}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-[4px] border border-emerald-200">
            <CheckCircle2 size={10} />
            Soulbound
          </span>
        </div>
      </div>

      {/* Secondary Certificate Number */}
      {displayCertNo && (
        <div className="text-[11px] font-mono text-gray-500 mb-2">
          {displayCertNo}
        </div>
      )}

      {/* Job Title */}
      <h3 className="font-semibold text-sm text-[#0B0E14] line-clamp-1 mb-2">
        {jobTitle}
      </h3>

      {/* Parties & Value Row */}
      <div className="text-xs text-gray-600 space-y-1 mb-3 pt-2 border-t border-gray-100">
        {holderWallet && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Holder:</span>
            <span className="font-mono text-[11px] text-gray-700">{truncateAddress(holderWallet)}</span>
          </div>
        )}
        {amount && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Settled:</span>
            <span className="font-bold text-[#0B0E14]">{amount} {tokenSymbol}</span>
          </div>
        )}
        {formattedDate && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Date:</span>
            <span className="text-gray-600">{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Footer Actions: Polygonscan & Detailed Verification */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
        <a
          href={polygonscanNftUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[#0047FF] hover:text-[#0038CC] font-medium transition-colors"
          title={`View NFT #${onchainTokenId} on Polygonscan`}
        >
          <span>Polygonscan</span>
          <ExternalLink size={11} />
        </a>

        <Link
          to={`/certificate?token=${onchainTokenId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-gray-700 hover:text-[#0047FF] font-medium transition-colors"
        >
          <ShieldCheck size={12} className="text-[#0047FF]" />
          <span>View Diploma</span>
        </Link>
      </div>
    </div>
  );
};
