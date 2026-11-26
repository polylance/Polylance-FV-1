import React from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';

export interface AppLinkProps extends Partial<RouterLinkProps> {
  href?: string;
  to?: RouterLinkProps['to'];
  children: React.ReactNode;
  className?: string;
  onDark?: boolean;
  external?: boolean;
}

/**
 * Unified accessible Link supporting internal routes and external anchors.
 * Contrast-tuned for light (#0047AB) and dark (#9EC5FF) ink surfaces.
 */
export const Link: React.FC<AppLinkProps> = ({
  to,
  href,
  children,
  className = '',
  onDark = false,
  external = false,
  ...rest
}) => {
  const colorClasses = onDark
    ? 'text-[#9EC5FF] hover:text-white underline-offset-4 hover:underline'
    : 'text-[#0047AB] hover:text-[#00388A] underline-offset-4 hover:underline';

  const base = `inline-flex items-center gap-1.5 font-medium transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] focus-visible:ring-offset-2 rounded-[4px] ${colorClasses} ${className}`;

  if (href || external) {
    return (
      <a
        href={href || (typeof to === 'string' ? to : '#')}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={base}
      >
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={to || '/'} className={base} {...rest}>
      {children}
    </RouterLink>
  );
};

export default Link;
