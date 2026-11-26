import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4400;

/**
 * WEB3 / SMART CONTRACTS ("contract execution")
 * - Three hexagon blocks join into a chain (link lines draw sequentially)
 * - Lock on middle block closes
 * - Small official USDC cobalt/blue token chip travels along the chain
 * - Short hash chip types in (0x… Sample, tabular)
 * - Green "Verified" tick appears
 */
export const Web3Scene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`web3-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-web3-${categorySlug}`}
      className={className}
    >
      {/* Background Connector Guides */}
      <line x1="210" y1="168" x2="274" y2="168" stroke="#E5E7EB" strokeWidth="2.5" strokeDasharray="4 4" />
      <line x1="366" y1="168" x2="430" y2="168" stroke="#E5E7EB" strokeWidth="2.5" strokeDasharray="4 4" />

      {/* Drawing Chain Link 1 (Block 1 -> Block 2) */}
      <line
        x1="210"
        y1="168"
        x2="274"
        y2="168"
        stroke="#0047AB"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="pl-anim pl-anim-draw-1 pl-final-visible"
      />
      {/* Drawing Chain Link 2 (Block 2 -> Block 3) */}
      <line
        x1="366"
        y1="168"
        x2="430"
        y2="168"
        stroke="#0047AB"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="pl-anim pl-anim-draw-2 pl-final-visible"
      />

      {/* Block 1: Escrow Init */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '164px 168px' }}>
        <path
          d="M164 114 L210 141 L210 195 L164 222 L118 195 L118 141 Z"
          fill="#F5F6FA"
          stroke="#0B0B0F"
          strokeWidth="1.5"
        />
        <rect x="148" y="156" width="32" height="10" rx="3" fill="#B7BCC6" />
        <rect x="154" y="172" width="20" height="6" rx="2" fill="#0047AB" />
        <text x="164" y="242" textAnchor="middle" fill="#4B5563" fontSize="11" fontWeight="600">
          Deposit
        </text>
      </g>

      {/* Block 2: Middle Escrow Vault + Closing Lock */}
      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '320px 168px' }}>
        <path
          d="M320 110 L368 138 L368 198 L320 226 L272 198 L272 138 Z"
          fill="#EAF1FB"
          stroke="#0047AB"
          strokeWidth="1.75"
        />
        {/* Lock Shackle (closes down) */}
        <path
          d="M312 162 V153 C312 148.5 315.6 145 320 145 C324.4 145 328 148.5 328 153 V162"
          stroke="#0047AB"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          className="pl-anim pl-anim-lock pl-final-lock"
        />
        {/* Lock Body */}
        <rect x="307" y="162" width="26" height="20" rx="4" fill="#0047AB" />
        <circle cx="320" cy="172" r="2.5" fill="#FFFFFF" />
        <text x="320" y="242" textAnchor="middle" fill="#0B0B0F" fontSize="11" fontWeight="700">
          Smart Escrow
        </text>
      </g>

      {/* Block 3: Settlement Block */}
      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '476px 168px' }}>
        <path
          d="M476 114 L522 141 L522 195 L476 222 L430 195 L430 141 Z"
          fill="#F5F6FA"
          stroke="#0B0B0F"
          strokeWidth="1.5"
        />
        <rect x="460" y="156" width="32" height="10" rx="3" fill="#7FA3DB" />
        <rect x="466" y="172" width="20" height="6" rx="2" fill="#0B7A55" />
        <text x="476" y="242" textAnchor="middle" fill="#4B5563" fontSize="11" fontWeight="600">
          Release
        </text>
      </g>

      {/* Traveling Token Chip (Official USDC logo motif in Cobalt Blue #0047AB) */}
      <g className="pl-anim pl-anim-token pl-final-token" style={{ transformOrigin: '164px 104px' }}>
        <rect x="138" y="74" width="52" height="24" rx="12" fill="#FFFFFF" stroke="#0047AB" strokeWidth="1.5" />
        {/* Official USDC symbol mark in cobalt */}
        <circle cx="152" cy="86" r="7.5" fill="#0047AB" />
        <text x="152" y="89.5" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="700">
          $
        </text>
        <text x="172" y="89.5" textAnchor="middle" fill="#0B0B0F" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
          USDC
        </text>
      </g>

      {/* Bottom Status Bar: Typed Hash Chip (Sample) + Green Verified Tick */}
      <rect x="118" y="274" width="404" height="58" rx="12" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* Hash Pill */}
      <rect x="134" y="287" width="218" height="32" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
      <text x="146" y="307" fill="#6B7280" fontSize="11.5" fontFamily="var(--font-mono)" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <tspan className="pl-anim pl-anim-type-1 pl-final-visible">0x7a3f</tspan>
        <tspan className="pl-anim pl-anim-type-2 pl-final-visible">…91c4</tspan>
        <tspan className="pl-anim pl-anim-type-3 pl-final-visible" fill="#9CA3AF"> · Sample</tspan>
      </text>

      {/* Verified On-Chain Green Chip */}
      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '448px 303px' }}>
        <rect x="386" y="287" width="122" height="32" rx="16" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1.2" />
        <circle cx="404" cy="303" r="8" fill="#0B7A55" />
        <path
          d="M400 303 L403 306 L408.5 300"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="418" y="307" fill="#0B7A55" fontSize="11.5" fontWeight="700">
          Verified
        </text>
      </g>
    </SceneStageFrame>
  );
};

export default Web3Scene;
