import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job, DisputeReason, JudgeRecord } from '../types';
import { 
  Scale, UploadCloud, ShieldAlert, 
  ExternalLink, ArrowUpRight, ShieldCheck, CheckCircle2, Gavel
} from 'lucide-react';
import { generateIpfsCid } from '../utils/ipfs';
import { truncateAddress } from '../utils/formatters';
import { scrollToSection } from '../utils/scroll';
import { PolyLanceSelect, SelectOption } from './PolyLanceSelect';
import { useWeb3 } from '../context/Web3Context';
import { Modal } from './overlay';
import { Button } from './common/Button';

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
  const { currentRole } = useWeb3();
  const isJudgeOrAdmin = currentRole === 'judge' || currentRole === 'admin';
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

  const jobOptions = useMemo<SelectOption<string>[]>(() => {
    const list: SelectOption<string>[] = [
      {
        value: 'general',
        label: 'General Platform / Protocol Escalation',
        sublabel: 'Non-Job Specific',
      },
    ];
    jobs.forEach((j) => {
      list.push({
        value: j.id,
        label: j.title,
        sublabel: `$${parseFloat(j.amountUsdc || '0').toLocaleString()} USDC [${j.status}]`,
        badge: j.status,
      });
    });
    return list;
  }, [jobs]);

  const reasonOptions: SelectOption<DisputeReason>[] = [
    { value: 'QUALITY', label: 'Quality Defect / Specification Mismatch', sublabel: 'Deliverable fails specs' },
    { value: 'NON_DELIVERY', label: 'Non-Delivery / Missing Milestone Code', sublabel: 'Work not delivered on time' },
    { value: 'SCOPE_DISAGREEMENT', label: 'Scope or Requirement Disagreement', sublabel: 'Milestone ambiguity' },
    { value: 'PAYMENT_DISPUTE', label: 'Payment Terms or Milestone Pricing Conflict', sublabel: 'Payment calculation dispute' },
    { value: 'OTHER', label: 'Other Contractual Breach / Arbitrator Advice', sublabel: 'Binding ruling required' },
  ];

  const resolutionOptions: SelectOption<string>[] = [
    { value: 'Full 100% Refund to Client', label: 'Full 100% Refund to Client', sublabel: 'Return locked escrow' },
    { value: '50/50 Compromise Split', label: '50/50 Compromise Split', sublabel: 'Equal settlement distribution' },
    { value: 'Release Escrow to Freelancer', label: 'Release Escrow to Freelancer', sublabel: 'Complete payment release' },
    { value: 'Arbitrator Mediation & Binding Ruling', label: 'Arbitrator Mediation & Binding Ruling', sublabel: 'DAO Judge discretion' },
  ];

  const currentSelectedJob = job || (selectedJobId !== 'general' ? jobs.find((j) => j.id === selectedJobId) : null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Raise Issue & Dispute Escalation"
      subtitle="Submit formal evidence to decentralized PolyLance Arbitrators for binding ruling."
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          {isJudgeOrAdmin ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/judge?tab=disputes');
              }}
            >
              <Gavel size={14} />
              <span>Judge Panel</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/dao');
              }}
            >
              <Scale size={14} />
              <span>DAO Overview</span>
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isSubmitting || !evidenceText.trim()}
              onClick={() => handleSubmit()}
            >
              <Scale size={15} />
              <span>{isSubmitting ? 'Submitting Case...' : 'Submit Case to DAO Court'}</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Warning Notice */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
          <ShieldAlert size={18} className="text-[#0047AB] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800 leading-relaxed">
            <strong className="text-[#0B0B0F]">Smart Contract Escrow Protection:</strong> Submitting this formal dispute freezes contested funds in the escrow vault and opens an active arbitration docket on the PolyLance Judge DAO Court.
          </div>
        </div>

        {/* Context: Job Selection or Details */}
        {job ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider block">Target Job Escrow</span>
              <p className="font-semibold text-slate-900 truncate text-xs">{job.title}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                ID: #{job.id.slice(0, 8)} • Contract: {truncateAddress(job.contractAddress)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/jobs/${job.id}?section=job-specs`);
                scrollToSection('job-specs');
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-slate-900 font-medium text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              View Job <ArrowUpRight size={11} />
            </button>
          </div>
        ) : jobs.length > 0 ? (
          <div>
            <label className="block font-medium text-slate-700 text-xs mb-1.5">
              Select Associated Job / Project Escrow *
            </label>
            <PolyLanceSelect
              value={selectedJobId}
              onChange={(val) => setSelectedJobId(val)}
              options={jobOptions}
              variant="standard"
              className="w-full"
            />

            {currentSelectedJob && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-900 font-medium">
                  <strong>Escrow Locked:</strong> ${parseFloat(currentSelectedJob.amountUsdc || '0').toLocaleString()} USDC • Status: <strong>{currentSelectedJob.status}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/jobs/${currentSelectedJob.id}?section=job-specs`);
                    scrollToSection('job-specs');
                  }}
                  className="text-[11px] font-semibold text-[#0047AB] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Inspect Specs <ExternalLink size={11} />
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Arbitrator Info Banner */}
        {judge && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0B0B0F] border border-slate-800 text-white font-semibold flex items-center justify-center text-xs shrink-0">
                {judge.name ? judge.name.slice(0, 2).toUpperCase() : 'JD'}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-xs leading-tight flex items-center gap-1.5">
                  {judge.name}
                  <span className="text-[10px] bg-slate-200 text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded font-mono">
                    Active Arbitrator
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  {truncateAddress(judge.address)} • {judge.specialty || 'DAO Court Judge'} • {judge.casesResolved ?? 0} Cases Resolved
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-md font-medium shrink-0">
              Assigned Judge
            </span>
          </div>
        )}

        {/* Reason & Desired Resolution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-medium text-slate-700 text-xs mb-1.5">
              Primary Issue Category *
            </label>
            <PolyLanceSelect
              value={reason}
              onChange={(val) => setReason(val as DisputeReason)}
              options={reasonOptions}
              variant="standard"
              className="w-full"
              menuClassName="min-w-full sm:min-w-[360px]"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 text-xs mb-1.5">
              Desired Settlement Outcome *
            </label>
            <PolyLanceSelect
              value={desiredResolution}
              onChange={(val) => setDesiredResolution(val)}
              options={resolutionOptions}
              variant="standard"
              className="w-full"
              menuClassName="min-w-full sm:min-w-[360px]"
            />
          </div>
        </div>

        {/* Case Statement */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-medium text-slate-700 text-xs">
              Detailed Case Statement & Explanation *
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {evidenceText.length} characters
            </span>
          </div>
          <textarea
            required
            rows={4}
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder="Explain in detail the exact issue, contractual obligations, deliverables provided or missing, and justification for your desired resolution..."
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-3 outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all placeholder:text-slate-400 resize-none text-xs leading-relaxed"
          />
        </div>

        {/* Evidence Attachment */}
        <div>
          <label className="block font-medium text-slate-700 text-xs mb-1.5">
            Supporting Evidence Attachment (Logs / Screenshots / Diff)
          </label>
          <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-all">
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
              <UploadCloud size={20} className="text-[#0047AB]" />
              <span className="font-medium text-xs text-slate-800">
                {fileName ? (
                  <span className="text-[#0047AB] flex items-center gap-1">
                    <CheckCircle2 size={13} /> {fileName} {fileSize ? `(${(fileSize / 1024).toFixed(1)} KB)` : ''}
                  </span>
                ) : (
                  'Click to upload supporting logs, images, or archive'
                )}
              </span>
              <span className="text-[11px] text-slate-400">
                Supports PNG, JPG, PDF, ZIP, TXT, LOG (automatically anchored to IPFS)
              </span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};
