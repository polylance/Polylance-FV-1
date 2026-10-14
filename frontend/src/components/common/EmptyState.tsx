import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = '',
}) => {
  return (
    <div
      className={`py-6 px-4 text-center flex flex-col items-center justify-center border border-[#E5E7EB] rounded-[12px] bg-white max-h-[220px] ${className}`}
    >
      {icon && (
        <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] text-[#4B5563] flex items-center justify-center mb-2.5 border border-[#E5E7EB] shrink-0">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#0B0B0F] tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-[#4B5563] max-w-md mx-auto line-clamp-2">{description}</p>
      )}
      {(actionLabel && (onAction || actionHref)) && (
        <div className="mt-3.5 shrink-0">
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center justify-center font-medium rounded-[8px] px-3.5 py-1.5 text-xs bg-[#0047AB] text-white hover:bg-[#00388A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 min-h-[36px]"
            >
              {actionLabel}
            </a>
          ) : (
            <Button variant="primary" size="sm" onClick={onAction} className="min-h-[36px] py-1.5 text-xs">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
