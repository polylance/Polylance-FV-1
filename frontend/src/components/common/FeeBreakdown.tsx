import React from 'react';
import { calculateFeeBreakdown } from '../../utils/formatters';
import { Amount } from './Amount';

export interface FeeBreakdownProps {
  budget: number | string;
  token?: string;
  className?: string;
  compact?: boolean;
}

export const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  budget,
  token = 'POL',
  className = '',
  compact = false
}) => {
  const {
    budget: bVal,
    platformFee,
    clientDeposit,
    freelancerReceives,
    tokenSymbol
  } = calculateFeeBreakdown(budget, token);

  if (compact) {
    return (
      <div className={`text-xs space-y-1.5 p-3 rounded-[8px] border border-[#E5E7EB] bg-[#F6F7F9] ${className}`}>
        <div className="flex items-center justify-between text-[#4B5563]">
          <span>Job budget:</span>
          <Amount value={bVal} token={tokenSymbol} size="sm" />
        </div>
        <div className="flex items-center justify-between text-[#4B5563]">
          <span>Platform fee (2.5%):</span>
          <Amount value={platformFee} token={tokenSymbol} size="sm" />
        </div>
        <div className="border-t border-[#E5E7EB] pt-1.5 flex items-center justify-between font-medium text-[#0B0B0F]">
          <span>Client deposit (+2.5%):</span>
          <Amount value={clientDeposit} token={tokenSymbol} size="sm" />
        </div>
        <div className="flex items-center justify-between font-medium text-[#0B0B0F]">
          <span>Freelancer receives (-2.5%):</span>
          <Amount value={freelancerReceives} token={tokenSymbol} size="sm" />
        </div>
        <div className="text-[11px] text-[#4B5563] pt-1 border-t border-[#E5E7EB]/60">
          Client pays +2.5% · Freelancer receives 2.5% less
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-[12px] border border-[#E5E7EB] bg-[#FFFFFF] space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
        <h4 className="text-sm font-semibold text-[#0B0B0F]">Escrow Fee Breakdown</h4>
        <span className="text-xs text-[#0047AB] font-medium">Smart contract settled</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between text-[#4B5563]">
          <span>Job budget</span>
          <Amount value={bVal} token={tokenSymbol} size="sm" />
        </div>

        <div className="flex items-center justify-between text-[#4B5563]">
          <span>Platform fee (2.5%)</span>
          <Amount value={platformFee} token={tokenSymbol} size="sm" />
        </div>

        <div className="border-t border-[#E5E7EB] pt-2 flex items-center justify-between font-medium text-[#0B0B0F]">
          <span>Total client deposit</span>
          <Amount value={clientDeposit} token={tokenSymbol} size="md" />
        </div>

        <div className="flex items-center justify-between font-medium text-[#0B0B0F]">
          <span>Freelancer receives</span>
          <Amount value={freelancerReceives} token={tokenSymbol} size="md" />
        </div>
      </div>

      <div className="text-xs text-[#4B5563] pt-2 border-t border-[#E5E7EB] bg-[#F6F7F9] -mx-4 -mb-4 p-3 rounded-b-[12px]">
        Client pays +2.5% · Freelancer receives 2.5% less
      </div>
    </div>
  );
};

export default FeeBreakdown;
