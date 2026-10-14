import React from 'react';
import { listVideos, VideoFilter, VideoManifestEntry } from '../../media';
import { VideoCard } from './VideoCard';
import { VideoModal, useVideoModal } from './VideoModal';

export interface VideoGridProps {
  filter?: VideoFilter;
  ids?: string[];
  className?: string;
  emptyMessage?: string;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  filter,
  ids,
  className = '',
  emptyMessage = 'No tutorial videos found.',
}) => {
  const { activeVideoId, isOpen, openVideo, closeVideo, triggerRef } = useVideoModal();

  let videos: VideoManifestEntry[] = [];
  if (ids && ids.length > 0) {
    const all = listVideos();
    videos = ids
      .map((id) => all.find((v) => v.id.toLowerCase() === id.toLowerCase()))
      .filter(Boolean) as VideoManifestEntry[];
  } else {
    videos = listVideos(filter);
  }

  if (videos.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#6B7280]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 ${className}`}>
        {videos.map((entry) => (
          <VideoCard
            key={entry.id}
            entry={entry}
            onOpen={openVideo}
          />
        ))}
      </div>

      <VideoModal
        id={activeVideoId}
        isOpen={isOpen}
        onClose={closeVideo}
        triggerRef={triggerRef}
      />
    </>
  );
};
