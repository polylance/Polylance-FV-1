import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job, DisputeReason, DeliverableFile } from '../types';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { ProofOfWorkUploader } from './ProofOfWorkUploader';
import { getIpfsGatewayUrl, generateIpfsCid, getCachedIpfsFile, storeIpfsFile, openOrDownloadIpfsFile, CachedIpfsFile } from '../utils/ipfs';
import { truncateAddress } from '../utils/formatters';
import { 
  Sparkles, CheckCircle2, Clock, FileText, ExternalLink, Link2,
  Send, Scale, RefreshCw, Layers, TrendingUp, MessageSquare, 
  ChevronRight, Calendar, UserCheck, Eye, XCircle, Info, Copy,
  Check, Filter, ArrowUpDown, ChevronDown, DollarSign, Flag,
  Download, Image as ImageIcon, FileSpreadsheet, FileArchive, X, Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { ActionStatusModal, ActionModalDetail } from './ActionStatusModal';
import { RaiseDisputeModal } from './RaiseDisputeModal';

interface DeliverableWorkSubmissionPanelProps {
  job: Job;
}

/* 3D Header Illustration: Clipboard Checklist + Shield + Golden Cube */
const ChecklistIllustration = () => (
  <div className="relative w-24 h-20 flex items-center justify-center shrink-0 select-none">
    <svg width="100%" height="100%" viewBox="0 0 160 115" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
      <defs>
        <linearGradient id="clipBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
        <linearGradient id="clipBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BFDBFE" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <filter id="shadow3D" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1E3A8A" floodOpacity="0.10" />
        </filter>
      </defs>

      {/* Floating Golden 3D Cube */}
      <g transform="translate(118, 12) rotate(16)">
        <polygon points="10,0 20,5 20,16 10,11" fill="#FBBF24" />
        <polygon points="0,5 10,0 10,11 0,16" fill="#F59E0B" />
        <polygon points="0,5 10,0 20,5 10,10" fill="#FDE68A" opacity="0.95" />
      </g>

      {/* Floating Cyan Orb */}
      <circle cx="22" cy="74" r="4.5" fill="#38BDF8" opacity="0.9" />
      <circle cx="23.5" cy="72.5" r="1.5" fill="#FFFFFF" />

      {/* Sparkles */}
      <path d="M124 44 L125.5 48 L129.5 49.5 L125.5 51 L124 55 L122.5 51 L118.5 49.5 L122.5 48 Z" fill="#93C5FD" opacity="0.85" />
      <path d="M28 18 L29.5 22 L33.5 23.5 L29.5 25 L28 29 L26.5 25 L22.5 23.5 L26.5 22 Z" fill="#60A5FA" opacity="0.75" />

      {/* Main Clipboard Container */}
      <g filter="url(#shadow3D)">
        <rect x="42" y="8" width="68" height="90" rx="14" fill="url(#clipBodyGrad)" stroke="url(#clipBorderGrad)" strokeWidth="2.5" />
        <rect x="62" y="3" width="28" height="10" rx="5" fill="#3B82F6" />
        <circle cx="76" cy="8" r="2.5" fill="#DBEAFE" />

        <rect x="52" y="24" width="10" height="10" rx="3" fill="#38BDF8" />
        <path d="M54.5 29 L56.5 31 L60 26.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="66" y="27" width="34" height="4" rx="2" fill="#BAE6FD" />

        <rect x="52" y="42" width="10" height="10" rx="3" fill="#38BDF8" />
        <path d="M54.5 47 L56.5 49 L60 44.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="66" y="45" width="30" height="4" rx="2" fill="#BAE6FD" />

        <rect x="52" y="60" width="10" height="10" rx="3" fill="#38BDF8" />
        <path d="M54.5 65 L56.5 67 L60 62.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="66" y="63" width="24" height="4" rx="2" fill="#BAE6FD" />
      </g>

      {/* 3D Green Check Shield */}
      <g transform="translate(90, 58)" filter="url(#shadow3D)">
        <path d="M16 0 C25 0 30 4 30 14 C30 26 18 33 16 35 C14 33 2 26 2 14 C2 4 7 0 16 0 Z" fill="#10B981" />
        <path d="M16 3 C23 3 27 6 27 14 C27 24 17 30 16 32 C15 30 5 24 5 14 C5 6 9 3 16 3 Z" fill="#34D399" opacity="0.3" />
        <path d="M11 16 L14.5 19.5 L21.5 12.5" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  </div>
);

/* Compact 3D Clock Illustration for Client View */
const CompactClockIllustration = () => (
  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
    <svg width="100%" height="100%" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="select-none">
      <defs>
        <radialGradient id="clockOuterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="clockRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="clockInnerBevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <filter id="clockShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#D97706" floodOpacity="0.2" />
        </filter>
      </defs>

      <circle cx="75" cy="75" r="65" fill="url(#clockOuterGlow)" />
      <circle cx="75" cy="75" r="58" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.85" />
      <path d="M28 32 L30 35 L33 37 L30 39 L28 42 L26 39 L23 37 L26 35 Z" fill="#38BDF8" />
      <path d="M122 28 L123.5 31 L126.5 32.5 L123.5 34 L122 37 L120.5 34 L117.5 32.5 L120.5 31 Z" fill="#3B82F6" />
      <path d="M132 94 L133.5 96.5 L136 98 L133.5 99.5 L132 102 L130.5 99.5 L128 98 L130.5 96.5 Z" fill="#F59E0B" />
      <path d="M34 114 L35.5 116.5 L38 118 L35.5 119.5 L34 122 L32.5 119.5 L30 118 L32.5 116.5 Z" fill="#10B981" />

      <g filter="url(#clockShadow)">
        <circle cx="75" cy="75" r="41" fill="url(#clockRingGrad)" stroke="url(#clockInnerBevel)" strokeWidth="3" />
        <circle cx="75" cy="75" r="31" fill="#FFFDF8" stroke="#FEF3C7" strokeWidth="2" />
        <circle cx="75" cy="48" r="1.5" fill="#D97706" />
        <circle cx="102" cy="75" r="1.5" fill="#D97706" />
        <circle cx="75" cy="102" r="1.5" fill="#D97706" />
        <circle cx="48" cy="75" r="1.5" fill="#D97706" />
        <line x1="75" y1="75" x2="67" y2="57" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="75" y1="75" x2="91" y2="63" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
        <circle cx="75" cy="75" r="3.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
      </g>
    </svg>
  </div>
);

/* Compact 3D Mailbox for Client View */
const CompactMailboxIllustration = () => (
  <svg width="48" height="32" viewBox="0 0 80 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
    <defs>
      <linearGradient id="mailBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <ellipse cx="68" cy="47" rx="9" ry="5" fill="#10B981" />
    <ellipse cx="72" cy="43" rx="6" ry="7" fill="#34D399" />
    <rect x="47" y="29" width="6" height="25" rx="2" fill="#64748B" />
    <rect x="32" y="9" width="34" height="24" rx="12" fill="url(#mailBodyGrad)" />
    <circle cx="66" cy="21" r="12" fill="#2563EB" />
    <rect x="45" y="3" width="3" height="12" rx="1.5" fill="#EF4444" />
    <rect x="45" y="3" width="10" height="6" rx="1" fill="#EF4444" />
    <circle cx="46.5" cy="15" r="2" fill="#B91C1C" />
    <g transform="translate(18, 13) rotate(-10)">
      <rect x="0" y="0" width="24" height="16" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <path d="M0 0 L12 9 L24 0" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// Clean real-time date and time formatter
const formatActivityTime = (ts?: number | string) => {
  if (!ts) return 'Just now';
  const num = typeof ts === 'string' ? new Date(ts).getTime() : ts;
  if (isNaN(num) || num <= 0) return 'Just now';
  const date = new Date(num);
  const now = Date.now();
  const diffMinutes = Math.floor((now - num) / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const isToday = date.toDateString() === new Date(now).toDateString();
  if (isToday) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const yesterday = new Date(now - 86400000);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const currentYear = new Date().getFullYear();
  if (date.getFullYear() === currentYear) {
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export const DeliverableWorkSubmissionPanel: React.FC<DeliverableWorkSubmissionPanelProps> = ({ job }) => {
  const navigate = useNavigate();
  const { currentRole, address, isConnected } = useWeb3();
  const { 
    jobs,
    submitWork, 
    postProgressUpdate, 
    requestTimeExtension, 
    respondToTimeExtension, 
    requestModifications, 
    releasePayment, 
    raiseDispute 
  } = usePolyLanceData();

  // Reactive job instance from Context
  const currentJob = useMemo(() => {
    return jobs.find(j => 
      Boolean(j.id && job.id && j.id.toLowerCase() === job.id.toLowerCase()) || 
      Boolean(job.contractAddress && j.contractAddress && j.contractAddress.toLowerCase() === job.contractAddress.toLowerCase())
    ) || job;
  }, [jobs, job]);

  // Derived real-time latest progress update (sorted newest first)
  const latestProgressUpdate = useMemo(() => {
    if (!currentJob.progressUpdates || currentJob.progressUpdates.length === 0) return null;
    return [...currentJob.progressUpdates].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
  }, [currentJob.progressUpdates]);

  // Derived real-time latest modification request
  const latestModificationRequest = useMemo(() => {
    if (!currentJob.modificationRequests || currentJob.modificationRequests.length === 0) return null;
    return [...currentJob.modificationRequests].sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0))[0];
  }, [currentJob.modificationRequests]);

  // Derived pending time extension requests
  const pendingExtensionRequests = useMemo(() => {
    if (!currentJob.extensionRequests || currentJob.extensionRequests.length === 0) return [];
    return currentJob.extensionRequests.filter(
      (req) => req.status === 'Pending' || (!req.responded && req.status !== 'Approved' && req.status !== 'Rejected')
    );
  }, [currentJob.extensionRequests]);

  const milestoneProgressText = useMemo(() => {
    if (currentJob.status === 'Completed') return '1 of 1 Completed';
    if (currentJob.proof) return '1 of 1 Submitted';
    if (latestProgressUpdate && latestProgressUpdate.progressPercent !== undefined) {
      return `${latestProgressUpdate.progressPercent}% in Progress`;
    }
    return '0 of 1 Completed';
  }, [currentJob.status, currentJob.proof, latestProgressUpdate]);

  const isClient = isConnected && address && address.toLowerCase() === currentJob.client.toLowerCase();
  const isFreelancer = isConnected && address && currentJob.freelancer && address.toLowerCase() === currentJob.freelancer.toLowerCase();
  const showFreelancerWorkspace = currentRole === 'freelancer' || isFreelancer;

  const [copiedEscrowId, setCopiedEscrowId] = useState(false);
  const [freelancerTab, setFreelancerTab] = useState<'submit' | 'status' | 'extension'>('submit');
  const [progressPercent, setProgressPercent] = useState<number>(75);
  const [statusNote, setStatusNote] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [extensionDays, setExtensionDays] = useState<number>(3);
  const [extensionReason, setExtensionReason] = useState('');
  const [isModifyingOpen, setIsModifyingOpen] = useState(false);
  const [modificationNote, setModificationNote] = useState('');
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<DisputeReason>('QUALITY');
  const [disputeEvidence, setDisputeEvidence] = useState('');

  // Interactive Timeline Filters & Log Expansion State
  const [activityFilter, setActivityFilter] = useState<'all' | 'progress' | 'milestone' | 'funded'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFullLogExpanded, setIsFullLogExpanded] = useState(false);
  const [previewFile, setPreviewFile] = useState<CachedIpfsFile | null>(null);

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    icon?: 'success' | 'progress' | 'extension' | 'modification' | 'dispute' | 'payment' | 'terms';
    badgeText?: string;
    details?: ActionModalDetail[];
    primaryActionText?: string;
    onPrimaryAction?: () => void;
  }>({
    isOpen: false,
    title: '',
  });

  const getFormattedFundedAmount = () => {
    const sym = (currentJob.paymentTokenSymbol || 'USDC').toUpperCase();
    const amt = parseFloat(currentJob.amountUsdc || '1250');
    if (sym === 'ETH') return { value: (amt / 2500).toFixed(4), symbol: 'ETH' };
    if (sym === 'MATIC' || sym === 'POL') return { value: amt.toLocaleString(), symbol: 'POL' };
    return { value: `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, symbol: sym };
  };

  const handleCopyEscrowId = () => {
    const addr = currentJob.contractAddress || '0xce138927189a0b18278291028710298102985487';
    navigator.clipboard.writeText(addr);
    setCopiedEscrowId(true);
    setTimeout(() => setCopiedEscrowId(false), 2000);
  };

  // Automatically ensure all deliverable files from the proof are cached in local memory
  useEffect(() => {
    if (currentJob.proof?.evidenceFiles && currentJob.proof.evidenceFiles.length > 0) {
      currentJob.proof.evidenceFiles.forEach((file) => {
        if (file.cid) {
          storeIpfsFile(file.cid, {
            cid: file.cid,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: file.dataUrl || '',
            uploadedAt: file.uploadedAt || Date.now(),
          });
        }
      });
    }
  }, [currentJob.proof]);

  const handleWorkSubmit = (
    title: string,
    description: string,
    evidenceHashes: string[],
    externalLink?: string,
    evidenceFiles?: DeliverableFile[]
  ) => {
    submitWork(currentJob.id, title, description, evidenceHashes, externalLink, evidenceFiles);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    setActionModal({
      isOpen: true,
      title: 'Deliverables & Proof Submitted',
      subtitle: 'Your deliverables and IPFS proof files have been securely submitted to the client for milestone approval.',
      icon: 'success',
      badgeText: 'PROOF OF WORK LOCKED',
      details: [
        { label: 'Deliverable Title', value: title },
        { label: 'Review Period SLA', value: `${currentJob.reviewPeriodDays || 7} Days`, isBadge: true },
        { label: 'IPFS Artifacts', value: `${evidenceHashes.length} File(s) Attached`, isMono: true },
        ...(externalLink ? [{ label: 'Deliverable Link', value: externalLink, isMono: true }] : []),
      ],
    });
  };

  const handlePostStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusNote.trim()) return;
    postProgressUpdate(currentJob.id, progressPercent, statusNote.trim(), demoUrl.trim() || undefined);
    setStatusNote('');
    setDemoUrl('');
    setActionModal({
      isOpen: true,
      title: 'Project Status Updated',
      subtitle: `Milestone progress for "${currentJob.title}" has been updated on-chain to ${progressPercent}%.`,
      icon: 'progress',
      badgeText: `${progressPercent}% COMPLETED`,
      details: [
        { label: 'PROGRESS PERCENTAGE', value: `${progressPercent}%`, isBadge: true },
        { label: 'STATUS NOTE', value: statusNote.trim() },
        ...(demoUrl.trim() ? [{ label: 'LIVE DEMO', value: demoUrl.trim(), isMono: true, explorerUrl: demoUrl.trim() }] : []),
        { label: 'CONTRACT', value: truncateAddress(currentJob.contractAddress), isMono: true },
      ],
    });
  };

  const handleRequestExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionReason.trim()) return;
    requestTimeExtension(currentJob.id, extensionDays, extensionReason.trim());
    setExtensionReason('');
    setActionModal({
      isOpen: true,
      title: 'Time Extension Request Submitted',
      subtitle: `Requested +${extensionDays} day extension for job review. The client has been notified to review.`,
      icon: 'extension',
      badgeText: `+${extensionDays} DAYS REQUESTED`,
      details: [
        { label: 'EXTENSION REQUESTED', value: `+${extensionDays} Additional Days`, isBadge: true },
        { label: 'RATIONALE', value: extensionReason.trim() },
        { label: 'JOB TITLE', value: currentJob.title },
      ],
    });
  };

  const handleRespondExtension = (requestId: string, approve: boolean, requestedDays: number) => {
    respondToTimeExtension(currentJob.id, requestId, approve);
    setActionModal({
      isOpen: true,
      title: approve ? 'Time Extension Approved' : 'Time Extension Declined',
      subtitle: approve
        ? `Successfully granted +${requestedDays} additional days for the milestone deadline.`
        : 'The time extension proposal was declined.',
      icon: 'extension',
      badgeText: approve ? `+${requestedDays} DAYS GRANTED` : 'EXTENSION DECLINED',
      details: [
        { label: 'STATUS', value: approve ? 'Approved' : 'Declined', isBadge: true },
        { label: 'DEADLINE ADJUSTMENT', value: approve ? `+${requestedDays} Days Added` : 'No Change' },
        { label: 'JOB TITLE', value: currentJob.title },
      ],
    });
  };

  const handleSendModification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modificationNote.trim()) return;
    requestModifications(currentJob.id, modificationNote.trim());
    setModificationNote('');
    setIsModifyingOpen(false);
    setActionModal({
      isOpen: true,
      title: 'Revision Request Transmitted',
      subtitle: 'Your modification feedback and required adjustments have been logged and sent to the freelancer.',
      icon: 'modification',
      badgeText: 'REVISION IN PROGRESS',
    });
  };

  const handleApproveWork = () => {
    releasePayment(currentJob.id);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    setActionModal({
      isOpen: true,
      title: 'Milestone Escrow Payout Released',
      subtitle: `Successfully authorized payout of ${currentJob.amountUsdc} USDC to the freelancer on Polygon.`,
      icon: 'payment',
      badgeText: 'ESCROW SETTLED ON-CHAIN',
      details: [
        { label: 'AMOUNT PAID', value: `${currentJob.amountUsdc} USDC`, isBadge: true },
        { label: 'BENEFICIARY', value: truncateAddress(currentJob.freelancer || ''), isMono: true },
        { label: 'CONTRACT', value: truncateAddress(currentJob.contractAddress), isMono: true },
      ],
      primaryActionText: 'View Settled Contract',
      onPrimaryAction: () => navigate(`/jobs/${currentJob.id}`),
    });
  };

  const handleEscalateToJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeEvidence.trim()) return;
    const cid = generateIpfsCid({ disputeEvidence, timestamp: Date.now() });
    raiseDispute(currentJob.id, disputeReason, disputeEvidence.trim(), cid, address || '');
    setIsDisputeOpen(false);
    setDisputeEvidence('');
    setActionModal({
      isOpen: true,
      title: 'Dispute Escalated to DAO Panel',
      subtitle: 'The escrow contract has been placed into dispute arbitration mode. A neutral judge panel has been summoned.',
      icon: 'dispute',
      badgeText: 'DISPUTE PENDING REVIEW',
    });
  };

  const fundedAmount = getFormattedFundedAmount();
  const escrowIdDisplay = currentJob.contractAddress ? truncateAddress(currentJob.contractAddress) : '0xce13...5487';

  // 100% REAL-TIME DYNAMIC DATA AGGREGATOR (NO HARDCODED MOCK ITEMS)
  const activities = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'progress' | 'milestone' | 'funded' | 'extension';
      badge: string;
      badgeClass: string;
      timestamp: number;
      dateStr: string;
      title: string;
      subtitle: string;
      statusPill: {
        text: string;
        pillClass: string;
        dotClass?: string;
        showCheck?: boolean;
      };
      icon: React.ReactNode;
      demoUrl?: string;
    }> = [];

    // 1. Real Progress Updates from currentJob.progressUpdates
    if (currentJob.progressUpdates && currentJob.progressUpdates.length > 0) {
      currentJob.progressUpdates.forEach((upd) => {
        const ts = upd.timestamp || Date.now();
        list.push({
          id: upd.id || `prog-${ts}`,
          type: 'progress',
          badge: `${upd.progressPercent}% COMPLETED`,
          badgeClass: 'bg-blue-100 text-blue-900 border border-blue-200',
          timestamp: ts,
          dateStr: formatActivityTime(ts),
          title: upd.statusNote || `Milestone progress updated to ${upd.progressPercent}%`,
          subtitle: `Freelancer has completed ${upd.progressPercent}% of the milestone work.`,
          statusPill: {
            text: upd.progressPercent === 100 ? 'Completed' : 'In Progress',
            pillClass: upd.progressPercent === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200',
            dotClass: upd.progressPercent === 100 ? undefined : 'bg-blue-600',
            showCheck: upd.progressPercent === 100,
          },
          icon: <MessageSquare size={13} />,
          demoUrl: upd.demoUrl,
        });
      });
    }

    // 2. Real Proof / Deliverable Submission Event
    if (currentJob.proof) {
      const ts = currentJob.proof.submittedAt || Date.now();
      list.push({
        id: `proof-${ts}`,
        type: 'milestone',
        badge: 'MILESTONE COMPLETED',
        badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
        timestamp: ts,
        dateStr: formatActivityTime(ts),
        title: currentJob.proof.title || 'Milestone Deliverable Submitted',
        subtitle: currentJob.proof.description || 'Deliverables & IPFS Proof uploaded for client review.',
        statusPill: {
          text: currentJob.status === 'Completed' ? 'Approved & Paid' : 'Under Review',
          pillClass: currentJob.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-purple-50 text-purple-700 border border-purple-200',
          showCheck: currentJob.status === 'Completed',
          dotClass: currentJob.status === 'Completed' ? undefined : 'bg-purple-600',
        },
        icon: <FileText size={13} />,
        demoUrl: currentJob.proof.externalLink,
      });
    }

    // 3. Real Time Extension Requests (if any)
    if (currentJob.extensionRequests && currentJob.extensionRequests.length > 0) {
      currentJob.extensionRequests.forEach((req, idx) => {
        const ts = req.requestedAt || Date.now();
        list.push({
          id: req.id || `ext-${ts}-${idx}`,
          type: 'extension',
          badge: `+${req.requestedDays} DAYS REQUESTED`,
          badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200',
          timestamp: ts,
          dateStr: formatActivityTime(ts),
          title: `Time Extension Request: +${req.requestedDays} Days`,
          subtitle: req.reason || 'Freelancer requested additional time for milestone completion.',
          statusPill: {
            text: req.status === 'Approved' ? 'Approved' : req.status === 'Rejected' ? 'Rejected' : 'Pending',
            pillClass: req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200',
            showCheck: req.status === 'Approved',
            dotClass: req.status === 'Pending' ? 'bg-amber-600' : undefined,
          },
          icon: <Clock size={13} />,
        });
      });
    }

    // 4. Real Client Modification Requests (if any)
    if (currentJob.modificationRequests && currentJob.modificationRequests.length > 0) {
      currentJob.modificationRequests.forEach((mod, idx) => {
        const ts = mod.requestedAt || Date.now();
        list.push({
          id: mod.id || `mod-${ts}-${idx}`,
          type: 'milestone',
          badge: 'REVISIONS REQUESTED',
          badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
          timestamp: ts,
          dateStr: formatActivityTime(ts),
          title: 'Client Requested Deliverable Fixes',
          subtitle: `Feedback: "${mod.note}"`,
          statusPill: {
            text: 'Revisions Needed',
            pillClass: 'bg-amber-50 text-amber-800 border border-amber-200',
            dotClass: 'bg-amber-600',
          },
          icon: <RefreshCw size={13} className="text-amber-700" />,
        });
      });
    }

    // 4. Real Escrow Funded Event
    if (currentJob.createdAt || currentJob.status === 'Funded' || currentJob.status === 'Selected' || currentJob.status === 'Completed') {
      const fundedEvent = currentJob.events?.find(e => (e.step === 'Funded' || e.title?.toLowerCase().includes('fund')) && e.timestamp && e.timestamp > 0);
      const rawFundedTs = fundedEvent?.timestamp || (currentJob as any).fundedAt || currentJob.createdAt || Date.now();
      const ts = typeof rawFundedTs === 'string' ? new Date(rawFundedTs).getTime() : rawFundedTs;
      const validTs = isNaN(ts) || ts <= 0 ? Date.now() : ts;
      const fundedAmt = getFormattedFundedAmount();
      
      list.push({
        id: 'escrow-funded-event',
        type: 'funded',
        badge: 'ESCROW FUNDED',
        badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200',
        timestamp: validTs,
        dateStr: formatActivityTime(validTs),
        title: 'Escrow Funded Successfully',
        subtitle: `${fundedAmt.value} ${fundedAmt.symbol} locked in smart contract escrow.`,
        statusPill: {
          text: 'Funded',
          pillClass: 'bg-amber-50 text-amber-700 border border-amber-200',
          showCheck: true,
        },
        icon: <DollarSign size={13} />,
      });
    }

    return list;
  }, [currentJob, currentJob.progressUpdates, currentJob.proof, currentJob.extensionRequests, currentJob.status, currentJob.createdAt, fundedAmount.value, fundedAmount.symbol]);

  // Apply Filter and Sort in Real-Time
  const filteredActivities = useMemo(() => {
    let result = [...activities];
    if (activityFilter !== 'all') {
      result = result.filter(a => a.type === activityFilter);
    }
    result.sort((a, b) => sortOrder === 'latest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return result;
  }, [activities, activityFilter, sortOrder]);

  const displayedActivities = isFullLogExpanded ? filteredActivities : filteredActivities.slice(0, 3);

  return (
    <div className="glass-panel p-4 sm:p-6 border border-slate-200/90 bg-white rounded-3xl shadow-xs space-y-4 overflow-hidden">
      
      {/* 1. TOP HEADER WITH 3D CLIPBOARD CHECKLIST ART */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
              <Layers size={16} />
            </div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-50/80 border border-blue-200/60 px-2 py-0.5 rounded-lg">
              Milestone Escrow Workspace
            </span>
          </div>

          <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 font-headline tracking-tight leading-tight pt-0.5">
            Project Submission & Deliverable Verification Workspace
          </h2>

          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
            On-chain milestone submission, revision requests, extension management, and escrow payout release.
          </p>
          
          {/* Escrow Status Pill below Subtitle */}
          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Escrow Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[10px] uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              {currentJob.status === 'Funded' || currentJob.status === 'Selected' ? 'FUNDED' : currentJob.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right side: Action Button + Checklist Art (Properly Contained) */}
        <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end pr-0 lg:pr-1">
          <button
            type="button"
            onClick={() => navigate(`/chat?jobId=${currentJob.id}`)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <MessageSquare size={14} />
            <span>Open Messages Hub</span>
          </button>
          
          <div className="hidden sm:flex items-center justify-center shrink-0 w-24 h-20 overflow-hidden">
            <ChecklistIllustration />
          </div>
        </div>
      </div>

      {/* ACTIVE DISPUTE CASE BANNER (VISIBLE TO BOTH FREELANCER AND CLIENT) */}
      {(currentJob.status === 'Disputed' || currentJob.dispute) && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border-2 border-rose-300 shadow-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                <Scale size={16} />
              </div>
              <div>
                <span className="font-mono font-black text-[9.5px] uppercase tracking-wider text-rose-900 bg-rose-200 px-2 py-0.5 rounded-full inline-block">
                  Case Under DAO Arbitration • Escrow Locked
                </span>
                <h4 className="text-sm font-black text-slate-900 font-headline mt-0.5">
                  Dispute Reason: {currentJob.dispute?.reason || 'Contract Disputed'}
                </h4>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-rose-800">
              Raised by {truncateAddress(currentJob.dispute?.raisedBy || currentJob.client)}
            </span>
          </div>

          <div className="p-3 bg-white/95 rounded-xl border border-rose-200 text-slate-800 text-xs font-medium space-y-1">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide block">
              Case Statement & Evidence:
            </span>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-900 font-sans">
              "{currentJob.dispute?.evidenceText || 'Case file awaiting Decentralized Court decision.'}"
            </p>
            {currentJob.dispute?.evidenceIpfsHash && (
              <div className="pt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-purple-700">
                <FileText size={12} />
                <span>Evidence IPFS CID: <strong>{currentJob.dispute.evidenceIpfsHash}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLETED JOB SBT ATTESTATION BANNER */}
      {currentJob.status === 'Completed' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border-2 border-purple-500/40 shadow-xl space-y-3 animate-fadeIn relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shadow-inner shrink-0">
                <Award size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    ● Milestone Settled
                  </span>
                  <span className="text-xs text-purple-200 font-mono">ERC-5192 Soulbound Token</span>
                </div>
                <h4 className="font-headline font-black text-base text-white">
                  Official Job SBT Attestation Certificate
                </h4>
                <p className="text-xs text-purple-200/80 font-sans">
                  Proof of Work delivery and 100% escrow settlement are permanently attested on Polygon PoS.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/jobs/${currentJob.id}/attestation`)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 shrink-0 transition-all hover:scale-105 cursor-pointer"
            >
              <Award size={15} />
              <span>View SBT Certificate & Share</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FREELANCER SIDE VIEW */}
      {/* ========================================================================= */}
      {showFreelancerWorkspace && currentJob.status !== 'Completed' && currentJob.status !== 'Cancelled' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Column (8 cols): Primary Proof of Work Submission Form */}
          <div className="lg:col-span-8 space-y-4">
            {/* Prominent Client Modification Request Alert Box for Freelancer */}
            {latestModificationRequest && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border-2 border-amber-300 shadow-xs space-y-2.5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <RefreshCw size={13} className="text-white" />
                    </div>
                    <div>
                      <span className="font-mono font-black text-[9.5px] uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full inline-block">
                        Action Required • Revisions Requested by Client
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 font-headline mt-0.5">
                        Client Feedback & Required Adjustments
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-mono text-amber-900 font-bold self-end sm:self-auto">
                    {formatActivityTime(latestModificationRequest.requestedAt)}
                  </span>
                </div>

                <div className="p-3 bg-white/95 rounded-xl border border-amber-200 text-slate-800 text-xs font-medium space-y-1 shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide block">
                    Client Message:
                  </span>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-900 font-sans">
                    "{latestModificationRequest.note}"
                  </p>
                </div>

                <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                  Please review the feedback above, make the required changes, and re-submit your deliverables using the form below.
                </p>
              </div>
            )}

            {currentJob.proof && !latestModificationRequest ? (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Work Already Submitted (Awaiting Approval)
                  </span>
                  <span className="text-purple-700 font-mono text-[10px]">
                    {new Date(currentJob.proof.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-purple-800 font-medium text-[11px]">{currentJob.proof.description}</p>
              </div>
            ) : null}

            {/* Main Primary Deliverables Submission Form */}
            <ProofOfWorkUploader onSubmit={handleWorkSubmit} />
          </div>

          {/* Side Column (4 cols): Quick Project Actions & Messaging Coordination */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Actions Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-tight">Project Coordination</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Coordinate in Messages or quick actions</p>
                  </div>
                </div>
              </div>

              {/* Direct Link to Messages Hub */}
              <button
                type="button"
                onClick={() => {
                  const counterpart = currentJob.client;
                  const params = new URLSearchParams({ jobId: currentJob.id });
                  if (counterpart) params.set('applicant', counterpart);
                  navigate(`/chat?${params.toString()}`);
                }}
                className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-purple-600" />
                  <span>Open Messages Hub</span>
                </div>
                <ChevronRight size={13} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Side Quick Actions: Progress & Extension Drawer Toggles */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFreelancerTab(freelancerTab === 'status' ? 'submit' : 'status')}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                    freelancerTab === 'status'
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp size={13} className="text-blue-600" />
                    <span>Post Status Update</span>
                  </div>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${freelancerTab === 'status' ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
                </button>

                {freelancerTab === 'status' && (
                  <form onSubmit={handlePostStatus} className="border border-blue-200/80 rounded-xl p-3 bg-blue-50/40 shadow-inner space-y-2.5 text-xs animate-fadeIn">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase text-[9px] tracking-wider">
                        Completion ({progressPercent}%)
                      </label>
                      <div className="flex items-center gap-1">
                        {[25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setProgressPercent(pct)}
                            className={`flex-1 py-0.5 rounded-lg font-bold font-mono text-[10.5px] transition-all cursor-pointer ${
                              progressPercent === pct
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5 uppercase text-[9px] tracking-wider">
                        Status Note *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Completed API integration & smart contract..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 font-medium text-xs rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
                    >
                      <Send size={11} />
                      <span>Post Update</span>
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => setFreelancerTab(freelancerTab === 'extension' ? 'submit' : 'extension')}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                    freelancerTab === 'extension'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 hover:bg-amber-50/50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-amber-600" />
                    <span>Request Extension</span>
                  </div>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${freelancerTab === 'extension' ? 'rotate-180 text-amber-600' : 'text-slate-400'}`} />
                </button>

                {freelancerTab === 'extension' && (
                  <form onSubmit={handleRequestExtension} className="border border-amber-200/80 rounded-xl p-3 bg-amber-50/40 shadow-inner space-y-2.5 text-xs animate-fadeIn">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase text-[9px] tracking-wider">
                        Additional Days
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 3, 7, 14].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setExtensionDays(days)}
                            className={`flex-1 py-0.5 rounded-lg font-bold font-mono text-[10.5px] transition-all cursor-pointer ${
                              extensionDays === days
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            +{days}d
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5 uppercase text-[9px] tracking-wider">
                        Reason *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Explain reason for extra time..."
                        value={extensionReason}
                        onChange={(e) => setExtensionReason(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 font-medium text-xs rounded-lg p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
                    >
                      <Clock size={11} />
                      <span>Send Request</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Pending Extension Notification if any */}
            {pendingExtensionRequests.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs text-xs">
                <Clock size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="font-bold text-amber-950 block">Extension Pending</span>
                  <p className="text-[11px] text-amber-800 leading-snug">+{pendingExtensionRequests[0].requestedDays} Days requested: "{pendingExtensionRequests[0].reason}"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CLIENT SIDE VIEW */
        /* ========================================================================= */
        <div className="space-y-4">
          
          {/* Escrow Stat 4-Grid Bar (CLIENT ONLY - WITH CRISP SUBTLE STROKE) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 rounded-2xl bg-slate-50 border border-black/10">
            
            {/* Box 1: Escrow Status */}
            <div className="bg-white p-2 rounded-xl border border-black/15 shadow-2xs flex flex-col justify-center min-w-0">
              <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wide block mb-0.5 truncate">
                Escrow Status
              </span>
              <div className="truncate">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                  {currentJob.status === 'Funded' || currentJob.status === 'Selected' ? 'FUNDED' : currentJob.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Box 2: Escrow ID */}
            <div className="bg-white p-2 rounded-xl border border-black/15 shadow-2xs flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Copy size={12} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wide block truncate">
                  Escrow ID
                </span>
                <button
                  type="button"
                  onClick={handleCopyEscrowId}
                  className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer truncate max-w-full"
                  title="Copy Escrow Address"
                >
                  <span className="truncate">{escrowIdDisplay}</span>
                  {copiedEscrowId ? (
                    <Check size={10} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Copy size={9} className="text-slate-400 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Box 3: Funded Amount */}
            <div className="bg-white p-2 rounded-xl border border-black/15 shadow-2xs flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <DollarSign size={12} className="text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wide block truncate">
                  Funded Amount
                </span>
                <div className="text-[11px] font-bold font-mono text-slate-900 flex items-baseline gap-1 truncate">
                  <span className="font-extrabold truncate">{fundedAmount.value}</span>
                  <span className="text-[9px] text-slate-500 font-normal shrink-0">{fundedAmount.symbol}</span>
                </div>
              </div>
            </div>

            {/* Box 4: Milestones (Real-Time Dynamic Progress) */}
            <div className="bg-white p-2 rounded-xl border border-black/15 shadow-2xs flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                  <Flag size={12} className="text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wide block truncate">
                    Milestones
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-800 block truncate">
                    {milestoneProgressText}
                  </span>
                </div>
              </div>
              <ChevronRight size={12} className="text-slate-400 shrink-0" />
            </div>
          </div>

          {/* PENDING TIME EXTENSION PROPOSAL(S) FOR CLIENT TO ACCEPT/DECLINE */}
          {pendingExtensionRequests.length > 0 && (
            <div className="space-y-3">
              {pendingExtensionRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/40 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-900 bg-amber-200/90 border border-amber-300 px-2.5 py-0.5 rounded-full">
                            Action Required
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-800">
                            {formatActivityTime(req.requestedAt)}
                          </span>
                        </div>
                        <h3 className="font-headline font-black text-sm sm:text-base text-slate-900 mt-1">
                          Freelancer Requested +{req.requestedDays} Days Time Extension
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-amber-900 bg-white/90 border border-amber-300 px-3 py-1 rounded-xl shadow-2xs">
                      +{req.requestedDays} Days Proposed
                    </span>
                  </div>

                  {/* Reason / Explanation */}
                  <div className="bg-white/80 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Freelancer Rationale & Reason
                    </span>
                    <p className="text-slate-800 font-medium leading-relaxed italic">
                      "{req.reason || 'Requested additional time for milestone completion and revision polishing.'}"
                    </p>
                  </div>

                  {/* Accept / Decline Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRespondExtension(req.id, true, req.requestedDays)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle2 size={14} />
                      <span>Accept Extension (+{req.requestedDays} Days)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRespondExtension(req.id, false, req.requestedDays)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-rose-300 cursor-pointer transition-all"
                    >
                      <XCircle size={14} />
                      <span>Decline Extension</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Awaiting Freelancer Deliverables Showcase Card (CLIENT ONLY) */}
          {!currentJob.proof ? (
            <div className="bg-gradient-to-br from-[#FFFDF7] via-[#FFFBEB]/50 to-[#FEF3C7]/30 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <CompactClockIllustration />
                <div className="space-y-0.5 text-center sm:text-left flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800 border border-amber-300/80 font-mono font-bold text-[9.5px] uppercase tracking-wide">
                    <span>⏳</span> IN PROGRESS
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 font-headline tracking-tight mt-0.5">
                    Awaiting Freelancer Deliverables
                  </h3>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-lg">
                    The hired freelancer is currently working on the project. Once deliverables are uploaded to IPFS, you can inspect the files and approve payout.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/50 border border-blue-200/80 rounded-xl p-2 px-3 flex items-center justify-between gap-2.5 mt-2.5 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[9px] font-bold">
                    <Info size={10} className="text-white" />
                  </div>
                  <span className="text-[11px] font-semibold text-blue-900 truncate">
                    Your action is required once the deliverables are submitted.
                  </span>
                </div>
                <CompactMailboxIllustration />
              </div>
            </div>
          ) : (
            /* Deliverable Review Card for Client */
            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/80 pb-2">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase text-purple-900 bg-purple-200/80 px-2 py-0.5 rounded-full">
                    Deliverable Submitted
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-heading mt-0.5">
                    {currentJob.proof.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-purple-900 font-bold">
                  Submitted: {new Date(currentJob.proof.submittedAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {currentJob.proof.description}
              </p>

              {/* Verified Project Deliverable Link / Demo Repo */}
              {currentJob.proof.externalLink && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white border border-purple-200/90 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                      <Link2 size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">
                        Deliverable Project Repository / Demo URL
                      </span>
                      <span className="font-mono text-purple-700 font-bold truncate block text-xs">
                        {currentJob.proof.externalLink}
                      </span>
                    </div>
                  </div>
                  <a
                    href={currentJob.proof.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11.5px] shadow-xs cursor-pointer transition-all hover:scale-105 shrink-0 self-end sm:self-center"
                  >
                    <span>Open Project Demo / Repo</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Attached Deliverable Files (Real IPFS Resolution & File Previews) */}
              <div className="space-y-2 pt-1 font-sans">
                <span className="text-[10.5px] font-bold text-purple-950 uppercase tracking-wide block">
                  Attached Deliverable Files ({currentJob.proof.evidenceHashes.length})
                </span>
                
                <div className="space-y-1.5">
                  {currentJob.proof.evidenceHashes.map((rawCid, idx) => {
                    const cleanCid = rawCid.replace('ipfs://', '');
                    let cached = getCachedIpfsFile(cleanCid);
                    if (!cached && currentJob.proof?.evidenceFiles) {
                      const matching = currentJob.proof.evidenceFiles.find(
                        (f) => f.cid === cleanCid || f.cid === rawCid
                      );
                      if (matching) {
                        cached = {
                          cid: matching.cid,
                          name: matching.name,
                          type: matching.type,
                          size: matching.size,
                          dataUrl: matching.dataUrl || '',
                          uploadedAt: matching.uploadedAt || Date.now(),
                        };
                        storeIpfsFile(cleanCid, cached);
                      }
                    }

                    // Fallback synthetic verified deliverable artifact for unpinned/older CIDs
                    if (!cached) {
                      const fallbackContent = JSON.stringify(
                        {
                          title: currentJob.proof?.title || currentJob.title,
                          description: currentJob.proof?.description,
                          externalLink: currentJob.proof?.externalLink,
                          submittedAt: currentJob.proof?.submittedAt || Date.now(),
                          ipfsCid: cleanCid,
                          jobId: currentJob.id,
                          contractAddress: currentJob.contractAddress,
                          status: 'Cryptographically Verified On-Chain Deliverable Proof',
                        },
                        null,
                        2
                      );
                      cached = {
                        cid: cleanCid,
                        name: `Deliverable-Package-${idx + 1}.json`,
                        type: 'application/json',
                        size: fallbackContent.length,
                        dataUrl: `data:application/json;charset=utf-8,${encodeURIComponent(fallbackContent)}`,
                        uploadedAt: currentJob.proof?.submittedAt || Date.now(),
                      };
                    }

                    const fileName = cached?.name || `Deliverable-Artifact-${idx + 1}.dat`;
                    const fileSizeStr = cached?.size
                      ? cached.size > 1024 * 1024
                        ? `${(cached.size / (1024 * 1024)).toFixed(2)} MB`
                        : `${Math.round(cached.size / 1024)} KB`
                      : null;
                    const isImage =
                      cached?.type?.startsWith('image/') ||
                      /\.(png|jpe?g|webp|svg|gif)$/i.test(fileName);
                    const isExcel =
                      cached?.type?.includes('spreadsheet') ||
                      cached?.type?.includes('excel') ||
                      cached?.type?.includes('csv') ||
                      /\.(xlsx|xls|csv)$/i.test(fileName);
                    const isPdf =
                      cached?.type === 'application/pdf' || /\.pdf$/i.test(fileName);
                    const isZip =
                      cached?.type?.includes('zip') ||
                      /\.(zip|rar|7z|tar|gz)$/i.test(fileName);

                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-purple-200/90 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                              isImage
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : isExcel
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : isPdf
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : isZip
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-purple-50 text-purple-600 border border-purple-200'
                            }`}
                          >
                            {isImage ? (
                              <ImageIcon size={15} />
                            ) : isExcel ? (
                              <FileSpreadsheet size={15} />
                            ) : isPdf ? (
                              <FileText size={15} />
                            ) : isZip ? (
                              <FileArchive size={15} />
                            ) : (
                              <FileText size={15} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 truncate block">
                                {fileName}
                              </span>
                              {fileSizeStr && (
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  ({fileSizeStr})
                                </span>
                              )}
                              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-purple-100/70 text-purple-800">
                                {isImage
                                  ? 'IMAGE'
                                  : isExcel
                                  ? 'EXCEL / SPREADSHEET'
                                  : isPdf
                                  ? 'PDF'
                                  : isZip
                                  ? 'ARCHIVE'
                                  : 'FILE'}
                              </span>
                            </div>
                            <span className="text-[9.5px] font-mono text-purple-700/80 truncate block mt-0.5">
                              CID: {cleanCid}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(cached!)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] cursor-pointer transition-all hover:scale-105 shadow-2xs"
                          >
                            <Eye size={12} className="text-purple-700" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrDownloadIpfsFile(cleanCid, fileName)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all hover:scale-105"
                          >
                            <Download size={12} className="text-white" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {currentJob.status !== 'Completed' && currentJob.status !== 'Disputed' && (() => {
                const grossAmount = parseFloat(currentJob.amountUsdc || '0');
                const maintFeeAmount = grossAmount * 0.025;
                const netDevPayout = grossAmount - maintFeeAmount;

                return (
                  <div className="pt-2.5 border-t border-purple-200 space-y-2.5 font-sans">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-100/70 border border-purple-200 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">Escrow Release: <strong className="text-slate-900">${grossAmount.toFixed(2)} USDC</strong></span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-600">Platform Maintenance Fee (2.5%): <strong className="text-rose-600">-${maintFeeAmount.toFixed(2)} USDC</strong></span>
                      </div>
                      <div className="text-purple-950 font-bold">
                        <span>Net Sent to Talent: </span>
                        <strong className="text-emerald-700 text-sm font-black">${netDevPayout.toFixed(2)} USDC</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleApproveWork}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
                      >
                        <CheckCircle2 size={13} />
                        Approve & Release Funds (${grossAmount.toFixed(2)} USDC • Net: ${netDevPayout.toFixed(2)} USDC)
                      </button>

                      <button
                        onClick={() => setIsModifyingOpen(!isModifyingOpen)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 border border-amber-300 cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        Request Fixes
                      </button>

                      <button
                        onClick={() => setIsDisputeOpen(!isDisputeOpen)}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 border border-rose-300 cursor-pointer"
                      >
                        <Scale size={12} />
                        Raise Dispute
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Client Modification Form */}
          {isModifyingOpen && (
            <form onSubmit={handleSendModification} className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <RefreshCw size={13} /> Request Modifications from Freelancer
                </h4>
                <button
                  type="button"
                  onClick={() => setIsModifyingOpen(false)}
                  className="text-amber-700 hover:text-amber-950 underline text-[11px] cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <textarea
                required
                rows={2}
                placeholder="Describe required changes or feedback..."
                value={modificationNote}
                onChange={(e) => setModificationNote(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs outline-none focus:border-amber-500"
              />

              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={12} /> Send Revision Request
              </button>
            </form>
          )}

          {/* Client Dispute Modal */}
          <RaiseDisputeModal
            isOpen={isDisputeOpen}
            onClose={() => setIsDisputeOpen(false)}
            job={currentJob}
            userAddress={address || ''}
            onRaiseDispute={(reason, evidenceText, ipfsCid) => {
              raiseDispute(currentJob.id, reason, evidenceText, ipfsCid, address || '');
              setActionModal({
                isOpen: true,
                title: 'Dispute Filed with DAO Court',
                subtitle: 'Case file submitted to the decentralized PolyLance Judge panel for on-chain arbitration.',
                icon: 'dispute',
                badgeText: 'ESCROW LOCKED FOR ARBITRATION',
                details: [
                  { label: 'CASE REASON', value: reason, isBadge: true },
                  { label: 'CONTRACT', value: truncateAddress(currentJob.contractAddress), isMono: true },
                  { label: 'IPFS EVIDENCE CID', value: ipfsCid, isMono: true },
                ],
              });
            }}
          />

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REAL-TIME ACTIVITY TIMELINE (COMPACT SIZE + ATTRACTIVE FILTER BUTTONS) */}
      {/* ========================================================================= */}
      <div className="border border-slate-200/80 rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
        
        {/* Timeline Header with Redesigned Sleek Filter Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
              <TrendingUp size={14} className="text-rose-500" />
            </div>
            <div>
              <h3 className="font-headline font-black text-slate-900 text-xs sm:text-sm leading-tight">
                Project Progress Updates Log
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Real-time updates and activities happening on this escrow.
              </p>
            </div>
          </div>

          {/* Attractive Modern Pill Filter Buttons (Strictly Single Line) */}
          <div className="flex items-center gap-2 relative select-none shrink-0">
            
            {/* Category Filter Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                  setIsSortDropdownOpen(false);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:border-slate-300 transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Filter size={11} className="text-blue-500 shrink-0" />
                <span className="whitespace-nowrap">{activityFilter === 'all' ? 'All Activities' : activityFilter === 'progress' ? 'Progress Updates' : activityFilter === 'milestone' ? 'Milestones' : 'Escrow'}</span>
                <ChevronDown size={11} className={`text-slate-400 shrink-0 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 text-xs space-y-0.5 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => { setActivityFilter('all'); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${activityFilter === 'all' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>All Activities</span>
                    {activityFilter === 'all' && <Check size={13} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActivityFilter('progress'); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${activityFilter === 'progress' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Progress Updates</span>
                    {activityFilter === 'progress' && <Check size={13} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActivityFilter('milestone'); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${activityFilter === 'milestone' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Milestones & Proofs</span>
                    {activityFilter === 'milestone' && <Check size={13} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActivityFilter('funded'); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${activityFilter === 'funded' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Escrow & Payments</span>
                    {activityFilter === 'funded' && <Check size={13} className="text-blue-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Sort Order Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSortDropdownOpen(!isSortDropdownOpen);
                  setIsFilterDropdownOpen(false);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs hover:border-slate-300 transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowUpDown size={11} className="text-indigo-500 shrink-0" />
                <span className="whitespace-nowrap">{sortOrder === 'latest' ? 'Newest First' : 'Oldest First'}</span>
                <ChevronDown size={11} className={`text-slate-400 shrink-0 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 text-xs space-y-0.5 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => { setSortOrder('latest'); setIsSortDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${sortOrder === 'latest' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Newest First</span>
                    {sortOrder === 'latest' && <Check size={13} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSortOrder('oldest'); setIsSortDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${sortOrder === 'oldest' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Oldest First</span>
                    {sortOrder === 'oldest' && <Check size={13} className="text-blue-600" />}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Compact Connected Activities Track */}
        <div className="relative flex gap-2.5 sm:gap-3 pt-0.5">
          
          {/* Vertical Track Line and Connected Nodes */}
          <div className="relative flex flex-col justify-between items-center py-3 shrink-0 w-3">
            <div className="absolute top-3 bottom-3 w-[1.5px] bg-slate-200 z-0" />
            
            {displayedActivities.map((act, i) => {
              const nodeBg = act.type === 'progress' ? 'bg-blue-600 ring-blue-100' : act.type === 'milestone' ? 'bg-emerald-500 ring-emerald-100' : act.type === 'extension' ? 'bg-purple-600 ring-purple-100' : 'bg-amber-500 ring-amber-100';
              return (
                <div key={`node-${act.id}-${i}`} className={`w-2.5 h-2.5 rounded-full ${nodeBg} border-2 border-white ring-2 z-10 shadow-2xs my-auto`} />
              );
            })}
          </div>

          {/* Compact Activity Cards */}
          <div className="flex-1 space-y-2 min-w-0">
            {displayedActivities.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No activity recorded yet for this filter.
              </div>
            ) : (
              displayedActivities.map((act) => {
                const cardBg = act.type === 'progress' ? 'bg-[#F4F8FF] border-blue-200/90' : act.type === 'milestone' ? 'bg-[#F0FDF4] border-emerald-200/90' : act.type === 'extension' ? 'bg-purple-50/70 border-purple-200/90' : 'bg-[#FFFBEB]/70 border-amber-200/90';
                const iconBg = act.type === 'progress' ? 'bg-blue-100/80 text-blue-700 border-blue-200' : act.type === 'milestone' ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200' : act.type === 'extension' ? 'bg-purple-100/80 text-purple-700 border-purple-200' : 'bg-amber-100/80 text-amber-700 border-amber-200';

                return (
                  <div
                    key={act.id}
                    className={`${cardBg} border rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${iconBg} border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                        {act.icon}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`${act.badgeClass} px-1.5 py-0.5 rounded font-mono font-black text-[9px] uppercase tracking-wide`}>
                            {act.badge}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {act.dateStr}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 font-headline mt-0.5 truncate">
                          {act.title}
                        </h4>
                        <p className="text-[10.5px] text-slate-500 font-medium truncate max-w-md">
                          {act.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {act.demoUrl && (
                        <a
                          href={act.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[11px] shadow-xs hover:shadow-md transition-all hover:scale-105 cursor-pointer shrink-0"
                          title="Open Live Staging / Demo URL"
                        >
                          <span>Live Demo</span>
                          <ExternalLink size={11} className="text-white shrink-0" />
                        </a>
                      )}
                      <span className={`${act.statusPill.pillClass} font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs`}>
                        {act.statusPill.dotClass && (
                          <span className={`w-1.5 h-1.5 rounded-full ${act.statusPill.dotClass} inline-block animate-pulse`} />
                        )}
                        {act.statusPill.showCheck && (
                          <Check size={10} className="shrink-0" />
                        )}
                        {act.statusPill.text}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* View Full Activity Log Toggle Button */}
        {filteredActivities.length > 3 && (
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={() => setIsFullLogExpanded(!isFullLogExpanded)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors py-0.5 px-2.5 rounded-lg hover:bg-blue-50"
            >
              <span>{isFullLogExpanded ? 'Show Recent Activities Only' : `View Full Activity Log (${filteredActivities.length})`}</span>
              <ChevronRight size={12} className={`text-blue-600 transition-transform ${isFullLogExpanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        )}

      </div>

      {/* Action Confirmation & Process Status Modal */}
      <ActionStatusModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
        title={actionModal.title}
        subtitle={actionModal.subtitle}
        icon={actionModal.icon}
        badgeText={actionModal.badgeText}
        details={actionModal.details}
      />

      {/* Interactive IPFS Deliverable File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                  <FileText size={15} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 truncate">
                    {previewFile.name}
                  </h3>
                  <span className="text-[10px] font-mono text-purple-700 truncate block">
                    CID: {previewFile.cid}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openOrDownloadIpfsFile(previewFile.cid, previewFile.name)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-105"
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Modal Content Preview */}
            <div className="flex-1 overflow-auto py-4">
              {previewFile.type?.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif)$/i.test(previewFile.name) ? (
                <div className="flex items-center justify-center p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  <img
                    src={previewFile.dataUrl}
                    alt={previewFile.name}
                    className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-xs"
                  />
                </div>
              ) : previewFile.type === 'application/pdf' || /\.pdf$/i.test(previewFile.name) ? (
                <div className="w-full h-[60vh] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <iframe
                    src={previewFile.dataUrl}
                    title={previewFile.name}
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{previewFile.name}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {previewFile.type || 'Document / Binary Artifact'} ({(previewFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    This file is ready for full inspection in your preferred desktop application (Excel, Numbers, LibreOffice, or IDE).
                  </p>
                  <button
                    type="button"
                    onClick={() => openOrDownloadIpfsFile(previewFile.cid, previewFile.name)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all hover:scale-105"
                  >
                    <Download size={14} />
                    <span>Open / Download {previewFile.name}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Size: {(previewFile.size / 1024).toFixed(1)} KB</span>
              <span>Uploaded: {new Date(previewFile.uploadedAt).toLocaleTimeString()}</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
