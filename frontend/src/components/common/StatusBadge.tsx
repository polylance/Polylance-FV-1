import React from 'react';
import { CanonicalJobStatus, getCanonicalJobStatus } from '../../utils/formatters';

export interface StatusBadgeProps {
  status?: CanonicalJobStatus | string;
  job?: any;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

interface StatusConfig {
  label: string;
  badgeClasses: string;
  dotColor: string;
  pingColor?: string;
  shouldPulse: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status: explicitStatus,
  job,
  className = '',
  size = 'md',
  pulse,
}) => {
  const status: CanonicalJobStatus = explicitStatus
    ? (explicitStatus as CanonicalJobStatus)
    : getCanonicalJobStatus(job);

  const configs: Record<CanonicalJobStatus, StatusConfig> = {
    Open: {
      label: 'Open',
      badgeClasses: 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-800 border-emerald-300/80 shadow-2xs',
      dotColor: 'bg-emerald-500',
      pingColor: 'bg-emerald-400',
      shouldPulse: true,
    },
    Negotiating: {
      label: 'Negotiating',
      badgeClasses: 'bg-amber-50/90 hover:bg-amber-100/90 text-amber-800 border-amber-300/80 shadow-2xs',
      dotColor: 'bg-amber-500',
      pingColor: 'bg-amber-400',
      shouldPulse: true,
    },
    Funded: {
      label: 'Escrow Funded',
      badgeClasses: 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-800 border-blue-300/80 shadow-2xs',
      dotColor: 'bg-blue-600',
      pingColor: 'bg-blue-400',
      shouldPulse: false,
    },
    'In progress': {
      label: 'In Progress',
      badgeClasses: 'bg-sky-50/90 hover:bg-sky-100/90 text-sky-800 border-sky-300/80 shadow-2xs',
      dotColor: 'bg-sky-500',
      pingColor: 'bg-sky-400',
      shouldPulse: true,
    },
    Submitted: {
      label: 'In Review',
      badgeClasses: 'bg-purple-50/90 hover:bg-purple-100/90 text-purple-800 border-purple-300/80 shadow-2xs',
      dotColor: 'bg-purple-600',
      pingColor: 'bg-purple-400',
      shouldPulse: true,
    },
    Completed: {
      label: 'Completed',
      badgeClasses: 'bg-teal-50/90 hover:bg-teal-100/90 text-teal-800 border-teal-300/80 shadow-2xs',
      dotColor: 'bg-teal-600',
      pingColor: 'bg-teal-400',
      shouldPulse: false,
    },
    Disputed: {
      label: 'Disputed',
      badgeClasses: 'bg-rose-50/90 hover:bg-rose-100/90 text-rose-800 border-rose-300/80 shadow-2xs',
      dotColor: 'bg-rose-600',
      pingColor: 'bg-rose-400',
      shouldPulse: true,
    },
  };

  const current = configs[status] || configs.Open;
  const isPulsing = pulse !== undefined ? pulse : current.shouldPulse;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5 rounded-full',
    md: 'px-2.5 py-1 text-xs gap-2 rounded-full',
    lg: 'px-3 py-1.5 text-xs gap-2.5 rounded-full',
  }[size];

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold tracking-tight border transition-all duration-200 select-none ${current.badgeClasses} ${sizeClasses} ${className}`}
    >
      <span className={`relative flex ${dotSizeClasses} shrink-0`}>
        {isPulsing && current.pingColor && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.pingColor}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full ${dotSizeClasses} ${current.dotColor} shadow-xs`}
        />
      </span>
      <span className="font-sans leading-none">{current.label}</span>
    </span>
  );
};

export default StatusBadge;
