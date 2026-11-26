import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4000;

/**
 * CREATORS & BRAND COLLABS
 * - Sponsor brief card + Media slot preview
 * - Delivery proof link & Green payout chip
 */
export const CreatorsScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`creators-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-cre-${categorySlug}`}
      className={className}
    >
      {/* Creator Video Integration Frame */}
      <rect x="64" y="64" width="320" height="272" rx="14" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      <rect x="84" y="84" width="280" height="144" rx="10" fill="#EAF1FB" stroke="#C9DAF2" strokeWidth="1.2" />
      {/* Play triangle */}
      <circle cx="224" cy="156" r="26" fill="#0047AB" className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '224px 156px' }} />
      <polygon points="217,144 238,156 217,168" fill="#FFFFFF" className="pl-anim pl-anim-step-1 pl-final-visible" />

      {/* Caption & Sponsor Tag */}
      <rect x="84" y="244" width="174" height="12" rx="4" fill="#0B0B0F" className="pl-anim pl-anim-step-2 pl-final-visible" />
      <rect x="84" y="266" width="120" height="9" rx="3" fill="#6B7280" className="pl-anim pl-anim-step-2 pl-final-visible" />
      <rect x="84" y="290" width="110" height="26" rx="13" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
      <text x="139" y="307" textAnchor="middle" fill="#4B5563" fontSize="10.5" fontWeight="600">
        60s Slot · Sample
      </text>

      {/* Right: Escrow Sponsorship Steps */}
      <rect x="404" y="64" width="172" height="272" rx="14" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
      <text x="424" y="94" fill="#0B0B0F" fontSize="12" fontWeight="700">Collab Escrow</text>

      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '490px 136px' }}>
        <rect x="424" y="114" width="132" height="44" rx="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
        <text x="440" y="140" fill="#0B0B0F" fontSize="11.5" fontWeight="600">1. Brief Locked</text>
      </g>

      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '490px 194px' }}>
        <rect x="424" y="172" width="132" height="44" rx="10" fill="#EEF4FD" stroke="#C9DAF2" strokeWidth="1.2" />
        <text x="440" y="198" fill="#0047AB" fontSize="11.5" fontWeight="600">2. Clip Live</text>
      </g>

      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '490px 256px' }}>
        <rect x="424" y="232" width="132" height="46" rx="10" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1.2" />
        <path d="M440 255 L444 259 L451 251" stroke="#0B7A55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="458" y="259" fill="#0B7A55" fontSize="11.5" fontWeight="700">Released</text>
      </g>
    </SceneStageFrame>
  );
};

export default CreatorsScene;
