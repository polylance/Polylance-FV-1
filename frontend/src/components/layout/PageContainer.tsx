import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  /**
   * Container width presets:
   * - 'wide': max-w-[1320px] for hero, navbar, and wide-grid surfaces
   * - 'standard' (default): max-w-[1200px] for Apple-calm standard content
   * - 'reading': max-w-[760px] for focused legal/editorial reading
   * - 'legacy-wide': max-w-[1540px] for legacy dashboard layouts
   * - 'full': w-full max-w-none
   */
  size?: 'wide' | 'standard' | 'reading' | 'full' | 'legacy-wide';
  noVerticalPadding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
  size = 'standard',
  noVerticalPadding = false,
}) => {
  const sizeClasses = {
    wide: 'max-w-[1440px]',
    standard: 'max-w-[1440px]',
    reading: 'max-w-[760px]',
    full: 'w-full max-w-none',
    'legacy-wide': 'max-w-[1440px]',
  }[size];

  const verticalPaddingClasses = noVerticalPadding ? '' : 'pt-4 sm:pt-6 pb-8 sm:pb-12';

  return (
    <Component
      className={`w-full ${sizeClasses} mx-auto px-[clamp(20px,3vw,48px)] ${verticalPaddingClasses} ${className}`}
    >
      {children}
    </Component>
  );
};

export default PageContainer;
