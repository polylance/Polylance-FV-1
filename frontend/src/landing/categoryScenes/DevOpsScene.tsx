import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4000;

/**
 * DEVOPS, CLOUD AND INFRASTRUCTURE
 * - Pipeline of steps (Build, Test, Deploy) matching Workflow stepper style
 * - Each step resolves to a check
 * - Server icon appears at end with a "Live" chip
 */
export const DevOpsScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`devops-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-devops-${categorySlug}`}
      className={className}
    >
      {/* Pipeline Card Container (Workflow Stepper Style) */}
      <rect x="64" y="88" width="512" height="224" rx="16" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* Track Lines */}
      <line x1="146" y1="168" x2="274" y2="168" stroke="#E5E7EB" strokeWidth="4" />
      <line x1="274" y1="168" x2="402" y2="168" stroke="#E5E7EB" strokeWidth="4" />
      <line x1="402" y1="168" x2="494" y2="168" stroke="#E5E7EB" strokeWidth="4" strokeDasharray="4 4" />

      {/* Cobalt Active Connector Lines */}
      <line x1="146" y1="168" x2="274" y2="168" stroke="#0047AB" strokeWidth="4" className="pl-anim pl-anim-draw-1 pl-final-visible" />
      <line x1="274" y1="168" x2="402" y2="168" stroke="#0047AB" strokeWidth="4" className="pl-anim pl-anim-draw-2 pl-final-visible" />

      {/* Step 1: Build */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '146px 168px' }}>
        <circle cx="146" cy="168" r="24" fill="#0047AB" />
        <path d="M137 168 L143 174 L155 162" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="146" y="210" textAnchor="middle" fill="#0B0B0F" fontSize="12.5" fontWeight="700">Build</text>
      </g>

      {/* Step 2: Test */}
      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '274px 168px' }}>
        <circle cx="274" cy="168" r="24" fill="#0047AB" />
        <path d="M265 168 L271 174 L283 162" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="274" y="210" textAnchor="middle" fill="#0B0B0F" fontSize="12.5" fontWeight="700">Test</text>
      </g>

      {/* Step 3: Deploy */}
      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '402px 168px' }}>
        <circle cx="402" cy="168" r="24" fill="#0047AB" />
        <path d="M393 168 L399 174 L411 162" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="402" y="210" textAnchor="middle" fill="#0B0B0F" fontSize="12.5" fontWeight="700">Deploy</text>
      </g>

      {/* End Node: Server Icon + Live Chip */}
      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '506px 168px' }}>
        <rect x="476" y="138" width="60" height="60" rx="12" fill="#EAF1FB" stroke="#0047AB" strokeWidth="1.5" />
        <rect x="488" y="152" width="36" height="10" rx="3" fill="#0047AB" />
        <rect x="488" y="168" width="36" height="10" rx="3" fill="#2F6BC9" />
        <circle cx="494" cy="157" r="1.5" fill="#FFFFFF" />
        <circle cx="494" cy="173" r="1.5" fill="#FFFFFF" />

        <rect x="478" y="206" width="56" height="22" rx="11" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1" />
        <circle cx="492" cy="217" r="3.5" fill="#0B7A55" />
        <text x="512" y="221" textAnchor="middle" fill="#0B7A55" fontSize="10.5" fontWeight="700">Live</text>
      </g>

      {/* Action Bar Below (Image 3 style) */}
      <rect x="92" y="246" width="456" height="44" rx="12" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
      <text x="112" y="272" fill="#4B5563" fontSize="11.5" fontWeight="600">
        Cluster healthy · Zero downtime rollout
      </text>
      <rect x="444" y="255" width="88" height="26" rx="13" fill="#0047AB" />
      <text x="488" y="272" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="600">
        Done
      </text>
    </SceneStageFrame>
  );
};

export default DevOpsScene;
