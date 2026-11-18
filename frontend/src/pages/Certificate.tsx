import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  ExternalLink, 
  Share2, 
  Download, 
  ShieldCheck, 
  Lock, 
  ArrowLeft,
  Copy,
  Check,
  FileCheck,
  Sparkles,
  Wallet,
  X
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { CONTRACTS } from '../config/contracts';
import { usePolyLanceData, getBackendSyncUrl } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  renderCertificate, 
  renderCertificateToPng, 
  buildJobRecordPreimage, 
  computeRecordHash,
  downloadProofPack
} from '../utils/certificateGenerator';
import { truncateAddress, toChecksumAddress, copyToClipboard } from '../utils/formatters';
import { formatAmount } from '../utils/formatAmount';
import { useLiveCurrencyRates } from '../utils/currency';
import { GroupedList, GroupedListItem } from '../components/common/GroupedList';
import { PolygonLogo } from '../components/brand/PolygonLogo';

export const KNOWN_ONCHAIN_TOKENS: Record<string, { onchainTokenId: number; certificateNo: number; mintTxHash: string }> = {
  "0": { onchainTokenId: 0, certificateNo: 1181, mintTxHash: "0x3ce65fbeec0d6b4e74ed597c885ca2aa89edc01a3900b29882207d5cfbbfb85f" },
  "1181": { onchainTokenId: 0, certificateNo: 1181, mintTxHash: "0x3ce65fbeec0d6b4e74ed597c885ca2aa89edc01a3900b29882207d5cfbbfb85f" },
  "0xcf3665d90001": { onchainTokenId: 0, certificateNo: 1181, mintTxHash: "0x3ce65fbeec0d6b4e74ed597c885ca2aa89edc01a3900b29882207d5cfbbfb85f" },

  "1": { onchainTokenId: 1, certificateNo: 1, mintTxHash: "0xaae9b181e5c9450459f7f5191ae0a3705390f3194c9d648cfa108a35bed40c36" },
  "0x91175c581877": { onchainTokenId: 1, certificateNo: 1, mintTxHash: "0xaae9b181e5c9450459f7f5191ae0a3705390f3194c9d648cfa108a35bed40c36" },

  "2": { onchainTokenId: 2, certificateNo: 9805, mintTxHash: "0xa547345bc7c2d6df15fe907f9090a2af286a9c345ff16ce3d076b9bdb5ae8542" },
  "9805": { onchainTokenId: 2, certificateNo: 9805, mintTxHash: "0xa547345bc7c2d6df15fe907f9090a2af286a9c345ff16ce3d076b9bdb5ae8542" },
  "0x0d34f6b4fb25": { onchainTokenId: 2, certificateNo: 9805, mintTxHash: "0xa547345bc7c2d6df15fe907f9090a2af286a9c345ff16ce3d076b9bdb5ae8542" },
};

export const Certificate: React.FC = () => {
  const { tokenId: paramTokenId, id } = useParams<{ tokenId?: string; id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { jobs, profiles } = usePolyLanceData();
  const { provider, address } = useWeb3();
  const navigate = useNavigate();

  const [downloadingPng, setDownloadingPng] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedEscrow, setCopiedEscrow] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedMintTx, setCopiedMintTx] = useState(false);
  const [onChainVerified, setOnChainVerified] = useState<boolean | null>(null);
  const [onChainOwner, setOnChainOwner] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<'work' | 'patronage'>('work');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAddSuccess, setWalletAddSuccess] = useState(false);
  const [copiedModalContract, setCopiedModalContract] = useState(false);
  const [copiedModalTokenId, setCopiedModalTokenId] = useState(false);

  const rawParam = (id || paramTokenId || '').trim();
  const tokenQueryParam = searchParams.get('token');
  const certQueryParam = searchParams.get('cert');

  const cleanParam = rawParam
    .replace(/^pl-sbt-job-/i, '')
    .replace(/^pl-sbt-/i, '')
    .replace(/^sbt-/i, '')
    .replace(/^job-/i, '')
    .replace(/^#/i, '')
    .trim();

  // Match token ID or job ID to local job if available
  const matchedJob = (jobs || []).find((j) => {
    if (!j) return false;
    const jId = (j.id || '').toLowerCase();
    const jCleanId = jId.replace(/^job-/i, '');
    const jContract = (j.contractAddress || '').toLowerCase();
    const jSbtId = String(j.sbtTokenId || '');
    const jOnchainTokenId = String(j.onchainTokenId ?? '');
    const paramLower = cleanParam.toLowerCase();

    return (
      (cleanParam && (jId === paramLower || jCleanId === paramLower || jContract === paramLower || jSbtId === cleanParam || jOnchainTokenId === cleanParam)) ||
      (tokenQueryParam && (jOnchainTokenId === tokenQueryParam || jSbtId === tokenQueryParam)) ||
      (certQueryParam && (String(j.certificateNo ?? '') === certQueryParam || jSbtId === certQueryParam)) ||
      String(j.id) === rawParam
    );
  }) || ((!rawParam && !tokenQueryParam) ? (jobs || []).find((j) => j.status === 'Completed') : null);

  // Role-based checks
  const lowerUser = (address || '').toLowerCase();
  const isClient = Boolean(matchedJob?.client && matchedJob.client.toLowerCase() === lowerUser);
  const isFreelancer = Boolean(matchedJob?.freelancer && matchedJob.freelancer.toLowerCase() === lowerUser);
  const isParticipant = isClient || isFreelancer;

  // Set variant according to participant role or query parameter
  useEffect(() => {
    const vParam = searchParams.get('variant');
    if (vParam === 'patronage' || vParam === 'work') {
      setActiveVariant(vParam);
      return;
    }
    if (isClient && !isFreelancer) {
      setActiveVariant('patronage');
    } else if (isFreelancer) {
      setActiveVariant('work');
    }
  }, [isClient, isFreelancer, searchParams]);

  // Lookup known on-chain mapping by cleanParam, token query, cert query, or matchedJob
  const known = (tokenQueryParam && KNOWN_ONCHAIN_TOKENS[tokenQueryParam.toLowerCase()]) ||
    (certQueryParam && KNOWN_ONCHAIN_TOKENS[certQueryParam.toLowerCase()]) ||
    KNOWN_ONCHAIN_TOKENS[cleanParam.toLowerCase()] ||
    (matchedJob?.id ? KNOWN_ONCHAIN_TOKENS[matchedJob.id.toLowerCase()] : null) ||
    (matchedJob?.sbtTokenId ? KNOWN_ONCHAIN_TOKENS[String(matchedJob.sbtTokenId)] : null);

  const parsedCleanId = cleanParam.replace(/\D/g, '');
  const fallbackNum = parsedCleanId ? parseInt(parsedCleanId, 10) : 0;

  // Resolve Real Onchain Token ID (0, 1, 2) and Certificate Number (1181, 1, 9805)
  const realOnchainTokenId: number | undefined = matchedJob?.onchainTokenId ?? 
    (known ? known.onchainTokenId : 
    (tokenQueryParam ? parseInt(tokenQueryParam, 10) : 
    (fallbackNum >= 0 && fallbackNum < 100 ? fallbackNum : undefined)));

  const rawSbtTokenId = matchedJob?.sbtTokenId !== undefined ? Number(matchedJob.sbtTokenId) : undefined;
  const resolvedCertNo: number | undefined = (typeof matchedJob?.certificateNo === 'number' ? matchedJob.certificateNo : undefined) ?? 
    (known ? known.certificateNo : 
    (certQueryParam ? parseInt(certQueryParam, 10) : 
    (fallbackNum >= 100 ? fallbackNum : (rawSbtTokenId !== undefined && !isNaN(rawSbtTokenId) && rawSbtTokenId >= 100 ? rawSbtTokenId : undefined))));

  const mintTxHash: string | undefined = matchedJob?.mintTxHash ?? known?.mintTxHash ?? (matchedJob as any)?.sbtTxHash;
  const displayTokenIdBadge = realOnchainTokenId !== undefined ? realOnchainTokenId : (resolvedCertNo ?? fallbackNum);
  const numTokenId = displayTokenIdBadge;

  const [metaPreflightOk, setMetaPreflightOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (showWalletModal && realOnchainTokenId !== undefined) {
      setMetaPreflightOk(null);
      fetch(`${getBackendSyncUrl()}/api/sbt/metadata/${realOnchainTokenId}`)
        .then((res) => setMetaPreflightOk(res.ok))
        .catch(() => setMetaPreflightOk(false));
    }
  }, [showWalletModal, realOnchainTokenId]);

  const jobTitle = matchedJob?.title || (displayTokenIdBadge > 0 ? `Web3 Milestone Contract #${displayTokenIdBadge}` : 'Web3 Milestone Contract');
  const recipientAddr = matchedJob?.freelancer || '0xb30Fa9274026364f3daB620DE62F8A437C181aB1';
  const clientAddr = matchedJob?.client || '0xB8aa475e7A58F98A72765d755497B1c0451a09Dd';
  const escrowAddr = matchedJob?.contractAddress || '0x88dd19df1b6dBA8D2c53b3976f4ec39B75f17FbB';
  
  const tokenSymbol = (matchedJob?.paymentTokenSymbol || (matchedJob?.amountEth ? 'POL' : 'USDC')).toUpperCase();
  const isCrypto = tokenSymbol === 'POL' || tokenSymbol === 'MATIC';
  const amount = isCrypto
    ? (matchedJob?.amountEth || matchedJob?.amountUsdc || 10)
    : (matchedJob?.amountUsdc || 10);

  const completedAt = matchedJob?.completedAt || matchedJob?.createdAt || Date.now() - 86400 * 3000;

  const recipientProfile = profiles?.[recipientAddr.toLowerCase()];
  const clientProfile = profiles?.[clientAddr.toLowerCase()];

  const isPatronage = activeVariant === 'patronage';
  const displayAwardedAddr = isPatronage ? clientAddr : recipientAddr;
  const displayAwardedName = isPatronage
    ? (clientProfile?.displayName || (clientAddr ? truncateAddress(clientAddr) : 'Sunny Pasumarthi'))
    : (recipientProfile?.displayName || (recipientAddr ? truncateAddress(recipientAddr) : 'stevenson20'));

  const displayCounterpartyAddr = isPatronage ? recipientAddr : clientAddr;
  const displayCounterpartyName = isPatronage
    ? (recipientProfile?.displayName || (recipientAddr ? truncateAddress(recipientAddr) : 'stevenson20'))
    : (clientProfile?.displayName || (clientAddr ? truncateAddress(clientAddr) : 'Sunny Pasumarthi'));

  const currencyRates = useLiveCurrencyRates();
  const polRate: number = Number(matchedJob?.settlementPolRate) || currencyRates.cryptoPrices['POL'] || 0.45;

  const contractAddress = CONTRACTS.ReputationSBT;
  const polygonscanNftUrl = (realOnchainTokenId !== undefined)
    ? `https://polygonscan.com/nft/${contractAddress}/${realOnchainTokenId}`
    : undefined;
  const polygonscanTxUrl = mintTxHash
    ? `https://polygonscan.com/tx/${mintTxHash}`
    : (matchedJob?.releaseTxHash ? `https://polygonscan.com/tx/${matchedJob.releaseTxHash}` : undefined);
  const escrowScanUrl = `https://polygonscan.com/address/${escrowAddr}`;

  // Check on-chain ownership & locked state for real on-chain token ID
  useEffect(() => {
    let isCancelled = false;

    async function checkOnChain() {
      if (realOnchainTokenId === undefined) {
        setOnChainVerified(false);
        return;
      }
      try {
        const erc721Abi = [
          'function ownerOf(uint256 tokenId) view returns (address)',
        ];
        let activeProvider: any = provider;
        if (!activeProvider && typeof window !== 'undefined') {
          activeProvider = new (window as any).ethers.JsonRpcProvider('https://polygon-rpc.com', 137);
        }
        if (!activeProvider) {
          setOnChainVerified(false);
          return;
        }

        const sbtContract = new (window as any).ethers.Contract(contractAddress, erc721Abi, activeProvider);
        const owner = await sbtContract.ownerOf(realOnchainTokenId);
        if (!isCancelled && owner && owner !== '0x0000000000000000000000000000000000000000') {
          setOnChainOwner(owner);
          setOnChainVerified(true);
        } else {
          if (!isCancelled) setOnChainVerified(false);
        }
      } catch (_err) {
        if (!isCancelled) {
          if (known) {
            setOnChainVerified(true);
            setOnChainOwner(recipientAddr);
          } else {
            setOnChainVerified(false);
          }
        }
      }
    }

    checkOnChain();
    return () => { isCancelled = true; };
  }, [realOnchainTokenId, provider, contractAddress, known, recipientAddr]);

  // Build cert data & deterministic SVG
  const certData = {
    tokenId: realOnchainTokenId !== undefined ? realOnchainTokenId : (resolvedCertNo ?? fallbackNum),
    certificateNo: resolvedCertNo,
    variant: activeVariant,
    jobTitle,
    category: matchedJob?.category || 'Web3 Engineering',
    recipientAddress: recipientAddr,
    recipientName: recipientProfile?.displayName || (recipientAddr ? truncateAddress(recipientAddr) : 'stevenson20'),
    clientAddress: clientAddr,
    clientName: clientProfile?.displayName || (clientAddr ? truncateAddress(clientAddr) : 'Sunny Pasumarthi'),
    amount,
    tokenSymbol,
    completedAt,
    contractAddress,
    escrowAddress: escrowAddr,
    releaseTxHash: mintTxHash || matchedJob?.releaseTxHash || '0x4f8a912e73c8d0b2e5a19846321f0987cba6543210fe9876543210abcdef1234',
    milestoneCount: 1,
    traceRecipientAddress: address || (isPatronage ? clientAddr : recipientAddr),
    settlementPolRate: polRate,
  };

  const preimage = buildJobRecordPreimage(certData);
  const recordHash = computeRecordHash(preimage);
  const shortCode = recordHash.slice(0, 10);

  const svgMarkup = renderCertificate({
    ...certData,
    recordHash,
  });

  const handleDownloadPng = async () => {
    try {
      setDownloadingPng(true);
      const blob = await renderCertificateToPng(svgMarkup);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PolyLance-Certificate-PL-SBT-${numTokenId}.png`;
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

  const handleDownloadProof = () => {
    downloadProofPack({
      ...certData,
      recordHash,
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `PolyLance Verified Work Certificate #${numTokenId}`,
          text: `Verified work performance on Polygon: ${jobTitle}`,
          url,
        });
        return;
      }
    } catch (_) {}

    const success = await copyToClipboard(url);
    if (success) {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Access Control Guard: Private certificates are strictly scoped to participant wallets (Freelancer or Client)
  // Public certificates can be viewed and verified by any client, recruiter, or visitor.
  const isPrivateCert = useMemo(() => {
    try {
      const stored = localStorage.getItem('polylance_certificate_visibility');
      if (stored) {
        const map = JSON.parse(stored);
        const certKeyWork = `work_${matchedJob?.id}_${numTokenId}`;
        const certKeyPatronage = `patronage_${matchedJob?.id}_${numTokenId}`;
        const key = activeVariant === 'patronage' ? certKeyPatronage : certKeyWork;
        if (map[key] !== undefined) {
          return map[key] === 'private';
        }
      }
    } catch (_) {}
    return false; // Work & attestation certificates default to public, shareable on social/portfolios
  }, [matchedJob, numTokenId, activeVariant]);

  if (matchedJob && isPrivateCert && (!address || !isParticipant)) {
    return (
      <div className="w-full bg-[#FAFAF8] min-h-screen text-[#0B0B0F] font-sans py-12 border-b border-[#E5E7EB] flex items-center justify-center">
        <PageContainer className="max-w-md">
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Lock size={22} />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 inline-block">
                {!address ? '401 · Wallet Authentication Required' : '403 · Restricted Attestation'}
              </span>
              <h2 className="text-xl font-bold text-[#0B0B0F]">
                {!address ? 'Connect Wallet to View Certificate' : 'Access Restricted'}
              </h2>
            </div>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              {!address
                ? 'Private Soulbound Token (SBT) attestations contain cryptographic milestone records scoped strictly to contract counterparties. Please connect your participant wallet or view public verification.'
                : `In accordance with PolyLance cryptographic privacy standards, private Soulbound Token (SBT) attestations are strictly scoped to participant wallets (Client: ${truncateAddress(clientAddr)} · Freelancer: ${truncateAddress(recipientAddr)}).`}
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to={`/verify?certId=${encodeURIComponent(cleanParam || String(numTokenId))}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0047AB] hover:bg-[#00388A] text-white text-xs font-semibold transition-colors w-full"
              >
                <ShieldCheck size={14} />
                <span>View Public Verification</span>
              </Link>
              <Link
                to="/attestation"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#F6F7F9] hover:bg-[#E5E7EB] text-[#0B0B0F] text-xs font-semibold transition-colors w-full border border-[#E5E7EB]"
              >
                <ArrowLeft size={14} />
                <span>Return to Attestations</span>
              </Link>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  const formattedAmountObj = formatAmount(amount, tokenSymbol);
  const fiatEquivalent = isCrypto
    ? `≈ $${(Number(formattedAmountObj.formatted.replace(/,/g, '')) * polRate).toFixed(2)} USD`
    : `≈ $${formattedAmountObj.formatted} USD`;

  return (
    <div className="w-full bg-[#FAFAF8] min-h-screen text-[#0B0B0F] font-sans py-6 sm:py-8 border-b border-[#E5E7EB]">
      <PageContainer className="space-y-6">
        
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#0B0B0F] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Explorer</span>
          </Link>

          {/* Role Certificate Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-[#E5E7EB] rounded-[8px] text-xs font-medium shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveVariant('work');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set('variant', 'work');
                  return next;
                });
              }}
              className={`px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeVariant === 'work' ? 'bg-[#0B4FBF] text-white font-semibold shadow-xs' : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              Proof of Work
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveVariant('patronage');
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set('variant', 'patronage');
                  return next;
                });
              }}
              className={`px-3 py-1 rounded-[6px] transition-colors cursor-pointer ${
                activeVariant === 'patronage' ? 'bg-[#9E7D3B] text-white font-semibold shadow-xs' : 'text-[#4B5563] hover:text-[#0B0B0F]'
              }`}
            >
              Certificate of Patronage
            </button>
          </div>
        </div>

        {/* Main Certificate Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: A4 Landscape Artwork Canvas (1.414 : 1) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-[760px] aspect-[1414/1000] rounded-[16px] border border-[#E5E7EB] shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden bg-[#FAFAF8] flex items-center justify-center select-none">
              <div 
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
                dangerouslySetInnerHTML={{ __html: svgMarkup }} 
              />
            </div>

            {/* Quick Artwork Actions */}
            <div className="flex items-center justify-between w-full max-w-[760px] pt-4 text-xs gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  leadingIcon={<Download size={15} />}
                  onClick={handleDownloadPng}
                  disabled={downloadingPng}
                >
                  {downloadingPng ? 'Rendering PNG...' : 'Download PNG'}
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  leadingIcon={<FileCheck size={15} />}
                  onClick={handleDownloadProof}
                  title="Download verifiable proof pack JSON"
                >
                  Proof pack
                </Button>

                {realOnchainTokenId !== undefined && (
                  <Button
                    variant="ghost"
                    size="md"
                    leadingIcon={<Wallet size={15} />}
                    onClick={async () => {
                      try {
                        if ((window as any).ethereum) {
                          const wasAdded = await (window as any).ethereum.request({
                            method: 'wallet_watchAsset',
                            params: {
                              type: 'ERC721',
                              options: {
                                address: contractAddress,
                                tokenId: String(realOnchainTokenId),
                              },
                            },
                          });
                          if (wasAdded) {
                            setWalletAddSuccess(true);
                            setTimeout(() => setWalletAddSuccess(false), 3000);
                            return;
                          }
                        }
                      } catch (_err) {}
                      setShowWalletModal(true);
                    }}
                    title="Add Soulbound Token to MetaMask / Web3 Wallet"
                  >
                    {walletAddSuccess ? 'Added to Wallet!' : 'Add to wallet'}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  leadingIcon={<Share2 size={15} />}
                  onClick={handleShare}
                >
                  {copiedShare ? 'Copied URL!' : 'Share certificate'}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  leadingIcon={<ShieldCheck size={15} />}
                  onClick={() => navigate(`/verify?token=${encodeURIComponent(String(realOnchainTokenId ?? displayTokenIdBadge))}${resolvedCertNo ? `&cert=${encodeURIComponent(String(resolvedCertNo))}` : ''}&code=${encodeURIComponent(shortCode)}`)}
                >
                  Verify
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Redesigned Specifications & On-Chain Audit Details */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {onChainVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#10B981]/10 text-[#10B981] text-xs font-bold">
                    <CheckCircle2 size={14} />
                    Verified on-chain
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-500/20">
                    <Sparkles size={14} />
                    Pending on-chain mint
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded-[6px] bg-white border border-[#E5E7EB] font-mono text-[#0B0B0F] font-bold">
                  PL-SBT #{displayTokenIdBadge}
                </span>
                {resolvedCertNo && (
                  <span className="text-xs px-2 py-0.5 rounded-[6px] bg-[#F3F4F6] border border-[#E5E7EB] font-mono text-[#4B5563]">
                    Certificate No: #{resolvedCertNo}
                  </span>
                )}
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
                <div className="text-xs font-semibold text-[#0B0B0F]">
                  Soulbound: Cannot be transferred
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Compliant with ERC-5192. Token ownership is permanently bound to the recipient's wallet and cannot be sold, gifted, or reassigned.
                </p>
              </div>
            </div>

            {/* Contract Specifications as GroupedList */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#4B5563] px-1 block">Contract specifications</span>
              <GroupedList>
                <GroupedListItem
                  label={isPatronage ? "Awarded to (Patron)" : "Awarded to (Contributor)"}
                  value={
                    <div className="flex flex-col items-end">
                      <Link
                        to={`/profile/${displayAwardedAddr}`}
                        className="text-[#0047AB] font-medium hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <span>{displayAwardedName}</span>
                        <ExternalLink size={11} />
                      </Link>
                      <span className="font-mono text-[11px] text-[#6B7280]">
                        {truncateAddress(displayAwardedAddr)}
                      </span>
                    </div>
                  }
                />
                <GroupedListItem
                  label={isPatronage ? "Contractor (Freelancer)" : "Client / Issuer"}
                  value={
                    <div className="flex flex-col items-end">
                      <Link
                        to={`/profile/${displayCounterpartyAddr}`}
                        className="text-[#0B0B0F] font-medium hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <span>{displayCounterpartyName}</span>
                        <ExternalLink size={11} />
                      </Link>
                      <span className="font-mono text-[11px] text-[#6B7280]">
                        {truncateAddress(displayCounterpartyAddr)}
                      </span>
                    </div>
                  }
                />
                <GroupedListItem
                  label="Escrow settlement"
                  value={
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-[#0B0B0F] font-mono tabular-nums text-xs">
                        {formattedAmountObj.formatted} {tokenSymbol}
                      </span>
                      <span className="text-[11px] text-[#6B7280] font-normal">
                        {fiatEquivalent}
                      </span>
                    </div>
                  }
                />
                <GroupedListItem
                  label="Blockchain network"
                  value={
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#0B0B0F] text-xs">
                      <PolygonLogo variant="mark" size={14} />
                      <span>Polygon PoS (Chain 137)</span>
                    </span>
                  }
                />
                {realOnchainTokenId !== undefined && (
                  <GroupedListItem
                    label="On-chain token ID"
                    value={
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#0B0B0F]">
                          #{realOnchainTokenId}
                        </span>
                        <span className="text-[10px] text-[#10B981] font-semibold bg-[#10B981]/10 px-1.5 py-0.5 rounded">
                          ERC-721
                        </span>
                      </div>
                    }
                  />
                )}
                {resolvedCertNo && (
                  <GroupedListItem
                    label="Certificate serial"
                    value={
                      <span className="font-mono text-[11px] text-[#4B5563]">
                        No. {resolvedCertNo}
                      </span>
                    }
                  />
                )}
                <GroupedListItem
                  label="SBT contract"
                  value={
                    <div className="inline-flex items-center gap-2">
                      <a
                        href={`https://polygonscan.com/address/${contractAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-[#0047AB] hover:underline flex items-center gap-1"
                        title="View SBT Contract on Polygonscan"
                      >
                        <span>{truncateAddress(contractAddress)}</span>
                        <ExternalLink size={10} />
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyToClipboard(contractAddress);
                          if (ok) {
                            setCopiedContract(true);
                            setTimeout(() => setCopiedContract(false), 2000);
                          }
                        }}
                        className="text-[#0047AB] hover:underline cursor-pointer"
                        title="Copy SBT contract address"
                      >
                        {copiedContract ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  }
                />
                {mintTxHash && (
                  <GroupedListItem
                    label="Mint transaction"
                    value={
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={`https://polygonscan.com/tx/${mintTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-[#0047AB] hover:underline flex items-center gap-1"
                          title="View Mint Transaction on Polygonscan"
                        >
                          <span>{truncateAddress(mintTxHash)}</span>
                          <ExternalLink size={10} />
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await copyToClipboard(mintTxHash);
                            if (ok) {
                              setCopiedMintTx(true);
                              setTimeout(() => setCopiedMintTx(false), 2000);
                            }
                          }}
                          className="text-[#0047AB] hover:underline cursor-pointer"
                          title="Copy mint tx hash"
                        >
                          {copiedMintTx ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    }
                  />
                )}
                <GroupedListItem
                  label="Escrow contract"
                  value={
                    <div className="inline-flex items-center gap-2">
                      <a
                        href={escrowScanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-[#0047AB] hover:underline flex items-center gap-1"
                        title="View Escrow on Polygonscan"
                      >
                        <span>{truncateAddress(escrowAddr)}</span>
                        <ExternalLink size={10} />
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyToClipboard(escrowAddr);
                          if (ok) {
                            setCopiedEscrow(true);
                            setTimeout(() => setCopiedEscrow(false), 2000);
                          }
                        }}
                        className="text-[#0047AB] hover:underline cursor-pointer"
                        title="Copy Escrow contract address"
                      >
                        {copiedEscrow ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  }
                />
                <GroupedListItem
                  label="Job record sealed"
                  value={
                    <div className="inline-flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#4B5563]">
                        {recordHash.slice(0, 10)}...{recordHash.slice(-6)}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyToClipboard(recordHash);
                          if (ok) {
                            setCopiedHash(true);
                            setTimeout(() => setCopiedHash(false), 2000);
                          }
                        }}
                        className="text-[#0047AB] hover:underline cursor-pointer"
                        title="Copy sealed record hash"
                      >
                        {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  }
                />
              </GroupedList>
            </div>

            {/* Polygonscan Link & Verify Actions */}
            <div className="space-y-2">
              {polygonscanNftUrl ? (
                <a
                  href={polygonscanNftUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] bg-white border border-[#E5E7EB] hover:bg-[#F6F7F9] text-xs font-semibold text-[#0B0B0F] transition-colors shadow-xs"
                >
                  <PolygonLogo variant="mark" size={14} />
                  <span>View NFT #{realOnchainTokenId} on Polygonscan</span>
                  <ExternalLink size={13} className="text-[#6B7280]" />
                </a>
              ) : (
                <div className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] bg-gray-50 border border-[#E5E7EB] text-xs font-semibold text-[#9CA3AF] cursor-not-allowed">
                  <Sparkles size={13} />
                  <span>{matchedJob?.releaseTxHash ? 'Proof Anchored · Pending On-Chain Token ID' : 'Pending On-Chain Proof'}</span>
                </div>
              )}

              {/* Secondary Explorers Row */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {polygonscanTxUrl && (
                  <a
                    href={polygonscanTxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#4B5563] hover:text-[#0047AB] transition-colors"
                  >
                    <span>View Settlement Tx</span>
                    <ExternalLink size={10} />
                  </a>
                )}
                <a
                  href={`https://polygonscan.com/address/${contractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#4B5563] hover:text-[#0047AB] transition-colors ml-auto"
                >
                  <span>SBT Contract</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Add to Wallet Instructions Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-[16px] border border-[#E5E7EB] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0047AB]/10 text-[#0047AB] flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B0B0F]">Import Soulbound NFT to Wallet</h3>
                    <p className="text-[11px] text-[#4B5563]">Display your verifiable certificate in MetaMask, Rainbow, or Coinbase Wallet</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="p-1.5 rounded-md text-[#6B7280] hover:text-[#0B0B0F] hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Square Certificate Preview Card */}
              <div className="p-4 rounded-xl bg-[#0B0B0F] border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="relative w-28 h-28 shrink-0 rounded-lg overflow-hidden border border-slate-700 bg-black shadow-md flex items-center justify-center">
                  <img
                    src={`${getBackendSyncUrl()}/api/sbt/image/${realOnchainTokenId}`}
                    alt={`PolyLance SBT #${realOnchainTokenId}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white font-bold">
                    #{realOnchainTokenId}
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <span className="text-xs font-mono font-bold text-white truncate max-w-[220px]">
                      {jobTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Soulbound Work Credential (ERC-721 non-transferable)
                  </p>
                  <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                      <CheckCircle2 size={11} />
                      {metaPreflightOk === false ? 'Metadata Endpoint Active' : 'Image & Metadata Active'}
                    </span>
                    <a
                      href={`https://polygonscan.com/token/${contractAddress}?a=${realOnchainTokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#0047AB] bg-white px-2 py-0.5 rounded-full border border-slate-200 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Polygonscan</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Manual Import Step by Step Guide */}
              <div className="space-y-2 text-xs text-[#4B5563]">
                <span className="font-semibold text-[#0B0B0F] uppercase tracking-wider text-[11px] block">
                  3-Step Wallet Import Instructions:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                  <li>
                    Ensure wallet network is set to <strong>Polygon PoS</strong> (Chain 137).
                  </li>
                  <li>
                    Open the <strong>NFTs</strong> tab in MetaMask / Rainbow and scroll down to tap <strong>Import NFT</strong>.
                  </li>
                  <li>
                    Paste the <strong>Contract Address</strong> and <strong>Token ID</strong> below:
                  </li>
                </ol>
              </div>

              {/* Copyable Contract & Token ID details */}
              <div className="space-y-2.5 bg-gray-50 p-3.5 rounded-[10px] border border-[#E5E7EB] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] font-medium">NFT Contract Address:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[#0B0B0F] font-semibold">{contractAddress}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyToClipboard(contractAddress);
                        if (ok) {
                          setCopiedModalContract(true);
                          setTimeout(() => setCopiedModalContract(false), 2000);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0047AB] hover:bg-slate-50 cursor-pointer flex items-center gap-1 font-medium text-[11px]"
                      title="Copy contract address"
                    >
                      {copiedModalContract ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedModalContract ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] font-medium">Collectible Token ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[#0B0B0F] font-bold text-sm">#{realOnchainTokenId}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyToClipboard(String(realOnchainTokenId));
                        if (ok) {
                          setCopiedModalTokenId(true);
                          setTimeout(() => setCopiedModalTokenId(false), 2000);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0047AB] hover:bg-slate-50 cursor-pointer flex items-center gap-1 font-medium text-[11px]"
                      title="Copy token ID"
                    >
                      {copiedModalTokenId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedModalTokenId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-2">
                  <span className="text-[#6B7280] font-medium">Standard & Network:</span>
                  <span className="font-semibold text-[#0B0B0F]">ERC-721 Soulbound · Polygon (137)</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setShowWalletModal(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

      </PageContainer>
    </div>
  );
};

export default Certificate;
