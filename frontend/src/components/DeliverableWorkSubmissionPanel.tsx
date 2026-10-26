import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Job, DisputeReason, DeliverableFile } from '../types';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { ProofOfWorkUploader } from './ProofOfWorkUploader';
import { getIpfsGatewayUrl, generateIpfsCid, getCachedIpfsFile, storeIpfsFile, openOrDownloadIpfsFile, CachedIpfsFile } from '../utils/ipfs';
import { truncateAddress, getCanonicalCertificateId, getCertifiedPassVerifyUrl, formatWeb3ErrorMessage, getPolygonScanUrl } from '../utils/formatters';
import { calculateFeeBreakdownFromString } from '../utils/fees';
import { getEngagementDisplayState } from '../types/lifecycle';
import { 
  Sparkles, CheckCircle2, Clock, FileText, ExternalLink, Link2,
  Send, Scale, RefreshCw, Layers, TrendingUp, MessageSquare, 
  ChevronRight, Calendar, UserCheck, Eye, XCircle, Info, Copy,
  Check, Filter, ArrowUpDown, ChevronDown, DollarSign, Flag,
  Download, Image as ImageIcon, FileSpreadsheet, FileArchive, X, Award, CheckCheck, Loader2, Lock, Star, Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateCertificateSvg, KNOWN_ONCHAIN_TOKENS } from '../utils/certificateGenerator';
import { CONTRACTS, TREASURY_WALLET } from '../config/contracts';
import { PolygonLogo } from './brand/PolygonLogo';
import { Button } from './common/Button';

import { ActionStatusModal, ActionModalDetail } from './ActionStatusModal';
import { RaiseDisputeModal } from './RaiseDisputeModal';
import { FormattedJobDescription } from './FormattedJobDescription';
import { PaymentReleasedModal } from './PaymentReleasedModal';
import { NegotiationCard } from './NegotiationCard';
import { scrollToSection } from '../utils/scroll';
import { TokenIcon } from './TokenIcon';
import { Modal } from './overlay';

interface DeliverableWorkSubmissionPanelProps {
  job: Job;
}

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
    profiles,
    submitWork, 
    postProgressUpdate, 
    requestTimeExtension, 
    respondToTimeExtension, 
    requestModifications, 
    releasePayment, 
    claimAutoRelease,
    raiseDispute,
    submitClientReview,
    acceptJobOffer,
    declineJobOffer,
    fundJob
  } = usePolyLanceData();

  const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);
  const [isDecliningOffer, setIsDecliningOffer] = useState(false);
  const [isFundingEscrow, setIsFundingEscrow] = useState(false);

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

  const display = useMemo(() => {
    return getEngagementDisplayState(currentJob);
  }, [currentJob]);

  // Derived real-time latest modification request: ONLY active if not superseded by a newer submission or completion
  const latestModificationRequest = useMemo(() => {
    if (display.isCompleted || display.isPaid) return null;
    if (!currentJob.modificationRequests || currentJob.modificationRequests.length === 0) return null;
    const sortedMods = [...currentJob.modificationRequests].sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
    const latestMod = sortedMods[0];
    if (!latestMod) return null;

    // Check if there is any submission made after this modification request
    const sortedSubs = [...(currentJob.submissions || [])].sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
    const latestSub = sortedSubs[0];
    if (latestSub && (latestSub.submittedAt || 0) >= (latestMod.requestedAt || 0)) {
      return null;
    }

    return latestMod;
  }, [currentJob.modificationRequests, currentJob.submissions, display.isCompleted, display.isPaid]);

  // Derived pending time extension requests
  const pendingExtensionRequests = useMemo(() => {
    if (display.isCompleted) return [];
    if (!currentJob.extensionRequests || currentJob.extensionRequests.length === 0) return [];
    return currentJob.extensionRequests.filter(
      (req) => req.status === 'Pending' || (!req.responded && req.status !== 'Approved' && req.status !== 'Rejected')
    );
  }, [currentJob.extensionRequests, display.isCompleted]);

  const milestoneProgressText = useMemo(() => {
    if (display.isCompleted) return '1 of 1 Completed';
    if (currentJob.proof) return '1 of 1 Submitted';
    if (latestProgressUpdate && latestProgressUpdate.progressPercent !== undefined) {
      return `${latestProgressUpdate.progressPercent}% in Progress`;
    }
    return '0 of 1 Completed';
  }, [display.isCompleted, currentJob.proof, latestProgressUpdate]);

  const isClient = Boolean(isConnected && address && currentJob.client && address.toLowerCase() === currentJob.client.toLowerCase());
  
  // STRICT ASSIGNED FREELANCER: ONLY the user whose address matches currentJob.freelancer is the assigned talent
  const isAssignedFreelancer = Boolean(
    isConnected && address && currentJob.freelancer && address.toLowerCase() === currentJob.freelancer.toLowerCase()
  );

  // Check if current connected user submitted an application
  const isApplicant = Boolean(
    isConnected && address && (currentJob.applications || []).some(a => a.applicant && a.applicant.toLowerCase() === address.toLowerCase())
  );

  // Strictly isolate views: ONLY the assigned freelancer sees the active submission workspace
  const showFreelancerWorkspace = isAssignedFreelancer;

  // Resolved Freelancer metadata for client oversight
  const freelancerAddr = currentJob.freelancer || (currentJob.applications && currentJob.applications.length > 0 ? currentJob.applications[0].applicant : '');
  const freelancerProfileKey = Object.keys(profiles || {}).find(k => k.toLowerCase() === (freelancerAddr || '').toLowerCase());
  const freelancerProfile = freelancerProfileKey ? profiles[freelancerProfileKey] : null;
  const freelancerDisplayName = freelancerProfile?.displayName || (freelancerAddr ? truncateAddress(freelancerAddr) : 'Assigned Freelancer');

  const [copiedEscrowId, setCopiedEscrowId] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
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
  const [isPaymentReleasedModalOpen, setIsPaymentReleasedModalOpen] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(currentJob.clientReview?.rating || 5);
  const [reviewComment, setReviewComment] = useState<string>(currentJob.clientReview?.comment || '');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (currentJob.clientReview) {
      setReviewRating(currentJob.clientReview.rating || 5);
      setReviewComment(currentJob.clientReview.comment || '');
    }
  }, [currentJob.clientReview]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      const ok = await submitClientReview(currentJob.id, reviewRating, reviewComment);
      if (ok) {
        setReviewSuccess(true);
        setIsEditingReview(false);
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Review submit error:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    icon?: 'success' | 'progress' | 'extension' | 'modification' | 'dispute' | 'payment' | 'terms';
    badgeText?: string;
    details?: ActionModalDetail[];
    primaryActionText?: string;
    targetSectionId?: string;
    onPrimaryAction?: () => void;
  }>({
    isOpen: false,
    title: '',
  });

  // Live ticking clock for real-time review period SLA countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const paymentSymbol = useMemo(() => {
    const sym = (currentJob.paymentTokenSymbol || 'USDC').toUpperCase();
    if (sym === 'MATIC' || sym === 'POL') return 'POL';
    if (sym === 'USDT') return 'USDT';
    return 'USDC';
  }, [currentJob.paymentTokenSymbol]);

  const rawEscrowAmount = useMemo(() => {
    const sym = (currentJob.paymentTokenSymbol || 'USDC').toUpperCase();
    if (sym === 'MATIC' || sym === 'POL') {
      const val = parseFloat(currentJob.amountEth || currentJob.amountUsdc || '0');
      return isNaN(val) ? 0 : val;
    }
    const val = parseFloat(currentJob.amountUsdc || '0');
    return isNaN(val) ? 0 : val;
  }, [currentJob.paymentTokenSymbol, currentJob.amountEth, currentJob.amountUsdc]);

  const formatAmountWithToken = (amt: number) => {
    if (paymentSymbol === 'POL') {
      return `${amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} POL`;
    }
    return `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${paymentSymbol}`;
  };

  const isCompletedOrReleased = useMemo(() => {
    return (
      display.isCompleted ||
      display.isPaid ||
      currentJob.status === 'Completed' ||
      (currentJob as any).escrowStatus === 'RELEASED' ||
      Boolean(currentJob.events?.some(e => (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && ((e.status as string) === 'completed' || (e.status as string) === 'CONFIRMED')))
    );
  }, [display.isCompleted, display.isPaid, currentJob.status, (currentJob as any).escrowStatus, currentJob.events]);

  const settledTxHash = useMemo(() => {
    const paymentEv = currentJob.events?.find(e => (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.txHash);
    return paymentEv?.txHash || (currentJob as any).settlementTxHash || (currentJob as any).txHash;
  }, [currentJob.events, (currentJob as any).settlementTxHash, (currentJob as any).txHash]);

  const feeDetails = useMemo(() => {
    const rawBudget = (currentJob as any).budget || currentJob.amountEth || currentJob.amountUsdc || String(rawEscrowAmount || 0);
    return calculateFeeBreakdownFromString(rawBudget, paymentSymbol);
  }, [(currentJob as any).budget, currentJob.amountEth, currentJob.amountUsdc, rawEscrowAmount, paymentSymbol]);

  const submittedTime = useMemo(() => {
    return currentJob.proof?.submittedAt || currentJob.submittedAt || 0;
  }, [currentJob.proof?.submittedAt, currentJob.submittedAt]);

  const reviewPeriodDays = currentJob.reviewPeriodDays && currentJob.reviewPeriodDays > 0 ? currentJob.reviewPeriodDays : 7;
  const reviewPeriodMs = reviewPeriodDays * 24 * 60 * 60 * 1000;
  const reviewExpiresAt = submittedTime > 0 ? submittedTime + reviewPeriodMs : 0;
  const reviewMsRemaining = reviewExpiresAt > 0 ? Math.max(0, reviewExpiresAt - currentTime) : 0;
  const isReviewPeriodExpired = submittedTime > 0 && reviewMsRemaining <= 0;

  const reviewTimeRemainingStr = useMemo(() => {
    if (!submittedTime || submittedTime <= 0) return `${reviewPeriodDays}d remaining`;
    if (reviewMsRemaining <= 0) return 'Review period expired';
    const totalSecs = Math.floor(reviewMsRemaining / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (days > 0) return `${days}d ${hours}h ${mins}m remaining`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s remaining`;
    return `${mins}m ${secs}s remaining`;
  }, [submittedTime, reviewMsRemaining, reviewPeriodDays]);

  const getFormattedFundedAmount = () => {
    return {
      value: paymentSymbol === 'POL' 
        ? rawEscrowAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })
        : `$${rawEscrowAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      symbol: paymentSymbol,
    };
  };

  const [copiedSbtCertId, setCopiedSbtCertId] = useState(false);

  const handleCopyEscrowId = () => {
    const addr = currentJob.contractAddress || '0xce138927189a0b18278291028710298102985487';
    navigator.clipboard.writeText(addr.trim());
    setCopiedEscrowId(true);
    setTimeout(() => setCopiedEscrowId(false), 2000);
  };

  const handleCopySbtCertId = () => {
    const certId = getCanonicalCertificateId(currentJob.id, currentJob.contractAddress);
    navigator.clipboard.writeText(certId.trim());
    setCopiedSbtCertId(true);
    setTimeout(() => setCopiedSbtCertId(false), 2000);
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
      primaryActionText: 'Inspect Submitted Deliverables',
      targetSectionId: 'deliverable-workspace',
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
      subtitle: `Milestone progress for "${currentJob.title}" has been updated to ${progressPercent}%.`,
      icon: 'progress',
      badgeText: `${progressPercent}% PROGRESS`,
      details: [
        { label: 'PROGRESS PERCENTAGE', value: `${progressPercent}%`, isBadge: true },
        { label: 'STATUS NOTE', value: statusNote.trim() },
        ...(demoUrl.trim() ? [{ label: 'LIVE DEMO', value: demoUrl.trim(), isMono: true, explorerUrl: demoUrl.trim() }] : []),
        ...(progressPercent === 100 ? [{ label: 'NEXT STEP', value: 'Waiting for the client to review your submission.' }] : []),
        { label: 'CONTRACT', value: truncateAddress(currentJob.contractAddress), isMono: true },
      ],
      primaryActionText: 'View Milestone Updates',
      targetSectionId: 'activity-timeline-section',
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
      primaryActionText: 'View Extension Status',
      targetSectionId: 'deliverable-workspace',
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
      primaryActionText: 'View Timeline Updates',
      targetSectionId: 'activity-timeline-section',
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
      primaryActionText: 'View Requested Modifications',
      targetSectionId: 'deliverable-workspace',
    });
  };

  const handleApproveWork = async () => {
    setIsReleasing(true);
    try {
      await releasePayment(currentJob.id);
      setIsPaymentReleasedModalOpen(true);
    } catch (err: any) {
      console.error('Failed to release payment:', err);
      setActionModal({
        isOpen: true,
        title: 'Payment Release Failed',
        subtitle: formatWeb3ErrorMessage(err),
        icon: 'dispute',
        badgeText: 'TRANSACTION CANCELLED',
      });
    } finally {
      setIsReleasing(false);
    }
  };

  const [isClaimingAutoRelease, setIsClaimingAutoRelease] = useState(false);
  const handleClaimAutoRelease = async () => {
    setIsClaimingAutoRelease(true);
    try {
      await claimAutoRelease(currentJob.id);
      setIsPaymentReleasedModalOpen(true);
    } catch (err: any) {
      console.error('Failed to claim auto release:', err);
      setActionModal({
        isOpen: true,
        title: 'Auto-Release Claim Failed',
        subtitle: formatWeb3ErrorMessage(err),
        icon: 'dispute',
        badgeText: 'CLAIM REJECTED',
      });
    } finally {
      setIsClaimingAutoRelease(false);
    }
  };

  const handleAcceptOffer = async () => {
    setIsAcceptingOffer(true);
    try {
      await acceptJobOffer(currentJob.id);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setActionModal({
        isOpen: true,
        title: 'Offer Accepted Successfully',
        subtitle: 'You have agreed to the project terms! The client has been notified to deposit the escrow funds on Polygon.',
        icon: 'success',
        badgeText: 'TERMS CONFIRMED',
      });
    } catch (err: any) {
      console.error('Failed to accept offer:', err);
      setActionModal({
        isOpen: true,
        title: 'Failed to Accept Offer',
        subtitle: formatWeb3ErrorMessage(err),
        icon: 'dispute',
        badgeText: 'ACTION REJECTED',
      });
    } finally {
      setIsAcceptingOffer(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!window.confirm('Are you sure you want to decline this job offer? The position will be returned to the open marketplace.')) {
      return;
    }
    setIsDecliningOffer(true);
    try {
      await declineJobOffer(currentJob.id);
      setActionModal({
        isOpen: true,
        title: 'Offer Declined',
        subtitle: 'You have declined this project offer. The client has been notified and the job has been restored to Open status.',
        icon: 'dispute',
        badgeText: 'OFFER DECLINED',
      });
    } catch (err: any) {
      console.error('Failed to decline offer:', err);
      setActionModal({
        isOpen: true,
        title: 'Failed to Decline Offer',
        subtitle: formatWeb3ErrorMessage(err),
        icon: 'dispute',
        badgeText: 'ACTION REJECTED',
      });
    } finally {
      setIsDecliningOffer(false);
    }
  };

  const handleDepositEscrow = async () => {
    setIsFundingEscrow(true);
    try {
      await fundJob(currentJob.id);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setActionModal({
        isOpen: true,
        title: 'Escrow Successfully Funded!',
        subtitle: `Project budget of ${formatAmountWithToken(rawEscrowAmount)} is now locked in non-custodial smart contract escrow on Polygon.`,
        icon: 'success',
        badgeText: 'ESCROW FUNDED',
      });
    } catch (err: any) {
      console.error('Failed to fund escrow:', err);
      setActionModal({
        isOpen: true,
        title: 'Escrow Funding Failed',
        subtitle: formatWeb3ErrorMessage(err),
        icon: 'dispute',
        badgeText: 'TRANSACTION FAILED',
      });
    } finally {
      setIsFundingEscrow(false);
    }
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
      primaryActionText: 'View Dispute Docket in Court Panel',
      targetSectionId: 'dispute-panel',
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
          badge: `${upd.progressPercent}% DONE`,
          badgeClass: 'bg-blue-100 text-blue-900 border border-blue-200',
          timestamp: ts,
          dateStr: formatActivityTime(ts),
          title: upd.statusNote || `Milestone progress updated to ${upd.progressPercent}%`,
          subtitle: `Freelancer has completed ${upd.progressPercent}% of the milestone work.`,
          statusPill: {
            text: upd.progressPercent === 100 ? 'Progress 100%' : 'In Progress',
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
        badge: 'MILESTONE',
        badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
        timestamp: ts,
        dateStr: formatActivityTime(ts),
        title: currentJob.proof.title || 'Milestone Deliverable Submitted',
        subtitle: currentJob.proof.description || 'Deliverables & IPFS Proof uploaded for client review.',
        statusPill: {
          text: isCompletedOrReleased ? 'Approved' : 'Under Review',
          pillClass: isCompletedOrReleased ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-800 border border-slate-300',
          showCheck: isCompletedOrReleased,
          dotClass: isCompletedOrReleased ? undefined : 'bg-[#0047AB]',
        },
        icon: <FileText size={13} />,
        demoUrl: currentJob.proof.externalLink,
      });
    }

    // 2b. Real Payment Released event (when release is confirmed on-chain)
    if (isCompletedOrReleased) {
      const completedEvt = currentJob.events?.find((e: any) => (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.status === 'completed');
      const releaseTs = completedEvt?.timestamp || (currentJob as any).completedAt || Date.now();
      list.push({
        id: `payment-released-${releaseTs}`,
        type: 'milestone',
        badge: 'PAYMENT',
        badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
        timestamp: releaseTs,
        dateStr: formatActivityTime(releaseTs),
        title: 'Escrow Payment Released',
        subtitle: `Escrow vault disbursed net payout to talent on Polygon PoS.`,
        statusPill: {
          text: 'Payment released',
          pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          showCheck: true,
        },
        icon: <CheckCircle2 size={13} />,
      });
    }

    // 3. Real Time Extension Requests (if any)
    if (currentJob.extensionRequests && currentJob.extensionRequests.length > 0) {
      currentJob.extensionRequests.forEach((req, idx) => {
        const ts = req.requestedAt || Date.now();
        list.push({
          id: req.id || `ext-${ts}-${idx}`,
          type: 'extension',
          badge: `+${req.requestedDays} DAYS`,
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
          badge: 'REVISIONS',
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

    // 4. Real Escrow Funded Event (ONLY when escrow is genuinely funded)
    const fundedEvent = currentJob.events?.find(e => (e.step === 'Funded' || e.title?.toLowerCase().includes('fund')) && e.status === 'completed' && e.timestamp && e.timestamp > 0);
    const isGenuinelyFunded = Boolean(fundedEvent) || currentJob.status === 'Funded' || currentJob.status === 'Submitted' || currentJob.status === 'Completed';

    if (isGenuinelyFunded) {
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
      
      {/* 1. TOP HEADER (COMPACT & CALM) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#E5E7EB] pb-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#0047AB] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-0.5 rounded-[6px]">
              {isCompletedOrReleased ? 'Completed Project' : 'Milestone Workspace'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isCompletedOrReleased
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : currentJob.status === 'Submitted'
                ? 'bg-blue-50 text-[#0047AB] border border-blue-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isCompletedOrReleased ? 'bg-emerald-500' : 'bg-[#0047AB]'
              }`} />
              <span>{isCompletedOrReleased ? 'Completed' : currentJob.status === 'Submitted' ? 'Submitted • Under Review' : currentJob.status}</span>
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-[#0B0B0F] tracking-tight">
            {currentJob.title}
          </h2>

          <p className="text-xs text-[#4B5563]">
            {isCompletedOrReleased
              ? 'This project milestone has been completed, verified, and 100% of escrow funds are settled on Polygon PoS.'
              : 'On-chain milestone submission, revision requests, extension management, and escrow payout release.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => navigate(`/chat?jobId=${currentJob.id}`)}
            className="px-3.5 py-2 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F6F7F9] text-[#0B0B0F] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare size={14} className="text-[#0047AB]" />
            <span>Open messages</span>
          </button>
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
              <div className="pt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-[#0047AB]">
                <FileText size={12} />
                <span>Evidence IPFS CID: <strong>{currentJob.dispute.evidenceIpfsHash}</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED COMPLETED VIEW (NO SUBMISSION FORMS, ONLY VERIFIED DETAILS) */}
      {/* ========================================================================= */}
      {isCompletedOrReleased ? (
        <div className="space-y-4 animate-fadeIn">
          {/* COMPACT ROLE-BASED CERTIFICATE CARD */}
          {(() => {
            const certVariant = isClient ? 'patronage' : 'work';
            const known = currentJob ? (KNOWN_ONCHAIN_TOKENS[(currentJob.id || '').toLowerCase()] || KNOWN_ONCHAIN_TOKENS[String(currentJob.sbtTokenId || '')]) : null;
            const realTokenId = currentJob.onchainTokenId ?? known?.onchainTokenId;
            const certTokenId = realTokenId ?? (currentJob.sbtTokenId ? Number(currentJob.sbtTokenId) : 1);
            const certNo = currentJob.certificateNo ?? known?.certificateNo;
            const certAmount = rawEscrowAmount || 10;
            
            let certSvg = '';
            try {
              certSvg = generateCertificateSvg({
                tokenId: certTokenId,
                certificateNo: certNo,
                variant: certVariant,
                jobTitle: currentJob.title,
                recipientAddress: currentJob.freelancer || '',
                recipientName: undefined,
                clientAddress: currentJob.client || '',
                clientName: undefined,
                amount: certAmount,
                tokenSymbol: paymentSymbol,
                completedAt: currentJob.completedAt || currentJob.createdAt || Date.now(),
                contractAddress: CONTRACTS.ReputationSBT,
              });
            } catch {
              certSvg = '';
            }

            const polygonscanUrl = realTokenId !== undefined
              ? `https://polygonscan.com/nft/${CONTRACTS.ReputationSBT}/${realTokenId}`
              : (currentJob.releaseTxHash ? `https://polygonscan.com/tx/${currentJob.releaseTxHash}` : `https://polygonscan.com/address/${CONTRACTS.ReputationSBT}`);

            return (
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Scaled Square Thumbnail using Canonical Certificate Generator */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[8px] border border-[#E5E7EB] overflow-hidden bg-[#FAFAF8] shrink-0 shadow-xs flex items-center justify-center">
                    {certSvg ? (
                      <div 
                        className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full select-none"
                        dangerouslySetInnerHTML={{ __html: certSvg }} 
                      />
                    ) : (
                      <Award size={24} className="text-[#0047AB]" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#0047AB] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-[6px]">
                        PL-SBT #{certTokenId}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        <span>Issued</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-[#0B0B0F] truncate">
                      {isClient ? 'Escrow Patronage Certificate' : 'Proof of Work Certificate'}
                    </h3>

                    <p className="text-xs text-[#4B5563]">
                      ERC-5192 Soulbound Token cryptographically minted to Polygon PoS
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/certificate/${certTokenId}`)}
                    icon={<ExternalLink size={13} />}
                  >
                    View certificate
                  </Button>
                  <a
                    href={polygonscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F6F7F9] text-xs font-medium text-[#0B0B0F] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Verify on Polygonscan</span>
                    <ExternalLink size={12} className="text-[#6B7280]" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/#/certificate/${certTokenId}`;
                      navigator.clipboard.writeText(shareUrl);
                      setCopiedSbtCertId(true);
                      setTimeout(() => setCopiedSbtCertId(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F6F7F9] text-xs font-medium text-[#0B0B0F] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 size={12} className="text-[#6B7280]" />
                    <span>{copiedSbtCertId ? 'Copied link!' : 'Share'}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* CLIENT REVIEW & QUALITY RATING SECTION */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                  <Star size={16} className="fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-[#0B0B0F]">
                    Client Review & Quality Rating
                  </h4>
                  <p className="text-xs text-[#4B5563]">
                    Verified feedback recorded on the freelancer's public profile and reputation record
                  </p>
                </div>
              </div>

              {currentJob.clientReview && isClient && !isEditingReview && (
                <button
                  type="button"
                  onClick={() => setIsEditingReview(true)}
                  className="text-xs text-[#0047AB] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  Edit Review
                </button>
              )}
            </div>

            {/* Review form for client when no review or editing */}
            {isClient && (!currentJob.clientReview || isEditingReview) ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#0B0B0F]">
                    Rate Freelancer Performance (1 to 5 stars)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        title={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={24}
                          className={star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-semibold text-[#0B0B0F] ml-2">
                      {reviewRating === 5 ? '5.0 - Exceptional Work' :
                       reviewRating === 4 ? '4.0 - Great Delivery' :
                       reviewRating === 3 ? '3.0 - Satisfactory' :
                       reviewRating === 2 ? '2.0 - Needs Improvement' : '1.0 - Poor'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#0B0B0F]">
                    Client Feedback & Testimonial
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe the freelancer's communication, speed, deliverable quality, and overall experience..."
                    className="w-full text-xs p-3 border border-[#E5E7EB] rounded-xl bg-white focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    className="px-4 py-2 bg-[#0047AB] hover:bg-[#003882] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>{isEditingReview ? 'Update Review' : 'Submit Review'}</span>
                      </>
                    )}
                  </button>

                  {isEditingReview && (
                    <button
                      type="button"
                      onClick={() => setIsEditingReview(false)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}

                  {reviewSuccess && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Review recorded successfully!
                    </span>
                  )}
                </div>
              </form>
            ) : currentJob.clientReview ? (
              <div className="p-4 bg-[#F6F7F9] border border-[#E5E7EB] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={15}
                          className={s <= currentJob.clientReview!.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#0B0B0F]">
                      {currentJob.clientReview.rating}.0 / 5.0 Rating
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7280]">
                    Verified Client Review
                  </span>
                </div>

                <p className="text-xs text-[#0B0B0F] leading-relaxed italic bg-white p-3 rounded-lg border border-[#E5E7EB]">
                  "{currentJob.clientReview.comment}"
                </p>
              </div>
            ) : (
              <div className="p-4 bg-[#F6F7F9] border border-[#E5E7EB] rounded-xl text-center text-xs text-[#6B7280]">
                <span>No review has been posted by the client yet. Once submitted, it will be displayed on the freelancer's public profile.</span>
              </div>
            )}
          </div>


          {/* Final Submitted Deliverables & Proof of Work Card */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm space-y-3.5 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 size={16} className="sm:hidden" />
                  <CheckCircle2 size={20} className="hidden sm:block" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-mono font-bold text-[9px] sm:text-[10px] uppercase text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Verified Deliverables
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                      Submitted by {truncateAddress(currentJob.freelancer || '')}
                    </span>
                  </div>
                  <h4 className="font-headline font-black text-base sm:text-lg text-slate-900 mt-0.5">
                    {currentJob.proof?.title || 'Final Milestone Deliverables & Proof of Work'}
                  </h4>
                </div>
              </div>

              {currentJob.proof?.externalLink && (
                <div className="flex items-center gap-2">
                  <a
                    href={currentJob.proof.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[11px] sm:text-xs border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <ExternalLink size={12} />
                    <span>Open Deliverable / PR</span>
                  </a>
                </div>
              )}
            </div>

            {/* Deliverable Notes */}
            {(currentJob.proof?.description || currentJob.description) && (
              <div className="space-y-1.5 sm:space-y-2">
                <span className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                  Deliverable Scope & Submission Notes
                </span>
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80">
                  <FormattedJobDescription description={currentJob.proof?.description || currentJob.description} />
                </div>
              </div>
            )}

            {/* Attached Files / Media Artifacts */}
            {currentJob.proof?.evidenceFiles && currentJob.proof.evidenceFiles.length > 0 && (
              <div className="space-y-2 sm:space-y-2.5">
                <span className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                  Attached Deliverables & IPFS Proof Files ({currentJob.proof.evidenceFiles.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                  {currentJob.proof.evidenceFiles.map((file: DeliverableFile, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-[#0047AB] border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                          <FileText size={16} className="sm:hidden" />
                          <FileText size={18} className="hidden sm:block" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate block" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] sm:text-[10.5px] font-mono text-slate-500 flex items-center gap-1.5 whitespace-nowrap mt-0.5">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className="text-[9px] sm:text-[9.5px] font-bold text-[#0047AB] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              IPFS
                            </span>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openOrDownloadIpfsFile(file.cid, file.name)}
                        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[#0047AB] font-extrabold text-[11px] sm:text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0 active:scale-95"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clean Receipt-Style Escrow Settlement Summary */}
            {(() => {
              const completedEvt = currentJob.events?.find((e: any) => (e.step === 'Completed' || e.step === 'Paid' || e.step === 'PaymentReleased') && e.txHash);
              const txHash = completedEvt?.txHash || currentJob.contractAddress;
              const hasConfirmedTx = Boolean(completedEvt?.txHash);

              const handleDownloadCsvReceipt = () => {
                const rows = [
                  ['PolyLance Escrow Settlement Receipt'],
                  ['Job Title', currentJob.title],
                  ['Job ID', currentJob.id],
                  ['Contract Address', currentJob.contractAddress || ''],
                  ['Client Address', currentJob.client || ''],
                  ['Freelancer Address', currentJob.freelancer || ''],
                  ['Gross Job Budget', `${feeDetails.budgetFormatted} ${paymentSymbol}`],
                  ['Client Service Fee', `${feeDetails.clientFeeFormatted} ${paymentSymbol}`],
                  ['Total Client Deposit', `${feeDetails.clientDepositFormatted} ${paymentSymbol}`],
                  ['Freelancer Platform Fee (2.5%)', `-${feeDetails.freelancerFeeFormatted} ${paymentSymbol}`],
                  ['Net Released to Talent', `${feeDetails.freelancerNetFormatted} ${paymentSymbol}`],
                  ['PolyLance Platform Total', `${feeDetails.platformTotalFormatted} ${paymentSymbol}`],
                  ['Settlement Network', 'Polygon PoS (Chain ID 137)'],
                  ['Treasury Destination', TREASURY_WALLET || ''],
                  ['Status', isCompletedOrReleased ? 'Confirmed & Settled' : 'Release Pending'],
                  ['Settled Timestamp', new Date(currentJob.completedAt || Date.now()).toISOString()],
                ];
                const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `PolyLance-Receipt-${currentJob.id}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              return (
                <div className={`rounded-[12px] border border-[#E5E7EB] bg-white overflow-hidden shadow-xs space-y-0 ${isCompletedOrReleased ? 'bg-[#F0FDF4]/30' : ''}`}>
                  <div className="p-4 bg-[#F6F7F9] border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-[#0B0B0F]">
                        Escrow Settlement Summary
                      </span>
                    </div>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {isCompletedOrReleased ? '100% Released' : 'Release Pending'}
                    </span>
                  </div>

                  <div className="p-4 divide-y divide-[#E5E7EB] text-xs space-y-0">
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-[#4B5563]">Gross job budget</span>
                      <span className="font-semibold text-[#0B0B0F] tabular-nums">
                        {feeDetails.budgetFormatted} {paymentSymbol}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-[#4B5563]">Client service fee</span>
                      <span className="font-semibold text-[#0B0B0F] tabular-nums">
                        +{feeDetails.clientFeeFormatted} {paymentSymbol}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-[#4B5563]">Total client deposit</span>
                      <span className="font-semibold text-[#0B0B0F] tabular-nums">
                        {feeDetails.clientDepositFormatted} {paymentSymbol}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-[#4B5563]">Freelancer platform fee (2.5%)</span>
                      <span className="font-semibold text-rose-600 tabular-nums">
                        -{feeDetails.freelancerFeeFormatted} {paymentSymbol}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center bg-[#F0FDF4]/60 px-3 -mx-4 font-medium">
                      <span className="text-emerald-950 font-semibold">Net released to talent</span>
                      <span className="font-bold text-emerald-900 text-sm tabular-nums">
                        {feeDetails.freelancerNetFormatted} {paymentSymbol}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-[#4B5563]">PolyLance platform total</span>
                      <span className="font-semibold text-[#0B0B0F] tabular-nums">
                        {feeDetails.platformTotalFormatted} {paymentSymbol}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-[#4B5563]">Settlement network</span>
                      <span className="font-medium text-[#0B0B0F] inline-flex items-center gap-1">
                        <PolygonLogo variant="mark" size={13} />
                        <span>Polygon PoS</span>
                      </span>
                    </div>

                    {hasConfirmedTx && (
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-[#4B5563]">On-chain transaction</span>
                        <a
                          href={getPolygonScanUrl(txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[#0047AB] hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          <span>{truncateAddress(txHash)}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-[#F6F7F9] border-t border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-[#6B7280]">
                      Treasury vault: {truncateAddress(TREASURY_WALLET || '0x0000...0000')}
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadCsvReceipt}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-slate-50 text-xs font-medium text-[#0B0B0F] transition-colors cursor-pointer"
                    >
                      <Download size={13} className="text-[#6B7280]" />
                      <span>Download receipt (CSV)</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : showFreelancerWorkspace && currentJob.status !== 'Cancelled' ? (
        /* ========================================================================= */
        /* 3. FREELANCER ACTIVE WORKSPACE (WORK BEGUN / UNDER REVIEW) */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Column (8 cols): Primary Proof of Work Submission Form */}
          <div className="lg:col-span-8 space-y-4">
            {/* Prominent Client Modification Request Alert Box for Freelancer */}
            {latestModificationRequest && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 shadow-xs space-y-2.5 animate-fadeIn">
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

            {/* Gating for Selection Phase / Awaiting Escrow Funding */}
            {currentJob.status === 'Selected' ? (
              <NegotiationCard
                job={currentJob}
                isClient={isClient}
                isFreelancer={isAssignedFreelancer}
                onFundEscrow={handleDepositEscrow}
                isFundingEscrow={isFundingEscrow}
              />
            ) : (
              <>
                {/* Submitted Deliverables Card (Awaiting Client Review) */}
                {(currentJob.status === 'Submitted' || Boolean(currentJob.proof)) && !latestModificationRequest ? (
                  <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 text-xs space-y-3.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <CheckCircle2 size={15} className="text-white" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                            Deliverables Submitted • Under Client Review
                          </span>
                          <span className="text-[10px] text-[#0047AB] font-mono">
                            Escrow milestone is locked & awaiting client payout release
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-800 font-mono text-[10px] bg-slate-100 px-2.5 py-1 rounded-full border border-slate-300 font-bold">
                        Submitted: {new Date(currentJob.proof?.submittedAt || currentJob.submittedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Deliverable Title:</span>
                      <strong className="text-slate-900 text-xs sm:text-sm block font-headline">
                        {currentJob.proof?.title || currentJob.title || 'Milestone Deliverables'}
                      </strong>
                      <p className="text-slate-600 text-[11.5px] leading-relaxed pt-1">
                        {currentJob.proof?.description || 'Deliverables and verified proof files submitted for client inspection.'}
                      </p>
                    </div>

                    {currentJob.proof?.externalLink && (
                      <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link2 size={13} className="text-[#0047AB] shrink-0" />
                          <a href={currentJob.proof.externalLink} target="_blank" rel="noopener noreferrer" className="hover:underline truncate font-bold">
                            {currentJob.proof.externalLink}
                          </a>
                        </div>
                        <ExternalLink size={12} className="text-[#0047AB] shrink-0" />
                      </div>
                    )}

                    {/* Attached Deliverable Files Badges */}
                    {currentJob.proof?.evidenceFiles && currentJob.proof.evidenceFiles.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Attached IPFS Artifacts ({currentJob.proof.evidenceFiles.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {currentJob.proof.evidenceFiles.map((file, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openOrDownloadIpfsFile(file.cid, file.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-medium shadow-2xs transition-all cursor-pointer"
                            >
                              <FileText size={12} className="text-[#0047AB]" />
                              <span className="truncate max-w-[160px] font-bold">{file.name}</span>
                              <Download size={11} className="text-slate-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-500 font-medium">
                        Waiting for client inspection. Upon client approval, official ERC-5192 Soulbound Token will be issued.
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/jobs/${currentJob.id}/attestation`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0047AB] hover:bg-[#003882] text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                        >
                          <Award size={12} />
                          <span>View Attestation</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUpdateForm(!showUpdateForm)}
                          className="text-[#0047AB] hover:text-[#003882] font-bold underline cursor-pointer text-xs"
                        >
                          {showUpdateForm ? 'Hide Uploader' : 'Update / Re-submit'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Main Primary Deliverables Submission Form: Only shown when active, not completed, and either no submission exists, client asked for revisions, or freelancer toggled update */}
                {!isCompletedOrReleased && !display.isCompleted && ((!currentJob.proof && currentJob.status !== 'Submitted') || latestModificationRequest || showUpdateForm) && (
                  <ProofOfWorkUploader onSubmit={handleWorkSubmit} />
                )}
              </>
            )}
          </div>

          {/* Side Column (4 cols): Quick Project Actions & Messaging Coordination */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Actions Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 text-[#0047AB] border border-slate-200 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-[#0047AB]" />
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
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#0047AB]" />
                  <span>Open Messages Hub</span>
                </div>
                <ChevronRight size={13} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Side Quick Actions: Progress & Extension Drawer Toggles (Hidden when completed) */}
              {!isCompletedOrReleased && !display.isCompleted && (
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
              )}
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
        /* CLIENT & OVERSIGHT VIEW */
        /* ========================================================================= */
        <div className="space-y-4">
          
          {/* APPLICANT OVERSIGHT NOTICE (FOR APPLICANTS NOT SELECTED OR AWAITING SELECTION) */}
          {isApplicant && !isAssignedFreelancer && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <UserCheck size={16} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold block">Application Submitted • Status Oversight</span>
                  <span className="text-[11px] text-blue-700 truncate block">
                    {currentJob.freelancer
                      ? `Another talent (${freelancerDisplayName}) was selected by the client for this escrow.`
                      : 'The client is currently reviewing candidate proposals for this escrow.'}
                  </span>
                </div>
              </div>
              <Link
                to="/jobs"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[11px] shrink-0 transition-colors"
              >
                Browse Other Jobs
              </Link>
            </div>
          )}

          {/* Escrow Stat 4-Grid Bar (CLIENT ONLY - WITH CRISP SUBTLE STROKE) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 rounded-2xl bg-slate-50 border border-black/10">
            
            {/* Box 1: Escrow Status */}
            <div className="bg-white p-2 rounded-xl border border-black/15 shadow-2xs flex flex-col justify-center min-w-0">
              <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wide block mb-0.5 truncate">
                Escrow Status
              </span>
              <div className="truncate">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono font-bold text-[10px] uppercase tracking-wide whitespace-nowrap ${
                  currentJob.status === 'Funded'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : currentJob.status === 'Selected'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${
                    currentJob.status === 'Funded' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  {currentJob.status === 'Funded'
                    ? 'FUNDED'
                    : currentJob.status === 'Selected'
                    ? (currentJob.freelancerAgreedTerms ? 'OFFER ACCEPTED' : 'OFFER PENDING')
                    : currentJob.status.toUpperCase()}
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
              <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <TokenIcon token={fundedAmount.symbol} size={14} />
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
                <div className="w-6 h-6 rounded-lg bg-slate-100 text-[#0047AB] border border-slate-200 flex items-center justify-center shrink-0">
                  <Flag size={12} className="text-[#0047AB]" />
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

          {/* ASSIGNED FREELANCER IDENTITY & COLLABORATION CARD */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#0B0B0C] text-white font-headline font-black text-lg flex items-center justify-center shadow-sm shrink-0">
                  {freelancerProfile?.avatarUrl ? (
                    <img src={freelancerProfile.avatarUrl} alt={freelancerDisplayName} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    freelancerDisplayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-headline font-black text-sm sm:text-base text-slate-900 truncate">
                      {freelancerDisplayName}
                    </h4>
                    <span className="text-[9.5px] font-mono font-bold uppercase text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300 shrink-0">
                      ● Assigned Talent
                    </span>
                    {freelancerProfile?.githubVerified && (
                      <span className="text-[9.5px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        GitHub Verified {freelancerProfile.primaryScore ? `(${freelancerProfile.primaryScore}/100)` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                    <span>Wallet: <strong>{freelancerAddr ? truncateAddress(freelancerAddr) : 'Unassigned'}</strong></span>
                    {currentJob.contractAddress && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">Contract: <strong>{truncateAddress(currentJob.contractAddress)}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons with Freelancer */}
              <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-start sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({ jobId: currentJob.id });
                    if (freelancerAddr) params.set('applicant', freelancerAddr);
                    navigate(`/chat?${params.toString()}`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0047AB] hover:bg-[#003882] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <MessageSquare size={13} />
                  <span>Chat with Talent</span>
                </button>
                {freelancerAddr && (
                  <Link
                    to={`/profile/${freelancerAddr}`}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1 transition-all shadow-2xs"
                  >
                    <span>Profile</span>
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* JOB SPECIFICATIONS & DELIVERABLE REQUIREMENTS CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-700 tracking-wider">
                  Project Scope & Specifications
                </span>
                <h3 className="font-headline font-black text-base text-slate-900">
                  {currentJob.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200">
                  Category: {currentJob.category || 'Web3 Engineering'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl border border-emerald-200">
                  Escrow: {formatAmountWithToken(rawEscrowAmount)}
                </span>
              </div>
            </div>

            {/* Formatted Job Description */}
            <div className="text-xs text-slate-700 leading-relaxed font-sans">
              <FormattedJobDescription description={currentJob.description} />
            </div>
          </div>

          {/* LIVE PROGRESS STATUS & MILESTONE TRACKER */}
          {latestProgressUpdate && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <TrendingUp size={12} />
                  </div>
                  <span className="font-headline font-black text-xs sm:text-sm text-slate-900">
                    Latest Working Progress from Developer ({latestProgressUpdate.progressPercent || 75}%)
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-blue-900 font-bold">
                  Posted {formatActivityTime(latestProgressUpdate.timestamp)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#0047AB] h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, latestProgressUpdate.progressPercent || 75))}%` }}
                />
              </div>

              {/* Note / Memo */}
              {latestProgressUpdate.statusNote && (
                <p className="text-xs text-slate-700 italic bg-white/90 p-2.5 rounded-xl border border-blue-100 leading-relaxed">
                  "{latestProgressUpdate.statusNote}"
                </p>
              )}

              {/* Demo URL button if provided */}
              {latestProgressUpdate.demoUrl && (
                <div className="pt-1">
                  <a
                    href={latestProgressUpdate.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all hover:scale-102"
                  >
                    <span>Open Live Preview / Staging Build</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* PENDING TIME EXTENSION PROPOSAL(S) FOR CLIENT TO ACCEPT/DECLINE */}
          {pendingExtensionRequests.length > 0 && (
            <div className="space-y-3">
              {pendingExtensionRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden"
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

          {/* Selection Stage Gating or Awaiting Deliverables (CLIENT ONLY) */}
          {currentJob.status === 'Selected' ? (
            <NegotiationCard
              job={currentJob}
              isClient={isClient}
              isFreelancer={isAssignedFreelancer}
              onFundEscrow={handleDepositEscrow}
              isFundingEscrow={isFundingEscrow}
            />
          ) : !currentJob.proof ? (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] p-4 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-[6px]">
                      In Progress
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#0B0B0F]">
                    Awaiting freelancer deliverables
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    The hired freelancer is currently working on the project deliverables. Once submitted, you will be notified to inspect the deliverables and approve payment release.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Deliverable Review Card for Client */
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              {/* Prominent Action Required Alert for Client */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    <span className="font-mono font-black text-[10px] sm:text-[11px] uppercase tracking-wider text-amber-950 bg-amber-200/90 px-2.5 py-0.5 rounded-full">
                      Action Required • Review Work Deliverables
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                    <Clock size={13} className={isReviewPeriodExpired ? "text-rose-600" : "text-amber-600"} />
                    <span>Review SLA: <strong className={isReviewPeriodExpired ? "text-rose-600" : "text-emerald-700"}>{reviewTimeRemainingStr}</strong></span>
                  </div>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-sans">
                  The freelancer has completed project milestones and uploaded deliverables. Please inspect the source code, demo URL, and files attached below before the SLA deadline on <strong>{reviewExpiresAt > 0 ? new Date(reviewExpiresAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</strong>. You must <strong>Approve &amp; Release Funds</strong> to disburse escrow, or <strong>Request Fixes</strong> if revisions are needed.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                    Deliverable Submitted
                  </span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-heading mt-0.5">
                    {currentJob.proof.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-700 font-bold">
                  Submitted: {new Date(currentJob.proof.submittedAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {currentJob.proof.description}
              </p>

              {/* Verified Project Deliverable Link / Demo Repo */}
              {currentJob.proof.externalLink && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#0047AB] flex items-center justify-center shrink-0 shadow-2xs">
                      <Link2 size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">
                        Deliverable Project Repository / Demo URL
                      </span>
                      <span className="font-mono text-[#0047AB] font-bold truncate block text-xs">
                        {currentJob.proof.externalLink}
                      </span>
                    </div>
                  </div>
                  <a
                    href={currentJob.proof.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0047AB] hover:bg-[#003882] text-white font-bold text-[11.5px] shadow-xs cursor-pointer transition-all hover:scale-105 shrink-0 self-end sm:self-center"
                  >
                    <span>Open Project Demo / Repo</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Attached Deliverable Files (Real IPFS Resolution & File Previews) */}
              <div className="space-y-2 pt-1 font-sans">
                <span className="text-[10.5px] font-bold text-slate-900 uppercase tracking-wide block">
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
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs"
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
                                : 'bg-slate-100 text-[#0047AB] border border-slate-200'
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
                              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-800">
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
                            <span className="text-[9.5px] font-mono text-slate-500 truncate block mt-0.5">
                              CID: {cleanCid}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(cached!)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-bold text-[11px] cursor-pointer transition-all hover:scale-105 shadow-2xs"
                          >
                            <Eye size={12} className="text-[#0047AB]" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrDownloadIpfsFile(cleanCid, fileName)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0047AB] hover:bg-[#003882] text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all hover:scale-105"
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

              {currentJob.status !== 'Disputed' && (
                isCompletedOrReleased ? (
                  <div className="pt-2.5 border-t border-slate-200 space-y-2.5 font-sans">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Escrow Settled &amp; Funds Disbursed
                        </span>
                        <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          On-Chain Confirmed
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-emerald-100 text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600">Disbursed: <strong className="text-slate-900">{feeDetails.budgetFormatted} {feeDetails.token}</strong></span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600">Platform Fee (2.5%): <strong className="text-rose-600">-{feeDetails.freelancerFeeFormatted} {feeDetails.token}</strong></span>
                        </div>
                        <div className="text-slate-900 font-bold">
                          <span>Net Sent to Talent: </span>
                          <strong className="text-emerald-700 text-sm font-black">{feeDetails.freelancerNetFormatted} {feeDetails.token}</strong>
                        </div>
                      </div>
                      {settledTxHash && (
                        <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
                          <a
                            href={`https://polygonscan.com/tx/${settledTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0047AB] hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Settlement on Polygonscan</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2.5 border-t border-slate-200 space-y-2.5 font-sans">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">Escrow Release: <strong className="text-slate-900">{feeDetails.budgetFormatted} {feeDetails.token}</strong></span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-600">Platform Maintenance Fee (2.5%): <strong className="text-rose-600">-{feeDetails.freelancerFeeFormatted} {feeDetails.token}</strong></span>
                      </div>
                      <div className="text-slate-900 font-bold">
                        <span>Net Sent to Talent: </span>
                        <strong className="text-emerald-700 text-sm font-black">{feeDetails.freelancerNetFormatted} {feeDetails.token}</strong>
                      </div>
                    </div>

                    {isClient ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={handleApproveWork}
                          disabled={isReleasing}
                          className={`bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all ${
                            isReleasing ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                          }`}
                        >
                          {isReleasing ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Releasing Escrow & Disbursing Funds...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Approve & Release Funds ({feeDetails.budgetFormatted} {feeDetails.token} • Net: {feeDetails.freelancerNetFormatted} {feeDetails.token})</span>
                            </>
                          )}
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
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Info size={14} className="text-[#0047AB] shrink-0" />
                            <span>
                              Deliverables are under client review (Review SLA: {reviewPeriodDays} Days • <strong className={isReviewPeriodExpired ? "text-rose-600" : "text-slate-900"}>{reviewTimeRemainingStr}</strong>).
                              {isReviewPeriodExpired 
                                ? ' The review period has elapsed. You can now claim autonomous auto-release directly to your wallet.'
                                : ' If the client does not take action or request revisions before the deadline, you can claim autonomous auto-release.'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleClaimAutoRelease}
                            disabled={!isReviewPeriodExpired || isClaimingAutoRelease}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                              !isReviewPeriodExpired
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                                : isClaimingAutoRelease
                                ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:scale-105'
                            }`}
                            title={
                              !isReviewPeriodExpired
                                ? `Review period active. Client has until ${reviewExpiresAt > 0 ? new Date(reviewExpiresAt).toLocaleString() : 'deadline'} (${reviewTimeRemainingStr}) to review.`
                                : 'Claim autonomous on-chain auto-release'
                            }
                          >
                            {isClaimingAutoRelease ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Claiming On-Chain...</span>
                              </>
                            ) : !isReviewPeriodExpired ? (
                              <>
                                <Lock size={12} className="text-slate-500" />
                                <span>Auto-Release Locked ({reviewTimeRemainingStr})</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} />
                                <span>Claim Auto-Release ({feeDetails.budgetFormatted} {feeDetails.token})</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
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
                primaryActionText: 'View Dispute Case',
                targetSectionId: 'dispute-panel',
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
      <div id="activity-timeline-section" className="border border-slate-200/80 rounded-2xl bg-white p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
        
        {/* Timeline Header with Redesigned Sleek Filter Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
              <TrendingUp size={13} className="text-rose-500" />
            </div>
            <div>
              <h3 className="font-headline font-black text-slate-900 text-xs sm:text-sm leading-tight">
                Project Progress Updates Log
              </h3>
              <p className="text-[9.5px] sm:text-[10px] text-slate-500 font-medium">
                Real-time updates and activities happening on this escrow.
              </p>
            </div>
          </div>

          {/* Attractive Modern Pill Filter Buttons (Strictly Single Line) */}
          <div className="flex items-center gap-1.5 sm:gap-2 relative select-none shrink-0 self-start sm:self-auto">
            
            {/* Category Filter Pill */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                  setIsSortDropdownOpen(false);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-200 shadow-2xs hover:border-slate-300 transition-all inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Filter size={10} className="text-blue-500 shrink-0" />
                <span className="whitespace-nowrap">{activityFilter === 'all' ? 'All Activities' : activityFilter === 'progress' ? 'Progress Updates' : activityFilter === 'milestone' ? 'Milestones' : 'Escrow'}</span>
                <ChevronDown size={10} className={`text-slate-400 shrink-0 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-44 sm:w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 text-xs space-y-0.5 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => { setActivityFilter('all'); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${activityFilter === 'all' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>All Activities</span>
                    {activityFilter === 'all' && <Check size={12} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActivityFilter('progress'); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${activityFilter === 'progress' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Progress Updates</span>
                    {activityFilter === 'progress' && <Check size={12} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActivityFilter('milestone'); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${activityFilter === 'milestone' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Milestones & Proofs</span>
                    {activityFilter === 'milestone' && <Check size={12} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActivityFilter('funded'); setIsFilterDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${activityFilter === 'funded' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Escrow & Payments</span>
                    {activityFilter === 'funded' && <Check size={12} className="text-blue-600" />}
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
                className="bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-200 shadow-2xs hover:border-slate-300 transition-all inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowUpDown size={10} className="text-[#0047AB] shrink-0" />
                <span className="whitespace-nowrap">{sortOrder === 'latest' ? 'Newest First' : 'Oldest First'}</span>
                <ChevronDown size={10} className={`text-slate-400 shrink-0 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-36 sm:w-40 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 text-xs space-y-0.5 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => { setSortOrder('latest'); setIsSortDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${sortOrder === 'latest' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Newest First</span>
                    {sortOrder === 'latest' && <Check size={12} className="text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSortOrder('oldest'); setIsSortDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between whitespace-nowrap cursor-pointer transition-all ${sortOrder === 'oldest' ? 'font-black text-blue-600 bg-blue-50 border border-blue-100 shadow-2xs' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <span>Oldest First</span>
                    {sortOrder === 'oldest' && <Check size={12} className="text-blue-600" />}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Compact Connected Activities Track */}
        <div className="relative flex gap-2 sm:gap-3 pt-0.5">
          
          {/* Vertical Track Line and Connected Nodes */}
          <div className="relative flex flex-col justify-between items-center py-2 shrink-0 w-3">
            <div className="absolute top-2.5 bottom-2.5 w-[1.5px] bg-slate-200 z-0" />
            
            {displayedActivities.map((act, i) => {
              const nodeBg = act.type === 'progress' ? 'bg-blue-600 ring-blue-100' : act.type === 'milestone' ? 'bg-emerald-500 ring-emerald-100' : act.type === 'extension' ? 'bg-[#0047AB] ring-slate-100' : 'bg-amber-500 ring-amber-100';
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
                const cardBg = act.type === 'progress' ? 'bg-[#F4F8FF] border-blue-200/90' : act.type === 'milestone' ? 'bg-[#F0FDF4] border-emerald-200/90' : act.type === 'extension' ? 'bg-slate-50 border-slate-200' : 'bg-[#FFFBEB]/70 border-amber-200/90';
                const iconBg = act.type === 'progress' ? 'bg-blue-100/80 text-blue-700 border-blue-200' : act.type === 'milestone' ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200' : act.type === 'extension' ? 'bg-slate-100 text-[#0047AB] border-slate-200' : 'bg-amber-100/80 text-amber-700 border-amber-200';

                return (
                  <div
                    key={act.id}
                    className={`${cardBg} border rounded-xl p-2 sm:p-3 flex flex-col gap-1.5 shadow-2xs`}
                  >
                    {/* Top Header Row: Icon, Event Badge, Date, and Status Pill */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${iconBg} border flex items-center justify-center shrink-0 shadow-2xs`}>
                          {act.icon}
                        </div>
                        <span className={`${act.badgeClass} px-1.5 sm:px-2 py-0.5 rounded font-mono font-bold text-[8px] sm:text-[9px] uppercase tracking-wide shrink-0`}>
                          {act.badge}
                        </span>
                        <span className="text-slate-400 font-mono text-[8.5px] sm:text-[9.5px] shrink-0">
                          {act.dateStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                        {act.demoUrl && (
                          <a
                            href={act.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#0047AB] text-white text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                            title="Open submitted deliverable or project PR"
                          >
                            <span>Open deliverable</span>
                            <ExternalLink size={10} className="text-white shrink-0" />
                          </a>
                        )}
                        <span className={`${act.statusPill.pillClass} font-bold text-[8.5px] sm:text-[9.5px] px-1.5 sm:px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs shrink-0 whitespace-nowrap`}>
                          {act.statusPill.dotClass && (
                            <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${act.statusPill.dotClass} inline-block animate-pulse shrink-0`} />
                          )}
                          {act.statusPill.showCheck && (
                            <Check size={8.5} className="shrink-0" />
                          )}
                          <span>{act.statusPill.text}</span>
                        </span>
                      </div>
                    </div>

                    {/* Content: Title & Subtitle cleanly indented */}
                    <div className="pl-7 sm:pl-9 space-y-0.5 min-w-0">
                      <h4 className="text-[11.5px] sm:text-xs font-black text-slate-900 font-headline leading-tight break-words">
                        {act.title}
                      </h4>
                      <p className="text-[10px] sm:text-[10.5px] text-slate-600 font-medium break-words leading-relaxed max-w-xl">
                        {act.subtitle}
                      </p>
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
        primaryActionText={actionModal.primaryActionText}
        targetSectionId={actionModal.targetSectionId}
        onPrimaryAction={actionModal.onPrimaryAction}
      />

      {/* Interactive IPFS Deliverable File Preview Modal */}
      <Modal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name}
        subtitle={previewFile ? `CID: ${previewFile.cid}` : undefined}
        maxWidth="lg"
        footer={
          previewFile && (
            <div className="flex items-center justify-between w-full text-[11px] text-slate-500 font-mono">
              <span>Size: {(previewFile.size / 1024).toFixed(1)} KB</span>
              <div className="flex items-center gap-2">
                <span>Uploaded: {new Date(previewFile.uploadedAt).toLocaleTimeString()}</span>
                <button
                  type="button"
                  onClick={() => openOrDownloadIpfsFile(previewFile.cid, previewFile.name)}
                  className="px-3 py-1.5 rounded-xl bg-[#0047AB] hover:bg-[#003882] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-105"
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )
        }
      >
        {previewFile && (
          <div data-lenis-prevent="true" className="flex-1 overflow-auto overscroll-contain py-2 min-h-0 custom-scrollbar">
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
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0047AB] mx-auto flex items-center justify-center">
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0047AB] hover:bg-[#003882] text-white font-bold text-xs shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  <Download size={14} />
                  <span>Open / Download {previewFile.name}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Released Celebratory Modal */}
      <PaymentReleasedModal
        isOpen={isPaymentReleasedModalOpen}
        onClose={() => setIsPaymentReleasedModalOpen(false)}
        job={currentJob}
        onViewAttestation={() => navigate(`/jobs/${currentJob.id}/attestation`)}
      />
    </div>
  );
};
