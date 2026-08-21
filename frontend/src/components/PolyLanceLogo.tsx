import React, { useState } from 'react';
import { LOGO_CONFIG } from '../config/logoConfig';
import defaultLogo from '../assets/polylanceLogo.png';

interface PolyLanceLogoProps {
  size?: number;
  className?: string;
  src?: string;
}

export const PolyLanceLogo: React.FC<PolyLanceLogoProps> = ({ size = 92, className = '', src }) => {
  const [imageError, setImageError] = useState(false);
  const logoSrc = src || defaultLogo;
  const shouldUseImage = LOGO_CONFIG.useCustomImage && logoSrc && !imageError;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-all duration-300 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {shouldUseImage ? (
        <img
          src={logoSrc}
          alt="PolyLance Logo"
          className="w-full h-full object-contain filter drop-shadow-[0_0_16px_rgba(2,132,199,0.7)] hover:drop-shadow-[0_0_26px_rgba(2,132,199,0.95)] transition-all duration-300"
          style={{ width: size, height: size, minWidth: size, minHeight: size }}
          onError={() => setImageError(true)}
        />
      ) : (
        /* High-Precision Bold 3D Cyan Vector SVG Logo */
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-[0_0_18px_rgba(56,189,248,0.75)] transition-all duration-300 hover:drop-shadow-[0_0_28px_rgba(56,189,248,1)]"
        >
          <defs>
            <linearGradient id="polyCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#621bcb" />
            </linearGradient>

            <linearGradient id="polyBevelBright" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
          </defs>

          {/* Outer 3D Hexagon Rim */}
          <polygon
            points="50,5 92,27.5 92,72.5 50,95 8,72.5 8,27.5"
            fill="none"
            stroke="url(#polyCyanGrad)"
            strokeWidth="9"
            strokeLinejoin="round"
          />

          {/* Inner Bevel Rim */}
          <polygon
            points="50,13 83,30.5 83,69.5 50,87 17,69.5 17,30.5"
            fill="none"
            stroke="url(#polyBevelBright)"
            strokeWidth="3"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* 3D Isometric "P" Symbol Geometry */}
          <path
            d="M 32 23 L 48 23 L 48 77 L 32 77 Z"
            fill="url(#polyCyanGrad)"
          />
          <path
            d="M 48 23 L 68 23 C 78 23 83 30 83 40 C 83 50 78 57 68 57 L 48 57 Z"
            fill="url(#polyBevelBright)"
          />
          <path
            d="M 48 33 L 64 33 C 68 33 71 36 71 40 C 71 44 68 47 64 47 L 48 47 Z"
            fill="#faf8ff"
          />
        </svg>
      )}
    </div>
  );
};
