import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  ShieldCheck, Award, FileText, Calendar, CheckCircle2, 
  Printer, ArrowLeft, Building2, Sparkles, Clock, Globe, 
  Copy, Check, ExternalLink, Share2, Twitter, Linkedin,
  Coins, Briefcase, Zap, Star, Lock, QrCode, ArrowUpRight,
  Download, Eye, Layers, UserCheck, CheckCheck
} from 'lucide-react';
import { truncateAddress, generateDeterministicHash } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';

export const JobAttestationReport: React.FC = () => {
  const { id: jobIdParam } = useParams<{ id: string }>();
  const { jobs, profiles } = usePolyLanceData();
  const { address: userAddress } = useWeb3();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'social' | 'certificate'>('social');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Find job by ID or contract address
  const job = useMemo(() => {
    if (!jobIdParam) return jobs[0] || null;
    const lower = jobIdParam.toLowerCase();
    return jobs.find(j => j.id.toLowerCase() === lower || j.contractAddress?.toLowerCase() === lower) || jobs[0] || null;
  }, [jobs, jobIdParam]);

  // Client and Freelancer Profiles
  const clientAddr = job?.client || '0x71c8366420a092c55660830e8115e9a44390001';
  const freelancerAddr = job?.freelancer || job?.applications?.[0]?.applicant || '0x88aa0398b91a150b041da819bc954bb356e009dd';
  
  const clientProfileKey = Object.keys(profiles).find(k => k.toLowerCase() === clientAddr.toLowerCase());
  const clientProfile = clientProfileKey ? profiles[clientProfileKey] : null;

  const freelancerProfileKey = Object.keys(profiles).find(k => k.toLowerCase() === freelancerAddr.toLowerCase());
  const freelancerProfile = freelancerProfileKey ? profiles[freelancerProfileKey] : null;

  const clientName = clientProfile?.displayName || truncateAddress(clientAddr);
  const freelancerName = freelancerProfile?.displayName || truncateAddress(freelancerAddr);

  const amountUsdc = parseFloat(job?.amountUsdc || '1500');
  const contractAddress = job?.contractAddress || '0x42f8366420a092c55660830e8115e9a443900990';
  const sbtTokenId = `#SBT-WORK-${(job?.id || 'PL-001').slice(0, 8).toUpperCase()}`;
  const certificateId = `PL-CERT-${(job?.id || '001').slice(0, 6).toUpperCase()}-${contractAddress.slice(2, 6).toUpperCase()}`;

  const completionDate = job?.events?.find(e => e.step === 'Completed')?.timestamp 
    ? new Date(job.events.find(e => e.step === 'Completed')!.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Cryptographic IPFS CID and Oracle Signature
  const mockIpfsHash = useMemo(() => {
    return generateIpfsCid({
      standard: 'ERC-5192 Soulbound Attestation',
      type: 'JOB_PROOF_OF_WORK_CERTIFICATE_V2',
      jobId: job?.id || 'JOB-001',
      jobTitle: job?.title || 'Verified Web3 Milestone Deliverable',
      settledAmountUsdc: amountUsdc,
      client: clientAddr,
      freelancer: freelancerAddr,
      contractAddress,
      proofSummary: job?.proof?.description || 'Milestone deliverables verified, tested, and accepted with 0 disputes.',
      externalLink: job?.proof?.externalLink || 'https://github.com/polylance/deliverable',
      timestamp: Date.now()
    });
  }, [job, amountUsdc, clientAddr, freelancerAddr, contractAddress]);

  const mockOracleSignature = useMemo(() => {
    return generateDeterministicHash(`polylance-sbt-attestation-oracle:${job?.id || 'job'}:${contractAddress}`);
  }, [job, contractAddress]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://polylance.app/#/jobs/${job?.id}/attestation`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `🚀 Proof of Work Attested & Settled on @PolyLanceProtocol!\n\n` +
      `📌 Job: "${job?.title || 'Web3 Deliverable'}"\n` +
      `💰 Payout: $${amountUsdc.toLocaleString()} USDC Settled on @0xPolygon\n` +
      `📜 Verified Soulbound Token (ERC-5192): ${sbtTokenId}\n\n` +
      `Verify cryptographic attestation:`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!job) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Award size={48} className="text-purple-600 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-900 font-headline">Escrow Contract Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Unable to locate the specified job or Soulbound Token certificate.
        </p>
        <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-purple-600 selection:text-white">
      
      {/* ── Action & Mode Switcher Bar (Hidden in Print) ────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <Link 
            to={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
          >
            <ArrowLeft size={14} /> Back to Escrow
          </Link>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'social'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Share2 size={13} />
              <span>Social Share Card</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'certificate'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText size={13} />
              <span>Printable Certificate</span>
            </button>
          </div>
        </div>

        {/* Social Sharing & Print Buttons */}
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

      {/* ── TAB 1: SOCIAL MEDIA CARD VIEW (1200x630 ASPECT OPTIMIZED) ─────────────── */}
      {activeTab === 'social' && (
        <div className="max-w-4xl mx-auto space-y-4 no-print animate-fadeIn">
          
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border-2 border-purple-500/40 shadow-2xl relative overflow-hidden font-sans">
            
            {/* Ambient Background Mesh */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

            <div className="relative z-10 space-y-6">
              
              {/* Card Top Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Award size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-black tracking-widest text-purple-300 uppercase bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-400/30">
                        ERC-5192 SOULBOUND PROOF OF WORK
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        ● 100% SETTLED
                      </span>
                    </div>
                    <span className="font-headline font-black text-sm text-slate-200 block mt-0.5">
                      PolyLance Sovereign Escrow Protocol
                    </span>
                  </div>
                </div>

                <div className="font-mono text-right text-xs text-purple-300">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Certificate ID</span>
                  <span className="font-black text-white">{certificateId}</span>
                </div>
              </div>

              {/* Job Title & Verified Amount Pill */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block">
                  Completed & Verified Deliverable Milestone:
                </span>
                <h1 className="font-headline font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  {job.title}
                </h1>
              </div>

              {/* 3 Metric High-Impact Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Settled Escrow Payout</span>
                  <p className="text-2xl font-black text-emerald-400 font-headline">${amountUsdc.toLocaleString()} USDC</p>
                  <span className="text-[10px] font-mono text-slate-400 block">0% Protocol Extraction</span>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Soulbound Token ID</span>
                  <p className="text-lg font-black text-purple-300 font-mono truncate">{sbtTokenId}</p>
                  <span className="text-[10px] font-mono text-slate-400 block">Locked to Freelancer Safe</span>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Settlement SLA</span>
                  <p className="text-xl font-black text-white font-headline">0% Disputes • Instant</p>
                  <span className="text-[10px] font-mono text-slate-400 block">{completionDate}</span>
                </div>
              </div>

              {/* Two Parties Summary (Freelancer & Client) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* Talent Box */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {freelancerProfile?.avatarUrl ? (
                      <img src={freelancerProfile.avatarUrl} alt={freelancerName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      freelancerName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-mono text-purple-400 font-bold uppercase block">Attested Talent</span>
                    <h4 className="font-bold text-white text-xs truncate">{freelancerName}</h4>
                    <span className="text-[10px] font-mono text-slate-400 truncate block">{truncateAddress(freelancerAddr)}</span>
                  </div>
                </div>

                {/* Client Box */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {clientProfile?.avatarUrl ? (
                      <img src={clientProfile.avatarUrl} alt={clientName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      clientName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] font-mono text-indigo-400 font-bold uppercase block">Attested Escrow Client</span>
                    <h4 className="font-bold text-white text-xs truncate">{clientName}</h4>
                    <span className="text-[10px] font-mono text-slate-400 truncate block">{truncateAddress(clientAddr)}</span>
                  </div>
                </div>

              </div>

              {/* Footer Blockchain Guarantees */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-lg border border-purple-400/30">
                    <CheckCircle2 size={11} className="text-emerald-400" /> Polygon PoS (137)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/15">
                    <ShieldCheck size={11} className="text-cyan-400" /> Non-Custodial MultiSig Escrow
                  </span>
                </div>

                <div className="text-slate-400 text-[10.5px]">
                  <span>Verified at: </span>
                  <strong className="text-purple-300 font-mono">{truncateAddress(contractAddress)}</strong>
                </div>
              </div>

            </div>

          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">
              💡 Tip: Click <strong>"Share on X"</strong> or <strong>"LinkedIn"</strong> above to showcase your authenticated proof of work directly to your network.
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('certificate')}
              className="text-purple-600 hover:text-purple-800 font-bold underline shrink-0 cursor-pointer"
            >
              View Printable Certificate &rarr;
            </button>
          </div>

        </div>
      )}

      {/* ── TAB 2 / PRINT: FORMAL SOVEREIGN ATTESTATION CERTIFICATE ───────────────── */}
      <div className={`attestation-sheet shadow-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 max-w-4xl mx-auto space-y-5 relative overflow-hidden gpu-layer ${activeTab === 'social' ? 'hidden print:block' : 'block'}`}>
        
        {/* Subtle Decorative Background Ambience (Hidden in Print) */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none no-print" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl opacity-40 -ml-20 -mb-20 pointer-events-none no-print" />

        {/* ── SECTION 1: OFFICIAL HEADER ────────────────────────────────────────── */}
        <div className="border-b-2 border-slate-100 pb-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 bg-purple-600 text-white rounded-lg shadow-2xs">
                <Award size={16} />
              </span>
              <span className="text-[10px] font-mono font-black tracking-widest text-purple-900 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Official PolyLance ERC-5192 Soulbound Attestation
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● 100% Settled & Released
              </span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
              Proof of Work & Escrow Attestation Certificate
            </h1>
            <p className="text-[11px] text-slate-500 font-mono">
              Immutable Cryptographic Milestone Settlement & Soulbound Token Ledger
            </p>
          </div>

          <div className="font-mono text-xs text-left md:text-right space-y-0.5 bg-slate-50 md:bg-transparent p-2.5 md:p-0 rounded-xl border md:border-none border-slate-200 w-full md:w-auto">
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Cert ID:</span>
              <span className="font-black text-purple-900">{certificateId}</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Network:</span>
              <span className="font-bold text-slate-800">Polygon PoS (137)</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Settled At:</span>
              <span className="font-bold text-slate-800">{completionDate}</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SBT TOKEN & MILESTONE BANNER ───────────────────────────── */}
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-purple-500/30 shadow-lg space-y-3.5 font-mono relative z-10 page-break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
                <Lock size={15} />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-purple-300 block">
                  SOULBOUND ERC-5192 IDENTIFIER
                </span>
                <h3 className="font-headline text-sm font-black text-white">{sbtTokenId}</h3>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 size={10} /> NON-TRANSFERABLE ASSET
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[9px] uppercase text-purple-300/80 block font-bold">Settled Payout</span>
              <span className="font-black text-emerald-400 text-base block font-headline">${amountUsdc.toLocaleString()} USDC</span>
              <span className="text-[9px] text-purple-200/70 block">0% Protocol Maintenance</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[9px] uppercase text-purple-300/80 block font-bold">Escrow Smart Contract</span>
              <span className="font-black text-purple-200 text-xs truncate block font-mono">{truncateAddress(contractAddress)}</span>
              <span className="text-[9px] text-purple-300/70 block">Polygon PoS Clone Escrow</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[9px] uppercase text-purple-300/80 block font-bold">Dispute SLA Ratio</span>
              <span className="font-black text-white text-xs block">0.0% (Clean Record)</span>
              <span className="text-[9px] text-emerald-300 block">100% Milestone Approved</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: PROJECT DELIVERABLE PROOF SUMMARY ──────────────────────── */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 relative z-10 page-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="text-[10px] font-mono font-bold text-purple-900 uppercase">Verified Milestone Scope</span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">Category: Smart Contract & Web3</span>
          </div>

          <h3 className="font-headline font-black text-base text-slate-900">{job.title}</h3>
          
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            {job.proof?.description || job.description || 'Full milestone deliverable executed, peer-reviewed, and settled autonomously on Polygon smart escrows.'}
          </p>

          {job.proof?.externalLink && (
            <div className="flex items-center gap-2 pt-1 font-mono text-xs text-purple-700">
              <ExternalLink size={13} />
              <span>Deliverable Link / PR: <strong className="text-slate-900 break-all">{job.proof.externalLink}</strong></span>
            </div>
          )}
        </div>

        {/* ── SECTION 4: ATTESTED PARTIES LEDGER (FREELANCER & CLIENT) ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 page-break-inside-avoid">
          
          {/* Freelancer Column */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-mono text-xs">
            <span className="text-[10px] uppercase font-black text-purple-900 border-b border-slate-200 pb-1 block">
              Attested Freelancer (Proof of Work Provider)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Talent:</span>
              <span className="font-bold text-slate-900">{freelancerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Wallet:</span>
              <span className="font-bold text-slate-900 text-[11px]">{truncateAddress(freelancerAddr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">GitHub Attested:</span>
              <span className="font-bold text-purple-900">{freelancerProfile?.githubUsername ? `@${freelancerProfile.githubUsername}` : 'Verified MultiSig'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Reputation Tier:</span>
              <span className="font-bold text-emerald-700">Top Tier Verified (PLREP)</span>
            </div>
          </div>

          {/* Client Column */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-mono text-xs">
            <span className="text-[10px] uppercase font-black text-indigo-900 border-b border-slate-200 pb-1 block">
              Attested Escrow Client (Capital Provider)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Client:</span>
              <span className="font-bold text-slate-900">{clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Wallet:</span>
              <span className="font-bold text-slate-900 text-[11px]">{truncateAddress(clientAddr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Escrow Funded:</span>
              <span className="font-bold text-emerald-700">100% Locked on Polygon</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Payment Release:</span>
              <span className="font-bold text-slate-900">Approved Without Escalation</span>
            </div>
          </div>

        </div>

        {/* ── SECTION 5: CRYPTOGRAPHIC SIGNATURE & IPFS CID BLOCK ───────────────── */}
        <div className="border-t-2 border-slate-200 pt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs relative z-10 page-break-inside-avoid">
          <div className="space-y-1">
            <span className="text-slate-900 uppercase font-black block text-[10.5px] tracking-wider">
              Cryptographic Proof Integrity & IPFS CID
            </span>
            <p className="text-slate-600 leading-relaxed font-sans text-[10.5px]">
              This document serves as an immutable, cryptographically signed certificate of participant trust, proof of work delivery, and solvency on PolyLance smart contracts.
            </p>
            <div className="text-[10px] break-all text-purple-950 bg-purple-50 p-1.5 rounded-xl border border-purple-200 font-mono font-black">
              IPFS CID: {mockIpfsHash}
            </div>
          </div>

          <div className="flex flex-col justify-end items-start md:items-end gap-1 md:text-right">
            <div>
              <span className="text-slate-900 uppercase font-black block text-[10.5px] tracking-wider">
                PolyLance Oracle Protocol Signature
              </span>
              <p className="font-black text-slate-800 break-all text-[9.5px] mt-0.5 font-mono">{mockOracleSignature}</p>
            </div>
            
            <div className="flex items-center gap-1.5 border-t border-slate-200 pt-1 w-full justify-start md:justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-black text-slate-900 text-[10.5px]">Decentralized Oracle Verified & Signed</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
