import React, { useState } from 'react';
import { Job, DisputeReason } from '../types';
import { Scale, AlertTriangle, FileText, UploadCloud, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { generateIpfsCid } from '../utils/ipfs';

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  userAddress: string;
  onRaiseDispute: (reason: DisputeReason, evidenceText: string, ipfsCid: string) => void;
}

export const RaiseDisputeModal: React.FC<RaiseDisputeModalProps> = ({
  isOpen,
  onClose,
  job,
  userAddress,
  onRaiseDispute,
}) => {
  const [reason, setReason] = useState<DisputeReason>('QUALITY');
  const [evidenceText, setEvidenceText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceText.trim()) return;

    setIsSubmitting(true);
    const ipfsCid = generateIpfsCid({
      jobId: job.id,
      contractAddress: job.contractAddress,
      raisedBy: userAddress,
      reason,
      evidenceText: evidenceText.trim(),
      fileName: fileName || 'Dispute-Evidence.txt',
      timestamp: Date.now(),
    });

    onRaiseDispute(reason, evidenceText.trim(), ipfsCid);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-rose-200 rounded-3xl shadow-2xl overflow-hidden font-sans space-y-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 via-rose-100/50 to-orange-50 p-5 sm:p-6 border-b border-rose-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-rose-800 bg-rose-200/70 border border-rose-300 px-2 py-0.5 rounded-full">
                  DAO Court Escalation
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Escrow Locked: ${parseFloat(job.amountUsdc || '0').toLocaleString()} USDC
                </span>
              </div>
              <h3 className="font-headline font-black text-lg sm:text-xl text-slate-900 mt-1">
                File Case to DAO Arbitrator Panel
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning Notice */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950 leading-relaxed">
              <strong>Smart Contract Escrow Freezing:</strong> Raising a formal dispute will lock the funds in the escrow contract and assign the case to the decentralized PolyLance Judge DAO panel for review and split ruling.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Dispute Reason */}
            <div>
              <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">
                Primary Issue Category *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as DisputeReason)}
                className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-900 rounded-xl p-2.5 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all text-xs"
              >
                <option value="QUALITY">Quality Defect / Specification Mismatch</option>
                <option value="NON_DELIVERY">Non-Delivery / Missing Milestone Code</option>
                <option value="SCOPE_DISAGREEMENT">Scope or Requirement Disagreement</option>
                <option value="PAYMENT_DISPUTE">Payment Terms or Milestone Pricing Conflict</option>
                <option value="OTHER">Other Contractual Breach</option>
              </select>
            </div>

            {/* Case Statement */}
            <div>
              <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">
                Detailed Case Statement & Explanation *
              </label>
              <textarea
                required
                rows={4}
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Explain in detail the issue, what was agreed, what was delivered or missing, and your proposed resolution..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all placeholder:text-slate-400 resize-none text-xs leading-relaxed"
              />
            </div>

            {/* Optional Evidence Attachment */}
            <div>
              <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">
                Evidence Attachment (Logs / Screenshots)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/60 transition-all">
                <input
                  type="file"
                  id="dispute-file-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                />
                <label
                  htmlFor="dispute-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-600"
                >
                  <UploadCloud size={20} className="text-purple-600" />
                  <span className="font-bold text-xs text-slate-800">
                    {fileName ? `Attached: ${fileName}` : 'Click to select supporting evidence file'}
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, PNG, JPG, ZIP or TXT log files</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
                <span>Submit Case File to Judges</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
