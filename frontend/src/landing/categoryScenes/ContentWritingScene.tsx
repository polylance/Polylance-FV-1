import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4000;

/**
 * CONTENT, WRITING AND MARKETING (Writing focus)
 * - Text lines type in with a caret
 * - Word counter ticks up (labeled Sample)
 * - Small chart bar rises beside it
 */
export const ContentWritingScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`content-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-write-${categorySlug}`}
      className={className}
    >
      {/* Left: Editorial Document Card */}
      <rect x="64" y="58" width="346" height="284" rx="14" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      <rect x="88" y="84" width="120" height="22" rx="11" fill="#EAF1FB" />
      <text x="148" y="99" textAnchor="middle" fill="#0047AB" fontSize="10.5" fontWeight="700">
        Whitepaper Draft
      </text>

      {/* Headline */}
      <rect x="88" y="122" width="248" height="14" rx="4" fill="#0B0B0F" />
      <line x1="88" y1="150" x2="384" y2="150" stroke="#0047AB" strokeWidth="2" />

      {/* Typing Paragraph Lines */}
      <rect x="88" y="170" width="290" height="10" rx="4" fill="#4B5563" style={{ transformOrigin: '88px 175px' }} className="pl-anim pl-anim-step-1 pl-final-visible" />
      <rect x="88" y="192" width="268" height="10" rx="4" fill="#6B7280" style={{ transformOrigin: '88px 197px' }} className="pl-anim pl-anim-step-2 pl-final-visible" />
      <rect x="88" y="214" width="282" height="10" rx="4" fill="#6B7280" style={{ transformOrigin: '88px 219px' }} className="pl-anim pl-anim-step-3 pl-final-visible" />
      <rect x="88" y="236" width="194" height="10" rx="4" fill="#B7BCC6" style={{ transformOrigin: '88px 241px' }} className="pl-anim pl-anim-step-4 pl-final-visible" />

      {/* Caret Marker */}
      <rect x="288" y="233" width="2.5" height="16" rx="1" fill="#0047AB" className="pl-anim pl-anim-step-4 pl-final-visible" />

      {/* Word Counter Pill at Bottom */}
      <rect x="88" y="276" width="296" height="42" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
      <text x="104" y="301" fill="#6B7280" fontSize="11" fontWeight="600">Word Count · Sample</text>
      <g fill="#0B0B0F" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
        <text x="368" y="302" textAnchor="end" className="pl-anim pl-anim-count-1 pl-final-hidden">180 words</text>
        <text x="368" y="302" textAnchor="end" className="pl-anim pl-anim-count-2 pl-final-hidden">540 words</text>
        <text x="368" y="302" textAnchor="end" className="pl-anim pl-anim-count-3 pl-final-visible">920 words</text>
      </g>

      {/* Right: Readership / Engagement Chart Bar */}
      <rect x="430" y="58" width="146" height="284" rx="14" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
      <text x="450" y="88" fill="#0B0B0F" fontSize="11.5" fontWeight="700">Impact · Sample</text>
      <line x1="450" y1="274" x2="556" y2="274" stroke="#B7BCC6" strokeWidth="1.5" />

      <rect x="456" y="218" width="22" height="56" rx="4" fill="#C9DAF2" style={{ transformOrigin: '467px 274px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="492" y="182" width="22" height="92" rx="4" fill="#7FA3DB" style={{ transformOrigin: '503px 274px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="528" y="138" width="22" height="136" rx="4" fill="#0047AB" style={{ transformOrigin: '539px 274px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />

      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '503px 306px' }}>
        <rect x="450" y="290" width="106" height="28" rx="14" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1" />
        <text x="503" y="308" textAnchor="middle" fill="#0B7A55" fontSize="10.5" fontWeight="700">Published</text>
      </g>
    </SceneStageFrame>
  );
};

export default ContentWritingScene;
