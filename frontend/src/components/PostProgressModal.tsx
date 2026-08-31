import React, { useState } from 'react';
import { TrendingUp, Send, X, Globe } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    onPostProgress(percent, note.trim(), demoUrl.trim());
    setNote('');
    setDemoUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden font-sans space-y-0">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                Milestone Progress
              </span>
              <h3 className="font-headline font-black text-base text-slate-900 mt-0.5">
                Share Work Progress
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
            <div className="flex justify-between items-center mb-1.5 font-bold">
              <label className="text-slate-700 uppercase text-[10px] tracking-wider">Completion Percentage</label>
              <span className="font-mono text-blue-600 text-sm font-black">{percent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={percent}
              onChange={(e) => setPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0% (Starting)</span>
              <span>50% (Halfway)</span>
              <span>100% (Ready)</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
              Status Description & Milestone Notes *
            </label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Summary of components implemented, tested features, or sprint deliverables..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 resize-none text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
              Staging / Demo URL (Optional)
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
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
              disabled={!note.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send size={13} />
              <span>Post Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
