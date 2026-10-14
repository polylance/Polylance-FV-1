import React, { useState } from 'react';
import { 
  CheckCircle2, Sparkles, X, 
  ArrowRight, Calendar, Copy, 
  ExternalLink, Check, DollarSign, Box
} from 'lucide-react';
import { getPolygonScanAddressUrl } from '../utils/formatters';
import { scrollToSection } from '../utils/scroll';
import { TokenIcon } from './TokenIcon';
import { Modal } from './overlay';
import { Button } from './common/Button';

export interface ActionModalDetail {
  label: string;
  value: string;
  isMono?: boolean;
  isBadge?: boolean;
  dateBadge?: string;
  explorerUrl?: string;
  description?: string;
  tokenSymbol?: string;
}

export interface ActionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: 'success' | 'progress' | 'extension' | 'modification' | 'dispute' | 'payment' | 'terms';
  badgeText?: string;
  details?: ActionModalDetail[];
  primaryActionText?: string;
  targetSectionId?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const ActionStatusModal: React.FC<ActionStatusModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = 'terms',
  badgeText = 'TERMS FINALIZED',
  details = [],
  primaryActionText = 'Continue to Dashboard',
  targetSectionId,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePrimary = () => {
    onClose();
    if (targetSectionId) {
      scrollToSection(targetSectionId);
    }
    if (onPrimaryAction) {
      onPrimaryAction();
    }
  };

  const handleSecondary = () => {
    onClose();
    if (onSecondaryAction) {
      onSecondaryAction();
    }
  };

  const isTermsModal = icon === 'terms' || title.toLowerCase().includes('terms agreed') || title.toLowerCase().includes('terms accepted');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF1FB] text-[#0047AB] border border-[#C9DAF2] flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="min-w-0">
            {badgeText && (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-sans font-medium uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 mb-0.5">
                {badgeText}
              </span>
            )}
            <h3 className="font-semibold text-base text-slate-900 truncate">
              {title.replace('🎉', '').trim()}
            </h3>
          </div>
        </div>
      }
      subtitle={subtitle || 'Your acceptance of the project scope and SLA terms has been recorded.'}
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          {secondaryActionText && (
            <Button type="button" variant="secondary" onClick={handleSecondary}>
              {secondaryActionText}
            </Button>
          )}
          <Button type="button" variant="primary" onClick={handlePrimary}>
            <span>{primaryActionText}</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs font-sans">
        {isTermsModal ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            {/* Item 1: AGREEMENT STATUS */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EAF1FB] text-[#0047AB] border border-[#C9DAF2] flex items-center justify-center shrink-0">
                <Check size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
                  Agreement Status
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  Terms Accepted
                </span>
                <p className="text-[11px] text-slate-500">
                  Both parties have accepted contractual milestones.
                </p>
              </div>
            </div>

            <div className="border-b border-slate-100" />

            {/* Item 2: MILESTONE PAYOUT */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                <DollarSign size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
                  Milestone Payout
                </span>
                {(() => {
                  const payoutDetail = details.find(d => d.label.toLowerCase().includes('payout') || d.label.toLowerCase().includes('amount') || d.label.toLowerCase().includes('budget'));
                  const payoutValue = payoutDetail ? payoutDetail.value : '$15 USDC';
                  const isPolOrMatic = payoutValue.toUpperCase().includes('POL') || payoutValue.toUpperCase().includes('MATIC');
                  const payoutToken = isPolOrMatic ? 'POL' : payoutValue.toUpperCase().includes('USDT') ? 'USDT' : 'USDC';

                  return (
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 tabular-nums">
                      <span>{payoutValue}</span>
                      <TokenIcon token={payoutToken} size={14} />
                    </div>
                  );
                })()}
                <p className="text-[11px] text-slate-500">
                  Payout locked and secured in escrow.
                </p>
              </div>
            </div>

            <div className="border-b border-slate-100" />

            {/* Item 3: ESCROW ADDRESS */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                <Box size={16} />
              </div>
              {(() => {
                const addrDetail = details.find(d => d.label.toLowerCase().includes('escrow') || d.label.toLowerCase().includes('contract') || d.label.toLowerCase().includes('address'));
                const addrValue = addrDetail ? addrDetail.value : '0xce13...5487';
                const explorerUrl = addrDetail?.explorerUrl || getPolygonScanAddressUrl(addrValue);

                return (
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
                        Escrow Address
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(addrValue, 99)}
                        title="Click to copy address"
                        className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-mono font-medium text-slate-800 transition-colors cursor-pointer"
                      >
                        <span>{addrValue}</span>
                        {copiedIndex === 99 ? (
                          <Check size={11} className="text-[#0047AB]" />
                        ) : (
                          <Copy size={11} className="text-slate-400" />
                        )}
                      </button>
                    </div>

                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[#0047AB] hover:underline bg-slate-50 border border-slate-200 transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>Explorer</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            {icon === 'progress' && (() => {
              const progressDetail = details.find(d => d.label.toLowerCase().includes('completion') || d.label.toLowerCase().includes('progress'));
              const percentVal = progressDetail ? parseInt(progressDetail.value) || 0 : 0;
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#0047AB]" /> Milestone Completion
                    </span>
                    <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-bold tabular-nums">
                      {percentVal}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0047AB] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(Math.max(percentVal, 4), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Details rows */}
            <div className="space-y-2 divide-y divide-slate-100">
              {details
                .filter(d => icon !== 'progress' || (!d.label.toLowerCase().includes('completion') && !d.label.toLowerCase().includes('progress')))
                .map((detail, idx) => (
                  <div key={idx} className={`flex items-start justify-between gap-3 text-xs ${idx > 0 ? 'pt-2' : ''}`}>
                    <span className="text-[11px] font-medium text-slate-500 shrink-0">
                      {detail.label}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 justify-end flex-wrap text-right">
                      {detail.isBadge ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 text-[11px] font-mono font-medium">
                          {detail.value}
                        </span>
                      ) : detail.isMono ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(detail.value, idx)}
                          title="Click to copy"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 font-mono text-slate-800 text-[11px] transition-colors cursor-pointer"
                        >
                          <span className="truncate max-w-[180px]">{detail.value}</span>
                          {copiedIndex === idx ? (
                            <Check size={10} className="text-[#0047AB]" />
                          ) : (
                            <Copy size={10} className="text-slate-400" />
                          )}
                        </button>
                      ) : (
                        <span className="font-medium text-slate-800 text-xs max-w-[240px] break-words">
                          {detail.value}
                        </span>
                      )}
                      {detail.explorerUrl && (
                        <a
                          href={detail.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded text-[10px] font-medium text-[#0047AB] hover:underline bg-slate-100 border border-slate-200 transition-all flex items-center gap-1"
                        >
                          <span>Explorer</span>
                          <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Notice Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
          <Calendar size={16} className="text-[#0047AB] shrink-0" />
          <div className="text-[11px] text-slate-600">
            The escrow timeline and milestones will update automatically on-chain.
          </div>
        </div>
      </div>
    </Modal>
  );
};
