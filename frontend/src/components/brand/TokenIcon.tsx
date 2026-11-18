import React, { useState } from 'react';

export interface TokenIconProps {
  symbol?: 'POL' | 'USDC' | 'USDT' | string;
  token?: 'POL' | 'USDC' | 'USDT' | string;
  size?: number;
  className?: string;
}

export const TokenIcon: React.FC<TokenIconProps> = ({
  symbol,
  token,
  size = 20,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const sym = ((symbol || token || 'POL') as string).toUpperCase();
  const fileName = `${sym.toLowerCase()}.svg`;
  const src = `${import.meta.env.BASE_URL}brand/tokens/${fileName}`;

  if (hasError) {
    return (
      <span className={`font-mono text-xs font-semibold inline-flex items-center ${className}`}>
        {sym}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={sym}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={`inline-block object-contain shrink-0 ${className}`}
    />
  );
};

export default TokenIcon;
