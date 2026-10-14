import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Modal } from './overlay';
import { Button } from './common/Button';

interface RequestExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  onRequestExtension: (days: number, reason: string) => void;
}

export const RequestExtensionModal: React.FC<RequestExtensionModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  onRequestExtension,
}) => {
  const [days, setDays] = useState<number>(3);
  const [reason, setReason] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reason.trim()) return;
    onRequestExtension(days, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Request Time Extension"
      subtitle={jobTitle ? `Timeline adjustment for: ${jobTitle}` : 'Request extra time on this milestone.'}
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!reason.trim()}
            onClick={() => handleSubmit()}
          >
            <Clock size={14} />
            <span>Send Request</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        <div>
          <label className="block font-medium text-slate-700 uppercase text-[11px] tracking-wider mb-2">
            Select Additional Days Requested
          </label>
          <div className="flex items-center gap-2">
            {[1, 3, 5, 7, 14].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`flex-1 py-2 rounded-lg font-medium font-mono text-xs transition-all cursor-pointer ${
                  days === d
                    ? 'bg-[#0047AB] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                +{d}d
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700 text-xs mb-1">
            Extension Rationale & Explanation *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why additional time is needed for milestone deliverables or requested revisions..."
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-2.5 outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all placeholder:text-slate-400 resize-none text-xs"
          />
        </div>
      </div>
    </Modal>
  );
};
