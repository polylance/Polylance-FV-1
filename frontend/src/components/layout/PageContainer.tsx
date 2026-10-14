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
    <Component className={`w-full max-w-[1280px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8 sm:pb-12 ${className}`}>
      {children}
    </Component>
  );
};

export default PageContainer;
