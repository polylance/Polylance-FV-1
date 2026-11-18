import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Modal } from './overlay/Modal';
import { Button } from './common/Button';
import { Amount } from './common/Amount';
import { PlatformFeeDue, usePlatformFeeDues } from '../hooks/usePlatformFeeDues';
import { useWeb3 } from '../context/Web3Context';
import { truncateAddress, getPolygonScanAddressUrl, getPolygonScanTxUrl } from '../utils/formatters';
import { NETWORK_CONFIG } from '../config/contracts';
import { ethers } from 'ethers';
import { TransactionTracker, TxTrackerStep } from './common/TransactionTracker';

interface PlatformFeePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  due: PlatformFeeDue | null;
  jobTitle?: string;
  onPaidSuccess?: () => void;
}

export const PlatformFeePayModal: React.FC<PlatformFeePayModalProps> = ({
  isOpen,
  onClose,
  due,
  jobTitle = 'Contract Milestone',
  onPaidSuccess,
}) => {
  const { getSigner, address, balanceNative } = useWeb3();
  const { createPaymentIntent, submitPayment, refreshDues } = usePlatformFeeDues();

  const [step, setStep] = useState<TxTrackerStep>('IDLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [treasuryAddr, setTreasuryAddr] = useState<string>('0x9099bE621d9812A2613D211F793E91901a1d13f9');
  const [txHash, setTxHash] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!due) return null;

  const handleCopyTreasury = () => {
    navigator.clipboard.writeText(treasuryAddr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handlePay = async () => {
    if (!address) {
      setErrorMsg('Please connect your wallet first');
      return;
    }

    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      setStep('PREFLIGHT');

      // 1. Fetch / verify intent from backend
      const intent = await createPaymentIntent(due.id);
      if (!intent || !intent.treasuryAddress) {
        throw new Error('Could not obtain verified treasury address from server.');
      }
      setTreasuryAddr(intent.treasuryAddress);

      // Pre-flight check balance
      const requiredAmount = parseFloat(due.outstanding) || 0;
      const userPolBal = parseFloat(balanceNative || '0') || 0;
      const estGas = 0.01;

      if (due.token.toUpperCase() === 'POL' || due.token.toUpperCase() === 'MATIC') {
        if (userPolBal < requiredAmount + estGas) {
          throw new Error(
            `Insufficient POL balance. Required: ${requiredAmount.toFixed(4)} POL + ~${estGas} POL network gas. Current: ${userPolBal.toFixed(4)} POL.`
          );
        }
      }

      setStep('WALLET_SIGN');
      const signer = await getSigner();
      if (!signer) {
        throw new Error('Signer not available. Please unlock your wallet.');
      }

      // Execute transfer to verified treasury
      let tx: ethers.TransactionResponse;
      if (due.token.toUpperCase() === 'POL' || due.token.toUpperCase() === 'MATIC') {
        tx = await signer.sendTransaction({
          to: intent.treasuryAddress,
          value: ethers.parseEther(due.outstanding),
        });
      } else {
        // ERC20 token transfer (USDC/USDT)
        const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const tokenAddress = due.token.toUpperCase() === 'USDC'
          ? ((NETWORK_CONFIG as any).usdcAddress || '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359')
          : ((NETWORK_CONFIG as any).usdtAddress || '0xc2132d05d31c914a87c6611c10748aeb04b58e8f');
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
        const parsedUnits = ethers.parseUnits(due.outstanding, 6);
        tx = await tokenContract.transfer(intent.treasuryAddress, parsedUnits);
      }

      setTxHash(tx.hash);
      setStep('SUBMITTED');

      // Record submitted transaction to backend
      await submitPayment(due.id, tx.hash);

      setStep('CONFIRMING');
      await tx.wait(1);

      setStep('CONFIRMED');
      await refreshDues();
      onPaidSuccess?.();
    } catch (err: any) {
      console.error('[PlatformFeePayModal] Payment error:', err);
      setErrorMsg(err.reason || err.message || 'Payment failed or rejected in wallet');
      setStep('FAILED');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isSubmitting) return;
        onClose();
      }}
      maxWidth="md"
      title="Pay Platform Fee"
      description="Settle pending protocol fee directly to PolyLance protocol treasury."
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[#6B7280] font-mono">Polygon PoS</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {step === 'CONFIRMED' ? 'Close' : 'Cancel'}
            </Button>
            {step !== 'CONFIRMED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handlePay}
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={!isSubmitting && <ArrowRight size={13} />}
              >
                {isSubmitting ? 'Confirming in wallet...' : `Pay ${due.outstanding} ${due.token}`}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {step !== 'IDLE' && step !== 'FAILED' ? (
          <TransactionTracker
            step={step}
            txHash={txHash}
            tokenSymbol={due.token}
            amount={due.outstanding}
            contractAddress={treasuryAddr}
            requiredConfirmations={1}
            onDone={onClose}
          />
        ) : (
          <>
            {/* Job Summary Banner */}
            <div className="p-3.5 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
              <div className="flex items-center justify-between text-xs text-[#6B7280]">
                <span>Associated Project</span>
                <span className="font-mono text-[11px] text-[#0047AB]">
                  {due.party === 'CLIENT' ? 'Client Service Fee (2.5%)' : 'Freelancer Fee (2.5%)'}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#0B0B0F]">{jobTitle}</h4>
            </div>

            {/* Amount Breakdown Surface */}
            <div className="p-4 rounded-[12px] bg-[#0B0B0F] text-white space-y-3">
              <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>Outstanding platform fee</span>
                <span className="text-[11px] text-[#C9DAF2]">One-time fee payment</span>
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular-nums flex items-baseline gap-2">
                <span>{due.outstanding}</span>
                <span className="text-sm font-normal text-[#9CA3AF]">{due.token}</span>
              </div>
              <div className="pt-2 border-t border-[#1F2937] flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>Estimated Polygon network gas:</span>
                <span className="text-white font-mono">~0.005–0.015 POL</span>
              </div>
            </div>

            {/* Verified Treasury Destination */}
            <div className="p-3 rounded-[10px] bg-white border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#4B5563]">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className="text-[#0047AB]" />
                  <span>Protocol Treasury Destination</span>
                </div>
                <a
                  href={getPolygonScanAddressUrl(treasuryAddr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0047AB] hover:underline inline-flex items-center gap-1"
                >
                  <span>Verify on PolygonScan</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#F6F7F9] font-mono text-xs text-[#0B0B0F]">
                <span>{truncateAddress(treasuryAddr)}</span>
                <button
                  type="button"
                  onClick={handleCopyTreasury}
                  className="text-[#6B7280] hover:text-[#0047AB] p-1 rounded transition-colors"
                  title="Copy treasury address"
                >
                  {copiedAddress ? <Check size={13} className="text-[#0047AB]" /> : <Copy size={13} />}
                </button>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                Direct on-chain transfer to the official PolyLance treasury multisig. No intermediate contracts or third-party custody.
              </p>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
