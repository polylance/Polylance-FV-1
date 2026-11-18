import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react';
import { Job } from '../types';
import { useWeb3 } from '../context/Web3Context';
import { InsufficientFundsModal } from './InsufficientFundsModal';
import { NETWORK_CONFIG } from '../config/contracts';
import { Modal } from './overlay/Modal';
import { Button } from './common/Button';
import { AddressChip } from './common/AddressChip';
import { FeeBreakdown } from './common/FeeBreakdown';
import { TransactionTracker, TxTrackerStep } from './common/TransactionTracker';
import { decodeRevertReason } from '../utils/txBuilder';
import { calculateFeeBreakdownFromString } from '../utils/fees';
import { formatAmount } from '../utils/formatAmount';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { PauseCircle, Clock } from 'lucide-react';
import { NetworkFeeBlock } from './common/NetworkFeeBlock';
import { convertCryptoToFiat, useLiveCurrencyRates, useGlobalFiat } from '../utils/currency';

interface FundEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onConfirmFund: () => Promise<void>;
  tokenSymbol?: string;
}

export const FundEscrowModal: React.FC<FundEscrowModalProps> = ({
  isOpen,
  onClose,
  job,
  onConfirmFund,
  tokenSymbol = 'POL',
}) => {
  const { balanceNative, balanceUsdc, refreshBalances, isWrongNetwork } = useWeb3();
  const { severity, isPaymentDisabled } = useNetworkStatus();
  useLiveCurrencyRates();
  const [fiatCode] = useGlobalFiat();

  const [isFunding, setIsFunding] = useState(false);
  const [trackerStep, setTrackerStep] = useState<TxTrackerStep>('IDLE');
  const [activeTxHash, setActiveTxHash] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshingBal, setIsRefreshingBal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  // Financial calculations via pure BigInt fee breakdown
  const rawBudgetString = (job as any).budget || job.amountEth || job.amountUsdc || '0';
  const feeDetails = calculateFeeBreakdownFromString(rawBudgetString, tokenSymbol);
  const principalAmount = parseFloat(feeDetails.budgetFormatted) || 0;
  const clientFee = parseFloat(feeDetails.clientFeeFormatted) || 0;
  const totalRequired = parseFloat(feeDetails.clientDepositFormatted) || 0;
  const netFreelancerPayout = parseFloat(feeDetails.freelancerNetFormatted) || 0;

  const currentBalance = tokenSymbol === 'USDC' ? balanceUsdc : balanceNative;
  const currentBalNum = parseFloat(currentBalance || '0') || 0;
  const hasSufficientFunds = currentBalNum >= totalRequired;
  const shortfall = Math.max(0, totalRequired - currentBalNum);

  // Gas pre-check: if funding in token, client must have native POL for gas
  const isGasShortage = tokenSymbol !== 'POL' && parseFloat(balanceNative || '0') < 0.01;

  const targetChainName = NETWORK_CONFIG.chainName || 'Polygon';

  const handleManualRefresh = async () => {
    setIsRefreshingBal(true);
    try {
      await refreshBalances();
    } catch {
      // silently handle
    } finally {
      setIsRefreshingBal(false);
    }
  };

  const handleFundClick = async () => {
    setErrorMsg(null);
    if (isWrongNetwork) {
      setErrorMsg(`Please switch your wallet to ${targetChainName} to fund this escrow.`);
      return;
    }
    if (isGasShortage) {
      setErrorMsg('You need a small amount of POL for network fees. You hold USDC, but gas on Polygon PoS requires native POL.');
      return;
    }
    if (!hasSufficientFunds && currentBalNum > 0) {
      setShowInsufficientModal(true);
      return;
    }

    try {
      setIsFunding(true);
      setTrackerStep('WALLET_SIGN');
      await onConfirmFund();
      setTrackerStep('CONFIRMED');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Escrow funding submission error:', err);
      const decoded = decodeRevertReason(err);
      setErrorMsg(decoded.message);
      setTrackerStep('FAILED');
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="md"
        isPending={isFunding}
        title="Lock Escrow Deposit"
        description={`Deposit ${tokenSymbol} into isolated non-custodial milestone escrow.`}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#6B7280] font-mono">
              Secured on Polygon PoS
            </span>
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={isFunding}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFundClick}
                loading={isFunding}
                disabled={isFunding || isPaymentDisabled}
                icon={!isFunding && !isPaymentDisabled && <ArrowRight size={15} />}
              >
                {isPaymentDisabled
                  ? 'Payments Paused'
                  : isFunding
                  ? 'Confirming in wallet...'
                  : `Lock & fund escrow (${totalRequired.toFixed(3)} ${tokenSymbol})`}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Contextual Network Status Notice */}
          {isPaymentDisabled && (
            <div className="p-3.5 rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2.5">
              <PauseCircle size={16} className="shrink-0 mt-0.5 text-[#D97706]" />
              <div className="space-y-0.5">
                <p className="font-semibold text-[#92400E]">Payments are temporarily paused</p>
                <p className="text-[11.5px] text-[#78350F] leading-relaxed">
                  Your funds and escrow are unaffected. We'll update this page as soon as the network recovers.
                </p>
              </div>
            </div>
          )}

          {severity === 'SLOW' && !isPaymentDisabled && (
            <div className="p-3 rounded-[10px] bg-[#EAF1FF] border border-[#C8DBF8] text-xs text-[#0B4FBF] flex items-start gap-2">
              <Clock size={14} className="shrink-0 mt-0.5 text-[#0B4FBF]" />
              <span className="text-[11.5px] leading-relaxed text-[#374151]">
                Confirmations are a little slower right now. Your funds stay in the escrow smart contract.
              </span>
            </div>
          )}

          {/* Smart Contract Isolation & Trust Banner */}
          <div className="p-3 rounded-[10px] bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck size={14} className="text-purple-400" />
              <span>Funds are held by smart contract:</span>
            </span>
            <span className="font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40 text-[11px]">
              {job.contractAddress ? `${job.contractAddress.slice(0, 8)}...${job.contractAddress.slice(-6)}` : 'Deploys on First Deposit'}
            </span>
          </div>

          {/* Job Summary Banner */}
          <div className="p-3.5 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] text-xs space-y-1">
            <div className="font-semibold text-[#0B0B0F] truncate">{job.title}</div>
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="font-mono">Job ID: {job.id.slice(0, 10)}...</span>
              {job.freelancer && (
                <span className="flex items-center gap-1">
                  Selected: <AddressChip address={job.freelancer} truncate />
                </span>
              )}
            </div>
          </div>

          {/* POL Gas Requirement Warning */}
          {isGasShortage && (
            <div className="p-3 rounded-[8px] bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-semibold block">You need a small amount of POL for network fees.</span>
                <span className="text-[11px] text-amber-700">
                  You hold {tokenSymbol}, but network transactions on Polygon PoS require native POL for gas. Please top up at least 0.02 POL.
                </span>
              </div>
            </div>
          )}

          {/* Transaction Tracker when funding is active */}
          {trackerStep !== 'IDLE' && (
            <div className="pt-2">
              <TransactionTracker
                jobId={job.id}
                type="FUND"
                tokenSymbol={tokenSymbol}
                amount={totalRequired.toFixed(3)}
                contractAddress={job.contractAddress}
                step={trackerStep}
                txHash={activeTxHash}
                onRetry={() => {
                  setTrackerStep('IDLE');
                  setErrorMsg(null);
                }}
                onDone={onClose}
              />
            </div>
          )}

          {/* Fee & Breakdown Table */}
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white divide-y divide-[#E5E7EB] text-xs overflow-hidden">
            <div className="p-3 flex justify-between items-center">
              <span className="text-[#4B5563]">Escrow principal budget:</span>
              <span className="font-semibold text-[#0B0B0F] tabular-nums font-sans">
                {formatAmount(feeDetails.breakdown.budget, tokenSymbol).formatted} {tokenSymbol} <span className="text-[#64748B] text-[11px] font-normal">({convertCryptoToFiat(principalAmount, tokenSymbol, fiatCode).formatted})</span>
              </span>
            </div>
            <div className="p-3 flex justify-between items-center bg-[#F6F7F9]">
              <div className="flex items-center gap-1.5 text-[#4B5563]">
                <span>Platform fee (2.5%):</span>
                <span title="Protocol escrow fee">
                  <Info size={12} className="text-[#6B7280]" />
                </span>
              </div>
              <span className="font-semibold text-[#4B5563] tabular-nums font-sans">
                +{formatAmount(feeDetails.breakdown.clientFee, tokenSymbol).formatted} {tokenSymbol} <span className="text-[#64748B] text-[11px] font-normal">({convertCryptoToFiat(clientFee, tokenSymbol, fiatCode).formatted})</span>
              </span>
            </div>
            <div className="p-3.5 flex justify-between items-center bg-[#EAF1FB]/50 border-t border-[#C9DAF2]">
              <span className="font-semibold text-[#0B0B0F]">Total deposit to escrow:</span>
              <span className="font-bold text-[#0047AB] tabular-nums text-sm font-sans">
                {formatAmount(feeDetails.breakdown.clientDeposit, tokenSymbol).formatted} {tokenSymbol} <span className="text-[#0047AB]/80 text-xs font-normal">({convertCryptoToFiat(totalRequired, tokenSymbol, fiatCode).formatted})</span>
              </span>
            </div>
            <div className="p-3 flex justify-between items-center text-[#4B5563]">
              <span>Net disbursed to freelancer on approval:</span>
              <span className="font-semibold text-[#0B0B0F] tabular-nums font-sans">
                {formatAmount(feeDetails.breakdown.freelancerNet, tokenSymbol).formatted} {tokenSymbol} <span className="text-[#64748B] text-[11px] font-normal">({convertCryptoToFiat(netFreelancerPayout, tokenSymbol, fiatCode).formatted})</span>
              </span>
            </div>
          </div>

          {/* Live Network Fee Engine Block */}
          <NetworkFeeBlock
            actionKey={tokenSymbol === 'POL' ? 'fundNative' : 'fundUsdc'}
            isErc20={tokenSymbol !== 'POL'}
            tokenSymbol={tokenSymbol}
          />

          {/* Live Balance Status */}
          <div className="p-3.5 rounded-[10px] border border-[#E5E7EB] bg-[#F6F7F9] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-[#0047AB]" />
              <div>
                <div className="flex items-center gap-1.5 text-[#4B5563]">
                  <span>Your live balance:</span>
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isRefreshingBal}
                    className="p-0.5 rounded text-[#6B7280] hover:text-[#0B0B0F] transition-colors cursor-pointer"
                    title="Refresh balance"
                  >
                    <RefreshCw size={11} className={isRefreshingBal ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="font-semibold text-[#0B0B0F] tabular-nums">
                  {currentBalNum.toFixed(4)} {tokenSymbol}
                </div>
              </div>
            </div>

            {hasSufficientFunds ? (
              <span className="px-2 py-0.5 rounded-[6px] bg-[#EAF1FB] text-[#0047AB] font-semibold flex items-center gap-1 text-xs">
                <CheckCircle2 size={13} />
                <span>Funds ready</span>
              </span>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowInsufficientModal(true)}
                icon={<AlertTriangle size={13} />}
              >
                Top-up shortfall ({shortfall.toFixed(3)})
              </Button>
            )}
          </div>

          {/* Error Message if any */}
          {errorMsg === 'METAMASK_SMART_TX_REVERT' ? (
            <div className="p-3.5 rounded-[10px] bg-[#EAF1FB] border border-[#C9DAF2] text-xs text-[#0B0B0F] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#0047AB]">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Action Required: Turn OFF MetaMask "Smart Transactions"</span>
              </div>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                MetaMask routed your deposit through an EIP-7702 Delegation Relayer, which reverted because smart contract escrows require direct client funding.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-[#4B5563] pt-1">
                <li>Open your <strong>MetaMask extension</strong></li>
                <li>Go to <strong>Settings → Advanced</strong></li>
                <li>Toggle <strong>"Smart Transactions"</strong> to <strong>OFF</strong></li>
                <li>Click <strong>"Lock & fund escrow"</strong> to retry</li>
              </ol>
            </div>
          ) : errorMsg && (
            <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isFunding && (
            <div className="p-3.5 rounded-[10px] bg-[#EAF1FB] border border-[#C9DAF2] text-xs text-[#0B0B0F] flex items-start gap-2.5">
              <Loader2 size={16} className="shrink-0 mt-0.5 text-[#0047AB] animate-spin" />
              <div className="space-y-0.5">
                <p className="font-semibold text-[#0047AB]">Awaiting wallet confirmation</p>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Please approve the transaction in your connected wallet.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

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

export default FundEscrowModal;
