import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Sparkles, Clock, AlertTriangle, Scale, Layers, X, 
  ArrowRight, ShieldCheck, Calendar, Briefcase, FileText, Copy, 
  ExternalLink, Check 
} from 'lucide-react';

export interface ActionModalDetail {
  label: string;
  value: string;
  isMono?: boolean;
  isBadge?: boolean;
  dateBadge?: string;
  explorerUrl?: string;
}

export interface ActionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: 'success' | 'progress' | 'extension' | 'modification' | 'dispute' | 'payment' | 'terms';
  badgeText?: string;
  details?: ActionModalDetail[];
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const ActionStatusModal: React.FC<ActionStatusModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = 'success',
  badgeText,
  details = [],
  primaryActionText = 'Acknowledge & Continue',
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (typeof document === 'undefined') return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getIconElement = () => {
    switch (icon) {
      case 'extension':
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 p-0.5 shadow-lg shadow-orange-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-amber-400 to-orange-500 flex items-center justify-center">
              <Clock size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        );
      case 'progress':
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-purple-500 to-indigo-600 p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-purple-500 to-indigo-600 flex items-center justify-center">
              <Layers size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        );
      case 'modification':
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-blue-500 to-cyan-600 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-blue-500 to-cyan-600 flex items-center justify-center">
              <Sparkles size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        );
      case 'dispute':
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-rose-500 to-pink-600 p-0.5 shadow-lg shadow-rose-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-rose-500 to-pink-600 flex items-center justify-center">
              <Scale size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-emerald-500 to-teal-600 flex items-center justify-center">
              <ShieldCheck size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        );
      case 'payment':
      case 'success':
      default:
        return (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-emerald-400 to-teal-500 p-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-emerald-400 to-teal-500 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        );
    }
  };

  const getItemIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('day') || l.includes('date') || l.includes('time') || l.includes('period') || l.includes('sla')) {
      return <Calendar size={18} className="text-purple-700" />;
    }
    if (l.includes('job') || l.includes('title') || l.includes('scope') || l.includes('deliverable')) {
      return <Briefcase size={18} className="text-purple-700" />;
    }
    return <FileText size={18} className="text-purple-700" />;
  };

  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      onClose();
    }
  };

  // Format subtitle with highlighted tokens if present
  const renderSubtitle = () => {
    if (!subtitle) return null;
    return (
      <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">
        {subtitle}
      </p>
    );
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white rounded-3xl p-7 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden z-10 space-y-6"
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-9 h-9 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header Block: Icon + Badge + Title + Subtitle */}
            <div className="flex items-start gap-4.5 pt-1">
              {getIconElement()}
              <div className="space-y-1 pr-6 flex-1 min-w-0">
                {badgeText && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-100/70 text-purple-900 border border-purple-200/60 font-mono text-[11px] font-bold tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" />
                    {badgeText}
                  </div>
                )}
                <h3 className="font-headline text-2xl font-black text-slate-900 leading-tight">
                  {title}
                </h3>
                {renderSubtitle()}
              </div>
            </div>

            {/* Step-line Timeline Detail Box (Matching Reference Image 2) */}
            {details.length > 0 && (
              <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/40 p-5 space-y-4">
                {/* Timeline vertical line on the left */}
                {details.length > 1 && (
                  <div className="absolute left-[31px] top-9 bottom-9 w-[1.5px] bg-purple-200 z-0" />
                )}

                {details.map((item, idx) => {
                  const isContract = item.label.toLowerCase().includes('contract') || item.label.toLowerCase().includes('address') || item.label.toLowerCase().includes('cid');
                  const isDays = item.label.toLowerCase().includes('day') || item.label.toLowerCase().includes('added');
                  const currentDate = item.dateBadge || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <div key={idx} className="relative z-10">
                      <div className="flex items-start gap-3.5">
                        {/* Timeline Node Dot */}
                        <div className="w-1.5 h-1.5 rounded-full border-2 border-purple-600 bg-white ring-2 ring-purple-100 shrink-0 mt-4.5 -ml-0.5" />

                        {/* Lavender Icon Square */}
                        <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                          {getItemIcon(item.label)}
                        </div>

                        {/* Content & Value */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              {item.label}
                            </span>

                            {/* Optional Date Badge on the Right for Added Days */}
                            {isDays && (
                              <span className="px-3 py-1 rounded-xl text-xs font-medium bg-purple-50 text-purple-900 border border-purple-100/80 flex items-center gap-1.5 shrink-0">
                                <Calendar size={12} className="text-purple-600" />
                                {currentDate}
                              </span>
                            )}

                            {/* Optional View on Explorer Link for Contract */}
                            {isContract && (
                              <a
                                href={item.explorerUrl || 'https://polygonscan.com'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 rounded-xl text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50/90 hover:bg-purple-100/90 border border-purple-100 transition-colors flex items-center gap-1.5 shrink-0"
                              >
                                <ExternalLink size={12} />
                                View on Explorer
                              </a>
                            )}
                          </div>

                          {/* Value Display */}
                          <div className="mt-1">
                            {isContract ? (
                              <button
                                type="button"
                                onClick={() => handleCopy(item.value, idx)}
                                title="Click to copy"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-xs font-mono font-bold text-slate-800 shadow-2xs transition-colors cursor-pointer"
                              >
                                <span>{item.value}</span>
                                {copiedIndex === idx ? (
                                  <Check size={13} className="text-emerald-600" />
                                ) : (
                                  <Copy size={13} className="text-slate-400 hover:text-slate-600" />
                                )}
                              </button>
                            ) : isDays ? (
                              <span className="text-base font-black text-purple-900 font-sans block">
                                {item.value}
                              </span>
                            ) : (
                              <p className="text-xs font-bold text-slate-800 leading-snug break-words">
                                {item.value}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dotted Divider between items */}
                      {idx < details.length - 1 && (
                        <div className="border-b border-dashed border-slate-200/80 ml-14 mt-3" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Section: Shield Note on Left + Primary CTA on Right */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              {/* Security Hint */}
              <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
                <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} className="text-purple-700" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-tight max-w-[210px]">
                  The escrow timeline and milestones will be updated automatically.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {secondaryActionText && (
                  <button
                    type="button"
                    onClick={onSecondaryAction || onClose}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    {secondaryActionText}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrimary}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle2 size={16} className="text-white shrink-0" />
                  <span>{primaryActionText}</span>
                  <ArrowRight size={14} className="text-white/80" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
