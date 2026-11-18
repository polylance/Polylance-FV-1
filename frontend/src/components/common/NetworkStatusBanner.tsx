import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, PauseCircle, CheckCircle2, X, HelpCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { CONTRACTS, NETWORK_CONFIG } from '../../config/contracts';
import { ScrollArea } from './ScrollArea';

export const NetworkStatusBanner: React.FC = () => {
  const {
    severity,
    shouldShowBanner,
    dismissBanner,
    showRecoveryToast,
    clearRecoveryToast,
  } = useNetworkStatus();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Close details popover on click outside or Escape
  useEffect(() => {
    if (!isDetailsOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        setIsDetailsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDetailsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDetailsOpen]);

  const isDisrupted = severity === 'DISRUPTED';
  const explorerUrl = `${NETWORK_CONFIG.blockExplorerUrl || 'https://polygonscan.com'}/address/${CONTRACTS.JobFactory}`;

  return (
    <>
      {/* 1. Recovery Toast (Triggered once when recovering from SLOW/DISRUPTED) */}
      <AnimatePresence>
        {showRecoveryToast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-live="polite"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50/98 backdrop-blur-md border border-emerald-200 text-emerald-800 rounded-full shadow-[0_8px_20px_rgba(5,150,105,0.12)] text-xs font-semibold select-none"
          >
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" aria-hidden="true" />
            <span>Network is back to normal.</span>
            <button
              type="button"
              onClick={clearRecoveryToast}
              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-emerald-100 text-emerald-700 ml-1 cursor-pointer transition-colors"
              aria-label="Dismiss recovery toast"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Calm Notice Pill / Card (Zero CLS, positioned below Navbar) */}
      <AnimatePresence>
        {shouldShowBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role={isDisrupted ? 'alert' : 'status'}
            aria-live={isDisrupted ? 'assertive' : 'polite'}
            className="fixed top-[72px] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-[720px] pointer-events-auto"
          >
            <div
              className={`rounded-2xl p-3 sm:p-3.5 border shadow-[0_8px_24px_rgba(11,79,191,0.08)] backdrop-blur-md transition-all ${
                isDisrupted
                  ? 'bg-[#FFFBEB]/98 border-[#FDE68A] text-[#92400E]'
                  : 'bg-[#EAF1FF]/98 border-[#C8DBF8] text-[#0B4FBF]'
              }`}
            >
              <div className="flex items-start gap-2.5 sm:gap-3">
                {/* Decorative Icon */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isDisrupted ? 'bg-amber-100 text-[#D97706]' : 'bg-blue-100/80 text-[#0B4FBF]'
                  }`}
                  aria-hidden="true"
                >
                  {isDisrupted ? (
                    <PauseCircle size={16} className="animate-pulse" />
                  ) : (
                    <Clock size={16} />
                  )}
                </div>

                {/* Message Block */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-[13px] font-bold tracking-tight">
                      {isDisrupted
                        ? 'Payments are temporarily paused'
                        : 'Confirmations are a little slower right now'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsDetailsOpen((prev) => !prev)}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium underline underline-offset-2 transition-colors cursor-pointer ${
                        isDisrupted
                          ? 'text-[#B45309] hover:text-[#78350F]'
                          : 'text-[#0B4FBF] hover:text-[#003882]'
                      }`}
                    >
                      <HelpCircle size={11} aria-hidden="true" />
                      <span>What does this mean?</span>
                    </button>
                  </div>

                  <p className="text-[11.5px] sm:text-xs text-[#374151] mt-0.5 leading-snug">
                    {isDisrupted
                      ? "Your funds and escrow are unaffected. We'll update this page as soon as the network recovers."
                      : "Your funds stay in the escrow smart contract. You don't need to do anything or pay again."}
                  </p>
                </div>

                {/* Dismiss Button (44px touch target) */}
                {!isDisrupted && (
                  <button
                    type="button"
                    onClick={dismissBanner}
                    className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-[#6B7280] hover:text-[#0B0B0F] rounded-xl transition-colors cursor-pointer shrink-0"
                    aria-label="Dismiss network notice for 30 minutes"
                    title="Dismiss for 30 minutes"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Details Disclosure Popover (ScrollArea encapsulated) */}
              <AnimatePresence>
                {isDetailsOpen && (
                  <motion.div
                    ref={detailsRef}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16 }}
                    className="mt-3 pt-3 border-t border-slate-200/80 overflow-hidden"
                  >
                    <ScrollArea maxHeight="180px" fadeShadows viewportClassName="pr-2 space-y-2 text-xs text-[#374151]">
                      <div>
                        <span className="font-bold text-[#0B0B0F] block mb-0.5">What is happening:</span>
                        <p className="text-[11.5px] leading-relaxed text-[#4B5563]">
                          Polygon PoS block confirmations or public RPC sync are experiencing elevated latency.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-[#0B0B0F] block mb-0.5">What it means for your payment:</span>
                        <p className="text-[11.5px] leading-relaxed text-[#4B5563]">
                          Funds are held by the smart contract. Escrow deposits cannot be altered by network delays.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-[#0B0B0F] block mb-0.5">What to do:</span>
                        <p className="text-[11.5px] leading-relaxed text-[#4B5563]">
                          No manual action is required. Please avoid submitting duplicate transactions.
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[#6B7280] border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={12} className="text-[#0B4FBF]" />
                          <span>Smart Contract Verified</span>
                        </span>
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#0B4FBF] hover:underline"
                        >
                          <span>Escrow Contract</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
