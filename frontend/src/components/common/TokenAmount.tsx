import React, { useState, useMemo } from 'react';
import { useLiveCurrencyRates, useGlobalFiat, convertCryptoToFiat } from '../../utils/currency';
import { normalizeTokenSymbol, formatTokenDecimals } from '../../lib/amounts/getJobAmounts';
import { toBaseUnits, getTokenDecimals } from '../../utils/formatAmount';
import { copyToClipboard } from '../../utils/formatters';

export interface TokenAmountProps {
  /** Numerical value, decimal string, or bigint base units */
  amount: number | string | bigint | undefined | null;
  /** Payment token symbol (POL, USDC, USDT) */
  token?: string;
  /** Whether to show live fiat estimate (e.g. ~₹76.68) */
  showFiat?: boolean;
  /** Additional container styling classes */
  className?: string;
  /** Custom classes for the token amount number */
  amountClassName?: string;
  /** Custom classes for the token symbol */
  tokenClassName?: string;
  /** Custom classes for the fiat string */
  fiatClassName?: string;
  /** Standard sizing preset */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether clicking the amount copies full precision */
  copyable?: boolean;
}

export const TokenAmount: React.FC<TokenAmountProps> = ({
  amount,
  token = 'POL',
  showFiat = true,
  className = '',
  amountClassName = '',
  tokenClassName = '',
  fiatClassName = '',
  size = 'md',
  copyable = false,
}) => {
  useLiveCurrencyRates();
  const [fiatCode] = useGlobalFiat();
  const [copied, setCopied] = useState(false);

  const sym = normalizeTokenSymbol(token);
  const decimals = getTokenDecimals(sym);

  const { cleanNumber, nominalNum } = useMemo(() => {
    if (amount === undefined || amount === null) {
      return { cleanNumber: '0.00', nominalNum: 0 };
    }
    const units = typeof amount === 'bigint' ? amount : toBaseUnits(amount, decimals);
    const clean = formatTokenDecimals(units, decimals);
    const num = parseFloat(clean) || 0;
    return { cleanNumber: clean, nominalNum: num };
  }, [amount, decimals]);

  const { formatted: fiatString } = useMemo(() => {
    return convertCryptoToFiat(nominalNum, sym, fiatCode);
  }, [nominalNum, sym, fiatCode]);

  const handleCopy = async (e: React.MouseEvent) => {
    if (!copyable) return;
    e.stopPropagation();
    const ok = await copyToClipboard(cleanNumber);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const sizeClasses = {
    xs: {
      wrap: 'text-[11px]',
      fiat: 'text-[10px]',
    },
    sm: {
      wrap: 'text-xs',
      fiat: 'text-[11px]',
    },
    md: {
      wrap: 'text-sm',
      fiat: 'text-xs',
    },
    lg: {
      wrap: 'text-base sm:text-lg',
      fiat: 'text-xs sm:text-sm',
    },
    xl: {
      wrap: 'text-xl sm:text-2xl',
      fiat: 'text-sm sm:text-base',
    },
  }[size];

  return (
    <span
      className={`inline-flex items-baseline gap-1.5 whitespace-nowrap shrink-0 tabular-nums font-sans ${sizeClasses.wrap} ${className}`}
      onClick={handleCopy}
      title={copyable ? `${cleanNumber} ${sym} (Click to copy)` : undefined}
    >
      {/* Primary Tone: Amount + Token Symbol on same line */}
      <span className={`inline-flex items-baseline gap-1 font-semibold text-[#0B0B0C] ${copyable ? 'cursor-pointer hover:opacity-90' : ''} ${amountClassName}`}>
        <span>{cleanNumber}</span>
        <span className={`font-normal text-[#0B0B0C] text-[0.88em] ${tokenClassName}`}>{sym}</span>
        {copied && (
          <span className="text-[10px] font-normal text-emerald-600 ml-1 animate-pulse">Copied!</span>
        )}
      </span>

      {/* Muted Tone: Fiat conversion on same baseline */}
      {showFiat && (
        <span className={`font-normal text-[#6B7280] ${sizeClasses.fiat} ${fiatClassName}`}>
          {fiatString}
        </span>
      )}
    </span>
  );
};

export default TokenAmount;
