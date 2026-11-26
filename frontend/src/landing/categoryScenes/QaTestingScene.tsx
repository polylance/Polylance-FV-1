import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 3800;

/**
 * QA AND TESTING
 * - Checklist items tick one after another
 * - Green progress bar fills smoothly (scaleX)
 */
export const QaTestingScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`qa-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-qa-${categorySlug}`}
      className={className}
    >
      {/* Checklist Card */}
      <rect x="88" y="54" width="464" height="292" rx="16" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      <text x="116" y="88" fill="#0B0B0F" fontSize="13.5" fontWeight="700">
        Automated Test Suite · Sample
      </text>
      <line x1="116" y1="104" x2="524" y2="104" stroke="#0047AB" strokeWidth="2" />

      {/* Checklist Item 1 */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '320px 140px' }}>
        <rect x="116" y="120" width="408" height="44" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx="144" cy="142" r="11" fill="#0B7A55" />
        <path d="M139 142 L142.5 145.5 L149 139" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="168" y="146" fill="#0B0B0F" fontSize="12" fontWeight="600">Unit &amp; Contract Assertions</text>
        <text x="504" y="146" textAnchor="end" fill="#0B7A55" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">PASS</text>
      </g>

      {/* Checklist Item 2 */}
      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '320px 194px' }}>
        <rect x="116" y="174" width="408" height="44" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx="144" cy="196" r="11" fill="#0B7A55" />
        <path d="M139 196 L142.5 199.5 L149 193" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="168" y="200" fill="#0B0B0F" fontSize="12" fontWeight="600">Cross-Browser E2E Flow</text>
        <text x="504" y="200" textAnchor="end" fill="#0B7A55" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">PASS</text>
      </g>

      {/* Checklist Item 3 */}
      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '320px 248px' }}>
        <rect x="116" y="228" width="408" height="44" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx="144" cy="250" r="11" fill="#0B7A55" />
        <path d="M139 250 L142.5 253.5 L149 247" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="168" y="254" fill="#0B0B0F" fontSize="12" fontWeight="600">Accessibility &amp; CLS Audit</text>
        <text x="504" y="254" textAnchor="end" fill="#0B7A55" fontSize="11" fontWeight="700" fontFamily="var(--font-mono)">PASS</text>
      </g>

      {/* Green Progress Bar */}
      <text x="116" y="302" fill="#4B5563" fontSize="11" fontWeight="600">Coverage</text>
      <rect x="116" y="312" width="408" height="14" rx="7" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1" />
      <rect
        x="116"
        y="312"
        width="408"
        height="14"
        rx="7"
        fill="#0B7A55"
        style={{ transformOrigin: '116px 319px' }}
        className="pl-anim pl-anim-bar-x pl-final-scale1"
      />
    </SceneStageFrame>
  );
};

export default QaTestingScene;
