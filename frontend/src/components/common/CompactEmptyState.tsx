import React from 'react';
import { Button } from './Button';

export interface CompactEmptyStateProps {
  icon?: React.ReactNode | React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export const CompactEmptyState: React.FC<CompactEmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  action,
  className = '',
}) => {
  const finalActionLabel = action?.label || actionLabel;
  const finalOnAction = action?.onClick || onAction;
  const finalActionHref = action?.href || actionHref;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function') {
      const IconComponent = icon as React.ComponentType<{ size?: number; className?: string }>;
      return <IconComponent size={20} className="text-[#4B5563]" />;
    }
    return null;
  };

  return (
    <div
      className={`max-h-[200px] py-5 px-4 text-center flex flex-col items-center justify-center border border-[#E5E7EB] rounded-[12px] bg-white ${className}`}
    >
      {icon && (
        <div className="w-9 h-9 rounded-[8px] bg-[#F6F7F9] text-[#4B5563] flex items-center justify-center mb-2 border border-[#E5E7EB] shrink-0">
          {renderIcon()}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#0B0B0F] tracking-tight">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-[#4B5563] max-w-sm line-clamp-2">{description}</p>
      )}
      {finalActionLabel && (finalOnAction || finalActionHref) && (
        <div className="mt-3 shrink-0">
          {finalActionHref ? (
            <a
              href={finalActionHref}
              className="inline-flex items-center justify-center font-medium rounded-[8px] px-3 py-1.5 text-xs bg-[#0047AB] text-white hover:bg-[#00388A] transition-colors min-h-[32px]"
            >
              {finalActionLabel}
            </a>
          ) : (
            <Button variant="primary" size="sm" onClick={finalOnAction} className="min-h-[32px] py-1 text-xs">
              {finalActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactEmptyState;
