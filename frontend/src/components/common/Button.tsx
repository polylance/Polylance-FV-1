import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useReducedMotion } from '../../media/useDataSaver';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
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
  magnetic?: boolean;
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
 * Universal <Button> following semantic palette, 8px control radius,
 * signature 2px ink offset block on primary & inverse variants, and zero gradients/blur.
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
      magnetic = false,
      disabled = false,
      children,
      className = '',
      ...restProps
    } = props;

    const reducedMotion = useReducedMotion();
    const startIcon = leadingIcon || icon;
    const [magOffset, setMagOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const isInteractiveMagnetic = magnetic && !reducedMotion && !disabled && !loading;

    const handleMagneticMove = (e: React.PointerEvent<HTMLElement>) => {
      if (!isInteractiveMagnetic || e.pointerType === 'touch') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      const relY = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
      setMagOffset({
        x: Number((relX * 8).toFixed(2)),
        y: Number((relY * 6).toFixed(2)),
      });
    };

    const handleMagneticLeave = () => {
      if (magOffset.x !== 0 || magOffset.y !== 0) {
        setMagOffset({ x: 0, y: 0 });
      }
    };

    const showSheen = !reducedMotion && !disabled && (variant === 'primary' || variant === 'inverse');

    const baseStyles = [
      'group relative overflow-hidden inline-flex items-center justify-center font-sans font-semibold whitespace-nowrap select-none shrink-0 rounded-[10px]',
      reducedMotion ? '' : 'transition-[background-color,border-color,color,box-shadow,transform] duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
      fullWidth ? 'w-full' : '',
      disabled || loading ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    ]
      .filter(Boolean)
      .join(' ');

    const sizeStyles = {
      sm: 'h-9 px-4 text-[14px] gap-2 min-h-[36px]',
      md: 'h-10 px-4.5 text-[14px] gap-2 min-h-[40px]',
      lg: 'h-[48px] px-6 text-[15px] gap-2.5 min-h-[48px]',
    }[size];

    const focusRing =
      variant === 'inverse' || variant === 'outline-inverse'
        ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0D14]'
        : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A52B8] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

    let variantStyles = '';
    if (disabled) {
      variantStyles = 'bg-[#E2E8F0] text-[#64748B] border border-[#E2E8F0]';
    } else {
      switch (variant) {
        case 'primary':
          variantStyles =
            'bg-[#0A52B8] hover:bg-[#084193] active:bg-[#063273] text-white border border-transparent shadow-[0_2px_8px_rgba(10,82,184,0.22)] active:scale-[0.99]';
          break;
        case 'secondary':
        case 'outline':
          variantStyles =
            'bg-white hover:bg-[#F8FAFC] active:bg-[#EFF6FF] text-[#0F172A] border border-[#E2E8F0] hover:border-[#0A52B8]/45 shadow-[0_1px_2px_rgba(10,13,20,0.04)]';
          break;
        case 'ghost':
          variantStyles =
            'bg-transparent text-[#0A52B8] hover:underline underline-offset-4 border border-transparent px-1 h-auto min-h-0';
          break;
        case 'inverse':
          variantStyles =
            'bg-[#2563EB] hover:bg-[#0066FF] text-white border border-transparent shadow-[0_2px_10px_rgba(37,99,235,0.28)] active:scale-[0.99]';
          break;
        case 'outline-inverse':
          variantStyles =
            'bg-transparent hover:bg-white/10 text-white border border-white/70 hover:border-white';
          break;
        case 'danger':
          variantStyles =
            'bg-[#0F172A] hover:bg-[#0A0D14] text-white border border-transparent shadow-[0_1px_2px_rgba(10,13,20,0.12)] active:scale-[0.99]';
          break;
      }
    }

    const combinedClasses = `${baseStyles} ${sizeStyles} ${focusRing} ${variantStyles} ${className}`.trim();

    const magneticStyle: React.CSSProperties | undefined = isInteractiveMagnetic
      ? { transform: `translate3d(${magOffset.x}px, ${magOffset.y}px, 0)` }
      : undefined;

    const content = (
      <>
        {showSheen && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
          />
        )}
        {loading ? (
          <span
            className="relative z-10 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
            aria-hidden="true"
          />
        ) : startIcon ? (
          <span className="relative z-10 shrink-0 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px]">
            {startIcon}
          </span>
        ) : null}

        <span
          className="relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap leading-none"
          style={{ letterSpacing: 0, wordSpacing: 'normal' }}
        >
          {children}
        </span>

        {!loading && trailingIcon && (
          <span className="relative z-10 shrink-0 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px] transition-transform duration-[140ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
            {trailingIcon}
          </span>
        )}
      </>
    );

    if (as === 'Link') {
      const { to, style, onPointerMove, onPointerLeave, ...linkRest } = restProps as ButtonAsLink;
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={to}
          className={combinedClasses}
          style={{ ...magneticStyle, ...style }}
          onPointerMove={(e) => {
            handleMagneticMove(e);
            onPointerMove?.(e);
          }}
          onPointerLeave={(e) => {
            handleMagneticLeave();
            onPointerLeave?.(e);
          }}
          aria-disabled={disabled || loading}
          tabIndex={disabled || loading ? -1 : undefined}
          {...linkRest}
        >
          {content}
        </Link>
      );
    }

    if (as === 'a') {
      const { href, style, onPointerMove, onPointerLeave, ...anchorRest } = restProps as ButtonAsAnchor;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combinedClasses}
          style={{ ...magneticStyle, ...style }}
          onPointerMove={(e) => {
            handleMagneticMove(e);
            onPointerMove?.(e);
          }}
          onPointerLeave={(e) => {
            handleMagneticLeave();
            onPointerLeave?.(e);
          }}
          aria-disabled={disabled || loading}
          tabIndex={disabled || loading ? -1 : undefined}
          {...anchorRest}
        >
          {content}
        </a>
      );
    }

    const { style, onPointerMove, onPointerLeave, ...buttonRest } = restProps as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={buttonRest.type || 'button'}
        disabled={disabled || loading}
        className={combinedClasses}
        style={{ ...magneticStyle, ...style }}
        onPointerMove={(e) => {
          handleMagneticMove(e);
          onPointerMove?.(e);
        }}
        onPointerLeave={(e) => {
          handleMagneticLeave();
          onPointerLeave?.(e);
        }}
        {...buttonRest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
