import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion, useDataSaver } from '../../media/useDataSaver';

export interface SloganVideoItem {
  id: 'your-work' | 'your-reputation' | 'your-identity';
  title: string;
  webm: string;
  mp4: string;
  cropTopPct: number;
}

export const SLOGAN_VIDEOS: SloganVideoItem[] = [
  {
    id: 'your-work',
    title: 'Your Work',
    webm: encodeURI('/videos/your-work.webm'),
    mp4: encodeURI('/videos/your-work.mp4'),
    cropTopPct: 0,
  },
  {
    id: 'your-reputation',
    title: 'Your Reputation',
    webm: encodeURI('/videos/your-reputation.webm'),
    mp4: encodeURI('/videos/your-reputation.mp4'),
    cropTopPct: 0,
  },
  {
    id: 'your-identity',
    title: 'Your Identity',
    webm: encodeURI('/videos/your-identity.webm'),
    mp4: encodeURI('/videos/your-identity.mp4'),
    cropTopPct: 0,
  },
];

const TARGET_PLAYBACK_RATE = 0.8;

export function useVideoSequence() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isInView, setIsInView] = useState<boolean>(false);
  const [hasEntered, setHasEntered] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefersReducedMotion = useReducedMotion();
  const isDataSaver = useDataSaver();
  const shouldDisableAutoplay = prefersReducedMotion || isDataSaver;

  // ── Helper to enforce 0.8x playback rate ──
  const enforceRate = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    try {
      video.defaultPlaybackRate = TARGET_PLAYBACK_RATE;
      video.playbackRate = TARGET_PLAYBACK_RATE;
    } catch {}
  }, []);

  // ── Helper to safely play a video ──
  const playVideo = useCallback(
    (index: number, restartFromZero = false) => {
      if (shouldDisableAutoplay) return;
      const video = videoRefs.current[index];
      if (!video) return;

      if (restartFromZero) {
        try {
          video.currentTime = 0;
        } catch {}
      }

      enforceRate(video);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Re-apply speed after play() as browsers can reset it
            enforceRate(video);
          })
          .catch(() => {
            // Silently handle autoplay prevention, retry on next user interaction
            const handleUserInteraction = () => {
              enforceRate(video);
              video.play().catch(() => {});
              window.removeEventListener('click', handleUserInteraction);
              window.removeEventListener('touchstart', handleUserInteraction);
              window.removeEventListener('keydown', handleUserInteraction);
            };
            window.addEventListener('click', handleUserInteraction, { once: true });
            window.addEventListener('touchstart', handleUserInteraction, { once: true });
            window.addEventListener('keydown', handleUserInteraction, { once: true });
          });
      }

      // Preload next video in sequence
      const nextIdx = (index + 1) % SLOGAN_VIDEOS.length;
      const nextVideo = videoRefs.current[nextIdx];
      if (nextVideo && nextVideo.preload !== 'auto') {
        nextVideo.preload = 'auto';
      }
    },
    [enforceRate, shouldDisableAutoplay]
  );

  // ── Pause active video without resetting currentTime ──
  const pauseActiveVideo = useCallback(() => {
    const video = videoRefs.current[activeIndex];
    if (video) {
      video.pause();
    }
  }, [activeIndex]);

  // ── 1. IntersectionObserver (trigger when hero is >= 50% in view) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      setHasEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.intersectionRatio >= 0.5;
        setIsInView(inView);
        if (entry.isIntersecting) {
          setHasEntered(true);
        }
      },
      { threshold: [0, 0.5, 1.0] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── 2. Play / Pause based on viewport visibility ──
  useEffect(() => {
    if (shouldDisableAutoplay) return;

    if (isInView && !document.hidden) {
      playVideo(activeIndex, false);
    } else {
      pauseActiveVideo();
    }
  }, [isInView, activeIndex, shouldDisableAutoplay, playVideo, pauseActiveVideo]);

  // ── 3. Tab visibility change listener (pause when hidden, resume when visible) ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseActiveVideo();
      } else if (isInView && !shouldDisableAutoplay) {
        playVideo(activeIndex, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInView, activeIndex, shouldDisableAutoplay, playVideo, pauseActiveVideo]);

  // ── 4. Loadedmetadata handler for every video ──
  const handleLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      enforceRate(e.currentTarget);
    },
    [enforceRate]
  );

  // ── 5. Video ended: wait 300ms, then crossfade to next in loop ──
  const handleVideoEnded = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    // Wait 300ms before starting crossfade to next video
    autoAdvanceTimerRef.current = setTimeout(() => {
      const prevIndex = activeIndex;
      const nextIndex = (activeIndex + 1) % SLOGAN_VIDEOS.length;

      setActiveIndex(nextIndex);

      if (!shouldDisableAutoplay && isInView) {
        playVideo(nextIndex, true);
      }

      // Smoothly pause and reset previous video after crossfade finishes (400ms)
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = setTimeout(() => {
        const prevVideo = videoRefs.current[prevIndex];
        if (prevVideo) {
          prevVideo.pause();
          try {
            prevVideo.currentTime = 0;
          } catch {}
        }
      }, 400);
    }, 300);
  }, [activeIndex, isInView, shouldDisableAutoplay, playVideo]);

  // ── Cleanup timers on unmount ──
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  return {
    containerRef,
    videoRefs,
    activeIndex,
    isInView,
    hasEntered,
    prefersReducedMotion,
    shouldDisableAutoplay,
    handleLoadedMetadata,
    handleVideoEnded,
  };
}
