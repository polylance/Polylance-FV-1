import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxHeight?: string | number;
  height?: string | number;
  maxWidth?: string | number;
  width?: string | number;
  orientation?: 'vertical' | 'horizontal' | 'both';
  fadeShadows?: boolean;
  className?: string;
  viewportClassName?: string;
  tabIndex?: number;
  role?: string;
  ariaLabel?: string;
}

/**
 * Universal, Lenis-safe ScrollArea Primitive for PolyLance
 * - Automatically opts out of Lenis smooth-scroll interference via `data-lenis-prevent`.
 * - Prevents wheel scroll chaining to body via `overscroll-contain`.
 * - Includes `min-h-0` / `min-w-0` to guarantee nested flex/grid scrollability.
 * - Keyboard navigable and accessible with customizable fade shadows.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      children,
      maxHeight,
      height,
      maxWidth,
      width,
      orientation = 'vertical',
      fadeShadows = false,
      className = '',
      viewportClassName = '',
      tabIndex = 0,
      role = 'region',
      ariaLabel = 'Scrollable content',
      onScroll,
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = (forwardedRef as React.RefObject<HTMLDivElement>) || internalRef;

    const [canScrollTop, setCanScrollTop] = useState(false);
    const [canScrollBottom, setCanScrollBottom] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollIndicators = useCallback(() => {
      const el = scrollContainerRef.current;
      if (!el || !fadeShadows) return;

      const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollTop(scrollTop > 4);
      setCanScrollBottom(scrollTop + clientHeight < scrollHeight - 4);
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }, [fadeShadows, scrollContainerRef]);

    useEffect(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      updateScrollIndicators();
      const observer = new ResizeObserver(() => updateScrollIndicators());
      observer.observe(el);

      return () => observer.disconnect();
    }, [updateScrollIndicators, scrollContainerRef, children]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      updateScrollIndicators();
      if (onScroll) onScroll(e);
    };

    // Determine overflow classes based on orientation
    let overflowClasses = 'overflow-y-auto overflow-x-hidden';
    if (orientation === 'horizontal') {
      overflowClasses = 'overflow-x-auto overflow-y-hidden';
    } else if (orientation === 'both') {
      overflowClasses = 'overflow-auto';
    }

    const containerStyle: React.CSSProperties = {
      ...(maxHeight !== undefined ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : {}),
      ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
      ...(maxWidth !== undefined ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : {}),
      ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
      WebkitOverflowScrolling: 'touch',
    };

    return (
      <div className={`relative flex flex-col min-h-0 min-w-0 ${className}`}>
        {/* Top Fade Shadow */}
        {fadeShadows && orientation !== 'horizontal' && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 transition-opacity duration-200 ${
              canScrollTop ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Left Fade Shadow */}
        {fadeShadows && orientation !== 'vertical' && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-white to-transparent z-10 transition-opacity duration-200 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Main Scrollable Viewport */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          tabIndex={tabIndex}
          role={role}
          aria-label={ariaLabel}
          onScroll={handleScroll}
          style={containerStyle}
          className={`flex-1 min-h-0 min-w-0 overscroll-contain custom-scrollbar focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0047AB]/40 ${overflowClasses} ${viewportClassName}`}
          {...rest}
        >
          {children}
        </div>

        {/* Bottom Fade Shadow */}
        {fadeShadows && orientation !== 'horizontal' && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 transition-opacity duration-200 ${
              canScrollBottom ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Right Fade Shadow */}
        {fadeShadows && orientation !== 'vertical' && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l from-white to-transparent z-10 transition-opacity duration-200 ${
              canScrollRight ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
