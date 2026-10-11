import manifestData from '../../public/media/manifest.json';

export type VideoType = 'ambient' | 'standard' | 'component';
export type VideoAspect = '16:9' | '9:16';
export type VideoStatus = 'ready' | 'coming-soon';

export interface VideoCaptionTrack {
  lang: string;
  label: string;
  src: string;
}

export interface VideoSources {
  webm?: string;
  mp4?: string;
}

export interface VideoManifestEntry {
  id: string;
  title: string;
  summary: string;
  type: VideoType;
  aspect: VideoAspect;
  durationSeconds: number;
  sources: VideoSources;
  poster: string;
  captions: VideoCaptionTrack[];
  transcript: string;
  status: VideoStatus;
  tags: string[];
  isSample: boolean;
  embed?: string;
}

export interface VideoFilter {
  tag?: string;
  type?: VideoType;
  status?: VideoStatus;
  search?: string;
}

// Runtime validation in DEV mode
if (import.meta.env.DEV) {
  try {
    if (!Array.isArray(manifestData)) {
      console.warn('[PolyLance Media] manifest.json must be an array of VideoManifestEntry');
    } else {
      manifestData.forEach((item: any, idx: number) => {
        if (!item.id || typeof item.id !== 'string') {
          console.warn(`[PolyLance Media] Entry at index ${idx} missing valid string "id":`, item);
        }
        if (!['ambient', 'standard', 'component'].includes(item.type)) {
          console.warn(`[PolyLance Media] Entry "${item.id || idx}" has invalid type "${item.type}"`);
        }
        if (!['16:9', '9:16'].includes(item.aspect)) {
          console.warn(`[PolyLance Media] Entry "${item.id || idx}" has invalid aspect "${item.aspect}"`);
        }
      });
    }
  } catch (err) {
    console.warn('[PolyLance Media] Error validating manifest in dev:', err);
  }
}

const typedManifest: VideoManifestEntry[] = (manifestData as unknown) as VideoManifestEntry[];

/**
 * Retrieves a single video entry by ID. Never throws if missing or coming soon.
 */
export function getVideo(id: string): VideoManifestEntry | undefined {
  if (!id) return undefined;
  return typedManifest.find((entry) => entry.id.toLowerCase() === id.toLowerCase());
}

/**
 * Returns a list of video entries matching optional filter criteria.
 */
export function listVideos(filter?: VideoFilter): VideoManifestEntry[] {
  if (!filter) return [...typedManifest];

  return typedManifest.filter((entry) => {
    if (filter.tag && !entry.tags.includes(filter.tag)) {
      return false;
    }
    if (filter.type && entry.type !== filter.type) {
      return false;
    }
    if (filter.status && entry.status !== filter.status) {
      return false;
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchSummary = entry.summary.toLowerCase().includes(q);
      const matchTranscript = (entry.transcript || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchTranscript) {
        return false;
      }
    }
    return true;
  });
}

export * from './VideoManager';
export * from './playbackCoordinator';
export * from './useDataSaver';
