import React, { useState } from 'react';

export interface WalletLogoProps {
  name: string;
  size?: number;
  className?: string;
  rdns?: string;
  iconUrl?: string;
}

export const MetaMaskLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 28 28"
    className={`inline-block shrink-0 ${className}`}
  >
    <rect width="28" height="28" rx="6" fill="#ffffff" />
    <g clipPath="url(#mm_clip_official)">
      <path
        fill="#ff5c16"
        d="m24.024 23.824-4.846-1.434-3.655 2.172-2.55-.001-3.656-2.171-4.844 1.434L3 18.88l1.473-5.488L3 8.751 4.473 3l7.569 4.496h4.413L24.024 3l1.473 5.751-1.473 4.64 1.473 5.488z"
      />
      <path
        fill="#ff5c16"
        d="m4.474 3 7.57 4.499-.302 3.087zm4.844 15.881 3.33 2.522-3.33.987zm3.064-4.17-.64-4.123-4.097 2.804h-.002v.001l.013 2.886 1.661-1.567zM24.024 3l-7.57 4.499.3 3.087zM19.18 18.881l-3.33 2.522 3.33.987zm1.674-5.488v-.002zl-4.097-2.804-.64 4.124h3.064l1.662 1.567z"
      />
      <path
        fill="#e34807"
        d="m9.317 22.39-4.844 1.434L3 18.881h6.317zm3.064-7.68.925 5.962-1.282-3.315-4.37-1.078 1.662-1.568zm6.799 7.68 4.844 1.434 1.473-4.943H19.18zm-3.064-7.68-.925 5.962 1.282-3.315 4.37-1.078-1.663-1.568z"
      />
      <path
        fill="#ff8d5d"
        d="m3 18.88 1.473-5.489h3.169l.012 2.887 4.37 1.078 1.282 3.314-.659.73-3.33-2.522H3zm22.497 0-1.473-5.489h-3.17l-.01 2.887-4.371 1.078-1.282 3.314.659.73 3.33-2.522h6.317zM16.455 7.495h-4.413l-.3 3.087 1.565 10.084h1.884l1.565-10.084z"
      />
      <path
        fill="#661800"
        d="M4.473 3 3 8.751l1.473 4.64h3.169l4.1-2.805zm6.992 12.908H10.03l-.781.761 2.776.685-.56-1.447M24.024 3l1.473 5.751-1.473 4.64h-3.17l-4.098-2.805zm-6.99 12.908h1.437l.782.762-2.78.686.56-1.45zm-1.512 6.687.328-1.193-.66-.73h-1.885l-.659.73.327 1.192"
      />
      <path fill="#c0c4cd" d="M15.522 22.594v1.969h-2.548v-1.969z" />
      <path fill="#e7ebf6" d="m9.318 22.388 3.658 2.174v-1.969l-.328-1.192zm9.862 0-3.658 2.174v-1.969l.328-1.192z" />
    </g>
    <defs>
      <clipPath id="mm_clip_official">
        <path fill="#fff" d="M3 3h22.5v21.563H3z" />
      </clipPath>
    </defs>
  </svg>
);

export const WalletConnectLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <rect width="28" height="28" rx="6" fill="#3B99FC" />
    <path
      d="M8.38969 10.3739C11.4882 7.27538 16.5118 7.27538 19.6103 10.3739L19.9832 10.7468C20.1382 10.9017 20.1382 11.1529 19.9832 11.3078L18.7076 12.5835C18.6301 12.6609 18.5045 12.6609 18.4271 12.5835L17.9139 12.0703C15.7523 9.9087 12.2477 9.9087 10.0861 12.0703L9.53655 12.6198C9.45909 12.6973 9.3335 12.6973 9.25604 12.6198L7.98039 11.3442C7.82547 11.1893 7.82547 10.9381 7.98039 10.7832L8.38969 10.3739ZM22.2485 13.012L23.3838 14.1474C23.5387 14.3023 23.5387 14.5535 23.3838 14.7084L18.2645 19.8277C18.1096 19.9827 17.8584 19.9827 17.7035 19.8277C17.7035 19.8277 17.7035 19.8277 17.7035 19.8277L14.0702 16.1944C14.0314 16.1557 13.9686 16.1557 13.9299 16.1944C13.9299 16.1944 13.9299 16.1944 13.9299 16.1944L10.2966 19.8277C10.1417 19.9827 9.89053 19.9827 9.73561 19.8278C9.7356 19.8278 9.7356 19.8277 9.7356 19.8277L4.61619 14.7083C4.46127 14.5534 4.46127 14.3022 4.61619 14.1473L5.75152 13.012C5.90645 12.857 6.15763 12.857 6.31255 13.012L9.94595 16.6454C9.98468 16.6841 10.0475 16.6841 10.0862 16.6454C10.0862 16.6454 10.0862 16.6454 10.0862 16.6454L13.7194 13.012C13.8743 12.857 14.1255 12.857 14.2805 13.012C14.2805 13.012 14.2805 13.012 14.2805 13.012L17.9139 16.6454C17.9526 16.6841 18.0154 16.6841 18.0541 16.6454L21.6874 13.012C21.8424 12.8571 22.0936 12.8571 22.2485 13.012Z"
      fill="white"
    />
  </svg>
);

export const CoinbaseLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <rect width="28" height="28" rx="6" fill="#0052FF" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14 23.8C19.4124 23.8 23.8 19.4124 23.8 14C23.8 8.58761 19.4124 4.2 14 4.2C8.58761 4.2 4.2 8.58761 4.2 14C4.2 19.4124 8.58761 23.8 14 23.8ZM11.55 10.8C11.1358 10.8 10.8 11.1358 10.8 11.55V16.45C10.8 16.8642 11.1358 17.2 11.55 17.2H16.45C16.8642 17.2 17.2 16.8642 17.2 16.45V11.55C17.2 11.1358 16.8642 10.8 16.45 10.8H11.55Z"
      fill="white"
    />
  </svg>
);

export const WalletLogo: React.FC<WalletLogoProps> = ({
  name,
  size = 28,
  className = '',
  iconUrl,
}) => {
  const [svgFailed, setSvgFailed] = useState(false);

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

  const cleanName = (name || '').toLowerCase().replace(/\s+/g, '');

  if (cleanName.includes('metamask')) {
    return <MetaMaskLogo size={size} className={className} />;
  }

  if (cleanName.includes('walletconnect')) {
    return <WalletConnectLogo size={size} className={className} />;
  }

  if (cleanName.includes('coinbase')) {
    return <CoinbaseLogo size={size} className={className} />;
  }

  // Fallback for other wallets via SVG asset
  const svgSrc = `${import.meta.env.BASE_URL}brand/wallets/${cleanName}.svg`;

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

  return (
    <span className={`font-semibold text-xs inline-flex items-center ${className}`}>
      {name}
    </span>
  );
};

export default WalletLogo;
