import React from 'react';
import { convertCryptoToFiat, normalizeTokenSymbol, useLiveCurrencyRates, useGlobalFiat } from '../../utils/currency';

export interface AmountProps {
  value?: number | string;
  amount?: number | string;
  token?: string;
  showFiat?: boolean;
  className?: string;
  tokenClassName?: string;
  fiatClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Amount: React.FC<AmountProps> = ({
  value,
  amount,
  token = 'POL',
  showFiat = true,
  className = '',
  tokenClassName = '',
  fiatClassName = '',
  size = 'md'
}) => {
  useLiveCurrencyRates();
  const [fiatCode] = useGlobalFiat();

  const rawVal = value !== undefined ? value : (amount !== undefined ? amount : 0);
  const num = typeof rawVal === 'number'
    ? rawVal
    : parseFloat(String(rawVal).replace(/[^0-9.-]/g, '')) || 0;
  const sym = normalizeTokenSymbol(token);

  // Formatting token amount: up to 3 decimals if crypto, 2 if USD-pegged
  const formattedToken = sym === 'POL'
    ? num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })
    : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const { formatted: fiatString } = convertCryptoToFiat(num, sym, fiatCode);

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

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${sizeClasses.wrap} ${className}`}>
      <span className={`${sizeClasses.token} ${tokenClassName}`}>
        {formattedToken} {sym}
      </span>
      {showFiat && (
        <span className={`${sizeClasses.fiat} ${fiatClassName}`}>
          {fiatString}
        </span>
      )}
    </span>
  );
};

export default Amount;
