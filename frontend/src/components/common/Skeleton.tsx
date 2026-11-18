import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md'
}) => {
  const roundedClasses = {
    sm: 'rounded-[6px]',
    md: 'rounded-[10px]',
    lg: 'rounded-[12px]',
    full: 'rounded-full'
  }[rounded];

  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  return (
    <div
      style={style}
      className={`bg-[#E5E7EB] animate-pulse ${roundedClasses} ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`p-5 rounded-[12px] border border-[#E5E7EB] bg-white space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton height={16} width="40%" />
          <Skeleton height={12} width="25%" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height={14} width={i === lines - 1 ? '60%' : '100%'} />
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
