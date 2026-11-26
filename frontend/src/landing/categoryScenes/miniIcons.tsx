import React from 'react';
import type { SceneKey } from './types';

export interface MiniSceneIconProps {
  sceneKey: SceneKey;
  isSelected?: boolean;
  className?: string;
}

/**
 * 40px mini animated icon motif for category explorer tabs.
 * Pure inline SVG using strictly ink/cobalt/gray palette.
 * Animates ONLY on tab hover, focus-visible, or selection via CSS (.pl-mini-active-motif).
 */
export const MiniSceneIcon: React.FC<MiniSceneIconProps> = ({
  sceneKey,
  isSelected = false,
  className = '',
}) => {
  const stroke = isSelected ? '#0047AB' : '#0B0B0F';
  const accent = '#0047AB';
  const tint = '#EAF1FB';

  const renderMotif = () => {
    switch (sceneKey) {
      case 'web3':
        return (
          <>
            <path d="M12 13L18 9.5L24 13V19L18 22.5L12 19V13Z" fill={tint} stroke={accent} strokeWidth="1.5" />
            <path d="M16 21L22 17.5L28 21V27L22 30.5L16 27V21Z" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" className="pl-mini-active-motif" />
          </>
        );
      case 'frontend':
        return (
          <>
            <rect x="8" y="10" width="24" height="20" rx="3" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" />
            <line x1="8" y1="16" x2="32" y2="16" stroke={stroke} strokeWidth="1.5" />
            <rect x="11" y="19" width="8" height="8" rx="1.5" fill={tint} stroke={accent} strokeWidth="1.2" className="pl-mini-active-motif" />
            <rect x="21" y="19" width="8" height="3" rx="1" fill="#B7BCC6" />
            <rect x="21" y="24" width="6" height="3" rx="1" fill={accent} />
          </>
        );
      case 'backend':
        return (
          <>
            <rect x="8" y="12" width="10" height="16" rx="2" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" />
            <ellipse cx="27" cy="14" rx="5" ry="2.5" fill={tint} stroke={accent} strokeWidth="1.5" />
            <path d="M22 14V26C22 27.4 24.2 28.5 27 28.5C29.8 28.5 32 27.4 32 26V14" stroke={accent} strokeWidth="1.5" fill="none" />
            <line x1="18" y1="20" x2="22" y2="20" stroke={accent} strokeWidth="1.5" className="pl-mini-active-motif" />
          </>
        );
      case 'mobile':
        return (
          <>
            <rect x="13" y="8" width="14" height="24" rx="3" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" />
            <rect x="16" y="12" width="8" height="6" rx="1.5" fill={tint} stroke={accent} strokeWidth="1.2" className="pl-mini-active-motif" />
            <line x1="17" y1="28" x2="23" y2="28" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'design':
        return (
          <>
            <rect x="10" y="10" width="20" height="20" rx="2" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" />
            <rect x="14" y="14" width="12" height="8" rx="1.5" fill={tint} stroke={accent} strokeWidth="1.5" className="pl-mini-active-motif" />
            <circle cx="14" cy="26" r="1.8" fill={accent} />
            <circle cx="20" cy="26" r="1.8" fill="#7FA3DB" />
            <circle cx="26" cy="26" r="1.8" fill="#C9DAF2" />
          </>
        );
      case 'data-ai':
        return (
          <>
            <circle cx="13" cy="14" r="2.5" fill={tint} stroke={accent} strokeWidth="1.5" />
            <circle cx="27" cy="14" r="2.5" fill={tint} stroke={accent} strokeWidth="1.5" />
            <circle cx="20" cy="26" r="3" fill={accent} className="pl-mini-active-motif" />
            <line x1="15" y1="15.5" x2="18.5" y2="23.5" stroke={stroke} strokeWidth="1.5" />
            <line x1="25" y1="15.5" x2="21.5" y2="23.5" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case 'data-analytics':
        return (
          <>
            <rect x="10" y="21" width="4" height="8" rx="1" fill="#C9DAF2" />
            <rect x="18" y="16" width="4" height="13" rx="1" fill="#7FA3DB" />
            <rect x="26" y="11" width="4" height="18" rx="1" fill={accent} className="pl-mini-active-motif" />
            <line x1="8" y1="29" x2="32" y2="29" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'devops':
        return (
          <>
            <circle cx="13" cy="20" r="3.5" fill={accent} />
            <circle cx="27" cy="20" r="3.5" fill={tint} stroke={accent} strokeWidth="1.5" className="pl-mini-active-motif" />
            <line x1="16.5" y1="20" x2="23.5" y2="20" stroke={accent} strokeWidth="2" />
          </>
        );
      case 'security':
        return (
          <path
            d="M20 9L30 13V20C30 25.5 25.7 29.8 20 31.5C14.3 29.8 10 25.5 10 20V13L20 9Z"
            fill={tint}
            stroke={accent}
            strokeWidth="1.5"
            className="pl-mini-active-motif"
          />
        );
      case 'content-writing':
        return (
          <>
            <rect x="11" y="9" width="18" height="22" rx="2.5" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" />
            <line x1="15" y1="15" x2="25" y2="15" stroke={accent} strokeWidth="1.5" strokeLinecap="round" className="pl-mini-active-motif" />
            <line x1="15" y1="20" x2="25" y2="20" stroke="#B7BCC6" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="15" y1="25" x2="21" y2="25" stroke="#B7BCC6" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'marketing':
        return (
          <>
            <path d="M10 26L17 19L22 22L30 13" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="pl-mini-active-motif" />
            <path d="M25 13H30V18" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="9" y1="29" x2="31" y2="29" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'creators':
        return (
          <>
            <circle cx="20" cy="20" r="9" fill={tint} stroke={accent} strokeWidth="1.5" />
            <path d="M18 16.5L24.5 20L18 23.5V16.5Z" fill={accent} className="pl-mini-active-motif" />
          </>
        );
      case 'video-motion':
        return (
          <>
            <rect x="9" y="11" width="22" height="13" rx="2" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" />
            <rect x="11" y="27" width="8" height="3.5" rx="1" fill={accent} className="pl-mini-active-motif" />
            <rect x="21" y="27" width="10" height="3.5" rx="1" fill="#7FA3DB" />
          </>
        );
      case 'qa':
        return (
          <>
            <rect x="11" y="10" width="18" height="20" rx="2.5" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" />
            <path d="M15 16L17.5 18.5L22 14" stroke="#0B7A55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="pl-mini-active-motif" />
            <line x1="15" y1="24" x2="25" y2="24" stroke="#B7BCC6" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'admin-support':
        return (
          <>
            <rect x="10" y="12" width="20" height="17" rx="2.5" fill="#FFFFFF" stroke={stroke} strokeWidth="1.5" />
            <line x1="10" y1="17" x2="30" y2="17" stroke={accent} strokeWidth="1.5" />
            <circle cx="15" cy="23" r="2" fill="#0B7A55" className="pl-mini-active-motif" />
            <line x1="19" y1="23" x2="26" y2="23" stroke="#B7BCC6" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case 'generic':
      default:
        return (
          <path
            d="M20 8L30.5 14V26L20 32L9.5 26V14L20 8Z"
            fill={tint}
            stroke={accent}
            strokeWidth="1.5"
            className="pl-mini-active-motif"
          />
        );
    }
  };

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-10 h-10 shrink-0 rounded-[10px] border transition-colors duration-150 ${
        isSelected ? 'bg-[#FFFFFF] border-[#C9DAF2]' : 'bg-[#F5F6FA] border-[#E5E7EB]'
      } ${className}`}
      aria-hidden="true"
    >
      {renderMotif()}
    </svg>
  );
};
