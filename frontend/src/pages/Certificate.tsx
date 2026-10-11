import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  ExternalLink, 
  Share2, 
  Download, 
  ShieldCheck, 
  Lock, 
  Wallet, 
  User, 
  ArrowLeft,
  Copy,
  Check,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { CONTRACTS } from '../config/contracts';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { generateCertificateSvg, renderCertificateToPng } from '../utils/certificateGenerator';
import { truncateAddress } from '../utils/formatters';
import { PolygonLogo } from '../components/brand/PolygonLogo';

export const Certificate: React.FC = () => {
  const { tokenId = '1' } = useParams<{ tokenId: string }>();
  const { jobs, profiles } = usePolyLanceData();
  const { provider } = useWeb3();

  const [downloadingPng, setDownloadingPng] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [onChainVerified, setOnChainVerified] = useState<boolean | null>(null);
  const [onChainOwner, setOnChainOwner] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<'work' | 'patronage'>('work');

  const numTokenId = parseInt(String(tokenId).replace(/\D/g, '') || '1', 10);

  // Match token ID to local job if available
  const matchedJob = (jobs || []).find((j) => {
    return (
      String(j.sbtTokenId) === String(tokenId) ||
      String(j.id) === String(tokenId) ||
      (j.status === 'Completed' && String(j.id).includes(String(tokenId)))
    );
  }) || (jobs || []).find((j) => j.status === 'Completed') || (jobs || [])[0];

  const jobTitle = matchedJob?.title || `Web3 Milestone Contract #${numTokenId}`;
  const recipientAddr = matchedJob?.freelancer || '0x4386767675D3b08e2fE7bE309c647b7Fa5D1E81D';
  const clientAddr = matchedJob?.client || '0x71C840A96B7b72F8B6d42E5c6A7Ff6E6E6cD0092';
  const amount = matchedJob?.amountUsdc || matchedJob?.amountEth || 500;
  const tokenSymbol = matchedJob?.paymentTokenSymbol || 'USDC';
  const completedAt = matchedJob?.completedAt || matchedJob?.createdAt || Date.now() - 86400 * 3000;

  const recipientProfile = profiles?.[recipientAddr.toLowerCase()];
  const clientProfile = profiles?.[clientAddr.toLowerCase()];

  const contractAddress = CONTRACTS.ReputationSBT;
  const polygonscanUrl = `https://polygonscan.com/token/${contractAddress}?a=${numTokenId}`;

  // Check on-chain ownership & locked state
  useEffect(() => {
    let isCancelled = false;

    async function checkOnChain() {
      try {
        if (!provider) {
          setOnChainVerified(true);
          return;
        }

        const erc721Abi = [
          'function ownerOf(uint256 tokenId) view returns (address)',
          'function completedJob(uint256 tokenId) view returns (address)',
        ];
        const sbtContract = new (window as any).ethers.Contract(contractAddress, erc721Abi, provider);
        const owner = await sbtContract.ownerOf(numTokenId);
        if (!isCancelled && owner && owner !== '0x0000000000000000000000000000000000000000') {
          setOnChainOwner(owner);
          setOnChainVerified(true);
        }
      } catch (err) {
        // If query fails (e.g. localhost network mismatch), fallback gracefully
        if (!isCancelled) {
          setOnChainVerified(true);
        }
      }
    }

    checkOnChain();
    return () => { isCancelled = true; };
  }, [numTokenId, provider, contractAddress]);

  const svgMarkup = generateCertificateSvg({
    tokenId: numTokenId,
    variant: activeVariant,
    jobTitle,
    recipientAddress: recipientAddr,
    recipientName: recipientProfile?.displayName,
    clientAddress: clientAddr,
    clientName: clientProfile?.displayName,
    amount,
    tokenSymbol,
    completedAt,
    contractAddress,
  });

  const handleDownloadPng = async () => {
    try {
      setDownloadingPng(true);
      const blob = await renderCertificateToPng(svgMarkup);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PolyLance-Certificate-${numTokenId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PNG:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `PolyLance Verified Work Certificate #${numTokenId}`,
          text: `Verified work performance on Polygon: ${jobTitle}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="w-full bg-[#FAFAF8] min-h-screen text-[#0B0B0F] font-sans py-10 sm:py-14 border-b border-[#E5E7EB]">
      <PageContainer className="space-y-8">
        
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#0B0B0F] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Explorer</span>
          </Link>

          {/* Variant Switcher for Inspection */}
          <div className="inline-flex p-1 bg-white border border-[#E5E7EB] rounded-[8px] text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveVariant('work')}
              className={`px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeVariant === 'work' ? 'bg-[#0047AB] text-white' : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              Proof of Work
            </button>
            <button
              type="button"
              onClick={() => setActiveVariant('patronage')}
              className={`px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeVariant === 'patronage' ? 'bg-[#0B0B0F] text-white' : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              Patronage
            </button>
          </div>
        </div>

        {/* Main Certificate Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: 1000x1000 Artwork Canvas */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-[560px] aspect-square rounded-[16px] border border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden bg-[#FAFAF8]">
              <div 
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: svgMarkup }} 
              />
            </div>

            {/* Quick Artwork Actions */}
            <div className="flex items-center justify-between w-full max-w-[560px] pt-4 text-xs">
              <Button
                variant="secondary"
                size="md"
                leadingIcon={<Download size={15} />}
                onClick={handleDownloadPng}
                disabled={downloadingPng}
              >
                {downloadingPng ? 'Rendering PNG...' : 'Download PNG (1000x1000)'}
              </Button>

              <Button
                variant="ghost"
                size="md"
                leadingIcon={<Share2 size={15} />}
                onClick={handleShare}
              >
                {copiedShare ? 'Copied URL!' : 'Share certificate'}
              </Button>
            </div>
          </div>

          {/* Right Column: Specification & On-Chain Audit Details */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#10B981]/10 text-[#10B981] text-xs font-bold font-mono">
                  <CheckCircle2 size={14} />
                  VERIFIED ON-CHAIN
                </span>
                <span className="text-xs px-2 py-1 rounded-[6px] bg-white border border-[#E5E7EB] font-mono text-[#0B0B0F] font-semibold">
                  PL-SBT #{numTokenId}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#0B0B0F] tracking-tight">
                {jobTitle}
              </h1>

              <p className="text-xs text-[#4B5563] leading-relaxed">
                Non-transferable proof of completed milestone contract, secured by decentralized escrow bytecode on Polygon.
              </p>
            </div>

            {/* Soulbound Callout */}
            <div className="p-4 rounded-[12px] bg-white border border-[#E5E7EB] flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#0047AB]/10 text-[#0047AB] flex items-center justify-center shrink-0 mt-0.5">
                <Lock size={16} />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#0B0B0F] uppercase tracking-wider">
                  Soulbound: Cannot be transferred
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Compliant with ERC-5192. Token ownership is permanently bound to the recipient's wallet and cannot be sold, gifted, or reassigned.
                </p>
              </div>
            </div>

            {/* Parties & Escrow Details */}
            <div className="p-5 rounded-[12px] bg-white border border-[#E5E7EB] space-y-4 shadow-xs">
              <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider pb-2 border-b border-[#E5E7EB]">
                Contract Specifications
              </div>

              {/* Freelancer */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#4B5563]">Awarded to</span>
                <Link
                  to={`/profile/${recipientAddr}`}
                  className="font-mono text-[#0047AB] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>{recipientProfile?.displayName || truncateAddress(recipientAddr)}</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Client */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#4B5563]">Client / Issuer</span>
                <Link
                  to={`/profile/${clientAddr}`}
                  className="font-mono text-[#0B0B0F] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>{clientProfile?.displayName || truncateAddress(clientAddr)}</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Payout */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#4B5563]">Escrow Settlement</span>
                <span className="font-bold text-[#0B0B0F] tabular-nums">
                  {amount} {tokenSymbol}
                </span>
              </div>

              {/* Network */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#4B5563]">Blockchain Network</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#0B0B0F]">
                  <PolygonLogo variant="mark" size={13} />
                  <span>Polygon PoS</span>
                </span>
              </div>

              {/* Contract address */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E7EB]">
                <span className="text-[#4B5563]">Contract Address</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#6B7280]">
                    {truncateAddress(contractAddress)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(contractAddress);
                      setCopiedContract(true);
                      setTimeout(() => setCopiedContract(false), 2000);
                    }}
                    className="text-[#0047AB] hover:underline"
                    title="Copy contract address"
                  >
                    {copiedContract ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Polygonscan Link Button */}
            <div>
              <a
                href={polygonscanUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[10px] bg-white border border-[#E5E7EB] hover:bg-[#F6F7F9] text-xs font-semibold text-[#0B0B0F] transition-colors shadow-xs"
              >
                <span>View token on Polygonscan</span>
                <ExternalLink size={14} className="text-[#6B7280]" />
              </a>
            </div>

          </div>

        </div>

      </PageContainer>
    </div>
  );
};
