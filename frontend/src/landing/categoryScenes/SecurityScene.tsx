import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4200;

/**
 * SECURITY AND AUDIT
 * - Code lines appear
 * - Scan line sweeps down
 * - One line highlighted in soft red tint, then fixed (neutral)
 * - Shield with green check settles
 */
export const SecurityScene: React.FC<CategorySceneProps> = ({
  categoryName,
  categorySlug,
  playbackMode = 'interactive',
  isActive = true,
  forcedState,
  showReplayButton = true,
  className = '',
}) => {
  return (
    <SceneStageFrame
      sceneKey={`security-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-sec-${categorySlug}`}
      className={className}
    >
      {/* Left: Code Inspector Card */}
      <rect x="64" y="64" width="338" height="272" rx="14" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      <rect x="64" y="64" width="338" height="38" rx="14" fill="#F5F6FA" />
      <line x1="64" y1="102" x2="402" y2="102" stroke="#E5E7EB" strokeWidth="1.5" />
      <text x="86" y="88" fill="#0B0B0F" fontSize="11.5" fontWeight="700" fontFamily="var(--font-mono)">
        EscrowVault.sol
      </text>

      {/* Code Lines */}
      <rect x="86" y="122" width="180" height="10" rx="4" fill="#B7BCC6" />
      <rect x="86" y="146" width="230" height="10" rx="4" fill="#7FA3DB" />

      {/* Highlighted Issue Line (flashes soft red then turns neutral fixed) */}
      <rect x="80" y="166" width="306" height="26" rx="6" fill="#F5F6FA" />
      <rect
        x="80"
        y="166"
        width="306"
        height="26"
        rx="6"
        fill="#FEE2E2"
        stroke="#DC2626"
        strokeWidth="1"
        className="pl-anim pl-anim-bug pl-final-hidden"
      />
      <rect x="88" y="174" width="204" height="10" rx="4" fill="#0B0B0F" />

      <rect x="86" y="206" width="250" height="10" rx="4" fill="#B7BCC6" />
      <rect x="86" y="230" width="160" height="10" rx="4" fill="#A9C1E8" />
      <rect x="86" y="254" width="210" height="10" rx="4" fill="#B7BCC6" />
      <rect x="86" y="278" width="140" height="10" rx="4" fill="#0047AB" />

      {/* Sweeping Cobalt Scan Line */}
      <g className="pl-anim pl-anim-scan pl-final-hidden">
        <line x1="72" y1="114" x2="394" y2="114" stroke="#0047AB" strokeWidth="2.5" />
        <rect x="72" y="106" width="322" height="8" fill="#EAF1FB" fillOpacity="0.6" />
      </g>

      {/* Right: Audit Shield Panel */}
      <rect x="424" y="64" width="152" height="272" rx="14" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '500px 180px' }}>
        <path
          d="M500 116 L546 135 V178 C546 212 526 236 500 248 C474 236 454 212 454 178 V135 L500 116 Z"
          fill="#E8F7EF"
          stroke="#0B7A55"
          strokeWidth="2"
        />
        <path
          d="M484 180 L495 191 L518 167"
          stroke="#0B7A55"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="454" y="268" width="92" height="28" rx="14" fill="#FFFFFF" stroke="#BFE6D3" strokeWidth="1.2" />
        <text x="500" y="286" textAnchor="middle" fill="#0B7A55" fontSize="11.5" fontWeight="700">
          0 Critical
        </text>
      </g>
    </SceneStageFrame>
  );
};

export default SecurityScene;
