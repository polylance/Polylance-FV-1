import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useNetworkFees } from '../../hooks/useNetworkFees';
import { formatAmount } from '../../utils/formatAmount';
import { convertCryptoToFiat, useLiveCurrencyRates, useGlobalFiat } from '../../utils/currency';

export interface NetworkFeeBlockProps {
  actionKey?: string; // 'fundNative' | 'fundUsdc' | 'approveUsdc' | 'releasePayment' | 'submitWork' | 'payFeeDue'
  isErc20?: boolean;
  tokenSymbol?: string;
  className?: string;
  compact?: boolean;
}

export const NetworkFeeBlock: React.FC<NetworkFeeBlockProps> = ({
  actionKey = 'fundUsdc',
  isErc20 = true,
  tokenSymbol = 'USDC',
  className = '',
  compact = false,
}) => {
  useLiveCurrencyRates();
  const [fiatCode] = useGlobalFiat();
  const { fees, loading, refresh, getActionFee, isBusy, suggestedReservePol } = useNetworkFees(true);
  const [showExplanation, setShowExplanation] = useState(false);

  const estimate = getActionFee(actionKey);

  // Format typical and max amounts
  const typicalPolFormatted = formatAmount(estimate.typicalWei, 'POL').formatted;
  const maxPolFormatted = formatAmount(estimate.maxWei, 'POL').formatted;

  // Convert typical fee to fiat
  const typicalNominal = parseFloat(typicalPolFormatted) || 0.01;
  const { formatted: fiatEquivalent } = convertCryptoToFiat(typicalNominal, 'POL', fiatCode);

  if (compact) {
    return (
      <div className={`text-xs space-y-1.5 p-3 rounded-[8px] border border-[#E5E7EB] bg-[#F8FAFC] ${className}`}>
        <div className="flex items-center justify-between text-[#4B5563]">
          <span className="flex items-center gap-1">
            <span>Network fee (Polygon):</span>
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-[#6B7280] hover:text-[#0047AB]"
              title="How network fees work"
            >
              <HelpCircle size={12} />
            </button>
          </span>
          <span className="tabular-nums font-semibold text-[#0B0B0F]">
            ~{typicalPolFormatted} POL <span className="text-[#6B7280] font-normal text-[11px]">({fiatEquivalent})</span>
          </span>
        </div>

        {isBusy && (
          <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            Network is busier than usual right now.
          </div>
        )}

        {showExplanation && (
          <div className="text-[11px] text-[#4B5563] pt-1 border-t border-[#E5E7EB] space-y-1">
            <p>Your wallet may show up to {maxPolFormatted} POL as the maximum. You only pay what is used.</p>
            <p>Paid to Polygon validators. PolyLance and your wallet app do not receive it.</p>
            {isErc20 && <p className="text-amber-800 font-medium">Gas on Polygon is always paid in native POL.</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3.5 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] space-y-2.5 ${className}`}>
      {/* Primary line: Typical network fee */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#4B5563] font-medium flex items-center gap-1.5">
          <span>Network fee:</span>
          <span className="text-[11px] text-[#6B7280]">about {typicalPolFormatted} POL ({fiatEquivalent})</span>
        </span>
        <button
          type="button"
          onClick={() => refresh()}
          className="text-[#6B7280] hover:text-[#0047AB] p-0.5 rounded cursor-pointer"
          title="Refresh live network gas fees"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin text-[#0047AB]' : ''} />
        </button>
      </div>

      {/* Helper disclosures */}
      <div className="text-[11px] text-[#6B7280] space-y-1">
        <p>
          Your wallet may show up to <strong className="font-semibold text-[#0B0B0F] tabular-nums">{maxPolFormatted} POL</strong> as the maximum. You only pay what is actually used.
        </p>
        <p>
          Keep about <strong className="font-semibold text-[#0B0B0F] tabular-nums">{suggestedReservePol} POL</strong> in your wallet to be safe.
        </p>
      </div>

      {/* Truth note */}
      <div className="text-[10.5px] text-[#6B7280] pt-1.5 border-t border-[#E5E7EB]/80 leading-relaxed">
        Paid to Polygon validators to process the block. PolyLance and your wallet app do not receive it.
        {isErc20 && (
          <span className="block text-[#4B5563] font-medium mt-0.5">
            Paid in POL even when funding in {tokenSymbol}.
          </span>
        )}
      </div>

      {/* Busy network indicator if active */}
      {isBusy && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-[6px] border border-amber-200">
          <AlertCircle size={13} className="shrink-0 text-amber-600" />
          <span>Network fees are higher than usual right now. Non-urgent actions can wait for lower traffic.</span>
        </div>
      )}

      {/* Expandable "Why does my wallet show a different number?" */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-[11px] text-[#0047AB] hover:underline flex items-center gap-1 font-medium cursor-pointer"
        >
          <span>Why does my wallet show a different number?</span>
          {showExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showExplanation && (
          <div className="mt-2 p-2.5 bg-white rounded-[6px] border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1.5 leading-relaxed">
            <p>
              <strong>Typical vs. Maximum:</strong> Wallets display a buffered worst-case maximum fee (to protect against block congestion). Once confirmed, Polygon only charges the actual gas used and automatically refunds the rest to your wallet.
            </p>
            <p>
              <strong>Speed presets:</strong> Wallets allow choosing Low, Market, or Aggressive priority fees. PolyLance estimates follow live network medians.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
