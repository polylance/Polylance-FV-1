import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: React.ElementType;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'md',
  as: Component = 'div'
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6'
  }[padding];

  const hoverClasses = hoverable || onClick
    ? 'hover:border-[#0047AB] transition-colors duration-150 cursor-pointer active:scale-[0.99]'
    : '';

  return (
    <Component
      onClick={onClick}
      className={`bg-[#FFFFFF] border border-[#E5E7EB] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${paddingClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </Component>
  );
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: React.ReactNode;
  delta?: { value: string; positive?: boolean };
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  helper,
  icon,
  delta,
  className = '',
  onClick
}) => {
  return (
    <Card className={`flex flex-col justify-between p-4 sm:p-5 ${className}`} onClick={onClick} hoverable={Boolean(onClick)}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-[#6B7280]">{label}</span>
        {icon && <div className="text-[#0047AB] shrink-0">{icon}</div>}
      </div>
      <div className="text-[28px] sm:text-[32px] leading-[34px] font-semibold text-[#0B0B0F] tracking-tight tabular-nums">
        {value}
      </div>
      {(helper || delta) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[#6B7280]">
          {delta && (
            <span className={`font-medium ${delta.positive ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
              {delta.positive ? '+' : ''}{delta.value}
            </span>
          )}
          {helper && <span>{helper}</span>}
        </div>
      )}
    </Card>
  );
};

export interface BannerProps {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  className = ''
}) => {
  const styles = {
    info: 'bg-[#EAF1FB] border-[#0047AB]/20 text-[#0047AB]',
    warning: 'bg-[#FEF3C7] border-[#B45309]/20 text-[#B45309]',
    danger: 'bg-[#FEE2E2] border-[#B91C1C]/20 text-[#B91C1C]',
    success: 'bg-[#DCFCE7] border-[#15803D]/20 text-[#15803D]'
  }[variant];

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${styles} ${className}`}>
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold text-sm mb-0.5">{title}</h5>}
        <div className="text-xs sm:text-sm opacity-90 leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

export default Card;
