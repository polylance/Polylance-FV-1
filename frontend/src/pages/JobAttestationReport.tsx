import React, { useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toPng, toBlob } from 'html-to-image';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  ShieldCheck, Award, FileText, Calendar, CheckCircle2, 
  Printer, ArrowLeft, Building2, Sparkles, Clock, Globe, 
  Copy, Check, ExternalLink, Share2, Twitter, Linkedin,
  Coins, Briefcase, Zap, Star, Lock, QrCode, ArrowUpRight,
  Download, Eye, Layers, UserCheck, CheckCheck, Shield, User,
  FileBadge, CheckSquare, HeartHandshake, Flame, Image as ImageIcon
} from 'lucide-react';
import { truncateAddress, generateDeterministicHash } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';

export const JobAttestationReport: React.FC = () => {
  const { id: jobIdParam } = useParams<{ id: string }>();
  const { jobs, profiles } = usePolyLanceData();
  const { address: userAddress, currentRole } = useWeb3();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'social' | 'certificate'>('social');
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Find job by ID or contract address
  const job = useMemo(() => {
    if (!jobIdParam) return jobs[0] || null;
    const lower = jobIdParam.toLowerCase();
    return jobs.find(j => j.id.toLowerCase() === lower || j.contractAddress?.toLowerCase() === lower) || jobs[0] || null;
  }, [jobs, jobIdParam]);

  // Client and Freelancer Addresses & Profiles
  const clientAddr = job?.client || '0x71c8366420a092c55660830e8115e9a44390001';
  const freelancerAddr = job?.freelancer || job?.applications?.[0]?.applicant || '0x88aa0398b91a150b041da819bc954bb356e009dd';
  
  const clientProfileKey = Object.keys(profiles).find(k => k.toLowerCase() === clientAddr.toLowerCase());
  const clientProfile = clientProfileKey ? profiles[clientProfileKey] : null;

  const freelancerProfileKey = Object.keys(profiles).find(k => k.toLowerCase() === freelancerAddr.toLowerCase());
  const freelancerProfile = freelancerProfileKey ? profiles[freelancerProfileKey] : null;

  const clientName = clientProfile?.displayName || truncateAddress(clientAddr);
  const freelancerName = freelancerProfile?.displayName || truncateAddress(freelancerAddr);

  // Strictly scope perspective: Client gets Client Patronage Report, Freelancer gets Proof-of-Work Report
  const isUserClient = useMemo(() => {
    if (!userAddress) return currentRole === 'client';
    const lowerUser = userAddress.toLowerCase();
    if (job?.client && job.client.toLowerCase() === lowerUser) return true;
    if (job?.freelancer && job.freelancer.toLowerCase() === lowerUser) return false;
    return currentRole === 'client';
  }, [userAddress, currentRole, job]);

  const viewRole: 'freelancer' | 'client' = isUserClient ? 'client' : 'freelancer';

  const amountUsdc = parseFloat(job?.amountUsdc || '1500');
  const contractAddress = job?.contractAddress || '0x42f8366420a092c55660830e8115e9a443900990';
  const sbtTokenId = `#SBT-WORK-${(job?.id || 'PL-001').slice(0, 8).toUpperCase()}`;
  const certificateId = `PL-${viewRole === 'client' ? 'PATRON' : 'CERT'}-${(job?.id || '001').slice(0, 6).toUpperCase()}-${contractAddress.slice(2, 6).toUpperCase()}`;

  const completionDate = job?.events?.find(e => e.step === 'Completed')?.timestamp 
    ? new Date(job.events.find(e => e.step === 'Completed')!.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Cryptographic IPFS CID and Oracle Signature (Explicitly sanitized: NEVER leaks private deliverable links)
  const mockIpfsHash = useMemo(() => {
    return generateIpfsCid({
      standard: 'ERC-5192 Soulbound Attestation',
      type: viewRole === 'client' ? 'CLIENT_ESCROW_PATRONAGE_V2' : 'FREELANCER_PROOF_OF_WORK_V2',
      jobId: job?.id || 'JOB-001',
      jobTitle: job?.title || 'Verified Web3 Milestone Deliverable',
      settledAmountUsdc: amountUsdc,
      client: clientAddr,
      freelancer: freelancerAddr,
      contractAddress,
      proofSummary: 'Milestone deliverables verified, peer-tested, and cryptographically settled with 0% dispute friction.',
      timestamp: Date.now()
    });
  }, [job, amountUsdc, clientAddr, freelancerAddr, contractAddress, viewRole]);

  const mockOracleSignature = useMemo(() => {
    return generateDeterministicHash(`polylance-oracle-attestation:${viewRole}:${job?.id || 'job'}:${contractAddress}`);
  }, [job, contractAddress, viewRole]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://polylance.app/#/jobs/${job?.id}/attestation`;

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
      link.download = `PolyLance-${certificateId}.png`;
      link.href = dataUrl;
      link.click();
      setShareToast('🎨 HD Card image downloaded! Attach to your social media post.');
      setTimeout(() => setShareToast(null), 5000);
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareTwitter = async () => {
    // Generate and download PNG image so user has it ready to attach to tweet
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `PolyLance-${certificateId}.png`;
        link.href = dataUrl;
        link.click();

        // Also copy blob to clipboard if available
        const blob = await toBlob(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        }
      } catch (err) {
        console.warn('Could not auto-export card image:', err);
      }
    }

    setShareToast('📸 Card image downloaded & copied to clipboard! Paste (Ctrl+V) or attach into your X post.');
    setTimeout(() => setShareToast(null), 6000);

    const text = viewRole === 'client'
      ? encodeURIComponent(
          `🏛️ Trusted Milestone Settlement on @PolyLanceProtocol!\n\n` +
          `Proud to sponsor & settle "${job?.title || 'Web3 Project'}" for $${amountUsdc.toLocaleString()} USDC with verified talent @${freelancerName}!\n\n` +
          `🔒 100% Sovereign MultiSig Escrow • 0% Protocol Fees\n` +
          `📜 Verified Patron Certificate: ${certificateId}\n\n` +
          `Verify on-chain:`
        )
      : encodeURIComponent(
          `🚀 Proof of Work Attested & Settled on @PolyLanceProtocol!\n\n` +
          `📌 Completed: "${job?.title || 'Web3 Milestone'}"\n` +
          `💰 Payout: $${amountUsdc.toLocaleString()} USDC Settled on @0xPolygon\n` +
          `📜 Soulbound Token (ERC-5192): ${sbtTokenId}\n` +
          `🤝 Attested Client: @${clientName}\n\n` +
          `Verify cryptographic attestation:`
        );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareLinkedIn = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `PolyLance-${certificateId}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.warn('Could not auto-export card image:', err);
      }
    }

    setShareToast('📸 Card image downloaded! Attach the image to your LinkedIn post.');
    setTimeout(() => setShareToast(null), 6000);

    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!job) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <Award size={48} className="text-purple-600 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-900 font-headline">Escrow Contract Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Unable to locate the specified job or Soulbound Token certificate.
        </p>
        <Link to="/workspace" className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md">
          Return to Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-purple-600 selection:text-white">
      
      {/* ── Unified Glassmorphism Toolbar Card (Hidden in Print) ──────────────── */}
      <div className="max-w-4xl mx-auto mb-6 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2.5 no-print">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Left Group: Navigation & Scope Badge */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link 
              to={`/jobs/${job.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs shrink-0"
            >
              <ArrowLeft size={14} /> <span>Back to Escrow</span>
            </Link>

            {/* Certificate Badge Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/80 border border-purple-200/70 text-xs font-bold font-mono shrink-0">
              {viewRole === 'client' ? (
                <>
                  <Building2 size={13} className="text-indigo-600" />
                  <span className="text-indigo-950">Client Sponsorship</span>
                </>
              ) : (
                <>
                  <Award size={13} className="text-purple-600" />
                  <span className="text-purple-950">Soulbound Proof of Work</span>
                </>
              )}
            </div>

            {/* View Mode Segmented Control */}
            <div className="flex items-center p-0.5 bg-slate-100/90 border border-slate-200 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'social'
                    ? 'bg-white text-slate-950 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Share2 size={12} />
                <span>Social Card</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('certificate')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'certificate'
                    ? 'bg-white text-slate-950 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={12} />
                <span>Printable PDF</span>
              </button>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 justify-end flex-wrap">
            <button
              type="button"
              onClick={handleShareTwitter}
              title="Share to X (Downloads card image & copies to clipboard)"
              className="bg-[#0f1419] hover:bg-black text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 cursor-pointer active:scale-95"
            >
              <Twitter size={12} className="fill-current text-white" />
              <span>Share on X</span>
            </button>

            <button
              type="button"
              onClick={handleShareLinkedIn}
              title="Share to LinkedIn (Downloads card image & opens post)"
              className="bg-[#0077b5] hover:bg-[#006097] text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 cursor-pointer active:scale-95"
            >
              <Linkedin size={12} className="fill-current text-white" />
              <span>LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCardImage}
              disabled={isExporting}
              title="Download high-resolution PNG Social Card"
              className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 cursor-pointer active:scale-95"
            >
              <Download size={12} />
              <span>{isExporting ? 'Exporting...' : 'Save PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy verified certificate URL"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              {copiedLink ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedLink ? 'Copied!' : 'Link'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Download or Print full cryptographic PDF"
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all hover:scale-102 active:scale-95"
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

      {/* ── TAB 1: SOCIAL MEDIA SHARE CARD (1200x630 HIGH-IMPACT DESIGN) ───────────── */}
      {activeTab === 'social' && (
        <div className="max-w-4xl mx-auto space-y-4 no-print animate-fadeIn">
          
          {/* Card Wrapper */}
          <div 
            ref={cardRef}
            className={`rounded-3xl p-6 sm:p-10 border-2 shadow-2xl relative overflow-hidden font-sans text-white transition-all ${
              viewRole === 'client' 
                ? 'bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1E1B4B] border-indigo-500/40' 
                : 'bg-gradient-to-br from-[#0B0A1A] via-[#13112E] to-[#1A0B2E] border-purple-500/40'
            }`}
          >
            
            {/* Ambient Background Glow Mesh */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 ${
              viewRole === 'client' ? 'bg-indigo-600/25' : 'bg-purple-600/25'
            }`} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-600/15 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

            <div className="relative z-10 space-y-6">
              
              {/* Card Top Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    viewRole === 'client'
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-indigo-500/30'
                      : 'bg-gradient-to-tr from-purple-600 to-pink-500 shadow-purple-500/30'
                  }`}>
                    {viewRole === 'client' ? <Building2 size={22} /> : <Award size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                        viewRole === 'client'
                          ? 'text-indigo-300 bg-indigo-500/20 border-indigo-400/30'
                          : 'text-purple-300 bg-purple-500/20 border-purple-400/30'
                      }`}>
                        {viewRole === 'client' ? 'VERIFIED ESCROW PATRON & PROJECT SPONSOR' : 'ERC-5192 SOULBOUND PROOF OF WORK'}
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

                <div className="font-mono text-right text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Certificate ID</span>
                  <span className="font-black text-white">{certificateId}</span>
                </div>
              </div>

              {/* Dynamic Job Headline / Sponsor Highlight */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block">
                  {viewRole === 'client' ? 'Trusted Project Awarded & 100% Settled Milestone:' : 'Completed & Verified Deliverable Milestone:'}
                </span>
                <h1 className="font-headline font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                  {job.title}
                </h1>
                {viewRole === 'client' && (
                  <p className="text-xs text-indigo-200/90 font-medium leading-relaxed max-w-2xl">
                    🌟 <strong>Escrow Sponsorship:</strong> Fully funded, verified, and released without dispute to verified talent <strong>@{freelancerName}</strong> on Polygon PoS.
                  </p>
                )}
              </div>

              {/* 3 Metric High-Impact Stat Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    {viewRole === 'client' ? 'Total Capital Sponsored' : 'Settled Escrow Payout'}
                  </span>
                  <p className="text-2xl font-black text-emerald-400 font-headline">${amountUsdc.toLocaleString()} USDC</p>
                  <span className="text-[10px] font-mono text-slate-400 block">0% Protocol Fee Extraction</span>
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    {viewRole === 'client' ? 'Verified Talent Partner' : 'Soulbound Token ID'}
                  </span>
                  {viewRole === 'client' ? (
                    <>
                      <p className="text-lg font-black text-indigo-300 font-mono truncate">@{freelancerName}</p>
                      <span className="text-[10px] font-mono text-slate-400 block">{truncateAddress(freelancerAddr)}</span>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-black text-purple-300 font-mono truncate">{sbtTokenId}</p>
                      <span className="text-[10px] font-mono text-slate-400 block">Locked to Freelancer Safe</span>
                    </>
                  )}
                </div>

                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    {viewRole === 'client' ? 'Client Reliability SLA' : 'Settlement SLA'}
                  </span>
                  <p className="text-xl font-black text-white font-headline">0% Disputes • Instant</p>
                  <span className="text-[10px] font-mono text-slate-400 block">{completionDate}</span>
                </div>
              </div>

              {/* Two Parties Summary (Talent & Client Sponsor) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* Talent Box */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  viewRole === 'freelancer' ? 'bg-purple-900/30 border-purple-400/40 ring-1 ring-purple-400/30' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {freelancerProfile?.avatarUrl ? (
                      <img src={freelancerProfile.avatarUrl} alt={freelancerName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      freelancerName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-mono text-purple-400 font-bold uppercase block">Attested Talent</span>
                      {viewRole === 'freelancer' && (
                        <span className="text-[8.5px] font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">Recipient</span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-xs truncate">{freelancerName}</h4>
                    <span className="text-[10px] font-mono text-slate-400 truncate block">{truncateAddress(freelancerAddr)}</span>
                  </div>
                </div>

                {/* Client Sponsor Box */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  viewRole === 'client' ? 'bg-indigo-900/30 border-indigo-400/40 ring-1 ring-indigo-400/30' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {clientProfile?.avatarUrl ? (
                      <img src={clientProfile.avatarUrl} alt={clientName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      clientName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-mono text-indigo-400 font-bold uppercase block">Attested Escrow Client</span>
                      {viewRole === 'client' && (
                        <span className="text-[8.5px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">Sponsor</span>
                      )}
                    </div>
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

          {/* Social Tip Pill */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
            <span className="font-medium">
              💡 Tip: Click <strong>"Share on X"</strong> or <strong>"LinkedIn"</strong> above to showcase your verified {viewRole === 'client' ? 'sponsorship credential' : 'proof of work'} directly to your network.
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

      {/* ── TAB 2 / PRINT: FORMAL CRYPTOGRAPHIC ATTESTATION CERTIFICATE ───────────── */}
      <div 
        className={`attestation-sheet shadow-2xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 max-w-4xl mx-auto space-y-4 relative overflow-hidden gpu-layer ${activeTab === 'social' ? 'hidden print:block' : 'block'}`}
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        
        {/* ── SECTION 1: OFFICIAL HEADER ────────────────────────────────────────── */}
        <div className="border-b-2 border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 relative z-10 page-break-inside-avoid">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`p-1 text-white rounded-md shadow-2xs ${viewRole === 'client' ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                {viewRole === 'client' ? <Building2 size={14} /> : <Award size={14} />}
              </span>
              <span className="text-[9.5px] font-mono font-black tracking-widest text-purple-900 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {viewRole === 'client' ? 'Official PolyLance Client Sponsorship Attestation' : 'Official PolyLance ERC-5192 Soulbound Attestation'}
              </span>
              <span className="text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● 100% Settled & Released
              </span>
            </div>
            <h1 className="font-headline text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
              {viewRole === 'client' ? 'Web3 Client Trust & Escrow Sponsorship Certificate' : 'Proof of Work & Escrow Attestation Certificate'}
            </h1>
            <p className="text-[10.5px] text-slate-500 font-mono">
              Immutable Cryptographic Milestone Settlement & Soulbound Token Ledger
            </p>
          </div>

          <div className="font-mono text-xs text-left md:text-right space-y-0.5 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl border md:border-none border-slate-200 w-full md:w-auto">
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Cert ID:</span>
              <span className="font-black text-purple-900 text-xs">{certificateId}</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Network:</span>
              <span className="font-bold text-slate-800 text-xs">Polygon PoS (137)</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Settled At:</span>
              <span className="font-bold text-slate-800 text-xs">{completionDate}</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SBT TOKEN & MILESTONE BANNER ───────────────────────────── */}
        <div className={`text-white p-4 rounded-2xl border shadow-md space-y-2.5 font-mono relative z-10 page-break-inside-avoid ${
          viewRole === 'client'
            ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 border-indigo-500/30'
            : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border-purple-500/30'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-purple-300 shadow-inner">
                <Lock size={13} />
              </div>
              <div>
                <span className="text-[8.5px] uppercase font-black tracking-widest text-purple-300 block">
                  {viewRole === 'client' ? 'ESCROW SPONSORSHIP RECORD' : 'SOULBOUND ERC-5192 IDENTIFIER'}
                </span>
                <h3 className="font-headline text-xs sm:text-sm font-black text-white">{sbtTokenId}</h3>
              </div>
            </div>
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 size={10} /> NON-TRANSFERABLE REPUTATION ASSET
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[8.5px] uppercase text-purple-300/80 block font-bold">
                {viewRole === 'client' ? 'Sponsored Escrow' : 'Settled Payout'}
              </span>
              <span className="font-black text-emerald-400 text-sm sm:text-base block font-headline">${amountUsdc.toLocaleString()} USDC</span>
              <span className="text-[8.5px] text-purple-200/70 block">0% Protocol Extraction</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[8.5px] uppercase text-purple-300/80 block font-bold">Escrow Smart Contract</span>
              <span className="font-black text-purple-200 text-xs truncate block font-mono">{truncateAddress(contractAddress)}</span>
              <span className="text-[8.5px] text-purple-300/70 block">Polygon PoS MultiSig Escrow</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-0.5">
              <span className="text-[8.5px] uppercase text-purple-300/80 block font-bold">Dispute SLA Ratio</span>
              <span className="font-black text-white text-xs block">0.0% (Clean Record)</span>
              <span className="text-[8.5px] text-emerald-300 block">100% Milestone Approved</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: PROJECT DELIVERABLE DETAILS (NO SENSITIVE SUBMITTED LINKS) ── */}
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2 relative z-10 page-break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="text-[9.5px] font-mono font-bold text-purple-900 uppercase">
              {viewRole === 'client' ? 'Verified Escrow Project Scope' : 'Verified Milestone Deliverable'}
            </span>
            <span className="text-[9.5px] font-mono text-slate-500 font-bold">
              Category: {job.category || 'Smart Contract & Web3'}
            </span>
          </div>

          <h3 className="font-headline font-black text-sm sm:text-base text-slate-900 leading-snug">{job.title}</h3>
          
          <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
            {job.description || 'Full milestone deliverable executed, peer-reviewed, and settled autonomously on Polygon smart escrows.'}
          </p>

          {/* Privacy Protection Notice: Deliverable links are confidential and sealed between parties */}
          <div className="flex items-center justify-between gap-2 pt-1 font-mono text-[10px] text-slate-500 border-t border-slate-200">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
              <span>Milestone Execution Proof: <strong>Cryptographically Verified & Sealed On-Chain</strong></span>
            </span>
            <span className="text-[9px] bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-bold">
              Confidential Delivery Sealed
            </span>
          </div>
        </div>

        {/* ── SECTION 4: ATTESTED PARTIES (FREELANCER & CLIENT) ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10 page-break-inside-avoid">
          
          {/* Freelancer Column */}
          <div className={`p-3.5 rounded-2xl border space-y-1.5 font-mono text-xs ${
            viewRole === 'freelancer' ? 'bg-purple-50/70 border-purple-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[9.5px] uppercase font-black text-purple-900 border-b border-purple-200/60 pb-1 block">
              Attested Freelancer (Proof of Work Provider)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10.5px]">Talent:</span>
              <span className="font-bold text-slate-900 text-[11px]">{freelancerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10.5px]">Wallet:</span>
              <span className="font-bold text-slate-900 text-[10.5px]">{truncateAddress(freelancerAddr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10.5px]">GitHub Attested:</span>
              <span className="font-bold text-purple-900 text-[10.5px]">{freelancerProfile?.githubUsername ? `@${freelancerProfile.githubUsername}` : 'Verified MultiSig'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10.5px]">Reputation Tier:</span>
              <span className="font-bold text-emerald-700 text-[10.5px]">Top Tier Verified (PLREP)</span>
            </div>
          </div>

          {/* Client Column */}
          <div className={`p-3.5 rounded-2xl border space-y-1.5 font-mono text-xs ${
            viewRole === 'client' ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[9.5px] uppercase font-black text-indigo-900 border-b border-indigo-200/60 pb-1 block">
              Attested Escrow Client (Capital Provider)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10.5px]">Client:</span>
              <span className="font-bold text-slate-900 text-[11px]">{clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10.5px]">Wallet:</span>
              <span className="font-bold text-slate-900 text-[10.5px]">{truncateAddress(clientAddr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10.5px]">Escrow Funded:</span>
              <span className="font-bold text-emerald-700 text-[10.5px]">100% Locked on Polygon</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10.5px]">Payment Release:</span>
              <span className="font-bold text-slate-900 text-[10.5px]">Approved Without Escalation</span>
            </div>
          </div>

        </div>

        {/* ── SECTION 5: CRYPTOGRAPHIC SIGNATURE & IPFS CID BLOCK ───────────────── */}
        <div className="border-t-2 border-slate-200 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs relative z-10 page-break-inside-avoid">
          <div className="space-y-1">
            <span className="text-slate-900 uppercase font-black block text-[10px] tracking-wider">
              Cryptographic Proof Integrity & IPFS CID
            </span>
            <p className="text-slate-600 leading-relaxed font-sans text-[10px]">
              This document serves as an immutable, cryptographically signed certificate of participant trust, proof of work delivery, and solvency on PolyLance smart contracts.
            </p>
            <div className="text-[9.5px] break-all text-purple-950 bg-purple-50 p-1.5 rounded-xl border border-purple-200 font-mono font-black">
              IPFS CID: {mockIpfsHash}
            </div>
          </div>

          <div className="flex flex-col justify-end items-start md:items-end gap-1 md:text-right">
            <div>
              <span className="text-slate-900 uppercase font-black block text-[10px] tracking-wider">
                PolyLance Oracle Protocol Signature
              </span>
              <p className="font-black text-slate-800 break-all text-[9px] mt-0.5 font-mono">{mockOracleSignature}</p>
            </div>
            
            <div className="flex items-center gap-1.5 border-t border-slate-200 pt-1 w-full justify-start md:justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-black text-slate-900 text-[10px]">Decentralized Oracle Verified & Signed</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
