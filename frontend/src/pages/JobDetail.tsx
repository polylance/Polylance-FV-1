import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { EscrowTimeline } from '../components/EscrowTimeline';
import { ApplicantTable } from '../components/ApplicantTable';
import { DisputePanel } from '../components/DisputePanel';
import { DeliverableWorkSubmissionPanel } from '../components/DeliverableWorkSubmissionPanel';
import { DisputeReason, UserProfile } from '../types';
import { truncateAddress, formatDaysRemaining, formatTimeAgo, getDeterministicSbtId } from '../utils/formatters';
import { getIpfsGatewayUrl, generateIpfsCid } from '../utils/ipfs';
import { getJobInactivityStatus } from '../utils/inactivity';
import { Shield, ShieldCheck, Wallet, Clock, Send, DollarSign, CheckCircle2, AlertTriangle, MessageSquare, ExternalLink, ArrowLeft, FileText, Star, Building2, Receipt, Award, Github, Sparkles, ArrowUpRight, Calendar, Trash2, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ErrorState } from '../components/UIStates';
import { ActionStatusModal, ActionModalDetail } from '../components/ActionStatusModal';

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { address, isConnected, isArbitrator, currentRole, connectWallet } = useWeb3();
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
  } = usePolyLanceData();

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
    });
  };

  const handleRemoveJobPost = async () => {
    if (!job) return;
    const confirmed = window.confirm(
      'Are you sure you want to remove this job posting? It will be permanently cleaned from the marketplace, site, and database.'
    );
    if (!confirmed) return;
    await deleteJob(job.id);
    navigate('/jobs');
  };

  const [applyProposalText, setApplyProposalText] = useState('');
  const [isApplyingModalOpen, setIsApplyingModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [freelancerPreAcceptInput, setFreelancerPreAcceptInput] = useState('');

  const handleFreelancerSendPreAccept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !freelancerPreAcceptInput.trim()) return;
    sendPreAcceptMessage(job.id, freelancerPreAcceptInput.trim(), address || '', 'Freelancer');
    setFreelancerPreAcceptInput('');
  };

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
    onPrimaryAction?: () => void;
  }>({
    isOpen: false,
    title: '',
  });

  const job = jobs.find((j) => j.id === id || j.contractAddress.toLowerCase() === id?.toLowerCase());
  const chatMessages = job?.chatMessages || [
    { sender: 'Client' as const, text: 'Welcome! Let us finalize the project scope and deliverables before funding.', timestamp: job?.createdAt || Date.now() - 3600000 }
  ];

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <ErrorState
          title="Job Contract Not Found"
          description={`We couldn't locate an active smart contract escrow for ID: ${id}. It may have expired or been removed.`}
          onRetry={() => window.location.reload()}
          onDashboard={() => window.location.hash = '#/jobs'}
        />
      </div>
    );
  }

  const clientProfileKey = Object.keys(profiles).find(k => k.toLowerCase() === job.client.toLowerCase());
  const clientProfile = clientProfileKey ? profiles[clientProfileKey] : null;
  const clientDisplayName = clientProfile?.displayName || 'Anonymous Client';

  const freelancerAddr = job.freelancer;
  const freelancerProfileKey = freelancerAddr ? Object.keys(profiles).find(k => k.toLowerCase() === freelancerAddr.toLowerCase()) : null;
  const freelancerProfile = freelancerProfileKey ? profiles[freelancerProfileKey] : null;
  const freelancerDisplayName = freelancerProfile?.displayName || (freelancerAddr ? 'Anonymous Freelancer' : 'Unassigned');

  const currentUserProfKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
  const currentUserProf = currentUserProfKey ? profiles[currentUserProfKey] : null;
  const isUserVerified = Boolean(currentUserProf?.githubVerified);

  const isClient = Boolean(isConnected && address && address.toLowerCase() === job.client.toLowerCase());
  const isFreelancer = Boolean(isConnected && address && job.freelancer && address.toLowerCase() === job.freelancer.toLowerCase());
  const isParty = isClient || isFreelancer;
  const hasApplied = Boolean(isConnected && address && job.applications.some((a) => a.applicant.toLowerCase() === address.toLowerCase()));

  const getFormattedPayout = (amtUsdc: string, tokenSym?: string, amtEth?: string) => {
    const sym = (tokenSym || 'USDC').toUpperCase();
    if (sym === 'ETH') {
      return `${amtEth || (parseFloat(amtUsdc || '0') / 2500).toFixed(4)} ETH`;
    }
    if (sym === 'MATIC' || sym === 'POL') {
      return `${amtEth || amtUsdc} POL`;
    }
    return `$${parseFloat(amtUsdc || '0').toLocaleString()} ${sym}`;
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyProposalText.trim()) return;
    if (!isUserVerified) {
      setActionModal({
        isOpen: true,
        title: 'GitHub Verification Required',
        subtitle: 'Sybil-resistant verification is required before submitting job applications.',
        icon: 'extension',
        badgeText: 'VERIFICATION NEEDED',
        details: [
          { label: 'Requirement', value: 'GitHub OAuth Verification' },
          { label: 'Action', value: 'Go to Profile Page to Verify' },
        ],
      });
      return;
    }
    applyToJob(
      job.id,
      applyProposalText,
      address,
      currentUserProf?.skills || ['Developer'],
      Boolean(currentUserProf?.githubVerified),
      currentUserProf?.primaryScore || 750
    );
    setIsApplyingModalOpen(false);
    setApplyProposalText('');
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    const payoutStr = getFormattedPayout(job.amountUsdc, job.paymentTokenSymbol, job.amountEth);
    setActionModal({
      isOpen: true,
      title: 'Job Proposal Submitted On-Chain',
      subtitle: 'Your verified application and proposal have been recorded and sent to the client.',
      icon: 'success',
      badgeText: 'PROPOSAL ACTIVE',
      details: [
        { label: 'Escrow Budget', value: payoutStr, isBadge: true },
        { label: 'Applicant', value: truncateAddress(address || ''), isMono: true },
        { label: 'Review SLA', value: `${job.reviewPeriodDays || 7} Days` },
      ],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProposeTermsAction = (jobId: string, userAddr: string) => {
    proposeTerms(jobId, userAddr);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    const payoutStr = getFormattedPayout(job.amountUsdc, job.paymentTokenSymbol, job.amountEth);
    setActionModal({
      isOpen: true,
      title: 'Milestone Terms Agreed On-Chain',
      subtitle: 'Your acceptance of the project scope and SLA terms has been signed and recorded.',
      icon: 'terms',
      badgeText: 'TERMS FINALIZED',
      details: [
        { label: 'Agreement Status', value: 'Terms Accepted', isBadge: true },
        { label: 'Milestone Payout', value: payoutStr },
        { label: 'Escrow Address', value: truncateAddress(job.contractAddress), isMono: true, explorerUrl: `https://polygonscan.com/address/${job.contractAddress}` },
      ],
      primaryActionText: 'Awesome! Take me to Dashboard',
      onPrimaryAction: () => navigate('/dashboard'),
    });
  };

  const handleFundJobAction = (jobId: string) => {
    fundJob(jobId);
    confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
    const payoutStr = getFormattedPayout(job.amountUsdc, job.paymentTokenSymbol, job.amountEth);
    setActionModal({
      isOpen: true,
      title: 'Escrow Deposit Funded Successfully',
      subtitle: `Milestone funds (${payoutStr}) are now locked in the standalone JobEscrow smart contract.`,
      icon: 'payment',
      badgeText: 'ESCROW ACTIVE',
      details: [
        { label: 'Escrow Locked', value: payoutStr, isBadge: true },
        { label: 'Escrow Clone', value: truncateAddress(job.contractAddress), isMono: true, explorerUrl: `https://polygonscan.com/address/${job.contractAddress}` },
        { label: 'Next Step', value: 'Freelancer Deliverables In Progress' },
      ],
      primaryActionText: 'Awesome! Take me to Dashboard',
      onPrimaryAction: () => navigate('/dashboard'),
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(job.id, chatInput, isClient ? 'Client' : 'Freelancer');
    setChatInput('');
  };

  const handleReleasePayment = () => {
    releasePayment(job.id);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    const payoutStr = getFormattedPayout(job.amountUsdc, job.paymentTokenSymbol, job.amountEth);
    setActionModal({
      isOpen: true,
      title: 'Payment Released & SBT Minted',
      subtitle: 'Escrow funds have been transferred directly to the freelancer, and an on-chain reputation SBT has been minted.',
      icon: 'payment',
      badgeText: 'TRANSACTION SETTLED',
      details: [
        { label: 'Amount Released', value: payoutStr, isBadge: true },
        { label: 'Freelancer', value: truncateAddress(job.freelancer || ''), isMono: true },
        { label: 'Contract', value: truncateAddress(job.contractAddress), isMono: true, explorerUrl: `https://polygonscan.com/address/${job.contractAddress}` },
      ],
      primaryActionText: 'Awesome! Take me to Dashboard',
      onPrimaryAction: () => navigate('/dashboard'),
    });
  };

  const handleRaiseDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeEvidenceText.trim()) return;
    const evidenceCid = generateIpfsCid({ disputeEvidenceText, timestamp: Date.now() });
    raiseDispute(job.id, disputeReason, disputeEvidenceText, evidenceCid, address || '');
    setIsDisputeModalOpen(false);
    setActionModal({
      isOpen: true,
      title: 'Escrow Case Escalated to DAO Judges',
      subtitle: 'Your evidence and case details have been registered on-chain for decentralized arbitration.',
      icon: 'dispute',
      badgeText: 'DISPUTE SUBMITTED',
      details: [
        { label: 'Dispute Reason', value: disputeReason, isBadge: true },
        { label: 'IPFS Evidence CID', value: evidenceCid, isMono: true },
        { label: 'Contract Address', value: truncateAddress(job.contractAddress), isMono: true },
      ],
    });
  };

  const inactivityStatus = getJobInactivityStatus(job);

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Status Header */}
      <ActionStatusModal 
        {...actionModal} 
        onClose={() => setActionModal({ ...actionModal, isOpen: false })} 
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/jobs" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-mono font-bold">
          <ArrowLeft size={14} /> Back to Find Jobs
        </Link>
        <span className={`badge-status badge-${job.status.toLowerCase()}`}>
          Status: {job.status}
        </span>
      </div>

      {/* 10-Day Client Inactivity Reminder Banner (14-Day Auto-Removal Policy) */}
      {inactivityStatus.isReminderActive && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-amber-950 text-sm">
                  10-Day Client Inactivity Reminder
                </span>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {inactivityStatus.daysRemaining} DAY{inactivityStatus.daysRemaining === 1 ? '' : 'S'} REMAINING
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-sans">
                This job was posted {Math.floor(inactivityStatus.daysElapsed)} days ago without an applicant selected or client response. Per protocol policy, jobs with no client action are automatically removed from the marketplace and database on Day 14.
              </p>
            </div>
          </div>

          {isClient && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={async () => {
                  const ok = await renewJob(job.id);
                  if (ok) {
                    confetti({ particleCount: 50, spread: 60 });
                    setActionModal({
                      isOpen: true,
                      title: 'Job Posting Renewed',
                      subtitle: 'The 14-day inactivity timer has been refreshed for this job posting.',
                      icon: 'success',
                      badgeText: 'TIMER RESET',
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Renew (Keep Active)</span>
              </button>

              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to cancel and remove this job posting now?')) {
                    const ok = await deleteJob(job.id);
                    if (ok) navigate('/dashboard');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Remove Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Layout matching job_detail_status_open/code.html */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Job Details & Status Action Panels */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Header Block matching reference design */}
          <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 size={13} /> Status: {job.status}
                </span>
                <span className="text-xs text-slate-500 font-mono">Posted on-chain</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-700 text-xs font-mono font-bold">
                <Shield size={16} /> ESCROW SECURED
              </div>
            </div>

            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
              {job.title}
            </h1>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="bg-purple-50 border border-purple-200 px-3 py-1 rounded text-xs font-mono text-purple-900 font-bold">
                {job.category}
              </span>
              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5">
                <Clock size={13} className="text-purple-600" />
                Posted: {new Date(job.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({formatTimeAgo(job.createdAt || Date.now())})
              </span>
              <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded text-xs font-mono text-slate-700">
                Review Window: {job.reviewPeriodDays} Days
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-500 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">CLIENT:</span>
                <Link 
                  to={`/profile/${job.client}`}
                  className="text-purple-700 font-extrabold hover:text-purple-900 hover:underline flex items-center gap-1"
                >
                  <span>{clientDisplayName}</span>
                  <span className="text-slate-400 font-normal">({truncateAddress(job.client)})</span>
                  <ExternalLink size={11} className="text-purple-500" />
                </Link>
              </div>
              {job.freelancer && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">FREELANCER:</span>
                  <Link 
                    to={`/profile/${job.freelancer}`}
                    className="text-purple-700 font-extrabold hover:text-purple-900 hover:underline flex items-center gap-1"
                  >
                    <span>{freelancerDisplayName}</span>
                    <span className="text-slate-400 font-normal">({truncateAddress(job.freelancer)})</span>
                    <ExternalLink size={11} className="text-purple-500" />
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* 10-Day Retention & Database Cleaning Alert for Client */}
          {isClient && (Date.now() - (job.createdAt || Date.now()) >= 10 * 24 * 60 * 60 * 1000) && job.status === 'Open' && (
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3 shadow-md animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                  <AlertTriangle size={22} />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-headline font-bold text-sm text-amber-900">
                    10-Day Job Retention & Database Cleaning Alert
                  </h3>
                  <p className="text-xs text-amber-800 leading-relaxed font-sans font-medium">
                    This job posting was created over 10 days ago (on {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}). To help keep the site, marketplace, and database clean and performant, please choose whether to keep this job active or remove and clean it permanently from the site and database.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-200/80">
                <button
                  type="button"
                  onClick={handleKeepJobActive}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw size={13} /> Keep Job Active (+10 Days)
                </button>
                <button
                  type="button"
                  onClick={handleRemoveJobPost}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Trash2 size={13} /> Remove & Clean from Database
                </button>
              </div>
            </div>
          )}

          {/* Job Description Card with CID tag & Posted Date */}
          <div className="glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-purple-700" /> Job Description
              </h2>
              <span className="font-data-hash text-[11px] text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 font-bold">
                CID: {generateIpfsCid(job.title).slice(0, 16)}...
              </span>
            </div>

            {/* Prominent Posted Date Banner */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-600 bg-purple-50/60 p-3 rounded-xl border border-purple-100 gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Calendar size={14} className="text-purple-600" />
                <span>Posted Date: {new Date(job.createdAt || Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <span className="text-purple-800 font-bold bg-white px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                {formatTimeAgo(job.createdAt || Date.now())}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {job.description}
            </p>
          </div>

          {/* STATUS-DRIVEN CONTENT PANELS */}

          {/* 1. STATUS: OPEN */}
          {job.status === 'Open' && (
            <div className="space-y-6">
              {isClient ? (
                <ApplicantTable
                  jobId={job.id}
                  jobAmount={job.amountUsdc}
                  jobReviewPeriodDays={job.reviewPeriodDays}
                  applications={job.applications}
                  category={job.category}
                  onSelect={(freelancerAddr) => selectFreelancer(job.id, freelancerAddr)}
                  isClient={true}
                />
              ) : (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-headline text-lg font-bold text-slate-900">
                          {hasApplied ? 'Proposal Submitted & Under Review' : 'Submit Proposal'}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {hasApplied 
                            ? 'Your proposal is active. You can discuss deliverables and terms directly with the client below.'
                            : 'Submit your proposal with verified GitHub skill score breakdown'}
                        </p>
                      </div>

                      {!isConnected ? (
                        <button onClick={connectWallet} className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold">
                          Connect Wallet to Apply
                        </button>
                      ) : !isUserVerified ? (
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 shadow-2xs">
                            <AlertTriangle size={15} className="text-amber-600 shrink-0" /> GitHub verification required to apply for jobs
                          </span>
                          <Link
                            to="/profile"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                          >
                            <Github size={15} /> Verify GitHub Account
                          </Link>
                        </div>
                      ) : hasApplied ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={14} /> Proposal Active
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsApplyingModalOpen(true)}
                          className="gradient-btn-emerald px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
                        >
                          <Send size={15} /> Apply for this Job
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pre-Acceptance Direct Negotiation with Client (Redirect to Messages) */}
                  {hasApplied && (
                    <div className="bg-white border border-purple-200/80 rounded-2xl p-5 space-y-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-purple-700" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Discuss Terms & Scope in Messages
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          Communicate with the client in real-time to adjust deliverables, proposal scope, and deadlines.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/chat?jobId=${job.id}`)}
                        className="gradient-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                      >
                        <MessageSquare size={14} />
                        <span>Open Messages</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. STATUS: SELECTED (Proposal Acceptance & Agreement Workspace) */}
          {job.status === 'Selected' && (
            isParty ? (
              <div className="space-y-6">
                {/* Dedicated Freelancer Acceptance Banner */}
                {isFreelancer && (
                  <div className="glass-panel p-6 sm:p-8 border-purple-300 bg-gradient-to-br from-purple-50 via-white to-indigo-50 hard-shadow space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                            ACTION REQUIRED • PROPOSAL ACCEPTED
                          </span>
                          <h3 className="font-headline text-xl font-extrabold text-slate-900 mt-1">
                            🎉 Congratulations! The client selected your proposal
                          </h3>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={14} /> Selected Candidate
                      </span>
                    </div>

                    {/* Proposal & Scope Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                      <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Escrow Payout</span>
                        <span className="text-lg font-black text-emerald-700">${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC</span>
                        <span className="text-[10px] text-slate-500 block">({job.amountEth || '...'} {job.paymentTokenSymbol || 'MATIC'})</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Review Window SLA</span>
                        <span className="text-lg font-black text-purple-900">{job.reviewPeriodDays || 7} Days</span>
                        <span className="text-[10px] text-slate-500 block">Auto-release after submission</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-2xs space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Agreement Terms</span>
                        <span className="text-base font-bold text-slate-800 flex items-center gap-1">
                          {job.freelancerAgreedTerms ? (
                            <span className="text-emerald-700 flex items-center gap-1 font-black">
                              <CheckCircle2 size={16} /> Terms Accepted
                            </span>
                          ) : (
                            <span className="text-amber-700 flex items-center gap-1 font-bold">
                              <Clock size={16} /> Acceptance Pending
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Client: {job.clientAgreedTerms ? '✓ Agreed' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Accepted Proposal Text Preview */}
                    {(() => {
                      const selApp = (job.applications || []).find((a) => a.applicant.toLowerCase() === address.toLowerCase());
                      return selApp?.proposalText ? (
                        <div className="bg-white/80 p-4 rounded-xl border border-purple-100 text-xs space-y-1">
                          <span className="text-[10px] font-mono font-bold text-purple-900 uppercase">Your Accepted Proposal</span>
                          <p className="text-slate-700 italic">"{selApp.proposalText}"</p>
                        </div>
                      ) : null;
                    })()}

                    {/* Acceptance Action CTA */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-purple-100">
                      <p className="text-xs text-slate-600 max-w-md">
                        {job.freelancerAgreedTerms
                          ? '✓ You have accepted the assignment terms. Once the client funds the on-chain escrow, work can begin!'
                          : 'Review the project requirements and click below to finalize the milestone terms on-chain.'}
                      </p>

                      {!job.freelancerAgreedTerms ? (
                        <button
                          onClick={() => handleProposeTermsAction(job.id, address || '')}
                          className="gradient-btn-emerald px-6 py-3 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer animate-pulse"
                        >
                          <CheckCircle2 size={16} />
                          Accept Assignment & Agree to Terms
                        </button>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 font-mono">
                          <CheckCircle2 size={16} /> Terms Agreed & Finalized
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Client Selection Status Banner */}
                {isClient && (
                  <div className="glass-panel p-6 border-purple-200 bg-white hard-shadow space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-purple-800 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          HIRING PIPELINE
                        </span>
                        <h3 className="font-headline text-lg font-bold text-slate-900 mt-1">
                          Freelancer Selected: <span className="text-purple-900 font-black">{freelancerDisplayName}</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Address: {truncateAddress(job.freelancer)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-3 py-1 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          Freelancer Status: {job.freelancerAgreedTerms ? '✓ Agreed Terms' : 'Pending Acceptance'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="space-y-1">
                        <h4 className="font-headline text-sm font-bold text-slate-900">Next Step: Fund Escrow Deposit</h4>
                        <p className="text-xs text-slate-600">
                          Lock ${job.amountUsdc} USDC in the smart contract escrow to start the project.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {!job.clientAgreedTerms && (
                          <button
                            onClick={() => handleProposeTermsAction(job.id, address || '')}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={15} /> Propose Terms Hash
                          </button>
                        )}
                        <button
                          onClick={() => handleFundJobAction(job.id)}
                          className="gradient-btn-emerald px-6 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <DollarSign size={16} /> Fund Escrow Contract
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Messages & Terms Negotiation Hub Card */}
                <div className="glass-panel p-6 border-purple-200 bg-white hard-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={18} className="text-purple-700" />
                      <h3 className="font-headline text-base font-bold text-slate-900">
                        Encrypted Negotiation & Communication Hub
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600">
                      Communicate directly in the Messages section to discuss milestones, scope adjustments, and time extensions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat?jobId=${job.id}`)}
                    className="gradient-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                  >
                    <MessageSquare size={14} />
                    <span>Open Messages</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow text-center">
                <MessageSquare className="w-10 h-10 text-purple-700 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-900">Encrypted Negotiation in Progress</h4>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  The client and selected freelancer are currently finalizing terms in an end-to-end encrypted session.
                </p>
              </div>
            )
          )}

          {/* DELIVERABLE SUBMISSION, WORK STATUS, EXTENSIONS & CLIENT APPROVAL WORKSPACE */}
          {(job.status === 'Funded' || job.status === 'Submitted' || job.status === 'Disputed' || job.status === 'Completed') && (
            <DeliverableWorkSubmissionPanel job={job} />
          )}

          {/* 4. STATUS: COMPLETED (Official Digital Transaction Bill) */}
          {job.status === 'Completed' && (
            <div className="glass-panel p-6 sm:p-8 border-emerald-300 bg-white hard-shadow space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-bold">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      OFFICIAL TRANSACTION BILL RECORD
                    </span>
                    <h3 className="font-headline text-xl font-black text-slate-900 mt-1">
                      Payment Released & Escrow Closed
                    </h3>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-slate-500 block">Record ID</span>
                  <span className="font-bold text-purple-900">#INV-2026-POLYLANCE-{job.id.slice(0, 6)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">
                    {job.dispute?.resolved ? "Escrow Payout Distribution" : "Total Amount Released"}
                  </span>
                  {job.dispute?.resolved ? (
                    <div className="space-y-1 pt-1">
                      <p className="font-extrabold text-emerald-700 text-[11px]">
                        Dev: ${(parseFloat(job.amountUsdc) * (job.dispute.rulingBps ?? 0) / 10000).toLocaleString()} USDC
                      </p>
                      <p className="font-extrabold text-indigo-750 text-indigo-700 text-[11px]">
                        Client: ${(parseFloat(job.amountUsdc) * (10000 - (job.dispute.rulingBps ?? 0)) / 10000).toLocaleString()} USDC
                      </p>
                    </div>
                  ) : (
                    <p className="font-extrabold text-emerald-700 text-lg">${parseFloat(job.amountUsdc).toLocaleString()} USDC</p>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Contractor Payout</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {job.dispute?.resolved && (job.dispute.rulingBps ?? 0) === 0 ? "None (100% Refunded)" : freelancerDisplayName}
                  </p>
                  {!(job.dispute?.resolved && (job.dispute.rulingBps ?? 0) === 0) && (
                    <p className="text-[10px] font-mono text-slate-500">{truncateAddress(job.freelancer)}</p>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Soulbound SBT Minted</span>
                  {job.dispute?.resolved && (job.dispute.rulingBps ?? 0) === 0 ? (
                    <p className="font-bold text-slate-400 text-xs">None (No SBT for 0% Payout)</p>
                  ) : (
                    <p className="font-bold text-purple-700 text-sm flex items-center gap-1">
                      <Award size={14} /> Token #{job.sbtTokenId || getDeterministicSbtId(job.id)}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 font-mono text-xs text-purple-950 flex justify-between items-center">
                <span>Immutable Proof of Delivery on Polygon Ledger</span>
                <span className="font-bold text-purple-900">Block Verified ✓</span>
              </div>
            </div>
          )}

          {/* 5. STATUS: DISPUTED */}
          {job.status === 'Disputed' && job.dispute && (
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
          )}
        </div>

        {/* Right Column Sidebar matching job_detail_status_open/code.html */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Budget & Escrow Platform Maintenance Fee Breakdown Card */}
          <div className="glass-panel p-6 border-purple-200 bg-white hard-shadow space-y-4 font-sans">
            {/* Header matching requested visual design */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50/90 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
                  <Wallet size={22} className="text-purple-600 stroke-[2.2]" />
                </div>
                <div className="font-mono text-xs font-black tracking-wider text-slate-900 leading-tight uppercase">
                  <div>JOB ESCROW</div>
                  <div>BUDGET</div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-full bg-purple-50/70 border border-purple-200 text-purple-900 font-mono text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs">
                <ShieldCheck size={13} className="text-purple-600 shrink-0 stroke-[2.5]" />
                <span>0% Commission • 2.5% Maint. Fee</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-3xl font-extrabold text-slate-900">
                  {parseFloat(job.amountUsdc).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </span>
                <span className="font-headline text-base font-bold text-purple-700">{job.paymentTokenSymbol || 'USDC'}</span>
              </div>
              {job.paymentTokenSymbol && job.paymentTokenSymbol !== 'USDC' && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  ≈ ${parseFloat(job.amountUsdc).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                </span>
              )}
            </div>

            {/* Maintenance Fee & Net Payout Breakdown */}
            {(() => {
              const gross = parseFloat(job.amountUsdc || '0');
              const maintenanceFee = gross * 0.025;
              const netPayout = gross - maintenanceFee;
              const isMeFreelancer = job.freelancer?.toLowerCase() === (address || '').toLowerCase() || currentRole === 'freelancer';
              const isMeClient = job.client.toLowerCase() === (address || '').toLowerCase() || currentRole === 'client';

              return (
                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Gross Escrow Deposit:</span>
                    <span className="font-bold text-slate-900">${gross.toFixed(2)} USDC</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span className="flex items-center gap-1">
                      <span>Platform Maintenance Fee (2.5%):</span>
                    </span>
                    <span className="font-bold text-rose-600">-${maintenanceFee.toFixed(2)} USDC</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-950 font-bold">
                    <span>{isMeFreelancer ? 'Your Net Payout:' : 'Developer Net Payout:'}</span>
                    <span className="text-emerald-700 text-sm font-black">${netPayout.toFixed(2)} USDC</span>
                  </div>

                  <p className="text-[10px] font-sans text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                    {isMeClient
                      ? '💡 0% Commission — 2.5% platform maintenance fee is deducted upon payout release and routed to the decentralized DAO treasury.'
                      : '💡 0% Commission — Net amount received after 2.5% platform maintenance fee.'}
                  </p>
                </div>
              );
            })()}

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-mono font-bold">
              <Shield size={16} />
              <span>Escrow Fully Secured</span>
            </div>
          </div>

          {/* Escrow Timeline Sidebar (Vertical Stepper from reference code) */}
          <EscrowTimeline events={job.events} />

          {/* Detailed Client Trust & Legitimacy Scorecard Widget */}
          {(() => {
            const clientProfileKey = Object.keys(profiles).find(k => k.toLowerCase() === job.client.toLowerCase());
            const clientProfile = clientProfileKey ? profiles[clientProfileKey] : null;
            const clientDisplayName = clientProfile?.displayName || 'Anonymous Client';

            const clientJobs = jobs.filter(j => j.client.toLowerCase() === job.client.toLowerCase());
            const totalOffered = clientJobs.length;
            const completedJobsCount = clientJobs.filter(j => j.status === 'Completed').length;
            const disputedJobsCount = clientJobs.filter(j => j.status === 'Disputed' || j.events.some(e => e.step === 'Disputed')).length;

            const totalSpentUsdc = clientJobs
              .filter(j => j.status === 'Completed')
              .reduce((sum, j) => sum + parseFloat(j.amountUsdc || '0'), 0);

            const escrowRatio = totalOffered > 0 ? Math.round((completedJobsCount / totalOffered) * 100) : 100;

            let trustScore = 10.0;
            if (totalOffered > 0) {
              const disputeRatio = disputedJobsCount / totalOffered;
              trustScore = Math.max(1.0, 10.0 - (disputeRatio * 10.0));
            }
            const trustScoreStr = totalOffered > 0 ? trustScore.toFixed(1) : '10.0';

            let trustBadge = 'NEW CLIENT';
            let trustColor = 'bg-slate-100 text-slate-700 border-slate-300';
            if (totalOffered > 0) {
              if (trustScore >= 9.0) {
                trustBadge = 'AA+ TRUSTED';
                trustColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              } else if (trustScore >= 7.0) {
                trustBadge = 'A+ ACTIVE';
                trustColor = 'bg-blue-100 text-blue-800 border-blue-300';
              } else {
                trustBadge = 'CAUTION';
                trustColor = 'bg-rose-100 text-rose-800 border-rose-300';
              }
            }

            let avgSpeedText = 'No Release Speed History';
            let speedSub = 'This client has not released any milestone payments yet.';
            const releaseSpeeds = clientJobs
              .filter(j => j.status === 'Completed')
              .map(j => {
                const postedEvent = j.events.find(e => e.step === 'Posted');
                const completedEvent = j.events.find(e => e.step === 'Completed');
                if (postedEvent && completedEvent && completedEvent.timestamp > 0 && postedEvent.timestamp > 0) {
                  return (completedEvent.timestamp - postedEvent.timestamp) / 3600000;
                }
                return null;
              })
              .filter((v): v is number => v !== null && v > 0);

            if (releaseSpeeds.length > 0) {
              const avgHours = releaseSpeeds.reduce((a, b) => a + b, 0) / releaseSpeeds.length;
              avgSpeedText = `${avgHours.toFixed(1)}h Average Payout Speed`;
              speedSub = 'Average time from job publication to complete milestone payout release.';
            }

            const isMultisig = job.client.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_1 || '').toLowerCase() ||
                               job.client.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_2 || '').toLowerCase() ||
                               job.client.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_3 || '').toLowerCase();

            return (
              <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="font-label-mono text-xs text-slate-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                    <Shield size={14} className="text-emerald-600" /> Client Legitimacy Audit
                  </h3>
                  <span className={`text-[10px] font-mono font-black border px-2 py-0.5 rounded-md ${trustColor}`}>
                    {trustBadge}
                  </span>
                </div>

                {/* Profile Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm truncate">{clientDisplayName}</p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{truncateAddress(job.client)}</p>
                  </div>
                </div>

                {/* Primary Trust Rating */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Client Trust Index</span>
                    <span className="text-2xl font-black text-slate-800">{trustScoreStr}</span>
                    <span className="text-xs text-slate-400 font-bold"> / 10.0</span>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex text-amber-500 justify-end">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const starValue = index + 1;
                        const rating = trustScore / 2;
                        const isFilled = rating >= starValue;
                        return (
                          <Star 
                            key={index} 
                            size={13} 
                            className={isFilled ? "fill-amber-500 text-amber-500" : "text-slate-350"} 
                          />
                        );
                      })}
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300/40 px-2 py-0.5 rounded-full font-black">
                      {escrowRatio}% Escrow Ratio
                    </span>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="space-y-3 pt-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Legitimacy Audit Checklist</span>

                  <div className="space-y-2.5 text-[11px] font-mono">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-800 font-bold block">{totalOffered} Escrow Project{totalOffered === 1 ? '' : 's'} Offered</span>
                        <span className="text-slate-500 text-[10px]">Successfully published {totalOffered} smart contract escrow{totalOffered === 1 ? '' : 's'} on Polygon Ledger.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-800 font-bold block">{completedJobsCount} Payout{completedJobsCount === 1 ? '' : 's'} Fully Released</span>
                        <span className="text-slate-500 text-[10px]">{completedJobsCount} escrow{completedJobsCount === 1 ? '' : 's'} released to freelancers without dispute history.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-800 font-bold block">{avgSpeedText}</span>
                        <span className="text-slate-500 text-[10px]">{speedSub}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-800 font-bold block">{disputedJobsCount} Dispute{disputedJobsCount === 1 ? '' : 's'} Escalated</span>
                        <span className="text-slate-500 text-[10px]">
                          {disputedJobsCount === 0 
                            ? '100% clean record. Zero disputes escalated to DAO arbitration.' 
                            : `${disputedJobsCount} project escrow${disputedJobsCount === 1 ? '' : 's'} required DAO dispute resolution.`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-800 font-bold block">
                          {isMultisig ? 'Safe Multi-Sig Wallet' : 'Standard Web3 EOA'}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {isMultisig 
                            ? 'Client wallet address is a verified Safe multi-signature organization contract.' 
                            : 'Client wallet is a standard externally owned account (EOA).'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Totals */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="border-r border-slate-200">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Jobs Created</span>
                    <span className="font-extrabold text-slate-800">{totalOffered} Escrow{totalOffered === 1 ? '' : 's'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Spent Volume</span>
                    <span className="font-extrabold text-purple-900">${totalSpentUsdc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} USDC</span>
                  </div>
                </div>
              </div>
            );
          })()}
      </aside>
    </div>

      {/* Modals */}
      {isApplyingModalOpen && (() => {
        const userProfileKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
        const userProfile = userProfileKey ? profiles[userProfileKey] : null;
        return createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-purple-100 shadow-[0_20px_50px_rgba(147,51,234,0.12)] relative space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-headline text-xl font-black text-slate-900 tracking-tight">Submit Proposal</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Specify proposal terms and attest Github developer footprints on-chain.</p>
              </div>

              {userProfile?.githubVerified && (
                <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-950 font-mono">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Verified GitHub Footprints</span>
                      <span className="text-[10px] text-slate-500 font-sans leading-relaxed">Attestation hash will be committed to escrow contract.</span>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded text-[10px] shrink-0">
                    {userProfile.primaryScore || 750} Score
                  </span>
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider">
                    Proposal Statement & Milestones *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your technical roadmap, milestones breakdown, and delivery schedule..."
                    value={applyProposalText}
                    onChange={(e) => setApplyProposalText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none rounded-2xl p-4 text-xs font-sans text-slate-800 transition-all placeholder:text-slate-455 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyingModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="gradient-btn-emerald px-6 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5">
                    <Send size={14} /> Submit Proposal On-Chain
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        );
      })()}

      {isDisputeModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-rose-100 shadow-[0_20px_50px_rgba(244,63,94,0.12)] relative space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="border-b border-rose-100 pb-3">
              <h3 className="font-headline text-xl font-black text-rose-900 tracking-tight flex items-center gap-2">
                <AlertTriangle className="text-rose-600 animate-pulse" /> Raise On-Chain Dispute
              </h3>
              <p className="text-xs text-rose-600 font-mono mt-1">DAO Judge Panel arbitration requires full evidence disclosure.</p>
            </div>

            <form onSubmit={handleRaiseDisputeSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Dispute Category Reason *
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value as DisputeReason)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none rounded-2xl px-4 py-3 text-xs font-sans text-slate-800 transition-all cursor-pointer"
                >
                  <option value="QUALITY">QUALITY - Deliverable fails specifications</option>
                  <option value="NON_DELIVERY">NON_DELIVERY - Work not delivered on time</option>
                  <option value="SCOPE_DISAGREEMENT">SCOPE_DISAGREEMENT - Milestone ambiguity</option>
                  <option value="PAYMENT_DISPUTE">PAYMENT_DISPUTE - Budget payment claim</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Dispute Claim & Evidence Summary *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain why the submitted work is non-compliant or disputed..."
                  value={disputeEvidenceText}
                  onChange={(e) => setDisputeEvidenceText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none rounded-2xl p-4 text-xs font-sans text-slate-800 transition-all placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5">
                  <AlertTriangle size={14} /> File Dispute Claim
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
