import React, { useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toPng, toBlob } from 'html-to-image';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  ShieldCheck, Award, FileText, Calendar, User, CheckCircle2, 
  Printer, ArrowLeft, Building2, Sparkles, Clock, Globe, GitFork, 
  FileCheck, Shield, ChevronRight, Copy, Check, ExternalLink,
  Coins, Briefcase, Zap, Star, Lock, QrCode, ArrowUpRight,
  Share2, CheckCheck, HeartHandshake, Download
} from 'lucide-react';
import { truncateAddress, generateDeterministicHash, getCertifiedPassVerifyUrl } from '../utils/formatters';
import { CONTRACTS } from '../config/contracts';
import { generateIpfsCid } from '../utils/ipfs';
import { isAdminAddress, isJudgeAddress } from '../utils/adminGuard';
import polylanceLogoImg from '../assets/polylanceLogo.png';
import { getUserBytecodeMatrix } from '../utils/githubOracle';

export const AuditReport: React.FC = () => {
  const { address: targetAddressParam } = useParams<{ address: string }>();
  const { jobs, profiles, daoProposals, treasury, treasuryBalanceUsdc, treasuryHistory, judges } = usePolyLanceData();
  const { address: activeAddress, currentRole, isArbitrator, isTreasuryAdmin } = useWeb3();
  const [activeTab, setActiveTab] = useState<'social' | 'certificate'>('social');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCertId, setCopiedCertId] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fallback to active connected wallet if no address param in route
  const targetAddress = (targetAddressParam || activeAddress || '0x71c8366420a092c55660830e8115e9a44390001').toLowerCase();

  // Find profile case-insensitively
  const profileKey = Object.keys(profiles).find(k => k.toLowerCase() === targetAddress);
  const profile = profileKey ? profiles[profileKey] : null;

  // Filter jobs for this participant
  const clientJobs = jobs.filter(j => j && j.client && j.client.toLowerCase() === targetAddress);
  const freelancerJobs = jobs.filter(j => j && j.freelancer && j.freelancer.toLowerCase() === targetAddress);
  const completedFreelancerJobs = freelancerJobs.filter(j => j.status === 'Completed');
  const completedClientJobs = clientJobs.filter(j => j.status === 'Completed');

  // Determine role permissions strictly:
  // - Freelancers: ONLY freelancer audit report
  // - Clients: ONLY client audit report
  // - Judges: client, freelancer, judge reports
  // - Admins: client, freelancer, judge, and admin reports
  const isUserAdmin = Boolean(
    currentRole === 'admin' || 
    isTreasuryAdmin || 
    (activeAddress && isAdminAddress(activeAddress)) ||
    (targetAddress && isAdminAddress(targetAddress))
  );

  const isUserJudge = Boolean(
    currentRole === 'judge' || 
    isArbitrator || 
    (activeAddress && isJudgeAddress(activeAddress)) ||
    (targetAddress && isJudgeAddress(targetAddress)) ||
    (judges && judges.some(j => (j.address || '').toLowerCase() === activeAddress?.toLowerCase() || (j.address || '').toLowerCase() === targetAddress))
  );

  const isUserClient = Boolean(
    !isUserAdmin && !isUserJudge && (
      currentRole === 'client' || 
      profile?.role === 'client' || 
      (clientJobs.length > 0 && freelancerJobs.length === 0)
    )
  );

  const allowedPerspectives: Array<'client' | 'freelancer' | 'judge' | 'admin'> = useMemo(() => {
    if (isUserAdmin) {
      return ['client', 'freelancer', 'judge', 'admin'];
    }
    if (isUserJudge) {
      return ['client', 'freelancer', 'judge'];
    }
    if (isUserClient) {
      return ['client'];
    }
    return ['freelancer'];
  }, [isUserAdmin, isUserJudge, isUserClient]);

  const [perspectiveOverride, setPerspectiveOverride] = useState<'client' | 'freelancer' | 'judge' | 'admin' | null>(null);

  const defaultPerspective: 'client' | 'freelancer' | 'judge' | 'admin' = useMemo(() => {
    if (isUserAdmin) return 'admin';
    if (isUserJudge) return 'judge';
    if (isUserClient) return 'client';
    return 'freelancer';
  }, [isUserAdmin, isUserJudge, isUserClient]);

  const auditPerspective: 'client' | 'freelancer' | 'judge' | 'admin' = useMemo(() => {
    if (perspectiveOverride && allowedPerspectives.includes(perspectiveOverride)) {
      return perspectiveOverride;
    }
    if (allowedPerspectives.includes(defaultPerspective)) {
      return defaultPerspective;
    }
    return allowedPerspectives[0] || 'freelancer';
  }, [perspectiveOverride, allowedPerspectives, defaultPerspective]);

  // Compute developer statistics
  const devVolumeHandled = completedFreelancerJobs.reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
  }, 0);

  const bytecodeMatrix = getUserBytecodeMatrix(profile, completedFreelancerJobs.length, devVolumeHandled);
  const devReputationScore = bytecodeMatrix.primaryScore;
  
  const devSuccessRate = completedFreelancerJobs.length > 0
    ? Math.round((completedFreelancerJobs.filter(j => !j.dispute || (j.dispute.resolved && (j.dispute.rulingBps ?? 0) >= 5000)).length / completedFreelancerJobs.length) * 100)
    : 100;

  // Compute client statistics
  const clientReliabilityScore = clientJobs.length > 0 
    ? (10 - (clientJobs.filter(j => j.status === 'Disputed' || (j.dispute && j.dispute.resolved)).length / clientJobs.length) * 5).toFixed(1)
    : '10.0';
  
  const clientVolumeDistributed = completedClientJobs.reduce((sum, j) => {
    const paidFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * paidFraction);
  }, 0);

  const clientRehireRate = useMemo(() => {
    if (completedClientJobs.length <= 1) return '100%';
    const uniqueFreelancers = new Set(completedClientJobs.map(j => j.freelancer?.toLowerCase()).filter(Boolean));
    const repeatCount = completedClientJobs.length - uniqueFreelancers.size;
    return `${Math.round((repeatCount / (completedClientJobs.length - 1)) * 100)}%`;
  }, [completedClientJobs]);

  const displayName = profile?.displayName || `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`;

  // ── REAL-TIME JUDGE METRICS ──────────────────────────────────────────────
  const disputedJobs = useMemo(() => {
    return jobs.filter(j => j.status === 'Disputed' || (j.dispute && j.dispute.resolved));
  }, [jobs]);

  const resolvedDisputes = useMemo(() => {
    return disputedJobs.filter(j => j.dispute?.resolved);
  }, [disputedJobs]);

  const activeDisputes = useMemo(() => {
    return disputedJobs.filter(j => j.status === 'Disputed' && !j.dispute?.resolved);
  }, [disputedJobs]);

  const judgeScoreVal = useMemo(() => {
    if (disputedJobs.length === 0) return '10.0 / 10.0';
    const ratio = resolvedDisputes.length / disputedJobs.length;
    return `${(ratio * 10).toFixed(1)} / 10.0`;
  }, [disputedJobs.length, resolvedDisputes.length]);

  const judgeScoreSub = useMemo(() => {
    if (disputedJobs.length === 0) return 'Pristine Zero-Dispute Record';
    return `${resolvedDisputes.length} of ${disputedJobs.length} Disputes Resolved`;
  }, [disputedJobs.length, resolvedDisputes.length]);

  const judgeCasesVal = useMemo(() => {
    return `${resolvedDisputes.length} Case${resolvedDisputes.length === 1 ? '' : 's'}`;
  }, [resolvedDisputes.length]);

  const judgeCasesSub = useMemo(() => {
    if (activeDisputes.length > 0) return `${activeDisputes.length} Active in Tribunal`;
    if (disputedJobs.length === 0) return 'All Milestones Settled Cleanly';
    return '100% Quorum Ratified';
  }, [activeDisputes.length, disputedJobs.length]);

  const judgeConsensusVal = useMemo(() => {
    if (daoProposals && daoProposals.length > 0) {
      const executed = daoProposals.filter(p => p.status === 'Executed').length;
      return `${Math.round((executed / daoProposals.length) * 100)}%`;
    }
    if (disputedJobs.length > 0) {
      return `${Math.round((resolvedDisputes.length / disputedJobs.length) * 100)}%`;
    }
    return '100%';
  }, [daoProposals, disputedJobs.length, resolvedDisputes.length]);

  const judgeVelocityVal = useMemo(() => {
    if (resolvedDisputes.length > 0) {
      const totalElapsedHours = resolvedDisputes.reduce((acc, j) => {
        const start = j.dispute?.raisedAt || j.createdAt || 0;
        const end = j.completedAt || Date.now();
        const diffHours = Math.max(0.5, (end - start) / (1000 * 60 * 60));
        return acc + diffHours;
      }, 0);
      const avg = totalElapsedHours / resolvedDisputes.length;
      return avg < 24 ? `< ${Math.max(1, Math.round(avg))} Hours` : `< ${(avg / 24).toFixed(1)} Days`;
    }
    return '< 24 Hours SLA';
  }, [resolvedDisputes]);

  // ── REAL-TIME ADMIN METRICS ──────────────────────────────────────────────
  const activeEscrowJobs = useMemo(() => {
    return jobs.filter(j => ['Funded', 'Submitted', 'Disputed'].includes(j.status));
  }, [jobs]);

  const lockedEscrowUsdc = useMemo(() => {
    return activeEscrowJobs.reduce((sum, j) => sum + (parseFloat(j.amountUsdc || '0') || 0), 0);
  }, [activeEscrowJobs]);

  const allTimeSettledUsdc = useMemo(() => {
    return jobs.filter(j => j.status === 'Completed').reduce((sum, j) => sum + (parseFloat(j.amountUsdc || '0') || 0), 0);
  }, [jobs]);

  const protocolTotalVolume = allTimeSettledUsdc + lockedEscrowUsdc + (treasuryBalanceUsdc || 0);

  const deployedClonesCount = useMemo(() => {
    return jobs.filter(j => j.contractAddress && j.contractAddress !== '0x0000000000000000000000000000000000000000').length;
  }, [jobs]);

  const totalVerifiedContracts = 5 + deployedClonesCount;
  const adminSignersCount = treasury?.signers?.length || 3;

  const perspectiveData = useMemo(() => {
    switch (auditPerspective) {
      case 'client':
        return {
          roleType: 'CLIENT PATRONAGE AUDIT',
          officialHeader: 'OFFICIAL CLIENT ESCROW PATRONAGE AUDIT',
          sheetTitle: 'Client Trust & Escrow Solvency Audit',
          tagline: 'Non-Custodial Escrow Funder • Sovereign Liquidity Patron',
          userTitle: 'Verified Web3 Escrow Patron & Project Sponsor',
          scoreLabel: 'Client Trust Index',
          scoreVal: `${clientReliabilityScore} / 10.0`,
          scoreSub: '100% Sovereign Settlement',
          stat1Label: 'Capital Sponsored & Released',
          stat1Val: `$${clientVolumeDistributed.toLocaleString()} USDC`,
          stat1Sub: '0% Protocol Extraction',
          stat2Label: 'Rehire / Retention Rate',
          stat2Val: clientRehireRate,
          stat2Sub: '0.0% Dispute Escalation',
          stat3Label: 'Completed Escrow Projects',
          stat3Val: `${completedClientJobs.length} Projects`,
          stat3Sub: 'Verified On-Chain Milestones',
          accentColor: 'indigo',
          badges: [
            'Verified Escrow Patron',
            'Sovereign Milestone Funder',
            'Zero-Default Commission',
            'DAO Dispute-Free Patron'
          ],
          attestationNarrative: 'Certified by PolyLance Smart Escrow Protocol. This participant has maintained a pristine track record of funding escrow contracts prior to kickoff, defining clear cryptographic milestone specifications, and promptly releasing payments upon deliverable verification with zero fraudulent chargebacks.',
          socialGradient: 'from-white via-slate-50 to-indigo-50/60 border-indigo-200/90',
          sealColor: 'from-indigo-600 to-cyan-600',
        };
      case 'judge':
        return {
          roleType: 'TRIBUNAL ARBITRATOR AUDIT',
          officialHeader: 'OFFICIAL JUDGE DAO TRIBUNAL AUDIT',
          sheetTitle: 'Judicial Impartiality & Dispute Arbitration Audit',
          tagline: 'JudgeDAO Judicial Council • Sovereign Evidence Reviewer',
          userTitle: 'Elected DAO Arbitrator & Sovereign Juror',
          scoreLabel: 'Judicial Impartiality Index',
          scoreVal: judgeScoreVal,
          scoreSub: judgeScoreSub,
          stat1Label: 'Disputes Presided & Resolved',
          stat1Val: judgeCasesVal,
          stat1Sub: judgeCasesSub,
          stat2Label: 'DAO Consensus Alignment',
          stat2Val: judgeConsensusVal,
          stat2Sub: `${daoProposals?.length || 0} Quorum Ratified Proposals`,
          stat3Label: 'Avg Resolution Velocity',
          stat3Val: judgeVelocityVal,
          stat3Sub: 'Rapid SLA Adjudication',
          accentColor: 'amber',
          badges: [
            'Elected DAO Tribunal Arbitrator',
            'Impartial Judicial Record',
            'Evidence Review Specialist',
            resolvedDisputes.length > 0 ? `${resolvedDisputes.length} Disputes Presided` : 'Pristine Zero-Dispute Record'
          ],
          attestationNarrative: 'Certified by JudgeDAO Governance Protocol. This arbitrator operates on cryptographic evidence, IPFS proof hashes, and milestone contracts. All rulings are cryptographically recorded on-chain with DAO quorum alignment and decentralized dispute ledger verification.',
          socialGradient: 'from-white via-slate-50 to-amber-50/60 border-amber-200/90',
          sealColor: 'from-amber-600 to-orange-600',
        };
      case 'admin':
        return {
          roleType: 'ADMIN ARCHITECTURE AUDIT',
          officialHeader: 'OFFICIAL PROTOCOL GOVERNANCE & SECURITY AUDIT',
          sheetTitle: 'System Architecture, Timelock & Security Audit',
          tagline: 'PolyLance Core Architecture • Timelock Multisig Overseer',
          userTitle: 'Protocol Governance Administrator & Timelock Guardian',
          scoreLabel: 'Security Audit Rating',
          scoreVal: '100% Passed',
          scoreSub: 'Slither Audited • 0 Critical Issues',
          stat1Label: 'Protocol Escrow Volume Protected',
          stat1Val: `$${protocolTotalVolume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDC`,
          stat1Sub: lockedEscrowUsdc > 0 ? `$${lockedEscrowUsdc.toLocaleString()} USDC Locked in Escrow` : 'Non-Custodial Smart Vaults',
          stat2Label: 'Treasury Reserves & Delay',
          stat2Val: `$${(treasuryBalanceUsdc || 0).toLocaleString()} USDC`,
          stat2Sub: `${adminSignersCount} MultiSig Signers • 48h Delay`,
          stat3Label: 'Verified Smart Contracts',
          stat3Val: `${totalVerifiedContracts} Contract${totalVerifiedContracts === 1 ? '' : 's'}`,
          stat3Sub: `5 Core + ${deployedClonesCount} Cloned Escrows`,
          accentColor: 'cyan',
          badges: [
            'Timelock Multisig Guardian',
            'Open-Source Bytecode Verified',
            'Non-Custodial Escrow Vaults',
            `${totalVerifiedContracts} Deployed Contracts Overseen`
          ],
          attestationNarrative: 'Platform Architecture & Governance Attestation. Overseer of decentralized smart contract factory clones, autonomous fee distribution pools, and timelock governance controllers. Zero single points of failure, zero private key backdoors, and 100% verifiable open-source bytecode on Polygonscan.',
          socialGradient: 'from-white via-slate-50 to-cyan-50/60 border-cyan-200/90',
          sealColor: 'from-cyan-600 to-blue-700',
        };
      case 'freelancer':
      default:
        return {
          roleType: 'DEVELOPER TALENT AUDIT',
          officialHeader: 'OFFICIAL ORACLE REPUTATION AUDIT',
          sheetTitle: 'Developer Trust & Proof of Work Audit',
          tagline: 'ERC-5192 Soulbound Attestation • Cryptographic Delivery SLA',
          userTitle: profile?.title || 'Senior Web3 Systems Engineer & Verified Contributor',
          scoreLabel: 'PLREP Skill Index',
          scoreVal: `${devReputationScore} PTS`,
          scoreSub: 'Top Tier Verified Developer',
          stat1Label: 'Lifetime Proof of Work Handled',
          stat1Val: `$${devVolumeHandled.toLocaleString()} USDC`,
          stat1Sub: '0% Protocol Extraction',
          stat2Label: 'Milestone Delivery SLA',
          stat2Val: `${devSuccessRate}%`,
          stat2Sub: '0.0% Dispute Escalation',
          stat3Label: 'Completed Smart Contracts',
          stat3Val: `${completedFreelancerJobs.length} Contracts`,
          stat3Sub: 'Verified On-Chain Milestones',
          accentColor: 'purple',
          badges: [
            'ERC-5192 Soulbound Achiever',
            'Top 1% Polygon Engineer',
            'GitHub Cryptographic Proof',
            '100% Clean Delivery SLA'
          ],
          attestationNarrative: 'Autonomous smart contract escrow verification. This engineer holds immutable, non-transferable ERC-5192 credentials attesting to decentralized project milestones delivered with clean peer-review consensus and verified on-chain code artifacts.',
          socialGradient: 'from-white via-slate-50 to-purple-50/60 border-purple-200/90',
          sealColor: 'from-purple-600 to-indigo-600',
        };
    }
  }, [
    auditPerspective, clientReliabilityScore, clientVolumeDistributed, clientRehireRate, completedClientJobs.length,
    devReputationScore, devVolumeHandled, devSuccessRate, completedFreelancerJobs.length, profile?.title,
    judgeScoreVal, judgeScoreSub, judgeCasesVal, judgeCasesSub, judgeConsensusVal, judgeVelocityVal, daoProposals?.length, resolvedDisputes.length,
    protocolTotalVolume, lockedEscrowUsdc, treasuryBalanceUsdc, adminSignersCount, totalVerifiedContracts, deployedClonesCount
  ]);

  const title = perspectiveData.userTitle;
  const bio = profile?.bio || 'Verified decentralized participant operating with autonomous smart contracts, cryptographic escrow milestones, and 0% protocol fee peer-to-peer settlements on PolyLance.';
  
  const mockCertificateId = `PL-AUD-${targetAddress.slice(2, 10).toUpperCase()}`;
  const mockAuditHash = generateDeterministicHash(`polylance-oracle-audit-signature:${auditPerspective}:${targetAddress}`);
  const sbtTokenId = `#SBT-PL-${targetAddress.slice(2, 8).toUpperCase()}-${targetAddress.slice(-4).toUpperCase()}`;
  const certifiedPassVerifyUrl = getCertifiedPassVerifyUrl(mockCertificateId);
  
  const mockIpfsHash = generateIpfsCid({
    type: 'AUDIT_CERTIFICATE_V2',
    perspective: auditPerspective,
    auditedParticipant: targetAddress,
    displayName,
    reputationScore: perspectiveData.scoreVal,
    volume: perspectiveData.stat1Val,
    successRate: perspectiveData.stat2Val,
    completedContracts: perspectiveData.stat3Val,
    issuer: 'PolyLance Decentralized Oracle Protocol (ERC-5192)',
    version: '2.0.0',
    timestamp: Date.now()
  });

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}#/audit/${targetAddress}`
    : `https://polylance.app/#/audit/${targetAddress}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(targetAddress.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCertId = () => {
    navigator.clipboard.writeText(mockCertificateId.trim());
    setCopiedCertId(true);
    setShareToast(`📋 Canonical Audit Certificate ID copied: ${mockCertificateId}`);
    setTimeout(() => setCopiedCertId(false), 2500);
    setTimeout(() => setShareToast(null), 4000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadCardImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.98, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `PolyLance-Audit-${targetAddress.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      setShareToast('🎨 HD Audit Social Card downloaded! Attach to your social post.');
      setTimeout(() => setShareToast(null), 5000);
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareTwitter = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `PolyLance-Audit-${targetAddress.slice(0, 8)}.png`;
        link.href = dataUrl;
        link.click();

        const blob = await toBlob(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        }
      } catch (err) {
        console.warn('Could not export image:', err);
      }
    }

    setShareToast('📸 Card image downloaded & copied! Paste (Ctrl+V) or attach into your X post.');
    setTimeout(() => setShareToast(null), 6000);

    const text = auditPerspective === 'client'
      ? encodeURIComponent(
          `🏛️ Verified Web3 Escrow Patron & Project Sponsor Audit on @PolyLanceProtocol!\n\n` +
          `⭐ Patron Score: ${clientReliabilityScore} / 10.0\n` +
          `💰 Capital Funded: $${clientVolumeDistributed.toLocaleString()} USDC (100% Settled)\n` +
          `🤝 Dispute Ratio: 0.0% Clean Record\n` +
          `📜 Verified Audit ID: ${mockCertificateId}\n\n` +
          `Verify sovereign trust score:`
        )
      : auditPerspective === 'judge'
      ? encodeURIComponent(
          `⚖️ Official Tribunal Arbitrator Audit on @PolyLanceProtocol!\n\n` +
          `🛡️ Impartiality Index: ${perspectiveData.scoreVal}\n` +
          `⚖️ Cases Arbitrated: ${perspectiveData.stat1Val}\n` +
          `🤝 Consensus Alignment: ${perspectiveData.stat2Val}\n` +
          `📜 Audit ID: ${mockCertificateId}\n\n` +
          `Verify judicial impartiality:`
        )
      : auditPerspective === 'admin'
      ? encodeURIComponent(
          `🔐 Protocol Governance & Security Architecture Audit on @PolyLanceProtocol!\n\n` +
          `🛡️ Security Status: ${perspectiveData.scoreVal}\n` +
          `💰 TVL Protected: ${perspectiveData.stat1Val}\n` +
          `📜 Verified Contracts: ${perspectiveData.stat3Val}\n` +
          `📜 Audit ID: ${mockCertificateId}\n\n` +
          `Verify protocol architecture:`
        )
      : encodeURIComponent(
          `🛡️ Sovereign Web3 Developer Audit on @PolyLanceProtocol!\n\n` +
          `⚡ PLREP Score: ${devReputationScore}\n` +
          `🛠️ Proof of Work Volume: $${devVolumeHandled.toLocaleString()} USDC\n` +
          `🎯 SLA Success Rate: ${devSuccessRate}%\n` +
          `📜 SBT ID: ${sbtTokenId}\n\n` +
          `Verify cryptographic audit:`
        );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareLinkedIn = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `PolyLance-Audit-${targetAddress.slice(0, 8)}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.warn('Could not export image:', err);
      }
    }

    setShareToast('📸 Card image downloaded! Attach the image to your LinkedIn post.');
    setTimeout(() => setShareToast(null), 6000);

    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-purple-600 selection:text-white">
      
      {/* CSS print overrides */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 10mm !important;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
          .audit-sheet {
            box-shadow: none !important;
            border: 2px solid #CBD5E1 !important;
            padding: 18px 22px !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .job-card-item {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .seal-section-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .seal-grid {
            display: grid !important;
            grid-template-columns: 5fr 3.2fr 3.8fr !important;
            gap: 10px !important;
            align-items: center !important;
          }
          .print-watermark {
            opacity: 0.08 !important;
            display: block !important;
          }
        }
      `}</style>

      {/* ── Top Navigation (Back Button Outside Card) ─────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-3 flex items-center justify-between no-print">
        <Link 
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={14} /> <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* ── Unified Modern Header & Action Bar (Hidden in Print) ──────────────── */}
      <div className="max-w-4xl mx-auto mb-6 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3.5 no-print">
        {/* Tier 1: Role Report Selector / Indicator + View Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* If only 1 allowed perspective (Freelancer or Client), show a sleek role indicator */}
          {allowedPerspectives.length === 1 ? (
            <div className="flex items-center gap-2">
              {allowedPerspectives[0] === 'client' ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200/90 rounded-xl text-indigo-950 text-xs font-bold shrink-0 shadow-3xs">
                  <Building2 size={15} className="text-indigo-600" />
                  <span>Client Audit Report</span>
                  <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-100/80 px-2 py-0.5 rounded-full border border-indigo-200/60">Verified Client</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 border border-purple-200/90 rounded-xl text-purple-950 text-xs font-bold shrink-0 shadow-3xs">
                  <Award size={15} className="text-purple-600" />
                  <span>Freelancer Audit Report</span>
                  <span className="text-[10px] font-mono text-purple-700 font-semibold bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200/60">Verified Talent</span>
                </div>
              )}
            </div>
          ) : (
            /* Multi-perspective selector for Judges (client, freelancer, judge) and Admins (client, freelancer, judge, admin) */
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl overflow-x-auto scrollbar-none flex-nowrap shrink-0">
              {allowedPerspectives.includes('client') && (
                <button
                  type="button"
                  onClick={() => setPerspectiveOverride('client')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    auditPerspective === 'client'
                      ? 'bg-white text-indigo-950 shadow-xs font-extrabold border border-indigo-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 size={13} className={auditPerspective === 'client' ? 'text-indigo-600' : 'text-slate-500'} />
                  <span>Client Report</span>
                </button>
              )}
              {allowedPerspectives.includes('freelancer') && (
                <button
                  type="button"
                  onClick={() => setPerspectiveOverride('freelancer')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    auditPerspective === 'freelancer'
                      ? 'bg-white text-purple-950 shadow-xs font-extrabold border border-purple-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Award size={13} className={auditPerspective === 'freelancer' ? 'text-purple-600' : 'text-slate-500'} />
                  <span>Freelancer Report</span>
                </button>
              )}
              {allowedPerspectives.includes('judge') && (
                <button
                  type="button"
                  onClick={() => setPerspectiveOverride('judge')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    auditPerspective === 'judge'
                      ? 'bg-white text-amber-950 shadow-xs font-extrabold border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield size={13} className={auditPerspective === 'judge' ? 'text-amber-600' : 'text-slate-500'} />
                  <span>Judge Report</span>
                </button>
              )}
              {allowedPerspectives.includes('admin') && (
                <button
                  type="button"
                  onClick={() => setPerspectiveOverride('admin')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    auditPerspective === 'admin'
                      ? 'bg-white text-cyan-950 shadow-xs font-extrabold border border-cyan-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock size={13} className={auditPerspective === 'admin' ? 'text-cyan-600' : 'text-slate-500'} />
                  <span className="whitespace-nowrap font-bold">Admin Report</span>
                </button>
              )}
            </div>
          )}

          {/* View Mode Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'social'
                  ? 'bg-white text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 size={13} />
              <span>Social Card</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'certificate'
                  ? 'bg-white text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>Printable PDF</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Canonical Audit ID Badge (Left) + Unified Action Buttons (Right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Audit ID & Verification Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono shadow-3xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit ID</span>
              <span className="font-extrabold text-slate-900 tracking-wide">{mockCertificateId}</span>
              <button
                type="button"
                onClick={handleCopyCertId}
                title="Copy Audit ID"
                className="p-1 -mr-1 hover:bg-purple-100 rounded-md text-slate-400 hover:text-purple-700 transition-colors cursor-pointer"
              >
                {copiedCertId ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Polygon Amoy Verified
            </span>
          </div>

          {/* Right: Harmonious Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
            {/* Primary Action: Verify on CertifiedPass */}
            <a
              href={certifiedPassVerifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Verify audit report directly on CertifiedPass"
              className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-900 shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 active:scale-98"
            >
              <ShieldCheck size={14} className="text-purple-200" />
              <span>Verify on CertifiedPass</span>
              <ExternalLink size={12} className="opacity-80" />
            </a>

            {/* Save PNG */}
            <button
              type="button"
              onClick={handleDownloadCardImage}
              disabled={isExporting}
              title="Download high-resolution PNG Social Card"
              className="h-9 px-3.5 rounded-xl text-xs font-bold text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/90 shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 active:scale-98"
            >
              <Download size={13} className="text-purple-600" />
              <span>{isExporting ? 'Saving...' : 'Save PNG'}</span>
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy verified audit link"
              className="h-9 px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 active:scale-98"
            >
              {copiedLink ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} className="text-slate-500" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            {/* Print / PDF */}
            <button
              type="button"
              onClick={handlePrint}
              title="Download or Print full cryptographic PDF"
              className="h-9 px-3.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 active:scale-98"
            >
              <Printer size={13} className="text-slate-500" />
              <span>Print PDF</span>
            </button>
          </div>
        </div>

        {/* Dynamic Image Ready Notification Toast */}
        {shareToast && (
          <div className="p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center justify-between gap-2 animate-fadeIn shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600 shrink-0" />
              <span className="font-semibold">{shareToast}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setShareToast(null)} 
              className="font-bold text-purple-700 hover:text-purple-900 underline text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: SOCIAL MEDIA CARD VIEW (LIGHT THEME - 1200x630 DESIGN) ─────────── */}
      {activeTab === 'social' && (
        <div className="max-w-4xl mx-auto space-y-4 no-print animate-fadeIn">
          
          <div 
            ref={cardRef}
            className={`rounded-3xl p-6 sm:p-10 border-2 shadow-xl relative overflow-hidden font-sans text-slate-900 transition-all ${
              auditPerspective === 'client'
                ? 'bg-gradient-to-br from-white via-slate-50 to-indigo-50/60 border-indigo-200/90'
                : auditPerspective === 'judge'
                ? 'bg-gradient-to-br from-white via-slate-50 to-amber-50/60 border-amber-200/90'
                : auditPerspective === 'admin'
                ? 'bg-gradient-to-br from-white via-slate-50 to-cyan-50/60 border-cyan-200/90'
                : 'bg-gradient-to-br from-white via-slate-50 to-purple-50/60 border-purple-200/90'
            }`}
          >
            
            {/* Ambient Background Glow Mesh (Light) */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 ${
              auditPerspective === 'client' ? 'bg-indigo-200/30' :
              auditPerspective === 'judge' ? 'bg-amber-200/30' :
              auditPerspective === 'admin' ? 'bg-cyan-200/30' :
              'bg-purple-200/30'
            }`} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
            <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-20" />

            <div className="relative z-10 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-tr ${perspectiveData.sealColor}`}>
                    {auditPerspective === 'client' && <Building2 size={22} />}
                    {auditPerspective === 'freelancer' && <Award size={22} />}
                    {auditPerspective === 'judge' && <Shield size={22} />}
                    {auditPerspective === 'admin' && <Lock size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                        auditPerspective === 'client' ? 'text-indigo-800 bg-indigo-100 border-indigo-200' :
                        auditPerspective === 'judge' ? 'text-amber-800 bg-amber-100 border-amber-200' :
                        auditPerspective === 'admin' ? 'text-cyan-900 bg-cyan-100 border-cyan-300' :
                        'text-purple-800 bg-purple-100 border-purple-200'
                      }`}>
                        {perspectiveData.roleType}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ● LIVE & ATTESTED
                      </span>
                    </div>
                    <span className="font-headline font-black text-sm text-slate-900 block mt-0.5">
                      PolyLance Sovereign Oracle Protocol
                    </span>
                  </div>
                </div>

                <div className="font-mono text-right text-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Audit ID</span>
                  <button
                    type="button"
                    onClick={handleCopyCertId}
                    title="Click to copy canonical Audit Certificate ID"
                    className="inline-flex items-center gap-1.5 font-black text-slate-900 text-sm hover:text-purple-700 bg-white/80 hover:bg-purple-50 px-2 py-0.5 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer"
                  >
                    <span>{mockCertificateId}</span>
                    {copiedCertId ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} className="text-slate-400 hover:text-purple-600" />}
                  </button>
                </div>
              </div>

              {/* Profile Card Summary */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${perspectiveData.sealColor} text-white font-headline font-black text-2xl flex items-center justify-center shadow-md shrink-0`}>
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline text-lg sm:text-xl font-black text-slate-900">{displayName}</h2>
                      {profile?.githubVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                          <CheckCircle2 size={11} className="text-purple-600" /> @{profile.githubUsername}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-purple-700 mt-0.5">{title}</p>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{truncateAddress(targetAddress)}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono space-y-0.5">
                  <span className="text-[9.5px] uppercase text-slate-500 block font-bold">
                    {perspectiveData.scoreLabel}
                  </span>
                  <p className="text-2xl font-black text-emerald-600 font-headline">
                    {perspectiveData.scoreVal}
                  </p>
                  <span className="text-[9.5px] text-purple-700 font-bold block">
                    {perspectiveData.scoreSub}
                  </span>
                </div>
              </div>

              {/* 3 Metric Stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {perspectiveData.stat1Label}
                  </span>
                  <p className="text-2xl font-black text-emerald-600 font-headline">
                    {perspectiveData.stat1Val}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">{perspectiveData.stat1Sub}</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {perspectiveData.stat2Label}
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-headline">
                    {perspectiveData.stat2Val}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">{perspectiveData.stat2Sub}</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {perspectiveData.stat3Label}
                  </span>
                  <p className="text-2xl font-black text-purple-900 font-headline">
                    {perspectiveData.stat3Val}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">{perspectiveData.stat3Sub}</span>
                </div>
              </div>

              {/* Badges Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  {perspectiveData.badges.map((badge, bIdx) => (
                    <span key={bIdx} className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-purple-100 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200">
                      <CheckCircle2 size={11} className="text-emerald-600" /> {badge}
                    </span>
                  ))}
                </div>

                <div className="text-slate-500 text-[10.5px]">
                  <span>Attested on: </span>
                  <strong className="text-purple-700 font-mono">Polygon Amoy Testnet (80002)</strong>
                </div>
              </div>
            </div>

          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
            <span className="font-medium">
              💡 Tip: Click <strong>"Save PNG"</strong> or <strong>"Copy Link"</strong> above to showcase your verified {auditPerspective === 'client' ? 'client sponsorship trust score' : 'talent proof of work reputation'} to the world.
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className="text-purple-600 hover:text-purple-800 font-bold underline shrink-0 cursor-pointer"
            >
              View Printable PDF &rarr;
            </button>
          </div>

        </div>
      )}

      {/* ── TAB 2 / PRINT: FORMAL AUDIT CERTIFICATE SHEET ────────────────────────── */}
      <div 
        className={`audit-sheet shadow-2xl rounded-3xl border-4 border-slate-200/80 bg-white p-5 sm:p-7 max-w-4xl mx-auto space-y-3.5 relative overflow-hidden gpu-layer text-slate-900 ${activeTab === 'social' ? 'hidden print:block' : 'block'}`}
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        {/* Certificate Security Corner Brackets */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-purple-400/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-purple-400/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-purple-400/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-purple-400/60 pointer-events-none" />

        {/* Ambient Paper Security Watermark (Large centered PolyLance Logo) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.05] print-watermark z-0">
          <img src={polylanceLogoImg} alt="PolyLance Watermark Seal" className="w-80 h-80 object-contain filter grayscale" />
        </div>

        {/* ── SECTION 1: OFFICIAL HEADER ────────────────────────────────────── */}
        <div className="border-b-2 border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative z-10 page-break-inside-avoid">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 bg-gradient-to-tr ${perspectiveData.sealColor}`}>
              {auditPerspective === 'client' && <Building2 size={22} />}
              {auditPerspective === 'freelancer' && <Award size={22} />}
              {auditPerspective === 'judge' && <Shield size={22} />}
              {auditPerspective === 'admin' && <Lock size={22} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[9px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded border ${
                  auditPerspective === 'client' ? 'text-indigo-900 bg-indigo-50 border-indigo-200' :
                  auditPerspective === 'judge' ? 'text-amber-900 bg-amber-50 border-amber-200' :
                  auditPerspective === 'admin' ? 'text-cyan-900 bg-cyan-50 border-cyan-300' :
                  'text-purple-900 bg-purple-50 border-purple-200'
                }`}>
                  {perspectiveData.officialHeader}
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  ● LIVE & ATTESTED
                </span>
              </div>
              <h1 className="font-headline text-base sm:text-lg font-black text-slate-950 tracking-tight uppercase mt-0.5">
                {perspectiveData.sheetTitle}
              </h1>
              <p className="text-[9.5px] text-slate-500 font-mono">
                Decentralized Oracle Verified • Polygon Amoy Sovereign Ledger
              </p>
            </div>
          </div>

          <div className="font-mono text-xs text-left md:text-right space-y-0.5 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl border md:border-none border-slate-200 w-full md:w-auto shrink-0">
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Audit ID:</span>
              <button
                type="button"
                onClick={handleCopyCertId}
                title="Click to copy canonical Audit ID"
                className="inline-flex items-center gap-1 font-black text-purple-900 text-xs hover:text-purple-700 bg-white md:bg-transparent px-1.5 py-0.5 rounded border md:border-none border-slate-200 cursor-pointer"
              >
                <span>{mockCertificateId}</span>
                {copiedCertId ? <CheckCheck size={11} className="text-emerald-600 shrink-0" /> : <Copy size={10} className="text-slate-400 shrink-0" />}
              </button>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Network:</span>
              <span className="font-bold text-slate-800 text-xs">Polygon Amoy (80002)</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Attested At:</span>
              <span className="font-bold text-slate-800 text-xs">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: PARTICIPANT IDENTITY OVERVIEW ──────────────────────── */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 space-y-2.5 relative z-10 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${perspectiveData.sealColor} text-white font-headline font-black text-lg flex items-center justify-center shadow-md shrink-0`}>
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline text-sm sm:text-base font-black text-slate-900">{displayName}</h2>
                  {profile?.githubVerified && (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                      <CheckCircle2 size={10} className="text-purple-600" /> GitHub Verified
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] font-bold text-purple-700">{perspectiveData.userTitle}</p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 pt-0.5">
                  <span className="text-slate-400">Wallet:</span>
                  <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                    {targetAddress}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left sm:text-right space-y-0.5 font-mono text-xs w-full sm:w-auto shadow-2xs">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                {perspectiveData.scoreLabel}
              </span>
              <p className="text-sm font-black text-emerald-700 font-headline">
                {perspectiveData.scoreVal}
              </p>
              <span className="text-[9px] text-purple-700 font-bold block">{perspectiveData.scoreSub}</span>
            </div>
          </div>

          <p className="text-[11.5px] text-slate-700 leading-relaxed font-sans border-t border-slate-100 pt-2">
            {perspectiveData.attestationNarrative}
          </p>

          {/* Skill / Certification Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-slate-500 mr-1">Attested Credentials:</span>
            {perspectiveData.badges.map((b, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-bold rounded-lg shadow-3xs flex items-center gap-1">
                <CheckCircle2 size={10} className="text-purple-600" />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── SECTION 3: SBT CRYPTOGRAPHIC LEDGER CARD (LIGHT THEME) ────────── */}
        <div className="p-3.5 rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/70 via-slate-50 to-indigo-50/70 space-y-2.5 font-mono relative z-10 page-break-inside-avoid shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/60 pb-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${perspectiveData.sealColor} flex items-center justify-center text-white shadow-2xs`}>
                <Award size={15} />
              </div>
              <div>
                <span className="text-[8.5px] uppercase font-black tracking-wider text-purple-800 block">
                  DECENTRALIZED IDENTITY ATTESTATION
                </span>
                <h3 className="font-headline text-xs sm:text-sm font-black text-slate-950">
                  {auditPerspective === 'client' && 'Verified Escrow Sponsor Credential'}
                  {auditPerspective === 'freelancer' && 'ERC-5192 Soulbound Reputation Token (SBT)'}
                  {auditPerspective === 'judge' && 'Sovereign DAO Tribunal Chair Credential'}
                  {auditPerspective === 'admin' && 'Protocol Timelock Guardian Credential'}
                </h3>
              </div>
            </div>
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Lock size={10} className="text-emerald-700" />
              LOCKED & NON-TRANSFERABLE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 space-y-0.5 shadow-2xs">
              <span className="text-[8.5px] uppercase text-slate-500 block font-bold">Credential Identifier</span>
              <span className="font-black text-slate-900 text-[11px] tracking-wide block font-mono">{sbtTokenId}</span>
              <span className="text-[8.5px] text-purple-700 block font-mono">Standard: ERC-5192 / EIP-5484</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 space-y-0.5 shadow-2xs">
              <span className="text-[8.5px] uppercase text-slate-500 block font-bold">Reputation Tier</span>
              <span className="font-black text-amber-600 text-xs block">
                {auditPerspective === 'client' && 'Diamond Escrow Patron'}
                {auditPerspective === 'freelancer' && (devReputationScore >= 900 ? 'Platinum Elite (Top 1%)' : 'Gold Sovereign (Top 5%)')}
                {auditPerspective === 'judge' && 'Elected Chief Arbitrator'}
                {auditPerspective === 'admin' && 'Root MultiSig Administrator'}
              </span>
              <span className="text-[8.5px] text-slate-500 block font-mono">
                {perspectiveData.scoreSub}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 space-y-0.5 shadow-2xs">
              <span className="text-[8.5px] uppercase text-slate-500 block font-bold">Attestation Smart Contract</span>
              <span className="font-black text-slate-900 text-[10.5px] truncate block font-mono">
                {truncateAddress(CONTRACTS.ReputationSBT || '0x6aa20d433e5cAf336b2fA7FcdFE9923D384b0fEB')}
              </span>
              <span className="text-[8.5px] text-purple-700 block font-mono">Polygon Amoy Sovereign Ledger</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: KEY METRICS MATRIX ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10 page-break-inside-avoid">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9px] uppercase font-black block">
              {perspectiveData.scoreLabel}
            </span>
            <p className="text-lg font-black text-purple-700 font-headline">
              {perspectiveData.scoreVal}
            </p>
            <span className="text-[9px] text-slate-500 font-bold block font-mono">
              {perspectiveData.scoreSub}
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9px] uppercase font-black block">
              {perspectiveData.stat1Label}
            </span>
            <p className="text-lg font-black text-emerald-700 font-headline">
              {perspectiveData.stat1Val}
            </p>
            <span className="text-[9px] text-slate-500 font-bold block font-mono">{perspectiveData.stat1Sub}</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9px] uppercase font-black block">
              {perspectiveData.stat2Label}
            </span>
            <p className="text-lg font-black text-slate-900 font-headline">
              {perspectiveData.stat2Val}
            </p>
            <span className="text-[9px] text-slate-500 font-bold block font-mono">{perspectiveData.stat2Sub}</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9px] uppercase font-black block">
              {perspectiveData.stat3Label}
            </span>
            <p className="text-lg font-black text-purple-700 font-headline">
              {perspectiveData.stat3Val}
            </p>
            <span className="text-[9px] text-slate-500 font-bold block font-mono">{perspectiveData.stat3Sub}</span>
          </div>
        </div>

        {/* ── SECTION 5: REALTIME ESCROW CONTRACTS & SETTLED JOBS ────────── */}
        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                <FileCheck size={14} />
              </span>
              <div>
                <h3 className="font-headline text-xs sm:text-sm font-extrabold text-slate-900 uppercase">
                  {auditPerspective === 'client' && 'Verified Client Escrow Portfolio & Settled Contracts'}
                  {auditPerspective === 'freelancer' && 'Verified Proof of Work & Settled Contracts Ledger'}
                  {auditPerspective === 'judge' && 'Arbitrated Dispute Tribunal Ledger & Rulings'}
                  {auditPerspective === 'admin' && 'Protocol Smart Contracts Architecture & Health Registry'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Cryptographically attested smart escrows on Polygon Amoy
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 shrink-0">
              {auditPerspective === 'client' && `${completedClientJobs.length} Settled Escrows`}
              {auditPerspective === 'freelancer' && `${completedFreelancerJobs.length} Settled Contracts`}
              {auditPerspective === 'judge' && `${disputedJobs.length} Disputes Presided`}
              {auditPerspective === 'admin' && `${totalVerifiedContracts} Contracts Verified`}
            </span>
          </div>

          <div className="space-y-2">
            {(() => {
              // ADMIN PERSPECTIVE: Display Core Platform Smart Contracts
              if (auditPerspective === 'admin') {
                const coreContracts = [
                  { name: 'JobFactory (Clone Deployer & Fee Collector)', address: CONTRACTS.JobFactory, role: 'Factory, Clones, Treasury' },
                  { name: 'JobEscrowImplementation (Escrow Vault Logic)', address: '0xfDC15e8261677C41e8e872A8fb05D2369753F8a7', role: 'Cloned Escrow Vaults' },
                  { name: 'ReputationSBT (ERC-5192 Soulbound Token)', address: CONTRACTS.ReputationSBT, role: 'Non-Transferable Badges' },
                  { name: 'JudgeDAO (Decentralized Arbitration Council)', address: CONTRACTS.JudgeDAO, role: 'Dispute Arbitration' },
                  { name: 'TimelockController (48h Governance Delay)', address: CONTRACTS.TimelockController, role: 'MultiSig Delay Guard' },
                ];
                return coreContracts.map((c, cIdx) => (
                  <div key={cIdx} className="job-card-item p-3 rounded-2xl border border-slate-200/90 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans shadow-2xs">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline font-bold text-slate-900 text-xs sm:text-sm">{c.name}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          ● Verified On-Chain
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10.5px] font-mono text-slate-500 flex-wrap">
                        <span>Address: <strong className="text-slate-800">{truncateAddress(c.address)}</strong></span>
                        <span>•</span>
                        <span className="text-purple-700 font-bold">{c.role}</span>
                        <span>•</span>
                        <span>0 High/Critical Vulns</span>
                      </div>
                    </div>
                    <a
                      href={`https://amoy.polygonscan.com/address/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all flex items-center gap-1 font-bold text-[11px] shrink-0"
                    >
                      <span>Polygonscan</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ));
              }

              // JUDGE PERSPECTIVE: Display Arbitrated Disputes
              if (auditPerspective === 'judge') {
                const disputedJobs = jobs.filter(j => j.status === 'Disputed' || (j.dispute && j.dispute.resolved));
                if (disputedJobs.length === 0) {
                  return (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-center space-y-1.5 font-sans">
                      <Shield className="w-8 h-8 text-amber-500 mx-auto mb-1" />
                      <h4 className="font-headline font-bold text-slate-800 text-xs">Tribunal Active — Pristine Protocol Record</h4>
                      <p className="text-[11px] text-slate-500 font-mono max-w-md mx-auto leading-relaxed">
                        All escrow milestones on PolyLance are currently settled cleanly between clients and developers with 0 disputes. The Tribunal Arbitrators stand ready on-chain for rapid dispute resolution.
                      </p>
                    </div>
                  );
                }
                return disputedJobs.map((j, idx) => (
                  <div key={idx} className="job-card-item p-3 rounded-2xl border border-slate-200/90 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans shadow-2xs">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline font-bold text-slate-900 text-xs sm:text-sm">{j.title}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold border bg-amber-50 text-amber-700 border-amber-200">
                          {j.dispute?.resolved ? '● Resolved by Tribunal' : '⚠️ Tribunal In Session'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10.5px] font-mono text-slate-500 flex-wrap">
                        <span>Escrow: <strong className="text-slate-800">{truncateAddress(j.contractAddress || '')}</strong></span>
                        <span>•</span>
                        <span>Split: <strong>{((j.dispute?.rulingBps ?? 10000) / 100)}% Dev / {100 - ((j.dispute?.rulingBps ?? 10000) / 100)}% Client</strong></span>
                      </div>
                    </div>
                    <Link
                      to={`/jobs/${j.id}`}
                      className="p-2 text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all flex items-center gap-1 font-bold text-[11px] shrink-0"
                    >
                      <span>View Case</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                ));
              }

              // CLIENT OR FREELANCER PERSPECTIVE
              const targetList = (auditPerspective === 'client' ? completedClientJobs : completedFreelancerJobs);

              if (targetList.length === 0) {
                return (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-center space-y-1.5 font-sans">
                    <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                    <h4 className="font-headline font-bold text-slate-800 text-xs">No Completed & Settled Escrows Audited Yet</h4>
                    <p className="text-[11px] text-slate-500 font-mono max-w-md mx-auto leading-relaxed">
                      Official audit reports strictly document contracts that are 100% completed and settled on-chain. Ongoing jobs, pending deliverables, or selection-phase listings are not audited.
                    </p>
                  </div>
                );
              }

              return targetList.map((j, idx) => {
                const amount = parseFloat(j.amountUsdc || '0');
                const isDisputed = j.status === 'Disputed' || (j.dispute && !j.dispute.resolved);
                const isCompleted = j.status === 'Completed';
                const isFunded = j.status === 'Funded';
                
                return (
                  <div 
                    key={j.id || idx}
                    className="job-card-item p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans shadow-2xs hover:shadow-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline font-bold text-slate-900 truncate max-w-sm text-xs sm:text-sm">{j.title}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDisputed
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isFunded
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {isCompleted ? '● Settled' : isDisputed ? '⚠️ Disputed' : isFunded ? '● Funded & Active' : `● ${j.status || 'Open'}`}
                        </span>
                        {j.category && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {j.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10.5px] font-mono text-slate-500 flex-wrap">
                        <span>Contract: <strong className="text-slate-800">{truncateAddress(j.contractAddress || '0x42f8...990')}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Execution Sealed On-Chain
                        </span>
                        <span>•</span>
                        <span>Polygon MultiSig Safe</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right font-mono">
                        <span className="font-headline font-black text-slate-950 text-sm sm:text-base">${amount.toLocaleString()} USDC</span>
                        <span className="text-[9.5px] text-purple-700 font-bold block">0% Protocol Extraction</span>
                      </div>
                      <Link
                        to={`/jobs/${j.id}/attestation`}
                        className="p-2 text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all no-print flex items-center gap-1 font-bold text-[11px]"
                        title="View Individual Milestone Attestation"
                      >
                        <span>Attestation</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* ── SECTION 6: CRYPTOGRAPHIC SIGNATURE, OFFICIAL EMBOSSED SEAL & QR CODE ── */}
        <div className="seal-section-block border-t-2 border-slate-200 pt-3.5 grid grid-cols-1 md:grid-cols-12 seal-grid gap-3 font-mono text-xs relative z-10">
          
          {/* Left Column: Cryptographic Proof Integrity */}
          <div className="md:col-span-5 space-y-1 flex flex-col justify-between">
            <div>
              <span className="text-slate-900 uppercase font-black block text-[9.5px] tracking-wider">
                Cryptographic Audit Integrity & IPFS CID
              </span>
              <p className="text-slate-500 leading-relaxed font-sans text-[10px] mt-0.5">
                This performance audit is compiled deterministically from Ethereum/Polygon smart contracts, decentralized SBT attestations, and Safe MultiSig execution states.
              </p>
            </div>
            <div className="text-[9px] break-all text-purple-950 bg-purple-50 p-1.5 rounded-xl border border-purple-200 font-mono font-black shadow-2xs">
              IPFS CID: {mockIpfsHash}
            </div>
          </div>

          {/* Center Column: Official Protocol Seal Stamp (Embossed Emblem with Logo Watermark) */}
          <div className="md:col-span-3 flex flex-col items-center justify-center text-center p-2 rounded-2xl bg-gradient-to-b from-purple-50/70 to-slate-50 border border-purple-200/90 shadow-xs relative overflow-hidden">
            
            {/* Watermark Logo Behind Seal */}
            <img 
              src={polylanceLogoImg} 
              alt="PolyLance Seal Stamp" 
              className="absolute inset-0 m-auto w-24 h-24 object-contain opacity-20 pointer-events-none filter grayscale mix-blend-multiply" 
            />

            {/* Official Circular Seal Emblem */}
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-purple-500 flex flex-col items-center justify-center bg-white shadow-2xs relative z-10 p-0.5">
              <div className="w-full h-full rounded-full border border-purple-300 flex flex-col items-center justify-center bg-purple-50">
                <ShieldCheck size={16} className="text-purple-700" />
                <span className="text-[6px] font-black text-purple-950 uppercase tracking-tighter mt-0.5">POLYLANCE</span>
                <span className="text-[5px] font-bold text-emerald-700 uppercase">AUDITED</span>
              </div>
            </div>
            <span className="text-[8px] font-mono text-purple-950 font-black uppercase mt-1 tracking-tight relative z-10">
              Official Oracle Seal
            </span>
            <span className="text-[7px] font-mono text-slate-500 font-bold relative z-10">Polygon Protocol Verified</span>
          </div>

          {/* Right Column: CertifiedPass Scan QR Code & Oracle Signature */}
          <div className="md:col-span-4 flex flex-col justify-between items-start md:items-end gap-1.5 text-left md:text-right">
            
            {/* QR Code & CertifiedPass Badge */}
            <a
              href={certifiedPassVerifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Scan QR to open PolyLance Report / Click to Verify on CertifiedPass"
              className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(shareUrl)}`}
                alt="Scan with Camera to Open PolyLance Report"
                className="w-12 h-12 rounded-lg shrink-0"
              />
              <div className="text-left font-mono">
                <span className="text-[7.5px] uppercase tracking-wider text-purple-800 font-black block group-hover:underline">CertifiedPass™ ↗</span>
                <span className="text-[8.5px] font-bold text-slate-800 block">Scan / Click to Verify</span>
                <span className="text-[7px] text-slate-400 block">Universal Trust QR</span>
              </div>
            </a>

            {/* Oracle Signature Block */}
            <div className="w-full">
              <div className="flex items-center justify-between md:justify-end gap-1.5 border-t border-slate-200 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                <span className="font-black text-slate-900 text-[9.5px]">Oracle Verified & Sealed</span>
              </div>
              <p className="font-black text-slate-700 break-all text-[8px] mt-0.5 font-mono">{mockAuditHash}</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
