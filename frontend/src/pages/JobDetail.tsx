import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  const { address, isConnected, isArbitrator, connectWallet } = useWeb3();
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
    profiles,
  } = usePolyLanceData();

  const [applyProposalText, setApplyProposalText] = useState('');
  const [isApplyingModalOpen, setIsApplyingModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; timestamp: number }[]
  >([
    { sender: 'Client', text: 'Welcome! Let us finalize the project scope and deliverables before funding.', timestamp: Date.now() - 3600000 },
  ]);

  const [disputeReason, setDisputeReason] = useState<DisputeReason>('QUALITY');
  const [disputeEvidenceText, setDisputeEvidenceText] = useState('');
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const job = jobs.find((j) => j.id === id || j.contractAddress.toLowerCase() === id?.toLowerCase());

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
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: isClient ? 'Client' : 'Freelancer', text: chatInput, timestamp: Date.now() },
    ]);
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
            <div className="glass-panel p-6 border-purple-200 bg-white hard-shadow space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-purple-700" /> XMTP Encrypted Negotiation Panel
                  </h3>
                  <p className="text-xs text-slate-600">
                    Freelancer selected: <span className="font-mono text-purple-900 font-bold">{truncateAddress(job.freelancer)}</span>
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
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Total Amount Released</span>
                  <p className="font-extrabold text-emerald-700 text-lg">${parseFloat(job.amountUsdc).toLocaleString()} USDC</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Contractor Payout</span>
                  <p className="font-bold text-slate-900 text-sm">{truncateAddress(job.freelancer)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Soulbound SBT Minted</span>
                  <p className="font-bold text-purple-700 text-sm flex items-center gap-1">
                    <Award size={14} /> Token #{Math.floor(Math.random() * 9000 + 1000)}
                  </p>
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
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-3xl font-extrabold text-slate-900">
                ${parseFloat(job.amountUsdc).toLocaleString()}
              </span>
              <span className="font-headline text-base font-bold text-emerald-700">USDC</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-mono font-bold">
              <Shield size={16} />
              <span>Escrow Fully Secured</span>
            </div>
          </div>

          {/* Escrow Timeline Sidebar (Vertical Stepper from reference code) */}
          <EscrowTimeline events={job.events} />

          {/* Detailed Client Trust & Legitimacy Scorecard Widget */}
          <div className="glass-panel p-6 border-slate-200 bg-white hard-shadow space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-label-mono text-xs text-slate-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-600" /> Client Legitimacy Audit
              </h3>
              <span className="text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                AA+ TRUSTED
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                <Building2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-slate-900 text-sm truncate">DefiEdge Protocol</p>
                <p className="text-[10px] font-mono text-slate-500 truncate">{truncateAddress(job.client)}</p>
              </div>
            </div>

            {/* Primary Trust Rating */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Client Trust Index</span>
                <span className="text-2xl font-black text-slate-800">9.8</span>
                <span className="text-xs text-slate-400 font-bold"> / 10.0</span>
              </div>
              <div className="text-right space-y-1">
                <div className="flex text-amber-500 justify-end">
                  <Star size={13} className="fill-amber-500" />
                  <Star size={13} className="fill-amber-500" />
                  <Star size={13} className="fill-amber-500" />
                  <Star size={13} className="fill-amber-500" />
                  <Star size={13} className="fill-amber-500" />
                </div>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300/40 px-2 py-0.5 rounded-full font-black">
                  100% Legitimacy
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
                    <span className="text-slate-800 font-bold block">100% Milestone Funding Ratio</span>
                    <span className="text-slate-500 text-[10px]">All budget is locked in smart contract escrow prior to developer starting work.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-800 font-bold block">4.2h Average Payout Speed</span>
                    <span className="text-slate-500 text-[10px]">Average time from milestone submission to release. Top 5% fast payer.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-800 font-bold block">Zero DAO Disputes Escalated</span>
                    <span className="text-slate-500 text-[10px]">No cases sent to arbitrator ruling. 100% friendly escrow releases.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-800 font-bold block">Safe Multi-Sig Verified Wallet</span>
                    <span className="text-slate-500 text-[10px]">Client wallet address is a verified organizational Safe multi-sig.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Totals */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="border-r border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Jobs Created</span>
                <span className="font-extrabold text-slate-800">12 Escrows</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Spent Volume</span>
                <span className="font-extrabold text-purple-900">$85k USDC</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {isApplyingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full p-6 space-y-4 border-purple-200 bg-white shadow-xl">
            <h3 className="font-headline text-lg font-bold text-slate-900">Submit Proposal</h3>
            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Proposal Statement & Milestones *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail your technical approach, timeframe, and deliverables..."
                  value={applyProposalText}
                  onChange={(e) => setApplyProposalText(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button type="submit" className="gradient-btn-primary px-5 py-2 rounded-xl text-xs font-bold">
                  Submit Proposal On-Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full p-6 space-y-4 border-rose-300 bg-white shadow-xl">
            <h3 className="font-headline text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="text-rose-600" /> Raise On-Chain Dispute
            </h3>
            <form onSubmit={handleRaiseDisputeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Dispute Category Reason *
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value as DisputeReason)}
                  className="w-full glass-input text-xs"
                >
                  <option value="QUALITY">QUALITY - Deliverable fails specifications</option>
                  <option value="NON_DELIVERY">NON_DELIVERY - Work not delivered on time</option>
                  <option value="SCOPE_DISAGREEMENT">SCOPE_DISAGREEMENT - Milestone ambiguity</option>
                  <option value="PAYMENT_DISPUTE">PAYMENT_DISPUTE - Budget payment claim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Dispute Claim & Evidence Summary *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain why the submitted work is non-compliant or disputed..."
                  value={disputeEvidenceText}
                  onChange={(e) => setDisputeEvidenceText(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold">
                  File Dispute Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
