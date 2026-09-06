import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldCheck, ArrowRight, Wallet, AlertTriangle, 
  CheckCircle2, Loader2, Sparkles, ExternalLink, Info
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { Job } from '../types';
import { modalOverlayVariants, modalContentVariants, transition } from '../lib/motion';
import { InsufficientFundsModal } from './InsufficientFundsModal';

interface FundEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onConfirmFund: () => Promise<void>;
}

export const FundEscrowModal: React.FC<FundEscrowModalProps> = ({
  isOpen,
  onClose,
  job,
  onConfirmFund,
}) => {
  const { address, balanceNative, balanceUsdc, isWrongNetwork, targetChainName, switchToTargetNetwork } = useWeb3();
  const [isFunding, setIsFunding] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determine token and amounts
  const isNative = !job.paymentToken || job.paymentToken === '0x0000000000000000000000000000000000000000' || job.paymentTokenSymbol === 'POL' || job.paymentTokenSymbol === 'MATIC';
  const tokenSymbol = job.paymentTokenSymbol || (isNative ? 'POL' : 'USDC');
  const principalAmount = isNative 
    ? parseFloat(job.amountEth || '0.05') 
    : parseFloat(job.amountUsdc || '100');
  
  // Platform fee: 2.5%
  const feeRate = 0.025;
  const platformFee = principalAmount * feeRate;
  const totalRequired = principalAmount + platformFee;

  // Real-time balance check
  const currentBalance = isNative ? balanceNative : balanceUsdc;
  const currentBalNum = parseFloat(currentBalance) || 0;
  const hasSufficientFunds = currentBalNum >= totalRequired;
  const shortfall = Math.max(0, totalRequired - currentBalNum);

  const handleFundClick = async () => {
    setErrorMsg(null);
    if (isWrongNetwork) {
      setErrorMsg(`Please switch your wallet to ${targetChainName} to fund this escrow.`);
      return;
    }
    if (!hasSufficientFunds) {
      setShowInsufficientModal(true);
      return;
    }

    try {
      setIsFunding(true);
      await onConfirmFund();
      onClose();
    } catch (err: any) {
      console.error('Error executing escrow deposit:', err);
      let cleanMsg = err.message || 'Failed to deposit funds into escrow. Please try again.';
      if (err.code === 'ACTION_REJECTED' || err.code === 4001 || cleanMsg.includes('user rejected') || cleanMsg.includes('User denied')) {
        cleanMsg = 'Deposit cancelled: Transaction signature was rejected in wallet.';
      } else if (cleanMsg.includes('insufficient funds')) {
        cleanMsg = 'Insufficient balance or gas in wallet to complete escrow funding.';
      }
      setErrorMsg(cleanMsg);
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <>
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
              className="glass-panel max-w-lg w-full p-6 sm:p-7 border-blue-200 bg-white hard-shadow relative space-y-5"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isFunding}
                className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10 disabled:opacity-50"
              >
                <X size={18} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100/70 border border-blue-200 text-[10px] font-mono font-bold text-blue-700 mb-1">
                    <Sparkles size={11} />
                    <span>SMART CONTRACT ESCROW</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-heading">
                    Lock Escrow Deposit
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Deposit {tokenSymbol} into isolated EIP-1167 contract proxy.
                  </p>
                </div>
              </div>

              {/* Job Summary Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 line-clamp-1">{job.title}</div>
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>Job ID: {job.id.slice(0, 10)}...</span>
                  <span className="text-slate-700 font-medium">Selected: {job.freelancer ? `${job.freelancer.slice(0, 6)}...${job.freelancer.slice(-4)}` : 'Freelancer'}</span>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden text-xs">
                <div className="p-3.5 flex justify-between items-center">
                  <span className="text-slate-600 font-sans">Principal Escrow (100% to freelancer on approval):</span>
                  <span className="font-bold font-mono text-slate-900">{principalAmount.toFixed(4)} {tokenSymbol}</span>
                </div>
                <div className="p-3.5 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-slate-600 font-sans">
                    <span>Protocol Maintenance Fee (2.5%):</span>
                    <span title="Supports autonomous smart contract verification and DAO treasury"><Info size={12} className="text-slate-400" /></span>
                  </div>
                  <span className="font-medium font-mono text-slate-700">+{platformFee.toFixed(4)} {tokenSymbol}</span>
                </div>
                <div className="p-4 flex justify-between items-center bg-blue-50/50 font-bold">
                  <span className="text-slate-900 font-heading text-sm">Total Deposit Required:</span>
                  <span className="text-base font-black font-mono text-blue-700">{totalRequired.toFixed(4)} {tokenSymbol}</span>
                </div>
              </div>

              {/* Live Wallet Balance Status */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                hasSufficientFunds 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Wallet size={16} />
                  <div>
                    <div className="font-semibold">Your Live Balance:</div>
                    <div className="font-mono text-xs">{currentBalNum.toFixed(4)} {tokenSymbol}</div>
                  </div>
                </div>

                {hasSufficientFunds ? (
                  <div className="flex items-center gap-1 font-bold text-emerald-700 text-xs">
                    <CheckCircle2 size={14} />
                    <span>Funds Ready</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowInsufficientModal(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <AlertTriangle size={13} />
                    <span>Top-Up Shortfall ({shortfall.toFixed(3)})</span>
                  </button>
                )}
              </div>

              {/* Error Message if any */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isFunding}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFundClick}
                  disabled={isFunding}
                  className="flex-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 hard-shadow shadow-blue-200"
                >
                  {isFunding ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Confirming On-Chain Escrow...</span>
                    </>
                  ) : hasSufficientFunds ? (
                    <>
                      <span>Lock & Fund Escrow ({totalRequired.toFixed(3)} {tokenSymbol})</span>
                      <ArrowRight size={15} />
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={15} />
                      <span>Need Funds Top-Up ({shortfall.toFixed(3)} {tokenSymbol})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Footnote */}
              <div className="text-center">
                <p className="text-[10.5px] text-slate-400 font-mono">
                  Funds are secured in contract {job.contractAddress ? `${job.contractAddress.slice(0, 8)}...` : 'proxy'} and released only on your approval.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-up Assistant Modal */}
      <InsufficientFundsModal
        isOpen={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        requiredAmount={totalRequired.toString()}
        tokenSymbol={tokenSymbol}
        currentBalance={currentBalance}
        onFundsReceived={() => setShowInsufficientModal(false)}
      />
    </>
  );
};
