import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Zap,
  HelpCircle,
  Loader2,
  PauseCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBackendSyncUrl } from '../../utils/backendUrl';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { stepTransitionVariants, reducedMotionVariants } from '../../styles/popupMotion';

export type TxTrackerStep =
  | 'IDLE'
  | 'PREFLIGHT'
  | 'WALLET_SIGN'
  | 'SUBMITTED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'FAILED'
  | 'DROPPED';

export interface TransactionTrackerProps {
  intentId?: string;
  txHash?: string;
  jobId?: string;
  type?: 'FUND' | 'RELEASE' | 'REFUND' | 'APPROVE' | 'DISPUTE';
  tokenSymbol?: string;
  amount?: string;
  contractAddress?: string;
  step?: TxTrackerStep;
  confirmations?: number;
  requiredConfirmations?: number;
  errorMessage?: string;
  onRetry?: () => void;
  onDone?: () => void;
}

export const TransactionTracker: React.FC<TransactionTrackerProps> = ({
  intentId,
  txHash: initialTxHash,
  jobId,
  type = 'FUND',
  tokenSymbol = 'USDC',
  amount,
  contractAddress,
  step: controlledStep,
  confirmations: controlledConfirmations,
  requiredConfirmations: controlledRequiredConfirmations = 5,
  errorMessage: controlledErrorMessage,
  onRetry,
  onDone,
}) => {
  const { severity } = useNetworkStatus();
  const prefersReducedMotion = useReducedMotion();
  const [internalTxHash, setInternalTxHash] = useState<string>(initialTxHash || '');
  const [internalStatus, setInternalStatus] = useState<string>('PENDING');
  const [confirmations, setConfirmations] = useState<number>(controlledConfirmations || 0);
  const [requiredConfirmations, setRequiredConfirmations] = useState<number>(controlledRequiredConfirmations);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(controlledErrorMessage);
  const [copied, setCopied] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Sync controlled props
  useEffect(() => {
    if (initialTxHash) setInternalTxHash(initialTxHash);
    if (controlledConfirmations !== undefined) setConfirmations(controlledConfirmations);
    if (controlledRequiredConfirmations !== undefined) setRequiredConfirmations(controlledRequiredConfirmations);
    if (controlledErrorMessage !== undefined) setErrorMessage(controlledErrorMessage);
  }, [initialTxHash, controlledConfirmations, controlledRequiredConfirmations, controlledErrorMessage]);

  // Elapsed time counter for "Taking longer than usual" warning
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Poll server for intent status if intentId is provided
  useEffect(() => {
    if (!intentId) return;

    let isMounted = true;
    const pollServerStatus = async () => {
      try {
        const syncUrl = getBackendSyncUrl();
        const res = await fetch(`${syncUrl}/api/tx/${intentId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.transaction && isMounted) {
          const t = data.transaction;
          if (t.txHash) setInternalTxHash(t.txHash);
          setInternalStatus(t.status);
          setConfirmations(t.confirmations || 0);
          setRequiredConfirmations(t.requiredConfirmations || 5);
          if (t.errorCode) setErrorMessage(t.errorCode);
        }
      } catch (e) {
        // Silently tolerate polling failure — server cache ensures safety
      }
    };

    pollServerStatus();
    const interval = setInterval(pollServerStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [intentId]);

  // Determine current active step
  let currentStep: TxTrackerStep = controlledStep || 'IDLE';
  if (!controlledStep) {
    if (internalStatus === 'CONFIRMED') currentStep = 'CONFIRMED';
    else if (internalStatus === 'FAILED') currentStep = 'FAILED';
    else if (internalStatus === 'DROPPED') currentStep = 'DROPPED';
    else if (internalStatus === 'CONFIRMING' || confirmations > 0) currentStep = 'CONFIRMING';
    else if (internalTxHash) currentStep = 'SUBMITTED';
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPolygonscanAvailable = Boolean(internalTxHash && internalTxHash.startsWith('0x'));
  const explorerUrl = `https://polygonscan.com/tx/${internalTxHash}`;
  const isTakingLong = elapsedSeconds > 120 && (currentStep === 'SUBMITTED' || currentStep === 'CONFIRMING');

  const progressPercent = Math.min(
    100,
    currentStep === 'CONFIRMED'
      ? 100
      : currentStep === 'CONFIRMING'
      ? Math.max(15, Math.floor((confirmations / requiredConfirmations) * 90))
      : currentStep === 'SUBMITTED'
      ? 15
      : 5
  );

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl backdrop-blur-xl">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">
              {type === 'FUND'
                ? 'Escrow Milestone Funding'
                : type === 'RELEASE'
                ? 'Payment Release'
                : 'Blockchain Transaction'}
            </h4>
            <p className="text-xs text-slate-400">
              Polygon PoS Non-Custodial Smart Contract
            </p>
          </div>
        </div>

        {amount && (
          <div className="text-right">
            <div className="text-lg font-bold text-white tracking-tight">
              {amount} <span className="text-purple-400 text-sm font-semibold">{tokenSymbol}</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Chain Source of Truth
            </div>
          </div>
        )}
      </div>

      {/* Contract & Trust Assurance */}
      {contractAddress && (
        <div className="mb-5 bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Funds held by smart contract:
          </span>
          <span className="font-mono text-slate-300">
            {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
          </span>
        </div>
      )}

      {/* Contextual Network Status Notice */}
      {severity === 'DISRUPTED' && (
        <div className="mb-5 bg-amber-950/70 border border-amber-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <PauseCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-200">Payments are temporarily paused</p>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              Your funds and escrow are unaffected. We'll update this page as soon as the network recovers.
            </p>
          </div>
        </div>
      )}

      {severity === 'SLOW' && (
        <div className="mb-5 bg-blue-950/70 border border-blue-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-200">
          <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-blue-200">Confirmations are a little slower right now</p>
            <p className="text-[11px] text-blue-300/80 leading-relaxed">
              Your funds stay in the escrow smart contract. You don't need to do anything or pay again.
            </p>
          </div>
        </div>
      )}

      {/* Visual Stepper */}
      <div className="relative mb-6">
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              currentStep === 'FAILED' || currentStep === 'DROPPED'
                ? 'bg-rose-500'
                : currentStep === 'CONFIRMED'
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-[#0047AB] to-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1.5 ${
                currentStep !== 'IDLE'
                  ? 'bg-[#0047AB] text-white shadow-lg shadow-[#0047AB]/20'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              1
            </div>
            <span className="text-[11px] font-medium text-slate-300">Wallet Sign</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1.5 ${
                currentStep === 'SUBMITTED' || currentStep === 'CONFIRMING' || currentStep === 'CONFIRMED'
                  ? 'bg-[#0047AB] text-white shadow-lg shadow-[#0047AB]/20'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              2
            </div>
            <span className="text-[11px] font-medium text-slate-300">Submitted</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1.5 ${
                currentStep === 'CONFIRMING'
                  ? 'bg-blue-600 text-white animate-pulse'
                  : currentStep === 'CONFIRMED'
                  ? 'bg-[#0047AB] text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              3
            </div>
            <span className="text-[11px] font-medium text-slate-300">
              Confirming ({confirmations}/{requiredConfirmations})
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold mb-1.5 ${
                currentStep === 'CONFIRMED'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-300">Confirmed</span>
          </div>
        </div>
      </div>

      {/* Step Status Card */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-5 min-h-[88px] flex items-center overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStep === 'PREFLIGHT' && (
            <motion.div
              key="PREFLIGHT"
              variants={prefersReducedMotion ? reducedMotionVariants : stepTransitionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex items-center gap-3 w-full"
            >
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Running pre-flight verification</p>
                <p className="text-xs text-slate-400">
                  Simulating smart contract execution before requesting wallet signature...
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 'WALLET_SIGN' && (
            <motion.div
              key="WALLET_SIGN"
              variants={prefersReducedMotion ? reducedMotionVariants : stepTransitionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex items-center gap-3 w-full"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 animate-bounce">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Confirm in your wallet</p>
                <p className="text-xs text-slate-400">
                  Please approve the transaction prompt in MetaMask or your Web3 wallet.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 'SUBMITTED' && (
            <motion.div
              key="SUBMITTED"
              variants={prefersReducedMotion ? reducedMotionVariants : stepTransitionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex items-center gap-3 w-full"
            >
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Broadcasted to Polygon PoS</p>
                <p className="text-xs text-slate-400">
                  Transaction is in the validator mempool. Waiting for block inclusion...
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 'CONFIRMING' && (
            <motion.div
              key="CONFIRMING"
              variants={prefersReducedMotion ? reducedMotionVariants : stepTransitionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex items-center gap-3 w-full"
            >
              <Clock className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Confirming on-chain ({confirmations} of {requiredConfirmations} confirmations)
                </p>
                <p className="text-xs text-slate-400">
                  Payment is still confirming. You do not need to pay again. You can safely close this tab.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 'CONFIRMED' && (
            <motion.div
              key="CONFIRMED"
              variants={prefersReducedMotion ? reducedMotionVariants : stepTransitionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex items-center gap-3 w-full"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  {type === 'FUND'
                    ? 'Escrow Deposit Successfully Locked'
                    : 'Payment Successfully Settled'}
                </p>
                <p className="text-xs text-slate-400">
                  Confirmed with {confirmations} block confirmations. Freelancer has been notified.
                </p>
              </div>
            </motion.div>
          )}

          {(currentStep === 'FAILED' || currentStep === 'DROPPED') && (
            <motion.div
              key="FAILED_OR_DROPPED"
              variants={prefersReducedMotion ? reducedMotionVariants : stepTransitionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex items-start gap-3 w-full"
            >
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-400">
                  {currentStep === 'DROPPED'
                    ? 'Transaction Dropped from Mempool'
                    : 'Funding Transaction Failed'}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {errorMessage || 'Funding failed. No funds were moved. Terms remain safely agreed.'}
                </p>
                <div className="mt-3 flex gap-2">
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium transition"
                    >
                      Retry Funding
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transaction Hash & Links */}
      {internalTxHash && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Transaction Hash:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded">
                {internalTxHash.slice(0, 10)}...{internalTxHash.slice(-8)}
              </span>
              <button
                onClick={() => copyToClipboard(internalTxHash)}
                className="text-slate-400 hover:text-white transition p-1"
                title="Copy Transaction Hash"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {isPolygonscanAvailable && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition p-1"
                  title="View on Polygonscan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Taking Longer than Usual Alert */}
      {isTakingLong && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Taking longer than usual</span>
            <span>
              Polygon PoS is currently experiencing high gas demand. Funds are held by the smart contract.
              Do not submit a second payment.
            </span>
            <div className="mt-2 flex items-center gap-4">
              <a
                href={`mailto:support@polylance.codes?subject=Slow Payment Assistance: Job ${jobId || 'N/A'}&body=Transaction Hash: ${internalTxHash}%0D%0AJob ID: ${jobId || 'N/A'}`}
                className="text-amber-200 underline font-medium hover:text-amber-100 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                Contact Support
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Completion CTA */}
      {currentStep === 'CONFIRMED' && onDone && (
        <div className="mt-5">
          <button
            onClick={onDone}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition shadow-lg shadow-emerald-500/25"
          >
            Continue to Project Dashboard
          </button>
        </div>
      )}
    </div>
  );
};
