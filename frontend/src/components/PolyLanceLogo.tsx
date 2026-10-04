import React, { useState } from 'react';
import { LOGO_CONFIG } from '../config/logoConfig';
import defaultLogo from '../assets/polylanceLogo.png';

interface PolyLanceLogoProps {
  size?: number;
  className?: string;
  src?: string;
}

export const PolyLanceLogo: React.FC<PolyLanceLogoProps> = ({ size = 28, className = '', src }) => {
  const [imageError, setImageError] = useState(false);
  const logoSrc = src || defaultLogo;
  const shouldUseImage = LOGO_CONFIG.useCustomImage && logoSrc && !imageError;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {shouldUseImage ? (
        <img
          src={logoSrc}
          alt="PolyLance Logo"
          className="w-full h-full object-contain"
          style={{ width: size, height: size, minWidth: size, minHeight: size }}
          onError={() => setImageError(true)}
        />
      ) : (
        /* Clean Editorial Geometric Hexagon SVG Logo */
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagon Rim */}
          <polygon
            points="50,6 90,28 90,72 50,94 10,72 10,28"
            fill="none"
            stroke="#0047AB"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          {/* Inner P glyph */}
          <path
            d="M 34 26 L 50 26 L 50 74 L 34 74 Z"
            fill="#0047AB"
          />
          <path
            d="M 50 26 L 66 26 C 76 26 80 32 80 41 C 80 50 76 56 66 56 L 50 56 Z"
            fill="#0047AB"
          />
          <path
            d="M 50 36 L 64 36 C 68 36 70 38 70 41 C 70 44 68 46 64 46 L 50 46 Z"
            fill="#FFFFFF"
          />
        </svg>
      )}
    </div>
  );
};
