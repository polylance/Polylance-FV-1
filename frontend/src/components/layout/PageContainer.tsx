import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  /**
   * Fluid container width presets utilizing the full viewport cleanly:
   * - 'wide' / 'standard' / 'legacy-wide': max-w-[1600px]
   * - 'reading': max-w-[840px]
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
  const isReading = size === 'reading';
  const outerClass =
    size === 'full'
      ? 'w-full max-w-none px-6 lg:px-10'
      : 'w-full max-w-[1440px] mx-auto px-6 lg:px-10';

  const verticalPaddingClasses = noVerticalPadding ? '' : 'py-12 lg:py-[72px]';

  if (isReading) {
    return (
      <Component className={`${outerClass} ${verticalPaddingClasses} ${className}`}>
        <div className="max-w-[840px] w-full">{children}</div>
      </Component>
    );
  }

  return (
    <Component className={`${outerClass} ${verticalPaddingClasses} ${className}`}>
      {children}
    </Component>
  );
};

export default PageContainer;
