import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useReducedMotion } from '../../media/useDataSaver';
import { MOTION } from '../../styles/motion';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'ghost' 
  | 'inverse' 
  | 'outline-inverse' 
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export type ButtonAsButton = BaseButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: 'button';
    to?: never;
    href?: never;
  };

export type ButtonAsAnchor = BaseButtonProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: 'a';
    href: string;
    to?: never;
  };

export type ButtonAsLink = BaseButtonProps &
  Omit<LinkProps, 'to'> & {
    as: 'Link';
    to: LinkProps['to'];
    href?: never;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor | ButtonAsLink;

/**
 * Universal <Button> component strictly adhering to PolyLance design system.
 * Supports button, a, and react-router-dom Link polymorphism.
 * Never nest an <a> in a <button> or vice-versa.
 */
export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = 'primary',
      size = 'md',
      as = 'button',
      leadingIcon,
      trailingIcon,
      icon,
      loading = false,
      fullWidth = false,
      disabled = false,
      children,
      className = '',
      ...restProps
    } = props;

    const reducedMotion = useReducedMotion();
    const startIcon = leadingIcon || icon;

    // ── Base layout, typography & focus states ──
    const baseStyles = [
      'group relative overflow-hidden inline-flex items-center justify-center font-sans font-semibold tracking-normal whitespace-nowrap select-none transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] shrink-0',
      'active:scale-[0.98]',
      fullWidth ? 'w-full' : '',
      disabled || loading ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    ].filter(Boolean).join(' ');

    // ── Heights & paddings per spec: sm: 36px, md: 44px, lg: 52px ──
    const sizeStyles = {
      sm: 'h-9 px-4 text-[15px] gap-2 rounded-[10px] min-h-[36px]',
      md: 'h-11 px-5 text-[15px] gap-2 rounded-[10px] min-h-[44px]',
      lg: 'h-[52px] px-6 text-[16px] gap-2.5 rounded-[12px] min-h-[52px]',
    }[size];

    // ── Focus visible rings (cobalt by default, white on dark/cobalt bands) ──
    const focusRing =
      variant === 'inverse' || variant === 'outline-inverse'
        ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0047AB]'
        : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

    // ── Variants without gradients, shadows, or glows ──
    let variantStyles = '';

    if (disabled) {
      variantStyles = 'bg-[#E5E7EB] text-[#9CA3AF] border border-[#E5E7EB]';
    } else {
      switch (variant) {
        case 'primary':
          variantStyles =
            'bg-[#0047AB] hover:bg-[#003A8C] active:bg-[#002F73] text-white border border-transparent';
          break;
        case 'secondary':
          variantStyles =
            'bg-white hover:bg-[#F9FAFB] active:bg-[#F3F4F6] text-[#0B0B0F] border border-[#D1D5DB] hover:border-[#0B0B0F]';
          break;
        case 'ghost':
          variantStyles =
            'bg-transparent hover:bg-transparent text-[#0047AB] hover:underline underline-offset-[3px] border border-transparent p-0 h-auto min-h-0';
          break;
        case 'inverse':
          variantStyles =
            'bg-white hover:bg-[#F9FAFB] active:bg-[#E5E7EB] text-[#0047AB] border border-transparent';
          break;
        case 'outline-inverse':
          variantStyles =
            'bg-transparent hover:bg-white/10 active:bg-white/20 text-white border border-white/60 hover:border-white';
          break;
        case 'danger':
          variantStyles =
            'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white border border-transparent';
          break;
      }
    }

    const combinedClasses = `${baseStyles} ${sizeStyles} ${focusRing} ${variantStyles} ${className}`.trim();

    // ── Content structure ──
    const content = (
      <>
        {/* Soft Cobalt/White shine sweep on hover for primary buttons */}
        {variant === 'primary' && !disabled && !reducedMotion && (
          <span
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] z-0"
            aria-hidden="true"
          >
            <span className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </span>
        )}

        {loading ? (
          <span 
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0 relative z-10" 
            aria-hidden="true" 
          />
        ) : startIcon ? (
          <span className="shrink-0 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px] relative z-10">
            {startIcon}
          </span>
        ) : null}

        <span className="relative z-10">{children}</span>

        {!loading && trailingIcon && (
          <span className="shrink-0 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 relative z-10">
            {trailingIcon}
          </span>
        )}
      </>
    );

    // ── Polymorphic render ──
    if (as === 'Link') {
      const { to, ...linkRest } = restProps as ButtonAsLink;
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={to}
          className={combinedClasses}
          aria-disabled={disabled || loading}
          tabIndex={disabled || loading ? -1 : undefined}
          {...linkRest}
        >
          {content}
        </Link>
      );
    }

    if (as === 'a') {
      const { href, ...anchorRest } = restProps as ButtonAsAnchor;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combinedClasses}
          aria-disabled={disabled || loading}
          tabIndex={disabled || loading ? -1 : undefined}
          {...anchorRest}
        >
          {content}
        </a>
      );
    }

    const buttonRest = restProps as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={buttonRest.type || 'button'}
        disabled={disabled || loading}
        className={combinedClasses}
        {...buttonRest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
