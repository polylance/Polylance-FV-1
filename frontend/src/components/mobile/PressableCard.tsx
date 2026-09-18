import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface PressableCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  disabled?: boolean;
  role?: string;
  ariaLabel?: string;
}

export const PressableCard: React.FC<PressableCardProps> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  role = 'button',
  ariaLabel,
  tabIndex = 0,
  ...props
}) => {
  const prefersReducedMotion = useReducedMotion();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // @ts-expect-error synthesize click
      onClick?.(e);
    }
  };

  return (
    <motion.div
      role={role}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      whileTap={disabled || prefersReducedMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.08 }}
      className={`min-h-[44px] cursor-pointer select-none rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 transition-[box-shadow,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:shadow-md active:bg-slate-50'
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
