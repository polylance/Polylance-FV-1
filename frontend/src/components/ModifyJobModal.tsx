import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Save, DollarSign, Calendar, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Job, SkillCategory } from '../types';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { useLiveCurrencyRates } from '../utils/currency';
import { scrollToSection } from '../utils/scroll';

interface ModifyJobModalProps {
  isOpen: boolean;
  job: Job | null;
  onClose: () => void;
  onSuccess?: (updatedJob: Job) => void;
}

const CATEGORIES: { label: string; value: SkillCategory; desc: string }[] = [
  { label: 'Web3 & Smart Contracts', value: 'web3', desc: 'Solidity, DeFi, NFTs, Protocol Architecture' },
  { label: 'Frontend Development', value: 'frontend', desc: 'React, Next.js, Vue, Tailwind, UI/UX' },
  { label: 'Backend & Cloud', value: 'backend', desc: 'Node.js, Go, Python, APIs, Microservices' },
  { label: 'Mobile Apps', value: 'mobile', desc: 'React Native, Flutter, iOS, Android' },
];

export const ModifyJobModal: React.FC<ModifyJobModalProps> = ({
  isOpen,
  job,
  onClose,
  onSuccess,
}) => {
  const { updateJobDetails } = usePolyLanceData();
  const rates = useLiveCurrencyRates();

  const sym = (job?.paymentTokenSymbol || 'USDC').toUpperCase();
  const isCrypto = sym === 'POL' || sym === 'MATIC' || sym === 'ETH' || sym === 'BTC';
  const tokenPriceUsd = rates.cryptoPrices[sym] || 1.0;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SkillCategory>('web3');
  const [amountUsdc, setAmountUsdc] = useState('');
  const [reviewPeriodDays, setReviewPeriodDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      setTitle(job.title || '');
      setDescription(job.description || '');
      setCategory(job.category || 'web3');
      const initialAmt = isCrypto ? (job.amountEth || job.amountUsdc || '0') : (job.amountUsdc || '0');
      setAmountUsdc(initialAmt);
      setReviewPeriodDays(job.reviewPeriodDays || 7);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [job, isOpen, isCrypto]);

  if (!isOpen || !job) return null;

  const isLockedOrFunded = job.status === 'Funded' || job.status === 'Submitted' || job.status === 'Completed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please provide a descriptive job title.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide job scope and description details.');
      return;
    }
    const numAmount = parseFloat(amountUsdc);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please specify a valid budget amount greater than 0.');
      return;
    }
    if (reviewPeriodDays < 1 || reviewPeriodDays > 30) {
      setErrorMessage('Review period must be between 1 and 30 days.');
      return;
    }

    const finalAmountUsdc = isCrypto ? (numAmount * tokenPriceUsd).toFixed(2) : numAmount.toString();
    const finalAmountEth = isCrypto ? numAmount.toString() : undefined;

    setIsSubmitting(true);
    try {
      const ok = await updateJobDetails(job.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        amountUsdc: finalAmountUsdc,
        amountEth: finalAmountEth,
        reviewPeriodDays,
      });

      if (ok) {
        setSuccessMessage('Job details updated successfully!');
        if (onSuccess) {
          onSuccess({
            ...job,
            title: title.trim(),
            description: description.trim(),
            category,
            amountUsdc: finalAmountUsdc,
            amountEth: finalAmountEth || job.amountEth,
            reviewPeriodDays,
          });
        }
        setTimeout(() => {
          onClose();
          scrollToSection('job-specs');
        }, 800);
      } else {
        setErrorMessage('Failed to update job details. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while updating job details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => !isSubmitting && onClose()}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 max-h-[90vh] overflow-y-auto space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
                <Edit3 size={22} />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg sm:text-xl text-slate-900 leading-tight">
                  Modify Job Details
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Update title, scope, budget, and review requirements for your project escrow
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Alert messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-medium">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {isLockedOrFunded && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>
                Note: This job escrow is currently in <strong>{job.status}</strong> state. Changing budget or terms after funding should be agreed upon with the freelancer via negotiation proposals.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Job Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-headline font-bold uppercase tracking-wider text-slate-700">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full-Stack Web3 Marketplace Development"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-sans text-sm text-slate-800 transition-all"
                required
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-headline font-bold uppercase tracking-wider text-slate-700">
                Skill Domain / Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map((c) => {
                  const isSelected = category === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/70 text-purple-900 ring-1 ring-purple-300'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-headline">{c.label}</span>
                        <Tag size={13} className={isSelected ? 'text-purple-600' : 'text-slate-400'} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                        {c.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget & Review Period Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Budget Amount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-slate-700">
                  Target Budget ({sym}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign size={16} />
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.0001"
                    value={amountUsdc}
                    onChange={(e) => setAmountUsdc(e.target.value)}
                    placeholder={isCrypto ? '10' : '250.00'}
                    className="w-full pl-9 pr-14 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono text-sm text-slate-800 transition-all"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-mono font-bold text-slate-500">
                    {sym}
                  </div>
                </div>
                {isCrypto && (
                  <span className="text-[10.5px] font-mono text-slate-500 block">
                    ≈ ${(parseFloat(amountUsdc || '0') * tokenPriceUsd).toFixed(2)} USDC
                  </span>
                )}
              </div>

              {/* Review Period Days */}
              <div className="space-y-1.5">
                <label className="block text-xs font-headline font-bold uppercase tracking-wider text-slate-700">
                  Client Review Window (Days) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={reviewPeriodDays}
                    onChange={(e) => setReviewPeriodDays(parseInt(e.target.value) || 1)}
                    className="w-full pl-9 pr-14 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono text-sm text-slate-800 transition-all"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-mono font-medium text-slate-400">
                    days
                  </div>
                </div>
              </div>
            </div>

            {/* Scope & Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-headline font-bold uppercase tracking-wider text-slate-700">
                Detailed Scope Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe project deliverables, tech stack requirements, milestones, and expectations..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-sans text-sm text-slate-800 transition-all resize-y"
                required
              />
            </div>

            {/* Footer action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
