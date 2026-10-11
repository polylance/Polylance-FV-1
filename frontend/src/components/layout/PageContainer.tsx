import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  as: Component = 'div'
}) => {
  return (
    <Component className={`w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 ${className}`}>
      {children}
    </Component>
  );
};

export default PageContainer;
