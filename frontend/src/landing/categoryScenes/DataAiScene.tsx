import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4200;

/**
 * DATA, AI AND ANALYTICS (AI & Automation focus)
 * - Scattered nodes connect into a neural network
 * - Bars grow in chart & trend line draws
 * - Model-score chip counts up (labeled Sample)
 */
export const DataAiScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`data-ai-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-ai-${categorySlug}`}
      className={className}
    >
      {/* Left Panel: Neural Node Network */}
      <rect x="56" y="64" width="248" height="272" rx="14" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
      <text x="76" y="92" fill="#0B0B0F" fontSize="12" fontWeight="700">Agent Pipeline</text>

      {/* Network Synapses Drawing */}
      <g stroke="#0047AB" strokeWidth="1.5" className="pl-anim pl-anim-draw-1 pl-final-visible">
        <line x1="108" y1="146" x2="180" y2="128" />
        <line x1="108" y1="146" x2="180" y2="200" />
        <line x1="108" y1="226" x2="180" y2="200" />
        <line x1="108" y1="226" x2="180" y2="272" />
      </g>
      <g stroke="#2F6BC9" strokeWidth="1.5" className="pl-anim pl-anim-draw-2 pl-final-visible">
        <line x1="180" y1="128" x2="256" y2="164" />
        <line x1="180" y1="200" x2="256" y2="164" />
        <line x1="180" y1="200" x2="256" y2="236" />
        <line x1="180" y1="272" x2="256" y2="236" />
      </g>

      {/* Input Nodes */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '108px 186px' }}>
        <circle cx="108" cy="146" r="12" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
        <circle cx="108" cy="226" r="12" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      </g>
      {/* Hidden Layer Nodes */}
      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '180px 200px' }}>
        <circle cx="180" cy="128" r="12" fill="#EAF1FB" stroke="#0047AB" strokeWidth="1.5" />
        <circle cx="180" cy="200" r="14" fill="#0047AB" />
        <circle cx="180" cy="272" r="12" fill="#EAF1FB" stroke="#0047AB" strokeWidth="1.5" />
      </g>
      {/* Output Nodes */}
      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '256px 200px' }}>
        <circle cx="256" cy="164" r="13" fill="#2F6BC9" />
        <circle cx="256" cy="236" r="13" fill="#0B7A55" />
      </g>

      {/* Right Panel: Chart + Model Score Chip */}
      <rect x="328" y="64" width="256" height="272" rx="14" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* Model Score Chip (Sample, discrete opacity count-up) */}
      <rect x="348" y="84" width="216" height="44" rx="10" fill="#EEF4FD" stroke="#C9DAF2" strokeWidth="1.2" />
      <text x="364" y="103" fill="#4B5563" fontSize="10.5" fontWeight="600">Eval Score · Sample</text>
      <g fill="#0047AB" fontSize="16" fontWeight="700" fontFamily="var(--font-mono)" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <text x="364" y="120" className="pl-anim pl-anim-count-1 pl-final-hidden">0.84</text>
        <text x="364" y="120" className="pl-anim pl-anim-count-2 pl-final-hidden">0.91</text>
        <text x="364" y="120" className="pl-anim pl-anim-count-3 pl-final-visible">0.97</text>
      </g>
      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '524px 106px' }}>
        <rect x="488" y="95" width="64" height="22" rx="11" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1" />
        <text x="520" y="110" textAnchor="middle" fill="#0B7A55" fontSize="10" fontWeight="700">Verified</text>
      </g>

      {/* Growing Chart Bars */}
      <line x1="356" y1="296" x2="556" y2="296" stroke="#E5E7EB" strokeWidth="1.5" />
      <rect x="368" y="246" width="26" height="50" rx="4" fill="#C9DAF2" style={{ transformOrigin: '381px 296px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="412" y="218" width="26" height="78" rx="4" fill="#7FA3DB" style={{ transformOrigin: '425px 296px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="456" y="188" width="26" height="108" rx="4" fill="#2F6BC9" style={{ transformOrigin: '469px 296px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="500" y="156" width="26" height="140" rx="4" fill="#0047AB" style={{ transformOrigin: '513px 296px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />

      {/* Drawn Trend Line */}
      <path
        d="M381 236 L425 206 L469 178 L513 144"
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

export default DataAiScene;
