import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Sparkles, Clock, AlertTriangle, Scale, Layers, X, 
  ArrowRight, ShieldCheck, Calendar, Briefcase, FileText, Copy, 
  ExternalLink, Check, DollarSign, Box, CheckCircle
} from 'lucide-react';

export interface ActionModalDetail {
  label: string;
  value: string;
  isMono?: boolean;
  isBadge?: boolean;
  dateBadge?: string;
  explorerUrl?: string;
  description?: string;
  tokenSymbol?: string;
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
  icon = 'terms',
  badgeText = 'TERMS FINALIZED',
  details = [],
  primaryActionText = 'Awesome! Take me to Dashboard',
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

  const handlePrimary = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Compact Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[440px] bg-white rounded-[24px] p-4.5 sm:p-5 shadow-[0_16px_45px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-10 space-y-3 font-sans"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer z-20"
            >
              <X size={14} />
            </button>

            {/* Header: Compact 3D Shield + Badge + Title + Subtitle */}
            <div className="flex items-center gap-3 pt-0.5">
              {/* Compact 3D Glossy Green Shield with Sparkles */}
              <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-100 via-teal-50 to-purple-100/60 blur-xs" />
                <span className="absolute -top-0.5 left-0.5 text-amber-400 text-[9px]">✦</span>
                <span className="absolute top-0 right-0 text-emerald-400 text-[8px]">✦</span>

                <svg className="w-10 h-10 relative z-10 drop-shadow-2xs" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="shieldGradSm" x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#10B981" />
                      <stop offset="0.5" stopColor="#059669" />
                      <stop offset="1" stopColor="#047857" />
                    </linearGradient>
                    <linearGradient id="shieldRimSm" x1="8" y1="6" x2="56" y2="60" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E2E8F0" />
                      <stop offset="0.5" stopColor="#CBD5E1" />
                      <stop offset="1" stopColor="#94A3B8" />
                    </linearGradient>
                  </defs>
                  <path d="M32 6L14 13V28C14 41.5 21.8 53.6 32 58C42.2 53.6 50 41.5 50 28V13L32 6Z" fill="url(#shieldRimSm)" />
                  <path d="M32 9L17 15V28C17 39.8 23.5 50.4 32 54.3C40.5 50.4 47 39.8 47 28V15L32 9Z" fill="url(#shieldGradSm)" />
                  <path d="M32 10L18 16V28C18 34.5 20.5 41 25 46C22.5 39 21.5 32 22 25L32 19V10Z" fill="white" fillOpacity="0.22" />
                  <path d="M25 29.5L30 34.5L40 23.5" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <div className="absolute -bottom-0.5 -right-0.5 z-20 w-4 h-4 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-2xs">
                  <Check size={9} className="text-white font-black" strokeWidth={3.5} />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-0.5 flex-1 min-w-0 pr-6">
                {badgeText && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200/80 font-mono text-[8.5px] font-bold tracking-wider uppercase">
                    <span className="w-1 h-1 rounded-full bg-purple-600 inline-block" />
                    {badgeText}
                  </div>
                )}
                <h3 className="font-headline text-[15px] sm:text-base font-extrabold text-slate-900 tracking-tight leading-snug flex items-center gap-1.5 flex-wrap">
                  <span>{title.replace('🎉', '').trim()}</span>
                  <span className="text-base inline-block">🎉</span>
                </h3>
                <p className="text-[10.5px] text-slate-500 font-medium leading-tight">
                  {subtitle || 'Your acceptance of the project scope and SLA terms has been signed and recorded.'}
                </p>
              </div>
            </div>

            {/* Check if this is a Terms Agreement Modal */}
            {(() => {
              const isTermsModal = icon === 'terms' || title.toLowerCase().includes('terms agreed') || title.toLowerCase().includes('terms accepted');

              if (isTermsModal) {
                return (
                  <>
                    {/* Compact Timeline Checklist Detail Box */}
                    <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs relative">
                      {/* Single Unbroken Left Timeline Track */}
                      <div className="relative flex flex-col justify-between items-center py-2 shrink-0 w-4.5">
                        {/* 100% Seamless Continuous Line from Node 1 to Node 3 */}
                        <div className="absolute top-2 bottom-2 w-[2px] bg-emerald-500 z-0 rounded-full" />

                        {/* Node 1 */}
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 z-10 shadow-2xs">
                          <Check size={10} strokeWidth={3.5} />
                        </div>

                        {/* Node 2 */}
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 z-10 shadow-2xs">
                          <Check size={10} strokeWidth={3.5} />
                        </div>

                        {/* Node 3 */}
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 z-10 shadow-2xs">
                          <Check size={10} strokeWidth={3.5} />
                        </div>
                      </div>

                      {/* Right Content Column */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        {/* Item 1: AGREEMENT STATUS */}
                        <div className="flex items-center gap-3">
                          {/* Mint Icon Box */}
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                            <FileText size={15} className="text-emerald-600" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
                              AGREEMENT STATUS
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 font-headline">
                                Terms Accepted
                              </span>
                              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700">
                                <Check size={8} strokeWidth={3} />
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Both parties have accepted the terms.
                            </p>
                          </div>

                          {/* 3D Signed Document with Glossy Green Shield Graphic */}
                          <div className="hidden sm:flex shrink-0 items-center justify-center -my-1">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                              <div className="absolute inset-0 bg-emerald-100/50 rounded-full blur-xs" />
                              <span className="absolute -top-0.5 right-1.5 text-cyan-400 text-[8px]">✦</span>
                              
                              <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 drop-shadow-xs">
                                <defs>
                                  <linearGradient id="docPaper" x1="12" y1="6" x2="36" y2="44" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#FFFFFF" />
                                    <stop offset="1" stopColor="#F1F5F9" />
                                  </linearGradient>
                                  <linearGradient id="shieldGradMini" x1="28" y1="20" x2="48" y2="44" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#34D399" />
                                    <stop offset="0.5" stopColor="#10B981" />
                                    <stop offset="1" stopColor="#059669" />
                                  </linearGradient>
                                  <linearGradient id="shieldRimMini" x1="26" y1="18" x2="50" y2="46" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#A7F3D0" />
                                    <stop offset="1" stopColor="#047857" />
                                  </linearGradient>
                                </defs>

                                {/* Document Sheet with Fold Corner and Lines */}
                                <rect x="9" y="6" width="26" height="34" rx="3.5" transform="rotate(-6 9 6)" fill="url(#docPaper)" stroke="#CBD5E1" strokeWidth="1" />
                                <line x1="14" y1="14" x2="26" y2="12.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                                <line x1="13.5" y1="19" x2="27" y2="17.5" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="13" y1="24" x2="23" y2="22.8" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
                                {/* Blue Handwritten Signature */}
                                <path d="M14 31C16 28 18 30 17 33C16 35 20 32 23 30" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

                                {/* 3D Glossy Green Shield in foreground */}
                                <path d="M37 20L28 24V33C28 39.5 32 45 37 47C42 45 46 39.5 46 33V24L37 20Z" fill="url(#shieldRimMini)" />
                                <path d="M37 22L30 25.5V33C30 38.5 33.5 43.2 37 45C40.5 43.2 44 38.5 44 33V25.5L37 22Z" fill="url(#shieldGradMini)" />
                                {/* Shield Checkmark */}
                                <path d="M33 33.5L36 36.5L42 29.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Dotted Divider */}
                        <div className="border-b border-dashed border-slate-200/80" />

                        {/* Item 2: MILESTONE PAYOUT */}
                        <div className="flex items-center gap-3">
                          {/* Mint Icon Box */}
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                            <DollarSign size={15} className="text-emerald-600 font-bold" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
                              MILESTONE PAYOUT
                            </span>
                            
                            {(() => {
                              const payoutDetail = details.find(d => d.label.toLowerCase().includes('payout') || d.label.toLowerCase().includes('amount') || d.label.toLowerCase().includes('budget'));
                              const payoutValue = payoutDetail ? payoutDetail.value : '$15 USDC';
                              const isEth = payoutValue.toUpperCase().includes('ETH');
                              const isMatic = payoutValue.toUpperCase().includes('MATIC') || payoutValue.toUpperCase().includes('POL');

                              return (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 font-headline">
                                    {payoutValue}
                                  </span>
                                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-black shadow-2xs">
                                    {isEth ? 'Ξ' : isMatic ? 'P' : '$'}
                                  </div>
                                </div>
                              );
                            })()}

                            <p className="text-[10px] text-slate-400 font-medium">
                              Payout amount locked and secured.
                            </p>
                          </div>

                          {/* 3D Blue Crypto Coin Stack Graphic */}
                          {(() => {
                            const payoutDetail = details.find(d => d.label.toLowerCase().includes('payout') || d.label.toLowerCase().includes('amount') || d.label.toLowerCase().includes('budget'));
                            const payoutValue = payoutDetail ? payoutDetail.value : '$15 USDC';
                            const isEth = payoutValue.toUpperCase().includes('ETH');
                            const isMatic = payoutValue.toUpperCase().includes('MATIC') || payoutValue.toUpperCase().includes('POL');
                            const payoutSymbol = isEth ? 'Ξ' : isMatic ? 'POL' : '$';

                            return (
                              <div className="hidden sm:flex shrink-0 items-center justify-center -my-1">
                                <div className="relative w-12 h-12 flex items-center justify-center">
                                  <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-xs" />
                                  <span className="absolute bottom-0.5 right-0.5 text-cyan-400 text-[8px]">✦</span>

                                  <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 drop-shadow-xs">
                                    <defs>
                                      <linearGradient id="coinGradTop" x1="22" y1="8" x2="48" y2="22" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#60A5FA" />
                                        <stop offset="0.5" stopColor="#3B82F6" />
                                        <stop offset="1" stopColor="#2563EB" />
                                      </linearGradient>
                                      <linearGradient id="coinGradSide" x1="20" y1="12" x2="50" y2="44" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#3B82F6" />
                                        <stop offset="0.5" stopColor="#2563EB" />
                                        <stop offset="1" stopColor="#1D4ED8" />
                                      </linearGradient>
                                      <linearGradient id="tiltCoinTop" x1="8" y1="20" x2="28" y2="44" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#93C5FD" />
                                        <stop offset="0.5" stopColor="#3B82F6" />
                                        <stop offset="1" stopColor="#1D4ED8" />
                                      </linearGradient>
                                    </defs>

                                    {/* Main Stack: Coin 3 Bottom */}
                                    <ellipse cx="36" cy="38" rx="13" ry="5" fill="#1E40AF" />
                                    <path d="M23 34C23 34 23 39 23 39C23 42 29 44.5 36 44.5C43 44.5 49 42 49 39V34C49 37 43 39.5 36 39.5C29 39.5 23 37 23 34Z" fill="url(#coinGradSide)" />
                                    
                                    {/* Coin 2 Middle */}
                                    <path d="M23 28C23 28 23 33 23 33C23 36 29 38.5 36 38.5C43 38.5 49 36 49 33V28C49 31 43 33.5 36 33.5C29 33.5 23 31 23 28Z" fill="url(#coinGradSide)" />
                                    
                                    {/* Coin 1 Side */}
                                    <path d="M23 22C23 22 23 27 23 27C23 30 29 32.5 36 32.5C43 32.5 49 30 49 27V22C49 25 43 27.5 36 27.5C29 27.5 23 25 23 22Z" fill="url(#coinGradSide)" />

                                    {/* Top Coin Face */}
                                    <ellipse cx="36" cy="19" rx="13" ry="5" fill="url(#coinGradTop)" stroke="#93C5FD" strokeWidth="1.2" />
                                    <ellipse cx="36" cy="19" rx="9.5" ry="3.5" stroke="white" strokeWidth="0.9" strokeOpacity="0.85" fill="none" />
                                    <text x="36" y="21.5" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                                      {payoutSymbol}
                                    </text>

                                    {/* Tilted Coin Resting on Left */}
                                    <g transform="translate(15, 30) rotate(-22) translate(-15, -30)">
                                      <path d="M8 23C8 23 8 27 8 27C8 33 12.5 38 18 38C23.5 38 28 33 28 27V23C28 29 23.5 34 18 34C12.5 34 8 29 8 23Z" fill="#1E3A8A" />
                                      <ellipse cx="18" cy="23" rx="9.5" ry="9.5" fill="url(#tiltCoinTop)" stroke="#BFDBFE" strokeWidth="1.2" />
                                      <circle cx="18" cy="23" r="7" stroke="white" strokeWidth="0.9" strokeOpacity="0.85" fill="none" />
                                      <text x="18" y="26" fill="white" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                                        {payoutSymbol}
                                      </text>
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Dotted Divider */}
                        <div className="border-b border-dashed border-slate-200/80" />

                        {/* Item 3: ESCROW ADDRESS */}
                        <div className="flex items-center gap-3">
                          {/* Mint Icon Box */}
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                            <Box size={15} className="text-emerald-600" />
                          </div>

                          {/* Content */}
                          {(() => {
                            const addrDetail = details.find(d => d.label.toLowerCase().includes('escrow') || d.label.toLowerCase().includes('contract') || d.label.toLowerCase().includes('address'));
                            const addrValue = addrDetail ? addrDetail.value : '0xce13...5487';
                            const explorerUrl = addrDetail?.explorerUrl || `https://polygonscan.com/address/${addrValue}`;

                            return (
                              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                <div>
                                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
                                    ESCROW ADDRESS
                                  </span>
                                  <div className="mt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(addrValue, 99)}
                                      title="Click to copy address"
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <span>{addrValue}</span>
                                      {copiedIndex === 99 ? (
                                        <Check size={11} className="text-emerald-600" />
                                      ) : (
                                        <Copy size={11} className="text-slate-400 hover:text-slate-600" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* View on Explorer Button */}
                                <a
                                  href={explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                                >
                                  <span>View on Explorer</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* "What happens next?" Notice Box */}
                    <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-cyan-50/40 border border-emerald-200/60 rounded-xl p-2.5 px-3 flex items-center justify-between gap-2.5 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0 w-8 h-8 bg-white rounded-xl border border-emerald-200 flex items-center justify-center shadow-2xs">
                          <Calendar size={16} className="text-emerald-600" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center border border-white shadow-2xs">
                            <Clock size={7} />
                          </div>
                        </div>

                        <div className="min-w-0 space-y-0.2">
                          <h4 className="text-[10.5px] font-bold text-slate-900 font-headline leading-tight">
                            What happens next?
                          </h4>
                          <p className="text-[10px] text-slate-600 leading-tight">
                            The escrow timeline and milestones will be{' '}
                            <span className="text-emerald-700 font-bold underline decoration-emerald-400">
                              updated automatically.
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:block text-emerald-500 font-bold text-sm select-none">
                        ⇢
                      </div>
                    </div>
                  </>
                );
              }

              /* Non-Terms Modals (e.g. Milestone Progress Updates, Submissions, Extensions, etc.) */
              return (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
                  {icon === 'progress' && (() => {
                    const progressDetail = details.find(d => d.label.toLowerCase().includes('completion') || d.label.toLowerCase().includes('progress'));
                    const percentVal = progressDetail ? parseInt(progressDetail.value) || 0 : 0;
                    return (
                      <div className="bg-gradient-to-br from-purple-50/90 via-indigo-50/70 to-emerald-50/50 border border-purple-200/70 rounded-xl p-3 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-xs font-bold font-headline text-slate-800">
                          <span className="flex items-center gap-1.5 text-purple-800">
                            <Sparkles size={13} className="text-purple-600" /> Milestone Completion
                          </span>
                          <span className="font-mono text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-200 text-[11px] font-black shadow-2xs">
                            {percentVal}%
                          </span>
                        </div>
                        <div className="w-full bg-white/90 h-2.5 rounded-full overflow-hidden border border-purple-200/60 shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(Math.max(percentVal, 4), 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* List of Details */}
                  <div className="space-y-2.5 divide-y divide-slate-100">
                    {details
                      .filter(d => icon !== 'progress' || (!d.label.toLowerCase().includes('completion') && !d.label.toLowerCase().includes('progress')))
                      .map((detail, idx) => (
                        <div key={idx} className={`flex items-start justify-between gap-3 text-xs ${idx > 0 ? 'pt-2.5' : ''}`}>
                          <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-500 shrink-0 mt-0.5">
                            {detail.label}
                          </span>
                          <div className="flex items-center gap-1.5 min-w-0 justify-end flex-wrap text-right">
                            {detail.isBadge ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200 text-[10.5px] font-extrabold font-mono shadow-2xs">
                                {detail.value}
                              </span>
                            ) : detail.isMono ? (
                              <button
                                type="button"
                                onClick={() => handleCopy(detail.value, idx)}
                                title="Click to copy"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 font-mono text-slate-800 text-[10.5px] font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                <span className="truncate max-w-[180px]">{detail.value}</span>
                                {copiedIndex === idx ? (
                                  <Check size={10} className="text-emerald-600 shrink-0" />
                                ) : (
                                  <Copy size={10} className="text-slate-400 shrink-0" />
                                )}
                              </button>
                            ) : (
                              <span className="font-semibold text-slate-800 text-[11px] max-w-[240px] break-words">
                                {detail.value}
                              </span>
                            )}
                            {detail.explorerUrl && (
                              <a
                                href={detail.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-1 shadow-2xs"
                              >
                                <span>Explorer</span>
                                <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })()}

            {/* Bottom Full-Width Action Button with 3D Rocket Blasting from Cloud */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handlePrimary}
                className="relative w-full bg-gradient-to-r from-[#7C3AED] via-[#5B3EE8] to-[#2563EB] hover:brightness-105 active:scale-[0.99] text-white py-3 px-4 sm:px-5 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-between transition-all cursor-pointer group overflow-hidden"
              >
                {/* Center Content: 3D Rocket + Cloud + Text + Arrow */}
                <div className="flex items-center justify-center gap-2.5 mx-auto">
                  {/* 3D Rocket Launching from Cloud Illustration */}
                  <div className="relative shrink-0 w-8 h-8 flex items-center justify-center -my-1 group-hover:scale-105 group-hover:-translate-y-0.5 transition-transform duration-200">
                    <svg viewBox="0 0 48 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 drop-shadow-md">
                      {/* Exhaust Flame */}
                      <path d="M19 25L14 34L22 30L19 25Z" fill="#F59E0B" />
                      <path d="M18 26L15 32L20 29L18 26Z" fill="#EF4444" />
                      
                      {/* Rocket Fins */}
                      <path d="M17 17L10 23C10 23 13.5 26.5 19 25L17 17Z" fill="#3730A3" />
                      <path d="M26 10L32 15C32 15 30.5 19 23 20L26 10Z" fill="#3730A3" />
                      
                      {/* Rocket Fuselage */}
                      <path d="M32 7C30 4 25.5 5 22.5 7L16 17C14 20 16 23.5 19 24.5L27 20.5C30.5 18.5 33.5 12.5 32 7Z" fill="#FFFFFF" />
                      <path d="M29 9C27 6.5 24.5 6.5 22.5 7L19.5 11C21.5 9 24.5 8 28 9L29 9Z" fill="#E2E8F0" />
                      
                      {/* Purple Nose Stripe */}
                      <path d="M32 7C30.5 4.8 27.5 5.5 25.5 6.8L28.5 11.5L32 7Z" fill="#6366F1" />
                      
                      {/* Window */}
                      <circle cx="23.5" cy="13.5" r="3.2" fill="#38BDF8" stroke="#1E293B" strokeWidth="0.8" />
                      <circle cx="22.8" cy="12.8" r="0.9" fill="#FFFFFF" />

                      {/* Fluffy White Cloud Base */}
                      <path d="M3 33C3 29.5 6 26.8 9.5 26.8C10.5 26.8 11.5 27 12.5 27.5C13.5 25 16 23.5 19 23.5C23 23.5 26 26.5 26 30.5C27 30.5 28.5 31.5 28.5 33.5C28.5 36 26.5 37.5 24 37.5H7C4.5 37.5 3 35.8 3 33Z" fill="#FFFFFF" />
                      <path d="M5 34C5 32 6.5 30.5 8.5 30.5C9.2 30.5 10 30.8 10.5 31.2C11.2 29.8 12.8 29 14.5 29C17 29 19 30.8 19 33.2C19.5 33.2 20.5 33.8 20.5 34.8C20.5 36 19.2 37 17.8 37H7C5.8 37 5 36 5 34Z" fill="#E2E8F0" fillOpacity="0.6" />
                    </svg>
                  </div>

                  {/* Button Label */}
                  <span className="font-headline font-bold text-xs sm:text-[13px] text-white tracking-normal">
                    {primaryActionText}
                  </span>

                  {/* Arrow Icon */}
                  <ArrowRight size={14} className="text-white group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>

                {/* Subtle Right Plus/Sparkle icon matching reference */}
                <span className="text-white/50 text-xs font-mono select-none pr-0.5">
                  +
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

