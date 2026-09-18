import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type SkeletonVariant = 'text' | 'card' | 'avatar' | 'stat' | 'button' | 'custom';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  rounded,
  className = '',
  lines = 1,
  style,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();
  const animationClass = prefersReducedMotion ? 'bg-slate-200' : 'animate-pulse bg-slate-200/80';

  const defaultStyles: React.CSSProperties = {
    width: width ?? (variant === 'avatar' ? '40px' : variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'avatar' ? '40px' : variant === 'text' ? '16px' : variant === 'button' ? '44px' : undefined),
    ...style,
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'avatar':
        return `rounded-full shrink-0 ${rounded || ''}`;
      case 'card':
        return `rounded-2xl border border-slate-100 p-5 ${rounded || ''}`;
      case 'stat':
        return `rounded-xl p-4 ${rounded || ''}`;
      case 'button':
        return `rounded-xl min-h-[44px] ${rounded || ''}`;
      case 'text':
      default:
        return `rounded-md ${rounded || ''}`;
    }
  };

  if (variant === 'card') {
    return (
      <div
        className={`bg-white shadow-sm flex flex-col gap-3 ${getVariantClasses()} ${className}`}
        style={defaultStyles}
        aria-hidden="true"
        {...props}
      >
        <div className={`h-5 w-2/3 ${animationClass} rounded`} />
        <div className={`h-4 w-full ${animationClass} rounded`} />
        <div className={`h-4 w-4/5 ${animationClass} rounded`} />
        <div className="flex gap-2 pt-2">
          <div className={`h-7 w-16 ${animationClass} rounded-full`} />
          <div className={`h-7 w-20 ${animationClass} rounded-full`} />
        </div>
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div
        className={`bg-white border border-slate-100 flex flex-col gap-2 ${getVariantClasses()} ${className}`}
        style={defaultStyles}
        aria-hidden="true"
        {...props}
      >
        <div className={`h-3.5 w-24 ${animationClass} rounded`} />
        <div className={`h-7 w-32 ${animationClass} rounded-md`} />
      </div>
    );
  }

  if (lines > 1) {
    return (
      <div className={`flex flex-col gap-2.5 w-full ${className}`} aria-hidden="true" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${animationClass} ${getVariantClasses()}`}
            style={{
              width: i === lines - 1 && lines > 1 ? '70%' : '100%',
              height: height || '16px',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${animationClass} ${getVariantClasses()} ${className}`}
      style={defaultStyles}
      aria-hidden="true"
      {...props}
    />
  );
};
