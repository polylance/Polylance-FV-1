import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Award,
  ExternalLink,
  ShieldCheck,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { Job } from '../types';
import { getPolygonScanUrl, getPolygonScanAddressUrl, truncateAddress, getDeterministicSbtId } from '../utils/formatters';
import { CertificateMintPanel } from './certificate/CertificateMintPanel';
import { CONTRACTS } from '../config/contracts';
import { scrollToSection } from '../utils/scroll';
import { Modal } from './overlay/Modal';
import { Button } from './common/Button';
import { Amount } from './common/Amount';
import { AddressChip } from './common/AddressChip';
import { calculateFeeBreakdownFromString } from '../utils/fees';

export interface PaymentReleasedModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  txHash?: string;
  onViewAttestation?: () => void | Promise<void>;
}

export const PaymentReleasedModal: React.FC<PaymentReleasedModalProps> = ({
  isOpen,
  onClose,
  job,
  txHash,
}) => {
  const navigate = useNavigate();
  const [showMintPanel, setShowMintPanel] = useState(false);

  // Extract financial details using pure BigInt feeBreakdown
  const tokenSymbol = job.paymentTokenSymbol || (job.amountEth ? 'POL' : 'USDC');
  const budgetString = job.negotiatedAmount || (job as any).budget || job.amountEth || job.amountUsdc || '0';
  const feeDetails = calculateFeeBreakdownFromString(budgetString, tokenSymbol);

  const explorerUrl = txHash
    ? getPolygonScanUrl(txHash)
    : job.contractAddress
    ? getPolygonScanAddressUrl(job.contractAddress)
    : '#';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="md"
        title="Payment Released Successfully"
        description="Escrow vault funds have been disbursed on-chain and Soulbound reputation attestations issued."
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#6B7280] font-mono">
              Settled on Polygon
            </span>
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  onClose();
                  scrollToSection('deliverable-workspace');
                }}
              >
                Back to workspace
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  navigate(`/attestation/${job.id}`);
                }}
                icon={<Award size={15} />}
              >
                View certificate (SBT)
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Header Badge */}
          <div className="p-4 rounded-[12px] bg-[#EAF1FB] border border-[#C9DAF2] text-center space-y-1.5">
            <div className="w-12 h-12 rounded-full bg-white border border-[#C9DAF2] text-[#0047AB] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-xs font-semibold text-[#0047AB]">
              On-Chain Settlement Confirmed
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#0B0B0F] tabular-nums tracking-tight">
              +{feeDetails.freelancerNetFormatted} {tokenSymbol}
            </div>
            <p className="text-xs text-[#4B5563]">
              Net payout disbursed directly to freelancer wallet
            </p>
          </div>

          {/* Breakdown Card */}
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white divide-y divide-[#E5E7EB] text-xs">
            <div className="p-3 flex justify-between items-center">
              <span className="text-[#4B5563]">Total escrow vault:</span>
              <span className="font-semibold text-[#0B0B0F] tabular-nums">
                {feeDetails.budgetFormatted} {tokenSymbol}
              </span>
            </div>
            <div className="p-3 flex justify-between items-center text-[#4B5563]">
              <span>PolyLance protocol fee (2.5%):</span>
              <span className="font-semibold text-rose-600 tabular-nums">
                -{feeDetails.freelancerFeeFormatted} {tokenSymbol}
              </span>
            </div>
            <div className="p-3 flex justify-between items-center bg-[#F6F7F9] font-medium">
              <span className="text-[#0B0B0F]">Net disbursed to freelancer (97.5%):</span>
              <span className="font-bold text-[#0047AB] tabular-nums">
                +{feeDetails.freelancerNetFormatted} {tokenSymbol}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 px-1">
            Network transaction gas was paid to Polygon validators to confirm the block on-chain.
          </div>

          {/* Dual SBT Attestations Minted */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[#4B5563]">
              <span>Dual Soulbound Attestations Minted</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAF1FB] text-[#0047AB] font-semibold">
                ERC-5192 Soulbound
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Talent SBT */}
              <div className="p-3 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award size={14} className="text-[#0047AB]" />
                    <span className="text-xs font-semibold text-[#0B0B0F]">Talent Proof of Work</span>
                  </div>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-white border border-[#E5E7EB] font-mono text-[#0047AB] font-semibold">
                    +1 SBT
                  </span>
                </div>
                {job.freelancer && <AddressChip address={job.freelancer} truncate />}
              </div>

              {/* Client SBT */}
              <div className="p-3 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#0047AB]" />
                    <span className="text-xs font-semibold text-[#0B0B0F]">Client Escrow Patron</span>
                  </div>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-white border border-[#E5E7EB] font-mono text-[#0047AB] font-semibold">
                    +1 SBT
                  </span>
                </div>
                {job.client && <AddressChip address={job.client} truncate />}
              </div>
            </div>
          </div>

          {/* Explorer Link */}
          {explorerUrl !== '#' && (
            <div className="text-center pt-1">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#0047AB] hover:underline"
              >
                <span>Verify settlement on PolygonScan</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </Modal>

      {showMintPanel && (
        <Modal
          isOpen={showMintPanel}
          onClose={() => setShowMintPanel(false)}
          maxWidth="lg"
          title="Soulbound Token Details"
        >
          <CertificateMintPanel
            tokenId={job.sbtTokenId || getDeterministicSbtId(job.id)}
            jobTitle={job.title}
            recipientAddress={job.freelancer || ''}
            clientAddress={job.client || ''}
            amount={parseFloat(feeDetails.freelancerNetFormatted) || 0}
            tokenSymbol={tokenSymbol}
            completedAt={job.completedAt || Date.now()}
            variant="work"
            contractAddress={CONTRACTS.ReputationSBT}
            onClose={() => setShowMintPanel(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default PaymentReleasedModal;
