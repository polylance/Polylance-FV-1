import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Briefcase, DollarSign, Clock, ShieldCheck, CheckCircle2,
  Calendar, Layers, FileText, User, Sparkles, ExternalLink
} from 'lucide-react';
import { Job } from '../types';
import { truncateAddress } from '../utils/formatters';

interface JobOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

export const JobOverviewModal: React.FC<JobOverviewModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
                <Briefcase size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-purple-100/80 text-purple-800 border border-purple-200">
                    <CheckCircle2 size={11} className="text-purple-700" />
                    {job.status.toUpperCase()} ESCROW
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    #{job.id.slice(0, 8)}
                  </span>
                </div>
                <h3 className="font-headline font-black text-lg sm:text-xl text-slate-900 mt-1 truncate">
                  {job.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#FAF9FD] p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                Escrow Deposit
              </span>
              <div className="font-mono font-black text-slate-900 text-lg flex items-baseline gap-1">
                <span>${parseFloat(job.amountUsdc || '0').toFixed(2)}</span>
                <span className="text-xs font-bold text-slate-500">USDC</span>
              </div>
            </div>

            <div className="bg-[#FAF9FD] p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                SLA Timeline
              </span>
              <div className="font-mono font-black text-slate-900 text-lg flex items-baseline gap-1">
                <span>{job.reviewPeriodDays || 7}</span>
                <span className="text-xs font-bold text-slate-500">Days</span>
              </div>
            </div>

            <div className="bg-[#FAF9FD] p-3.5 rounded-2xl border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                Client Address
              </span>
              <div className="font-mono font-bold text-slate-800 text-xs truncate mt-1">
                {truncateAddress(job.client)}
              </div>
            </div>
          </div>

          {/* Full Description Section */}
          <div className="space-y-2 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-slate-700 font-headline font-bold text-xs uppercase tracking-wider">
              <FileText size={14} className="text-purple-600" />
              <span>Full Job Description & Specifications</span>
            </div>
            <p className="font-sans text-xs sm:text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap">
              {job.description || 'No description provided.'}
            </p>
          </div>

          {/* Skills Required */}
          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-headline font-bold text-xs text-slate-700 uppercase tracking-wider">
                Required Technical Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.skillsRequired.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-mono font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Modal Footer with Close / Cancel Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
