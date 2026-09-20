import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toPng, toBlob } from 'html-to-image';
import { usePolyLanceData, getBackendSyncUrl, getSyncEndpoints } from '../context/PolyLanceDataContext';
import { useWeb3 } from '../context/Web3Context';
import { 
  ShieldCheck, Award, FileText, Calendar, CheckCircle2, 
  Printer, ArrowLeft, Building2, Sparkles, Clock, Globe, 
  Copy, Check, ExternalLink, Share2, Twitter, Linkedin,
  Coins, Briefcase, Zap, Star, Lock, QrCode, ArrowUpRight,
  Download, Eye, Layers, UserCheck, CheckCheck, Shield, User,
  FileBadge, CheckSquare, HeartHandshake, Flame, Image as ImageIcon, Loader2,
  Hexagon, Link2, Info, ChevronRight, BarChart3, Search, X, Filter,
  SlidersHorizontal, ArrowUpDown, ChevronDown, LogIn
} from 'lucide-react';
import { PolyLanceLogo } from '../components/PolyLanceLogo';
import { LoginModal } from '../components/LoginModal';
import { truncateAddress, generateDeterministicHash, getCanonicalCertificateId, getCertifiedPassVerifyUrl, getPolygonScanUrl, formatWeb3ErrorMessage } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';
import { generateCode128Bars } from '../utils/barcode';
import polylanceLogoImg from '../assets/polylanceLogo.png';
import { Job } from '../types';

export const JobAttestationReport: React.FC = () => {
  const { id: jobIdParam } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryRole = searchParams.get('role');
  const { jobs, profiles, releasePayment } = usePolyLanceData();
  const { address: userAddress, currentRole } = useWeb3();
  const navigate = useNavigate();

  const isVisitorUser = !userAddress || currentRole === 'visitor';

  // UI States
  const [activeTab, setActiveTab] = useState<'social' | 'certificate'>('social');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCertId, setCopiedCertId] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const certSectionRef = useRef<HTMLDivElement>(null);

  // Gallery & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'freelancer' | 'client'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'highest' | 'oldest'>('latest');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobIdParam || null);
  const [syncedJobs, setSyncedJobs] = useState<Job[]>([]);

  // Sync jobs from backend on mount
  useEffect(() => {
    let mounted = true;
    const endpoints = getSyncEndpoints();
    
    const fetchSync = async () => {
      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(`${endpoint}/api/sync`, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            if (mounted && data && Array.isArray(data.jobs)) {
              setSyncedJobs(data.jobs);
              break;
            }
          }
        } catch (_) {}
      }
    };

    fetchSync();
    return () => { mounted = false; };
  }, []);

  // Synchronize URL param with selected job
  useEffect(() => {
    if (jobIdParam) {
      setSelectedJobId(jobIdParam);
    }
  }, [jobIdParam]);

  // ── DATA PROTECTION: ONLY LOAD THE CONNECTED USER'S OWN COMPLETED CERTIFICATES ──
  const userCompletedJobs = useMemo(() => {
    if (!userAddress) return [];
    const lowerUser = userAddress.toLowerCase();
    const map = new Map<string, Job>();

    // 1. Context jobs where user is client or talent
    jobs.forEach((j) => {
      if (
        (j.status === 'Completed' || j.status === 'Submitted') &&
        (j.freelancer?.toLowerCase() === lowerUser || j.client?.toLowerCase() === lowerUser)
      ) {
        map.set(j.id.toLowerCase(), j);
      }
    });

    // 2. Synced jobs from backend where user is client or talent
    syncedJobs.forEach((j: any) => {
      if (
        (j.status === 'Completed' || j.status === 'Submitted') &&
        (j.freelancer?.toLowerCase() === lowerUser || j.client?.toLowerCase() === lowerUser) &&
        !map.has(j.id.toLowerCase())
      ) {
        map.set(j.id.toLowerCase(), j);
      }
    });

    return Array.from(map.values());
  }, [jobs, syncedJobs, userAddress]);

  // If a specific certificate is requested via direct link (e.g. /attestation/:id), resolve that specific job
  const directLinkedJob = useMemo(() => {
    if (!jobIdParam) return null;
    const raw = jobIdParam.trim();
    const lower = raw.toLowerCase();
    const cleanParam = lower
      .replace(/^pl-sbt-job-/i, '')
      .replace(/^sbt-/i, '')
      .replace(/^job-/i, '')
      .trim();

    const findMatch = (list: any[]) => {
      if (!Array.isArray(list)) return null;
      return list.find((j) => {
        if (!j) return false;
        const jId = (j.id || '').toLowerCase().trim();
        const jContract = (j.contractAddress || '').toLowerCase().trim();
        const jCert = getCanonicalCertificateId(j.id, j.contractAddress).toLowerCase().trim();
        const jCleanId = jId.replace(/^job-/i, '');
        const cleanParamNoHex = cleanParam.replace(/^0x/i, '');
        const jContractNoHex = jContract.replace(/^0x/i, '');
        const jIdNoHex = jId.replace(/^0x/i, '');

        return (
          jId === lower ||
          jContract === lower ||
          jCert === lower ||
          jId === cleanParam ||
          jCleanId === cleanParam ||
          jContract === cleanParam ||
          (cleanParamNoHex.length >= 4 && (
            jContractNoHex.includes(cleanParamNoHex) ||
            cleanParamNoHex.includes(jContractNoHex) ||
            jIdNoHex.includes(cleanParamNoHex) ||
            cleanParamNoHex.includes(jIdNoHex)
          ))
        );
      });
    };

    const fromContext = findMatch(jobs);
    if (fromContext) return fromContext;
    const fromSynced = findMatch(syncedJobs);
    if (fromSynced) return fromSynced;

    // Check localStorage fallback
    try {
      const stored = localStorage.getItem('polylance_jobs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const fromStored = findMatch(parsed);
          if (fromStored) return fromStored;
        }
      }
    } catch (_) {}

    // Fallback for demo certs if entered directly
    if (cleanParam === '101' || lower.includes('job-101')) {
      return {
        id: '101',
        title: 'Solidity Reentrancy & Flash Loan Arbitrage Audit',
        description: 'Comprehensive smart contract security audit against flash loan attack vectors.',
        category: 'backend',
        client: '0x71c8366420a092c55660830e8115e9a44390001',
        freelancer: '0x88aa0398b91a150b041da819bc954bb356e009dd',
        amountUsdc: '500.00',
        amountEth: '0.25',
        paymentToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        paymentTokenSymbol: 'USDC',
        paymentTokenDecimals: 6,
        status: 'Completed',
        contractAddress: '0x22A61f83cEB94233d30a20EEacBdEB9BCC1C2879',
        createdAt: 1787301836668,
        completedAt: 1787576392906,
        sbtTokenId: 101,
        reviewPeriodDays: 3,
        applications: [],
        events: [
          { step: 'Completed', actor: 'Client', title: 'Payment Released (100%)', status: 'completed', txHash: '0x7a89b3f12c98d45e76a1098b12f45c90812e34d567a89b012c34d56e78f901ab', timestamp: 1787576392906 },
          { step: 'Minted', actor: 'JobFactory', title: 'Mint Reputation SBT', status: 'completed', txHash: '0x1f9240c89b3672fbe85f3c194ccdb182122ec3aa6f12279d35c442af4c905326', timestamp: 1787576392906 }
        ]
      } as unknown as Job;
    }

    return null;
  }, [jobs, syncedJobs, jobIdParam]);

  // Helper to extract canonical timestamp for sorting
  const getJobTimestamp = (j: Job): number => {
    const completedEvt = j.events?.find((e: any) => e.step === 'Completed');
    if (completedEvt?.timestamp) return completedEvt.timestamp;
    if (j.completedAt) return j.completedAt;
    if (j.submittedAt) return j.submittedAt;
    if (j.createdAt) return j.createdAt;
    return 0;
  };

  // Filter and sort user's attestations based on latest certs and search query
  const filteredAndSortedJobs = useMemo(() => {
    let list = userCompletedJobs;
    const lowerUser = (userAddress || '').toLowerCase();

    // 1. Role filter tabs
    if (filterTab === 'freelancer' && lowerUser) {
      list = list.filter((j) => j.freelancer?.toLowerCase() === lowerUser);
    } else if (filterTab === 'client' && lowerUser) {
      list = list.filter((j) => j.client?.toLowerCase() === lowerUser);
    }

    // 2. Search query filtering (strictly within user's own certs)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((j) => {
        const title = (j.title || '').toLowerCase();
        const certId = getCanonicalCertificateId(j.id, j.contractAddress).toLowerCase();
        const id = (j.id || '').toLowerCase();
        const client = (j.client || '').toLowerCase();
        const freelancer = (j.freelancer || '').toLowerCase();
        const category = (j.category || '').toLowerCase();
        const amount = (j.amountUsdc || '').toLowerCase();

        const cProfile = profiles[client];
        const fProfile = profiles[freelancer];
        const cName = (cProfile?.displayName || '').toLowerCase();
        const fName = (fProfile?.displayName || '').toLowerCase();

        return (
          title.includes(q) ||
          certId.includes(q) ||
          id.includes(q) ||
          client.includes(q) ||
          freelancer.includes(q) ||
          category.includes(q) ||
          amount.includes(q) ||
          cName.includes(q) ||
          fName.includes(q)
        );
      });
    }

    // 3. Sorting (Default: User's Latest Certs First)
    return [...list].sort((a, b) => {
      if (sortBy === 'highest') {
        return parseFloat(b.amountUsdc || '0') - parseFloat(a.amountUsdc || '0');
      }
      if (sortBy === 'oldest') {
        return getJobTimestamp(a) - getJobTimestamp(b);
      }
      // Latest certs first
      return getJobTimestamp(b) - getJobTimestamp(a);
    });
  }, [userCompletedJobs, filterTab, searchQuery, sortBy, userAddress, profiles]);

  // Current active job for detailed certificate report
  const activeJob = useMemo(() => {
    // 1. If direct link with parameter (/attestation/:id), prioritize that exact requested job!
    if (directLinkedJob) return directLinkedJob;

    // 2. If user selected a specific job from their gallery
    if (selectedJobId) {
      const lower = selectedJobId.toLowerCase();
      const cleanSel = lower.replace(/^pl-sbt-job-/i, '').replace(/^job-/i, '');
      const foundInUser = userCompletedJobs.find(
        (j) => j.id.toLowerCase() === lower ||
               j.contractAddress?.toLowerCase() === lower ||
               j.id.toLowerCase() === cleanSel ||
               getCanonicalCertificateId(j.id, j.contractAddress).toLowerCase() === lower
      );
      if (foundInUser) return foundInUser;
    }

    // 3. Default to user's latest certificate
    return filteredAndSortedJobs[0] || userCompletedJobs[0] || null;
  }, [selectedJobId, userCompletedJobs, directLinkedJob, filteredAndSortedJobs]);

  const job = activeJob;
  const isCompleted = job?.status === 'Completed';

  // Handler to select cert and smoothly redirect/scroll to it below
  const handleSelectAndScrollToCert = (jobId: string) => {
    setSelectedJobId(jobId);
    setTimeout(() => {
      const certEl = document.getElementById('detailed-certificate-section') || cardRef.current;
      if (certEl) {
        certEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Release payment handler
  const handleApproveAndMint = async () => {
    if (!job) return;
    setIsReleasing(true);
    setActionError(null);
    try {
      await releasePayment(job.id);
      setShareToast('🎉 Escrow released & Soulbound SBT Certificate successfully minted!');
      setTimeout(() => setShareToast(null), 5000);
      setShowPreview(false);
    } catch (err: any) {
      console.error('Error releasing escrow from attestation page:', err);
      setActionError(formatWeb3ErrorMessage(err));
    } finally {
      setIsReleasing(false);
    }
  };

  // User addresses & profiles
  const clientAddr = job?.client || '0xB8aa0398b91a150b041da819bc954bb356e009Dd';
  const freelancerAddr =
    job?.freelancer ||
    job?.applications?.[0]?.applicant ||
    '0x25F6c8366420a092c55660830e8115e9a44395e9A';

  const clientProfileKey = Object.keys(profiles).find(
    (k) => k.toLowerCase() === clientAddr.toLowerCase()
  );
  const clientProfile = clientProfileKey ? profiles[clientProfileKey] : null;

  const freelancerProfileKey = Object.keys(profiles).find(
    (k) => k.toLowerCase() === freelancerAddr.toLowerCase()
  );
  const freelancerProfile = freelancerProfileKey ? profiles[freelancerProfileKey] : null;

  const clientName = clientProfile?.displayName || 'Sunny Pasumarthi';
  const freelancerName = freelancerProfile?.displayName || 'Akhil Muvva';

  // Role perspective
  const isUserClient = useMemo(() => {
    if (queryRole === 'client') return true;
    if (queryRole === 'freelancer') return false;
    if (!userAddress) return currentRole === 'client';
    const lowerUser = userAddress.toLowerCase();
    if (job?.client && job.client.toLowerCase() === lowerUser) return true;
    if (job?.freelancer && job.freelancer.toLowerCase() === lowerUser) return false;
    return currentRole === 'client';
  }, [userAddress, currentRole, job, queryRole]);

  const viewRole: 'freelancer' | 'client' = isUserClient ? 'client' : 'freelancer';

  const amountUsdc = parseFloat(job?.amountUsdc || '5.05');
  const contractAddress = job?.contractAddress || '0xcf3665d90001e9a443900990cf3665d900019550';
  const sbtTokenId =
    viewRole === 'client'
      ? `#SBT-PATRON-${(job?.id || 'PL-001').slice(0, 8).toUpperCase()}`
      : `#SBT-WORK-${(job?.id || 'PL-001').slice(0, 8).toUpperCase()}`;

  const certificateId = useMemo(() => {
    if ((job as any)?.certificateId) return String((job as any).certificateId).trim();
    return getCanonicalCertificateId(job?.id, job?.contractAddress);
  }, [job]);

  const certifiedPassVerifyUrl = getCertifiedPassVerifyUrl(certificateId);

  // Settlement tx hash
  const fundEscrowTxHash = useMemo(() => {
    const completedEvt = job?.events?.find((e: any) => e.step === 'Completed' && e.txHash);
    if (completedEvt?.txHash) return completedEvt.txHash;
    const fundedEvt = job?.events?.find((e: any) => e.step === 'Funded' && e.txHash);
    if (fundedEvt?.txHash) return fundedEvt.txHash;
    const postedEvt = job?.events?.find((e: any) => e.step === 'Posted' && e.txHash);
    if (postedEvt?.txHash) return postedEvt.txHash;
    return generateDeterministicHash(
      `polygon-escrow-settlement:${job?.id || 'job'}:${job?.contractAddress || 'contract'}`
    );
  }, [job]);

  const polygonScanTxUrl = useMemo(() => {
    return getPolygonScanUrl(fundEscrowTxHash);
  }, [fundEscrowTxHash]);

  const barcodeData = useMemo(() => {
    return generateCode128Bars(polygonScanTxUrl);
  }, [polygonScanTxUrl]);

  const barcodeSerial = useMemo(() => {
    const rawJobId = String(job?.id || '001')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-4)
      .padStart(4, '0')
      .toUpperCase();
    const ts = job?.createdAt
      ? new Date(job.createdAt)
      : job?.events?.[0]?.timestamp
      ? new Date(job.events[0].timestamp)
      : new Date(1787301836668);
    const yr = ts.getFullYear();
    const mo = String(ts.getMonth() + 1).padStart(2, '0');
    const day = String(ts.getDate()).padStart(2, '0');
    return `PL-${yr}-${mo}${day}-${rawJobId}`;
  }, [job]);

  const completionDate = job?.events?.find((e: any) => e.step === 'Completed')?.timestamp
    ? new Date(
        job.events.find((e: any) => e.step === 'Completed')!.timestamp
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const shareOrigin =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? window.location.origin
      : 'https://polylance.codes';

  const shareTargetId = job?.id || jobIdParam || 'job';
  const roleQuery = viewRole ? `&role=${viewRole}` : '';
  const shareUrl = `${shareOrigin}/?attestation=${encodeURIComponent(
    shareTargetId
  )}${roleQuery}#/attestation/${encodeURIComponent(shareTargetId)}${
    viewRole ? `?role=${viewRole}` : ''
  }`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setShareToast('📋 Certificate verification link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
    setTimeout(() => setShareToast(null), 4000);
  };

  const handleCopyCertId = () => {
    navigator.clipboard.writeText(certificateId.trim());
    setCopiedCertId(true);
    setShareToast(`📋 Canonical Certificate ID copied: ${certificateId}`);
    setTimeout(() => setCopiedCertId(false), 2500);
    setTimeout(() => setShareToast(null), 4000);
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
      setShareToast('🎨 HD Certificate image downloaded! Ready to attach to your post.');
      setTimeout(() => setShareToast(null), 5000);
    } catch (err) {
      console.error('Error generating card image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Social Media Sharing: X (Twitter)
  const handleShareTwitter = async (targetJob?: Job) => {
    const activeTarget = targetJob || job;
    if (!activeTarget) return;

    const certId = getCanonicalCertificateId(activeTarget.id, activeTarget.contractAddress);
    const amount = parseFloat(activeTarget.amountUsdc || '0').toLocaleString();
    const cAddr = activeTarget.client || '';
    const fAddr = activeTarget.freelancer || '';
    const cProfile = profiles[cAddr.toLowerCase()];
    const fProfile = profiles[fAddr.toLowerCase()];
    const cName = cProfile?.displayName || truncateAddress(cAddr);
    const fName = fProfile?.displayName || truncateAddress(fAddr);
    const sbtToken = `#SBT-WORK-${(activeTarget.id || 'PL-001').slice(0, 8).toUpperCase()}`;

    const targetUrl = `${shareOrigin}/?attestation=${encodeURIComponent(
      activeTarget.id
    )}#/attestation/${encodeURIComponent(activeTarget.id)}`;

    // If active in view, attempt to export and download card image
    if (cardRef.current && (!targetJob || targetJob.id === job?.id)) {
      try {
        const dataUrl = await toPng(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `PolyLance-${certId}.png`;
        link.href = dataUrl;
        link.click();

        const blob = await toBlob(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        }
      } catch (err) {
        console.warn('Could not auto-export card image:', err);
      }
    }

    setShareToast('🚀 Opening X to share your verified certificate! Image downloaded.');
    setTimeout(() => setShareToast(null), 6000);

    const isClientRole =
      userAddress &&
      activeTarget.client &&
      activeTarget.client.toLowerCase() === userAddress.toLowerCase();

    const text = isClientRole
      ? encodeURIComponent(
          `🏛️ Trusted Milestone Settlement on @PolyLanceProtocol!\n\n` +
            `Proud to sponsor & settle "${activeTarget.title || 'Web3 Project'}" for $${amount} USDC with verified talent @${fName}!\n\n` +
            `🔒 100% Sovereign MultiSig Escrow • 0% Protocol Fees\n` +
            `📜 Verified Certificate: ${certId}\n\n` +
            `Verify on-chain:`
        )
      : encodeURIComponent(
          `🚀 Proof of Work Attested & Settled on @PolyLanceProtocol!\n\n` +
            `📌 Completed: "${activeTarget.title || 'Web3 Milestone'}"\n` +
            `💰 Payout: $${amount} USDC Settled on @0xPolygon\n` +
            `📜 Soulbound Token (ERC-5192): ${sbtToken}\n` +
            `🤝 Attested Client: @${cName}\n\n` +
            `Verify cryptographic attestation:`
        );

    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(targetUrl)}`,
      '_blank'
    );
  };

  // Direct Social Media Sharing: LinkedIn
  const handleShareLinkedIn = async (targetJob?: Job) => {
    const activeTarget = targetJob || job;
    if (!activeTarget) return;

    const certId = getCanonicalCertificateId(activeTarget.id, activeTarget.contractAddress);
    const targetUrl = `${shareOrigin}/?attestation=${encodeURIComponent(
      activeTarget.id
    )}#/attestation/${encodeURIComponent(activeTarget.id)}`;

    if (cardRef.current && (!targetJob || targetJob.id === job?.id)) {
      try {
        const dataUrl = await toPng(cardRef.current, { quality: 0.98, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `PolyLance-${certId}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.warn('Could not auto-export card image:', err);
      }
    }

    setShareToast('💼 Opening LinkedIn! HD Certificate downloaded to attach to your post.');
    setTimeout(() => setShareToast(null), 6000);

    const url = encodeURIComponent(targetUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // ── CASE 1: USER NOT CONNECTED AND NO DIRECT PARAM ─────────────────────────
  if (!userAddress && !jobIdParam) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <Lock size={30} className="text-blue-600" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
              ● Protected Vault • User Specific
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-headline tracking-tight">
              Connect to View Attestations
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In accordance with PolyLance cryptographic data protection standards, Soulbound Token (SBT) attestations and private reputation passes are strictly scoped to your wallet.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
            >
              <LogIn size={16} />
              <span>Connect Wallet to Access Certs</span>
            </button>
          </div>
        </div>

        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    );
  }

  // ── CASE 2: USER CONNECTED BUT HAS ZERO COMPLETED CERTIFICATES ──────────────
  if (userAddress && userCompletedJobs.length === 0 && !directLinkedJob) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldCheck size={32} className="text-blue-600" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block">
              ● Wallet: {truncateAddress(userAddress)}
            </span>
            <h2 className="text-2xl font-black text-slate-900 font-headline tracking-tight">
              No Attestations Issued Yet
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            You currently have 0 completed milestones under your connected wallet. Once you complete a project as talent or sponsor a milestone as client, your immutable Soulbound Token certificates will be automatically minted and displayed here.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              to="/jobs"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Briefcase size={14} />
              <span>Find Jobs</span>
            </Link>
            <Link
              to="/dashboard"
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="attestation-sheet-wrapper min-h-screen bg-[#F6F9FC] py-6 px-3 sm:px-6 lg:px-8 font-sans text-slate-900 selection:bg-purple-600 selection:text-white">
      
      {/* CSS print overrides for Single-Page Certificate Guarantee */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600&family=Space+Grotesk:wght@500;600;700&display=swap');

        .font-certificate-title {
          font-family: 'Cinzel', 'Playfair Display', Georgia, 'Times New Roman', serif;
        }

        @page {
          size: A4 portrait;
          margin: 0mm !important;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, header, footer, [role="navigation"], .bottom-tab-bar, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            min-height: 0 !important;
          }
          html, body, #root {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            background: #FFFFFF !important;
          }
          .attestation-sheet-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            min-height: 0 !important;
            display: block !important;
          }
          .attestation-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            min-height: 297mm !important;
            padding: 6.5mm 8.5mm !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            break-inside: avoid !important;
            break-after: avoid !important;
            break-before: avoid !important;
            overflow: hidden !important;
            position: relative !important;
          }
        }
      `}</style>

      {/* ── USER'S ATTESTATION GALLERY & SEARCH HUB (Only User's Certs) ────── */}
      {userCompletedJobs.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6 space-y-4 no-print">
          {/* Hero Banner for User's Attestation Vault */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden border border-slate-800">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono font-semibold">
                  <ShieldCheck size={14} className="text-blue-400" />
                  <span>Personal Attestation Vault • {truncateAddress(userAddress || '')}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-headline">
                  My Soulbound Attestations
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  Your decentralized proof-of-work certificates and client milestone sponsorships, permanently anchored to Polygon.
                </p>
              </div>

              {/* User Stats Badges */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 text-center min-w-[100px]">
                  <div className="text-lg sm:text-xl font-mono font-bold text-white">
                    {userCompletedJobs.length}
                  </div>
                  <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                    My Certificates
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 text-center min-w-[110px]">
                  <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400">
                    ${userCompletedJobs.reduce((acc, j) => acc + parseFloat(j.amountUsdc || '0'), 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                    Settled Volume
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & User Organization Controls */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your certificates by ID, milestone title, counterparty, amount..."
                  className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <ArrowUpDown size={14} className="text-slate-500 hidden sm:block" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer focus:outline-hidden"
                >
                  <option value="latest">Latest Issued (Newest First)</option>
                  <option value="highest">Highest Settled ($)</option>
                  <option value="oldest">Oldest Milestone</option>
                </select>
              </div>
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterTab === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>All My Certs</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {userCompletedJobs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('freelancer')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterTab === 'freelancer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Award size={12} />
                <span>Proof of Work (As Talent)</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('client')}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterTab === 'client'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Building2 size={12} />
                <span>Patronage (As Client)</span>
              </button>
            </div>
          </div>

          {/* Certificate Cards Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
              <span>
                Showing {filteredAndSortedJobs.length} {filteredAndSortedJobs.length === 1 ? 'certificate' : 'certificates'} (sorted by latest)
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAndSortedJobs.map((j) => {
                const certId = getCanonicalCertificateId(j.id, j.contractAddress);
                const isSelected = activeJob?.id.toLowerCase() === j.id.toLowerCase();
                const dateStr = j.events?.find((e: any) => e.step === 'Completed')?.timestamp
                  ? new Date(j.events.find((e: any) => e.step === 'Completed')!.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : new Date(j.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                const isClient = userAddress && j.client && j.client.toLowerCase() === userAddress.toLowerCase();

                return (
                  <div
                    key={j.id}
                    onClick={() => handleSelectAndScrollToCert(j.id)}
                    className={`rounded-2xl p-3.5 transition-all border flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Top Row: Cert ID & Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10.5px] font-mono font-bold truncate max-w-[170px]">
                          <Award size={11} className="text-blue-600 shrink-0" />
                          <span className="truncate">{certId}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {dateStr}
                        </span>
                      </div>

                      {/* Job Title */}
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                        {j.title}
                      </h3>

                      {/* Payout & Role */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-mono font-extrabold text-emerald-700">
                          ${parseFloat(j.amountUsdc || '0').toLocaleString()} USDC
                        </span>
                        <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {isClient ? 'Patronage' : 'Proof of Work'}
                        </span>
                      </div>
                    </div>

                    {/* Actions: View Cert (Redirect/Scrolls down) & Social Share */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndScrollToCert(j.id);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Viewing Below ↓' : 'View Cert ↓'}
                      </button>

                      {/* Direct 1-Click Share to X */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareTwitter(j);
                        }}
                        title="Share directly to X"
                        className="p-1.5 rounded-xl bg-[#0F1419] hover:bg-black text-white transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 shadow-2xs"
                      >
                        <Twitter size={13} className="fill-current" />
                      </button>

                      {/* Direct 1-Click Share to LinkedIn */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareLinkedIn(j);
                        }}
                        title="Share directly to LinkedIn"
                        className="p-1.5 rounded-xl bg-[#0077B5] hover:bg-[#006097] text-white transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 shadow-2xs"
                      >
                        <Linkedin size={13} className="fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredAndSortedJobs.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
                <Award size={36} className="text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-800">No matching certificates found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  None of your certificates matched &quot;{searchQuery}&quot;. Try clearing filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterTab('all');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 cursor-pointer"
                >
                  Reset Search Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DETAILED CERTIFICATE SECTION (Anchor Target for Scroll) ────────── */}
      {job && (
        <div id="detailed-certificate-section" ref={certSectionRef} className="scroll-mt-24 pt-2">
          {/* Action Toolbar for Active Certificate */}
          <div className="max-w-5xl mx-auto mb-4 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2.5 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Left: Cert identity badge & verification links */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold font-mono">
                  {viewRole === 'client' ? (
                    <>
                      <Building2 size={13} className="text-indigo-600" />
                      <span className="text-indigo-900">Client Sponsorship</span>
                    </>
                  ) : (
                    <>
                      <Award size={13} className="text-blue-600" />
                      <span className="text-blue-900">Soulbound Proof of Work</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopyCertId}
                  title="Click to copy canonical Certificate ID"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-950 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-3xs"
                >
                  <span>{certificateId}</span>
                  {copiedCertId ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                </button>

                <a
                  href={certifiedPassVerifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Verify certificate directly on CertifiedPass"
                  className="bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-3xs transition-all hover:scale-102 cursor-pointer active:scale-95 shrink-0"
                >
                  <span>Verify on CertifiedPass</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              {/* Right: Social Sharing & Export Actions */}
              <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                {/* Direct Share to X */}
                <button
                  type="button"
                  onClick={() => handleShareTwitter()}
                  title="Share on X (Twitter)"
                  className="bg-[#0f1419] hover:bg-black text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-3xs transition-all hover:scale-102 cursor-pointer active:scale-95 shrink-0"
                >
                  <Twitter size={12} className="fill-current text-white" />
                  <span>Share on X</span>
                </button>

                {/* Direct Share to LinkedIn */}
                <button
                  type="button"
                  onClick={() => handleShareLinkedIn()}
                  title="Share on LinkedIn"
                  className="bg-[#0077b5] hover:bg-[#006097] text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-3xs transition-all hover:scale-102 cursor-pointer active:scale-95 shrink-0"
                >
                  <Linkedin size={12} className="fill-current text-white" />
                  <span>LinkedIn</span>
                </button>

                {/* Download HD Card PNG */}
                <button
                  type="button"
                  onClick={handleDownloadCardImage}
                  disabled={isExporting}
                  title="Download high-resolution PNG Certificate"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-3xs transition-all hover:scale-102 cursor-pointer active:scale-95 shrink-0"
                >
                  <Download size={12} />
                  <span>{isExporting ? 'Exporting...' : 'Save PNG'}</span>
                </button>

                {/* Copy Universal Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy verified certificate link"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  {copiedLink ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedLink ? 'Copied!' : 'Link'}</span>
                </button>

                {/* Print / Save PDF */}
                <button
                  type="button"
                  onClick={handlePrint}
                  title="Print full official certificate"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all hover:scale-102 active:scale-95 shrink-0"
                >
                  <Printer size={12} />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Dynamic Toast Feedback */}
            {shareToast && (
              <div className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between gap-2 animate-fadeIn shadow-3xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-600 shrink-0" />
                  <span className="font-semibold">{shareToast}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShareToast(null)} 
                  className="font-bold text-blue-700 hover:text-blue-900 underline text-[11px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* ── THE OFFICIAL VERIFIED ESCROW CERTIFICATE SHEET ── */}
          <div 
            ref={cardRef}
            id="polylance-escrow-certificate"
            className="attestation-sheet relative mx-auto bg-[#FFFFFF] text-[#101936] font-sans box-border overflow-hidden select-text flex flex-col justify-between"
            style={{
              width: '100%',
              maxWidth: '794px',
              aspectRatio: '210 / 297',
              padding: '24px 28px',
              boxShadow: '0 25px 60px -15px rgba(37, 99, 235, 0.12), 0 0 0 1px rgba(216, 229, 245, 0.8)',
            }}
          >
            {/* Guilloche Security Border & Watermarks (Vector SVG) */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden" 
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="certBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#0284C7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.9" />
                </linearGradient>

                <linearGradient id="plWatermarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>

                <pattern id="bgSecurityWaves" width="120" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 0 5 Q 30 0 60 5 T 120 5" fill="none" stroke="#BAE6FD" strokeWidth="0.45" opacity="0.45" />
                  <path d="M 0 10 Q 30 15 60 10 T 120 10" fill="none" stroke="#93C5FD" strokeWidth="0.4" opacity="0.4" />
                  <path d="M 0 15 Q 30 10 60 15 T 120 15" fill="none" stroke="#BAE6FD" strokeWidth="0.45" opacity="0.45" />
                </pattern>

                <pattern id="guillocheRibbonH" width="28" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 0 8 C 7 0 14 0 21 8 C 28 16 35 16 42 8" fill="none" stroke="#1D4ED8" strokeWidth="0.85" opacity="0.75" />
                  <path d="M 0 8 C 7 16 14 16 21 8 C 28 0 35 0 42 8" fill="none" stroke="#0284C7" strokeWidth="0.85" opacity="0.75" />
                  <path d="M 7 8 C 14 2 21 2 28 8 C 35 14 42 14 49 8" fill="none" stroke="#38BDF8" strokeWidth="0.6" opacity="0.65" />
                  <path d="M 7 8 C 14 14 21 14 28 8 C 35 2 42 2 49 8" fill="none" stroke="#60A5FA" strokeWidth="0.6" opacity="0.65" />
                </pattern>

                <pattern id="guillocheRibbonV" width="16" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 C 0 7 0 14 8 21 C 16 28 16 35 8 42" fill="none" stroke="#1D4ED8" strokeWidth="0.85" opacity="0.75" />
                  <path d="M 8 0 C 16 7 16 14 8 21 C 0 28 0 35 8 42" fill="none" stroke="#0284C7" strokeWidth="0.85" opacity="0.75" />
                  <path d="M 8 7 C 2 14 2 21 8 28 C 14 35 14 42 8 49" fill="none" stroke="#38BDF8" strokeWidth="0.6" opacity="0.65" />
                  <path d="M 8 7 C 14 14 14 21 8 28 C 2 35 2 42 8 49" fill="none" stroke="#60A5FA" strokeWidth="0.6" opacity="0.65" />
                </pattern>

                <g id="cornerRosetteG">
                  <path d="M 0 0 L 52 0 L 0 52 Z" fill="#EFF6FF" opacity="0.7" />
                  <path d="M 0 10 L 42 0 M 0 18 L 34 0 M 0 26 L 26 0 M 0 34 L 18 0 M 0 42 L 10 0" stroke="#0284C7" strokeWidth="0.5" opacity="0.6" />
                  <path d="M 0 0 L 54 0 M 0 0 L 0 54" stroke="#1E3A8A" strokeWidth="2.4" />
                  <path d="M 4 4 L 50 4 M 4 4 L 4 50" stroke="#38BDF8" strokeWidth="1" opacity="0.7" />
                  <g transform="translate(24, 24)">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <ellipse key={i} cx="0" cy="0" rx="18" ry="6" fill="none" stroke="#0284C7" strokeWidth="0.6" opacity="0.55" transform={`rotate(${i * 11.25})`} />
                    ))}
                    <circle cx="0" cy="0" r="22" fill="none" stroke="#1D4ED8" strokeWidth="1" strokeDasharray="1.5 2" opacity="0.75" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.8" />
                    <circle cx="0" cy="0" r="7" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1" />
                    <circle cx="0" cy="0" r="3" fill="#2563EB" />
                  </g>
                </g>
              </defs>

              <rect x="12" y="12" width="calc(100% - 24px)" height="calc(100% - 24px)" fill="url(#bgSecurityWaves)" />
              <rect x="8" y="8" width="calc(100% - 16px)" height="calc(100% - 16px)" fill="none" stroke="url(#certBorderGrad)" strokeWidth="2" />
              <rect x="48" y="10" width="calc(100% - 96px)" height="16" fill="url(#guillocheRibbonH)" />
              <rect x="10" y="48" width="16" height="calc(100% - 96px)" fill="url(#guillocheRibbonV)" />
              <svg x="0" y="100%" overflow="visible">
                <rect x="48" y="-26" width="calc(100% - 96px)" height="16" fill="url(#guillocheRibbonH)" />
              </svg>
              <svg x="100%" y="0" overflow="visible">
                <rect x="-26" y="48" width="16" height="calc(100% - 96px)" fill="url(#guillocheRibbonV)" />
              </svg>

              <rect x="28" y="28" width="calc(100% - 56px)" height="calc(100% - 56px)" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.6" strokeDasharray="3 2" />

              <g transform="translate(8, 8)">
                <use href="#cornerRosetteG" />
              </g>
              <svg x="100%" y="0" overflow="visible">
                <g transform="scale(-1, 1)">
                  <g transform="translate(8, 8)">
                    <use href="#cornerRosetteG" />
                  </g>
                </g>
              </svg>
              <svg x="0" y="100%" overflow="visible">
                <g transform="scale(1, -1)">
                  <g transform="translate(8, 8)">
                    <use href="#cornerRosetteG" />
                  </g>
                </g>
              </svg>
              <svg x="100%" y="100%" overflow="visible">
                <g transform="scale(-1, -1)">
                  <g transform="translate(8, 8)">
                    <use href="#cornerRosetteG" />
                  </g>
                </g>
              </svg>

              <g transform="translate(48, 105) rotate(-12) scale(1.05)">
                <image href={polylanceLogoImg} x="0" y="0" width="85" height="85" opacity="0.08" />
              </g>
              <svg x="100%" y="0" overflow="visible">
                <g transform="translate(-150, 105) rotate(12) scale(1.05)">
                  <image href={polylanceLogoImg} x="0" y="0" width="85" height="85" opacity="0.08" />
                </g>
              </svg>

              <text 
                x="50%" 
                y="89%" 
                textAnchor="middle" 
                fontSize="68" 
                fontFamily="sans-serif" 
                fontWeight="900" 
                fill="none" 
                stroke="#38BDF8" 
                strokeWidth="1.2" 
                opacity="0.09" 
                letterSpacing="24"
              >
                POLYLANCE
              </text>
            </svg>

            {/* Certificate Content Elements */}
            <div className="relative z-10 flex flex-col justify-between h-full space-y-2.5 sm:space-y-3">
              
              {/* 1. Top Branding Area */}
              <div className="flex items-center justify-between gap-4 pt-1 px-1">
                <div className="flex items-center gap-3">
                  <img 
                    src={polylanceLogoImg} 
                    alt="PolyLance" 
                    className="w-10 h-10 object-contain shrink-0 filter drop-shadow-2xs" 
                  />
                  <div>
                    <h2 className="font-extrabold text-2xl text-[#0F172A] tracking-tight leading-none font-headline">
                      PolyLance
                    </h2>
                    <span className="text-[8px] font-mono tracking-widest text-slate-500 uppercase block font-bold mt-1">
                      BUILDING TRUST FOR A DECENTRALIZED WORKFORCE
                    </span>
                  </div>
                </div>

                {/* Certificate Metadata */}
                <div className="text-right space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                      CERTIFICATE ID
                    </span>
                    <span className="font-bold text-slate-800 text-[11px] truncate max-w-[170px] sm:max-w-[210px]">
                      {certificateId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCertId}
                      title="Copy Certificate ID"
                      className="hover:text-blue-700 transition-colors p-0.5 cursor-pointer no-print"
                    >
                      <Copy size={11} className="text-slate-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-[11px]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                      NETWORK
                    </span>
                    <Hexagon size={12} className="text-purple-600 fill-purple-100" />
                    <span className="font-bold text-purple-700">Polygon PoS (137)</span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-[11px]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                      SETTLED ON
                    </span>
                    <Calendar size={12} className="text-slate-600" />
                    <span className="font-bold text-slate-800">{completionDate}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-[11px]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                      MILESTONE:
                    </span>
                    <span className="font-bold text-slate-800 uppercase tracking-tight truncate max-w-[210px]">
                      {job.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Certificate Title */}
              <div className="text-center space-y-1 my-0.5">
                <div className="flex items-center justify-center gap-2 text-[#1E3A8A] opacity-90">
                  <div className="h-[1.5px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#1E3A8A] to-[#0284C7]" />
                  <span className="text-[7px] text-[#0284C7]">◆</span>
                  <span className="text-[9.5px] sm:text-[10px] font-mono font-bold tracking-[0.26em] uppercase text-[#1E3A8A]">
                    OFFICIAL ATTESTATION CERTIFICATE
                  </span>
                  <span className="text-[7px] text-[#0284C7]">◆</span>
                  <div className="h-[1.5px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-[#1E3A8A] to-[#0284C7]" />
                </div>

                <h1 className="font-certificate-title text-2xl sm:text-[32px] font-black tracking-tight text-[#0F2942] uppercase leading-[1.08] bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0284C7] bg-clip-text text-transparent">
                  {viewRole === 'client' ? (
                    <>
                      ESCROW PATRON &amp;<br />
                      CAPITAL TRUST
                    </>
                  ) : (
                    <>
                      ESCROW TALENT &amp;<br />
                      PROOF OF WORK
                    </>
                  )}
                </h1>

                <div className="flex items-center justify-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#0284C7]">
                  <span>✧</span>
                  <span>VERIFIED ON POLYGON</span>
                  <span>✧</span>
                </div>

                <p className="text-[10.5px] sm:text-[11.5px] text-slate-600 max-w-md mx-auto leading-relaxed pt-0.5">
                  This certifies that the escrow for this project has been successfully funded, verified and released through PolyLance.
                </p>

                <div className="text-[8.5px] font-mono font-bold uppercase tracking-[0.22em] text-slate-400">
                  TRUST • TALENT • OPPORTUNITIES • ONCHAIN
                </div>
              </div>

              {/* 3. Three Status Pill Badges Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#ECFDF5]/80 border border-[#A7F3D0] rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-slate-900 leading-tight uppercase font-mono">100% SETTLED</div>
                    <div className="text-[8.5px] text-emerald-700 font-semibold leading-tight">Funds Released</div>
                  </div>
                </div>

                <div className="bg-[#FAF5FF]/80 border border-[#E9D5FF] rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-slate-900 leading-tight uppercase font-mono">ON-CHAIN VERIFIED</div>
                    <div className="text-[8.5px] text-purple-700 font-semibold leading-tight">Immutable Record</div>
                  </div>
                </div>

                <div className="bg-[#EFF6FF]/80 border border-[#BFDBFE] rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                  <Lock size={16} className="text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-slate-900 leading-tight uppercase font-mono">NON-TRANSFERABLE</div>
                    <div className="text-[8.5px] text-blue-700 font-semibold leading-tight">Soulbound Proof</div>
                  </div>
                </div>
              </div>

              {/* 4. Project Details Box */}
              <div className="bg-[#F8FAFC]/90 border border-[#CBD5E1] rounded-2xl p-3 flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5 min-w-0">
                  <FileText size={17} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block font-mono">
                      PROJECT
                    </span>
                    <div className="font-bold text-sm sm:text-[15px] text-slate-900 truncate" title={job.title}>
                      {job.title}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Escrow milestone completed successfully.
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1 font-mono">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                      CATEGORY
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {job.category || 'backend'}
                    </span>
                  </div>
                  <div className="text-[10.5px]">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold mr-1.5">
                      SETTLED ON
                    </span>
                    <span className="font-bold text-slate-800">{completionDate}</span>
                  </div>
                </div>
              </div>

              {/* 5. Key Metrics 3-Column Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {/* Escrow Amount */}
                <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Coins size={14} />
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold font-mono">
                      ESCROW AMOUNT
                    </span>
                  </div>
                  <div className="font-black text-slate-900 text-sm sm:text-base font-headline">
                    ${amountUsdc.toFixed(2)} USDC
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium">
                    Released to Talent
                  </div>
                </div>

                {/* Escrow Contract */}
                <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-purple-600">
                    <Lock size={14} />
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold font-mono">
                      ESCROW CONTRACT
                    </span>
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-xs sm:text-[13px] truncate">
                    {truncateAddress(contractAddress)}
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <Hexagon size={8} className="fill-purple-300" />
                      Polygon PoS
                    </span>
                  </div>
                </div>

                {/* Dispute Status */}
                <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <ShieldCheck size={14} />
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold font-mono">
                      DISPUTE STATUS
                    </span>
                  </div>
                  <div className="font-black text-slate-900 text-sm sm:text-base font-headline">
                    {job.dispute ? '100% Disputed' : '0.0% Disputes'}
                  </div>
                  <div className="text-[9px] text-emerald-700 font-medium">
                    {job.dispute ? (job.dispute.resolved ? 'Dispute Resolved' : 'Tribunal Active') : 'Milestone Approved'}
                  </div>
                </div>
              </div>

              {/* 6. Dual Freelancer & Client Box */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* Freelancer Card */}
                <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <User size={13} className="text-blue-600" />
                    <span className="text-[8px] uppercase tracking-wider font-bold font-mono">
                      FREELANCER (WORK PROVIDER)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-slate-900 text-xs sm:text-[13px] truncate">
                      {freelancerName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Check size={9} /> Verified
                    </span>
                  </div>
                  <div className="font-mono text-[10.5px] text-slate-500">
                    {truncateAddress(freelancerAddr)}
                  </div>
                </div>

                {/* Client Card */}
                <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Building2 size={13} className="text-blue-600" />
                    <span className="text-[8px] uppercase tracking-wider font-bold font-mono">
                      CLIENT (CAPITAL SPONSOR)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-slate-900 text-xs sm:text-[13px] truncate">
                      {clientName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Check size={9} /> Verified
                    </span>
                  </div>
                  <div className="font-mono text-[10.5px] text-slate-500">
                    {truncateAddress(clientAddr)}
                  </div>
                </div>
              </div>

              {/* 7. Verify on CertifiedPass & QR Code Section */}
              <div className="bg-[#F8FAFC]/90 border border-slate-200 rounded-2xl p-3 flex items-center gap-4">
                {/* Real QR Code */}
                <div className="w-[72px] h-[72px] sm:w-[78px] sm:h-[78px] bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(certifiedPassVerifyUrl)}`}
                    alt="CertifiedPass QR Verification"
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>

                {/* CertifiedPass Details */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div>
                    <h4 className="font-headline font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                      Verify on CertifiedPass
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Scan this QR to view the on-chain attestation record.
                    </p>
                  </div>

                  <div>
                    <a
                      href={certifiedPassVerifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>View on CertifiedPass</span>
                      <ArrowUpRight size={12} />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-[9.5px] font-mono">
                    <div>
                      <span className="text-[7.5px] uppercase tracking-wider text-slate-400 font-bold block">
                        NETWORK
                      </span>
                      <span className="font-bold text-purple-700 flex items-center gap-1">
                        <Hexagon size={9} className="text-purple-600 fill-purple-100" />
                        Polygon PoS (137)
                      </span>
                    </div>
                    <div>
                      <span className="text-[7.5px] uppercase tracking-wider text-slate-400 font-bold block">
                        CERTIFICATE ID
                      </span>
                      <span className="font-bold text-slate-800 truncate block max-w-[170px]" title={certificateId}>
                        {certificateId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[7.5px] uppercase tracking-wider text-slate-400 font-bold block">
                        TRANSACTION DATE
                      </span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Calendar size={9} className="text-slate-500" />
                        {completionDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. Bottom Sign-Off & Barcode */}
              <div className="pt-2 border-t border-slate-200/90 flex items-center justify-between gap-4">
                {/* Signature & Oracle Authority */}
                <div className="space-y-0.5">
                  {/* Cursive handwritten signature */}
                  <div className="h-8 flex items-center">
                    <svg viewBox="0 0 170 45" className="h-7 w-36 text-[#1E3A8A]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 34 C10 22 16 8 26 8 C36 8 36 26 24 32 C16 36 14 24 26 20 C42 14 48 32 58 22 C68 12 74 30 86 22 C96 14 104 28 116 20 C126 12 136 26 148 18 C156 14 162 22 166 16" />
                      <path d="M 20 36 Q 75 20 152 28" strokeWidth="1.6" opacity="0.85" />
                    </svg>
                  </div>
                  <div className="font-bold text-xs sm:text-[13px] text-[#0F172A] leading-tight">
                    PolyLance Oracle Network
                  </div>
                  <div className="text-[8px] font-mono tracking-[0.2em] text-slate-400 uppercase font-bold">
                    VERIFIED &amp; ATTESTED
                  </div>
                </div>

                {/* Barcode & Slogan */}
                <div className="text-right space-y-0.5">
                  <div className="flex items-center justify-end gap-1.5 text-[8.5px] font-mono font-bold tracking-widest text-slate-600 uppercase">
                    <Globe size={11} className="text-slate-500" />
                    <span>A MORE OPEN FAIRER WORKFORCE</span>
                  </div>

                  {/* Barcode visual */}
                  <div className="flex justify-end">
                    <svg
                      viewBox={`0 0 ${barcodeData.totalWidth} 32`}
                      className="w-32 sm:w-36 h-6"
                      preserveAspectRatio="none"
                      shapeRendering="crispEdges"
                    >
                      {barcodeData.bars.map((bar, i) => (
                        <rect key={i} x={bar.x} y={0} width={bar.width} height={32} fill="#0F172A" shapeRendering="crispEdges" />
                      ))}
                    </svg>
                  </div>

                  <div className="flex items-center justify-end gap-2 text-[8px] font-mono text-slate-500 font-bold">
                    <span>{barcodeSerial}</span>
                    <span>•</span>
                    <span className="tracking-widest">POLYLANCE.CODES</span>
                  </div>
                </div>
              </div>

              {/* 9. Bottom-most Footer */}
              <div className="border-t border-slate-200/80 pt-1 text-center space-y-0.5">
                <div className="text-[8.5px] font-mono tracking-[0.25em] uppercase text-slate-500 font-bold">
                  TRUST • VERIFY • BUILD • GROW
                </div>
                <div className="text-[7.5px] font-mono tracking-[0.25em] uppercase text-slate-400 font-bold">
                  POWERED BY POLYLANCE
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};
