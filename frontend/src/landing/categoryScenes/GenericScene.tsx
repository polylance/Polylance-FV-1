import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4000;

/**
 * Automatic Generic Fallback Scene:
 * - Category icon inside a hexagon frame
 * - Three skill chips (from real category skills) popping in around it
 * - Mini three-step Workflow stepper (Post, Fund, Get paid) filling
 * - Green Verified / Done tick
 */
export const GenericScene: React.FC<CategorySceneProps> = ({
  categoryName,
  categorySlug,
  skills = [],
  playbackMode = 'interactive',
  isActive = true,
  forcedState,
  showReplayButton = true,
  className = '',
}) => {
  const chipLabels = [
    skills[0] || 'Scope Spec',
    skills[1] || 'Milestone',
    skills[2] || 'Delivery',
  ];

  const shortChip = (text: string) => (text.length > 14 ? `${text.slice(0, 12)}…` : text);

  return (
    <SceneStageFrame
      sceneKey={`generic-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-generic-${categorySlug}`}
      className={className}
    >
      {/* Center Hexagon Frame */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '320px 150px' }}>
        <path
          d="M320 76 L384 113 L384 187 L320 224 L256 187 L256 113 Z"
          fill="#EAF1FB"
          stroke="#0047AB"
          strokeWidth="1.5"
        />
        <path
          d="M320 92 L370 121 L370 179 L320 208 L270 179 L270 121 Z"
          fill="#FFFFFF"
          stroke="#C9DAF2"
          strokeWidth="1.5"
        />
        {/* Generic category emblem glyph */}
        <rect x="303" y="133" width="34" height="34" rx="8" fill="#0047AB" />
        <path d="M313 150H327M320 143V157" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Three Real Skill Chips around Hexagon */}
      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '162px 115px' }}>
        <rect x="92" y="96" width="136" height="34" rx="17" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="110" cy="113" r="4" fill="#0047AB" />
        <text x="122" y="117" fill="#0B0B0F" fontSize="12" fontWeight="600" fontFamily="var(--font-body)">
          {shortChip(chipLabels[0])}
        </text>
      </g>

      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '478px 115px' }}>
        <rect x="412" y="96" width="136" height="34" rx="17" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="430" cy="113" r="4" fill="#2F6BC9" />
        <text x="442" y="117" fill="#0B0B0F" fontSize="12" fontWeight="600" fontFamily="var(--font-body)">
          {shortChip(chipLabels[1])}
        </text>
      </g>

      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '478px 185px' }}>
        <rect x="412" y="168" width="136" height="34" rx="17" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="430" cy="185" r="4" fill="#7FA3DB" />
        <text x="442" y="189" fill="#0B0B0F" fontSize="12" fontWeight="600" fontFamily="var(--font-body)">
          {shortChip(chipLabels[2])}
        </text>
      </g>

      {/* Mini 3-Step Workflow Stepper Card at Bottom */}
      <rect x="110" y="254" width="420" height="96" rx="14" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* Track lines */}
      <line x1="184" y1="292" x2="320" y2="292" stroke="#E5E7EB" strokeWidth="3" />
      <line x1="320" y1="292" x2="456" y2="292" stroke="#E5E7EB" strokeWidth="3" />

      {/* Cobalt filling lines */}
      <line
        x1="184"
        y1="292"
        x2="320"
        y2="292"
        stroke="#0047AB"
        strokeWidth="3"
        className="pl-anim pl-anim-draw-1 pl-final-visible"
      />
      <line
        x1="320"
        y1="292"
        x2="456"
        y2="292"
        stroke="#0047AB"
        strokeWidth="3"
        className="pl-anim pl-anim-draw-2 pl-final-visible"
      />

      {/* Step 1: Post */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '184px 292px' }}>
        <circle cx="184" cy="292" r="14" fill="#0047AB" />
        <text x="184" y="296" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700">1</text>
        <text x="184" y="324" textAnchor="middle" fill="#0B0B0F" fontSize="12" fontWeight="600">Post</text>
      </g>

      {/* Step 2: Fund */}
      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '320px 292px' }}>
        <circle cx="320" cy="292" r="14" fill="#0047AB" />
        <text x="320" y="296" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700">2</text>
        <text x="320" y="324" textAnchor="middle" fill="#0B0B0F" fontSize="12" fontWeight="600">Fund</text>
      </g>

      {/* Step 3: Get paid + Green Done Tick */}
      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '456px 292px' }}>
        <circle cx="456" cy="292" r="14" fill="#0B7A55" />
        <path d="M450 292L454.5 296.5L462 288" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="456" y="324" textAnchor="middle" fill="#0B7A55" fontSize="12" fontWeight="700">Get paid</text>
      </g>
    </SceneStageFrame>
  );
};

export default GenericScene;
