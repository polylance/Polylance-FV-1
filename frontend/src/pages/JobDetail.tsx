import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { EscrowTimeline } from '../components/EscrowTimeline';
import { ApplicantTable } from '../components/ApplicantTable';
import { DisputePanel } from '../components/DisputePanel';
import { DeliverableWorkSubmissionPanel } from '../components/DeliverableWorkSubmissionPanel';
import { DisputeReason, UserProfile } from '../types';
import { truncateAddress, formatDaysRemaining } from '../utils/formatters';
import { getIpfsGatewayUrl, generateIpfsCid } from '../utils/ipfs';
import { Shield, Clock, Send, DollarSign, CheckCircle2, AlertTriangle, MessageSquare, ExternalLink, ArrowLeft, FileText, Star, Building2, Receipt, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { address, isConnected, isArbitrator, currentRole, connectWallet } = useWeb3();
  const {
    jobs,
    applyToJob,
    selectFreelancer,
    proposeTerms,
    fundJob,
    releasePayment,
    raiseDispute,
    submitDisputeResponse,
    resolveDispute,
    sendChatMessage,
    profiles,
  } = usePolyLanceData();

  const [applyProposalText, setApplyProposalText] = useState('');
  const [isApplyingModalOpen, setIsApplyingModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const [disputeReason, setDisputeReason] = useState<DisputeReason>('QUALITY');
  const [disputeEvidenceText, setDisputeEvidenceText] = useState('');
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const job = jobs.find((j) => j.id === id || j.contractAddress.toLowerCase() === id?.toLowerCase());
  const chatMessages = job?.chatMessages || [
    { sender: 'Client' as const, text: 'Welcome! Let us finalize the project scope and deliverables before funding.', timestamp: job?.createdAt || Date.now() - 3600000 }
  ];

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 font-headline">Job Contract Not Found</h2>
        <p className="text-xs text-slate-500 font-mono">Address or ID: {id}</p>
        <Link to="/jobs" className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-block">
          Return to Find Jobs
        </Link>
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

  const isClient = Boolean(isConnected && address && address.toLowerCase() === job.client.toLowerCase());
  const isFreelancer = Boolean(isConnected && address && job.freelancer && address.toLowerCase() === job.freelancer.toLowerCase());
  const isParty = isClient || isFreelancer;
  const hasApplied = Boolean(isConnected && address && job.applications.some((a) => a.applicant.toLowerCase() === address.toLowerCase()));

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyProposalText.trim()) return;
    const userProfKey = address ? Object.keys(profiles).find(k => k.toLowerCase() === address.toLowerCase()) : null;
    const userProf = ((userProfKey ? profiles[userProfKey] : null) || {}) as UserProfile;
    applyToJob(
      job.id,
      applyProposalText,
      address,
      userProf.skills || ['Developer'],
      Boolean(userProf.githubVerified),
      userProf.primaryScore || 750
    );
    setIsApplyingModalOpen(false);
    setApplyProposalText('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  };

  const handleRaiseDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeEvidenceText.trim()) return;
    const evidenceCid = generateIpfsCid({ disputeEvidenceText, timestamp: Date.now() });
    raiseDispute(job.id, disputeReason, disputeEvidenceText, evidenceCid, address);
    setIsDisputeModalOpen(false);
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/jobs" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-mono font-bold">
          <ArrowLeft size={14} /> Back to Find Jobs
        </Link>
        <span className={`badge-status badge-${job.status.toLowerCase()}`}>
          Status: {job.status}
        </span>
      </div>

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

          {/* Job Description Card with CID tag */}
          <div className="glass-panel p-6 sm:p-8 border-slate-200 bg-white hard-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-purple-700" /> Job Description
              </h2>
              <span className="font-data-hash text-[11px] text-purple-900 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 font-bold">
                CID: {generateIpfsCid(job.title).slice(0, 16)}...
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
                  applications={job.applications}
                  category={job.category}
                  onSelect={(freelancerAddr) => selectFreelancer(job.id, freelancerAddr)}
                  isClient={true}
                />
              ) : currentRole === 'client' ? (
                <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow text-center">
                  <Shield className="w-10 h-10 text-purple-700 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-900">Role Restriction</h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    You are connected as a Client. Only Freelancer accounts can submit proposals to this job.
                  </p>
                </div>
              ) : (
                <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline text-lg font-bold text-slate-900">
                        Submit Proposal
                      </h3>
                      <p className="text-xs text-slate-600">
                        Submit your proposal with verified GitHub skill score breakdown
                      </p>
                    </div>

                    {!isConnected ? (
                      <button onClick={connectWallet} className="gradient-btn-primary px-4 py-2 rounded-xl text-xs font-bold">
                        Connect Wallet to Apply
                      </button>
                    ) : hasApplied ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Proposal Submitted
                      </span>
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
              )}
            </div>
          )}

          {/* 2. STATUS: SELECTED (XMTP Panel) */}
          {job.status === 'Selected' && (
            isParty ? (
              <div className="glass-panel p-6 border-purple-200 bg-white hard-shadow space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare size={18} className="text-purple-700" /> XMTP Encrypted Negotiation Panel
                    </h3>
                    <p className="text-xs text-slate-600">
                      Freelancer selected: <span className="text-purple-900 font-bold">{freelancerDisplayName}</span> <span className="font-mono text-[10px] text-slate-500">({truncateAddress(job.freelancer)})</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-bold">
                    End-to-End Encrypted
                  </span>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto font-mono text-xs">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg max-w-lg ${msg.sender === 'Client' ? 'bg-purple-100 border border-purple-200 text-purple-950 ml-auto' : 'bg-white border border-slate-200 text-slate-800'
                        }`}
                    >
                      <div className="font-bold text-[10px] text-slate-500 mb-1">{msg.sender}</div>
                      <div>{msg.text}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message to agree on terms..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                  <button type="submit" className="gradient-btn-primary px-4 rounded-xl text-xs font-bold">
                    Send
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <h4 className="font-headline font-bold text-slate-900">Milestone Terms Hash Status</h4>
                      <p className="text-slate-600">
                        Client Agreed: {job.clientAgreedTerms ? '✓ Yes' : 'Pending'} | Freelancer Agreed: {job.freelancerAgreedTerms ? '✓ Yes' : 'Pending'}
                      </p>
                    </div>

                    {isParty && (
                      <button
                        onClick={() => proposeTerms(job.id, address)}
                        className="bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        Propose Terms Hash
                      </button>
                    )}
                  </div>

                  {isClient && (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-headline text-sm font-bold text-emerald-900">Ready to Fund Escrow</h4>
                        <p className="text-xs text-slate-600">Deposit ${job.amountUsdc} USDC into JobEscrow clone</p>
                      </div>

                      <button
                        onClick={() => fundJob(job.id)}
                        className="gradient-btn-emerald px-6 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5"
                      >
                        <DollarSign size={16} /> Fund Escrow Contract
                      </button>
                    </div>
                  )}
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
          {(job.status === 'Selected' || job.status === 'Submitted' || job.status === 'Disputed' || job.status === 'Completed') && (
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
                      <Award size={14} /> Token #{Math.floor(Math.random() * 9000 + 1000)}
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
          {/* Budget Card */}
          <div className="glass-panel p-6 border-purple-200 bg-white hard-shadow space-y-4">
            <h3 className="font-label-mono text-xs text-slate-500 uppercase tracking-wider font-bold">
              Job Escrow Budget
            </h3>
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

            const isMultisig = job.client.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_1 || '0x62cdfc0692cc675c95304bace2c834d8f901dcba').toLowerCase() ||
                               job.client.toLowerCase() === (import.meta.env.VITE_ADMIN_ADDRESS_2 || '0x25f6c8ed995c811e6c0adb1d66a60830e8115e9a').toLowerCase() ||
                               job.client.toLowerCase() === '0xb30f2efbcebc529d946e05c9cce0f1fffb7e1ab1';

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
