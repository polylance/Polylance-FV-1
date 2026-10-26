import React from 'react';
import { getVideo, VideoManifestEntry } from '../../media';
import { VideoPlaceholder } from './VideoPlaceholder';
import { VideoPlayer } from './VideoPlayer';
import { ProductPreview, ProductPreviewVariant } from '../ProductPreview';

export interface VideoSlotProps {
  id: string;
  className?: string;
  fallbackTitle?: string;
  fallbackVariant?: ProductPreviewVariant;
  onPlaceholderClick?: () => void;
}

/**
 * Single universal slot component used across pages.
 * Reads the video from manifest.
 * Guarantees zero layout shift.
 * If video is not ready:
 *   - Renders <ProductPreview> if fallbackVariant exists (or can be inferred)
 *   - If no fallback and in DEV mode, shows <VideoPlaceholder>
 *   - In production with no fallback, returns null to reflow cleanly
 */
export const VideoSlot: React.FC<VideoSlotProps> = ({
  id,
  className = '',
  fallbackTitle,
  fallbackVariant,
  onPlaceholderClick,
}) => {
  const entry = getVideo(id);

  // Fallback entry if an unknown id is passed
  const resolvedEntry: VideoManifestEntry = entry || {
    id,
    title: fallbackTitle || id,
    summary: 'Video coming soon.',
    type: 'standard',
    aspect: '16:9',
    durationSeconds: 30,
    sources: {},
    poster: `/media/posters/${id}.svg`,
    captions: [],
    transcript: '',
    status: 'coming-soon',
    tags: [],
    isSample: true,
  };

  const hasSources = Boolean(
    resolvedEntry.sources.webm || 
    resolvedEntry.sources.mp4 || 
    resolvedEntry.embed
  );
  const isReady = resolvedEntry.status === 'ready' && hasSources;

  if (isReady) {
    return <VideoPlayer entry={resolvedEntry} className={className} />;
  }

  // Infer variant if not provided
  const inferredVariant: ProductPreviewVariant | undefined = 
    fallbackVariant ||
    (id.includes('hero') ? 'hero' :
     id.includes('hire') ? 'hire' :
     id.includes('work') || id.includes('delivery') ? 'work' :
     id.includes('paid') ? 'paid' :
     id.includes('safe') ? 'safe' : undefined);

  if (inferredVariant) {
    return <ProductPreview variant={inferredVariant} className={className} />;
  }

  // In production, never show "Coming soon" chips or empty placeholder cards
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <VideoPlaceholder
      entry={resolvedEntry}
      className={className}
      onClickDisabled={onPlaceholderClick}
    />
  );
};
