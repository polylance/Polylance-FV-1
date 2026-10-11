import React from 'react';
import { Play } from 'lucide-react';
import { getVideo, VideoManifestEntry } from '../../media';

export interface VideoCardProps {
  id?: string;
  entry?: VideoManifestEntry;
  className?: string;
  onOpen?: (id: string, e: React.MouseEvent<HTMLElement>) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  id,
  entry: directEntry,
  className = '',
  onOpen,
}) => {
  const entry = directEntry || (id ? getVideo(id) : undefined);

  if (!entry) return null;

  const isReady = entry.status === 'ready' && Boolean(entry.sources.webm || entry.sources.mp4 || entry.embed);

  return (
    <div
      onClick={(e) => {
        if (isReady && onOpen) {
          onOpen(entry.id, e);
        }
      }}
      role={isReady ? 'button' : 'region'}
      tabIndex={isReady ? 0 : -1}
      onKeyDown={(e) => {
        if (isReady && (e.key === 'Enter' || e.key === ' ') && onOpen) {
          e.preventDefault();
          onOpen(entry.id, e as unknown as React.MouseEvent<HTMLElement>);
        }
      }}
      aria-label={`${entry.title} (${isReady ? `${entry.durationSeconds}s` : 'Coming soon'})`}
      className={`group bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] overflow-hidden p-4 space-y-3 transition-all text-left ${
        isReady
          ? 'cursor-pointer hover:border-[#0047AB] hover:shadow-[0_2px_8px_rgba(0,71,171,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]'
          : 'opacity-75 cursor-not-allowed bg-[#FAFAFA]'
      } ${className}`}
    >
      {/* Poster Thumbnail */}
      <div className="relative w-full aspect-video rounded-[8px] overflow-hidden bg-[#F6F7F9] border border-[#E5E7EB]">
        {entry.poster ? (
          <img
            src={entry.poster}
            alt=""
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isReady ? 'group-hover:scale-102' : 'opacity-40 grayscale'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#F6F7F9] text-[#6B7280]">
            <Play size={24} className="opacity-40" />
          </div>
        )}

        {/* Center play icon for ready cards */}
        {isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#0047AB] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Play size={16} className="fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Duration Chip or Coming Soon Badge */}
        <div className="absolute top-2 right-2">
          {isReady ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-[#0B0B0F]/80 text-white text-[11px] font-mono">
              {entry.durationSeconds}s
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[#E7EEF9] text-[#0047AB] text-[11px] font-medium border border-[#D0DEF2]">
              Coming soon
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="space-y-1">
        <h4 className="font-sans font-semibold text-sm text-[#0B0B0F] line-clamp-1 group-hover:text-[#0047AB] transition-colors">
          {entry.title}
        </h4>
        <p className="font-sans text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
          {entry.summary}
        </p>
      </div>
    </div>
  );
};
