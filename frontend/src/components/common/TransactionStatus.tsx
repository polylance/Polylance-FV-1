import React from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';
import { DrawCheck } from './MotionPrimitives';
import { NETWORK_CONFIG } from '../../config/contracts';

export type TxStage = 'idle' | 'wallet' | 'submitting' | 'confirmed' | 'failed';

export interface TransactionStatusProps {
  stage: TxStage;
  actionTitle?: string;
  txHash?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
  isSample?: boolean;
  className?: string;
}

/**
 * <TransactionStatus>
 * Three-stage on-chain transaction stepper for fund, submit, approve, release, mint:
 * 1. "Confirm in wallet" -> 2. "Submitted to Polygon" -> 3. "Confirmed"
 * NEVER fakes progress in live mode; displays clear sample watermark in demo mode.
 */
export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  stage,
  actionTitle = 'Escrow Transaction',
  txHash,
  errorMessage,
  onRetry,
  onClose,
  isSample = false,
  className = '',
}) => {
  if (stage === 'idle') return null;

  const explorerUrl = txHash
    ? `${NETWORK_CONFIG.blockExplorerUrl || 'https://polygonscan.com'}/tx/${txHash}`
    : null;

  const steps = [
    { id: 1, label: 'Confirm in wallet', icon: Wallet },
    { id: 2, label: 'Submitted to Polygon', icon: Clock },
    { id: 3, label: 'Confirmed on-chain', icon: CheckCircle2 },
  ];

  const getStepStatus = (stepId: number): 'completed' | 'current' | 'upcoming' | 'failed' => {
    if (stage === 'failed') {
      return stepId === 1 ? 'failed' : 'upcoming';
    }
    if (stage === 'confirmed') return 'completed';
    if (stage === 'submitting') {
      if (stepId === 1) return 'completed';
      if (stepId === 2) return 'current';
      return 'upcoming';
    }
    if (stage === 'wallet') {
      if (stepId === 1) return 'current';
      return 'upcoming';
    }
    return 'upcoming';
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`bg-white border border-[#E5E7EB] rounded-[12px] p-5 sm:p-6 space-y-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-left ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                stage === 'confirmed'
                  ? 'bg-[#10B981]'
                  : stage === 'failed'
                  ? 'bg-[#DC2626]'
                  : 'bg-[#0047AB] animate-pulse'
              }`}
            />
            <h3 className="text-sm font-semibold text-[#0B0B0F] tracking-tight">
              {actionTitle}
            </h3>
            {isSample && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F6F7F9] text-[#6B7280] border border-[#E5E7EB] font-medium">
                Sample Demo
              </span>
            )}
          </div>
          <p className="text-xs text-[#4B5563]">
            {stage === 'wallet' && 'Please confirm the transaction in your Web3 wallet.'}
            {stage === 'submitting' && 'Broadcasting transaction to Polygon PoS mempool...'}
            {stage === 'confirmed' && 'Transaction successfully mined and verified on-chain.'}
            {stage === 'failed' && 'Transaction was rejected or encountered a network error.'}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close status"
            className="text-[#6B7280] hover:text-[#0B0B0F] p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 3-Stage Horizontal Stepper */}
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-[8px] border text-center space-y-1.5 transition-colors ${
                status === 'completed'
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                  : status === 'current'
                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0047AB]'
                  : status === 'failed'
                  ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  : 'bg-[#F6F7F9] border-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              <div className="w-7 h-7 mx-auto rounded-full flex items-center justify-center">
                {status === 'completed' ? (
                  <DrawCheck size={18} className="text-[#10B981]" />
                ) : status === 'current' ? (
                  <RefreshCw size={15} className="text-[#0047AB] animate-spin" />
                ) : status === 'failed' ? (
                  <AlertTriangle size={15} className="text-[#DC2626]" />
                ) : (
                  <StepIcon size={15} className="text-[#9CA3AF]" />
                )}
              </div>
              <div className="text-xs font-semibold">{step.label}</div>
            </div>
          );
        })}
      </div>

      {/* Explorer or Error Notice */}
      {stage === 'confirmed' && txHash && explorerUrl && (
        <div className="pt-2 flex items-center justify-between text-xs text-[#0047AB] border-t border-[#E5E7EB]">
          <span className="font-mono text-[#4B5563]">
            Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium hover:underline"
          >
            <span>View on PolygonScan</span>
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {stage === 'failed' && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] space-y-2 text-xs">
          <div className="text-[#991B1B] font-medium">
            {errorMessage || 'Transaction could not be completed. Check wallet balance and gas settings.'}
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[6px] font-medium transition-colors cursor-pointer"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {isSample && (
        <div className="text-[11px] text-[#6B7280] font-sans italic text-center">
          Sample transaction: Simulated for demonstration. No real funds or gas tokens were spent.
        </div>
      )}
    </div>
  );
};
