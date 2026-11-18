import React, { useState } from 'react';
import { Clock, Send, AlertCircle } from 'lucide-react';
import { Modal } from './overlay/Modal';
import { Button } from './common/Button';
import { feeBreakdown, CLIENT_FEE_PERCENT, FREELANCER_FEE_PERCENT } from '../utils/fees';
import { normalizeTokenSymbol, formatTokenDecimals } from '../lib/amounts/getJobAmounts';
import { toBaseUnits, getTokenDecimals } from '../utils/formatAmount';
import { convertCryptoToFiat, useGlobalFiat, useLiveCurrencyRates } from '../utils/currency';

export interface NegotiationProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amountUsdc: string, deadlineDays: number, note: string, isFinalCall: boolean) => Promise<void>;
  role: 'Client' | 'Freelancer';
  token?: string;
  currentAmountUsdc?: string;
  currentDeadlineDays?: number;
  counterpartName?: string;
  initialIsFinalCall?: boolean;
}

export const NegotiationProposalModal: React.FC<NegotiationProposalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
  token: rawToken = 'POL',
  currentAmountUsdc = '1000',
  currentDeadlineDays = 7,
  counterpartName = 'the other party',
  initialIsFinalCall = false,
}) => {
  useLiveCurrencyRates();
  const [fiatCode] = useGlobalFiat();
  const token = normalizeTokenSymbol(rawToken);
  const decimals = getTokenDecimals(token);

  const [amountUsdc, setAmountUsdc] = useState(currentAmountUsdc);
  const [deadlineDays, setDeadlineDays] = useState(currentDeadlineDays.toString());
  const [note, setNote] = useState('');
  const [isFinalCall, setIsFinalCall] = useState(initialIsFinalCall);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const numAmount = parseFloat(amountUsdc) || 0;
  const units = toBaseUnits(amountUsdc || '0', decimals);
  const breakdown = feeBreakdown(units, token);
  const formattedBudget = formatTokenDecimals(breakdown.budget, decimals);
  const formattedNet = formatTokenDecimals(breakdown.freelancerNet, decimals);
  const formattedDeposit = formatTokenDecimals(breakdown.clientDeposit, decimals);
  const formattedClientFee = formatTokenDecimals(breakdown.clientFee, decimals);
  const formattedFreelancerFee = formatTokenDecimals(breakdown.freelancerFee, decimals);

  const netFiat = convertCryptoToFiat(parseFloat(formattedNet) || 0, token, fiatCode).formatted;
  const depositFiat = convertCryptoToFiat(parseFloat(formattedDeposit) || 0, token, fiatCode).formatted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const val = parseFloat(amountUsdc);
    if (isNaN(val) || val <= 0) {
      setValidationError(`Please enter a valid budget amount above 0 ${token}.`);
      return;
    }

    const days = parseInt(deadlineDays, 10);
    if (isNaN(days) || days < 1 || days > 180) {
      setValidationError('Please enter a timeline between 1 and 180 days.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(amountUsdc, days, note.trim(), isFinalCall);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFreelancer = role === 'Freelancer';

  const heading = isFinalCall
    ? 'Final Terms Proposal'
    : isFreelancer
    ? 'Propose Price & Timeline'
    : 'Make an Offer';

  const subheading = isFinalCall
    ? `Final proposal for ${counterpartName} without further counters.`
    : isFreelancer
    ? `Submit your rate and timeline for ${counterpartName} to review.`
    : `Send a counter-offer to ${counterpartName}.`;

  const amountLabel = isFreelancer ? `Asking price (${token})` : `Offered budget (${token})`;
  const timelineLabel = isFreelancer ? 'Estimated delivery (days)' : 'Required timeline (days)';
  const noteLabel = isFreelancer
    ? 'Scope notes (optional)'
    : 'Additional notes (optional)';
  const notePlaceholder = isFreelancer
    ? 'e.g. Includes full frontend integration, revisions, and test coverage'
    : 'e.g. Flexible on scope adjustments as needed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      isPending={isSubmitting}
      title={heading}
      description={subheading}
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={<Send size={14} />}
          >
            {isSubmitting ? 'Sending offer...' : isFinalCall ? 'Send final offer' : 'Send proposal'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Validation Error */}
        {validationError && (
          <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-[#DC2626]" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Budget */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#4B5563]">
            {amountLabel} <span className="text-[#991B1B]">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0.0001"
              required
              value={amountUsdc}
              onChange={(e) => setAmountUsdc(e.target.value)}
              placeholder="e.g. 10.00"
              className="w-full h-11 pl-3 pr-16 rounded-[10px] border border-[#E5E7EB] bg-white text-sm text-[#0B0B0F] tabular-nums focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB]"
              disabled={isSubmitting}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-mono font-medium text-[#6B7280]">
              {token}
            </div>
          </div>
          {numAmount > 0 && (
            <div className="flex flex-col gap-1 text-[11px] px-1 text-[#6B7280] pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span>
                  {isFreelancer ? 'You receive:' : 'Freelancer receives:'}{' '}
                  <strong className="text-[#0B0B0F] tabular-nums">{formattedNet} {token}</strong>
                  <span className="text-[10px] text-slate-500 ml-1">({netFiat})</span>
                </span>
                <span className="tabular-nums">Fee ({FREELANCER_FEE_PERCENT}%): −{formattedFreelancerFee} {token}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>
                  {isFreelancer ? 'Client deposits:' : 'Total you pay / deposit:'}{' '}
                  <strong className="text-[#0047AB] tabular-nums">{formattedDeposit} {token}</strong>
                  <span className="text-[10px] text-slate-500 ml-1">({depositFiat})</span>
                </span>
                <span className="tabular-nums">Fee ({CLIENT_FEE_PERCENT}%): +{formattedClientFee} {token}</span>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#4B5563]">
            {timelineLabel} <span className="text-[#991B1B]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
              <Clock size={15} />
            </div>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="180"
              required
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              placeholder="e.g. 7"
              className="w-full h-11 pl-8 pr-16 rounded-[10px] border border-[#E5E7EB] bg-white text-sm text-[#0B0B0F] tabular-nums focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB]"
              disabled={isSubmitting}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-mono font-medium text-[#6B7280]">
              DAYS
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#4B5563]">
            {noteLabel}
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={notePlaceholder}
            className="w-full p-3 rounded-[10px] border border-[#E5E7EB] bg-white text-xs text-[#0B0B0F] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB] resize-none leading-relaxed"
            disabled={isSubmitting}
          />
        </div>

        {/* Final Call Toggle */}
        <div
          onClick={() => !isSubmitting && setIsFinalCall(!isFinalCall)}
          className={`p-3 rounded-[10px] border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
            isFinalCall
              ? 'border-[#0047AB] bg-[#EAF1FB]'
              : 'border-[#E5E7EB] bg-[#F6F7F9]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="isFinalCallCheck"
              checked={isFinalCall}
              onChange={(e) => setIsFinalCall(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-[#E5E7EB] text-[#0047AB] focus:ring-[#0047AB] cursor-pointer"
              disabled={isSubmitting}
            />
            <div>
              <label htmlFor="isFinalCallCheck" className="text-xs font-semibold text-[#0B0B0F] cursor-pointer">
                This is my final offer
              </label>
              <p className="text-[11px] text-[#6B7280]">
                Mark as non-negotiable final proposal.
              </p>
            </div>
          </div>
          {isFinalCall && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-[#0047AB] border border-[#C9DAF2]">
              FINAL
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default NegotiationProposalModal;
