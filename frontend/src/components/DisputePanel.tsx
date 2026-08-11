import React, { useState } from 'react';
import { Dispute, DisputeReason } from '../types';
import { Scale, FileText, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { truncateAddress } from '../utils/formatters';
import { getIpfsGatewayUrl } from '../utils/ipfs';

interface DisputePanelProps {
  dispute: Dispute;
  amountUsdc: string;
  clientAddress: string;
  freelancerAddress?: string;
  isJudge: boolean;
  isParty: boolean;
  userAddress: string;
  onResolveDispute?: (freelancerBps: number, reasoningText: string) => void;
  onSubmitResponse?: (responseText: string) => void;
}

export const DisputePanel: React.FC<DisputePanelProps> = ({
  dispute,
  amountUsdc,
  clientAddress,
  freelancerAddress,
  isJudge,
  isParty,
  userAddress,
  onResolveDispute,
  onSubmitResponse,
}) => {
  const [selectedBps, setSelectedBps] = useState<number>(5000); // 50/50 default
  const [customPercent, setCustomPercent] = useState<string>('50');
  const [reasoningText, setReasoningText] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');

  const isRespondent = isParty && userAddress.toLowerCase() !== dispute.raisedBy.toLowerCase();
  const hasResponded = !!dispute.responseText;

  const handleQuickPreset = (bps: number, pct: string) => {
    setSelectedBps(bps);
    setCustomPercent(pct);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    const clamped = Math.min(100, Math.max(0, val));
    setCustomPercent(clamped.toString());
    setSelectedBps(Math.round(clamped * 100));
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasoningText.trim()) {
      alert('Reasoning text is required for judge rulings.');
      return;
    }
    if (onResolveDispute) {
      onResolveDispute(selectedBps, reasoningText);
    }
  };

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) {
      alert('Response text is required.');
      return;
    }
    if (onSubmitResponse) {
      onSubmitResponse(responseText);
    }
  };

  return (
    <div className="glass-panel p-6 border-rose-500/30 bg-slate-950/80 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white font-heading">
              Active On-Chain Dispute
            </h3>
            <span className="badge-disputed">Reason: {dispute.reason}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Escrow locked ({amountUsdc} USDC). Subject to PolyLance Judge DAO arbitration.
          </p>
        </div>

        {dispute.resolved ? (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Dispute Resolved
          </span>
        ) : (
          <span className="text-amber-400 bg-amber-950/50 border border-amber-800/40 px-3 py-1 rounded-full text-xs font-medium">
            Under Review by PolyLance Judges
          </span>
        )}
      </div>

      {/* Side by Side Evidence Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Claim */}
        <div className="glass-panel p-4 border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Dispute Initial Evidence (Client)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              By {truncateAddress(dispute.raisedBy)}
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
            {dispute.evidenceText || 'Client filed a dispute claim regarding deliverable quality.'}
          </p>
          <div className="mt-2 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
            <FileText size={12} />
            <a
              href={getIpfsGatewayUrl(dispute.evidenceIpfsHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline truncate"
            >
              IPFS: {dispute.evidenceIpfsHash}
            </a>
          </div>
        </div>

        {/* Freelancer Response */}
        <div className="glass-panel p-4 border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Freelancer Response Evidence
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              By {truncateAddress(freelancerAddress)}
            </span>
          </div>

          {hasResponded ? (
            <>
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                {dispute.responseText}
              </p>
              {dispute.responseIpfsHash && (
                <div className="mt-2 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                  <FileText size={12} />
                  <a
                    href={getIpfsGatewayUrl(dispute.responseIpfsHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    IPFS: {dispute.responseIpfsHash}
                  </a>
                </div>
              )}
            </>
          ) : isRespondent ? (
            <form onSubmit={handleResponseSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder="Enter counter-arguments and proof references..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full glass-input text-xs"
              />
              <button
                type="submit"
                className="gradient-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                Submit Response
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-950/50 rounded border border-slate-900">
              Awaiting counter-response submission from freelancer.
            </p>
          )}
        </div>
      </div>

      {/* Resolution Summary if Resolved */}
      {dispute.resolved && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-emerald-300 font-heading">
              Final Ruling Record
            </h4>
            <span className="text-xs font-mono text-emerald-400">
              Freelancer Allocation: {(dispute.rulingBps! / 100).toFixed(0)}% | Client: {(100 - dispute.rulingBps! / 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-slate-300 italic">{dispute.reasoningText}</p>
          <div className="text-[10px] font-mono text-slate-400">
            Arbitrator Wallet: {dispute.judge}
          </div>
        </div>
      )}

      {/* Judge Ruling Controls (Section 12 Requirement) */}
      {isJudge && !dispute.resolved && (
        <form onSubmit={handleResolveSubmit} className="bg-amber-950/30 border border-amber-500/30 p-5 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-amber-200 font-heading">
              Arbitrator Panel Ruling (ARBITRATOR_ROLE)
            </h4>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Escrow Split Allocation Ratio
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPreset(0, '0')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  selectedBps === 0 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                Client 100%
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(5000, '50')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  selectedBps === 5000 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                Split 50 / 50
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(10000, '100')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  selectedBps === 10000 ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                Freelancer 100%
              </button>

              <div className="flex items-center gap-1.5 bg-slate-900 px-2 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Custom %:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customPercent}
                  onChange={handleCustomChange}
                  className="w-14 bg-transparent text-amber-300 font-mono text-xs outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Ruling Rationale / Justification * (Required by Contract)
            </label>
            <textarea
              required
              rows={3}
              placeholder="State the evidence analysis and why this split was determined..."
              value={reasoningText}
              onChange={(e) => setReasoningText(e.target.value)}
              className="w-full glass-input text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-2.5 rounded-xl text-sm shadow-lg flex items-center justify-center gap-2"
          >
            <Scale size={16} />
            Submit Binding On-Chain Ruling
          </button>
        </form>
      )}
    </div>
  );
};
