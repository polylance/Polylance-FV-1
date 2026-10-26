import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  backTo?: string;
  backLabel?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  badge,
  actions,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#4B5563] hover:text-[#0047AB] transition-colors mb-2"
        >
          <ChevronLeft size={14} />
          <span>{backLabel}</span>
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[28px] leading-[34px] font-semibold text-[#0B0B0F] tracking-tight">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <div className="text-sm leading-[20px] text-[#4B5563] mt-1 max-w-[720px]">
              {subtitle}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
