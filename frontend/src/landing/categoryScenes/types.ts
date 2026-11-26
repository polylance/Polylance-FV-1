import type React from 'react';

export type SceneKey =
  | 'web3'
  | 'frontend'
  | 'backend'
  | 'mobile'
  | 'design'
  | 'data-ai'
  | 'data-analytics'
  | 'devops'
  | 'security'
  | 'content-writing'
  | 'marketing'
  | 'creators'
  | 'video-motion'
  | 'qa'
  | 'admin-support'
  | 'generic';

export type ScenePlaybackMode = 'interactive' | 'static-final' | 'hover-once';
export type SceneForcedState = 'first' | 'playing' | 'final' | 'reduced';
export type SceneVisualState = 'first' | 'playing' | 'final' | 'reduced';

export interface CategorySceneProps {
  /** Real category name (used in generic fallback or contextual labels) */
  categoryName: string;
  /** Real category slug */
  categorySlug: string;
  /** Real skills present in jobs/profiles or category taxonomy (used cleanly inside scenes) */
  skills?: string[];
  /** Playback mode behavior */
  playbackMode?: ScenePlaybackMode;
  /** Controlled trigger for interactive/hover modes */
  isActive?: boolean;
  /** Explicit state override for dev /scene-lab inspection */
  forcedState?: SceneForcedState;
  /** Max loop count before resting on final frame (default 2) */
  maxLoops?: number;
  /** Optional class name on wrapper */
  className?: string;
  /** Show Replay button inside corner of the stage */
  showReplayButton?: boolean;
  /** Compact mode when reused in smaller slots */
  compact?: boolean;
}

export interface CategorySceneDescriptor {
  key: SceneKey;
  title: string;
  subtitle: string;
  durationMs: number;
  matchedBy: 'exact' | 'keyword' | 'fallback';
  load: () => Promise<{ default: React.ComponentType<CategorySceneProps> }>;
}

/** Palette tokens strictly enforced inside every SVG scene */
export const SCENE_PALETTE = {
  ink: '#0B0B0F',
  white: '#FFFFFF',
  well: '#F5F6FA',
  border: '#E5E7EB',
  grayBar: '#B7BCC6',
  mutedText: '#4B5563',
  subtleText: '#6B7280',
  cobalt: '#0047AB',
  cobaltDark: '#003A8C',
  cobaltMid: '#2F6BC9',
  cobaltTint: '#EAF1FB',
  cobaltTintBorder: '#C9DAF2',
  cobaltBar1: '#7FA3DB',
  cobaltBar2: '#A9C1E8',
  greenText: '#0B7A55',
  greenFill: '#E8F7EF',
  greenBorder: '#BFE6D3',
  redText: '#DC2626',
  redFill: '#FEE2E2',
} as const;
