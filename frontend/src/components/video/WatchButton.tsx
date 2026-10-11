import React from 'react';
import { Play } from 'lucide-react';
import { getVideo } from '../../media';

export interface WatchButtonProps {
  id: string;
  label?: string;
  className?: string;
  onOpen?: (id: string, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const WatchButton: React.FC<WatchButtonProps> = ({
  id,
  label,
  className = '',
  onOpen,
}) => {
  const entry = getVideo(id);

  if (!entry) {
    if (import.meta.env.DEV) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#F6F7F9] border border-[#E5E7EB] text-[#6B7280] text-xs font-medium cursor-not-allowed">
          <Play size={11} className="text-[#9CA3AF]" />
          <span>Coming soon ({id})</span>
        </span>
      );
    }
    return null;
  }

  const isReady = entry.status === 'ready' && Boolean(entry.sources.webm || entry.sources.mp4 || entry.embed);

  // If video is coming soon
  if (!isReady) {
    // In production, render nothing so users never see dead buttons
    if (!import.meta.env.DEV) {
      return null;
    }

    // In dev mode, show a small disabled "Coming soon" chip
    return (
      <span
        title={`Video "${entry.title}" is coming soon.`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F6F7F9] border border-[#E5E7EB] text-[#6B7280] text-xs font-medium cursor-not-allowed ${className}`}
      >
        <Play size={11} className="text-[#9CA3AF]" />
        <span>Coming soon ({entry.durationSeconds ? `${entry.durationSeconds}s` : 'demo'})</span>
      </span>
    );
  }

  // Display label with duration
  const displayLabel = label || `Watch ${entry.title} (${entry.durationSeconds}s)`;

  return (
    <button
      type="button"
      onClick={(e) => onOpen?.(id, e)}
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-[#0047AB] hover:text-[#003882] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] rounded transition-colors cursor-pointer ${className}`}
    >
      <span className="w-4 h-4 rounded-full bg-[#E7EEF9] flex items-center justify-center shrink-0">
        <Play size={10} className="fill-[#0047AB] text-[#0047AB] ml-0.5" />
      </span>
      <span>{displayLabel}</span>
    </button>
  );
};
