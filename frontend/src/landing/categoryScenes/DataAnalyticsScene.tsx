import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4000;

/**
 * DATA & ANALYTICS
 * - Query table resolves
 * - Bar chart grows & trend line draws
 * - Insight metric chip counts up (labeled Sample)
 */
export const DataAnalyticsScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`analytics-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-bi-${categorySlug}`}
      className={className}
    >
      {/* Main BI Dashboard Container */}
      <rect x="64" y="54" width="512" height="292" rx="14" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      <rect x="64" y="54" width="512" height="44" rx="14" fill="#F5F6FA" />
      <line x1="64" y1="98" x2="576" y2="98" stroke="#E5E7EB" strokeWidth="1.5" />
      <text x="88" y="80" fill="#0B0B0F" fontSize="12.5" fontWeight="700" fontFamily="var(--font-mono)">
        SELECT * FROM analytics · Sample
      </text>

      {/* Top KPI Summary Chips */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '160px 140px' }}>
        <rect x="88" y="116" width="144" height="58" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <text x="104" y="138" fill="#6B7280" fontSize="10.5" fontWeight="600">Pipeline Rows · Sample</text>
        <text x="104" y="160" fill="#0B0B0F" fontSize="16" fontWeight="700" fontFamily="var(--font-mono)">24,810</text>
      </g>

      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '320px 140px' }}>
        <rect x="248" y="116" width="144" height="58" rx="10" fill="#EEF4FD" stroke="#C9DAF2" strokeWidth="1.2" />
        <text x="264" y="138" fill="#4B5563" fontSize="10.5" fontWeight="600">Accuracy · Sample</text>
        <g fill="#0047AB" fontSize="16" fontWeight="700" fontFamily="var(--font-mono)">
          <text x="264" y="160" className="pl-anim pl-anim-count-1 pl-final-hidden">92.4%</text>
          <text x="264" y="160" className="pl-anim pl-anim-count-2 pl-final-hidden">96.8%</text>
          <text x="264" y="160" className="pl-anim pl-anim-count-3 pl-final-visible">99.2%</text>
        </g>
      </g>

      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '480px 140px' }}>
        <rect x="408" y="116" width="144" height="58" rx="10" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1.2" />
        <text x="424" y="138" fill="#0B7A55" fontSize="10.5" fontWeight="700">SQL Sync</text>
        <text x="424" y="160" fill="#0B7A55" fontSize="15" fontWeight="700">Ready</text>
      </g>

      {/* Chart Area */}
      <rect x="88" y="192" width="464" height="134" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
      <line x1="112" y1="304" x2="528" y2="304" stroke="#B7BCC6" strokeWidth="1.5" />

      {/* Bars */}
      <rect x="130" y="264" width="38" height="40" rx="4" fill="#C9DAF2" style={{ transformOrigin: '149px 304px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="196" y="244" width="38" height="60" rx="4" fill="#A9C1E8" style={{ transformOrigin: '215px 304px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="262" y="232" width="38" height="72" rx="4" fill="#7FA3DB" style={{ transformOrigin: '281px 304px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="328" y="218" width="38" height="86" rx="4" fill="#2F6BC9" style={{ transformOrigin: '347px 304px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="394" y="206" width="38" height="98" rx="4" fill="#0047AB" style={{ transformOrigin: '413px 304px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />
      <rect x="460" y="198" width="38" height="106" rx="4" fill="#003A8C" style={{ transformOrigin: '479px 304px' }} className="pl-anim pl-anim-bar-y pl-final-scale1" />

      {/* Trend Line */}
      <path
        d="M149 258 L215 236 L281 226 L347 210 L413 198 L479 188"
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

export default DataAnalyticsScene;
