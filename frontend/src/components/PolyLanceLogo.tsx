import React, { useState } from 'react';
import defaultLogo from '../assets/polylanceLogo.png';

/**
 * CRITICAL / BRAND IDENTITY RULE:
 * DO NOT CHANGE OR REPLACE THIS LOGO.
 * The official PolyLance brand mark is frontend/src/assets/polylanceLogo.png.
 */

export interface PolyLanceLogoProps {
  size?: number;
  className?: string;
  src?: string;
  alt?: string;
}

export const PolyLanceLogo: React.FC<PolyLanceLogoProps> = ({
  size = 36,
  className = '',
  src,
  alt = 'PolyLance Logo',
}) => {
  const [imageError, setImageError] = useState(false);
  const logoSrc = src || defaultLogo;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 group/logo select-none ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {!imageError ? (
        <img
          src={logoSrc}
          alt={alt}
          className="w-full h-full object-contain transform transition-transform duration-300 ease-out group-hover/logo:scale-105"
          style={{ width: size, height: size, minWidth: size, minHeight: size }}
          onError={() => setImageError(true)}
        />
      ) : (
        /* Fallback if file missing or corrupted */
        <div
          className="w-full h-full rounded-full bg-[#0047AB] text-white flex items-center justify-center font-bold text-xs"
          style={{ width: size, height: size }}
        >
          PL
        </div>
      )}
    </div>
  );
};

export default PolyLanceLogo;
