import React, { useState } from 'react';
import { ShieldCheck, Check, Copy, ExternalLink } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { truncateAddress } from '../../utils/formatters';

/* ==========================================================================
   COMPLETION BADGE (Reference Image 2)
   - 1000x1000 square card layout with ~56px radius (responsive)
   - 220px circular badge at the top holding the verified seal / hexagon logo
   - Title bar ("Proof of Work" or "Patronage")
   - Subtitle bar / job title
   - Recipient line
   - Hairline divider
   - Semantic green chip "Verified on-chain" (#0B7A55 text / #E8F7EF fill / #BFE6D3 border)
   - PL-SBT #id and date at the right
   - Max 6deg perspective hover tilt (disabled under reduced motion)
   ========================================================================== */

export interface CertificateBadgeProps {
  onchainTokenId: number | string;
  jobTitle: string;
  variant?: 'work' | 'patronage';
  recipientName?: string;
  recipientAddress?: string;
  clientName?: string;
  clientAddress?: string;
  amount?: number | string;
  tokenSymbol?: string;
  completedAt?: number | string;
  contractAddress?: string;
  onSelect?: () => void;
  className?: string;
}

const DEFAULT_SBT_CONTRACT = '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879';

export const CertificateBadge: React.FC<CertificateBadgeProps> = ({
  onchainTokenId,
  jobTitle,
  variant = 'work',
  recipientName,
  recipientAddress,
  clientName,
  clientAddress,
  amount,
  tokenSymbol = 'POL',
  completedAt,
  contractAddress = DEFAULT_SBT_CONTRACT,
  onSelect,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  const isPatronage = variant === 'patronage';
  const title = isPatronage ? 'Patronage' : 'Proof of Work';
  const displayTokenId = `PL-SBT #${onchainTokenId}`;

  const formattedDate = completedAt
    ? new Date(typeof completedAt === 'number' ? completedAt : String(completedAt)).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  const recipientDisplay = recipientName
    ? recipientName
    : recipientAddress
    ? truncateAddress(recipientAddress)
    : 'Verified Contributor';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max 6deg tilt
    const rotateY = ((x - centerX) / centerX) * 6;
    const rotateX = -((y - centerY) / centerY) * 6;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayTokenId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardStyle: React.CSSProperties = prefersReducedMotion
    ? {}
    : {
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease',
      };

  return (
    <div
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
      role="article"
      aria-label={`Certificate Badge for ${jobTitle} (${displayTokenId})`}
      className={`aspect-square max-w-[440px] sm:max-w-[480px] w-full mx-auto bg-white rounded-[36px] sm:rounded-[48px] border border-[#E5E7EB] shadow-lg hover:shadow-2xl p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden select-none cursor-pointer ${className}`}
    >
      {/* Background radial accent */}
      <div
        className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#EAF1FB]/50 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Section: Circular Badge with Verified Seal (Image 2 Reference) */}
      <div className="flex flex-col items-center text-center pt-2 relative z-10">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#EAF1FB] border-4 border-[#C9DAF2] p-3 flex items-center justify-center shadow-inner relative mb-4">
          <img
            src="/images/brand/polylance-verified-seal.png"
            alt="PolyLance Verified Seal"
            className="w-full h-full object-contain filter drop-shadow-sm"
            onError={(e) => {
              // Graceful fallback to inline vector if image fails
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Subtle seal ring animation */}
          <div
            className="absolute inset-0 rounded-full border border-[#0047AB]/20 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Title Bar */}
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#0B0B0F] tracking-tight">
          {title}
        </h2>

        {/* Subtitle / Job Title */}
        <p className="text-xs sm:text-sm font-medium text-[#4A5568] max-w-[320px] line-clamp-2 mt-1">
          {jobTitle}
        </p>

        {/* Awarded To */}
        <p className="text-xs text-[#6B7280] mt-2 font-mono">
          Awarded to <span className="font-semibold text-[#0B0B0F]">{recipientDisplay}</span>
        </p>

        {amount && (
          <p className="text-xs font-semibold text-[#0047AB] mt-1">
            {amount} {tokenSymbol} Released
          </p>
        )}
      </div>

      {/* Hairline Rule & Bottom Details */}
      <div className="w-full relative z-10">
        <div className="border-t border-[#E5E7EB] my-3 sm:my-4 w-full" aria-hidden="true" />

        <div className="flex items-center justify-between gap-2">
          {/* Left: Green Chip "Verified on-chain" (Tokens: #0B7A55 / #E8F7EF / #BFE6D3) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F7EF] text-[#0B7A55] border border-[#BFE6D3]">
            <ShieldCheck size={13} strokeWidth={2.5} />
            <span>Verified on-chain</span>
          </div>

          {/* Right: PL-SBT #id & Date */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="font-mono font-bold text-xs text-[#0B0B0F] block">
                {displayTokenId}
              </span>
              <span className="text-[10px] text-[#9CA3AF] block">{formattedDate}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy SBT Token ID"
              aria-label="Copy SBT Token ID"
              className="text-[#9CA3AF] hover:text-[#0047AB] transition-colors p-1 rounded-full hover:bg-[#F5F6FA]"
            >
              {copied ? <Check size={13} className="text-[#0B7A55]" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateBadge;
