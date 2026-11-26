import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/* ==========================================================================
   ZENITH SKELETON TOKENS (Reference Image 1)
   ========================================================================== */
export const SKELETON_TOKENS = {
  title: '#0B0B0F',
  bar: '#B7BCC6',
  well: '#F5F6FA',
  wellBorder: '#E5E7EB',
  icon: '#EAF1FB',
  highlightBg: '#EEF4FD',
  highlightBorder: '#C9DAF2',
  avatar: '#0047AB',
  blueBar1: '#7FA3DB',
  blueBar2: '#A9C1E8',
  headerRule: '#0047AB',
} as const;

/* ==========================================================================
   DELAYED SKELETON HOOK
   - Avoids flashing if loaded in < 150ms
   - Once shown, displays for at least 300ms to prevent visual jitter
   - If loading takes > 8s, triggers timeout error state with Retry
   ========================================================================== */
export interface UseDelayedSkeletonOptions {
  isLoading: boolean;
  delayMs?: number;
  minDisplayMs?: number;
  timeoutMs?: number;
  onRetry?: () => void;
}

export interface UseDelayedSkeletonReturn {
  shouldRender: boolean;
  isTimedOut: boolean;
  retry: () => void;
}

export function useDelayedSkeleton({
  isLoading,
  delayMs = 150,
  minDisplayMs = 300,
  timeoutMs = 8000,
  onRetry,
}: UseDelayedSkeletonOptions): UseDelayedSkeletonReturn {
  const [shouldRender, setShouldRender] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout | null = null;
    let minDisplayTimer: NodeJS.Timeout | null = null;
    let timeoutTimer: NodeJS.Timeout | null = null;

    if (isLoading) {
      setIsTimedOut(false);
      delayTimer = setTimeout(() => {
        setShouldRender(true);
        shownAtRef.current = Date.now();
      }, delayMs);

      timeoutTimer = setTimeout(() => {
        setIsTimedOut(true);
      }, timeoutMs);
    } else {
      if (timeoutTimer) clearTimeout(timeoutTimer);

      if (shownAtRef.current !== null) {
        const elapsed = Date.now() - shownAtRef.current;
        if (elapsed < minDisplayMs) {
          minDisplayTimer = setTimeout(() => {
            setShouldRender(false);
            shownAtRef.current = null;
          }, minDisplayMs - elapsed);
        } else {
          setShouldRender(false);
          shownAtRef.current = null;
        }
      } else {
        setShouldRender(false);
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minDisplayTimer) clearTimeout(minDisplayTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [isLoading, delayMs, minDisplayMs, timeoutMs]);

  const retry = () => {
    setIsTimedOut(false);
    shownAtRef.current = null;
    if (onRetry) onRetry();
  };

  return { shouldRender, isTimedOut, retry };
}

/* ==========================================================================
   BASE SKELETON PRIMITIVES
   ========================================================================== */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string;
  variant?: 'text' | 'card' | 'avatar' | 'stat' | 'button' | 'custom';
  delayIndex?: number;
}

export const Skeleton: React.FC<SkeletonProps> & {
  Bar: typeof SkeletonBar;
  Circle: typeof SkeletonCircle;
  Card: typeof SkeletonCard;
  Well: typeof SkeletonWell;
  HighlightRow: typeof SkeletonHighlightRow;
  Row: typeof SkeletonRow;
  Table: typeof SkeletonTable;
  Chat: typeof SkeletonChat;
  Profile: typeof SkeletonProfile;
  Badge: typeof SkeletonBadge;
} = ({
  className = '',
  width,
  height,
  rounded = 'md',
  variant,
  delayIndex = 0,
  style,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  const roundedClasses = {
    sm: 'rounded-[6px]',
    md: 'rounded-[8px]',
    lg: 'rounded-[12px]',
    xl: 'rounded-[16px]',
    full: 'rounded-full',
  }[rounded] || (typeof rounded === 'string' ? rounded : 'rounded-[8px]');

  const animationStyle: React.CSSProperties = {
    animationDelay: prefersReducedMotion ? '0ms' : `${delayIndex * 80}ms`,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    ...style,
  };

  const animClass = prefersReducedMotion
    ? 'bg-[#E5E7EB]'
    : 'animate-skeleton-pulse bg-[#E5E7EB]';

  return (
    <div
      style={animationStyle}
      className={`${animClass} ${roundedClasses} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};

/* ==========================================================================
   SUBCOMPONENTS
   ========================================================================== */

export const SkeletonRegion: React.FC<{
  children: React.ReactNode;
  className?: string;
  label?: string;
  isTimedOut?: boolean;
  onRetry?: () => void;
}> = ({
  children,
  className = '',
  label = 'Loading content',
  isTimedOut = false,
  onRetry,
}) => {
  if (isTimedOut) {
    return (
      <div
        role="alert"
        className={`p-6 rounded-[16px] border border-[#E5E7EB] bg-white text-center space-y-3 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-[#FEF2F2] border border-[#FEE2E2] mx-auto flex items-center justify-center text-[#DC2626]">
          <AlertCircle size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#0B0B0F]">Loading is taking longer than expected</p>
          <p className="text-xs text-[#6B7280]">Please verify your network connection or try reloading.</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0047AB] text-white text-xs font-semibold hover:bg-[#00388A] transition-colors"
          >
            <RefreshCw size={12} />
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full transition-opacity duration-150 ${className}`}
      aria-busy="true"
      aria-live="polite"
      role="status"
      aria-label={label}
    >
      {children}
    </div>
  );
};

export const SkeletonBar: React.FC<{
  width?: string | number;
  height?: string | number;
  className?: string;
  delayIndex?: number;
  color?: string;
}> = ({
  width = '100%',
  height = 12,
  className = '',
  delayIndex = 0,
  color,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    animationDelay: prefersReducedMotion ? '0ms' : `${delayIndex * 80}ms`,
    backgroundColor: color || SKELETON_TOKENS.bar,
  };

  return (
    <div
      style={style}
      className={`rounded-[4px] ${prefersReducedMotion ? '' : 'animate-skeleton-pulse'} ${className}`}
      aria-hidden="true"
    />
  );
};

export const SkeletonCircle: React.FC<{
  size?: number | string;
  className?: string;
  delayIndex?: number;
  color?: string;
}> = ({
  size = 40,
  className = '',
  delayIndex = 0,
  color,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const dim = typeof size === 'number' ? `${size}px` : size;
  const style: React.CSSProperties = {
    width: dim,
    height: dim,
    animationDelay: prefersReducedMotion ? '0ms' : `${delayIndex * 80}ms`,
    backgroundColor: color || SKELETON_TOKENS.icon,
  };

  return (
    <div
      style={style}
      className={`rounded-full shrink-0 ${prefersReducedMotion ? '' : 'animate-skeleton-pulse'} ${className}`}
      aria-hidden="true"
    />
  );
};

export const SkeletonWell: React.FC<{
  titleWidth?: string | number;
  subtitleWidth?: string | number;
  className?: string;
  delayIndex?: number;
}> = ({
  titleWidth = '60%',
  subtitleWidth = '40%',
  className = '',
  delayIndex = 0,
}) => (
  <div
    className={`p-3.5 rounded-[12px] bg-[#F5F6FA] border border-[#E5E7EB] flex items-center gap-3 ${className}`}
    aria-hidden="true"
  >
    <SkeletonCircle size={36} color={SKELETON_TOKENS.icon} delayIndex={delayIndex} />
    <div className="space-y-1.5 flex-1 min-w-0">
      <SkeletonBar width={titleWidth} height={13} color={SKELETON_TOKENS.bar} delayIndex={delayIndex} />
      <SkeletonBar width={subtitleWidth} height={10} color="#D1D5DB" delayIndex={delayIndex + 1} />
    </div>
  </div>
);

export const SkeletonHighlightRow: React.FC<{
  className?: string;
  delayIndex?: number;
}> = ({
  className = '',
  delayIndex = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`p-3.5 rounded-[10px] bg-[#EEF4FD] border border-[#C9DAF2] flex items-center gap-3 relative overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-skeleton-sweep pointer-events-none"
          aria-hidden="true"
        />
      )}
      <SkeletonCircle size={38} color={SKELETON_TOKENS.avatar} delayIndex={delayIndex} />
      <div className="space-y-1.5 flex-1 min-w-0 relative z-10">
        <SkeletonBar width="65%" height={14} color={SKELETON_TOKENS.blueBar1} delayIndex={delayIndex} />
        <SkeletonBar width="40%" height={11} color={SKELETON_TOKENS.blueBar2} delayIndex={delayIndex + 1} />
      </div>
    </div>
  );
};

export const SkeletonRow: React.FC<{
  avatar?: boolean;
  avatarSize?: number;
  lines?: number;
  className?: string;
  delayIndex?: number;
}> = ({
  avatar = true,
  avatarSize = 36,
  lines = 2,
  className = '',
  delayIndex = 0,
}) => (
  <div className={`flex items-center gap-3 py-2 ${className}`} aria-hidden="true">
    {avatar && <SkeletonCircle size={avatarSize} delayIndex={delayIndex} />}
    <div className="space-y-1.5 flex-1 min-w-0">
      <SkeletonBar width="70%" height={13} delayIndex={delayIndex} />
      {lines > 1 && <SkeletonBar width="45%" height={10} color="#D1D5DB" delayIndex={delayIndex + 1} />}
    </div>
  </div>
);

/* ==========================================================================
   IMAGE 1 REFERENCE CARD: SKELETON CARD
   - Dark title bar (#0B0B0F)
   - 2px cobalt rule (#0047AB) under the header
   - Two soft gray stat cards / wells (#F5F6FA) with pale-blue circles
   - One highlighted cobalt-tinted row (#EEF4FD) with solid cobalt circle & blue bars
   ========================================================================== */
export const SkeletonCard: React.FC<{
  className?: string;
  delayIndex?: number;
}> = ({
  className = '',
  delayIndex = 0,
}) => {
  return (
    <SkeletonRegion className={`p-5 rounded-[16px] border border-[#E5E7EB] bg-white shadow-xs space-y-4 ${className}`}>
      {/* Header with dark title bar */}
      <div className="flex items-center justify-between gap-4">
        <div
          style={{ backgroundColor: SKELETON_TOKENS.title }}
          className="h-5 w-44 rounded-[6px] animate-skeleton-pulse"
        />
        <div className="h-5 w-16 rounded-full bg-[#F5F6FA] border border-[#E5E7EB]" />
      </div>

      {/* 2px Cobalt Rule directly under header */}
      <div
        style={{ backgroundColor: SKELETON_TOKENS.headerRule }}
        className="h-[2px] w-full rounded-full"
        aria-hidden="true"
      />

      {/* Two soft gray stat wells */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <SkeletonWell delayIndex={delayIndex} />
        <SkeletonWell delayIndex={delayIndex + 1} />
      </div>

      {/* Highlighted cobalt row with sweep */}
      <SkeletonHighlightRow delayIndex={delayIndex + 2} />
    </SkeletonRegion>
  );
};

export const SkeletonTable: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = ({
  rows = 4,
  cols = 4,
  className = '',
}) => (
  <SkeletonRegion className={`rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden ${className}`}>
    {/* Table Header */}
    <div className="p-4 border-b border-[#E5E7EB] bg-[#F5F6FA] flex items-center justify-between gap-4">
      <SkeletonBar width={120} height={14} color={SKELETON_TOKENS.title} />
      <SkeletonBar width={80} height={12} />
    </div>
    {/* Table Columns Header */}
    <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-[#F3F4F6] bg-[#FAFAFA]">
      {Array.from({ length: cols }).map((_, c) => (
        <SkeletonBar key={c} width={c === 0 ? '60%' : '40%'} height={11} color="#9CA3AF" />
      ))}
    </div>
    {/* Rows */}
    <div className="divide-y divide-[#F3F4F6]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid grid-cols-4 gap-4 px-4 py-3.5 items-center">
          <div className="flex items-center gap-2.5">
            <SkeletonCircle size={24} delayIndex={r} />
            <SkeletonBar width="70%" height={12} delayIndex={r} />
          </div>
          <SkeletonBar width="50%" height={12} delayIndex={r + 1} />
          <SkeletonBar width="40%" height={12} delayIndex={r + 2} />
          <SkeletonBar width="60%" height={12} delayIndex={r + 3} />
        </div>
      ))}
    </div>
  </SkeletonRegion>
);

export const SkeletonChat: React.FC<{
  messages?: number;
  className?: string;
}> = ({
  messages = 4,
  className = '',
}) => (
  <SkeletonRegion className={`space-y-4 p-4 ${className}`} label="Loading messages">
    {Array.from({ length: messages }).map((_, i) => {
      const isMe = i % 2 === 1;
      return (
        <div key={i} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
          <SkeletonCircle size={32} color={isMe ? SKELETON_TOKENS.avatar : SKELETON_TOKENS.icon} delayIndex={i} />
          <div
            className={`p-3.5 rounded-[14px] max-w-[70%] space-y-1.5 ${
              isMe ? 'bg-[#EEF4FD] border border-[#C9DAF2]' : 'bg-[#F5F6FA] border border-[#E5E7EB]'
            }`}
          >
            <SkeletonBar width={isMe ? 140 : 200} height={12} color={isMe ? SKELETON_TOKENS.blueBar1 : SKELETON_TOKENS.bar} />
            <SkeletonBar width={isMe ? 90 : 130} height={10} color={isMe ? SKELETON_TOKENS.blueBar2 : '#D1D5DB'} />
          </div>
        </div>
      );
    })}
  </SkeletonRegion>
);

export const SkeletonProfile: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <SkeletonRegion className={`p-6 rounded-[24px] border border-[#E5E7EB] bg-white shadow-xs space-y-6 ${className}`} label="Loading profile">
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
      <SkeletonCircle size={84} color={SKELETON_TOKENS.avatar} />
      <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
        <SkeletonBar width={180} height={20} color={SKELETON_TOKENS.title} />
        <SkeletonBar width={260} height={14} color="#6B7280" />
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
          <div className="h-6 w-20 rounded-full bg-[#EAF1FB]" />
          <div className="h-6 w-24 rounded-full bg-[#F5F6FA]" />
        </div>
      </div>
    </div>
    <div
      style={{ backgroundColor: SKELETON_TOKENS.headerRule }}
      className="h-[2px] w-full rounded-full"
      aria-hidden="true"
    />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <SkeletonWell />
      <SkeletonWell delayIndex={1} />
      <SkeletonWell delayIndex={2} />
    </div>
  </SkeletonRegion>
);

export const SkeletonBadge: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <SkeletonRegion className={`aspect-square max-w-[420px] w-full mx-auto p-8 rounded-[36px] border border-[#E5E7EB] bg-white shadow-md flex flex-col justify-between items-center text-center ${className}`} label="Loading badge">
    <SkeletonCircle size={140} color={SKELETON_TOKENS.icon} />
    <div className="space-y-2 w-full flex flex-col items-center">
      <SkeletonBar width={160} height={20} color={SKELETON_TOKENS.title} />
      <SkeletonBar width={220} height={14} color="#6B7280" />
    </div>
    <div className="w-full pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
      <div className="h-6 w-28 rounded-full bg-[#E8F7EF] border border-[#BFE6D3]" />
      <SkeletonBar width={80} height={12} color="#9CA3AF" />
    </div>
  </SkeletonRegion>
);

/* ==========================================================================
   PAGE-LEVEL SKELETON COMPOSITIONS
   ========================================================================== */

export const JobCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonRegion className={`p-5 rounded-[16px] border border-[#E5E7EB] bg-white shadow-xs space-y-4 ${className}`}>
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-[#EAF1FB]" />
          <div className="h-5 w-20 rounded-full bg-[#F5F6FA]" />
        </div>
        <SkeletonBar width="70%" height={18} color={SKELETON_TOKENS.title} />
        <SkeletonBar width="90%" height={13} color="#6B7280" />
      </div>
      <div className="h-9 w-24 rounded-full bg-[#0047AB]/20" />
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
      <div className="flex items-center gap-2">
        <SkeletonCircle size={22} color={SKELETON_TOKENS.avatar} />
        <SkeletonBar width={100} height={12} />
      </div>
      <SkeletonBar width={70} height={12} color={SKELETON_TOKENS.title} />
    </div>
  </SkeletonRegion>
);

export const DashboardSkeleton: React.FC = () => (
  <SkeletonRegion className="max-w-6xl mx-auto px-4 py-8 space-y-6" label="Loading dashboard">
    {/* Top Wells */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <SkeletonWell delayIndex={0} />
      <SkeletonWell delayIndex={1} />
      <SkeletonWell delayIndex={2} />
      <SkeletonWell delayIndex={3} />
    </div>
    {/* Main Highlights and Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <SkeletonBar width={200} height={20} color={SKELETON_TOKENS.title} />
        <JobCardSkeleton />
        <JobCardSkeleton />
      </div>
      <div className="space-y-4">
        <SkeletonCard />
      </div>
    </div>
  </SkeletonRegion>
);

export const FindJobsSkeleton: React.FC = () => (
  <SkeletonRegion className="max-w-6xl mx-auto px-4 py-8 space-y-6" label="Loading jobs">
    {/* Category Strip */}
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 w-24 rounded-full bg-[#F5F6FA] border border-[#E5E7EB] shrink-0" />
      ))}
    </div>
    {/* Jobs List */}
    <div className="space-y-4">
      <JobCardSkeleton />
      <JobCardSkeleton />
      <JobCardSkeleton />
    </div>
  </SkeletonRegion>
);

export const JobDetailSkeleton: React.FC = () => (
  <SkeletonRegion className="max-w-5xl mx-auto px-4 py-8 space-y-6" label="Loading job details">
    <div className="p-6 rounded-[20px] border border-[#E5E7EB] bg-white shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded-full bg-[#EAF1FB]" />
        <div className="h-10 w-32 rounded-full bg-[#0047AB]/20" />
      </div>
      <SkeletonBar width="60%" height={26} color={SKELETON_TOKENS.title} />
      <div
        style={{ backgroundColor: SKELETON_TOKENS.headerRule }}
        className="h-[2px] w-full rounded-full"
        aria-hidden="true"
      />
      <div className="space-y-2 pt-2">
        <SkeletonBar width="100%" height={14} />
        <SkeletonBar width="95%" height={14} />
        <SkeletonBar width="70%" height={14} />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SkeletonWell delayIndex={0} />
      <SkeletonWell delayIndex={1} />
      <SkeletonWell delayIndex={2} />
    </div>
  </SkeletonRegion>
);

export const WorkspaceSkeleton: React.FC = () => (
  <SkeletonRegion className="max-w-6xl mx-auto px-4 py-8 space-y-6" label="Loading workspace">
    <SkeletonCard />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SkeletonChat />
      </div>
      <div className="space-y-4">
        <SkeletonWell />
        <SkeletonHighlightRow />
      </div>
    </div>
  </SkeletonRegion>
);

export const MessagesSkeleton: React.FC = () => (
  <SkeletonRegion className="max-w-5xl mx-auto px-4 py-8" label="Loading messages">
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white grid grid-cols-1 md:grid-cols-3 overflow-hidden min-h-[500px]">
      <div className="border-r border-[#E5E7EB] p-3 space-y-3">
        <SkeletonRow avatar />
        <SkeletonRow avatar delayIndex={1} />
        <SkeletonRow avatar delayIndex={2} />
      </div>
      <div className="md:col-span-2 p-4">
        <SkeletonChat />
      </div>
    </div>
  </SkeletonRegion>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <SkeletonProfile />
  </div>
);

export const LeaderboardSkeleton: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <SkeletonTable rows={6} cols={4} />
  </div>
);

export const ReputationSkeleton: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SkeletonWell delayIndex={0} />
      <SkeletonWell delayIndex={1} />
      <SkeletonWell delayIndex={2} />
    </div>
    <SkeletonCard />
  </div>
);

export const AttestationsSkeleton: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <SkeletonCard />
      <SkeletonCard delayIndex={1} />
      <SkeletonCard delayIndex={2} />
    </div>
  </div>
);

export const CertificateViewerSkeleton: React.FC = () => (
  <div className="max-w-2xl mx-auto px-4 py-12">
    <SkeletonBadge />
  </div>
);

export const NotificationsDropdownSkeleton: React.FC = () => (
  <div className="p-3 w-80 space-y-2 bg-white rounded-[12px] border border-[#E5E7EB] shadow-lg">
    <SkeletonRow lines={2} delayIndex={0} />
    <SkeletonRow lines={2} delayIndex={1} />
    <SkeletonRow lines={2} delayIndex={2} />
  </div>
);

export const WalletBalancePopoverSkeleton: React.FC = () => (
  <div className="p-4 w-72 space-y-3 bg-white rounded-[14px] border border-[#E5E7EB] shadow-lg">
    <div className="flex items-center justify-between">
      <SkeletonBar width={80} height={12} />
      <div className="h-5 w-16 rounded-full bg-[#F5F6FA]" />
    </div>
    <SkeletonBar width={130} height={22} color={SKELETON_TOKENS.title} />
    <SkeletonHighlightRow />
  </div>
);

export const LandingTrustStripSkeleton: React.FC = () => (
  <div className="w-full py-6 border-y border-[#E5E7EB] bg-[#FAFAFA]">
    <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
      <SkeletonRow avatar={false} lines={2} delayIndex={0} />
      <SkeletonRow avatar={false} lines={2} delayIndex={1} />
      <SkeletonRow avatar={false} lines={2} delayIndex={2} />
      <SkeletonRow avatar={false} lines={2} delayIndex={3} />
    </div>
  </div>
);

export const LandingMarketplaceSkeleton: React.FC = () => (
  <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <JobCardSkeleton />
      <JobCardSkeleton />
      <JobCardSkeleton />
    </div>
  </div>
);

export const LandingCategoryPanelSkeleton: React.FC = () => (
  <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <SkeletonWell delayIndex={0} />
      <SkeletonWell delayIndex={1} />
      <SkeletonWell delayIndex={2} />
      <SkeletonWell delayIndex={3} />
    </div>
  </div>
);

export const CardSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <SkeletonRegion className={`p-5 rounded-[12px] border border-[#E5E7EB] bg-white space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonCircle size={40} />
        <div className="space-y-1.5 flex-1">
          <SkeletonBar height={16} width="40%" color={SKELETON_TOKENS.title} />
          <SkeletonBar height={12} width="25%" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBar key={i} height={14} width={i === lines - 1 ? '60%' : '100%'} delayIndex={i} />
        ))}
      </div>
    </SkeletonRegion>
  );
};

/* Attach subcomponents to main Skeleton */
Skeleton.Bar = SkeletonBar;
Skeleton.Circle = SkeletonCircle;
Skeleton.Card = SkeletonCard;
Skeleton.Well = SkeletonWell;
Skeleton.HighlightRow = SkeletonHighlightRow;
Skeleton.Row = SkeletonRow;
Skeleton.Table = SkeletonTable;
Skeleton.Chat = SkeletonChat;
Skeleton.Profile = SkeletonProfile;
Skeleton.Badge = SkeletonBadge;

export default Skeleton;
