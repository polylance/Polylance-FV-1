import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Job, DisputeReason, JudgeRecord } from '../types';
import { 
  Scale, UploadCloud, X, ShieldAlert, 
  ExternalLink, ArrowUpRight, ShieldCheck, CheckCircle2, Gavel
} from 'lucide-react';
import { generateIpfsCid } from '../utils/ipfs';
import { truncateAddress } from '../utils/formatters';

export interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
  jobs?: Job[];
  judge?: JudgeRecord | null;
  userAddress: string;
  onRaiseDispute: (
    reason: DisputeReason, 
    evidenceText: string, 
    ipfsCid: string,
    selectedJobId?: string,
    desiredResolution?: string
  ) => void;
}

export const RaiseDisputeModal: React.FC<RaiseDisputeModalProps> = ({
  isOpen,
  onClose,
  job,
  jobs = [],
  judge,
  userAddress,
  onRaiseDispute,
}) => {
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string>(() => {
    if (job) return job.id;
    if (jobs && jobs.length > 0) return jobs[0].id;
    return 'general';
  });

  const [reason, setReason] = useState<DisputeReason>('QUALITY');
  const [desiredResolution, setDesiredResolution] = useState<string>('Full 100% Refund to Client');
  const [evidenceText, setEvidenceText] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentSelectedJob = job || (selectedJobId !== 'general' ? jobs.find((j) => j.id === selectedJobId) : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceText.trim()) return;

    setIsSubmitting(true);
    const ipfsCid = generateIpfsCid({
      jobId: currentSelectedJob ? currentSelectedJob.id : 'general-escalation',
      contractAddress: currentSelectedJob?.contractAddress || '0x0000000000000000000000000000000000000000',
      raisedBy: userAddress,
      assignedJudge: judge?.address || '',
      reason,
      desiredResolution,
      evidenceText: evidenceText.trim(),
      fileName: fileName || 'Dispute-Evidence.txt',
      timestamp: Date.now(),
    });

    onRaiseDispute(
      reason, 
      evidenceText.trim(), 
      ipfsCid, 
      currentSelectedJob?.id,
      desiredResolution
    );
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-rose-200 rounded-3xl shadow-2xl overflow-hidden font-sans space-y-0 my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 via-rose-100/60 to-orange-50 p-5 sm:p-6 border-b border-rose-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase text-rose-800 bg-rose-200/70 border border-rose-300 px-2 py-0.5 rounded-full">
                  DAO Court Escalation
                </span>
                {judge && (
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} className="text-purple-600" />
                    Arbitrator: {judge.name}
                  </span>
                )}
                {currentSelectedJob && (
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    Escrow: ${parseFloat(currentSelectedJob.amountUsdc || '0').toLocaleString()} USDC
                  </span>
                )}
              </div>
              <h3 className="font-headline font-black text-lg sm:text-xl text-slate-900 mt-1">
                Raise Issue & Dispute Escalation
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Submit formal evidence to decentralized PolyLance Arbitrators for binding ruling.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/judge?tab=disputes');
              }}
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-white/80 hover:bg-white border border-rose-200 px-2.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              title="Navigate to DAO Disputes Court page"
            >
              <span>Court Page</span>
              <ArrowUpRight size={12} className="text-rose-600" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center border border-rose-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Warning Notice */}
          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950 leading-relaxed">
              <strong>Smart Contract Escrow Protection:</strong> Submitting this formal dispute freezes contested funds in the escrow vault and opens an active arbitration docket on the PolyLance Judge DAO Court.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Context: Job Selection or Details */}
            {job ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Target Job Escrow</span>
                  <p className="font-bold text-slate-900 truncate text-xs">{job.title}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: #{job.id.slice(0, 8)} • Contract: {truncateAddress(job.contractAddress)}
                  </p>
                </div>
                <Link
                  to={`/jobs/${job.id}`}
                  target="_blank"
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-purple-300 text-purple-700 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                >
                  View Job <ArrowUpRight size={11} />
                </Link>
              </div>
            ) : jobs.length > 0 ? (
              <div>
                <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">
                  Select Associated Job / Project Escrow *
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl p-2.5 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all text-xs"
                >
                  <option value="general">🌐 General Platform / Protocol Escalation (Non-Job Specific)</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      📁 {j.title} — ${parseFloat(j.amountUsdc || '0').toLocaleString()} USDC [{j.status}]
                    </option>
                  ))}
                </select>

                {currentSelectedJob && (
                  <div className="mt-2 bg-purple-50/60 border border-purple-100 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-purple-900 font-medium">
                      <strong>Escrow Locked:</strong> ${parseFloat(currentSelectedJob.amountUsdc || '0').toLocaleString()} USDC • Status: <strong>{currentSelectedJob.status}</strong>
                    </div>
                    <Link
                      to={`/jobs/${currentSelectedJob.id}`}
                      target="_blank"
                      className="text-[11px] font-bold text-purple-700 hover:underline flex items-center gap-0.5"
                    >
                      Inspect Specs <ExternalLink size={11} />
                    </Link>
                  </div>
                )}
              </div>
            ) : null}

            {/* Arbitrator Info Banner if chatting with a Judge */}
            {judge && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {judge.name ? judge.name.slice(0, 2).toUpperCase() : 'JD'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs leading-tight flex items-center gap-1.5">
                      {judge.name}
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full font-mono">
                        Active Arbitrator
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {truncateAddress(judge.address)} • {judge.specialty || 'DAO Court Judge'} • {judge.casesResolved ?? 0} Cases Resolved
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-700 bg-white/80 border border-purple-200 px-2 py-1 rounded-lg font-bold shrink-0">
                  Assigned Judge
                </span>
              </div>
            )}

            {/* Grid: Reason & Desired Resolution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Primary Issue Category */}
              <div>
                <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">
                  Primary Issue Category *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as DisputeReason)}
                  className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl p-2.5 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all text-xs"
                >
                  <option value="QUALITY">🎯 Quality Defect / Specification Mismatch</option>
                  <option value="NON_DELIVERY">📦 Non-Delivery / Missing Milestone Code</option>
                  <option value="SCOPE_DISAGREEMENT">📑 Scope or Requirement Disagreement</option>
                  <option value="PAYMENT_DISPUTE">💰 Payment Terms or Milestone Pricing Conflict</option>
                  <option value="OTHER">⚖️ Other Contractual Breach / Arbitrator Advice</option>
                </select>
              </div>

              {/* Desired Resolution */}
              <div>
                <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">
                  Desired Settlement Outcome *
                </label>
                <select
                  value={desiredResolution}
                  onChange={(e) => setDesiredResolution(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl p-2.5 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all text-xs"
                >
                  <option value="Full 100% Refund to Client">Full 100% Refund to Client</option>
                  <option value="50/50 Compromise Split">50/50 Compromise Split</option>
                  <option value="Release Escrow to Freelancer">Release Escrow to Freelancer</option>
                  <option value="Arbitrator Mediation & Binding Ruling">Arbitrator Mediation & Binding Ruling</option>
                </select>
              </div>
            </div>

            {/* Case Statement */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Detailed Case Statement & Explanation *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {evidenceText.length} characters
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Explain in detail the exact issue, contractual obligations, deliverables provided or missing, and justification for your desired resolution..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all placeholder:text-slate-400 resize-none text-xs leading-relaxed"
              />
            </div>

            {/* Evidence Attachment */}
            <div>
              <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">
                Supporting Evidence Attachment (Logs / Screenshots / Diff)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/60 transition-all">
                <input
                  type="file"
                  id="dispute-file-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setFileName(file.name);
                      setFileSize(file.size);
                    }
                  }}
                />
                <label
                  htmlFor="dispute-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-600"
                >
                  <UploadCloud size={22} className="text-purple-600" />
                  <span className="font-bold text-xs text-slate-800">
                    {fileName ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={13} /> {fileName} {fileSize ? `(${(fileSize / 1024).toFixed(1)} KB)` : ''}
                      </span>
                    ) : (
                      'Click to upload supporting logs, images, or archive'
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Supports PNG, JPG, PDF, ZIP, TXT, LOG (automatically anchored to IPFS)
                  </span>
                </label>
              </div>
            </div>

            {/* Quick Link to Dedicated Court / DAO Page */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-amber-900">
              <span className="flex items-center gap-1.5">
                <Gavel size={13} className="text-amber-700 shrink-0" />
                Want to review all open disputes or arbitrator rulings?
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/judge?tab=disputes');
                }}
                className="font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-0.5 cursor-pointer"
              >
                Go to DAO Court <ArrowUpRight size={11} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/judge?tab=disputes');
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer text-xs flex items-center gap-1"
              >
                <Gavel size={12} className="text-slate-500" />
                <span>Court Dashboard</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !evidenceText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-xs disabled:opacity-50"
                >
                  <Scale size={14} />
                  <span>{isSubmitting ? 'Submitting Case...' : 'Submit Case to DAO Court'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
