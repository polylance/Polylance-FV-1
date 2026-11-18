import React, { useState, useCallback, useRef } from 'react';
import { Modal } from '../common/Modal';
import { getVideo } from '../../media';
import { VideoPlayer } from './VideoPlayer';
import { VideoPlaceholder } from './VideoPlaceholder';
import { pauseAllVideos } from '../../media/playbackCoordinator';

export interface VideoModalProps {
  id: string | null;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  id,
  isOpen,
  onClose,
  triggerRef,
}) => {
  const entry = id ? getVideo(id) : null;
  const lastEntryRef = useRef<ReturnType<typeof getVideo>>(entry);
  if (entry) {
    lastEntryRef.current = entry;
  }
  const activeEntry = entry || lastEntryRef.current;

  const handleClose = () => {
    pauseAllVideos();
    onClose();
    if (triggerRef?.current) {
      triggerRef.current.focus();
    }
  };

  if (!activeEntry) return null;

  const isReady = activeEntry.status === 'ready' && Boolean(activeEntry.sources.webm || activeEntry.sources.mp4 || activeEntry.embed);

  return (
    <Modal
      isOpen={isOpen && Boolean(entry)}
      onClose={handleClose}
      title={activeEntry.title}
      description={activeEntry.summary}
      maxWidth="lg"
      className="p-1 sm:p-2"
    >
      <div className="mt-2">
        {isReady ? (
          <VideoPlayer entry={activeEntry} autoPlayAmbient={false} />
        ) : (
          <VideoPlaceholder entry={activeEntry} />
        )}
      </div>
    </Modal>
  );
};

/**
 * Custom hook to manage VideoModal state with trigger focus return.
 */
export function useVideoModal() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openVideo = useCallback((id: string, e?: React.MouseEvent<HTMLElement>) => {
    if (e?.currentTarget) {
      triggerRef.current = e.currentTarget;
    }
    setActiveVideoId(id);
  }, []);

  const closeVideo = useCallback(() => {
    pauseAllVideos();
    setActiveVideoId(null);
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);

  return {
    activeVideoId,
    isOpen: activeVideoId !== null,
    openVideo,
    closeVideo,
    triggerRef,
  };
}
