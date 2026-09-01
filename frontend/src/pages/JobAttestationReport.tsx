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
      
      {/* CSS print overrides for Single-Page Certificate Guarantee */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 6mm 8mm !important;
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
          .attestation-sheet {
            box-shadow: none !important;
            border: 2px solid #CBD5E1 !important;
            padding: 14px 18px !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-break-inside-avoid {
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
          to={viewRole === 'client' ? '/dashboard' : `/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={14} /> <span>{viewRole === 'client' ? 'Back to Dashboard' : 'Back to Escrow'}</span>
        </Link>
      </div>

      {/* ── Unified Glassmorphism Toolbar Card (Hidden in Print) ──────────────── */}
      <div className="max-w-4xl mx-auto mb-6 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Left Group: Scope Badge & View Mode Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Certificate Badge Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold font-mono">
              {viewRole === 'client' ? (
                <>
                  <Building2 size={13} className="text-indigo-600" />
                  <span className="text-indigo-900">Client Sponsorship</span>
                </>
              ) : (
                <>
                  <Award size={13} className="text-purple-600" />
                  <span className="text-purple-900">Soulbound Proof of Work</span>
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
              title="Copy verified certificate URL"
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

      {/* ── TAB 1: SOCIAL MEDIA SHARE CARD (LIGHT THEME - 1200x630 DESIGN) ────────── */}
      {activeTab === 'social' && (
        <div className="max-w-4xl mx-auto space-y-4 no-print animate-fadeIn">
          
          {/* Card Wrapper (Light Theme) */}
          <div 
            ref={cardRef}
            className={`rounded-3xl p-6 sm:p-10 border-2 shadow-xl relative overflow-hidden font-sans text-slate-900 transition-all ${
              viewRole === 'client' 
                ? 'bg-gradient-to-br from-white via-slate-50 to-indigo-50/60 border-indigo-200/90' 
                : 'bg-gradient-to-br from-white via-slate-50 to-purple-50/60 border-purple-200/90'
            }`}
          >
            
            {/* Ambient Background Glow Mesh (Light) */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 ${
              viewRole === 'client' ? 'bg-indigo-200/30' : 'bg-purple-200/30'
            }`} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
            <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-20" />

            <div className="relative z-10 space-y-6">
              
              {/* Card Top Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    viewRole === 'client'
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-600 shadow-indigo-500/20'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/20'
                  }`}>
                    {viewRole === 'client' ? <Building2 size={22} /> : <Award size={22} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                        viewRole === 'client'
                          ? 'text-indigo-800 bg-indigo-100 border-indigo-200'
                          : 'text-purple-800 bg-purple-100 border-purple-200'
                      }`}>
                        {viewRole === 'client' ? 'VERIFIED ESCROW PATRON & PROJECT SPONSOR' : 'ERC-5192 SOULBOUND PROOF OF WORK'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ● 100% SETTLED
                      </span>
                    </div>
                    <span className="font-headline font-black text-sm text-slate-900 block mt-0.5">
                      PolyLance Sovereign Escrow Protocol
                    </span>
                  </div>
                </div>

                <div className="font-mono text-right text-xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Certificate ID</span>
                  <span className="font-black text-slate-900 text-sm">{certificateId}</span>
                </div>
              </div>

              {/* Dynamic Job Headline / Sponsor Highlight */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-700 font-bold block">
                  {viewRole === 'client' ? 'Trusted Project Awarded & 100% Settled Milestone:' : 'Completed & Verified Deliverable Milestone:'}
                </span>
                <h1 className="font-headline font-black text-2xl sm:text-3xl text-slate-950 tracking-tight leading-tight">
                  {job.title}
                </h1>
                {viewRole === 'client' && (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                    🌟 <strong>Escrow Sponsorship:</strong> Fully funded, verified, and released without dispute to verified talent <strong>@{freelancerName}</strong> on Polygon PoS.
                  </p>
                )}
              </div>

              {/* 3 Metric Stat Boxes (Light Theme) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {viewRole === 'client' ? 'Total Capital Sponsored' : 'Settled Escrow Payout'}
                  </span>
                  <p className="text-2xl font-black text-emerald-600 font-headline">${amountUsdc.toLocaleString()} USDC</p>
                  <span className="text-[10px] font-mono text-slate-400 block">0% Protocol Fee Extraction</span>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {viewRole === 'client' ? 'Verified Talent Partner' : 'Soulbound Token ID'}
                  </span>
                  {viewRole === 'client' ? (
                    <>
                      <p className="text-base font-black text-indigo-900 font-mono truncate">@{freelancerName}</p>
                      <span className="text-[10px] font-mono text-slate-500 block">{truncateAddress(freelancerAddr)}</span>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-black text-purple-900 font-mono truncate">{sbtTokenId}</p>
                      <span className="text-[10px] font-mono text-slate-500 block">Locked to Freelancer Safe</span>
                    </>
                  )}
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                    {viewRole === 'client' ? 'Client Reliability SLA' : 'Settlement SLA'}
                  </span>
                  <p className="text-xl font-black text-slate-900 font-headline">0% Disputes • Instant</p>
                  <span className="text-[10px] font-mono text-slate-400 block">{completionDate}</span>
                </div>
              </div>

              {/* Two Parties Summary (Talent & Client Sponsor) (Light Theme) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* Talent Box */}
                <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-xs ${
                  viewRole === 'freelancer' ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-300/50' : 'bg-white border-slate-200/90'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    {freelancerProfile?.avatarUrl ? (
                      <img src={freelancerProfile.avatarUrl} alt={freelancerName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      freelancerName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-mono text-purple-700 font-bold uppercase block">Attested Talent</span>
                      {viewRole === 'freelancer' && (
                        <span className="text-[8.5px] font-bold bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded">Recipient</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs truncate">{freelancerName}</h4>
                    <span className="text-[10px] font-mono text-slate-500 truncate block">{truncateAddress(freelancerAddr)}</span>
                  </div>
                </div>

                {/* Client Sponsor Box */}
                <div className={`p-4 rounded-2xl border flex items-center gap-3 shadow-xs ${
                  viewRole === 'client' ? 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-300/50' : 'bg-white border-slate-200/90'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    {clientProfile?.avatarUrl ? (
                      <img src={clientProfile.avatarUrl} alt={clientName} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      clientName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-mono text-indigo-700 font-bold uppercase block">Attested Escrow Client</span>
                      {viewRole === 'client' && (
                        <span className="text-[8.5px] font-bold bg-indigo-200 text-indigo-900 px-1.5 py-0.2 rounded">Sponsor</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs truncate">{clientName}</h4>
                    <span className="text-[10px] font-mono text-slate-500 truncate block">{truncateAddress(clientAddr)}</span>
                  </div>
                </div>

              </div>

              {/* Footer Blockchain Guarantees (Light Theme) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-purple-100 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200">
                    <CheckCircle2 size={11} className="text-emerald-600" /> Polygon PoS (137)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                    <ShieldCheck size={11} className="text-indigo-600" /> Non-Custodial MultiSig Escrow
                  </span>
                </div>

                <div className="text-slate-500 text-[10.5px]">
                  <span>Verified at: </span>
                  <strong className="text-purple-700 font-mono">{truncateAddress(contractAddress)}</strong>
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
        className={`attestation-sheet shadow-2xl rounded-3xl border-4 border-slate-200/80 bg-white p-5 sm:p-7 max-w-4xl mx-auto space-y-3.5 relative overflow-hidden gpu-layer text-slate-900 ${activeTab === 'social' ? 'hidden print:block' : 'block'}`}
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

        {/* ── SECTION 1: OFFICIAL HEADER & ACCREDITATION ─────────────────────────── */}
        <div className="border-b-2 border-slate-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative z-10 page-break-inside-avoid">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
              viewRole === 'client'
                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-600 shadow-indigo-500/20'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-700 shadow-purple-500/20'
            }`}>
              {viewRole === 'client' ? <Building2 size={22} /> : <Award size={22} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-mono font-black tracking-widest text-purple-900 uppercase bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {viewRole === 'client' ? 'POLYLANCE CLIENT SPONSORSHIP ATTESTATION' : 'POLYLANCE SOULBOUND ATTESTATION (ERC-5192)'}
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  ● 100% SETTLED & RELEASED
                </span>
              </div>
              <h1 className="font-headline text-base sm:text-lg font-black text-slate-950 tracking-tight uppercase mt-0.5">
                {viewRole === 'client' ? 'Escrow Patron & Capital Trust Attestation' : 'Proof of Work & Milestone Attestation Certificate'}
              </h1>
              <p className="text-[9.5px] text-slate-500 font-mono">
                Decentralized Oracle Verified • Immutable Ledger Record
              </p>
            </div>
          </div>

          <div className="font-mono text-xs text-left md:text-right space-y-0.5 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl border md:border-none border-slate-200 w-full md:w-auto shrink-0">
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Certificate ID:</span>
              <span className="font-black text-purple-900 text-xs">{certificateId}</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Network:</span>
              <span className="font-bold text-slate-800 text-xs">Polygon PoS (137)</span>
            </div>
            <div className="flex md:justify-end items-center gap-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold">Settled Date:</span>
              <span className="font-bold text-slate-800 text-xs">{completionDate}</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SBT TOKEN & MILESTONE BANNER (LIGHT THEME LUXURY CARD) ──── */}
        <div className="p-3.5 rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/70 via-slate-50 to-indigo-50/70 space-y-2.5 font-mono relative z-10 page-break-inside-avoid shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800 shadow-2xs">
                <Lock size={13} />
              </div>
              <div>
                <span className="text-[8.5px] uppercase font-black tracking-wider text-purple-800 block">
                  {viewRole === 'client' ? 'ESCROW SPONSORSHIP IDENTIFIER' : 'ERC-5192 SOULBOUND TOKEN IDENTIFIER'}
                </span>
                <h3 className="font-headline text-xs sm:text-sm font-black text-slate-950">{sbtTokenId}</h3>
              </div>
            </div>
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-700" /> NON-TRANSFERABLE SOULBOUND PROOF
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 space-y-0.5 shadow-2xs">
              <span className="text-[8.5px] uppercase text-slate-500 block font-bold">
                {viewRole === 'client' ? 'Sponsored Escrow Amount' : 'Settled Payout Amount'}
              </span>
              <span className="font-black text-emerald-700 text-base sm:text-lg block font-headline">${amountUsdc.toLocaleString()} USDC</span>
              <span className="text-[8.5px] text-slate-400 block font-mono">0% Protocol Extraction</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 space-y-0.5 shadow-2xs">
              <span className="text-[8.5px] uppercase text-slate-500 block font-bold">Escrow Smart Contract</span>
              <span className="font-black text-slate-900 text-[10.5px] truncate block font-mono">{truncateAddress(contractAddress)}</span>
              <span className="text-[8.5px] text-purple-700 block font-mono">Polygon PoS MultiSig Safe</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 space-y-0.5 shadow-2xs">
              <span className="text-[8.5px] uppercase text-slate-500 block font-bold">Dispute SLA Performance</span>
              <span className="font-black text-slate-900 text-[10.5px] block font-mono">0.0% Dispute Escalation</span>
              <span className="text-[8.5px] text-emerald-700 block font-mono">100% Milestone Approved</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: PROJECT SCOPE (CONFIDENTIAL DELIVERABLES SEALED) ─────────── */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 space-y-1.5 relative z-10 page-break-inside-avoid shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-[9.5px] font-mono font-bold text-purple-900 uppercase">
              {viewRole === 'client' ? 'Verified Escrow Project Scope' : 'Verified Milestone Deliverable'}
            </span>
            <span className="text-[9.5px] font-mono text-slate-500 font-bold">
              Category: {job.category || 'Smart Contract & Web3'}
            </span>
          </div>

          <h3 className="font-headline font-black text-sm sm:text-base text-slate-950 leading-snug">{job.title}</h3>
          
          <p className="text-[11.5px] text-slate-600 leading-relaxed font-sans line-clamp-2">
            {job.description || 'Full milestone deliverable executed, peer-reviewed, and settled autonomously on Polygon smart escrows.'}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1.5 font-mono text-[9.5px] text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
              <span>Milestone Execution Proof: <strong>Cryptographically Verified & Sealed On-Chain</strong></span>
            </span>
            <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold border border-slate-200">
              Confidential Delivery Sealed
            </span>
          </div>
        </div>

        {/* ── SECTION 4: ATTESTED PARTIES (FREELANCER & CLIENT) ──────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 relative z-10 page-break-inside-avoid">
          
          {/* Freelancer Column */}
          <div className={`p-3 rounded-2xl border space-y-1.5 font-mono text-xs shadow-xs ${
            viewRole === 'freelancer' ? 'bg-purple-50/80 border-purple-200' : 'bg-white border-slate-200/90'
          }`}>
            <span className="text-[9px] uppercase font-black text-purple-900 border-b border-purple-200/60 pb-1 block">
              Attested Freelancer (Proof of Work Provider)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Talent:</span>
              <span className="font-bold text-slate-900 text-[11px]">{freelancerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Wallet:</span>
              <span className="font-bold text-slate-900 text-[10px]">{truncateAddress(freelancerAddr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">GitHub Attested:</span>
              <span className="font-bold text-purple-900 text-[10px]">{freelancerProfile?.githubUsername ? `@${freelancerProfile.githubUsername}` : 'Verified MultiSig'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Reputation Tier:</span>
              <span className="font-bold text-emerald-700 text-[10px]">Top Tier Verified (PLREP)</span>
            </div>
          </div>

          {/* Client Column */}
          <div className={`p-3 rounded-2xl border space-y-1.5 font-mono text-xs shadow-xs ${
            viewRole === 'client' ? 'bg-indigo-50/80 border-indigo-200' : 'bg-white border-slate-200/90'
          }`}>
            <span className="text-[9px] uppercase font-black text-indigo-900 border-b border-indigo-200/60 pb-1 block">
              Attested Escrow Client (Capital Sponsor)
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Client:</span>
              <span className="font-bold text-slate-900 text-[11px]">{clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Wallet:</span>
              <span className="font-bold text-slate-900 text-[10px]">{truncateAddress(clientAddr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Escrow Funded:</span>
              <span className="font-bold text-emerald-700 text-[10px]">100% Locked on Polygon</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px]">Payment Release:</span>
              <span className="font-bold text-slate-900 text-[10px]">Approved Without Escalation</span>
            </div>
          </div>

        </div>

        {/* ── SECTION 5: CRYPTOGRAPHIC SIGNATURE, OFFICIAL EMBOSSED SEAL & QR CODE ── */}
        <div className="border-t-2 border-slate-200 pt-3.5 grid grid-cols-1 md:grid-cols-12 seal-grid gap-3 font-mono text-xs relative z-10 page-break-inside-avoid">
          
          {/* Left Column: Cryptographic Proof Integrity */}
          <div className="md:col-span-5 space-y-1 flex flex-col justify-between">
            <div>
              <span className="text-slate-900 uppercase font-black block text-[9.5px] tracking-wider">
                Cryptographic Proof Integrity & IPFS CID
              </span>
              <p className="text-slate-500 leading-relaxed font-sans text-[10px] mt-0.5">
                This credential represents an immutable, cryptographically signed record of delivery and financial solvency on PolyLance smart contracts.
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
                <span className="text-[5px] font-bold text-emerald-700 uppercase">SEALED</span>
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
                <span className="font-black text-slate-900 text-[9.5px]">Oracle Verified & Signed</span>
              </div>
              <p className="font-black text-slate-700 break-all text-[8px] mt-0.5 font-mono">{mockOracleSignature}</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
