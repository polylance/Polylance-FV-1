import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  SendHorizontal,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ethers } from 'ethers';
import { Job, NegotiationTermVersion } from '../types';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { truncateAddress } from '../utils/formatters';
import { Modal } from './overlay';

interface NegotiationCardProps {
  job: Job;
  isClient: boolean;
  isFreelancer: boolean;
  onFundEscrow?: () => Promise<void>;
  isFundingEscrow?: boolean;
}

const MAX_ROUNDS = 6;

export const NegotiationCard: React.FC<NegotiationCardProps> = ({
  job,
  isClient,
  isFreelancer,
  onFundEscrow,
  isFundingEscrow = false,
}) => {
  const navigate = useNavigate();
  const {
    cancelSelection,
    proposeCounterOffer,
    respondToCounterOffer,
    acceptJobOffer,
    declineJobOffer,
  } = usePolyLanceData();

  // Dialog & Form states
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  const [isResponding, setIsResponding] = useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const [showTimeline, setShowTimeline] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derived engagement details
  const engagement = job.engagement;
  const history: NegotiationTermVersion[] = useMemo(() => {
    if (engagement?.history && engagement.history.length > 0) {
      return engagement.history;
    }
    // Fallback baseline
    const currency = (job.paymentTokenSymbol || 'POL').toUpperCase();
    const baselineAmount = job.amountEth || job.amountUsdc || '10';
    return [
      {
        version: 1,
        round: 1,
        proposedBy: 'client',
        proposerWallet: job.client || '',
        amountWei: ethers.parseEther(baselineAmount).toString(),
        currency,
        message: 'Initial project offer from client',
        status: job.freelancerAgreedTerms ? 'ACCEPTED' : 'PENDING',
        createdAt: job.createdAt ? Number(job.createdAt) : Date.now(),
        expiresAt: (job.createdAt ? Number(job.createdAt) : Date.now()) + 72 * 3600 * 1000,
      },
    ];
  }, [engagement, job]);

  const latestTerm = history[history.length - 1];
  const previousTerm = history.length > 1 ? history[history.length - 2] : null;
  const currentRound = history.length;
  const isCapped = currentRound >= MAX_ROUNDS;

  const currency = (latestTerm?.currency || job.paymentTokenSymbol || 'POL').toUpperCase();
  const isUsdc = currency === 'USDC' || currency === 'USDT';
  const decimals = isUsdc ? (job.paymentTokenDecimals || 6) : 18;

  const currentAmountFormatted = useMemo(() => {
    if (!latestTerm?.amountWei) return job.amountEth || job.amountUsdc || '10';
    try {
      return ethers.formatUnits(latestTerm.amountWei, decimals);
    } catch {
      return job.amountEth || job.amountUsdc || '10';
    }
  }, [latestTerm, decimals, job]);

  const currentAmountNum = parseFloat(currentAmountFormatted) || 0;

  // Previous amount comparison
  const previousAmountFormatted = useMemo(() => {
    if (!previousTerm?.amountWei) return null;
    try {
      return ethers.formatUnits(previousTerm.amountWei, decimals);
    } catch {
      return null;
    }
  }, [previousTerm, decimals]);

  const previousAmountNum = previousAmountFormatted ? parseFloat(previousAmountFormatted) : null;
  const amountDiff = previousAmountNum !== null ? currentAmountNum - previousAmountNum : 0;
  const amountDiffPercent = previousAmountNum && previousAmountNum > 0
    ? Math.round((amountDiff / previousAmountNum) * 100)
    : 0;

  // Original job budget for 25% warning threshold
  const originalBudgetNum = parseFloat(job.amountEth || job.amountUsdc || '10') || 10;
  const enteredCounterNum = parseFloat(counterAmount) || 0;
  const isFarAboveBudget = enteredCounterNum > originalBudgetNum * 1.25;

  // Engagement state resolution
  const state = engagement?.state || (job.freelancerAgreedTerms ? 'TERMS_AGREED' : 'OFFER_SENT');
  const isTermsAgreed = state === 'TERMS_AGREED' || Boolean(job.freelancerAgreedTerms && job.clientAgreedTerms);
  const isCounterByFreelancer = state === 'COUNTER_PROPOSED_BY_FREELANCER';
  const isCounterByClient = state === 'COUNTER_PROPOSED_BY_CLIENT';
  const isInitialOffer = state === 'OFFER_SENT';

  // Fee calculation (2.5% platform fee parity in BigInt/exact ratio)
  // Client pays: Principal + 2.5%
  // Freelancer receives: Principal - 2.5%
  const clientDepositTotal = (currentAmountNum * 1.025).toFixed(4);
  const clientFee = (currentAmountNum * 0.025).toFixed(4);
  const freelancerNetReceive = (currentAmountNum * 0.975).toFixed(4);
  const freelancerFee = (currentAmountNum * 0.025).toFixed(4);

  // Counter proposal live fee breakdown
  const counterEnteredFreelancerNet = (enteredCounterNum * 0.975).toFixed(4);
  const counterEnteredClientTotal = (enteredCounterNum * 1.025).toFixed(4);

  // Handlers
  const handleAcceptTerms = async () => {
    setIsResponding(true);
    setErrorMessage(null);
    try {
      if (isCounterByFreelancer && isClient) {
        await respondToCounterOffer(job.id, 'accept');
      } else if (isCounterByClient && isFreelancer) {
        await respondToCounterOffer(job.id, 'accept');
      } else {
        await acceptJobOffer(job.id);
      }
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('Failed to accept terms:', err);
      setErrorMessage(err?.message || 'Failed to accept terms. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const handleRejectCounter = async () => {
    if (!window.confirm('Reject this counter-offer and keep the previous proposal?')) return;
    setIsResponding(true);
    setErrorMessage(null);
    try {
      await respondToCounterOffer(job.id, 'reject');
    } catch (err: any) {
      console.error('Failed to reject counter:', err);
      setErrorMessage(err?.message || 'Failed to reject counter-offer.');
    } finally {
      setIsResponding(false);
    }
  };

  const handleSubmitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterAmount || enteredCounterNum <= 0) {
      setErrorMessage('Please enter a valid positive counter amount.');
      return;
    }
    setIsSubmittingCounter(true);
    setErrorMessage(null);
    try {
      await proposeCounterOffer(job.id, counterAmount.trim(), currency, counterMessage.trim());
      setIsCounterModalOpen(false);
      setCounterAmount('');
      setCounterMessage('');
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('Failed to propose counter:', err);
      setErrorMessage(err?.message || 'Failed to propose counter-offer.');
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  const handleCancelSelection = async () => {
    setIsCancelling(true);
    setErrorMessage(null);
    try {
      await cancelSelection(job.id, cancelReason.trim());
      setIsCancelModalOpen(false);
      setCancelReason('');
      navigate('/jobs');
    } catch (err: any) {
      console.error('Failed to cancel selection:', err);
      setErrorMessage(err?.message || 'Failed to cancel candidate selection.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeclineAsFreelancer = async () => {
    if (!window.confirm('Decline this job offer? The position will be returned to the open marketplace.')) return;
    setIsResponding(true);
    setErrorMessage(null);
    try {
      await declineJobOffer(job.id);
      navigate('/jobs');
    } catch (err: any) {
      console.error('Failed to decline offer:', err);
      setErrorMessage(err?.message || 'Failed to decline offer.');
    } finally {
      setIsResponding(false);
    }
  };

  // Status banner copy
  const getStatusBanner = () => {
    if (isTermsAgreed) {
      return {
        badge: 'TERMS AGREED • AWAITING DEPOSIT',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        title: isClient ? 'Terms Finalized: Deposit Escrow to Begin' : 'Terms Agreed: Waiting for Client Escrow Deposit',
        description: isClient
          ? `Both parties have agreed to ${currentAmountFormatted} ${currency}. Deposit escrow funds into the on-chain vault on Polygon to lock the contract and authorize the freelancer to begin work.`
          : `Both you and the client have agreed on ${currentAmountFormatted} ${currency}! The client has been notified to fund the escrow contract. Work milestone deliverables will unlock upon on-chain confirmation.`,
      };
    }

    if (isCounterByFreelancer) {
      return {
        badge: 'COUNTER-OFFER PROPOSED BY FREELANCER',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
        title: isClient ? 'Freelancer Requested a Counter-Offer' : 'Counter-Offer Submitted: Awaiting Client Response',
        description: isClient
          ? `The candidate has requested ${currentAmountFormatted} ${currency} for this project. Review their request and accept, reject, or submit a counter.`
          : `You proposed ${currentAmountFormatted} ${currency}. The client has been notified to review and respond.`,
      };
    }

    if (isCounterByClient) {
      return {
        badge: 'COUNTER-OFFER PROPOSED BY CLIENT',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        title: isFreelancer ? 'Client Proposed a Counter-Offer' : 'Counter-Offer Submitted: Awaiting Freelancer Response',
        description: isFreelancer
          ? `The client offered ${currentAmountFormatted} ${currency}. You can accept these terms, counter again, or decline the offer.`
          : `You proposed ${currentAmountFormatted} ${currency}. Waiting for the freelancer to review and confirm.`,
      };
    }

    // Default OFFER_SENT
    return {
      badge: 'CANDIDATE SELECTED • OFFER SENT',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      title: isFreelancer ? 'You Have Been Selected For This Project!' : 'Candidate Selected: Waiting for Acceptance',
      description: isFreelancer
        ? `The client has selected you at ${currentAmountFormatted} ${currency}. Accept the offer to authorize escrow funding, request a different amount, or decline if unavailable.`
        : `You selected ${truncateAddress(job.freelancer || '')}. They have been notified to review and accept the scope and terms.`,
    };
  };

  const banner = getStatusBanner();

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-xs overflow-hidden text-left space-y-4 p-5 sm:p-6 transition-all">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0047AB] to-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-block ${banner.badgeClass}`}>
              {banner.badge}
            </span>
            <h3 className="font-headline font-black text-slate-900 text-base sm:text-lg mt-0.5">
              {banner.title}
            </h3>
          </div>
        </div>

        {/* Current Active Amount Display */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-start">
          <span className="text-[10.5px] uppercase font-bold text-slate-500 font-mono">Agreed / Proposed Terms:</span>
          <span className="text-base font-mono font-black text-slate-900">
            {currentAmountFormatted} {currency}
          </span>
        </div>
      </div>

      {/* Description copy */}
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
        {banner.description}
      </p>

      {/* Price Difference Indicator if a counter was made */}
      {previousAmountFormatted && amountDiff !== 0 && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Previous: {previousAmountFormatted} {currency}</span>
            <ArrowRight size={13} className="text-slate-400" />
            <span className="text-slate-900 font-black">Proposed: {currentAmountFormatted} {currency}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full font-bold ${amountDiff > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
            {amountDiff > 0 ? `+${amountDiff.toFixed(2)}` : amountDiff.toFixed(2)} {currency} ({amountDiffPercent > 0 ? `+${amountDiffPercent}%` : `${amountDiffPercent}%`})
          </span>
        </div>
      )}

      {/* Latest message if present */}
      {latestTerm?.message && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider block font-mono">
            {latestTerm.proposedBy === 'freelancer' ? 'Message from Freelancer:' : 'Message from Client:'}
          </span>
          <p className="text-slate-800 italic font-sans leading-relaxed">
            "{latestTerm.message}"
          </p>
        </div>
      )}

      {/* Live Fee Breakdown Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
          <div className="flex items-center justify-between text-slate-500">
            <span>Client Total Payout (+2.5% fee):</span>
            <span className="font-bold text-slate-800">{clientDepositTotal} {currency}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Platform Protocol Maintenance:</span>
            <span>+{clientFee} {currency}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
          <div className="flex items-center justify-between text-slate-500">
            <span>Freelancer Net Received (-2.5% fee):</span>
            <span className="font-bold text-emerald-700">{freelancerNetReceive} {currency}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Protocol Network Deduction:</span>
            <span>-{freelancerFee} {currency}</span>
          </div>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0 text-rose-600" />
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Action Buttons Group */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
        {/* FREELANCER ACTIONS */}
        {isFreelancer && !isTermsAgreed && (
          <>
            {/* Accept button (available if pending initial offer or counter proposed by client) */}
            {(isInitialOffer || isCounterByClient) && (
              <button
                type="button"
                disabled={isResponding}
                onClick={handleAcceptTerms}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                {isResponding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Accept Terms ({currentAmountFormatted} {currency})</span>
              </button>
            )}

            {/* Request different amount (counter) */}
            {!isCapped ? (
              <button
                type="button"
                onClick={() => {
                  setCounterAmount(currentAmountFormatted);
                  setIsCounterModalOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
              >
                <RefreshCw size={13} />
                <span>Request Different Amount</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono italic">
                (Max negotiation round cap reached)
              </span>
            )}

            {/* Decline offer */}
            <button
              type="button"
              disabled={isResponding}
              onClick={handleDeclineAsFreelancer}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <XCircle size={13} />
              <span>Decline Offer</span>
            </button>
          </>
        )}

        {/* CLIENT ACTIONS */}
        {isClient && (
          <>
            {/* When terms are agreed: Primary action is to fund escrow */}
            {isTermsAgreed && onFundEscrow && (
              <button
                type="button"
                disabled={isFundingEscrow}
                onClick={onFundEscrow}
                className="bg-[#0047AB] hover:bg-[#003882] disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              >
                {isFundingEscrow ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Confirming On-Chain Escrow Deposit...</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={15} />
                    <span>Deposit & Fund Escrow ({clientDepositTotal} {currency})</span>
                  </>
                )}
              </button>
            )}

            {/* When freelancer requested counter: Client can Accept, Reject, or Counter */}
            {isCounterByFreelancer && (
              <>
                <button
                  type="button"
                  disabled={isResponding}
                  onClick={handleAcceptTerms}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                >
                  {isResponding ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Accept New Amount ({currentAmountFormatted} {currency})</span>
                </button>

                <button
                  type="button"
                  disabled={isResponding}
                  onClick={handleRejectCounter}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <XCircle size={13} />
                  <span>Reject & Keep Previous Offer</span>
                </button>

                {!isCapped && (
                  <button
                    type="button"
                    onClick={() => {
                      setCounterAmount(currentAmountFormatted);
                      setIsCounterModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <RefreshCw size={13} />
                    <span>Counter with Another Amount</span>
                  </button>
                )}
              </>
            )}

            {/* Cancel candidate selection (Available before confirmed funding) */}
            <button
              type="button"
              disabled={isFundingEscrow}
              onClick={() => setIsCancelModalOpen(true)}
              className="bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-800 border border-rose-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all ml-auto"
            >
              <XCircle size={13} />
              <span>Cancel Selection</span>
            </button>
          </>
        )}

        {/* Common chat shortcut */}
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams({ jobId: job.id });
            const otherParty = isClient ? job.freelancer : job.client;
            if (otherParty) params.set('applicant', otherParty);
            navigate(`/chat?${params.toString()}`);
          }}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <MessageSquare size={13} />
          <span>Message {isClient ? truncateAddress(job.freelancer || '') : 'Client'}</span>
        </button>

        {/* Toggle timeline view */}
        <button
          type="button"
          onClick={() => setShowTimeline(!showTimeline)}
          className="text-slate-500 hover:text-slate-800 text-xs font-mono font-medium flex items-center gap-1 ml-auto"
        >
          <span>History ({history.length} {history.length === 1 ? 'version' : 'versions'})</span>
          {showTimeline ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expandable Negotiation Timeline */}
      {showTimeline && history.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
            Audit Trail & Negotiation History
          </span>
          <div className="space-y-2">
            {history.map((term, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-400 text-[10px]">v{term.version}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase font-mono ${term.proposedBy === 'client' ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'}`}>
                    {term.proposedBy === 'client' ? 'Client Offer' : 'Freelancer Counter'}
                  </span>
                  <span className="font-mono font-black text-slate-900">
                    {ethers.formatUnits(term.amountWei, decimals)} {term.currency}
                  </span>
                  {term.message && (
                    <span className="text-slate-500 truncate max-w-xs sm:max-w-md italic">
                      "{term.message}"
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <span>{new Date(term.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${term.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : term.status === 'SUPERSEDED' || (term.status as any) === 'COUNTERED' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>
                    {term.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COUNTER-OFFER MODAL */}
      <Modal
        isOpen={isCounterModalOpen}
        onClose={() => setIsCounterModalOpen(false)}
        title="Propose Counter-Offer"
        subtitle={`Round ${currentRound + 1} of ${MAX_ROUNDS}`}
        size="md"
      >
        <form onSubmit={handleSubmitCounter} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block font-sans">
              Proposed Project Amount ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="e.g. 15"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
              <span className="absolute right-3.5 top-3 text-xs font-mono font-bold text-slate-400">
                {currency}
              </span>
            </div>
          </div>

          {/* Warning if far above budget */}
          {isFarAboveBudget && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-700" />
              <span>
                <strong>Heads up:</strong> This requested amount is &gt;25% above the client's initial budget of {originalBudgetNum} {currency}. The client will review this request.
              </span>
            </div>
          )}

          {/* Live Fee Breakdown */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-slate-600">
              <span>Gross Contract Principal:</span>
              <span className="font-bold text-slate-900">{enteredCounterNum || 0} {currency}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Freelancer Receives (Net -2.5%):</span>
              <span className="font-bold text-emerald-700">{counterEnteredFreelancerNet} {currency}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Client Pays (Total +2.5%):</span>
              <span className="font-bold text-blue-700">{counterEnteredClientTotal} {currency}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block font-sans">
              Message / Justification (Optional)
            </label>
            <textarea
              rows={3}
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              placeholder="Explain why this budget adjustment is necessary (scope complexity, faster turnaround, etc.)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCounterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCounter || enteredCounterNum <= 0}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isSubmittingCounter ? <Loader2 size={13} className="animate-spin" /> : <SendHorizontal size={13} />}
              <span>Submit Counter-Offer</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CANCEL SELECTION MODAL */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Candidate Selection"
        subtitle="Pre-Escrow Re-listing"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Keep Candidate
            </button>
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancelSelection}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isCancelling ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              <span>Confirm Cancel Selection</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            This removes <strong>{truncateAddress(job.freelancer || '')}</strong> from this job. The job will remain or return to <strong>OPEN</strong> status in Find Jobs and your Dashboard, allowing you to select another candidate.
          </p>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span><strong>No funds have moved.</strong> Escrow has not been funded yet.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block font-sans">
              Reason for Cancellation (Optional)
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Could not agree on terms, scope changed, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
