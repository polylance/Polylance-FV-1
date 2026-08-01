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
  ChevronRight, Calendar, UserCheck, Wallet, Eye, XCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  };

  const handlePostStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusNote.trim()) return;
    postProgressUpdate(job.id, progressPercent, statusNote, demoUrl);
    setStatusNote('');
    setDemoUrl('');
    alert('Project status update posted successfully!');
  };

  const handleRequestExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionReason.trim()) return;
    requestTimeExtension(job.id, extensionDays, extensionReason);
    setExtensionReason('');
    alert(`Time extension request (+${extensionDays} Days) sent to client!`);
  };

  const handleApproveWork = () => {
    releasePayment(job.id);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  };

  const handleSendModification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modificationNote.trim()) return;
    requestModifications(job.id, modificationNote);
    setModificationNote('');
    setIsModifyingOpen(false);
    alert('Modification request sent to freelancer!');
  };

  const handleEscalateToJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeEvidence.trim()) return;
    const cid = generateIpfsCid({ disputeEvidence, timestamp: Date.now() });
    raiseDispute(job.id, disputeReason, disputeEvidence, cid, address);
    setIsDisputeOpen(false);
    setDisputeEvidence('');
    alert('Dispute raised! The case is now listed in the DAO Judge Panel.');
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

          {/* TIME EXTENSION REQUESTS REVIEW PANEL FOR CLIENT */}
          {(job.extensionRequests || []).length > 0 && (
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={15} className="text-purple-700" /> Pending / Past Time Extension Requests
              </h4>

              <div className="space-y-2">
                {job.extensionRequests!.map((req) => (
                  <div key={req.id} className="p-3 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Requested: +{req.requestedDays} Additional Days</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          req.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 italic">"{req.reason}"</p>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => respondToTimeExtension(job.id, req.id, true, 'Approved by Client')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 size={13} /> Approve (+{req.requestedDays} Days)
                        </button>
                        <button
                          onClick={() => respondToTimeExtension(job.id, req.id, false, 'Rejected by Client')}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3 py-1.5 rounded-lg text-xs border border-rose-300 cursor-pointer"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
    </div>
  );
};
