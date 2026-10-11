import React from 'react';
import { CanonicalJobStatus, getCanonicalJobStatus } from '../../utils/formatters';

export interface StatusBadgeProps {
  status?: CanonicalJobStatus | string;
  job?: any;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status: explicitStatus,
  job,
  className = '',
  size = 'md'
}) => {
  const status: CanonicalJobStatus = explicitStatus
    ? (explicitStatus as CanonicalJobStatus)
    : getCanonicalJobStatus(job);

  const config: Record<
    CanonicalJobStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    Open: {
      label: 'Open',
      bg: 'bg-[#F6F7F9]',
      text: 'text-[#4B5563]',
      border: 'border-[#E5E7EB]',
      dot: 'bg-[#4B5563]'
    },
    Negotiating: {
      label: 'Negotiating',
      bg: 'bg-[#FCEBDD]',
      text: 'text-[#C2610C]',
      border: 'border-[#E5E7EB]',
      dot: 'bg-[#C2610C]'
    },
    Funded: {
      label: 'Funded',
      bg: 'bg-[#E7EEF9]',
      text: 'text-[#0047AB]',
      border: 'border-[#E5E7EB]',
      dot: 'bg-[#0047AB]'
    },
    'In progress': {
      label: 'In progress',
      bg: 'bg-[#E7EEF9]',
      text: 'text-[#0047AB]',
      border: 'border-[#E5E7EB]',
      dot: 'bg-[#0047AB]'
    },
    Submitted: {
      label: 'Submitted',
      bg: 'bg-[#FCEBDD]',
      text: 'text-[#C2610C]',
      border: 'border-[#E5E7EB]',
      dot: 'bg-[#C2610C]'
    },
    Completed: {
      label: 'Completed',
      bg: 'bg-[#E3F3EA]',
      text: 'text-[#1E8449]',
      border: 'border-[#E5E7EB]',
      dot: 'bg-[#1E8449]'
    },
    Disputed: {
      label: 'Disputed',
      bg: 'bg-[#FAE4E1]',
      text: 'text-[#C0392B]',
      border: 'border-[#E5E7EB]',
      dot: 'bg-[#C0392B]'
    }
  };

  const current = config[status] || config.Open;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-[8px] border ${current.bg} ${current.text} ${current.border} ${padding} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
};

export default StatusBadge;
