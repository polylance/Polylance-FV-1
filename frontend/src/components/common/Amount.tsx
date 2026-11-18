import React, { useState } from 'react';
import { convertCryptoToFiat, useLiveCurrencyRates, useGlobalFiat } from '../../utils/currency';
import { formatAmount } from '../../utils/formatAmount';
import { copyToClipboard } from '../../utils/formatters';

export interface AmountProps {
  value?: number | string | bigint;
  amount?: number | string | bigint;
  token?: string;
  showFiat?: boolean;
  className?: string;
  tokenClassName?: string;
  fiatClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  isBalance?: boolean;
  align?: 'left' | 'right';
  inline?: boolean;
}

export const Amount: React.FC<AmountProps> = ({
  value,
  amount,
  token = 'POL',
  showFiat = true,
  className = '',
  tokenClassName = '',
  fiatClassName = '',
  size = 'md',
  isBalance = false,
  align = 'left',
  inline = false,
}) => {
  useLiveCurrencyRates();
  const [fiatCode] = useGlobalFiat();
  const [copied, setCopied] = useState(false);

  const rawVal = value !== undefined ? value : (amount !== undefined ? amount : 0);
  const formattedResult = formatAmount(rawVal, token, { isBalance });
  const sym = formattedResult.symbol;

  // Convert raw value to nominal number for fiat conversion
  const nominalNum = parseFloat(formattedResult.fullPrecision) || 0;
  const { formatted: fiatString } = convertCryptoToFiat(nominalNum, sym, fiatCode);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyToClipboard(formattedResult.fullPrecision);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const sizeClasses = {
    sm: {
      wrap: 'text-xs',
      token: 'font-semibold text-[#0B0B0F]',
      fiat: 'text-[11px] text-[#4B5563]'
    },
    md: {
      wrap: 'text-sm',
      token: 'font-semibold text-[#0B0B0F]',
      fiat: 'text-xs text-[#4B5563]'
    },
    lg: {
      wrap: 'text-lg sm:text-xl',
      token: 'font-semibold text-[#0B0B0F]',
      fiat: 'text-xs sm:text-sm text-[#4B5563]'
    }
  }[size];

  const alignmentClass = align === 'right' ? 'text-right justify-end' : 'text-left justify-start';
  const layoutClass = inline ? 'flex-row items-baseline gap-1.5' : 'flex-col';

  return (
    <span
      className={`inline-flex ${layoutClass} min-w-0 ${alignmentClass} ${sizeClasses.wrap} ${className}`}
      title={`${formattedResult.fullPrecision} ${sym} (Click to copy full precision)`}
      onClick={handleCopy}
    >
      <span className={`inline-flex items-baseline gap-1 tabular-nums font-sans ${sizeClasses.token} ${tokenClassName} min-w-0 overflow-hidden text-ellipsis cursor-pointer hover:opacity-90`}>
        <span>{formattedResult.formatted}</span>
        <span className="font-normal text-[#6B7280] text-[0.88em] tracking-tight">{sym}</span>
        {copied && (
          <span className="text-[10px] font-normal text-emerald-600 ml-1 animate-pulse">Copied!</span>
        )}
      </span>
      {showFiat && (
        <span className={`tabular-nums font-sans ${sizeClasses.fiat} ${fiatClassName} min-w-0 truncate`}>
          {inline ? `(${fiatString})` : fiatString}
        </span>
      )}
    </span>
  );
};

export default Amount;
