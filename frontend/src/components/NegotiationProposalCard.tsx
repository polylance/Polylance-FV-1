import React, { useState } from 'react';
import { NegotiationProposal } from '../types';
import { Sparkles, Clock, CheckCircle2, XCircle, Zap, ShieldCheck, Wallet, Target, Scale } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NegotiationProposalCardProps {
  proposal: NegotiationProposal;
  currentUserRole: 'Client' | 'Freelancer' | 'Judge' | 'Admin' | 'visitor';
  onAccept: (proposalId: string) => Promise<void> | void;
  onReject: (proposalId: string, reason: string) => Promise<void> | void;
  onCounterOffer: (proposal: NegotiationProposal) => void;
}

export const NegotiationProposalCard: React.FC<NegotiationProposalCardProps> = ({
  proposal,
  currentUserRole,
  onAccept,
  onReject,
  onCounterOffer,
}) => {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const numAmount = parseFloat(proposal.amountUsdc || '0');
  const netPayout = numAmount * 0.975;
  const isRecipient =
    (currentUserRole === 'Client' && proposal.proposedBy === 'Freelancer') ||
    (currentUserRole === 'Freelancer' && proposal.proposedBy === 'Client');

  const handleAcceptClick = async () => {
    setIsProcessing(true);
    try {
      await onAccept(proposal.id);
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await onReject(proposal.id, rejectReason.trim());
      setShowRejectInput(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative bg-white rounded-2xl p-3 sm:p-3.5 shadow-xs border border-[#E2E6EC] my-1.5 font-sans w-full max-w-md">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center shrink-0">
            {proposal.isFinalCall ? (
              <Zap size={16} className="text-[#0047AB]" />
            ) : (
              <Sparkles size={16} className="text-[#0047AB]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-[#0B0B0C] font-sans leading-tight truncate">
              {proposal.isFinalCall ? 'Final Call Offer' : `${proposal.proposedBy} Terms Proposal`}
            </h3>
            <p className="text-[10px] text-[#4B5563] font-sans truncate">
              Sent by {proposal.proposedBy}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {proposal.status === 'Pending' ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FCEBDD] text-[#C2610C] border border-[#C2610C]/30 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
            <Clock size={11} className="text-[#C2610C]" />
            <span>PENDING</span>
          </div>
        ) : proposal.status === 'Accepted' ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E3F3EA] text-[#1E8449] border border-[#1E8449]/30 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
            <CheckCircle2 size={11} className="text-[#1E8449]" />
            <span>ACCEPTED</span>
          </div>
        ) : proposal.status === 'Rejected' ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAE4E1] text-[#C0392B] border border-[#C0392B]/30 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
            <XCircle size={11} className="text-[#C0392B]" />
            <span>DECLINED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDF0F4] text-[#334155] border border-[#E2E6EC] text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
            <Scale size={11} className="text-[#334155]" />
            <span>COUNTERED</span>
          </div>
        )}
      </div>

      <div className="border-b border-[#E2E6EC] my-1.5" />

      {/* 2-Column Metrics Box */}
      <div className="grid grid-cols-2 gap-2 my-2">
        {/* Left Metric: PROPOSED BUDGET */}
        <div className="bg-[#F4F6F9] rounded-xl p-2.5 border border-[#E2E6EC] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center shrink-0">
              <Wallet size={15} className="text-[#0047AB]" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-mono font-bold text-[#8892A0] tracking-wider block truncate">
                PROPOSED BUDGET
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black text-[#0B0B0C] font-headline leading-tight">
                  ${numAmount.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-[#4B5563]">USDC</span>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-white py-1 px-2 rounded-lg border border-[#E2E6EC] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB] shrink-0" />
            <span className="text-[9.5px] font-mono font-bold text-[#0047AB] truncate">
              Net payout: ${netPayout.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right Metric: DELIVERY TARGET */}
        <div className="bg-[#F4F6F9] rounded-xl p-2.5 border border-[#E2E6EC] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E7EEF9] text-[#0047AB] flex items-center justify-center shrink-0">
              <Target size={15} className="text-[#0047AB]" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-mono font-bold text-[#8892A0] tracking-wider block truncate">
                DELIVERY TARGET
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black text-[#0B0B0C] font-headline leading-tight">
                  {proposal.deadlineDays}
                </span>
                <span className="text-[10px] font-bold text-[#4B5563]">Days</span>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-white py-1 px-2 rounded-lg border border-[#E2E6EC] flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[#0047AB] shrink-0" />
            <span className="text-[9.5px] font-sans font-bold text-[#0047AB] truncate">
              Review SLA Included
            </span>
          </div>
        </div>
      </div>

      {/* Note / Scope description */}
      {proposal.note && (
        <div className="p-2 rounded-lg bg-[#F4F6F9] border border-[#E2E6EC] text-[11px] text-[#4B5563] font-sans italic my-1.5">
          "{proposal.note}"
        </div>
      )}

      {/* Response Note Display */}
      {proposal.responseNote && (
        <div className="p-2 rounded-lg bg-[#FAE4E1] border border-[#C0392B]/30 text-[11px] text-[#C0392B] font-sans my-1.5">
          <strong>Response:</strong> "{proposal.responseNote}"
        </div>
      )}

      {/* Interactive Action Buttons for Pending Proposals */}
      {proposal.status === 'Pending' && (
        <div className="pt-1">
          {isRecipient ? (
            <>
              {!showRejectInput ? (
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleAcceptClick}
                    className="w-full py-2 px-2 rounded-xl bg-[#1E8449] hover:bg-[#186A3B] text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 size={13} className="text-white shrink-0" />
                    <span>Accept</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onCounterOffer(proposal)}
                    className="w-full py-2 px-1 rounded-xl bg-white hover:bg-[#F4F6F9] border border-[#E2E6EC] text-[#0B0B0C] font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Scale size={13} className="text-[#0B0B0C] shrink-0" />
                    <span>Counter</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setShowRejectInput(true)}
                    className="w-full py-2 px-2 rounded-xl bg-[#FAE4E1] hover:bg-[#FAE4E1]/80 border border-[#C0392B]/30 text-[#C0392B] font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <XCircle size={13} className="text-[#C0392B] shrink-0" />
                    <span>Decline</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRejectSubmit} className="space-y-2 mt-2">
                  <input
                    type="text"
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Quick decline reason..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E6EC] bg-white text-xs font-sans text-[#0B0B0C] outline-none focus:border-[#0047AB]"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="px-2.5 py-1 rounded-lg border border-[#E2E6EC] text-[#4B5563] text-[11px] font-mono font-bold hover:bg-[#F4F6F9] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-2.5 py-1 rounded-lg bg-[#C0392B] hover:bg-[#A93226] text-white text-[11px] font-mono font-bold cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-1 mt-1">
              <span className="text-[10.5px] font-mono text-[#4B5563] font-bold flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
                Awaiting {proposal.proposedBy === 'Freelancer' ? 'Client' : 'Freelancer'} review...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
