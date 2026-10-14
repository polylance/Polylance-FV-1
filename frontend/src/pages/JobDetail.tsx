import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData, getBackendSyncUrl } from '../context/PolyLanceDataContext';
import { EscrowTimeline } from '../components/EscrowTimeline';
import { ApplicantTable } from '../components/ApplicantTable';
import { DisputePanel } from '../components/DisputePanel';
import { DeliverableWorkSubmissionPanel } from '../components/DeliverableWorkSubmissionPanel';
import { NegotiationCard } from '../components/NegotiationCard';
import { DisputeReason, UserProfile } from '../types';
import { truncateAddress, formatTimeAgo, getDeterministicSbtId, formatWeb3ErrorMessage, getPolygonScanAddressUrl, getCanonicalCategory } from '../utils/formatters';
import { generateIpfsCid } from '../utils/ipfs';
import { getJobInactivityStatus } from '../utils/inactivity';
import { 
  ShieldCheck, Clock, Send, SendHorizontal, CheckCircle2, AlertTriangle, MessageSquare, 
  ExternalLink, ArrowLeft, FileText, Building2, Award, Github, Sparkles, 
  Trash2, Edit3, RefreshCw, Lock, Briefcase, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ErrorState } from '../components/UIStates';
import { ActionStatusModal, ActionModalDetail } from '../components/ActionStatusModal';
import { FormattedJobDescription } from '../components/FormattedJobDescription';
import { FundEscrowModal } from '../components/FundEscrowModal';
import { PaymentReleasedModal } from '../components/PaymentReleasedModal';
import { ModifyJobModal } from '../components/ModifyJobModal';
import { GithubVerifyModal } from '../components/GithubVerifyModal';
import { GithubScoreResult } from '../utils/githubOracle';
import { PolyLanceAlertModal, AlertModalOptions } from '../components/PolyLanceAlertModal';
import { PolyLanceSelect } from '../components/PolyLanceSelect';
import { scrollToSection, extractTargetSection } from '../utils/scroll';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { AddressChip } from '../components/common/AddressChip';
import { FeeBreakdown } from '../components/common/FeeBreakdown';
import { Amount } from '../components/common/Amount';
import { Button } from '../components/common/Button';
import { Modal } from '../components/overlay';
import { Disclosure } from '../components/common/Disclosure';
import { WatchButton, VideoModal, useVideoModal } from '../components/video';
import { useDemoMode } from '../context/DemoModeContext';
import { canApplyToJob, areAddressesEqual } from '../utils/accountMode';
import { toast } from '../utils/toast';

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { address, isConnected, isArbitrator, currentRole, connectWallet } = useWeb3();
  const { isDemoMode } = useDemoMode();
  const {
    jobs,
    deleteJob,
    renewJob,
    applyToJob,
    selectFreelancer,
    proposeTerms,
    fundJob,
    releasePayment,
    raiseDispute,
    submitDisputeResponse,
    resolveDispute,
    sendChatMessage,
    sendPreAcceptMessage,
    profiles,
    updateProfile,
  } = usePolyLanceData();

  const [isFundEscrowModalOpen, setIsFundEscrowModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isPaymentReleasedModalOpen, setIsPaymentReleasedModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [releasedTxHash, setReleasedTxHash] = useState<string | undefined>(undefined);
  const { activeVideoId, isOpen, openVideo, closeVideo, triggerRef } = useVideoModal();

  const [isResolvingJob, setIsResolvingJob] = useState(() => {
    const foundInReal = jobs.some(
      (j) =>
        (j.id && j.id.toLowerCase() === id?.toLowerCase()) ||
        (j.contractAddress && j.contractAddress.toLowerCase() === id?.toLowerCase())
    );
    return !foundInReal;
  });

  React.useEffect(() => {
    const targetSection = extractTargetSection(
      window.location.search,
      window.location.hash
    );

    if (targetSection && targetSection !== id) {
      scrollToSection(targetSection, 180);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    let mounted = true;
    const existing = jobs.find(
      (j) =>
        (j.id && j.id.toLowerCase() === id?.toLowerCase()) ||
        (j.contractAddress && j.contractAddress.toLowerCase() === id?.toLowerCase())
    );

    if (existing) {
      setIsResolvingJob(false);
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsResolvingJob(false);
      return;
    }

    setIsResolvingJob(true);
    const syncUrl = getBackendSyncUrl();
    const headers: Record<string, string> = {};
    if (address) headers['x-wallet-address'] = address.toLowerCase();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch(`${syncUrl}/api/sync`, { headers, signal: controller.signal })
      .then((r) => r.json())
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeoutId);
        if (mounted) {
          setTimeout(() => {
            if (mounted) setIsResolvingJob(false);
          }, 600);
        }
      });

    const timer = setTimeout(() => {
      if (mounted) setIsResolvingJob(false);
    }, 2500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [id, jobs.length, address]);

  const handleKeepJobActive = async () => {
    if (!job) return;
    await renewJob(job.id);
    setActionModal({
      isOpen: true,
      title: 'Job Posting Renewed',
      subtitle: 'Your job posting has been renewed and will remain active on the marketplace for another 10 days.',
      icon: 'success',
      badgeText: 'RENEWED',
      details: [
        { label: 'Job Title', value: job.title },
        { label: 'Status', value: 'Active / Open', isBadge: true },
        { label: 'Retention Cycle', value: '+10 Days from today' },
      ],
      primaryActionText: 'View Job Overview',
      targetSectionId: 'job-overview',
    });
  };

  const [alertModalOptions, setAlertModalOptions] = useState<AlertModalOptions | null>(null);

  const handleRemoveJobPost = () => {
    if (!job) return;
    setAlertModalOptions({
      title: 'Remove Job Posting',
      message: `Are you sure you want to remove this job posting? It will be permanently removed.`,
      type: 'confirm',
      showCancel: true,
      isDestructive: true,
      confirmText: 'Remove Job',
      onConfirm: async () => {
        await deleteJob(job.id);
        navigate('/jobs');
      },
    });
  };

  const [applyProposalText, setApplyProposalText] = useState('');
  const [isApplyingModalOpen, setIsApplyingModalOpen] = useState(false);
  const [isApplyingSubmitting, setIsApplyingSubmitting] = useState(false);
  const [disputeReason, setDisputeReason] = useState<DisputeReason>('QUALITY');
  const [disputeEvidenceText, setDisputeEvidenceText] = useState('');
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // In-App Action Status Modal State
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
    secondaryActionText?: string;
    onSecondaryAction?: () => void;
  }>({
    isOpen: false,
    title: '',
  });

  const job = jobs.find(
    (j) =>
      (j.id && j.id.toLowerCase() === id?.toLowerCase()) ||
      (j.contractAddress && j.contractAddress.toLowerCase() === id?.toLowerCase())
  );

  React.useEffect(() => {
    if (job?.id) {
      try {
        localStorage.setItem('polylance_last_opened_job', job.id);
      } catch {}
    }
  }, [job?.id]);

  const isClient = Boolean(isConnected && address && job?.client && areAddressesEqual(address, job.client));

  // Guard deep link or programmatic apply attempts by the job owner
  React.useEffect(() => {
    if (isApplyingModalOpen && isClient) {
      setIsApplyingModalOpen(false);
      toast.error("You can't apply to your own job", "As the job creator, you can manage candidates and escrow from this page.");
    }
  }, [isApplyingModalOpen, isClient]);

  if (!job) {
    if (isResolvingJob) {
      return (
        <PageContainer>
          <div className="max-w-xl mx-auto py-24 text-center space-y-4 font-sans">
            <div className="w-12 h-12 rounded-xl bg-[#F6F7F9] text-[#0047AB] flex items-center justify-center mx-auto border border-[#E5E7EB]">
              <RefreshCw className="animate-spin" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-[#0B0B0F]">
              Synchronizing escrow contract...
            </h2>
            <p className="text-xs text-[#4B5563]">
              Fetching verified on-chain job data and escrow state for ID: {id}
            </p>
          </div>
        </PageContainer>
      );
    }
    return (
      <PageContainer>
        <div className="max-w-xl mx-auto py-16">
          <ErrorState
            title="Job Contract Not Found"
            description={`We couldn't locate an active smart contract escrow for ID: ${id}. It may have expired or been removed.`}
            onRetry={() => window.location.reload()}
            onDashboard={() => window.location.hash = '#/jobs'}
          />
        </div>
      </PageContainer>
    );
  }

  const clientProfileKey = Object.keys(profiles).find(k => k.toLowerCase() === job.client.toLowerCase());
  const clientProfile = clientProfileKey ? profiles[clientProfileKey] : null;
  const clientDisplayName = clientProfile?.displayName || truncateAddress(job.client);

  const freelancerAddr = job.freelancer;
  const freelancerProfileKey = freelancerAddr ? Object.keys(profiles).find(k => k.toLowerCase() === freelancerAddr.toLowerCase()) : null;
  const freelancerProfile = freelancerProfileKey ? profiles[freelancerProfileKey] : null;
  const freelancerDisplayName = freelancerProfile?.displayName || (freelancerAddr ? truncateAddress(freelancerAddr) : 'Unassigned');

  const currentUserProfKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
  const currentUserProf = currentUserProfKey ? profiles[currentUserProfKey] : null;
  const isUserVerified = Boolean(currentUserProf?.githubVerified);

  const isFreelancer = Boolean(isConnected && address && job.freelancer && areAddressesEqual(address, job.freelancer));
  const isParty = isClient || isFreelancer;
  const hasApplied = Boolean(isConnected && address && (job.applications || []).some((a) => areAddressesEqual(a.applicant, address)));

  const tokenSymbol = (job.paymentTokenSymbol || 'POL').toUpperCase() === 'MATIC' ? 'POL' : (job.paymentTokenSymbol || 'POL').toUpperCase();
  const tokenAmount = tokenSymbol === 'POL' ? (job.amountEth || job.amountUsdc || '0') : (job.amountUsdc || '0');

  const handleGithubVerified = (res: GithubScoreResult) => {
    if (address) {
      updateProfile(
        {
          githubVerified: true,
          githubUsername: res.username,
          githubId: res.id || res.username,
          primaryScore: res.primaryScore,
          secondaryScores: res.secondaryScores,
          primaryCategory: res.primaryCategory,
          languageBytes: res.languageBytes,
          verifiedAt: res.verifiedAt,
          attestationUID: res.attestationUID,
          reputationTier: res.reputationTier,
          avatarUrl: res.fetchedAvatarUrl || currentUserProf?.avatarUrl,
          displayName: res.fetchedDisplayName || currentUserProf?.displayName,
        },
        address
      );
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyProposalText.trim()) return;

    if (!isConnected || !address) {
      toast.error("Please connect your wallet to submit a proposal");
      return;
    }

    const eligibility = canApplyToJob(
      { address, accountMode: currentUserProf?.accountMode || 'both', isConnected },
      job
    );
    if (!eligibility.allowed) {
      setIsApplyingModalOpen(false);
      toast.error(eligibility.message || "Cannot apply to this job");
      return;
    }

    try {
      setIsApplyingSubmitting(true);
      await applyToJob(
        job.id,
        applyProposalText.trim(),
        address,
        currentUserProf?.skills || ['Developer'],
        Boolean(currentUserProf?.githubVerified),
        currentUserProf?.primaryScore || 750
      );
      setIsApplyingModalOpen(false);
      setApplyProposalText('');
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setActionModal({
        isOpen: true,
        title: 'Job Proposal Submitted',
        subtitle: 'Your proposal and credentials have been sent to the client.',
        icon: 'success',
        badgeText: 'PROPOSAL ACTIVE',
        details: [
          { label: 'Escrow Budget', value: `${tokenAmount} ${tokenSymbol}`, isBadge: true },
          { label: 'Applicant', value: truncateAddress(address || ''), isMono: true },
          { label: 'Review Window', value: `${job.reviewPeriodDays || 7} Days` },
        ],
        primaryActionText: 'View in Applications',
        targetSectionId: 'applications-panel',
      });
    } catch (err: any) {
      console.error('Error applying to job:', err);
      toast.error(err?.message || 'Failed to submit proposal. Please check your network and try again.');
    } finally {
      setIsApplyingSubmitting(false);
    }
  };

  const handleProposeTermsAction = (jobId: string, userAddr: string) => {
    proposeTerms(jobId, userAddr);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    setActionModal({
      isOpen: true,
      title: 'Milestone Terms Agreed',
      subtitle: 'Your acceptance of the project scope and SLA terms has been recorded.',
      icon: 'terms',
      badgeText: 'TERMS FINALIZED',
      details: [
        { label: 'Agreement Status', value: 'Terms Accepted', isBadge: true },
        { label: 'Milestone Payout', value: `${tokenAmount} ${tokenSymbol}` },
        { label: 'Escrow Address', value: truncateAddress(job.contractAddress), isMono: true, explorerUrl: getPolygonScanAddressUrl(job.contractAddress) },
      ],
      primaryActionText: 'View Escrow Details',
      targetSectionId: 'escrow-details',
      secondaryActionText: 'Take me to Dashboard',
      onSecondaryAction: () => navigate('/dashboard'),
    });
  };

  const handleConfirmFund = async () => {
    if (!job) return;
    await fundJob(job.id);
    setIsFundEscrowModalOpen(false);
    setActionModal({
      isOpen: true,
      title: 'Escrow Vault Funded Successfully',
      subtitle: 'Your payment is safely locked in the smart contract escrow. The workspace is now active.',
      icon: 'payment',
      badgeText: 'FUNDS SECURED',
      details: [
        { label: 'Escrow Status', value: 'Funded & In Progress', isBadge: true },
        { label: 'Contract Address', value: truncateAddress(job.contractAddress), isMono: true },
      ],
      primaryActionText: 'Go to Workspace',
      targetSectionId: 'deliverable-workspace',
    });
  };

  const handleReleasePayment = async () => {
    if (!job) return;
    try {
      await releasePayment(job.id);
      const tx = job.events?.find(e => e.step === 'Completed')?.txHash;
      setReleasedTxHash(tx);
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
    }
  };

  const handleRaiseDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeEvidenceText.trim()) return;
    const evidenceCid = generateIpfsCid({ disputeEvidenceText, timestamp: Date.now() });
    raiseDispute(job.id, disputeReason, disputeEvidenceText, evidenceCid, address || '');
    setIsDisputeModalOpen(false);
    setActionModal({
      isOpen: true,
      title: 'Case Escalated to Arbitration',
      subtitle: 'Your evidence has been registered on-chain for arbitration.',
      icon: 'dispute',
      badgeText: 'DISPUTE SUBMITTED',
      details: [
        { label: 'Dispute Reason', value: disputeReason, isBadge: true },
        { label: 'IPFS Evidence CID', value: evidenceCid, isMono: true },
        { label: 'Contract Address', value: truncateAddress(job.contractAddress), isMono: true },
      ],
      primaryActionText: 'Inspect Dispute Docket',
      targetSectionId: 'dispute-panel',
    });
  };

  const inactivityStatus = getJobInactivityStatus(job);

  const hasSelectedFreelancer = Boolean(job.freelancer);
  const isAuthorizedParty = isClient || isFreelancer || (Boolean(isArbitrator) && job.status === 'Disputed');
  const isConfidentialRestricted = hasSelectedFreelancer && !isAuthorizedParty;

  if (isConfidentialRestricted) {
    return (
      <PageContainer>
        <div className="space-y-6 py-6 w-full font-sans">
          <div className="flex items-center justify-between">
            <Link to="/jobs" className="text-xs text-[#4B5563] hover:text-[#0B0B0F] flex items-center gap-1 font-medium">
              <ArrowLeft size={14} /> Back to Find Jobs
            </Link>
            <StatusBadge status="In progress" />
          </div>

          <div className="p-8 sm:p-10 border border-[#E5E7EB] bg-white text-center space-y-4 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] text-[#0B0B0F] flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>

            <div className="space-y-1 max-w-lg mx-auto">
              <span className="text-xs text-[#4B5563] bg-[#F6F7F9] px-2.5 py-0.5 rounded border border-[#E5E7EB] inline-block font-medium">
                Private workspace
              </span>
              <h2 className="text-2xl font-semibold text-[#0B0B0F]">
                Access restricted to contract parties
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-lg mx-auto">
              The client has selected a verified freelancer for this work. Full job specifications and workspace are reserved for the client (<strong className="text-[#0B0B0F]">{clientDisplayName}</strong>) and the selected freelancer (<strong className="text-[#0B0B0F]">{freelancerDisplayName}</strong>).
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/jobs"
                className="px-4 py-2 rounded-lg bg-[#0047AB] text-white font-medium text-xs flex items-center justify-center gap-1.5"
              >
                <Briefcase size={14} />
                <span>Browse open jobs</span>
              </Link>
              <Link
                to="/workspace"
                className="px-4 py-2 rounded-lg bg-white text-[#0B0B0F] border border-[#E5E7EB] font-medium text-xs flex items-center justify-center gap-1.5"
              >
                <span>Go to workspace</span>
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Format posted date once: e.g. "Posted Oct 1, 2026 - 7 days ago"
  const formattedPostedDate = `Posted ${new Date(job.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${formatTimeAgo(job.createdAt || Date.now())}`;

  return (
    <PageContainer>
      <div className="space-y-6 py-6 w-full font-sans">
        <ActionStatusModal 
          {...actionModal} 
          onClose={() => setActionModal({ ...actionModal, isOpen: false })} 
        />

        {/* Back Link */}
        <div>
          <Link to="/jobs" className="text-xs text-[#4B5563] hover:text-[#0B0B0F] inline-flex items-center gap-1 font-medium transition-colors">
            <ArrowLeft size={14} /> Back to Find Jobs
          </Link>
        </div>

        {/* Inactivity Reminder Banner */}
        {inactivityStatus.isReminderActive && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-950 text-sm">
                    Client inactivity reminder
                  </span>
                  <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.2 rounded font-medium">
                    {inactivityStatus.daysRemaining} days remaining
                  </span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  This job was posted {Math.floor(inactivityStatus.daysElapsed)} days ago. Jobs with no action are removed on Day 14.
                </p>
              </div>
            </div>

            {isClient && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={async () => {
                    const ok = await renewJob(job.id);
                    if (ok) {
                      confetti({ particleCount: 50, spread: 60 });
                      setActionModal({
                        isOpen: true,
                        title: 'Job Posting Renewed',
                        subtitle: 'The 14-day inactivity timer has been refreshed.',
                        icon: 'success',
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0047AB] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Renew job</span>
                </button>
                <button
                  onClick={handleRemoveJobPost}
                  className="px-3 py-1.5 rounded-lg bg-white text-rose-700 border border-rose-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Plain Page Header with chips and actions aligned on title baseline */}
        <PageHeader
          title={job.title}
          subtitle={`${getCanonicalCategory(job.category).label} • ${formattedPostedDate} • Review window: ${job.reviewPeriodDays || 7} days`}
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status={job.status} />

              <Link
                to={`/profile/${job.client}`}
                className="inline-flex items-center gap-1.5 bg-[#F6F7F9] hover:bg-slate-100 border border-[#E5E7EB] px-2.5 py-1 rounded-[8px] text-xs font-medium text-[#0B0B0F] transition-colors"
              >
                <Building2 size={13} className="text-[#0047AB]" />
                <span>{clientDisplayName}</span>
                {clientProfile?.githubVerified && (
                  <span className="text-[10px] text-emerald-700 font-semibold">✓</span>
                )}
              </Link>

              {isClient && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsModifyModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-[8px] bg-white hover:bg-slate-50 text-[#0B0B0F] border border-[#E5E7EB] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} className="text-[#0047AB]" />
                    <span>Modify</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAlertModalOptions({
                        title: 'Delete Job Posting',
                        message: `Are you sure you want to remove the job posting "${job.title}"?`,
                        type: 'confirm',
                        showCancel: true,
                        isDestructive: true,
                        confirmText: 'Delete Job',
                        onConfirm: async () => {
                          const ok = await deleteJob(job.id);
                          if (ok) navigate('/jobs');
                        },
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-[8px] bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          }
        />

        {/* Main 2-Column Grid with 24px rhythm */}
        <div className="grid grid-cols-12 gap-6 items-start text-left">
          {/* Left Column: Job Description & Status Panels (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Job Description Card with Technical Disclosure */}
            <div id="job-specs" className="p-5 border border-[#E5E7EB] bg-white rounded-[12px] space-y-4 shadow-xs text-left">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h2 className="text-sm font-semibold text-[#0B0B0F] flex items-center gap-2">
                  <FileText size={15} className="text-[#0047AB]" /> Job description
                </h2>
                <span className="text-xs text-[#6B7280]">
                  {getCanonicalCategory(job.category).label}
                </span>
              </div>

              <div className="bg-[#F6F7F9] p-4 rounded-[8px] border border-[#E5E7EB]">
                <FormattedJobDescription description={job.description} />
              </div>

              {/* Technical Details Disclosure */}
              <Disclosure title="Technical specifications" subtitle="IPFS CID and contract details">
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-[#E5E7EB]">
                    <span className="text-[#4B5563]">IPFS Content CID</span>
                    <span className="font-mono text-[#0B0B0F] break-all">{generateIpfsCid(job.title)}</span>
                  </div>
                  {job.contractAddress && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1">
                      <span className="text-[#4B5563]">Escrow Contract</span>
                      <a
                        href={getPolygonScanAddressUrl(job.contractAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[#0047AB] hover:underline flex items-center gap-1"
                      >
                        <span>{job.contractAddress}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </Disclosure>
            </div>

            {/* STATUS-DRIVEN CONTENT PANELS */}
            {job.status === 'Open' && (
              <div id="applications-panel" className="space-y-6">
                {isClient ? (
                  <ApplicantTable
                    jobId={job.id}
                    jobAmount={job.amountUsdc}
                    jobReviewPeriodDays={job.reviewPeriodDays}
                    applications={job.applications}
                    category={job.category}
                    onSelect={async (freelancerAddr) => {
                      await selectFreelancer(job.id, freelancerAddr);
                      navigate(`/workspace?jobId=${job.id}`);
                    }}
                    isClient={true}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* MERGED STATUS PANEL (Proposal submitted / Discuss terms into ONE panel) */}
                    {hasApplied ? (
                      <div className="p-6 border border-[#E5E7EB] bg-white rounded-xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              <h3 className="text-base font-semibold text-[#0B0B0F]">
                                Proposal active and under review
                              </h3>
                            </div>
                            <p className="text-xs text-[#4B5563] mt-1">
                              Your proposal has been submitted. The client is reviewing proposals and can chat with you to adjust terms and scope.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate(`/chat?jobId=${job.id}`)}
                            className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <MessageSquare size={14} />
                            <span>Open messages</span>
                          </button>
                        </div>
                      </div>
                    ) : currentUserProf?.accountMode === 'client' ? (
                      <div className="p-6 border border-[#E5E7EB] bg-[#F8FAFC] rounded-xl flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-[#0B0B0F]">
                            Submit proposal
                          </h3>
                          <p className="text-xs text-[#4B5563] mt-0.5">
                            Your account is set to Client only mode. Switch to Freelancer mode to apply.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (address) updateProfile({ accountMode: 'both' }, address);
                              toast.success('Account mode updated to Freelancer');
                            }}
                            className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Switch to Freelancer
                          </button>
                          <Link
                            to="/settings"
                            className="bg-white hover:bg-slate-50 text-[#0047AB] border border-[#CBD5E1] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Settings
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 border border-[#E5E7EB] bg-white rounded-xl flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-[#0B0B0F]">
                            Submit proposal
                          </h3>
                          <p className="text-xs text-[#4B5563] mt-0.5">
                            Apply with your verified on-chain reputation and technical proposal.
                          </p>
                        </div>

                        {!isConnected ? (
                          <button onClick={connectWallet} className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                            Connect wallet to apply
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {!isUserVerified && (
                              <button
                                type="button"
                                onClick={() => setIsVerifyModalOpen(true)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                                title="Verify your GitHub profile to boost proposal visibility and reputation"
                              >
                                <Github size={13} />
                                <span>Connect GitHub (Boost 3x)</span>
                              </button>
                            )}
                            <button
                              onClick={() => setIsApplyingModalOpen(true)}
                              className="bg-[#0047AB] hover:bg-[#003A8C] text-white px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                            >
                              <SendHorizontal size={14} className="stroke-[2.2] shrink-0" />
                              <span>Apply for this job</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Candidate Overview Table for Freelancers */}
                    {(job.applications || []).length > 0 && (
                      <ApplicantTable
                        jobId={job.id}
                        jobAmount={job.amountUsdc}
                        jobReviewPeriodDays={job.reviewPeriodDays}
                        applications={job.applications}
                        category={job.category}
                        onSelect={() => {}}
                        isClient={false}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STATUS: SELECTED */}
            {job.status === 'Selected' && isParty && (
              <NegotiationCard
                job={job}
                isClient={isClient}
                isFreelancer={isFreelancer}
                onFundEscrow={async () => {
                  setIsFundEscrowModalOpen(true);
                }}
                isFundingEscrow={false}
              />
            )}

            {/* STATUS: FUNDED / SUBMITTED (Deliverable Work Workspace) */}
            {((job.status as string) === 'Funded' || job.status === 'Submitted') && isParty && (
              <DeliverableWorkSubmissionPanel job={job} />
            )}

            {/* STATUS: COMPLETED */}
            {job.status === 'Completed' && (
              <div className="p-6 border border-[#E5E7EB] bg-white rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <h3 className="text-base font-semibold text-[#0B0B0F] flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" /> Contract completed & settled
                  </h3>
                  <StatusBadge status="Completed" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-[#F6F7F9] p-3.5 rounded-lg border border-[#E5E7EB]">
                    <span className="text-xs text-[#4B5563] block">Amount paid</span>
                    <div className="mt-1 font-semibold text-[#0B0B0F]">
                      <Amount value={tokenAmount} token={tokenSymbol} />
                    </div>
                  </div>
                  <div className="bg-[#F6F7F9] p-3.5 rounded-lg border border-[#E5E7EB]">
                    <span className="text-xs text-[#4B5563] block">Freelancer</span>
                    <span className="mt-1 font-semibold text-[#0B0B0F] block">{freelancerDisplayName}</span>
                  </div>
                  <div className="bg-[#F6F7F9] p-3.5 rounded-lg border border-[#E5E7EB]">
                    <span className="text-xs text-[#4B5563] block">Work certificate</span>
                    <span className="mt-1 font-semibold text-[#0047AB] block flex items-center gap-1">
                      <Award size={14} /> Token #{job.sbtTokenId || getDeterministicSbtId(job.id)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STATUS: DISPUTED */}
            {job.status === 'Disputed' && job.dispute && (
              <div id="dispute-panel">
                <DisputePanel
                  dispute={job.dispute}
                  amountUsdc={job.amountUsdc}
                  clientAddress={job.client}
                  freelancerAddress={job.freelancer}
                  isJudge={isArbitrator}
                  isParty={isParty}
                  userAddress={address}
                  onResolveDispute={(freelancerBps, reasoningText) => resolveDispute(job.id, freelancerBps, reasoningText, address)}
                  onSubmitResponse={(responseText) => submitDisputeResponse(job.id, responseText, generateIpfsCid(responseText))}
                />
              </div>
            )}
          </div>

          {/* Sticky Right Column Sidebar (4 cols) */}
          <aside className="col-span-12 lg:col-span-4 space-y-6 sticky top-[88px]">
            {/* Budget Card with FeeBreakdown and ONE primary action button */}
            <div id="escrow-details" className="p-5 border border-[#E5E7EB] bg-white rounded-[12px] shadow-xs space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#0B0B0F]">
                    Job budget
                  </h3>
                  <WatchButton
                    id="task-fund-release"
                    label="Watch escrow guide (35s)"
                    onOpen={openVideo}
                  />
                </div>
                <span className="text-xs text-[#4B5563]">
                  Escrow payment
                </span>
              </div>

              {/* Shared FeeBreakdown Component */}
              <FeeBreakdown budget={tokenAmount} token={tokenSymbol} />

              {/* ONE Primary Action Button based on state/role */}
              <div className="pt-2">
                {!isConnected ? (
                  <button
                    onClick={connectWallet}
                    className="w-full bg-[#0047AB] hover:bg-[#003A8C] text-white py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Connect wallet
                  </button>
                ) : isClient ? (
                  job.status === 'Open' ? (
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] space-y-2 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0B0B0F]">
                        <Briefcase size={14} className="text-[#0047AB]" />
                        <span>You posted this job</span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        {(job.applications || []).length} proposal(s) received so far.
                      </p>
                      <button
                        type="button"
                        onClick={() => scrollToSection('applications-panel')}
                        className="w-full bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0B0B0F] py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Manage proposals
                      </button>
                    </div>
                  ) : job.status === 'Selected' ? (
                    <button
                      onClick={() => setIsFundEscrowModalOpen(true)}
                      className="w-full bg-[#0047AB] hover:bg-[#003A8C] text-white py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Fund escrow deposit
                    </button>
                  ) : job.status === 'Submitted' ? (
                    <button
                      onClick={handleReleasePayment}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Approve work & release funds
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/chat?jobId=${job.id}`)}
                      className="w-full bg-white hover:bg-slate-50 text-[#0B0B0F] border border-[#E5E7EB] py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={14} className="text-[#0047AB]" />
                      <span>Open messages</span>
                    </button>
                  )
                ) : isFreelancer && ((job.status as string) === 'Funded' || (job.status as string) === 'In progress') ? (
                  <button
                    onClick={() => navigate(`/workspace?jobId=${job.id}`)}
                    className="w-full bg-[#0047AB] hover:bg-[#003A8C] text-white py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Submit work in workspace
                  </button>
                ) : hasApplied ? (
                  <button
                    onClick={() => navigate(`/chat?jobId=${job.id}`)}
                    className="w-full bg-white hover:bg-slate-50 text-[#0B0B0F] border border-[#E5E7EB] py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={14} className="text-[#0047AB]" />
                    <span>Applied · View proposal</span>
                  </button>
                ) : currentUserProf?.accountMode === 'client' ? (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (address) updateProfile({ accountMode: 'both' }, address);
                        toast.success('Account mode updated to Freelancer');
                      }}
                      className="w-full bg-[#0047AB] hover:bg-[#003A8C] text-white py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      Switch to Freelancer & Apply
                    </button>
                    <div className="text-center">
                      <Link
                        to="/settings"
                        className="text-[11px] text-[#0047AB] hover:underline font-medium"
                      >
                        Change in Settings → Account mode
                      </Link>
                    </div>
                  </div>
                ) : job.status === 'Open' ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsApplyingModalOpen(true)}
                      className="w-full bg-[#0047AB] hover:bg-[#003A8C] text-white py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <SendHorizontal size={14} className="stroke-[2.2] shrink-0" />
                      <span>Apply for this job</span>
                    </button>
                    {!isUserVerified && (
                      <button
                        type="button"
                        onClick={() => setIsVerifyModalOpen(true)}
                        className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Github size={12} />
                        <span>Optional: Connect GitHub to boost reputation</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/chat?jobId=${job.id}`)}
                    className="w-full bg-white hover:bg-slate-50 text-[#0B0B0F] border border-[#E5E7EB] py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={14} className="text-[#0047AB]" />
                    <span>Open messages</span>
                  </button>
                )}
              </div>
            </div>

            {/* Escrow Timeline */}
            <EscrowTimeline events={job.events} />

            {/* Client Summary (Factual only, no AA+ badge, no stars, New client if < 5 completed) */}
            {(() => {
              const clientJobs = jobs.filter(j => j.client.toLowerCase() === job.client.toLowerCase());
              const totalOffered = clientJobs.length;
              const completedJobsCount = clientJobs.filter(j => j.status === 'Completed').length;
              const disputedJobsCount = clientJobs.filter(j => j.status === 'Disputed' || (j.events || []).some(e => e.step === 'Disputed')).length;

              const totalSpentUsdc = clientJobs
                .filter(j => j.status === 'Completed')
                .reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);

              const isNewClient = completedJobsCount < 5;

              return (
                <div className="p-5 border border-[#E5E7EB] bg-white rounded-[12px] shadow-xs space-y-4 text-left">
                  <div className="border-b border-[#E5E7EB] pb-3 flex items-center justify-between">
                    <h3 className="text-xs text-[#4B5563] font-semibold uppercase tracking-wider">
                      Client summary
                    </h3>
                    {isNewClient ? (
                      <span className="text-[11px] bg-[#F6F7F9] text-[#4B5563] border border-[#E5E7EB] px-2 py-0.5 rounded font-medium">
                        New client
                      </span>
                    ) : (
                      <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                        Verified client
                      </span>
                    )}
                  </div>

                  {/* Profile info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-center text-[#0B0B0F] shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <Link to={`/profile/${job.client}`} className="text-sm font-semibold text-[#0B0B0F] hover:text-[#0047AB] transition-colors truncate block">
                        {clientDisplayName}
                      </Link>
                      <AddressChip address={job.client} />
                    </div>
                  </div>

                  {/* Factual stats table */}
                  <div className="space-y-2 text-xs pt-1 border-t border-[#E5E7EB]">
                    <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                      <span className="text-[#4B5563]">Jobs posted</span>
                      <span className="font-semibold text-[#0B0B0F]">{totalOffered}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                      <span className="text-[#4B5563]">Payouts released</span>
                      <span className="font-semibold text-[#0B0B0F]">{completedJobsCount}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-[#E5E7EB]">
                      <span className="text-[#4B5563]">Disputes</span>
                      <span className={`font-semibold ${disputedJobsCount === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {disputedJobsCount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#4B5563]">Total spent</span>
                      <span className="font-semibold text-[#0B0B0F]">
                        ${totalSpentUsdc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDC
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </aside>
        </div>

        {/* Modals */}
        <Modal
          isOpen={isApplyingModalOpen}
          onClose={() => setIsApplyingModalOpen(false)}
          size="md"
          title="Submit proposal"
          subtitle="Specify your proposal terms and technical approach."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsApplyingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!applyProposalText.trim() || isApplyingSubmitting}
                onClick={(e) => handleApplySubmit(e as any)}
              >
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap leading-none">
                  <SendHorizontal size={14} className="stroke-[2.2] shrink-0" />
                  <span>{isApplyingSubmitting ? 'Submitting proposal...' : 'Submit proposal'}</span>
                </span>
              </Button>
            </div>
          }
        >
          <form onSubmit={handleApplySubmit} className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Proposal statement and milestones *
              </label>
              <textarea
                autoFocus
                required
                rows={5}
                placeholder="Describe your technical roadmap, milestones breakdown, and delivery schedule..."
                value={applyProposalText}
                onChange={(e) => setApplyProposalText(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] outline-none rounded-xl p-3 text-xs text-[#0B0B0F] transition-all placeholder:text-slate-400 leading-relaxed resize-none"
              />
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          size="md"
          title="Raise on-chain dispute"
          subtitle="Dispute claims are escalated to the judge panel for arbitration."
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDisputeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!disputeEvidenceText.trim()}
                onClick={(e) => handleRaiseDisputeSubmit(e as any)}
              >
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap leading-none">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>Submit dispute</span>
                </span>
              </Button>
            </div>
          }
        >
          <form onSubmit={handleRaiseDisputeSubmit} className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Dispute reason *
              </label>
              <PolyLanceSelect
                value={disputeReason}
                onChange={(val) => setDisputeReason(val as DisputeReason)}
                options={[
                  { value: 'QUALITY', label: 'Quality issues', sublabel: 'Deliverable fails specifications' },
                  { value: 'NON_DELIVERY', label: 'Non-delivery', sublabel: 'Work not delivered on time' },
                  { value: 'SCOPE_DISAGREEMENT', label: 'Scope disagreement', sublabel: 'Milestone ambiguity' },
                  { value: 'PAYMENT_DISPUTE', label: 'Payment dispute', sublabel: 'Budget payment claim' },
                ]}
                variant="standard"
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Claim and evidence summary *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Explain why the submitted work is non-compliant or disputed..."
                value={disputeEvidenceText}
                onChange={(e) => setDisputeEvidenceText(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] outline-none rounded-xl p-3 text-xs text-[#0B0B0F] transition-all placeholder:text-slate-400 leading-relaxed resize-none"
              />
            </div>
          </form>
        </Modal>

        {job && (
          <>
            <FundEscrowModal
              isOpen={isFundEscrowModalOpen}
              onClose={() => setIsFundEscrowModalOpen(false)}
              job={job}
              onConfirmFund={handleConfirmFund}
            />
            <PaymentReleasedModal
              isOpen={isPaymentReleasedModalOpen}
              onClose={() => setIsPaymentReleasedModalOpen(false)}
              job={job}
              txHash={releasedTxHash}
              onViewAttestation={() => navigate(`/jobs/${job.id}/attestation`)}
            />
            <ModifyJobModal
              isOpen={isModifyModalOpen}
              job={job}
              onClose={() => setIsModifyModalOpen(false)}
            />
          </>
        )}

        <PolyLanceAlertModal
          isOpen={Boolean(alertModalOptions)}
          options={alertModalOptions}
          onClose={() => setAlertModalOptions(null)}
        />

        {/* Global Video Modal */}
        <VideoModal
          id={activeVideoId}
          isOpen={isOpen}
          onClose={closeVideo}
          triggerRef={triggerRef}
        />

        <GithubVerifyModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          userAddress={address || ''}
          onVerified={handleGithubVerified}
        />
      </div>
    </PageContainer>
  );
};
