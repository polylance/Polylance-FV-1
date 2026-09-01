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
  Share2, Twitter, Linkedin, CheckCheck, HeartHandshake, Download
} from 'lucide-react';
import { truncateAddress, generateDeterministicHash } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';

export const AuditReport: React.FC = () => {
  const { address: targetAddressParam } = useParams<{ address: string }>();
  const { jobs, profiles } = usePolyLanceData();
  const { address: activeAddress, currentRole } = useWeb3();
  const [activeTab, setActiveTab] = useState<'social' | 'certificate'>('social');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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

  const isClient = (clientJobs.length > 0 && freelancerJobs.length === 0) || currentRole === 'client';
  const auditPerspective: 'developer' | 'client' = isClient ? 'client' : 'developer';

  // Compute developer statistics
  const devReputationScore = profile?.primaryScore || Math.max(750, (completedFreelancerJobs.length * 120) + 700);
  const devVolumeHandled = completedFreelancerJobs.reduce((sum, j) => {
    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
    return sum + (parseFloat(j.amountUsdc || '0') * earnedFraction);
  }, 0);
  
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

  const clientRehireRate = completedClientJobs.length > 0 ? '94%' : '100%';
  const displayName = profile?.displayName || `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`;
  const title = profile?.title || (auditPerspective === 'developer' ? 'Senior Web3 Systems Engineer' : 'Verified Web3 Escrow Patron & Project Sponsor');
  const bio = profile?.bio || 'Verified decentralized participant operating with autonomous smart contracts, cryptographic escrow milestones, and 0% protocol fee peer-to-peer settlements on PolyLance.';
  
  const mockCertificateId = `PL-AUD-${targetAddress.slice(2, 10).toUpperCase()}`;
  const mockAuditHash = generateDeterministicHash(`polylance-oracle-audit-signature:${auditPerspective}:${targetAddress}`);
  const sbtTokenId = `#SBT-PL-${targetAddress.slice(2, 8).toUpperCase()}-${targetAddress.slice(-4).toUpperCase()}`;
  
  const mockIpfsHash = generateIpfsCid({
    type: 'AUDIT_CERTIFICATE_V2',
    perspective: auditPerspective,
    auditedParticipant: targetAddress,
    displayName,
    reputationScore: auditPerspective === 'developer' ? devReputationScore : clientReliabilityScore,
    volume: auditPerspective === 'developer' ? devVolumeHandled : clientVolumeDistributed,
    successRate: auditPerspective === 'developer' ? devSuccessRate : clientReliabilityScore,
    completedContracts: auditPerspective === 'developer' ? completedFreelancerJobs.length : completedClientJobs.length,
    issuer: 'PolyLance Decentralized Oracle Protocol (ERC-5192)',
    version: '2.0.0',
    timestamp: Date.now()
  });

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://polylance.app/#/audit/${targetAddress}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* ── Unified Glassmorphism Toolbar Card (Hidden in Print) ──────────────── */}
      <div className="max-w-4xl mx-auto mb-6 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Left Group: Scope Badge & View Mode Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Audit Type Badge Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold font-mono">
              {auditPerspective === 'client' ? (
                <>
                  <Building2 size={13} className="text-indigo-600" />
                  <span className="text-indigo-900">Client Sponsor Audit</span>
                </>
              ) : (
                <>
                  <Award size={13} className="text-purple-600" />
                  <span className="text-purple-900">Developer Talent Audit</span>
                </>
              )}
            </div>

            {/* View Mode Segmented Control */}
            <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'social'
                    ? 'bg-white text-slate-950 shadow-2xs font-extrabold'
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
                    ? 'bg-white text-slate-950 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={13} />
                <span>Printable PDF</span>
              </button>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start md:justify-end">
            <button
              type="button"
              onClick={handleShareTwitter}
              title="Share to X (Downloads card image & copies to clipboard)"
              className="bg-[#0f1419] hover:bg-black text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 cursor-pointer active:scale-95 shrink-0"
            >
              <Twitter size={12} className="fill-current text-white" />
              <span>Share on X</span>
            </button>

            <button
              type="button"
              onClick={handleShareLinkedIn}
              title="Share to LinkedIn (Downloads card image & opens post)"
              className="bg-[#0077b5] hover:bg-[#006097] text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 cursor-pointer active:scale-95 shrink-0"
            >
              <Linkedin size={12} className="fill-current text-white" />
              <span>LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCardImage}
              disabled={isExporting}
              title="Download high-resolution PNG Social Card"
              className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 cursor-pointer active:scale-95 shrink-0"
            >
              <Download size={12} />
              <span>{isExporting ? 'Exporting...' : 'Save PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy verified audit link"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              {copiedLink ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedLink ? 'Copied!' : 'Link'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Download or Print full cryptographic PDF"
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all hover:scale-102 active:scale-95 shrink-0"
            >
              <Printer size={12} />
              <span>PDF</span>
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
                : 'bg-gradient-to-br from-white via-slate-50 to-purple-50/60 border-purple-200/90'
            }`}
          >
            
            {/* Ambient Background Glow Mesh (Light) */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 ${
              auditPerspective === 'client' ? 'bg-indigo-200/30' : 'bg-purple-200/30'
            }`} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
            <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-20" />

            <div className="relative z-10 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    auditPerspective === 'client'
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-600 shadow-indigo-500/20'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20'
                  }`}>
                    {auditPerspective === 'client' ? <Building2 size={22} /> : <ShieldCheck size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                        auditPerspective === 'client'
                          ? 'text-indigo-800 bg-indigo-100 border-indigo-200'
                          : 'text-purple-800 bg-purple-100 border-purple-200'
                      }`}>
                        {auditPerspective === 'client' ? 'VERIFIED WEB3 ESCROW PATRON AUDIT' : 'ERC-5192 SOULBOUND REPUTATION AUDIT'}
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
                  <span className="font-black text-slate-900 text-sm">{mockCertificateId}</span>
                </div>
              </div>

              {/* Profile Card Summary */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-headline font-black text-2xl flex items-center justify-center shadow-md shrink-0">
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
                    {auditPerspective === 'client' ? 'Client Trust Index' : 'PLREP Skill Index'}
                  </span>
                  <p className="text-2xl font-black text-emerald-600 font-headline">
                    {auditPerspective === 'client' ? `${clientReliabilityScore} / 10.0` : `${devReputationScore} PTS`}
                  </p>
                  <span className="text-[9.5px] text-purple-700 font-bold block">
                    {auditPerspective === 'client' ? '100% Sovereign Settlement' : 'Top Tier Verified Developer'}
                  </span>
                </div>
              </div>

              {/* 3 Metric Stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {auditPerspective === 'client' ? 'Capital Sponsored & Released' : 'Lifetime Proof of Work Handled'}
                  </span>
                  <p className="text-2xl font-black text-emerald-600 font-headline">
                    ${(auditPerspective === 'client' ? clientVolumeDistributed : devVolumeHandled).toLocaleString()} USDC
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">0% Protocol Extraction</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {auditPerspective === 'client' ? 'Rehire / Retention Rate' : 'Milestone Delivery SLA'}
                  </span>
                  <p className="text-2xl font-black text-slate-900 font-headline">
                    {auditPerspective === 'client' ? clientRehireRate : `${devSuccessRate}%`}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">0.0% Dispute Escalation</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {auditPerspective === 'client' ? 'Completed Escrow Projects' : 'Completed Smart Contracts'}
                  </span>
                  <p className="text-2xl font-black text-purple-900 font-headline">
                    {(auditPerspective === 'client' ? completedClientJobs.length : completedFreelancerJobs.length) || (auditPerspective === 'client' ? clientJobs.length : freelancerJobs.length) || 1}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">Verified On-Chain Milestones</span>
                </div>
              </div>

              {/* Badges Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-purple-100 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200">
                    <CheckCircle2 size={11} className="text-emerald-600" /> Polygon PoS (137)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                    <ShieldCheck size={11} className="text-indigo-600" /> Non-Custodial MultiSig Identity
                  </span>
                </div>

                <div className="text-slate-500 text-[10.5px]">
                  <span>Attested via: </span>
                  <strong className="text-purple-700 font-mono">{truncateAddress('0x42f8366420a092c55660830e8115e9a443900990')}</strong>
                </div>
              </div>

            </div>

          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
            <span className="font-medium">
              💡 Tip: Click <strong>"Share on X"</strong> or <strong>"LinkedIn"</strong> above to showcase your verified {auditPerspective === 'client' ? 'client sponsorship trust score' : 'talent proof of work reputation'} to the world.
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
          <img src="/polylanceLogo.png" alt="PolyLance Watermark Seal" className="w-80 h-80 object-contain filter grayscale" />
        </div>

        {/* ── SECTION 1: OFFICIAL HEADER ────────────────────────────────────── */}
        <div className="border-b-2 border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative z-10 page-break-inside-avoid">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
              auditPerspective === 'client'
                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-600 shadow-indigo-500/20'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-700 shadow-purple-500/20'
            }`}>
              {auditPerspective === 'client' ? <Building2 size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-mono font-black tracking-widest text-purple-900 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {auditPerspective === 'client' ? 'OFFICIAL CLIENT SPONSORSHIP AUDIT' : 'OFFICIAL ORACLE REPUTATION AUDIT'}
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  ● LIVE & ATTESTED
                </span>
              </div>
              <h1 className="font-headline text-base sm:text-lg font-black text-slate-950 tracking-tight uppercase mt-0.5">
                {auditPerspective === 'client' ? 'Client Trust & Escrow Solvency Audit' : 'Developer Trust & Proof of Work Audit'}
              </h1>
              <p className="text-[9.5px] text-slate-500 font-mono">
                Decentralized Oracle Verified • Polygon PoS Sovereign Ledger
              </p>
            </div>
          </div>

          <div className="font-mono text-xs text-left md:text-right space-y-0.5 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl border md:border-none border-slate-200 w-full md:w-auto shrink-0">
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Audit ID:</span>
              <span className="font-black text-purple-900 text-xs">{mockCertificateId}</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Network:</span>
              <span className="font-bold text-slate-800 text-xs">Polygon PoS (137)</span>
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
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-headline font-black text-lg flex items-center justify-center shadow-md shrink-0">
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
                <p className="text-[11.5px] font-bold text-purple-700">{title}</p>
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
                {auditPerspective === 'client' ? 'Sponsor Reliability' : 'Contract Hourly Rate'}
              </span>
              <p className="text-sm font-black text-emerald-700 font-headline">
                {auditPerspective === 'client' ? '10.0 / 10.0 SLA' : `$${profile?.hourlyRateUsdc || 85} USDC / hr`}
              </p>
              <span className="text-[9px] text-purple-700 font-bold block">0% Protocol Fee Compliant</span>
            </div>
          </div>

          <p className="text-[11.5px] text-slate-700 leading-relaxed font-sans border-t border-slate-100 pt-2">
            {bio}
          </p>

          {/* Skill Badges */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 mr-1">Attested Skills:</span>
              {profile.skills.slice(0, 6).map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-bold rounded-lg shadow-3xs flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-purple-600" />
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── SECTION 3: SBT CRYPTOGRAPHIC LEDGER CARD (LIGHT THEME) ────────── */}
        <div className="p-3.5 rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/70 via-slate-50 to-indigo-50/70 space-y-2.5 font-mono relative z-10 page-break-inside-avoid shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800 shadow-2xs">
                <Award size={15} />
              </div>
              <div>
                <span className="text-[8.5px] uppercase font-black tracking-wider text-purple-800 block">
                  DECENTRALIZED IDENTITY ATTESTATION
                </span>
                <h3 className="font-headline text-xs sm:text-sm font-black text-slate-950">
                  {auditPerspective === 'client' ? 'Verified Escrow Sponsor Credential' : 'ERC-5192 Soulbound Reputation Token (SBT)'}
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
                {auditPerspective === 'client' ? 'Diamond Escrow Patron' : devReputationScore >= 900 ? 'Platinum Elite (Top 1%)' : 'Gold Sovereign (Top 5%)'}
              </span>
              <span className="text-[8.5px] text-slate-500 block font-mono">
                {auditPerspective === 'client' ? '100% Solvency Index' : `Index: ${devReputationScore} PLREP`}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 space-y-0.5 shadow-2xs">
              <span className="text-[8.5px] uppercase text-slate-500 block font-bold">Attestation Smart Contract</span>
              <span className="font-black text-slate-900 text-[10.5px] truncate block font-mono">
                {truncateAddress('0x42f8366420a092c55660830e8115e9a443900990')}
              </span>
              <span className="text-[8.5px] text-purple-700 block font-mono">Polygon PoS Sovereign Ledger</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: KEY METRICS MATRIX ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10 page-break-inside-avoid">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9px] uppercase font-black block">
              {auditPerspective === 'client' ? 'Client Trust Score' : 'Reputation Score'}
            </span>
            <p className="text-lg font-black text-purple-700 font-headline">
              {auditPerspective === 'client' ? `${clientReliabilityScore}/10` : devReputationScore}
            </p>
            <span className="text-[9px] text-slate-500 font-bold block font-mono">
              {auditPerspective === 'client' ? 'Sponsor Reliability' : 'PLREP Oracle Index'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9px] uppercase font-black block">
              {auditPerspective === 'client' ? 'Capital Sponsored' : 'Lifetime Volume Handled'}
            </span>
            <p className="text-lg font-black text-emerald-700 font-headline">
              ${(auditPerspective === 'client' ? clientVolumeDistributed : devVolumeHandled).toLocaleString()}
            </p>
            <span className="text-[9px] text-slate-500 font-bold block font-mono">USDC Smart Escrows</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9px] uppercase font-black block">
              {auditPerspective === 'client' ? 'Rehire Retention' : 'Escrow Success SLA'}
            </span>
            <p className="text-lg font-black text-slate-900 font-headline">
              {auditPerspective === 'client' ? clientRehireRate : `${devSuccessRate}%`}
            </p>
            <span className="text-[9px] text-slate-500 font-bold block font-mono">0% Escalations</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9px] uppercase font-black block">
              {auditPerspective === 'client' ? 'Total Escrows Posted' : 'Completed Contracts'}
            </span>
            <p className="text-lg font-black text-purple-700 font-headline">
              {(auditPerspective === 'client' ? completedClientJobs.length : completedFreelancerJobs.length) || 1}
            </p>
            <span className="text-[9px] text-slate-500 font-bold block font-mono">100% Settled</span>
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
                  {auditPerspective === 'client' ? 'Verified Client Escrow Portfolio & Contracts' : 'Verified Proof of Work & Settled Contracts Ledger'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Cryptographically attested smart escrows on Polygon PoS MultiSig
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 shrink-0">
              {(auditPerspective === 'client' ? clientJobs : freelancerJobs).length || jobs.length} Total Escrows
            </span>
          </div>

          <div className="space-y-2">
            {(() => {
              const allRelevantJobs = (auditPerspective === 'client' ? clientJobs : freelancerJobs);
              const targetList = allRelevantJobs.length > 0 ? allRelevantJobs : jobs;

              if (targetList.length === 0) {
                return (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500 font-mono">
                    No active or completed contracts found for this address.
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
              src="/polylanceLogo.png" 
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
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(shareUrl)}`}
                alt="Scan to Verify on CertifiedPass"
                className="w-12 h-12 rounded-lg"
              />
              <div className="text-left font-mono">
                <span className="text-[7.5px] uppercase tracking-wider text-purple-800 font-black block">CertifiedPass™</span>
                <span className="text-[8.5px] font-bold text-slate-800 block">Scan to Verify</span>
                <span className="text-[7px] text-slate-400 block">Universal Trust QR</span>
              </div>
            </div>

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
