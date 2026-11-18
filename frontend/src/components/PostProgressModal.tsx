import React, { useState } from 'react';
import { Send, Globe } from 'lucide-react';
import { Modal } from './overlay';
import { Button } from './common/Button';

interface PostProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  onPostProgress: (percent: number, note: string, demoUrl: string) => void;
}

export const PostProgressModal: React.FC<PostProgressModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  onPostProgress,
}) => {
  const [percent, setPercent] = useState<number>(75);
  const [note, setNote] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!note.trim()) return;
    onPostProgress(percent, note.trim(), demoUrl.trim());
    setNote('');
    setDemoUrl('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Share Work Progress"
      subtitle={jobTitle ? `Milestone Progress for: ${jobTitle}` : undefined}
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!note.trim()}
            onClick={() => handleSubmit()}
          >
            <Send size={14} />
            <span>Post Update</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs font-sans">
        <div>
          <div className="flex justify-between items-center mb-1.5 font-medium">
            <label className="text-slate-700 uppercase text-[11px] tracking-wider">Completion Percentage</label>
            <span className="font-mono text-[#0047AB] text-sm font-semibold">{percent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={percent}
            onChange={(e) => setPercent(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0047AB]"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
            <span>0% (Starting)</span>
            <span>50% (Halfway)</span>
            <span>100% (Ready)</span>
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700 text-xs mb-1">
            Status Description & Milestone Notes *
          </label>
          <textarea
            required
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Summary of components implemented, tested features, or sprint deliverables..."
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl p-2.5 outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] transition-all placeholder:text-slate-400 resize-none text-xs"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-700 text-xs mb-1">
            Staging / Demo URL (Optional)
          </label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-[#0047AB] focus-within:ring-1 focus-within:ring-[#0047AB] transition-all">
            <Globe size={14} className="text-slate-400 shrink-0" />
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://staging.app or repo PR link"
              className="w-full bg-transparent text-slate-900 outline-none text-xs placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
