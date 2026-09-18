import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface CarouselProps {
  children: React.ReactNode[];
  peek?: boolean;
  showDots?: boolean;
  className?: string;
  itemClassName?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  peek = true,
  showDots = true,
  className = '',
  itemClassName = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const itemCount = React.Children.count(children);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const newIndex = Math.round(scrollLeft / (clientWidth * 0.85));
    setActiveIndex(Math.min(Math.max(0, newIndex), itemCount - 1));
  }, [itemCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const childNode = scrollRef.current.children[index] as HTMLElement | undefined;
    if (childNode) {
      childNode.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = Math.min(activeIndex + 1, itemCount - 1);
      scrollToIndex(next);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = Math.max(activeIndex - 1, 0);
      scrollToIndex(prev);
    }
  };

  return (
    <div className={`w-full flex flex-col ${className}`} onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Content Carousel">
      {/* Scrollable Track */}
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-4 gap-3.5 focus:outline-none ${
          peek ? 'pr-12' : ''
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {React.Children.map(children, (child, idx) => (
          <div
            key={idx}
            className={`snap-center shrink-0 w-[85vw] max-w-[340px] sm:max-w-md ${itemClassName}`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      {showDots && itemCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2" aria-hidden="true">
          {Array.from({ length: itemCount }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'w-6 bg-blue-600'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
