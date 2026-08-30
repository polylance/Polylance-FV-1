import React, { useState } from 'react';
import { Clock, Send, X, Calendar } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onRequestExtension(days, reason.trim());
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden font-sans space-y-0">
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 p-5 border-b border-amber-200/80 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                SLA Adjustment
              </span>
              <h3 className="font-headline font-black text-base text-slate-900 mt-0.5">
                Request Time Extension
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-2">
              Select Additional Days Requested
            </label>
            <div className="flex items-center gap-2">
              {[1, 3, 5, 7, 14].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                    days === d
                      ? 'bg-amber-600 text-white shadow-xs scale-105'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{d}d
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
              Extension Rationale & Explanation *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why additional time is needed for milestone deliverables or requested revisions..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400 resize-none text-xs"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Clock size={13} />
              <span>Send Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
