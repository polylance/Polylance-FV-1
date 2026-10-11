import React from 'react';
import { Play } from 'lucide-react';
import { VideoManifestEntry } from '../../media';

export interface VideoPlaceholderProps {
  entry: VideoManifestEntry;
  className?: string;
  onClickDisabled?: () => void;
}

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  entry,
  className = '',
}) => {
  const isVertical = entry.aspect === '9:16';
  const aspectClass = isVertical ? 'aspect-[9/16]' : 'aspect-video';

  return (
    <div
      className={`relative w-full ${aspectClass} bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] overflow-hidden flex flex-col justify-between p-4 sm:p-6 text-left select-none ${className}`}
      role="region"
      aria-label={`${entry.title} (Coming Soon)`}
    >
      {/* Dimmed poster background if available */}
      {entry.poster && (
        <img
          src={entry.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
          loading="lazy"
        />
      )}

      {/* Top Header Row: Duration Chip & Coming Soon Badge */}
      <div className="relative z-10 flex items-center justify-between w-full">
        {entry.durationSeconds > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#0B0B0F] text-xs font-mono font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {entry.durationSeconds}s
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] bg-[#FFFFFF] border border-[#E5E7EB] text-[#6B7280] text-xs font-mono font-medium">
            Demo
          </span>
        )}

        {import.meta.env.DEV && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] bg-[#E7EEF9] text-[#0047AB] text-xs font-semibold tracking-wide border border-[#D0DEF2]">
            Coming soon
          </span>
        )}
      </div>

      {/* Center: Disabled Play Button Icon */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.06)] opacity-70 cursor-not-allowed"
          aria-hidden="true"
        >
          <Play size={20} className="text-[#6B7280] fill-[#6B7280] ml-0.5" />
        </div>
      </div>

      {/* Bottom: Title & One-line Summary */}
      <div className="relative z-10 space-y-1">
        <h4 className="font-sans font-semibold text-sm sm:text-base text-[#0B0B0F] line-clamp-1">
          {entry.title}
        </h4>
        <p className="font-sans text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
          {entry.summary}
        </p>
      </div>
    </div>
  );
};
