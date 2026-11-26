import { useEffect, useRef, useState, useCallback } from 'react';
import { useReducedMotion } from '../../media/useDataSaver';
import type { SceneForcedState, ScenePlaybackMode, SceneVisualState } from './types';

export interface UseScenePlaybackOptions {
  durationMs?: number;
  maxLoops?: number;
  playbackMode?: ScenePlaybackMode;
  isActive?: boolean;
  forcedState?: SceneForcedState;
  sceneKey?: string;
}

export interface UseScenePlaybackReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  visualState: SceneVisualState;
  isPaused: boolean;
  replayKey: number;
  loops: number;
  replay: () => void;
  reducedMotion: boolean;
}

/**
 * Coordinates battery-friendly SVG scene playback:
 * - Honors OS reduced-motion & Settings > Appearance animation override
 * - Pauses when scrolled off-screen (IntersectionObserver) or browser tab hidden
 * - Stops cleanly on final frame after at most 2 loops
 * - Supports interactive (select/hover), static-final, hover-once, and forced Scene Lab modes
 */
export function useScenePlayback({
  durationMs = 4000,
  maxLoops = 2,
  playbackMode = 'interactive',
  isActive = true,
  forcedState,
  sceneKey,
}: UseScenePlaybackOptions): UseScenePlaybackReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [isOnScreen, setIsOnScreen] = useState(true);
  const [isTabHidden, setIsTabHidden] = useState(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false
  );
  const [replayKey, setReplayKey] = useState(0);
  const sessionToken = `${sceneKey || 'scene'}-${isActive ? '1' : '0'}-${playbackMode}-${replayKey}`;
  const [completedSession, setCompletedSession] = useState<string | null>(null);
  const hasCompleted = completedSession === sessionToken;

  // Track visibility on screen via IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOnScreen(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track document visibility (pause when background tab)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const effectiveLoops = playbackMode === 'hover-once' ? 1 : Math.min(Math.max(1, maxLoops), 2);
  const isPaused = !isOnScreen || isTabHidden;

  // Determine exact visual state
  let visualState: SceneVisualState;
  if (forcedState) {
    visualState = forcedState;
  } else if (reducedMotion || playbackMode === 'static-final') {
    visualState = reducedMotion ? 'reduced' : 'final';
  } else if (playbackMode === 'hover-once') {
    visualState = isActive && !hasCompleted ? 'playing' : 'final';
  } else {
    if (!isActive) {
      visualState = 'first';
    } else if (hasCompleted) {
      visualState = 'final';
    } else {
      visualState = 'playing';
    }
  }

  // Track active playback time to settle on 'final' after maxLoops completes
  useEffect(() => {
    if (forcedState || visualState !== 'playing' || isPaused) {
      return;
    }

    const totalPlayMs = durationMs * effectiveLoops + 80;
    const timer = setTimeout(() => {
      setCompletedSession(sessionToken);
    }, totalPlayMs);

    return () => clearTimeout(timer);
  }, [forcedState, visualState, isPaused, durationMs, effectiveLoops, sessionToken]);

  const replay = useCallback(() => {
    setCompletedSession(null);
    setReplayKey((k) => k + 1);
  }, []);

  return {
    containerRef,
    visualState,
    isPaused,
    replayKey,
    loops: effectiveLoops,
    replay,
    reducedMotion,
  };
}
