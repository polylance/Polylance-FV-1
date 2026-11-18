import React from 'react';
import { PolygonIcon } from '../TokenIcon';
import { MOTION } from '../../styles/motion';

export interface VideoItem {
  id: string;
  videoSrc: string;
  altVideoSrc?: string;
  poster: string;
}

export interface EscrowVideoStageProps {
  videos: VideoItem[];
  activeIndex: number;
  progress: number;
  videoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  onVideoEnded: () => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  reducedMotion: boolean;
  className?: string;
}

export const EscrowVideoStage: React.FC<EscrowVideoStageProps> = ({
  videos,
  activeIndex,
  progress,
  videoRefs,
  onVideoEnded,
  onTimeUpdate,
  onLoadedMetadata,
  reducedMotion,
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-2xl ${className}`}
      aria-label="PolyLance Security Protocol & Escrow Stage"
    >
      {/* ── Top Browser Header Bar (Three neutral dots + polylance.codes) ── */}
      <div className="h-7 bg-[#F6F7F9] border-b border-[#E5E7EB] px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]" />
        </div>
        <div className="text-[11px] font-mono text-[#6B7280] truncate max-w-[200px] sm:max-w-xs">
          polylance.codes
        </div>
        <div className="w-8" />
      </div>

      {/* ── Middle Video Stage (12px padding, 10px radius, #F6F7F9 bg, zero layout shift) ── */}
      <div className="p-3 bg-white">
        <div
          className="relative w-full aspect-[16/10] rounded-[10px] bg-[#F6F7F9] overflow-hidden flex items-center justify-center select-none"
          style={{ aspectRatio: '16 / 10' }}
        >
          {videos.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <div
                key={item.id}
                id={`escrow-video-${idx}`}
                role="tabpanel"
                aria-labelledby={`escrow-tab-${idx}`}
                className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
                style={{
                  transition: `opacity ${MOTION.duration.standard}ms ${MOTION.ease.brand}`,
                }}
              >
                {/* Video element (plays at 0.8x, object-contain, muted, playsInline) */}
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  muted
                  playsInline
                  preload="metadata"
                  poster={item.poster}
                  onEnded={onVideoEnded}
                  onTimeUpdate={isActive ? onTimeUpdate : undefined}
                  onLoadedMetadata={onLoadedMetadata}
                  className="absolute inset-0 w-full h-full object-contain object-center"
                >
                  <source src={item.videoSrc} type="video/mp4" />
                  {item.altVideoSrc && <source src={item.altVideoSrc} type="video/mp4" />}
                </video>
              </div>
            );
          })}

          {/* ── 2px Thin Cobalt Progress Line at the very bottom of the stage ── */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5 z-20 pointer-events-none"
            aria-hidden="true"
          >
            <div
              className="h-full bg-[#0047AB] origin-left transition-transform duration-75 ease-linear"
              style={{
                transform: `scaleX(${progress})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Status Ribbon (Polygon Mainnet left, Verified On-Chain right) ── */}
      <div className="px-4 py-3 bg-white border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280] select-none">
        <div className="flex items-center gap-1.5">
          <PolygonIcon size={13} className="text-[#0047AB]" />
          <span>Polygon Mainnet</span>
        </div>
        <span className="font-medium text-[#0047AB]">Verified On-Chain</span>
      </div>
    </div>
  );
};
