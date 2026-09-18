import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  snapPoints?: ('half' | 'full')[];
  initialSnap?: 'half' | 'full';
  className?: string;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = ['half', 'full'],
  initialSnap = 'half',
  className = '',
  showHandle = true,
}) => {
  const [currentSnap, setCurrentSnap] = useState<'half' | 'full'>(initialSnap);
  const sheetRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Handle body scroll lock while maintaining scroll position
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset snap point on open
  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(initialSnap);
    }
  }, [isOpen, initialSnap]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offsetThreshold = 100;
      const velocityThreshold = 400;

      // Swipe down to dismiss
      if (info.offset.y > offsetThreshold || info.velocity.y > velocityThreshold) {
        onClose();
        return;
      }

      // Swipe up to expand to full if allowed
      if (
        (info.offset.y < -offsetThreshold || info.velocity.y < -velocityThreshold) &&
        snapPoints.includes('full')
      ) {
        setCurrentSnap('full');
        return;
      }

      // Default back to half if dragged down slightly
      if (currentSnap === 'full' && info.offset.y > 60 && snapPoints.includes('half')) {
        setCurrentSnap('half');
      }
    },
    [onClose, snapPoints, currentSnap]
  );

  const heightClass = currentSnap === 'full' ? 'h-[92dvh]' : 'max-h-[85dvh] min-h-[40dvh]';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden pointer-events-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: prefersReducedMotion ? 'tween' : 'spring',
              damping: 30,
              stiffness: 320,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.7 }}
            onDragEnd={handleDragEnd}
            className={`relative z-10 w-full bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl flex flex-col overflow-hidden pb-safe ${heightClass} ${className}`}
          >
            {/* Grab Handle Header */}
            {showHandle && (
              <div className="w-full flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>
            )}

            {/* Title / Action Header */}
            {title && (
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-base font-semibold text-slate-900 truncate">
                  {title}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close bottom sheet"
                  className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 active:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
