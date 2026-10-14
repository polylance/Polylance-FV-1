import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface GroupedRowProps {
  label?: React.ReactNode;
  title?: React.ReactNode;
  value?: React.ReactNode;
  trailing?: React.ReactNode;
  icon?: React.ReactNode;
  leading?: React.ReactNode;
  caption?: React.ReactNode;
  subtitle?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  hasChevron?: boolean;
  dense?: boolean;
  className?: string;
  disabled?: boolean;
  action?: React.ReactNode;
}

export const GroupedRow: React.FC<GroupedRowProps> = ({
  label,
  title,
  value,
  trailing,
  icon,
  leading,
  caption,
  subtitle,
  onClick,
  href,
  hasChevron = false,
  dense = false,
  className = '',
  disabled = false,
  action,
}) => {
  const displayLabel = label ?? title;
  const displayCaption = caption ?? subtitle;
  const displayIcon = icon ?? leading;
  const displayValue = value ?? trailing;
  const isInteractive = Boolean(onClick || href) && !disabled;
  const Component = href ? 'a' : isInteractive ? 'button' : 'div';

  const minHeightClass = dense ? 'min-h-[48px] py-2' : 'min-h-[56px] py-3';

  return (
    <Component
      href={href}
      onClick={isInteractive ? onClick : undefined}
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-4 px-4 sm:px-5 text-left transition-colors duration-150 ${minHeightClass} ${
        isInteractive
          ? 'hover:bg-[#F6F7F9] active:scale-[0.99] active:bg-[#F0F2F5] cursor-pointer focus-visible:outline-none focus-visible:bg-[#F6F7F9]'
          : ''
      } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {displayIcon && <div className="shrink-0 text-[#6B7280]">{displayIcon}</div>}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[#0B0B0F] truncate">{displayLabel}</div>
          {displayCaption && <div className="text-xs text-[#6B7280] mt-0.5 truncate">{displayCaption}</div>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {displayValue && <div className="text-sm text-[#4B5563] font-normal">{displayValue}</div>}
        {action}
        {(hasChevron || (isInteractive && hasChevron !== false)) && (
          <ChevronRight size={16} className="text-[#9CA3AF] shrink-0" />
        )}
      </div>
    </Component>
  );
};

export interface GroupedListProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  dense?: boolean;
  className?: string;
}

export const GroupedList: React.FC<GroupedListProps> = ({
  children,
  header,
  footer,
  dense: _dense,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {header && (
        <div className="px-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
          {header}
        </div>
      )}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] divide-y divide-[#E5E7EB] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {children}
      </div>
      {footer && (
        <div className="px-4 text-xs text-[#6B7280] leading-normal">
          {footer}
        </div>
      )}
    </div>
  );
};

export const GroupedListItem = GroupedRow;
export default GroupedList;

