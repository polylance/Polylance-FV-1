import React, { useState } from 'react';
import { Job, DisputeReason } from '../types';
import { useWeb3 } from '../context/Web3Context';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { ProofOfWorkUploader } from './ProofOfWorkUploader';
import { getIpfsGatewayUrl, generateIpfsCid } from '../utils/ipfs';
import { truncateAddress } from '../utils/formatters';
import { 
  Sparkles, CheckCircle2, Clock, AlertTriangle, FileText, ExternalLink, 
  Send, ShieldCheck, Scale, RefreshCw, Layers, TrendingUp, MessageSquare, 
  ChevronRight, Calendar, UserCheck, Wallet, Eye, XCircle, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { ActionStatusModal, ActionModalDetail } from './ActionStatusModal';

interface DeliverableWorkSubmissionPanelProps {
  job: Job;
}

export const DeliverableWorkSubmissionPanel: React.FC<DeliverableWorkSubmissionPanelProps> = ({ job }) => {
  const { currentRole, address, isConnected } = useWeb3();
  const { 
    submitWork, 
    postProgressUpdate, 
    requestTimeExtension, 
    respondToTimeExtension, 
    requestModifications, 
    releasePayment, 
    raiseDispute 
  } = usePolyLanceData();

  const isClient = isConnected && address && address.toLowerCase() === job.client.toLowerCase();
  const isFreelancer = isConnected && address && job.freelancer && address.toLowerCase() === job.freelancer.toLowerCase();

  // In-App Action Status Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    icon?: 'success' | 'progress' | 'extension' | 'modification' | 'dispute' | 'payment' | 'terms';
    badgeText?: string;
    details?: ActionModalDetail[];
  }>({
    isOpen: false,
    title: '',
  });

  // Active Tab for Freelancer Work Management
  const [freelancerTab, setFreelancerTab] = useState<'submit' | 'status' | 'extension'>('submit');

  // State for Progress Update
  const [progressPercent, setProgressPercent] = useState<number>(75);
  const [statusNote, setStatusNote] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  // State for Time Extension Request
  const [extensionDays, setExtensionDays] = useState<number>(3);
  const [extensionReason, setExtensionReason] = useState('');

  // State for Client Modification Request Modal / Form
  const [isModifyingOpen, setIsModifyingOpen] = useState(false);
  const [modificationNote, setModificationNote] = useState('');

  // State for Client Dispute / Meet Judge Modal
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<DisputeReason>('QUALITY');
  const [disputeEvidence, setDisputeEvidence] = useState('');

  // Extension Response Note
  const [extensionResponseNote, setExtensionResponseNote] = useState('');

  const handleWorkSubmit = (
    title: string,
    description: string,
    evidenceHashes: string[],
    externalLink?: string
  ) => {
    submitWork(job.id, title, description, evidenceHashes, externalLink);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    setActionModal({
      isOpen: true,
      title: 'Deliverables & Proof of Work Submitted',
      subtitle: 'Your deliverables and IPFS proof files have been securely submitted to the client for milestone approval.',
      icon: 'success',
      badgeText: 'PROOF OF WORK LOCKED',
      details: [
        { label: 'Deliverable Title', value: title },
        { label: 'Review Period SLA', value: `${job.reviewPeriodDays || 7} Days`, isBadge: true },
        { label: 'IPFS Artifacts', value: `${evidenceHashes.length} File(s) Attached`, isMono: true },
        ...(externalLink ? [{ label: 'Deliverable Link', value: externalLink, isMono: true }] : []),
      ],
    });
  };

  const handlePostStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusNote.trim()) return;
    postProgressUpdate(job.id, progressPercent, statusNote, demoUrl);
    setActionModal({
      isOpen: true,
      title: 'Project Status Update Published',
      subtitle: 'Your live milestone update has been recorded on-chain and broadcasted to the client.',
      icon: 'progress',
      badgeText: 'MILESTONE PROGRESS',
      details: [
        { label: 'Completion', value: `${progressPercent}%`, isBadge: true },
        { label: 'Status Note', value: statusNote },
        ...(demoUrl ? [{ label: 'Live Demo URL', value: demoUrl, isMono: true }] : []),
        { label: 'Contract', value: truncateAddress(job.contractAddress), isMono: true },
      ],
    });
    setStatusNote('');
    setDemoUrl('');
  };

  const handleRequestExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionReason.trim()) return;
    requestTimeExtension(job.id, extensionDays, extensionReason);
    setActionModal({
      isOpen: true,
      title: 'Time Extension Requested',
      subtitle: `A formal request for +${extensionDays} days has been submitted to the client for SLA review window adjustment.`,
      icon: 'extension',
      badgeText: 'TIMELINE SLA REQUEST',
      details: [
        { label: 'Extension Requested', value: `+${extensionDays} Days`, isBadge: true },
        { label: 'Reason', value: extensionReason },
        { label: 'Contract', value: truncateAddress(job.contractAddress), isMono: true },
      ],
    });
    setExtensionReason('');
  };

  const handleApproveWork = () => {
    releasePayment(job.id);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    setActionModal({
      isOpen: true,
      title: 'Payment Released & SBT Minted',
      subtitle: 'Escrow funds have been transferred directly to the freelancer, and an on-chain reputation SBT has been minted.',
      icon: 'payment',
      badgeText: 'TRANSACTION SETTLED',
      details: [
        { label: 'Amount Released', value: `$${job.amountUsdc} USDC`, isBadge: true },
        { label: 'Freelancer', value: truncateAddress(job.freelancer || ''), isMono: true },
        { label: 'Contract', value: truncateAddress(job.contractAddress), isMono: true },
      ],
    });
  };

  const handleSendModification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modificationNote.trim()) return;
    requestModifications(job.id, modificationNote);
    setActionModal({
      isOpen: true,
      title: 'Revision Request Sent',
      subtitle: 'Your modification feedback has been forwarded to the freelancer.',
      icon: 'modification',
      badgeText: 'REVISION REQUIRED',
      details: [
        { label: 'Feedback Notes', value: modificationNote },
        { label: 'Contract', value: truncateAddress(job.contractAddress), isMono: true },
      ],
    });
    setModificationNote('');
    setIsModifyingOpen(false);
  };

  const handleEscalateToJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeEvidence.trim()) return;
    const cid = generateIpfsCid({ disputeEvidence, timestamp: Date.now() });
    raiseDispute(job.id, disputeReason, disputeEvidence, cid, address);
    setIsDisputeOpen(false);
    setDisputeEvidence('');
    setActionModal({
      isOpen: true,
      title: 'Escrow Case Escalated to DAO Judges',
      subtitle: 'Your evidence and case details have been registered on-chain for decentralized arbitration.',
      icon: 'dispute',
      badgeText: 'DISPUTE SUBMITTED',
      details: [
        { label: 'Dispute Reason', value: disputeReason, isBadge: true },
        { label: 'IPFS Evidence CID', value: cid, isMono: true },
        { label: 'Contract Address', value: truncateAddress(job.contractAddress), isMono: true },
      ],
    });
  };

  return (
    <div className="glass-panel p-6 sm:p-8 border-purple-200 bg-white hard-shadow space-y-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
            <Layers className="text-purple-700" />
            Project Submission & Deliverable Verification Workspace
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            On-chain milestone submission, revision requests, extension management, and escrow payout release.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Escrow Status:</span>
          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
            job.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
            job.status === 'Submitted' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
            job.status === 'Disputed' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
            'bg-purple-100 text-purple-800 border border-purple-300'
          }`}>
            {job.status}
          </span>
        </div>
      </div>

      {/* FREELANCER ROLE WORKSPACE */}
      {(currentRole === 'freelancer' || isFreelancer) && job.status !== 'Completed' && job.status !== 'Cancelled' && (
        <div className="space-y-6">
          {/* Action Tabs for Freelancer */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 font-sans">
            <button
              onClick={() => setFreelancerTab('submit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                freelancerTab === 'submit'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles size={14} />
              Submit Product Deliverables
            </button>

            <button
              onClick={() => setFreelancerTab('status')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                freelancerTab === 'status'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TrendingUp size={14} />
              Update Project Status
            </button>

            <button
              onClick={() => setFreelancerTab('extension')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                freelancerTab === 'extension'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock size={14} />
              Request Time Extension
            </button>
          </div>

          {/* TAB 1: Submit Work Deliverables */}
          {freelancerTab === 'submit' && (
            <div className="space-y-4">
              {job.proof ? (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Work Already Submitted (Awaiting Client Approval)
                    </span>
                    <span className="text-purple-700 font-mono text-[11px]">
                      {new Date(job.proof.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-purple-800 font-medium">{job.proof.description}</p>
                  <p className="text-[11px] text-purple-900 font-mono">
                    You can resubmit updated deliverables below if requested by the client.
                  </p>
                </div>
              ) : null}

              <ProofOfWorkUploader onSubmit={handleWorkSubmit} />
            </div>
          )}

          {/* TAB 2: Post Status Update */}
          {freelancerTab === 'status' && (
            <form onSubmit={handlePostStatus} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-purple-700" />
                  Post Live Project Status Update
                </h3>
                <span className="text-slate-500 font-mono text-[11px]">Visible to Client & Arbitrators</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                  Completion Percentage ({progressPercent}%)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[25, 50, 75, 90, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setProgressPercent(pct)}
                      className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                        progressPercent === pct
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                  Status Note / Progress Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Completed ZK-Snark circuit compilation. Integrated Polygon Amoy testnet verifier contract..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full glass-input resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                  Live Staging / Demo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://polylance-staging.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full glass-input"
                />
              </div>

              <button
                type="submit"
                className="gradient-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send size={14} />
                Post Progress Update
              </button>
            </form>
          )}

          {/* TAB 3: Request Time Extension */}
          {freelancerTab === 'extension' && (
            <form onSubmit={handleRequestExtension} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Clock size={16} className="text-purple-700" />
                  Request Review / Milestone Time Extension
                </h3>
                <span className="text-slate-500 font-mono text-[11px]">Subject to Client Approval</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                  Select Additional Days Requested
                </label>
                <div className="flex items-center gap-2">
                  {[1, 3, 5, 7, 14].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExtensionDays(days)}
                      className={`px-3.5 py-1.5 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                        extensionDays === days
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                  Extension Rationale / Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why additional time is required (e.g., additional security audit checks or testnet deployment updates)..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  className="w-full glass-input resize-none"
                />
              </div>

              <button
                type="submit"
                className="gradient-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Clock size={14} />
                Send Time Extension Request
              </button>
            </form>
          )}
        </div>
      )}

      {/* CLIENT ROLE WORK INSPECTION & ACTION HUB */}
      {(currentRole === 'client' || isClient) && (
        <div className="space-y-6">
          {/* Submitted Deliverables Card */}
          {job.proof ? (
            <div className="p-6 rounded-2xl border border-purple-200 bg-purple-50/60 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/80 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-purple-900 bg-purple-200/80 px-2.5 py-0.5 rounded-full">
                    Deliverable Submitted
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 font-heading mt-1">
                    {job.proof.title}
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-900 font-bold">
                  Submitted: {new Date(job.proof.submittedAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {job.proof.description}
              </p>

              {/* IPFS Hashes & External Links */}
              <div className="space-y-2 pt-2 border-t border-purple-200/60 font-mono text-xs">
                <span className="font-bold text-purple-900 block text-[11px] uppercase">
                  Verified IPFS Evidence & Artifacts:
                </span>
                {job.proof.evidenceHashes.map((cid, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/90 p-2 rounded-lg border border-purple-200">
                    <FileText size={14} className="text-purple-700 shrink-0" />
                    <span className="text-slate-600 truncate">{cid}</span>
                    <a
                      href={getIpfsGatewayUrl(cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-purple-700 hover:text-purple-900 font-bold underline shrink-0 flex items-center gap-1"
                    >
                      View on IPFS <ExternalLink size={12} />
                    </a>
                  </div>
                ))}

                {job.proof.externalLink && (
                  <div className="flex items-center gap-2 bg-white/90 p-2 rounded-lg border border-purple-200">
                    <ExternalLink size={14} className="text-indigo-700 shrink-0" />
                    <span className="text-slate-600 truncate">{job.proof.externalLink}</span>
                    <a
                      href={job.proof.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-indigo-700 hover:text-indigo-900 font-bold underline shrink-0"
                    >
                      Open Repository / Staging
                    </a>
                  </div>
                )}
              </div>

              {/* CLIENT DECISION & PAYMENT RELEASE CONTROL PANEL */}
              {job.status !== 'Completed' && job.status !== 'Disputed' && (
                <div className="pt-4 border-t border-purple-200 space-y-3">
                  <span className="font-bold text-xs text-slate-900 block uppercase tracking-wider">
                    Client Action & Escrow Payout Approval:
                  </span>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* 1. APPROVE & RELEASE FUNDS */}
                    <button
                      onClick={handleApproveWork}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105"
                    >
                      <CheckCircle2 size={16} />
                      Approve Work & Release Funds ({job.amountUsdc} USDC)
                    </button>

                    {/* 2. REQUEST MODIFICATIONS */}
                    <button
                      onClick={() => setIsModifyingOpen(!isModifyingOpen)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-amber-300 cursor-pointer transition-all"
                    >
                      <RefreshCw size={14} />
                      Request Modifications / Fixes
                    </button>

                    {/* 3. MEET JUDGE / RAISE DISPUTE */}
                    <button
                      onClick={() => setIsDisputeOpen(!isDisputeOpen)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-rose-300 cursor-pointer transition-all"
                    >
                      <Scale size={14} />
                      Meet Judge (Raise Dispute)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-3">
              <Clock size={32} className="text-purple-600 mx-auto" />
              <h3 className="font-extrabold text-sm text-slate-900">Awaiting Freelancer Deliverables</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The hired freelancer is currently working on the project. Once deliverables are uploaded to IPFS, you can inspect the files and approve payout.
              </p>
            </div>
          )}

          {/* CLIENT MODIFICATION REQUEST FORM */}
          {isModifyingOpen && (
            <form onSubmit={handleSendModification} className="p-5 rounded-2xl border border-amber-300 bg-amber-50 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <RefreshCw size={15} /> Request Modifications / Revisions from Freelancer
                </h4>
                <button
                  type="button"
                  onClick={() => setIsModifyingOpen(false)}
                  className="text-amber-700 hover:text-amber-950 underline text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  Describe Required Changes / Feedback *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Please optimize smart contract gas usage by 15% and include additional unit tests for edge cases..."
                  value={modificationNote}
                  onChange={(e) => setModificationNote(e.target.value)}
                  className="w-full glass-input resize-none bg-white border-amber-300 focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={14} /> Send Revision Request
              </button>
            </form>
          )}

          {/* CLIENT DISPUTE / MEET JUDGE FORM */}
          {isDisputeOpen && (
            <form onSubmit={handleEscalateToJudge} className="p-5 rounded-2xl border border-rose-300 bg-rose-50 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                <h4 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                  <Scale size={15} /> Meet Judge & Escalate to DAO Arbitration
                </h4>
                <button
                  type="button"
                  onClick={() => setIsDisputeOpen(false)}
                  className="text-rose-700 hover:text-rose-950 underline text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block font-bold text-rose-900 mb-1">Dispute Reason *</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value as DisputeReason)}
                  className="w-full glass-input bg-white border-rose-300 text-slate-900 font-bold"
                >
                  <option value="QUALITY">Quality Defect / Spec Mismatch</option>
                  <option value="NON_DELIVERY">Non-Delivery / Missing Code</option>
                  <option value="SCOPE_DISAGREEMENT">Scope Disagreement</option>
                  <option value="PAYMENT_DISPUTE">Payment Terms Dispute</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-rose-900 mb-1">Evidence & Case Statement *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide clear evidence, test output, or specification links for the DAO Arbitrators to review..."
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  className="w-full glass-input resize-none bg-white border-rose-300 focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Scale size={14} /> Submit Case to DAO Judge Panel
              </button>
            </form>
          )}
        </div>
      )}

      {/* PENDING / PAST TIME EXTENSION REQUESTS PANEL (MATCHING IMAGE 2 DESIGN) */}
      {(job.extensionRequests || []).length > 0 && (
        <div className="glass-panel p-6 sm:p-7 border-purple-200 bg-white hard-shadow space-y-5">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                <Clock size={20} className="text-purple-700" />
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-slate-900 leading-tight">
                  Pending / Past Time Extension Requests
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Review and take action on time extension requests
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/80 font-mono">
              {job.extensionRequests!.length} Request{job.extensionRequests!.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Request Cards */}
          <div className="space-y-4 pt-1">
            {job.extensionRequests!.map((req) => {
              const isPending = req.status === 'Pending';
              const isApproved = req.status === 'Approved';
              const isRejected = req.status === 'Rejected';

              return (
                <div
                  key={req.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs transition-all hover:border-purple-200"
                >
                  <div className="grid grid-cols-12 gap-6 items-center">
                    {/* Left Column: Clock Icon + Details + Metadata */}
                    <div className="col-span-12 lg:col-span-7 flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Clock size={20} className="text-amber-600" />
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-bold text-slate-900 text-sm">
                            Requested: +{req.requestedDays} Additional Days
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5 font-mono ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500'
                              } inline-block`}
                            />
                            {req.status}
                          </span>
                        </div>

                        <p className="text-slate-600 text-sm italic font-sans py-1">
                          "{req.reason}"
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1.5">
                            <UserCheck size={13} className="text-purple-600" />
                            Requested by <span className="text-purple-700 font-bold">{isClient ? 'Freelancer' : 'Freelancer'}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            Requested on{' '}
                            {new Date(req.requestedAt || Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            •{' '}
                            {new Date(req.requestedAt || Date.now()).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Actions / Approval Feedback */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col justify-center pl-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0">
                      {isPending ? (
                        isClient ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                respondToTimeExtension(job.id, req.id, true, 'Approved by Client');
                                setActionModal({
                                  isOpen: true,
                                  title: 'Time Extension Approved',
                                  subtitle: `The review period deadline for this escrow has been extended by +${req.requestedDays} day${req.requestedDays > 1 ? 's' : ''}.`,
                                  icon: 'extension',
                                  badgeText: 'SLA EXTENDED',
                                  details: [
                                    { 
                                      label: 'ADDED DAYS', 
                                      value: `+${req.requestedDays} Day${req.requestedDays > 1 ? 's' : ''}`, 
                                      dateBadge: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                                    },
                                    { label: 'JOB', value: job.title },
                                    { 
                                      label: 'CONTRACT', 
                                      value: truncateAddress(job.contractAddress), 
                                      isMono: true, 
                                      explorerUrl: `https://polygonscan.com/address/${job.contractAddress}` 
                                    },
                                  ],
                                });
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <CheckCircle2 size={15} /> Approve (+{req.requestedDays} Days)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                respondToTimeExtension(job.id, req.id, false, 'Rejected by Client');
                                setActionModal({
                                  isOpen: true,
                                  title: 'Time Extension Rejected',
                                  subtitle: 'The time extension request was declined. The existing SLA deadline remains active.',
                                  icon: 'modification',
                                  badgeText: 'REQUEST DECLINED',
                                  details: [
                                    { label: 'Requested Days', value: `+${req.requestedDays} Days` },
                                    { label: 'Decision', value: 'Declined by Client', isBadge: true },
                                  ],
                                });
                              }}
                              className="w-full bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs transition-all cursor-pointer mt-2"
                            >
                              <XCircle size={15} /> Reject
                            </button>

                            <div className="text-[11px] text-purple-900 bg-purple-50/80 px-3 py-1.5 rounded-lg border border-purple-100/80 flex items-center gap-1.5 mt-2">
                              <Info size={13} className="text-purple-600 shrink-0" />
                              <span>Approval will extend the deadline by {req.requestedDays} day{req.requestedDays > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 font-medium text-center space-y-1">
                            <div className="font-bold flex items-center justify-center gap-1.5">
                              <Clock size={14} className="text-amber-700" /> Awaiting Client Review
                            </div>
                            <p className="text-[11px] text-amber-800">
                              The client has been notified to review your +{req.requestedDays} day extension request.
                            </p>
                          </div>
                        )
                      ) : isApproved ? (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center gap-2 font-mono">
                          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                          <span>Approved (+{req.requestedDays} Days Added to SLA)</span>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-bold flex items-center gap-2 font-mono">
                          <XCircle size={16} className="text-rose-700 shrink-0" />
                          <span>Request Declined</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEWER PERCEPTION: SUMMARY & PERCEPTION PROMPTS */}
      {currentRole === 'visitor' && (
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Eye size={16} className="text-purple-700" />
              Public Deliverables & Status Overview (Viewer Mode)
            </h3>
            <span className="bg-slate-200 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
              Read-Only Perception
            </span>
          </div>

          {job.proof ? (
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900">{job.proof.title}</h4>
              <p className="text-slate-600">{job.proof.description}</p>
              <div className="pt-2 flex flex-wrap gap-2">
                {job.proof.evidenceHashes.map((cid, i) => (
                  <a
                    key={i}
                    href={getIpfsGatewayUrl(cid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 hover:underline font-mono text-[11px] flex items-center gap-1 bg-purple-50 px-2 py-1 rounded border border-purple-200"
                  >
                    <FileText size={12} /> IPFS Proof #{i + 1}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 italic">No deliverable uploaded yet for this escrow job.</p>
          )}
        </div>
      )}

      {/* SHARED PROGRESS UPDATES HISTORY LOG */}
      {(job.progressUpdates || []).length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 font-heading">
            <TrendingUp size={16} className="text-purple-700" />
            Project Progress Updates Log
          </h3>

          <div className="space-y-2.5">
            {job.progressUpdates!.map((upd) => (
              <div key={upd.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-700 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">
                      {upd.progressPercent}% Completed
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(upd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{upd.statusNote}</p>
                </div>

                {upd.demoUrl && (
                  <a
                    href={upd.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 hover:text-purple-900 font-bold underline flex items-center gap-1 shrink-0 font-mono text-[11px]"
                  >
                    Live Demo <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
};
