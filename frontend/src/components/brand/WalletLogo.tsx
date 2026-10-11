import React, { useState } from 'react';

export interface WalletLogoProps {
  name: string;
  size?: number;
  className?: string;
  rdns?: string;
  iconUrl?: string;
}

export const WalletLogo: React.FC<WalletLogoProps> = ({
  name,
  size = 28,
  className = '',
  iconUrl,
}) => {
  const [svgFailed, setSvgFailed] = useState(false);
  const [pngFailed, setPngFailed] = useState(false);

  // If EIP-6963 provider provides a direct icon URL data URI
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={name}
        width={size}
        height={size}
        className={`inline-block object-contain shrink-0 ${className}`}
      />
    );
  }

  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  let svgName = 'metamask.svg';
  let pngFallback = 'MetaMask_logo.png';

  if (cleanName.includes('walletconnect')) {
    svgName = 'walletconnect.svg';
    pngFallback = 'WalletConnect_logo.png';
  } else if (cleanName.includes('coinbase')) {
    svgName = 'coinbase.svg';
    pngFallback = 'CoinBase_logo.png';
  } else if (cleanName.includes('metamask')) {
    svgName = 'metamask.svg';
    pngFallback = 'MetaMask_logo.png';
  } else {
    svgName = `${cleanName}.svg`;
    pngFallback = '';
  }

  const svgSrc = `${import.meta.env.BASE_URL}brand/wallets/${svgName}`;
  const pngSrc = pngFallback ? `${import.meta.env.BASE_URL}${pngFallback}` : '';

  if (!svgFailed) {
    return (
      <img
        src={svgSrc}
        alt={name}
        width={size}
        height={size}
        onError={() => setSvgFailed(true)}
        className={`inline-block object-contain shrink-0 ${className}`}
      />
    );
  }

  if (pngSrc && !pngFailed) {
    return (
      <img
        src={pngSrc}
        alt={name}
        width={size}
        height={size}
        onError={() => setPngFailed(true)}
        className={`inline-block object-contain shrink-0 ${className}`}
      />
    );
  }

  return (
    <span className={`font-semibold text-xs inline-flex items-center ${className}`}>
      {name}
    </span>
  );
};

export default WalletLogo;
