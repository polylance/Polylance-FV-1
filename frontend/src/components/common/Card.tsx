import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: React.ElementType;
}

/**
 * Clean 1px-bordered Card (#E2E5EA) with zero drop shadows, gradients, or blur.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'md',
  as: Component = 'div',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }[padding];

  const hoverClasses =
    hoverable || onClick
      ? 'hover:border-[#0B0B0C] transition-colors duration-[120ms] cursor-pointer active:translate-y-[1px]'
      : '';

  return (
    <Component
      onClick={onClick}
      className={`bg-white border border-[#E2E5EA] rounded-[10px] ${paddingClasses} ${hoverClasses} ${className}`}
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
  onClick,
}) => {
  return (
    <Card
      className={`flex flex-col justify-between p-4 sm:p-5 ${className}`}
      onClick={onClick}
      hoverable={Boolean(onClick)}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[14px] font-medium text-[#4B5563]">{label}</span>
        {icon && <div className="text-[#0047AB] shrink-0">{icon}</div>}
      </div>
      <div className="text-[28px] sm:text-[32px] leading-[36px] font-bold text-[#0B0B0C] tabular-amount">
        {value}
      </div>
      {(helper || delta) && (
        <div className="mt-2 flex items-center gap-2 text-[14px] text-[#4B5563]">
          {delta && (
            <span className={`font-semibold ${delta.positive ? 'text-[#0B7A55]' : 'text-[#B1122B]'}`}>
              {delta.positive ? '+' : ''}
              {delta.value}
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
  className = '',
}) => {
  const styles = {
    info: 'bg-[#EFF6FF] border-[#0A52B8] text-[#0A0D14]',
    warning: 'bg-[#EFF6FF] border-[#2563EB] text-[#0A0D14]',
    danger: 'bg-[#0F172A] border-[#0A0D14] text-white',
    success: 'bg-[#EFF6FF] border-[#0A52B8] text-[#0A0D14]',
  }[variant];

  return (
    <div className={`p-4 rounded-[10px] border flex items-start gap-3 text-[14px] ${styles} ${className}`}>
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-bold text-[15px] mb-0.5">{title}</h5>}
        <div className="text-[14px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

export default Card;
