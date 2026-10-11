import React, { useState } from 'react';
import { useVideoSequence, SLOGAN_VIDEOS } from './useVideoSequence';
import { MOTION } from '../../styles/motion';

export const HeroVideoFrame: React.FC = () => {
  const {
    containerRef,
    videoRefs,
    activeIndex,
    hasEntered,
    prefersReducedMotion,
    shouldDisableAutoplay,
    handleLoadedMetadata,
    handleVideoEnded,
  } = useVideoSequence();

  // Desktop 3D Hover Tilt (at most 2 degrees toward cursor, disabled for reduced motion)
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || typeof window === 'undefined' || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    // Max 2 degrees rotation
    setTilt({
      x: -y * 4,
      y: x * 4,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
    >
      {/* ── Soft Cobalt Glow Behind Frame (blurred radial gradient rgba(0,71,171,.16), breathing 0.8 to 1.0 opacity over 6s, fades in 200ms after frame) ── */}
      <div
        className="absolute -inset-4 sm:-inset-6 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(0,71,171,0.16)_0%,transparent_70%)] blur-2xl pointer-events-none -z-10"
        style={{
          opacity: hasEntered || prefersReducedMotion ? 1 : 0,
          transition: `opacity 600ms ${MOTION.ease.brand} 200ms`,
          animation: prefersReducedMotion ? 'none' : 'heroGlowPulse 6s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* ── Single Framed Video with Entrance Motion & Desktop Tilt ── */}
      <div
        className={`w-full rounded-[16px] sm:rounded-[20px] overflow-hidden bg-[#F6F7F9] border border-[#E5E7EB] ${
          hasEntered || prefersReducedMotion
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-[0.98]'
        }`}
        style={{
          aspectRatio: '16 / 10',
          boxShadow:
            '0 0 0 6px rgba(0, 71, 171, 0.06), 0 1px 2px rgba(11, 11, 15, 0.06), 0 24px 60px rgba(0, 71, 171, 0.14)',
          transform: prefersReducedMotion
            ? undefined
            : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: `opacity 600ms ${MOTION.ease.brand}, transform ${MOTION.ease.brand} 300ms`,
        }}
      >
        <div className="relative w-full h-full overflow-hidden bg-[#F6F7F9]">
          {SLOGAN_VIDEOS.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={item.id}
                className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
                style={{
                  transition: `opacity 400ms ${MOTION.ease.brand}`,
                }}
              >
                {/* 
                  Video element is taller than the frame and shifted up by cropTopPct so the 
                  frosted-glass title panel and words are never visible, while maintaining 
                  platform, ring, wallet, badges, stars, and ID card fully in view.
                */}
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  muted
                  playsInline
                  preload={idx === 0 ? 'metadata' : 'none'}
                  onEnded={handleVideoEnded}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="absolute left-0 w-full object-cover object-bottom"
                  style={{
                    top: `-${item.cropTopPct}%`,
                    height: `${100 + item.cropTopPct}%`,
                  }}
                >
                  <source src={item.webm} type="video/webm" />
                  <source src={item.mp4} type="video/mp4" />
                </video>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeroVideoFrame;
