import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, CheckCircle2, Scale, ExternalLink } from 'lucide-react';
import { EscrowVideoStage } from './EscrowVideoStage';
import { EscrowOptionCard } from './EscrowOptionCard';
import { Reveal } from '../common/MotionPrimitives';
import { useReducedMotion, useDataSaver } from '../../media/useDataSaver';

export interface EscrowOption {
  id: string;
  title: string;
  description: string;
  icon: typeof Lock;
  videoSrc: string;
  altVideoSrc?: string;
  poster: string;
}

export const ESCROW_OPTIONS: EscrowOption[] = [
  {
    id: 'escrow',
    title: 'Funds are held by a smart contract, not by PolyLance',
    description: 'Escrow collateral resides in smart contract bytecode on Polygon Mainnet.',
    icon: Lock,
    videoSrc: '/videos/client%20escrow.mp4',
    altVideoSrc: '/videos/client-escrow.mp4',
    poster: '/media/posters/safe-by-design.svg',
  },
  {
    id: 'submission',
    title: 'Payment releases when the client approves',
    description: 'You retain full control to inspect deliverables before authorizing payout.',
    icon: CheckCircle2,
    videoSrc: '/videos/submission.mp4',
    poster: '/media/posters/safe-by-design.svg',
  },
  {
    id: 'dispute',
    title: 'If there is a dispute, independent judges decide',
    description: 'Peer judges evaluate specifications and submitted deliverables to resolve contested milestones.',
    icon: Scale,
    videoSrc: '/videos/dispute.mp4',
    poster: '/media/posters/task-disputes.svg',
  },
];

const PLAYBACK_RATE = 0.8;

export const SecurityShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isInView, setIsInView] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([null, null, null]);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const prefersReducedMotion = useReducedMotion();
  const isDataSaver = useDataSaver();
  const shouldDisableAutoplay = prefersReducedMotion || isDataSaver;

  const rafIdRef = useRef<number | null>(null);

  // Smooth rAF progress loop for 60fps tracking
  const stopProgressLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startProgressLoop = useCallback((videoIndex: number) => {
    stopProgressLoop();

    const tick = () => {
      const activeVideo = videoRefs.current[videoIndex];
      if (activeVideo && !activeVideo.paused && activeVideo.duration > 0) {
        const p = Math.min(1, Math.max(0, activeVideo.currentTime / activeVideo.duration));
        setProgress(p);
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [stopProgressLoop]);

  // Helper to safely play a video at 0.8x speed
  const playVideo = useCallback(
    (index: number, restartFromZero = false) => {
      const video = videoRefs.current[index];
      if (!video) return;

      // Pause all other videos and smoothly reset them after crossfade completes
      videoRefs.current.forEach((v, i) => {
        if (v && i !== index) {
          v.pause();
          setTimeout(() => {
            if (v) v.currentTime = 0;
          }, 350);
        }
      });

      if (restartFromZero) {
        video.currentTime = 0;
        setProgress(0);
      }

      video.defaultPlaybackRate = PLAYBACK_RATE;
      video.playbackRate = PLAYBACK_RATE;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Re-apply speed after play() as browsers can reset it
            video.defaultPlaybackRate = PLAYBACK_RATE;
            video.playbackRate = PLAYBACK_RATE;
            startProgressLoop(index);
          })
          .catch(() => {
            // Silently handle autoplay prevention, retries on user click
          });
      }
    },
    [startProgressLoop]
  );

  // Pause the current active video
  const pauseActiveVideo = useCallback(() => {
    stopProgressLoop();
    const activeVideo = videoRefs.current[activeIndex];
    if (activeVideo) {
      activeVideo.pause();
    }
  }, [activeIndex, stopProgressLoop]);

  // 1. IntersectionObserver to detect when section is >= 50% in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.intersectionRatio >= 0.5;
        setIsInView(inView);
      },
      { threshold: [0, 0.5, 1.0] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Play / Pause based on viewport visibility and tab visibility
  useEffect(() => {
    if (shouldDisableAutoplay) return;

    if (isInView && !document.hidden) {
      playVideo(activeIndex, false);
    } else {
      pauseActiveVideo();
    }
  }, [isInView, activeIndex, shouldDisableAutoplay, playVideo, pauseActiveVideo]);

  // 3. Tab visibility change listener
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

  // 4. Time update handler to track progress (scaleX 0 -> 1)
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration && video.duration > 0) {
      const p = Math.min(1, Math.max(0, video.currentTime / video.duration));
      setProgress(p);
    }
  };

  // 5. Metadata loaded handler to enforce 0.8x rate
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
  };

  // 6. When video ends: auto-advance to next video (0 -> 1 -> 2 -> 0) with a 400ms pause
  const handleVideoEnded = () => {
    stopProgressLoop();
    setProgress(1);
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    autoAdvanceTimerRef.current = setTimeout(() => {
      const nextIndex = (activeIndex + 1) % ESCROW_OPTIONS.length;
      setActiveIndex(nextIndex);
      setProgress(0);
      if (!shouldDisableAutoplay && isInView) {
        playVideo(nextIndex, true);
      }
    }, 400);
  };

  // Clean up auto-advance timer and rAF on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      stopProgressLoop();
    };
  }, [stopProgressLoop]);

  // 7. Option selection (click or Enter/Space)
  const selectOption = (index: number) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    setActiveIndex(index);
    setProgress(0);
    // Restarts video from 0 at 0.8x
    playVideo(index, true);
  };

  // 8. Keyboard navigation for accessibility (Left/Right or Up/Down arrows)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % ESCROW_OPTIONS.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + ESCROW_OPTIONS.length) % ESCROW_OPTIONS.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectOption(currentIndex);
      return;
    } else {
      return;
    }

    cardRefs.current[nextIndex]?.focus();
    selectOption(nextIndex);
  };

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
    >
      {/* ── Left Column: Browser Window with 3 Stacked Escrow Videos ── */}
      <div className="lg:col-span-6">
        <Reveal>
          <EscrowVideoStage
            videos={ESCROW_OPTIONS}
            activeIndex={activeIndex}
            progress={progress}
            videoRefs={videoRefs}
            onVideoEnded={handleVideoEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            reducedMotion={shouldDisableAutoplay}
          />
        </Reveal>
      </div>

      {/* ── Right Column: Headings & 3 Linked Option Cards ── */}
      <div className="lg:col-span-6 space-y-7 text-left">
        <Reveal delay={50}>
          <div className="space-y-3">
            <div className="text-eyebrow text-blue-300">Security Architecture</div>
            <h2 className="text-landing-h2 text-white">Safe by design.</h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Escrow release rules are enforced autonomously by smart contracts on Polygon.
              Protocol parameters and dispute resolution roles are governed on-chain.
            </p>
          </div>
        </Reveal>

        {/* ── 3 Linked Option Cards (role="tablist") ── */}
        <div
          role="tablist"
          aria-label="Escrow Architecture Options"
          aria-orientation="vertical"
          className="space-y-4 pt-1"
        >
          {ESCROW_OPTIONS.map((option, idx) => {
            return (
              <Reveal key={option.id} delay={100 + idx * 50}>
                <EscrowOptionCard
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  id={option.id}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  isActive={idx === activeIndex}
                  progress={idx === activeIndex ? progress : 0}
                  onClick={() => selectOption(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  cardIndex={idx}
                />
              </Reveal>
            );
          })}
        </div>

        {/* ── Contract Link on Polygonscan (Exact text and target preserved) ── */}
        <Reveal delay={250}>
          <div className="pt-2">
            <a
              href="https://polygonscan.com/address/0x7D3eA4c153B8C13a299E41666870C0F0C058A9a3"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:underline underline-offset-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:rounded"
            >
              <span>See the contract on Polygonscan</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
};
