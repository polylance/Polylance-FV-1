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
      className={`p-10 text-center flex flex-col items-center justify-center border border-[#E5E7EB] rounded-[12px] bg-white ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-[8px] bg-[#F6F7F9] text-[#4B5563] flex items-center justify-center mb-4 border border-[#E5E7EB]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#0B0B0F]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[#4B5563] max-w-md mx-auto">{description}</p>
      )}
      {(actionLabel && (onAction || actionHref)) && (
        <div className="mt-5">
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center justify-center font-medium rounded-[8px] px-4 py-2 text-sm bg-[#0047AB] text-white hover:bg-[#00388A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 min-h-[40px]"
            >
              {actionLabel}
            </a>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
