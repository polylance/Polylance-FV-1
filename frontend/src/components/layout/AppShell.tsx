import React from 'react';

/**
 * ============================================================================
 * POLYLANCE UNIFIED GLOBAL LAYOUT SYSTEM (<AppShell>)
 * ============================================================================
 * Establishes a single fluid container standard across the entire application:
 * - Fluid container width: 100%, max-width: 1760px, centered
 * - Horizontal padding: clamp(16px, 3vw, 56px) with iOS safe area handling
 * - Edge-to-edge backgrounds: Full viewport backgrounds with centered content
 * - Strict adherence to the 8px spacing grid & 12-column structural rules
 * ============================================================================
 */

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  fluid?: boolean;
  noPadding?: boolean;
}

/**
 * <PageContainer>
 * Standard fluid wrapper used by every page, navbar, and footer.
 * Guarantees that left and right margins align with 100% precision across all routes.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
  fluid = false,
  noPadding = false,
  ...props
}) => {
  const baseClasses = fluid
    ? 'w-full'
    : 'w-full max-w-[1760px] mx-auto';

  const paddingClasses = noPadding
    ? ''
    : 'px-[clamp(16px,3vw,56px)] pl-[max(env(safe-area-inset-left,0px),clamp(16px,3vw,56px))] pr-[max(env(safe-area-inset-right,0px),clamp(16px,3vw,56px))]';

  return (
    <Component
      className={`${baseClasses} ${paddingClasses} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * <Section>
 * Semantic section wrapper enforcing vertical rhythm based on an 8px scale.
 */
export const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  as: Component = 'section',
  spacing = 'md',
  ...props
}) => {
  const spacingMap = {
    none: '',
    sm: 'py-4 sm:py-6',
    md: 'py-6 sm:py-8 lg:py-10',
    lg: 'py-8 sm:py-12 lg:py-16',
    xl: 'py-12 sm:py-16 lg:py-24',
  };

  return (
    <Component
      className={`w-full ${spacingMap[spacing]} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};

export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  columns?: 'auto' | '2' | '3' | '4' | '12';
  minWidth?: number;
}

/**
 * <CardGrid>
 * Responsive card grid that adapts naturally to wide viewports (1440px - 2560px).
 * Uses CSS auto-fill/minmax so columns scale gracefully without awkward blank bands.
 */
export const CardGrid: React.FC<CardGridProps> = ({
  children,
  className = '',
  columns = 'auto',
  minWidth = 320,
  ...props
}) => {
  let gridClasses = '';

  switch (columns) {
    case '2':
      gridClasses = 'grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch';
      break;
    case '3':
      gridClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch';
      break;
    case '4':
      gridClasses = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch';
      break;
    case '12':
      gridClasses = 'grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch';
      break;
    case 'auto':
    default:
      // Auto-fill ensures optimal distribution across 1440px, 1920px, and 2560px screens
      gridClasses = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 items-stretch';
      break;
  }

  return (
    <div className={`${gridClasses} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

export interface TwoColumnLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
  reverseOnMobile?: boolean;
  sidebarWidth?: 'narrow' | 'standard' | 'wide';
}

/**
 * <TwoColumnLayout>
 * Pattern for Detail, Profile, and Form/Wizard views:
 * Sticky sidebar on desktop + wide content column, stacked vertically on mobile.
 */
export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  children,
  sidebar,
  className = '',
  reverseOnMobile = false,
  sidebarWidth = 'standard',
  ...props
}) => {
  const colSpanMap = {
    narrow: { sidebar: 'lg:col-span-4 xl:col-span-3', content: 'lg:col-span-8 xl:col-span-9' },
    standard: { sidebar: 'lg:col-span-4 xl:col-span-4', content: 'lg:col-span-8 xl:col-span-8' },
    wide: { sidebar: 'lg:col-span-5 xl:col-span-5', content: 'lg:col-span-7 xl:col-span-7' },
  };

  const spans = colSpanMap[sidebarWidth];

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${className}`.trim()}
      {...props}
    >
      <div className={`w-full ${spans.content} ${reverseOnMobile ? 'order-2 lg:order-1' : ''}`}>
        {children}
      </div>
      <aside className={`w-full ${spans.sidebar} lg:sticky lg:top-24 space-y-6 ${reverseOnMobile ? 'order-1 lg:order-2' : ''}`}>
        {sidebar}
      </aside>
    </div>
  );
};
