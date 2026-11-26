import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4000;

/**
 * MARKETING
 * - SEO & acquisition campaign funnel + rising conversion curve
 * - Milestone verified chip
 */
export const MarketingScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`marketing-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-mkt-${categorySlug}`}
      className={className}
    >
      {/* Left: Campaign Funnel Stages */}
      <rect x="64" y="64" width="234" height="272" rx="14" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
      <text x="84" y="94" fill="#0B0B0F" fontSize="12.5" fontWeight="700">Campaign Funnel · Sample</text>

      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '181px 138px' }}>
        <rect x="84" y="114" width="194" height="44" rx="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
        <rect x="98" y="130" width="90" height="10" rx="4" fill="#0B0B0F" />
        <text x="264" y="140" textAnchor="end" fill="#0047AB" fontSize="11.5" fontWeight="700" fontFamily="var(--font-mono)">SEO</text>
      </g>

      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '181px 196px' }}>
        <rect x="96" y="172" width="170" height="44" rx="10" fill="#EAF1FB" stroke="#C9DAF2" strokeWidth="1.2" />
        <rect x="110" y="188" width="76" height="10" rx="4" fill="#0047AB" />
        <text x="252" y="198" textAnchor="end" fill="#0047AB" fontSize="11.5" fontWeight="700" fontFamily="var(--font-mono)">CRO</text>
      </g>

      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '181px 256px' }}>
        <rect x="112" y="232" width="138" height="46" rx="10" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1.2" />
        <path d="M130 255 L134 259 L142 251" stroke="#0B7A55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="152" y="259" fill="#0B7A55" fontSize="12" fontWeight="700">Converted</text>
      </g>

      {/* Right: Growth Curve & KPI Bar */}
      <rect x="318" y="64" width="258" height="272" rx="14" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      <text x="342" y="94" fill="#0B0B0F" fontSize="12.5" fontWeight="700">Organic Reach · Sample</text>

      <line x1="342" y1="274" x2="548" y2="274" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="356" y="228" width="28" height="46" rx="4" fill="#C9DAF2" style={{ transformOrigin: '370px 274px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="404" y="194" width="28" height="80" rx="4" fill="#7FA3DB" style={{ transformOrigin: '418px 274px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="452" y="158" width="28" height="116" rx="4" fill="#2F6BC9" style={{ transformOrigin: '466px 274px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="500" y="122" width="28" height="152" rx="4" fill="#0047AB" style={{ transformOrigin: '514px 274px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />

      <path
        d="M370 218 L418 182 L466 146 L514 110"
        stroke="#0B0B0F"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="pl-anim pl-anim-draw-long pl-final-visible"
      />
    </SceneStageFrame>
  );
};

export default MarketingScene;
