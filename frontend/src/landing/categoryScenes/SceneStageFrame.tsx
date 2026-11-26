import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useScenePlayback } from './useScenePlayback';
import type { SceneForcedState, ScenePlaybackMode } from './types';
import './categoryScenes.css';

export interface SceneStageFrameProps {
  sceneKey: string;
  title: string;
  durationMs?: number;
  maxLoops?: number;
  playbackMode?: ScenePlaybackMode;
  isActive?: boolean;
  forcedState?: SceneForcedState;
  showReplayButton?: boolean;
  className?: string;
  patternId: string;
  children: React.ReactNode;
}

/**
 * Shared fixed 16:10 stage container with:
 * - White surface + faint 3% opacity flat hexagon pattern
 * - Automatic IntersectionObserver & document visibility pausing
 * - Max 2-loop timeline cap before resting on final frame
 * - Optional accessible 40px Replay icon button
 */
export const SceneStageFrame: React.FC<SceneStageFrameProps> = ({
  sceneKey,
  title,
  durationMs = 4000,
  maxLoops = 2,
  playbackMode = 'interactive',
  isActive = true,
  forcedState,
  showReplayButton = true,
  className = '',
  patternId,
  children,
}) => {
  const {
    containerRef,
    visualState,
    isPaused,
    replayKey,
    loops,
    replay,
    reducedMotion,
  } = useScenePlayback({
    durationMs,
    maxLoops,
    playbackMode,
    isActive,
    forcedState,
    sceneKey,
  });

  const showReplay =
    showReplayButton &&
    !reducedMotion &&
    playbackMode === 'interactive' &&
    !forcedState;

  return (
    <div
      ref={containerRef}
      data-scene-key={sceneKey}
      data-scene-state={visualState}
      data-scene-paused={isPaused ? 'true' : 'false'}
      style={
        {
          '--scene-dur': `${durationMs}ms`,
          '--scene-loops': String(loops),
        } as React.CSSProperties
      }
      className={`pl-scene-root rounded-[14px] border border-[#E5E7EB] bg-[#FFFFFF] select-none ${className}`}
    >
      {/* Decorative inline SVG stage (aria-hidden; text lives in tab and real-data panel) */}
      <svg
        key={replayKey}
        viewBox="0 0 640 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
        aria-hidden="true"
      >
        <defs>
          {/* Faint flat hexagon motif at 3% opacity */}
          <pattern
            id={patternId}
            width="48"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M24 2 L44 13.5 L44 36.5 L24 48 L4 36.5 L4 13.5 Z"
              stroke="#0047AB"
              strokeWidth="1"
              strokeOpacity="0.03"
              fill="none"
            />
          </pattern>
        </defs>

        {/* Clean White Background + 3% Hex Pattern */}
        <rect width="640" height="400" fill="#FFFFFF" />
        <rect width="640" height="400" fill={`url(#${patternId})`} />

        {children}
      </svg>

      {/* Accessible Replay Icon Button (40px touch target) */}
      {showReplay && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            replay();
          }}
          aria-label={`Replay ${title} animation`}
          title="Replay scene"
          className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-[#FFFFFF] border border-[#E5E7EB] text-[#4B5563] hover:text-[#0047AB] hover:border-[#0047AB] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 cursor-pointer active:scale-[0.96]"
        >
          <RotateCcw size={16} />
        </button>
      )}
    </div>
  );
};
