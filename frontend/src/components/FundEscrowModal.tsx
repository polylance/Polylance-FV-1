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

  const [isFunding, setIsFunding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshingBal, setIsRefreshingBal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  // Financial calculations
  const rawBudget = parseFloat(job.amountEth || job.amountUsdc || '0') || 0;
  const principalAmount = rawBudget > 0 ? rawBudget : 0;
  const clientFee = principalAmount * 0.025; // 2.5% protocol fee
  const totalRequired = principalAmount + clientFee;
  const netFreelancerPayout = principalAmount * 0.975; // Freelancer receives 97.5%

  const currentBalance = tokenSymbol === 'USDC' ? balanceUsdc : balanceNative;
  const currentBalNum = parseFloat(currentBalance || '0') || 0;
  const hasSufficientFunds = currentBalNum >= totalRequired;
  const shortfall = Math.max(0, totalRequired - currentBalNum);

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
    if (!hasSufficientFunds && currentBalNum > 0) {
      setShowInsufficientModal(true);
      return;
    }

    try {
      setIsFunding(true);
      await onConfirmFund();
      onClose();
    } catch (err: any) {
      console.error('Escrow funding submission error:', err);
      setErrorMsg(err?.message || 'Failed to fund escrow contract. Please try again.');
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
                disabled={isFunding}
                icon={!isFunding && <ArrowRight size={15} />}
              >
                {isFunding
                  ? 'Confirming in wallet...'
                  : `Lock & fund escrow (${totalRequired.toFixed(3)} ${tokenSymbol})`}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
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

          {/* Fee & Breakdown Table */}
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white divide-y divide-[#E5E7EB] text-xs overflow-hidden">
            <div className="p-3 flex justify-between items-center">
              <span className="text-[#4B5563]">Escrow principal budget:</span>
              <span className="font-semibold text-[#0B0B0F] tabular-nums">
                {principalAmount.toFixed(4)} {tokenSymbol}
              </span>
            </div>
            <div className="p-3 flex justify-between items-center bg-[#F6F7F9]">
              <div className="flex items-center gap-1.5 text-[#4B5563]">
                <span>Platform fee (2.5%):</span>
                <span title="Smart contract protocol fee">
                  <Info size={12} className="text-[#6B7280]" />
                </span>
              </div>
              <span className="font-semibold text-[#0B0B0F] tabular-nums">
                +{clientFee.toFixed(4)} {tokenSymbol}
              </span>
            </div>
            <div className="p-3.5 flex justify-between items-center bg-[#EAF1FB]/50 border-t border-[#C9DAF2]">
              <span className="font-semibold text-[#0B0B0F]">Total deposit to escrow:</span>
              <span className="font-bold text-[#0047AB] tabular-nums text-sm">
                {totalRequired.toFixed(4)} {tokenSymbol}
              </span>
            </div>
            <div className="p-3 flex justify-between items-center text-[#4B5563]">
              <span>Net disbursed to freelancer on approval:</span>
              <span className="font-semibold text-[#0B0B0F] tabular-nums">
                {netFreelancerPayout.toFixed(4)} {tokenSymbol}
              </span>
            </div>
          </div>

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
