import React, { useEffect, useRef } from 'react';
import { X, Share2, ExternalLink, Check } from 'lucide-react';
import { CertificateBadge, CertificateBadgeProps } from './CertificateBadge';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface BadgeArrivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateBadgeProps;
  onShare?: () => void;
}

export const BadgeArrivalModal: React.FC<BadgeArrivalModalProps> = ({
  isOpen,
  onClose,
  certificate,
  onShare,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const [copiedShare, setCopiedShare] = React.useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/certified-pass?tokenId=${certificate.onchainTokenId}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
    if (onShare) onShare();
  };

  const polygonscanUrl = `https://polygonscan.com/nft/${certificate.contractAddress || '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879'}/${certificate.onchainTokenId}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-arrival-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-[28px] sm:rounded-[36px] border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all ${
          prefersReducedMotion ? '' : 'animate-in fade-in zoom-in-95 duration-300'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-full text-[#6B7280] hover:text-[#0B0B0F] hover:bg-[#F5F6FA] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header Celebration */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F7EF] text-[#0B7A55] border border-[#BFE6D3] mb-1">
            <span>🎉 Milestone Complete</span>
          </div>
          <h2
            id="badge-arrival-title"
            className="text-xl sm:text-2xl font-bold font-display text-[#0B0B0F] tracking-tight"
          >
            Your Soulbound Certificate Has Arrived
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Permanently verified and non-transferable on Polygon.
          </p>
        </div>

        {/* The Badge Card */}
        <div className="py-2">
          <CertificateBadge {...certificate} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-[#0047AB] hover:bg-[#00388A] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            {copiedShare ? <Check size={15} /> : <Share2 size={15} />}
            {copiedShare ? 'Link Copied!' : 'Share Certificate'}
          </button>

          <a
            href={polygonscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#0B0B0F] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>View on Polygonscan</span>
            <ExternalLink size={14} className="text-[#6B7280]" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default BadgeArrivalModal;
