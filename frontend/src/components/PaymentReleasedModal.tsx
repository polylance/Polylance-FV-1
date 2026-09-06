import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Sparkles, ExternalLink, Award, ArrowRight, 
  Wallet, ShieldCheck, X 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Job } from '../types';
import { modalOverlayVariants, modalContentVariants, transition } from '../lib/motion';

interface PaymentReleasedModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  txHash?: string;
  onViewAttestation: () => void;
}

export const PaymentReleasedModal: React.FC<PaymentReleasedModalProps> = ({
  isOpen,
  onClose,
  job,
  txHash,
  onViewAttestation,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#8b5cf6', '#eab308']
      });
    }
  }, [isOpen]);

  const isNative = !job.paymentToken || job.paymentToken === '0x0000000000000000000000000000000000000000' || job.paymentTokenSymbol === 'POL' || job.paymentTokenSymbol === 'MATIC';
  const tokenSymbol = job.paymentTokenSymbol || (isNative ? 'POL' : 'USDC');
  const totalAmount = isNative 
    ? parseFloat(job.amountEth || '0.05') 
    : parseFloat(job.amountUsdc || '100');

  // 97.5% net to freelancer, 2.5% treasury protocol fee
  const fee = totalAmount * 0.025;
  const netAmount = totalAmount - fee;

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const explorerUrl = txHash 
    ? `https://polygonscan.com/tx/${txHash}` 
    : (job.contractAddress ? `https://polygonscan.com/address/${job.contractAddress}` : '#');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition.fast}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition.medium}
            className="glass-panel max-w-lg w-full p-6 sm:p-7 border-emerald-300 bg-white hard-shadow relative space-y-5"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
            >
              <X size={18} />
            </button>

            {/* Celebratory Icon & Header */}
            <div className="text-center space-y-2 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto shadow-inner shadow-emerald-200">
                <CheckCircle2 size={36} className="text-emerald-600" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-xs font-mono font-bold text-emerald-800">
                <Sparkles size={13} className="text-emerald-600" />
                <span>PAYMENT SETTLED ON-CHAIN</span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 font-heading">
                Payment Released Successfully!
              </h3>
              <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
                Escrow vault funds have been irrevocably transferred to the freelancer, and an on-chain Soulbound reputation badge has been issued.
              </p>
            </div>

            {/* Payout Breakdown Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-xs font-semibold text-slate-600">Total Escrow Vault:</span>
                <span className="font-mono font-bold text-sm text-slate-900">{totalAmount.toFixed(4)} {tokenSymbol}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Wallet size={14} className="text-emerald-600" />
                  <span>Net Payout to Freelancer (97.5%):</span>
                </div>
                <span className="font-mono font-bold text-emerald-700">+{netAmount.toFixed(4)} {tokenSymbol}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>PolyLance DAO Treasury Fee (2.5%):</span>
                </div>
                <span className="font-mono font-medium text-slate-600">{fee.toFixed(4)} {tokenSymbol}</span>
              </div>
            </div>

            {/* Recipient & SBT Badge Info */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <div className="font-bold text-purple-900">Soulbound Reputation Minted</div>
                  <div className="text-[11px] text-purple-700 font-mono">
                    Recipient: {truncateAddress(job.freelancer || '')}
                  </div>
                </div>
              </div>
              <div className="px-2 py-1 bg-purple-100 rounded text-[10px] font-bold text-purple-800 uppercase tracking-wide">
                +1 Score
              </div>
            </div>

            {/* Explorer Link */}
            {explorerUrl !== '#' && (
              <div className="text-center">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <span>Verify Transaction on Polygonscan</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Back to Workspace
              </button>
              <button
                type="button"
                onClick={onViewAttestation}
                className="flex-1.5 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 hard-shadow shadow-emerald-200"
              >
                <Award size={15} />
                <span>View Attestation SBT</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
