import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  feeBreakdown, 
  CLIENT_FEE_PERCENT, 
  FREELANCER_FEE_PERCENT, 
  TOTAL_PLATFORM_FEE_PERCENT 
} from '../../utils/fees';
import { formatAmount, toBaseUnits, getTokenDecimals } from '../../utils/formatAmount';
import { convertCryptoToFiat, useLiveCurrencyRates, useGlobalFiat } from '../../utils/currency';
import { getEngagementDisplayState } from '../../types/lifecycle';
import { NetworkFeeBlock } from './NetworkFeeBlock';
import { getPolygonScanTxUrl } from '../../utils/formatters';

export interface FeeBreakdownProps {
  budget: number | string | bigint;
  token?: string;
  className?: string;
  compact?: boolean;
  job?: any;
  isClient?: boolean;
  isFreelancer?: boolean;
  accountMode?: 'client' | 'freelancer' | 'both';
  actualTxHash?: string;
  actualGasUsedPol?: string;
}

export const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  budget,
  token = 'POL',
  className = '',
  compact = false,
  job,
  isClient = false,
  isFreelancer = false,
  accountMode = 'both',
  actualTxHash,
  actualGasUsedPol,
}) => {
  useLiveCurrencyRates();
  const [fiatCode] = useGlobalFiat();
  const [showHowFeesWork, setShowHowFeesWork] = useState(false);

  const tokenSymbol = (token || 'POL').toUpperCase() === 'MATIC' ? 'POL' : (token || 'POL').toUpperCase();
  const decimals = getTokenDecimals(tokenSymbol);

  // Compute fee breakdown in strict BigInt - memoized
  const budgetUnits = useMemo(() => toBaseUnits(budget, decimals), [budget, decimals]);
  const breakdown = useMemo(() => feeBreakdown(budgetUnits, tokenSymbol), [budgetUnits, tokenSymbol]);

  // Format all numbers using formatAmount - memoized
  const budgetFmt = useMemo(() => formatAmount(breakdown.budget, tokenSymbol), [breakdown.budget, tokenSymbol]);
  const clientFeeFmt = useMemo(() => formatAmount(breakdown.clientFee, tokenSymbol), [breakdown.clientFee, tokenSymbol]);
  const freelancerFeeFmt = useMemo(() => formatAmount(breakdown.freelancerFee, tokenSymbol), [breakdown.freelancerFee, tokenSymbol]);
  const clientDepositFmt = useMemo(() => formatAmount(breakdown.clientDeposit, tokenSymbol), [breakdown.clientDeposit, tokenSymbol]);
  const freelancerNetFmt = useMemo(() => formatAmount(breakdown.freelancerNet, tokenSymbol), [breakdown.freelancerNet, tokenSymbol]);
  const platformTotalFmt = useMemo(() => formatAmount(breakdown.platformTotal, tokenSymbol), [breakdown.platformTotal, tokenSymbol]);

  // Determine initial role view
  const getInitialRole = (): 'freelancer' | 'client' => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('polylance_fee_role_view');
      if (saved === 'freelancer' || saved === 'client') return saved;
    }
    if (isClient || accountMode === 'client') return 'client';
    return 'freelancer';
  };

  const [roleView, setRoleView] = useState<'freelancer' | 'client'>(getInitialRole);

  useEffect(() => {
    if (isClient) {
      setRoleView('client');
    }
  }, [isClient]);

  const handleRoleToggle = (view: 'freelancer' | 'client') => {
    setRoleView(view);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('polylance_fee_role_view', view);
      } catch {}
    }
  };

  // Status-honest chip logic derived from getEngagementDisplayState()
  const statusChip = useMemo(() => {
    let chip = {
      label: 'Estimate',
      classes: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
      isSettled: false,
      isHeldInEscrow: false,
    };

    if (job) {
      const display = getEngagementDisplayState(job);
      const isFunded =
        job.status === 'Funded' ||
        job.status === 'Submitted' ||
        job.status === 'In Progress' ||
        job.status === 'Approved' ||
        (job as any).escrowStatus === 'FUNDED' ||
        Boolean(job.events?.some((e: any) => (e.step === 'Funded' || e.step === 'EscrowFunded') && (e.status === 'completed' || e.status === 'CONFIRMED')));

      if (display.isCompleted) {
        chip = {
          label: 'Settled',
          classes: 'bg-[#EFF6FF] text-[#0047AB] border-[#BFDBFE]',
          isSettled: true,
          isHeldInEscrow: false,
        };
      } else if (isFunded) {
        chip = {
          label: 'Held in escrow',
          classes: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
          isSettled: false,
          isHeldInEscrow: true,
        };
      }
    }
    return chip;
  }, [job]);

  // Fiat equivalents - strictly memoized
  const freelancerNetNominal = useMemo(() => parseFloat(freelancerNetFmt.fullPrecision) || 0, [freelancerNetFmt.fullPrecision]);
  const clientDepositNominal = useMemo(() => parseFloat(clientDepositFmt.fullPrecision) || 0, [clientDepositFmt.fullPrecision]);
  
  const freelancerFiat = useMemo(() => {
    const { formatted } = convertCryptoToFiat(freelancerNetNominal, tokenSymbol, fiatCode);
    return formatted;
  }, [freelancerNetNominal, tokenSymbol, fiatCode]);

  const clientFiat = useMemo(() => {
    const { formatted } = convertCryptoToFiat(clientDepositNominal, tokenSymbol, fiatCode);
    return formatted;
  }, [clientDepositNominal, tokenSymbol, fiatCode]);

  if (compact) {
    return (
      <div className={`text-xs space-y-2 p-3 rounded-[10px] border border-[#E5E7EB] bg-[#FFFFFF] ${className}`}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <span className="font-semibold text-xs text-[#0B0B0F]">Payment breakdown</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border ${statusChip.classes}`}>
            {statusChip.label}
          </span>
        </div>

        {/* Toggle */}
        <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-[6px] text-[11px] font-medium" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={roleView === 'freelancer'}
            onClick={() => handleRoleToggle('freelancer')}
            className={`flex-1 py-1 text-center rounded-[4px] transition-colors cursor-pointer ${
              roleView === 'freelancer' ? 'bg-white text-[#0B0B0F] shadow-xs font-semibold' : 'text-[#64748B] hover:text-[#0B0B0F]'
            }`}
          >
            As freelancer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={roleView === 'client'}
            onClick={() => handleRoleToggle('client')}
            className={`flex-1 py-1 text-center rounded-[4px] transition-colors cursor-pointer ${
              roleView === 'client' ? 'bg-white text-[#0B0B0F] shadow-xs font-semibold' : 'text-[#64748B] hover:text-[#0B0B0F]'
            }`}
          >
            As client
          </button>
        </div>

        {roleView === 'freelancer' ? (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[#64748B]">
              <span>Job budget:</span>
              <span className="tabular-nums text-[#0B0B0F]">{budgetFmt.formatted} {tokenSymbol}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Platform service fee ({FREELANCER_FEE_PERCENT}%):</span>
              <span className="tabular-nums text-[#475569]">−{freelancerFeeFmt.formatted} {tokenSymbol}</span>
            </div>
            <div className="border-t border-[#E5E7EB] pt-1.5 flex justify-between font-semibold text-[#0B0B0F]">
              <span>You receive:</span>
              <span className="tabular-nums text-[#0047AB]">{freelancerNetFmt.formatted} {tokenSymbol}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[#64748B]">
              <span>Job budget:</span>
              <span className="tabular-nums text-[#0B0B0F]">{budgetFmt.formatted} {tokenSymbol}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Service fee ({CLIENT_FEE_PERCENT}%):</span>
              <span className="tabular-nums text-[#475569]">+{clientFeeFmt.formatted} {tokenSymbol}</span>
            </div>
            <div className="border-t border-[#E5E7EB] pt-1.5 flex justify-between font-semibold text-[#0B0B0F]">
              <span>Total deposit:</span>
              <span className="tabular-nums text-[#0047AB]">{clientDepositFmt.formatted} {tokenSymbol}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-[12px] border border-[#E5E7EB] bg-[#FFFFFF] space-y-3.5 ${className}`}>
      {/* Header with Status-Honest Chip and Segmented Control */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
        <div>
          <h4 className="text-sm font-semibold text-[#0B0B0F]">Payment breakdown</h4>
          <span className="text-[11px] text-[#64748B]">
            {roleView === 'freelancer' ? 'Earnings calculation' : 'Deposit calculation'}
          </span>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-[4px] border ${statusChip.classes}`}>
          {statusChip.label}
        </span>
      </div>

      {/* Role Segmented Toggle */}
      <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-[8px] text-xs font-medium" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={roleView === 'freelancer'}
          onClick={() => handleRoleToggle('freelancer')}
          className={`flex-1 py-1.5 text-center rounded-[6px] transition-all cursor-pointer ${
            roleView === 'freelancer'
              ? 'bg-white text-[#0B0B0F] shadow-xs font-semibold'
              : 'text-[#64748B] hover:text-[#0B0B0F]'
          }`}
        >
          As freelancer
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={roleView === 'client'}
          onClick={() => handleRoleToggle('client')}
          className={`flex-1 py-1.5 text-center rounded-[6px] transition-all cursor-pointer ${
            roleView === 'client'
              ? 'bg-white text-[#0B0B0F] shadow-xs font-semibold'
              : 'text-[#64748B] hover:text-[#0B0B0F]'
          }`}
        >
          As client
        </button>
      </div>

      {/* FREELANCER VIEW (Strictly Additive / Subtractive Math) */}
      {roleView === 'freelancer' ? (
        <div className="space-y-3">
          {/* Headline Amount */}
          <div className="bg-[#F8FAFC] p-3 rounded-[10px] border border-[#E2E8F0]">
            <span className="text-xs text-[#64748B] block font-medium">You receive</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#0047AB] tabular-nums font-sans">
                {freelancerNetFmt.formatted}
              </span>
              <span className="text-sm font-semibold text-[#475569]">{tokenSymbol}</span>
            </div>
            <span className="text-xs text-[#64748B] tabular-nums block mt-0.5">
              {freelancerFiat}
            </span>
          </div>

          {/* Additive Line Items */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#475569]">
              <span>Job budget</span>
              <span className="tabular-nums font-medium text-[#0B0B0F]">
                {budgetFmt.formatted} {tokenSymbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#475569]">
              <span>PolyLance service fee ({FREELANCER_FEE_PERCENT}%)</span>
              <span className="tabular-nums font-medium text-[#475569]">
                −{freelancerFeeFmt.formatted} {tokenSymbol}
              </span>
            </div>

            <div className="border-t border-[#E5E7EB] pt-2 flex items-center justify-between font-semibold text-[#0B0B0F] text-sm">
              <span>You receive</span>
              <span className="tabular-nums font-bold text-[#0047AB]">
                {freelancerNetFmt.formatted} {tokenSymbol}
              </span>
            </div>
          </div>

          {/* Calming Truth Note */}
          <div className="text-[11px] text-[#64748B] pt-1 border-t border-[#E5E7EB]/80 leading-relaxed">
            Paid directly from escrow when the client approves your work. You don't need POL to receive payment.
          </div>
        </div>
      ) : (
        /* CLIENT VIEW (Strictly Additive Deposit Math) */
        <div className="space-y-3">
          {/* Headline Amount */}
          <div className="bg-[#F8FAFC] p-3 rounded-[10px] border border-[#E2E8F0]">
            <span className="text-xs text-[#64748B] block font-medium">You deposit</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#0047AB] tabular-nums font-sans">
                {clientDepositFmt.formatted}
              </span>
              <span className="text-sm font-semibold text-[#475569]">{tokenSymbol}</span>
            </div>
            <span className="text-xs text-[#64748B] tabular-nums block mt-0.5">
              {clientFiat}
            </span>
          </div>

          {/* Additive Line Items */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#475569]">
              <span>Job budget</span>
              <span className="tabular-nums font-medium text-[#0B0B0F]">
                {budgetFmt.formatted} {tokenSymbol}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#475569]">
              <span>Service fee ({CLIENT_FEE_PERCENT}%)</span>
              <span className="tabular-nums font-medium text-[#475569]">
                +{clientFeeFmt.formatted} {tokenSymbol}
              </span>
            </div>

            <div className="border-t border-[#E5E7EB] pt-2 flex items-center justify-between font-semibold text-[#0B0B0F] text-sm">
              <span>Total deposit</span>
              <span className="tabular-nums font-bold text-[#0047AB]">
                {clientDepositFmt.formatted} {tokenSymbol}
              </span>
            </div>
          </div>

          {/* Secondary Freelancer Note */}
          <p className="text-[11px] text-[#64748B] pt-1 border-t border-[#E5E7EB]/80 leading-relaxed">
            The freelancer receives {freelancerNetFmt.formatted} {tokenSymbol} after their {FREELANCER_FEE_PERCENT}% platform fee upon work approval.
          </p>

          {/* Network Fee Estimation Block for Client */}
          {!statusChip.isSettled && (
            <NetworkFeeBlock
              actionKey={tokenSymbol === 'POL' ? 'fundNative' : 'fundUsdc'}
              isErc20={tokenSymbol !== 'POL'}
              tokenSymbol={tokenSymbol}
            />
          )}
        </div>
      )}

      {/* Accessible "How fees work" Disclosure (Common to both Freelancer and Client modes) */}
      <div className="pt-1 border-t border-[#E5E7EB]/80">
        <button
          type="button"
          id="how-fees-work-trigger"
          aria-expanded={showHowFeesWork}
          aria-controls="how-fees-work-content"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowHowFeesWork((prev) => !prev);
          }}
          className="text-[11px] text-[#0047AB] hover:text-[#00388A] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0047AB]/30 rounded py-0.5"
        >
          <span>How fees work</span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 stroke-[2.2] ${showHowFeesWork ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {showHowFeesWork && (
            <motion.div
              id="how-fees-work-content"
              role="region"
              aria-labelledby="how-fees-work-trigger"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 p-3.5 bg-[#F8FAFC] rounded-[10px] border border-[#E2E8F0] text-[11px] text-[#475569] space-y-2 leading-relaxed">
                <p>
                  <strong className="text-[#0B0B0F]">Platform service fee ({FREELANCER_FEE_PERCENT}%):</strong> The platform fee is {FREELANCER_FEE_PERCENT}% of the job budget ({freelancerFeeFmt.formatted} {tokenSymbol}), deducted automatically from escrow when the client approves the work. Freelancers receive the budget minus this fee ({freelancerNetFmt.formatted} {tokenSymbol}).
                </p>
                <p>
                  <strong className="text-[#0B0B0F]">Client deposit fee ({CLIENT_FEE_PERCENT}%):</strong> The client pays the job budget ({budgetFmt.formatted} {tokenSymbol}) plus a {CLIENT_FEE_PERCENT}% platform deposit fee (+{clientFeeFmt.formatted} {tokenSymbol}) for a total escrow deposit of {clientDepositFmt.formatted} {tokenSymbol}. PolyLance receives {TOTAL_PLATFORM_FEE_PERCENT}% in total ({platformTotalFmt.formatted} {tokenSymbol}) into the timelocked protocol treasury to support automated oracle verification and decentralized dispute arbitration.
                </p>
                <p>
                  <strong className="text-[#0B0B0F]">Network gas:</strong> Polygon transaction gas is paid entirely to Polygon PoS validators in POL by whoever submits a transaction. PolyLance does not receive any network fees.
                </p>
                <div className="pt-1.5 border-t border-[#E2E8F0] text-[#047857] font-medium flex items-center gap-1">
                  <span>✓ Freelancers do not need POL to receive payment.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmed Receipt Mode (After Settlement) */}
      {statusChip.isSettled && (
        <div className="p-3 bg-[#EFF6FF]/60 border border-[#BFDBFE] rounded-[10px] space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#0047AB]">
            <ShieldCheck size={14} />
            <span>Escrow Settled & Verified</span>
          </div>
          <p className="text-[11px] text-[#475569] leading-relaxed">
            Funds have been disbursed on-chain. Platform fees were routed to the PolyLance timelocked treasury.
          </p>
          {actualTxHash && (
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">Settlement transaction:</span>
              <a
                href={getPolygonScanTxUrl(actualTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0047AB] hover:underline flex items-center gap-1 font-mono"
              >
                <span>{actualTxHash.slice(0, 10)}...</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}
          {actualGasUsedPol && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">Actual network fee paid:</span>
              <span className="tabular-nums font-medium text-[#0B0B0F]">{actualGasUsedPol} POL</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeeBreakdown;
