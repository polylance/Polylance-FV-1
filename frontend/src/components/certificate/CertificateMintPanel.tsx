import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  Info,
  X
} from 'lucide-react';
import { Button } from '../common/Button';
import { CONTRACTS } from '../../config/contracts';
import { generateCertificateSvg, renderCertificateToPng } from '../../utils/certificateGenerator';

interface CertificateMintPanelProps {
  tokenId: number | string;
  jobTitle?: string;
  recipientAddress?: string;
  clientAddress?: string;
  amount?: number | string;
  tokenSymbol?: string;
  completedAt?: number;
  variant?: 'work' | 'patronage';
  contractAddress?: string;
  onClose?: () => void;
}

export const CertificateMintPanel: React.FC<CertificateMintPanelProps> = ({
  tokenId,
  jobTitle = 'Verified Milestone Deliverable',
  recipientAddress = '',
  clientAddress = '',
  amount = 500,
  tokenSymbol = 'USDC',
  completedAt = Date.now(),
  variant = 'work',
  contractAddress = CONTRACTS.ReputationSBT,
  onClose,
}) => {
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [watchAssetStatus, setWatchAssetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [downloadingPng, setDownloadingPng] = useState(false);

  const certUrl = `${window.location.origin}/#/attestation/${tokenId}`;

  // SVG representation for the card
  const svgMarkup = generateCertificateSvg({
    tokenId,
    variant,
    jobTitle,
    recipientAddress,
    clientAddress,
    amount,
    tokenSymbol,
    completedAt,
    contractAddress,
  });

  const handleWatchAsset = async () => {
    try {
      const anyWindow = window as any;
      if (!anyWindow.ethereum) {
        setShowManualInstructions(true);
        return;
      }

      const res = await anyWindow.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: contractAddress,
            tokenId: String(tokenId),
          },
        },
      });

      if (res) {
        setWatchAssetStatus('success');
      } else {
        setShowManualInstructions(true);
      }
    } catch (err) {
      console.warn('[WATCH_ASSET] Error invoking wallet_watchAsset:', err);
      setShowManualInstructions(true);
      setWatchAssetStatus('error');
    }
  };

  const handleDownloadPng = async () => {
    try {
      setDownloadingPng(true);
      const blob = await renderCertificateToPng(svgMarkup);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PolyLance-Certificate-${tokenId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download certificate PNG:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `PolyLance Verified Work Certificate #${tokenId}`,
          text: `Verified milestone performance on Polygon: ${jobTitle}`,
          url: certUrl,
        });
      } else {
        await navigator.clipboard.writeText(certUrl);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(certUrl);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 sm:p-8 max-w-xl mx-auto shadow-[0_4px_24px_rgba(0,0,0,0.06)] text-left relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F6F7F9] hover:bg-[#E5E7EB] text-[#4B5563] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      )}

      {/* ── HEADER ── */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-[#E5E7EB]">
        <div className="w-8 h-8 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0B0B0F]">
            Your verified work certificate is ready
          </h2>
          <p className="text-xs text-[#4B5563]">
            Minted on Polygon as a non-transferable ERC-5192 Soulbound Token.
          </p>
        </div>
      </div>

      {/* ── CERTIFICATE PREVIEW WITH FLAT 400MS SEAL STAMP ANIMATION ── */}
      <div className="py-6 flex justify-center">
        <div className="relative w-72 sm:w-80 aspect-square rounded-[12px] border border-[#E5E7EB] overflow-hidden bg-[#FAFAF8] shadow-md group">
          {/* Certificate SVG Canvas */}
          <div 
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: svgMarkup }} 
          />

          {/* Stamped Seal Overlay (One-time press: scale 1.12 to 1 and fade over 400ms, flat, no glow) */}
          <div 
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{
              animation: 'certSealPress 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <style>{`
              @keyframes certSealPress {
                0% {
                  transform: scale(1.12);
                  opacity: 0;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
        <Button
          variant="primary"
          size="md"
          leadingIcon={<Wallet size={16} />}
          onClick={handleWatchAsset}
          className="w-full"
        >
          {watchAssetStatus === 'success' ? 'Added to wallet' : 'Add to wallet'}
        </Button>

        <Button
          as="Link"
          to={`/attestation/${tokenId}`}
          variant="secondary"
          size="md"
          trailingIcon={<ExternalLink size={14} />}
          className="w-full"
        >
          View certificate
        </Button>

        <Button
          variant="ghost"
          size="md"
          leadingIcon={<Share2 size={15} />}
          onClick={handleShare}
          className="w-full"
        >
          {copiedShare ? 'Link copied!' : 'Share'}
        </Button>
      </div>

      {/* ── DOWNLOAD PNG ACTION ── */}
      <div className="pt-3 flex items-center justify-between text-xs text-[#4B5563] border-t border-[#E5E7EB] mt-5">
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={downloadingPng}
          className="inline-flex items-center gap-1.5 font-semibold text-[#0047AB] hover:underline cursor-pointer disabled:opacity-50"
        >
          <Download size={14} />
          <span>{downloadingPng ? 'Rendering PNG...' : 'Download 1000x1000 PNG (<800 KB)'}</span>
        </button>
        <span className="font-mono text-[#6B7280]">PL-SBT #{tokenId}</span>
      </div>

      {/* ── WALLET IMPORT INSTRUCTIONS MODAL/ACCORDION ── */}
      {showManualInstructions && (
        <div className="mt-4 p-4 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs space-y-3">
          <div className="flex items-start gap-2 text-[#0B0B0F] font-semibold">
            <Info size={16} className="text-[#0047AB] shrink-0 mt-0.5" />
            <span>How to display your certificate in your Web3 wallet</span>
          </div>

          <p className="text-[#4B5563] leading-relaxed">
            MetaMask users: Open the <strong>NFTs</strong> tab. If it doesn't appear automatically, enable <em>"Autodetect NFTs"</em> in Settings &gt; Security &amp; Privacy, or import manually with the details below. Other wallets index NFTs through background indexers and may take several minutes to display.
          </p>

          <div className="space-y-2 pt-1 font-mono">
            <div className="p-2.5 rounded-[6px] bg-white border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="text-[#6B7280] block text-[10px] font-sans">CONTRACT ADDRESS</span>
                <span className="text-[#0B0B0F] font-semibold text-xs truncate max-w-[260px] sm:max-w-[340px] block">
                  {contractAddress}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(contractAddress);
                  setCopiedContract(true);
                  setTimeout(() => setCopiedContract(false), 2000);
                }}
                className="text-[#0047AB] hover:underline flex items-center gap-1 text-[11px] font-sans font-medium"
              >
                {copiedContract ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedContract ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-[6px] bg-white border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="text-[#6B7280] block text-[10px] font-sans">TOKEN ID</span>
                <span className="text-[#0B0B0F] font-semibold text-xs">
                  {tokenId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(String(tokenId));
                  setCopiedTokenId(true);
                  setTimeout(() => setCopiedTokenId(false), 2000);
                }}
                className="text-[#0047AB] hover:underline flex items-center gap-1 text-[11px] font-sans font-medium"
              >
                {copiedTokenId ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedTokenId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
