import React, { useState } from 'react';
import { AlertCircle, HelpCircle, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal } from './overlay/Modal';
import { Button } from './common/Button';
import { PlatformFeeDue, usePlatformFeeDues } from '../hooks/usePlatformFeeDues';

interface PlatformFeeProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: PlatformFeeDue | null;
  jobTitle?: string;
  onSuccess?: () => void;
}

export const PlatformFeeProblemModal: React.FC<PlatformFeeProblemModalProps> = ({
  isOpen,
  onClose,
  due,
  jobTitle = 'Contract Milestone',
  onSuccess,
}) => {
  const { reportProblem } = usePlatformFeeDues();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!due) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMsg('Please describe why this fee due is incorrect or already settled.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await reportProblem(due.id, note.trim());
      setSuccessMsg(true);
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit problem report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Report Fee Issue or Dispute"
      description="Flag an incorrect fee calculation, double-charge, or past off-chain settlement."
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[#6B7280]">Review SLA: within 48 hours</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
              {successMsg ? 'Close' : 'Cancel'}
            </Button>
            {!successMsg && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting || !note.trim()}
              >
                Submit for Review
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {successMsg ? (
          <div className="p-4 rounded-[10px] bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs">
              <CheckCircle2 size={16} />
              <span>Problem Report Submitted Successfully</span>
            </div>
            <p className="text-xs text-[#166534] leading-relaxed">
              This fee due has been placed <strong>UNDER_REVIEW</strong> and fee reminders have been paused immediately. Our protocol arbitration team will inspect the on-chain evidence.
            </p>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs text-[#4B5563] space-y-1">
              <div className="flex justify-between items-center text-[#6B7280]">
                <span>Project:</span>
                <span className="font-semibold text-[#0B0B0F]">{jobTitle}</span>
              </div>
              <div className="flex justify-between items-center text-[#6B7280]">
                <span>Outstanding Amount:</span>
                <span className="font-semibold text-[#0047AB]">{due.outstanding} {due.token}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0B0B0F]">
                Explain the discrepancy:
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. 'I already settled this fee via transaction hash 0x... or the agreement terms specified a lower amount.'"
                rows={4}
                className="w-full text-xs p-3 rounded-[8px] border border-[#E5E7EB] focus:outline-none focus:border-[#0047AB] bg-white resize-none"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-[6px] bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
                {errorMsg}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
