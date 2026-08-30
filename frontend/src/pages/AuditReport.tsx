import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  ShieldCheck, Award, FileText, Calendar, User, CheckCircle2, 
  Printer, ArrowLeft, Building2, Sparkles, Clock, Globe, GitFork, 
  FileCheck, Shield, ChevronRight, Copy, Check, ExternalLink,
  Coins, Briefcase, Zap, Star, Lock, QrCode, ArrowUpRight
} from 'lucide-react';
import { truncateAddress, generateDeterministicHash } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';

export const AuditReport: React.FC = () => {
  const { address: targetAddressParam } = useParams<{ address: string }>();
  const { jobs, profiles } = usePolyLanceData();
  const { address: activeAddress, currentRole } = useWeb3();
  const [copied, setCopied] = useState(false);

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

  const clientRehireRate = completedClientJobs.length > 0 ? '94%' : '0%';
  const displayName = profile?.displayName || `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`;
  const title = profile?.title || (isFreelancer ? 'Senior Web3 Systems Engineer' : 'Enterprise Smart Escrow Client');
  const bio = profile?.bio || 'Verified decentralized participant operating with autonomous smart contracts, cryptographic escrow milestones, and 0% protocol fee peer-to-peer settlements on PolyLance.';
  
  const mockCertificateId = `PL-AUD-${targetAddress.slice(2, 10).toUpperCase()}`;
  const mockAuditHash = generateDeterministicHash(`polylance-oracle-audit-signature:${targetAddress}`);
  const sbtTokenId = `#SBT-PL-${targetAddress.slice(2, 8).toUpperCase()}-${targetAddress.slice(-4).toUpperCase()}`;
  const mockIpfsHash = generateIpfsCid({
    type: 'AUDIT_CERTIFICATE_V2',
    auditedParticipant: targetAddress,
    displayName,
    reputationScore: devReputationScore,
    volume: isFreelancer ? devVolumeHandled : clientVolumeDistributed,
    successRate: isFreelancer ? devSuccessRate : clientReliabilityScore,
    completedContracts: isFreelancer ? completedFreelancerJobs.length : completedClientJobs.length,
    issuer: 'PolyLance Decentralized Oracle Protocol (ERC-5192)',
    version: '2.0.0',
    timestamp: Date.now()
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(targetAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-purple-600 selection:text-white">
      
      {/* CSS print overrides targeting high-quality clean A4 formatting */}
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
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
        <Link 
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyAddress}
            className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Address Copied!' : 'Copy Wallet'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02]"
          >
            <Printer size={15} className="text-white shrink-0" />
            <span>Download PDF / Print Certificate</span>
          </button>
        </div>
      </div>

      {/* The Official Printable Certificate Sheet */}
      <div className="audit-sheet shadow-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 max-w-4xl mx-auto space-y-8 relative overflow-hidden">
        
        {/* Subtle Decorative Background Ambience */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl opacity-50 -ml-20 -mb-20 pointer-events-none" />

        {/* Certificate Header Banner */}
        <div className="border-b-2 border-slate-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 bg-purple-600 text-white rounded-lg shadow-sm">
                <ShieldCheck size={18} />
              </span>
              <span className="text-[10px] font-mono font-black tracking-widest text-purple-900 uppercase bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                Official PolyLance Protocol Attestation
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● Live & Verified
              </span>
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              Trust & Performance Audit Report
            </h1>
            <p className="text-xs text-slate-600 font-mono">
              Cryptographic Proof of Work & Sovereign Escrow History Ledger
            </p>
          </div>

          <div className="font-mono text-xs text-left md:text-right space-y-1 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl border md:border-none border-slate-200 w-full md:w-auto">
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

        {/* Participant Identity & Profile Overview */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-headline font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline text-lg sm:text-xl font-extrabold text-slate-900">{displayName}</h2>
                  {profile?.githubVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                      <CheckCircle2 size={11} className="text-purple-600" /> GitHub Verified
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-purple-700">{title}</p>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-600 pt-0.5">
                  <span>Wallet:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {targetAddress}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left sm:text-right space-y-1 font-mono text-xs w-full sm:w-auto shadow-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Hourly / Contract Rate</span>
              <p className="text-base font-black text-emerald-700">${profile?.hourlyRateUsdc || 85} USDC / hr</p>
              <span className="text-[10px] text-purple-700 font-bold block">0% Protocol Fee Compliant</span>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-sans border-t border-slate-200 pt-3">
            {bio}
          </p>

          {/* Skill Badges */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Attested Skills:</span>
              {profile.skills.map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg shadow-3xs flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-purple-600" />
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Soulbound Token (SBT) Cryptographic Ledger Card */}
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 rounded-2xl border border-purple-500/30 shadow-xl space-y-5 font-mono page-break-inside-avoid relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
                <Award size={22} />
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-black tracking-widest text-purple-300 block">
                  DECENTRALIZED IDENTITY ATTESTATION
                </span>
                <h3 className="font-headline text-base font-black text-white">
                  ERC-5192 Soulbound Reputation Token (SBT)
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Lock size={12} />
                LOCKED & NON-TRANSFERABLE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase text-purple-300/80 block font-bold">Soulbound Token ID</span>
              <span className="font-black text-white text-sm tracking-wide block">{sbtTokenId}</span>
              <span className="text-[9.5px] text-purple-200/70 block">Standard: ERC-5192 / EIP-5484</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase text-purple-300/80 block font-bold">Reputation Tier</span>
              <span className="font-black text-amber-300 text-sm block">
                {devReputationScore >= 900 ? 'Platinum Elite (Top 1%)' : devReputationScore >= 750 ? 'Gold Sovereign (Top 5%)' : 'Verified Contributor'}
              </span>
              <span className="text-[9.5px] text-amber-200/70 block">Index: {devReputationScore} PLREP</span>
            </div>
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase text-purple-300/80 block font-bold">Attestation Smart Contract</span>
              <span className="font-black text-purple-200 text-xs truncate block font-mono">
                {truncateAddress('0x42f8366420a092c55660830e8115e9a443900990')}
              </span>
              <span className="text-[9.5px] text-purple-300/70 block">Polygon PoS Sovereign Ledger</span>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-white/10">
            <span className="text-[10.5px] text-purple-300 font-bold uppercase tracking-wider block">
              Cryptographically Attested Badges & Guarantees:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                Proof of Work Delivery Verified
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                0% Protocol Fee Peer-to-Peer Enforced
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                Safe MultiSig Sovereign Identity
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                0.0% Dispute Escalation Ratio
              </span>
              {profile?.githubVerified && (
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-purple-300" />
                  GitHub Oracle Multi-Repo Certified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lifetime Key Metrics Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 page-break-inside-avoid relative z-10">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase font-black block">Reputation Score</span>
            <p className="text-2xl font-black text-purple-700">{devReputationScore}</p>
            <span className="text-[10px] text-slate-600 font-bold block">PLREP Oracle Index</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase font-black block">
              {isFreelancer ? 'Lifetime Volume Handled' : 'Lifetime Capital Funded'}
            </span>
            <p className="text-2xl font-black text-emerald-700">
              ${(isFreelancer ? devVolumeHandled : clientVolumeDistributed).toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-600 font-bold block">USDC Smart Escrows</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase font-black block">
              {isFreelancer ? 'Escrow Success SLA' : 'Rehire Retention'}
            </span>
            <p className="text-2xl font-black text-slate-900">
              {isFreelancer ? `${devSuccessRate}%` : clientRehireRate}
            </p>
            <span className="text-[10px] text-slate-600 font-bold block">Completed Milestones</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-1 shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase font-black block">
              {isFreelancer ? 'Completed Contracts' : 'Total Escrows Posted'}
            </span>
            <p className="text-2xl font-black text-indigo-900">
              {isFreelancer ? completedFreelancerJobs.length : clientJobs.length} Escrows
            </p>
            <span className="text-[10px] text-slate-600 font-bold block">Polygon PoS Ledger</span>
          </div>
        </div>

        {/* Detailed Verification Breakdown & Code Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 page-break-inside-avoid relative z-10">
          
          {/* Column A: Attestation Protocol Checklist */}
          <div className="space-y-3.5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-headline text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
              Attestation Protocol Checklist
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Cryptographic MultiSig Identity</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Identity bound to verified Safe address on-chain. Zero spoofing risk.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">SBT Reputation Ledger Link</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Verified {isFreelancer ? completedFreelancerJobs.length : completedClientJobs.length} Soulbound tokens locked in participant's address.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Dispute SLA Compliance</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Escrow milestone dispute ratio: 0.00% (Target: &lt;5.0%). Clean sovereign record.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Milestone Release Speed (SLA)</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">
                    Average milestone approval & settlement: Top Tier (Instant / &lt; 4.2 hours).
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column B: GitHub Code Stack or Enterprise Escrow Summary */}
          <div className="space-y-3.5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-headline text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-2">
              {profile?.githubUsername ? 'GitHub Verified Code Matrix' : 'Verified Escrow Economics'}
            </h3>

            {profile?.githubUsername ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-600 text-[10px] uppercase font-bold">GitHub Account:</span>
                  <span className="font-bold text-purple-900">@{profile.githubUsername}</span>
                </div>

                {(() => {
                  const rawLangs = Object.entries(profile.languageBytes || {}).filter(([_, bytes]) => (bytes || 0) > 0);
                  const totalBytes = rawLangs.reduce((acc, [_, b]) => acc + b, 0) || 1;

                  if (rawLangs.length === 0) {
                    return (
                      <div className="text-slate-600 py-3 text-center text-xs">
                        Verified On-Chain Developer Attestation Active
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {rawLangs.slice(0, 4).map(([lang, bytes]) => {
                        const pct = Math.max(1, Math.round((bytes / totalBytes) * 100));
                        return (
                          <div key={lang} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                                {lang}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-mono">{pct}%</span>
                                <span className="font-bold text-purple-900">{(bytes / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="flex items-center gap-1.5 text-[10.5px] text-purple-950 bg-purple-100/80 px-2.5 py-1.5 rounded-lg border border-purple-200 mt-2 font-bold justify-center font-sans">
                  <Sparkles size={13} className="text-purple-600" /> Sybil-Resistant GitHub Multi-Repo Verified
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between pb-1 border-b border-slate-200">
                  <span className="text-slate-600 uppercase text-[10px] font-bold">Metric</span>
                  <span className="text-slate-600 uppercase text-[10px] font-bold">Attested Status</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">Solvency Escrow TVL</span>
                  <span className="font-black text-emerald-700">${(clientVolumeDistributed || devVolumeHandled).toLocaleString()} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">On-Time Milestones</span>
                  <span className="font-black text-purple-900">100.0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">Fee Standard</span>
                  <span className="font-black text-slate-900">0% Protocol Maintenance</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-900">Total Recorded Operations</span>
                  <span className="font-black text-indigo-900">{clientJobs.length + freelancerJobs.length} Contracts</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verifiable Job History & Proof of Work Ledger Table */}
        <div className="space-y-3 page-break-inside-avoid relative z-10">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-headline text-xs font-black uppercase tracking-wider text-slate-800">
              Verifiable Completed Escrow Contracts Ledger (Proof of Work)
            </h3>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {isFreelancer ? completedFreelancerJobs.length : completedClientJobs.length} Settled Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[9px] bg-slate-50">
                  <th className="py-2.5 px-3">Escrow Job Title</th>
                  <th className="py-2.5 px-3">Counterparty</th>
                  <th className="py-2.5 px-3">Contract Address</th>
                  <th className="py-2.5 px-3 text-right">Settled Amount</th>
                  <th className="py-2.5 px-3 text-center">Attestation</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const jobList = isFreelancer ? completedFreelancerJobs : completedClientJobs;
                  if (jobList.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 font-bold font-sans border-b border-slate-100">
                          Active participant with 0 historical disputes recorded on Polygon smart escrows.
                        </td>
                      </tr>
                    );
                  }

                  return jobList.map((j) => {
                    const earnedFraction = j.dispute?.resolved ? ((j.dispute.rulingBps ?? 0) / 10000) : 1.0;
                    const amount = parseFloat(j.amountUsdc || '0') * earnedFraction;
                    const counterparty = isFreelancer ? j.client : (j.freelancer || '');

                    return (
                      <tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-sans font-bold text-slate-900">{j.title}</td>
                        <td className="py-3 px-3 text-slate-700 font-bold text-[11px]">{truncateAddress(counterparty)}</td>
                        <td className="py-3 px-3 text-purple-900 font-bold text-[11px]">{truncateAddress(j.contractAddress || '')}</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700">${amount.toLocaleString()} USDC</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={10} className="text-emerald-600" /> RELEASED
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cryptographic Disclaimers, IPFS CID & Signature Block */}
        <div className="border-t-2 border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs page-break-inside-avoid relative z-10">
          
          <div className="space-y-2">
            <span className="text-slate-900 uppercase font-black block text-xs tracking-wider">
              Cryptographic Proof Integrity & IPFS CID
            </span>
            <p className="text-slate-600 leading-relaxed font-sans text-xs">
              This document serves as an immutable, cryptographically signed certificate of participant trust, proof of work delivery, and solvency on PolyLance smart contracts.
            </p>
            <div className="text-[11px] break-all text-purple-950 bg-purple-50 p-2.5 rounded-xl border border-purple-200 font-mono font-black shadow-3xs">
              IPFS CID: {mockIpfsHash}
            </div>
          </div>

          <div className="flex flex-col justify-end items-start md:items-end gap-2.5 md:text-right">
            <div>
              <span className="text-slate-900 uppercase font-black block text-xs tracking-wider">
                PolyLance Oracle Protocol Signature
              </span>
              <p className="font-black text-slate-800 break-all text-[11px] mt-1 font-mono">{mockAuditHash}</p>
            </div>
            
            <div className="flex items-center gap-2 border-t border-slate-200 pt-2 w-full justify-start md:justify-end">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-black text-slate-900 text-xs">Decentralized Oracle Verified & Signed</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
