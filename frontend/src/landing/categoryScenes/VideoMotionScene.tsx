import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4200;

/**
 * VIDEO AND MOTION
 * - Preview monitor frame updates
 * - Timeline with clip blocks sliding into place
 * - Playhead sweeps smoothly across tracks
 */
export const VideoMotionScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`video-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-vid-${categorySlug}`}
      className={className}
    >
      {/* Top: Video Preview Viewport */}
      <rect x="64" y="46" width="512" height="178" rx="14" fill="#0B0B0F" />
      <rect x="82" y="64" width="476" height="142" rx="10" fill="#18181B" />

      {/* Preview Scene Geometry Updating */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '320px 135px' }}>
        <rect x="114" y="84" width="176" height="98" rx="10" fill="#0047AB" />
        <polygon points="190,118 220,133 190,148" fill="#FFFFFF" />
      </g>
      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '430px 135px' }}>
        <rect x="310" y="92" width="214" height="16" rx="4" fill="#FFFFFF" />
        <rect x="310" y="120" width="160" height="10" rx="3" fill="#7FA3DB" />
        <rect x="310" y="146" width="108" height="28" rx="14" fill="#2F6BC9" />
      </g>

      {/* Timecode chip labeled Sample */}
      <rect x="466" y="172" width="84" height="22" rx="6" fill="#0B0B0F" stroke="#2F6BC9" strokeWidth="1" />
      <text x="508" y="187" textAnchor="middle" fill="#A9C1E8" fontSize="9.5" fontFamily="var(--font-mono)">
        00:14 · Sample
      </text>

      {/* Bottom: Timeline Editor Tracks */}
      <rect x="64" y="240" width="512" height="114" rx="14" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
      {/* Ruler ticks */}
      <line x1="88" y1="262" x2="552" y2="262" stroke="#E5E7EB" strokeWidth="1.5" />

      {/* Video Track Clips sliding into place */}
      <rect x="88" y="274" width="136" height="28" rx="6" fill="#0047AB" className="pl-anim pl-anim-step-1 pl-final-visible" />
      <rect x="232" y="274" width="164" height="28" rx="6" fill="#2F6BC9" className="pl-anim pl-anim-step-2 pl-final-visible" />
      <rect x="404" y="274" width="144" height="28" rx="6" fill="#7FA3DB" className="pl-anim pl-anim-step-3 pl-final-visible" />

      {/* Audio Track Clips */}
      <rect x="88" y="310" width="220" height="24" rx="6" fill="#EAF1FB" stroke="#C9DAF2" strokeWidth="1.2" className="pl-anim pl-anim-step-2 pl-final-visible" />
      <rect x="316" y="310" width="232" height="24" rx="6" fill="#EAF1FB" stroke="#C9DAF2" strokeWidth="1.2" className="pl-anim pl-anim-step-3 pl-final-visible" />

      {/* Moving Playhead */}
      <g className="pl-anim pl-anim-playhead pl-final-visible" style={{ transformOrigin: '140px 298px' }}>
        <polygon points="134,254 146,254 140,264" fill="#0B0B0F" />
        <line x1="140" y1="262" x2="140" y2="342" stroke="#0B0B0F" strokeWidth="2" />
      </g>
    </SceneStageFrame>
  );
};

export default VideoMotionScene;
