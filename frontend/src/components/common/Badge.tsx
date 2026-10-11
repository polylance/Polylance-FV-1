import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'cobalt';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    neutral: 'bg-[#F6F7F9] text-[#4B5563] border-[#E5E7EB]',
    success: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    warning: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    danger: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    cobalt: 'bg-[#EFF6FF] text-[#0047AB] border-[#BFDBFE]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-[8px]',
    md: 'text-xs px-2.5 py-1 rounded-[8px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export interface TierBadgeProps {
  tier: string;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-medium bg-[#F6F7F9] border border-[#E5E7EB] text-[#0B0B0F] ${className}`}
    >
      <svg
        className="w-3.5 h-3.5 text-[#6B7280]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
      <span>{tier}</span>
    </span>
  );
};

export interface FilterChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
  disabled?: boolean;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onClick,
  count,
  className = '',
  disabled = false
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-colors duration-150 cursor-pointer ${
        selected
          ? 'bg-[#EAF1FB] text-[#0047AB] border-[#0047AB]'
          : 'bg-white hover:bg-[#F6F7F9] text-[#374151] hover:text-[#0B0B0F] border-[#E5E7EB]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            selected ? 'bg-[#0047AB]/10 text-[#0047AB]' : 'bg-[#E5E7EB] text-[#6B7280]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default Badge;
