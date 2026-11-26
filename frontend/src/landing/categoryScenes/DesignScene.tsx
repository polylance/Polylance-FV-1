import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4200;

/**
 * DESIGN / UI-UX
 * - Artboard with corner handles
 * - Rectangle drawn by cursor & snaps to grid
 * - Text line appears inside card
 * - Three palette swatches (cobalt shades ONLY) pop in
 * - Layer panel lists items on right
 */
export const DesignScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`design-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-des-${categorySlug}`}
      className={className}
    >
      {/* Left: Artboard Canvas */}
      <rect x="64" y="54" width="338" height="292" rx="10" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      {/* Artboard Corner Anchor Handles */}
      <rect x="60" y="50" width="8" height="8" rx="1.5" fill="#FFFFFF" stroke="#0047AB" strokeWidth="1.5" />
      <rect x="398" y="50" width="8" height="8" rx="1.5" fill="#FFFFFF" stroke="#0047AB" strokeWidth="1.5" />
      <rect x="60" y="342" width="8" height="8" rx="1.5" fill="#FFFFFF" stroke="#0047AB" strokeWidth="1.5" />
      <rect x="398" y="342" width="8" height="8" rx="1.5" fill="#FFFFFF" stroke="#0047AB" strokeWidth="1.5" />

      {/* Subtle Layout Grid Guides */}
      <line x1="176" y1="54" x2="176" y2="346" stroke="#EAF1FB" strokeWidth="1" />
      <line x1="290" y1="54" x2="290" y2="346" stroke="#EAF1FB" strokeWidth="1" />
      <line x1="64" y1="152" x2="402" y2="152" stroke="#EAF1FB" strokeWidth="1" />
      <line x1="64" y1="248" x2="402" y2="248" stroke="#EAF1FB" strokeWidth="1" />

      {/* Drawn Card Container (snaps cleanly) */}
      <rect
        x="104"
        y="94"
        width="258"
        height="148"
        rx="12"
        fill="#F5F6FA"
        stroke="#0047AB"
        strokeWidth="1.75"
        className="pl-anim pl-anim-rect pl-final-visible"
      />

      {/* Inside Card: Header & Text Line */}
      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '233px 168px' }}>
        <rect x="126" y="118" width="96" height="14" rx="4" fill="#0B0B0F" />
        <rect x="126" y="142" width="184" height="9" rx="3" fill="#6B7280" />
        <rect x="126" y="160" width="136" height="9" rx="3" fill="#B7BCC6" />
        <rect x="126" y="188" width="86" height="28" rx="14" fill="#0047AB" />
        <text x="169" y="206" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="600">
          Component
        </text>
      </g>

      {/* Three Cobalt Palette Swatches Below Card */}
      <g className="pl-anim pl-anim-swatch-1 pl-final-visible" style={{ transformOrigin: '132px 292px' }}>
        <rect x="104" y="266" width="56" height="52" rx="10" fill="#0047AB" />
        <text x="132" y="306" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontFamily="var(--font-mono)">#0047AB</text>
      </g>
      <g className="pl-anim pl-anim-swatch-2 pl-final-visible" style={{ transformOrigin: '202px 292px' }}>
        <rect x="174" y="266" width="56" height="52" rx="10" fill="#2F6BC9" />
        <text x="202" y="306" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontFamily="var(--font-mono)">#2F6BC9</text>
      </g>
      <g className="pl-anim pl-anim-swatch-3 pl-final-visible" style={{ transformOrigin: '272px 292px' }}>
        <rect x="244" y="266" width="56" height="52" rx="10" fill="#EAF1FB" stroke="#C9DAF2" strokeWidth="1.2" />
        <text x="272" y="306" textAnchor="middle" fill="#0047AB" fontSize="9.5" fontFamily="var(--font-mono)">#EAF1FB</text>
      </g>

      {/* Right: Layer Panel */}
      <rect x="424" y="54" width="152" height="292" rx="12" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
      <text x="440" y="80" fill="#0B0B0F" fontSize="11.5" fontWeight="700">Layers</text>
      <line x1="424" y1="92" x2="576" y2="92" stroke="#E5E7EB" strokeWidth="1.2" />

      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '500px 120px' }}>
        <rect x="436" y="106" width="128" height="32" rx="8" fill="#EEF4FD" stroke="#C9DAF2" strokeWidth="1.2" />
        <rect x="448" y="117" width="10" height="10" rx="2" stroke="#0047AB" strokeWidth="1.4" fill="none" />
        <text x="466" y="126" fill="#0047AB" fontSize="11" fontWeight="700">Artboard</text>
      </g>

      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '500px 162px' }}>
        <rect x="436" y="148" width="128" height="32" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
        <rect x="448" y="159" width="10" height="10" rx="2" fill="#0B0B0F" />
        <text x="466" y="168" fill="#0B0B0F" fontSize="11" fontWeight="600">Hero Card</text>
      </g>

      <g className="pl-anim pl-anim-step-4 pl-final-visible" style={{ transformOrigin: '500px 204px' }}>
        <rect x="436" y="190" width="128" height="32" rx="8" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
        <circle cx="453" cy="206" r="5" fill="#7FA3DB" />
        <text x="466" y="210" fill="#4B5563" fontSize="11" fontWeight="600">Swatches</text>
      </g>
    </SceneStageFrame>
  );
};

export default DesignScene;
