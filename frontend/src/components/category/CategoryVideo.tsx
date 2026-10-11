import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useReducedMotion, useDataSaver } from '../../media/useDataSaver';
import { MOTION } from '../../styles/motion';
import { DomainId } from '../../utils/domainMapping';

export interface CategoryVideoProps {
  categoryId: DomainId;
  openJobsCount: number;
  isCardHovered?: boolean;
  staggerIndex?: number;
  className?: string;
}

const CATEGORY_MEDIA: Record<DomainId, {
  poster: string;
  webm: string;
  mp4: string;
  altMp4: string;
  defaultObjectPosition: string;
}> = {
  web3: {
    poster: '/media/posters/category-web3.svg',
    webm: '/videos/web3.webm',
    mp4: '/videos/web3.mp4',
    altMp4: '/media/categories/web3.mp4',
    defaultObjectPosition: '50% 50%',
  },
  frontend: {
    poster: '/media/posters/category-frontend.svg',
    webm: '/videos/frontend.webm',
    mp4: '/videos/frontend.mp4',
    altMp4: '/media/categories/frontend.mp4',
    defaultObjectPosition: '50% 50%',
  },
  backend: {
    poster: '/media/posters/category-backend.svg',
    webm: '/videos/backend.webm',
    mp4: '/videos/backend.mp4',
    altMp4: '/media/categories/backend.mp4',
    defaultObjectPosition: '50% 50%',
  },
  mobile: {
    poster: '/media/posters/category-mobile.svg',
    webm: '/videos/mobile.webm',
    mp4: '/videos/mobile.mp4',
    altMp4: '/media/categories/mobile.mp4',
    defaultObjectPosition: '50% 50%',
  },
};

const TARGET_RATE = 0.8;

export const CategoryVideo: React.FC<CategoryVideoProps> = ({
  categoryId,
  openJobsCount,
  isCardHovered = false,
  staggerIndex = 0,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const staggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reducedMotion = useReducedMotion();
  const isDataSaver = useDataSaver();
  const shouldDisableVideo = reducedMotion || isDataSaver;

  const [isInView, setIsInView] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const media = CATEGORY_MEDIA[categoryId];

  // Helper to strictly enforce 0.8x playback rate
  const enforceRate = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    try {
      video.defaultPlaybackRate = TARGET_RATE;
      video.playbackRate = TARGET_RATE;
      console.log(`[CategoryVideo ${categoryId}] playbackRate:`, video.playbackRate);
    } catch {}
  }, [categoryId]);

  // 1. Viewport observer (>= 50% in view threshold)
  useEffect(() => {
    if (shouldDisableVideo) return;
    const container = containerRef.current;
    if (!container) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.intersectionRatio >= 0.5);
      },
      { threshold: [0, 0.5, 1.0] }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [shouldDisableVideo]);

  // 2. Playback control with 300ms stagger between the 4 cards
  useEffect(() => {
    const video = videoRef.current;
    if (!video || shouldDisableVideo) return;

    if (staggerTimerRef.current) {
      clearTimeout(staggerTimerRef.current);
    }

    const shouldPlay = isInView && !document.hidden;

    if (shouldPlay) {
      // Stagger start by 300ms * staggerIndex so cards don't loop in lockstep
      const delay = staggerIndex * 300;
      staggerTimerRef.current = setTimeout(() => {
        enforceRate(video);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              enforceRate(video);
              setIsVideoReady(true);
            })
            .catch(() => {});
        }
      }, delay);
    } else {
      video.pause();
    }

    return () => {
      if (staggerTimerRef.current) {
        clearTimeout(staggerTimerRef.current);
      }
    };
  }, [isInView, staggerIndex, shouldDisableVideo, enforceRate]);

  // 3. Tab visibility listener
  useEffect(() => {
    const handleVisibility = () => {
      const video = videoRef.current;
      if (!video || shouldDisableVideo) return;

      if (document.hidden) {
        video.pause();
      } else if (isInView) {
        enforceRate(video);
        video.play().then(() => enforceRate(video)).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isInView, shouldDisableVideo, enforceRate]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-[14px] border border-[#E5E7EB] overflow-hidden bg-[#F6F7F9] select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${className}`}
      style={{
        aspectRatio: '16 / 10',
      }}
    >
      {/* ── Base Poster (zero layout shift, poster-only for reduced motion / data saver) ── */}
      <img
        src={media.poster}
        alt={`${categoryId} domain preview`}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out ${
          isVideoReady && !shouldDisableVideo ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          objectPosition: media.defaultObjectPosition,
          transform: !reducedMotion && isCardHovered ? 'scale(1.04)' : 'scale(1)',
          transformOrigin: 'center center',
          transition: `transform 300ms ${MOTION.ease.brand}, opacity 300ms ease-out`,
        }}
      />

      {/* ── Crisp Video (0.8x playback, scaled 1.04 inside 14px clip on hover, no tint/gradient) ── */}
      {!shouldDisableVideo && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => enforceRate(e.currentTarget)}
          onCanPlay={(e) => {
            enforceRate(e.currentTarget);
            setIsVideoReady(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectPosition: media.defaultObjectPosition,
            transform: !reducedMotion && isCardHovered ? 'scale(1.04)' : 'scale(1)',
            transformOrigin: 'center center',
            transition: `transform 300ms ${MOTION.ease.brand}, opacity 300ms ease-out`,
          }}
        >
          <source src={media.webm} type="video/webm" />
          <source src={media.mp4} type="video/mp4" />
          <source src={media.altMp4} type="video/mp4" />
        </video>
      )}

      {/* ── Top-Right: Open Jobs Badge (Appears ONLY when count > 0, live number, green pulsing dot) ── */}
      {openJobsCount > 0 && (
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#0B0B0F] text-[11px] font-semibold border border-[#E5E7EB] shadow-xs whitespace-nowrap">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]" />
            </span>
            <span>
              {openJobsCount} open {openJobsCount === 1 ? 'job' : 'jobs'}
            </span>
          </span>
        </div>
      )}

      {/* ── Bottom-Right: "View jobs" pill fades in on desktop hover ── */}
      <div
        className={`absolute bottom-2.5 right-2.5 z-20 pointer-events-none transition-all duration-300 ${
          isCardHovered && !reducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
        style={{
          transition: `opacity 300ms ${MOTION.ease.brand}, transform 300ms ${MOTION.ease.brand}`,
        }}
      >
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#0047AB] text-[11px] font-semibold border border-[#E5E7EB] shadow-xs whitespace-nowrap">
          View jobs &rarr;
        </span>
      </div>
    </div>
  );
};
