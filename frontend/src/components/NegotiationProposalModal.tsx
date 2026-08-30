import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, AlertCircle, Send, Smile, Zap, HandshakeIcon } from 'lucide-react';
import { transition } from '../lib/motion';

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.96, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 16 },
};

interface NegotiationProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amountUsdc: string, deadlineDays: number, note: string, isFinalCall: boolean) => Promise<void> | void;
  currentAmountUsdc: string;
  currentDeadlineDays: number;
  role: 'Client' | 'Freelancer';
  counterpartName?: string;
  initialIsFinalCall?: boolean;
}

export const NegotiationProposalModal: React.FC<NegotiationProposalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentAmountUsdc,
  currentDeadlineDays,
  role,
  counterpartName = 'them',
  initialIsFinalCall = false,
}) => {
  const [amountUsdc, setAmountUsdc] = useState(currentAmountUsdc || '1000');
  const [deadlineDays, setDeadlineDays] = useState(currentDeadlineDays ? String(currentDeadlineDays) : '7');
  const [note, setNote] = useState('');
  const [isFinalCall, setIsFinalCall] = useState(initialIsFinalCall);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const numAmount = parseFloat(amountUsdc || '0');
  const netPayout = numAmount * 0.975;
  const platformFee = numAmount * 0.025;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!amountUsdc || numAmount <= 0) {
      setValidationError('Please enter a budget amount greater than $0 USDC.');
      return;
    }
    const days = parseInt(deadlineDays, 10);
    if (!days || days <= 0) {
      setValidationError('Please enter how many days you need to deliver.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(amountUsdc, days, note.trim(), isFinalCall);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role-specific friendly copy
  const isFreelancer = role === 'Freelancer';

  const headingEmoji = isFinalCall ? '⚡' : isFreelancer ? '👋' : '🤝';
  const heading = isFinalCall
    ? 'This is my best offer'
    : isFreelancer
    ? `Here's what I'm thinking…`
    : `Let me make you an offer`;

  const subheading = isFinalCall
    ? `Let ${counterpartName} know this is your final number — no more back-and-forth.`
    : isFreelancer
    ? `Drop your ask for ${counterpartName} — budget, timeline, and a quick note.`
    : `Send ${counterpartName} your counter-offer. Keep it friendly!`;

  const amountLabel = isFreelancer ? 'My asking price (USDC)' : "Budget I'm offering (USDC)";
  const timelineLabel = isFreelancer ? 'I can deliver in (days)' : 'Timeline I need (days)';
  const noteLabel = isFreelancer
    ? "What's included in this? (optional)"
    : "Anything you'd like to add? (optional)";
  const notePlaceholder = isFreelancer
    ? 'e.g. Full frontend + 2 revisions included, tests ready on day 3 👍'
    : 'e.g. Happy to adjust scope if needed, just let me know what works!';

  const submitLabel = isFinalCall
    ? 'Send Final Offer'
    : isFreelancer
    ? 'Send My Ask 🚀'
    : 'Send Offer 🤝';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition.spring}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 z-10 space-y-5"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  isFinalCall
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-purple-50 border border-purple-100'
                }`}>
                  {headingEmoji}
                </div>
                <div>
                  <h3 className="font-headline text-lg font-extrabold text-slate-900 leading-tight">
                    {heading}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
                    {subheading}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-500 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Budget */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {amountLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    $
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amountUsdc}
                    onChange={(e) => setAmountUsdc(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full pl-8 pr-16 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-mono font-bold text-slate-400">
                    USDC
                  </div>
                </div>
                {numAmount > 0 && (
                  <div className="flex items-center justify-between text-[11px] font-mono px-1 text-slate-500">
                    <span>
                      {isFreelancer ? 'You receive' : 'Freelancer gets'}{' '}
                      <strong className="text-emerald-700">${netPayout.toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-400">2.5% platform maintenance: ${platformFee.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {timelineLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Clock size={15} />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    required
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full pl-10 pr-16 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold text-sm focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-mono font-bold text-slate-400">
                    DAYS
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {noteLabel}
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={notePlaceholder}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-sans focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Final Call Toggle */}
              <div className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                isFinalCall
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}
                onClick={() => setIsFinalCall(!isFinalCall)}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="isFinalCallCheck"
                    checked={isFinalCall}
                    onChange={(e) => setIsFinalCall(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded text-amber-500 border-slate-300 focus:ring-amber-400 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="isFinalCallCheck" className={`text-xs font-bold cursor-pointer select-none ${isFinalCall ? 'text-amber-800' : 'text-slate-700'}`}>
                      ⚡ This is my final number
                    </label>
                    <p className={`text-[10.5px] font-sans ${isFinalCall ? 'text-amber-600' : 'text-slate-400'}`}>
                      {isFinalCall
                        ? 'Locked in — no more negotiating after this.'
                        : 'Check this if you\'re done going back and forth.'}
                    </p>
                  </div>
                </div>
                {isFinalCall && (
                  <span className="text-[10px] font-mono font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full shrink-0">
                    FINAL
                  </span>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Maybe later
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                    isFinalCall
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100 disabled:opacity-60'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-100 disabled:opacity-60'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      {submitLabel}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
