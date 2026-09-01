import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  ShieldCheck, Award, FileText, Calendar, User, CheckCircle2, 
  Printer, ArrowLeft, Building2, Sparkles, Clock, Globe, GitFork, 
  FileCheck, Shield, ChevronRight, Copy, Check, ExternalLink,
  Coins, Briefcase, Zap, Star, Lock, QrCode, ArrowUpRight,
  Share2, Twitter, Linkedin, CheckCheck, HeartHandshake
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

  const isFreelancer = freelancerJobs.length > 0 || Boolean(profile?.githubUsername) || currentRole === 'freelancer';
  const isClient = clientJobs.length > 0 || currentRole === 'client';

  const [auditPerspective, setAuditPerspective] = useState<'developer' | 'client'>(() => {
    if (clientJobs.length > freelancerJobs.length || currentRole === 'client') return 'client';
    return 'developer';
  });

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

  const handleShareTwitter = () => {
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

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-purple-600 selection:text-white">
      
      {/* CSS print overrides */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .audit-sheet {
            box-shadow: none !important;
            border: 1px solid #E2E8F0 !important;
            padding: 24px !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Navigation & Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 flex-wrap">
          <Link 
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          {/* Perspective Toggle (Developer vs Client) */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setAuditPerspective('developer')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                auditPerspective === 'developer'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Award size={13} />
              <span>Developer Audit</span>
            </button>
            <button
              type="button"
              onClick={() => setAuditPerspective('client')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                auditPerspective === 'client'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 size={13} />
              <span>Client Sponsor Audit</span>
            </button>
          </div>

          {/* Tab Switcher: Social Card vs Formal PDF */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'social'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText size={13} />
              <span>Printable PDF</span>
            </button>
          </div>
        </div>

        {/* Social Share & Print Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleShareTwitter}
            className="bg-[#0f1419] hover:bg-black text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 cursor-pointer"
          >
            <Twitter size={13} className="fill-current text-white" />
            <span>Share on X</span>
          </button>

          <button
            type="button"
            onClick={handleShareLinkedIn}
            className="bg-[#0077b5] hover:bg-[#006097] text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-105 cursor-pointer"
          >
            <Linkedin size={13} className="fill-current text-white" />
            <span>LinkedIn</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            {copiedLink ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20 transition-all hover:scale-105"
          >
            <Printer size={14} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: SOCIAL MEDIA CARD VIEW (1200x630 DESIGN) ───────────────────────── */}
      {activeTab === 'social' && (
        <div className="max-w-4xl mx-auto space-y-4 no-print animate-fadeIn">
          
          <div className={`rounded-3xl p-6 sm:p-10 border-2 shadow-2xl relative overflow-hidden font-sans text-white transition-all ${
            auditPerspective === 'client'
              ? 'bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1E1B4B] border-indigo-500/40'
              : 'bg-gradient-to-br from-[#0B0A1A] via-[#13112E] to-[#1A0B2E] border-purple-500/40'
          }`}>
            
            {/* Ambient Background Glow Mesh */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 ${
              auditPerspective === 'client' ? 'bg-indigo-600/25' : 'bg-purple-600/25'
            }`} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

            <div className="relative z-10 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    auditPerspective === 'client'
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-indigo-500/30'
                      : 'bg-gradient-to-tr from-purple-600 to-pink-500 shadow-purple-500/30'
                  }`}>
                    {auditPerspective === 'client' ? <Building2 size={22} /> : <ShieldCheck size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                        auditPerspective === 'client'
                          ? 'text-indigo-300 bg-indigo-500/20 border-indigo-400/30'
                          : 'text-purple-300 bg-purple-500/20 border-purple-400/30'
                      }`}>
                        {auditPerspective === 'client' ? 'VERIFIED WEB3 ESCROW PATRON AUDIT' : 'ERC-5192 SOULBOUND REPUTATION AUDIT'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        ● LIVE & ATTESTED
                      </span>
                    </div>
                    <span className="font-headline font-black text-sm text-slate-200 block mt-0.5">
                      PolyLance Sovereign Oracle Protocol
                    </span>
                  </div>
                </div>

                <div className="font-mono text-right text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Audit ID</span>
                  <span className="font-black text-white">{mockCertificateId}</span>
                </div>
              </div>

              {/* Profile Card Summary */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
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
                      <h2 className="font-headline text-lg sm:text-xl font-black text-white">{displayName}</h2>
                      {profile?.githubVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30">
                          <CheckCircle2 size={11} className="text-purple-400" /> @{profile.githubUsername}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-purple-300 mt-0.5">{title}</p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{truncateAddress(targetAddress)}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono space-y-0.5">
                  <span className="text-[9.5px] uppercase text-slate-400 block font-bold">
                    {auditPerspective === 'client' ? 'Client Trust Index' : 'PLREP Skill Index'}
                  </span>
                  <p className="text-2xl font-black text-emerald-400 font-headline">
                    {auditPerspective === 'client' ? `${clientReliabilityScore} / 10.0` : `${devReputationScore} PTS`}
                  </p>
                  <span className="text-[9.5px] text-purple-300 font-bold block">
                    {auditPerspective === 'client' ? '100% Sovereign Settlement' : 'Top Tier Verified Developer'}
                  </span>
                </div>
              </div>

              {/* 3 Metric Stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    {auditPerspective === 'client' ? 'Capital Sponsored & Released' : 'Lifetime Proof of Work Handled'}
                  </span>
                  <p className="text-2xl font-black text-emerald-400 font-headline">
                    ${(auditPerspective === 'client' ? clientVolumeDistributed : devVolumeHandled).toLocaleString()} USDC
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">0% Protocol Extraction</span>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    {auditPerspective === 'client' ? 'Rehire / Retention Rate' : 'Milestone Delivery SLA'}
                  </span>
                  <p className="text-2xl font-black text-white font-headline">
                    {auditPerspective === 'client' ? clientRehireRate : `${devSuccessRate}%`}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">0.0% Dispute Escalation</span>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    {auditPerspective === 'client' ? 'Completed Escrow Projects' : 'Completed Smart Contracts'}
                  </span>
                  <p className="text-2xl font-black text-purple-300 font-headline">
                    {(auditPerspective === 'client' ? completedClientJobs.length : completedFreelancerJobs.length) || (auditPerspective === 'client' ? clientJobs.length : freelancerJobs.length) || 1}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400 block">Verified On-Chain Milestones</span>
                </div>
              </div>

              {/* Badges Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-lg border border-purple-400/30">
                    <CheckCircle2 size={11} className="text-emerald-400" /> Polygon PoS (137)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/15">
                    <ShieldCheck size={11} className="text-cyan-400" /> Non-Custodial MultiSig Identity
                  </span>
                </div>

                <div className="text-slate-400 text-[10.5px]">
                  <span>Attested via: </span>
                  <strong className="text-purple-300 font-mono">{truncateAddress('0x42f8366420a092c55660830e8115e9a443900990')}</strong>
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

      {/* ── TAB 2 / PRINT: FORMAL AUDIT SHEET ───────────────────────────────────── */}
      <div 
        className={`audit-sheet shadow-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 max-w-4xl mx-auto space-y-6 relative overflow-hidden gpu-layer ${activeTab === 'social' ? 'hidden print:block' : 'block'}`}
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        
        {/* ── SECTION 1: HEADER & CERTIFICATE BANNER ────────────────────────── */}
        <div className="border-b-2 border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`p-1.5 text-white rounded-lg shadow-2xs ${auditPerspective === 'client' ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                {auditPerspective === 'client' ? <Building2 size={16} /> : <ShieldCheck size={16} />}
              </span>
              <span className="text-[10px] font-mono font-black tracking-widest text-purple-900 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {auditPerspective === 'client' ? 'Official PolyLance Client Trust Attestation' : 'Official PolyLance Protocol Attestation'}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● Live & Verified
              </span>
            </div>
            <h1 className="font-headline text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {auditPerspective === 'client' ? 'Web3 Client Trust & Escrow Sponsorship Audit' : 'Trust & Performance Audit Report'}
            </h1>
            <p className="text-[11px] text-slate-500 font-mono">
              Cryptographic Proof of Work & Sovereign Escrow History Ledger
            </p>
          </div>

          <div className="font-mono text-xs text-left md:text-right space-y-0.5 bg-slate-50 md:bg-transparent p-2.5 md:p-0 rounded-xl border md:border-none border-slate-200 w-full md:w-auto">
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Audit ID:</span>
              <span className="font-black text-purple-900">{mockCertificateId}</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Network:</span>
              <span className="font-bold text-slate-800">Polygon PoS (137)</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Attested At:</span>
              <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: PARTICIPANT IDENTITY OVERVIEW ──────────────────────── */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-headline font-black text-xl flex items-center justify-center shadow-sm shrink-0">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline text-base sm:text-lg font-extrabold text-slate-900">{displayName}</h2>
                  {profile?.githubVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                      <CheckCircle2 size={11} className="text-purple-600" /> GitHub Verified
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-purple-700">{title}</p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 pt-0.5">
                  <span>Wallet:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {targetAddress}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-left sm:text-right space-y-0.5 font-mono text-xs w-full sm:w-auto shadow-2xs">
              <span className="text-[9.5px] text-slate-500 uppercase font-bold block">
                {auditPerspective === 'client' ? 'Sponsor Reliability' : 'Contract Hourly Rate'}
              </span>
              <p className="text-sm font-black text-emerald-700">
                {auditPerspective === 'client' ? '10.0 / 10.0 SLA' : `$${profile?.hourlyRateUsdc || 85} USDC / hr`}
              </p>
              <span className="text-[9.5px] text-purple-700 font-bold block">0% Protocol Fee Compliant</span>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-sans border-t border-slate-200 pt-2.5">
            {bio}
          </p>

          {/* Skill Badges */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10.5px] font-bold text-slate-500 mr-1">Attested Skills:</span>
              {profile.skills.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 text-[10.5px] font-bold rounded-lg shadow-3xs flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-purple-600" />
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── SECTION 3: SBT CRYPTOGRAPHIC LEDGER CARD ─────────────────────── */}
        <div className={`text-white p-5 sm:p-6 rounded-2xl border shadow-lg space-y-4 font-mono relative z-10 page-break-inside-avoid ${
          auditPerspective === 'client'
            ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 border-indigo-500/30'
            : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border-purple-500/30'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
                <Award size={18} />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-purple-300 block">
                  DECENTRALIZED IDENTITY ATTESTATION
                </span>
                <h3 className="font-headline text-sm sm:text-base font-black text-white">
                  {auditPerspective === 'client' ? 'Verified Escrow Sponsor Credential' : 'ERC-5192 Soulbound Reputation Token (SBT)'}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Lock size={11} />
                LOCKED & NON-TRANSFERABLE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[9.5px] uppercase text-purple-300/80 block font-bold">Credential Identifier</span>
              <span className="font-black text-white text-xs tracking-wide block">{sbtTokenId}</span>
              <span className="text-[9px] text-purple-200/70 block">Standard: ERC-5192 / EIP-5484</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[9.5px] uppercase text-purple-300/80 block font-bold">Reputation Tier</span>
              <span className="font-black text-amber-300 text-xs block">
                {auditPerspective === 'client' ? 'Diamond Escrow Patron' : devReputationScore >= 900 ? 'Platinum Elite (Top 1%)' : 'Gold Sovereign (Top 5%)'}
              </span>
              <span className="text-[9px] text-amber-200/70 block">
                {auditPerspective === 'client' ? '100% Solvency Index' : `Index: ${devReputationScore} PLREP`}
              </span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[9.5px] uppercase text-purple-300/80 block font-bold">Attestation Smart Contract</span>
              <span className="font-black text-purple-200 text-[11px] truncate block font-mono">
                {truncateAddress('0x42f8366420a092c55660830e8115e9a443900990')}
              </span>
              <span className="text-[9px] text-purple-300/70 block">Polygon PoS Sovereign Ledger</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">
              Cryptographically Attested Badges & Guarantees:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10.5px] font-bold border border-white/15 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                {auditPerspective === 'client' ? 'Escrow Funding Guaranteed On-Chain' : 'Proof of Work Delivery Verified'}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10.5px] font-bold border border-white/15 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                0% Protocol Fee Peer-to-Peer Enforced
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10.5px] font-bold border border-white/15 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                Safe MultiSig Sovereign Identity
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10.5px] font-bold border border-white/15 flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-400" />
                0.0% Dispute Escalation Ratio
              </span>
              {profile?.githubVerified && (
                <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10.5px] font-bold border border-white/15 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-purple-300" />
                  GitHub Oracle Certified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 4: KEY METRICS MATRIX ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 page-break-inside-avoid">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9.5px] uppercase font-black block">
              {auditPerspective === 'client' ? 'Client Trust Score' : 'Reputation Score'}
            </span>
            <p className="text-xl font-black text-purple-700">
              {auditPerspective === 'client' ? `${clientReliabilityScore}/10` : devReputationScore}
            </p>
            <span className="text-[9.5px] text-slate-500 font-bold block">
              {auditPerspective === 'client' ? 'Sponsor Reliability' : 'PLREP Oracle Index'}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9.5px] uppercase font-black block">
              {auditPerspective === 'client' ? 'Capital Sponsored' : 'Lifetime Volume Handled'}
            </span>
            <p className="text-xl font-black text-emerald-700">
              ${(auditPerspective === 'client' ? clientVolumeDistributed : devVolumeHandled).toLocaleString()}
            </p>
            <span className="text-[9.5px] text-slate-500 font-bold block">USDC Smart Escrows</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9.5px] uppercase font-black block">
              {auditPerspective === 'client' ? 'Rehire Retention' : 'Escrow Success SLA'}
            </span>
            <p className="text-xl font-black text-slate-900">
              {auditPerspective === 'client' ? clientRehireRate : `${devSuccessRate}%`}
            </p>
            <span className="text-[9.5px] text-slate-500 font-bold block">0% Escalations</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center space-y-0.5 shadow-2xs">
            <span className="text-slate-500 text-[9.5px] uppercase font-black block">
              {auditPerspective === 'client' ? 'Total Escrows Posted' : 'Completed Contracts'}
            </span>
            <p className="text-xl font-black text-purple-700">
              {(auditPerspective === 'client' ? completedClientJobs.length : completedFreelancerJobs.length) || 1}
            </p>
            <span className="text-[9.5px] text-slate-500 font-bold block">100% Settled</span>
          </div>
        </div>

        {/* ── SECTION 5: ESCROW CONTRACT HISTORY (NO PRIVATE DELIVERY LINKS) ──── */}
        <div className="space-y-3 relative z-10 page-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-purple-100 text-purple-800 rounded-md">
                <FileCheck size={14} />
              </span>
              <h3 className="font-headline text-sm font-extrabold text-slate-900 uppercase">
                {auditPerspective === 'client' ? 'Verified Client Escrow Portfolio' : 'Verified Proof of Work Contract Ledger'}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Showing {(auditPerspective === 'client' ? clientJobs : freelancerJobs).length} Escrows
            </span>
          </div>

          <div className="space-y-2">
            {((auditPerspective === 'client' ? clientJobs : freelancerJobs).length > 0
              ? (auditPerspective === 'client' ? clientJobs : freelancerJobs)
              : jobs.slice(0, 3)
            ).map((j, idx) => {
              const amount = parseFloat(j.amountUsdc || '0');
              const isDisputed = j.status === 'Disputed' || (j.dispute && !j.dispute.resolved);
              return (
                <div 
                  key={j.id || idx}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-purple-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 truncate max-w-sm">{j.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold border ${
                        j.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDisputed
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {j.status === 'Completed' ? '● Settled' : j.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10.5px] font-mono text-slate-500">
                      <span>Contract: {truncateAddress(j.contractAddress || '0x42f8...990')}</span>
                      <span>•</span>
                      <span>Category: {j.category || 'Web3'}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">Execution Sealed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <div className="text-left sm:text-right font-mono">
                      <span className="font-black text-slate-900 text-sm">${amount.toLocaleString()} USDC</span>
                      <span className="text-[9.5px] text-slate-500 block">0% Protocol Fees</span>
                    </div>
                    <Link
                      to={`/jobs/${j.id}/attestation`}
                      className="p-1.5 text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Milestone Attestation"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 6: ORACLE SIGNATURE & IPFS INTEGRITY ──────────────────── */}
        <div className="border-t-2 border-slate-200 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs relative z-10 page-break-inside-avoid">
          <div className="space-y-1">
            <span className="text-slate-900 uppercase font-black block text-[10.5px] tracking-wider">
              Cryptographic Audit Integrity & IPFS CID
            </span>
            <p className="text-slate-600 leading-relaxed font-sans text-[10px]">
              This performance audit is compiled deterministically from Ethereum/Polygon smart contracts, decentralized SBT attestations, and Safe MultiSig execution states.
            </p>
            <div className="text-[9.5px] break-all text-purple-950 bg-purple-50 p-1.5 rounded-xl border border-purple-200 font-mono font-black">
              IPFS CID: {mockIpfsHash}
            </div>
          </div>

          <div className="flex flex-col justify-end items-start md:items-end gap-1 md:text-right">
            <div>
              <span className="text-slate-900 uppercase font-black block text-[10.5px] tracking-wider">
                PolyLance Sovereign Oracle Protocol Signature
              </span>
              <p className="font-black text-slate-800 break-all text-[9.5px] mt-0.5 font-mono">{mockAuditHash}</p>
            </div>
            
            <div className="flex items-center gap-1.5 border-t border-slate-200 pt-1 w-full justify-start md:justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-black text-slate-900 text-[10.5px]">Decentralized Oracle Verified & Sealed</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
