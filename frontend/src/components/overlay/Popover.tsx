import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OverlayPortal } from './OverlayRoot';

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  width?: number | string;
  className?: string;
  align?: 'start' | 'center' | 'end';
  offset?: number;
}

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  width = 380,
  className = '',
  align = 'end',
  offset = 8,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; maxHeight: number }>({
    top: 0,
    left: 0,
    maxHeight: 480,
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const availableBelow = viewportHeight - triggerRect.bottom - offset - 16;
    const availableAbove = triggerRect.top - offset - 16;

    let placeBelow = true;
    let computedMaxHeight = Math.min(480, availableBelow);

    if (availableBelow < 200 && availableAbove > availableBelow) {
      placeBelow = false;
      computedMaxHeight = Math.min(480, availableAbove);
    }

    const top = placeBelow ? triggerRect.bottom + offset : triggerRect.top - offset - computedMaxHeight;

    let popoverWidth = typeof width === 'number' ? width : 380;
    if (viewportWidth < popoverWidth + 32) {
      popoverWidth = viewportWidth - 32;
    }

    let left = triggerRect.left;
    if (align === 'end') {
      left = triggerRect.right - popoverWidth;
    } else if (align === 'center') {
      left = triggerRect.left + (triggerRect.width - popoverWidth) / 2;
    }

    // Clamp horizontally within viewport
    if (left + popoverWidth > viewportWidth - 16) {
      left = viewportWidth - popoverWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    setCoords({
      top: Math.max(16, top),
      left,
      maxHeight: Math.max(160, computedMaxHeight),
    });
  }, [triggerRef, offset, align, width]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, updatePosition, triggerRef]);

  if (!isOpen) return null;

  return (
    <OverlayPortal>
      <div
        ref={popoverRef}
        role="region"
        aria-label="Popover panel"
        data-lenis-prevent="true"
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          width: typeof width === 'number' ? `${width}px` : width,
          maxHeight: `${coords.maxHeight}px`,
          zIndex: 200,
        }}
        className={`bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(11,11,15,0.12)] flex flex-col overflow-hidden outline-none animate-in fade-in-0 duration-150 ${className}`}
      >
        {children}
      </div>
    </OverlayPortal>
  );
};

export default Popover;
