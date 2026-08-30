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
    <div className="relative bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-100/90 my-1.5 font-sans w-full max-w-md">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#F5EBFF] text-[#9333EA] flex items-center justify-center shrink-0">
            {proposal.isFinalCall ? (
              <Zap size={16} className="text-[#9333EA]" />
            ) : (
              <Sparkles size={16} className="text-[#9333EA]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-sans leading-tight truncate">
              {proposal.isFinalCall ? 'Final Call Offer' : `${proposal.proposedBy} Terms Proposal`}
            </h3>
            <p className="text-[10px] text-slate-500 font-sans truncate">
              Sent by {proposal.proposedBy}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {proposal.status === 'Pending' ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5EBFF] text-[#9333EA] text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
            <Clock size={11} className="text-[#9333EA]" />
            <span>PENDING</span>
          </div>
        ) : proposal.status === 'Accepted' ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
            <CheckCircle2 size={11} className="text-emerald-600" />
            <span>ACCEPTED</span>
          </div>
        ) : proposal.status === 'Rejected' ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
            <XCircle size={11} className="text-rose-600" />
            <span>DECLINED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0">
            <Scale size={11} className="text-slate-600" />
            <span>COUNTERED</span>
          </div>
        )}
      </div>

      <div className="border-b border-slate-100 my-1.5" />

      {/* 2-Column Metrics Box */}
      <div className="grid grid-cols-2 gap-2 my-2">
        {/* Left Metric: PROPOSED BUDGET */}
        <div className="bg-[#FAF9FD] rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5EBFF] text-[#9333EA] flex items-center justify-center shrink-0">
              <Wallet size={15} className="text-[#9333EA]" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider block truncate">
                PROPOSED BUDGET
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black text-slate-900 font-headline leading-tight">
                  ${numAmount.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-slate-500">USDC</span>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-[#F5EEFF] py-1 px-2 rounded-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9333EA] shrink-0" />
            <span className="text-[9.5px] font-mono font-bold text-[#9333EA] truncate">
              Net payout: ${netPayout.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right Metric: DELIVERY TARGET */}
        <div className="bg-[#FAF9FD] rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
              <Target size={15} className="text-[#0284C7]" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider block truncate">
                DELIVERY TARGET
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black text-slate-900 font-headline leading-tight">
                  {proposal.deadlineDays}
                </span>
                <span className="text-[10px] font-bold text-slate-500">Days</span>
              </div>
            </div>
          </div>

          <div className="mt-2 bg-[#E0F2FE]/70 py-1 px-2 rounded-lg flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[#0284C7] shrink-0" />
            <span className="text-[9.5px] font-sans font-bold text-[#0369A1] truncate">
              Review SLA Included
            </span>
          </div>
        </div>
      </div>

      {/* Note / Scope description */}
      {proposal.note && (
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-sans italic my-1.5">
          "{proposal.note}"
        </div>
      )}

      {/* Response Note Display */}
      {proposal.responseNote && (
        <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-200 text-[11px] text-rose-800 font-sans my-1.5">
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
                    className="w-full py-2 px-2 rounded-xl bg-[#059669] hover:bg-[#047857] active:scale-[0.98] text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 size={13} className="text-white shrink-0" />
                    <span>Accept</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onCounterOffer(proposal)}
                    className="w-full py-2 px-1 rounded-xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#E9D5FF] text-[#7E22CE] font-bold text-[11px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Scale size={13} className="text-[#7E22CE] shrink-0" />
                    <span>Counter</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setShowRejectInput(true)}
                    className="w-full py-2 px-2 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] text-[#E11D48] font-bold text-[11px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <XCircle size={13} className="text-[#E11D48] shrink-0" />
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
                    className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-xs font-sans text-slate-800 outline-none focus:ring-2 focus:ring-rose-200"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-mono font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-mono font-bold cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-1 mt-1">
              <span className="text-[10.5px] font-mono text-purple-700 font-bold flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                Awaiting {proposal.proposedBy === 'Freelancer' ? 'Client' : 'Freelancer'} review...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
