import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'left' | 'right';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  className = '',
}) => {
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Close automatically on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Escape key listener
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

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe in direction of exit to close
    if (side === 'right' && (info.offset.x > 80 || info.velocity.x > 300)) {
      onClose();
    } else if (side === 'left' && (info.offset.x < -80 || info.velocity.x < -300)) {
      onClose();
    }
  };

  const initialX = side === 'right' ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex lg:hidden pointer-events-auto"
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

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={{ x: initialX }}
            animate={{ x: 0 }}
            exit={{ x: initialX }}
            transition={{
              type: prefersReducedMotion ? 'tween' : 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`relative z-10 w-[85vw] max-w-sm h-[100dvh] bg-white shadow-2xl flex flex-col pt-safe pb-safe ml-auto ${
              side === 'left' ? 'mr-auto ml-0' : ''
            } ${className}`}
          >
            {/* Header with visible close button */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="font-bold text-lg text-slate-900 truncate">
                {title || 'Navigation'}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content with Staggered Entrance */}
            <motion.div
              initial="closed"
              animate="open"
              variants={{
                open: {
                  transition: { staggerChildren: prefersReducedMotion ? 0 : 0.05, delayChildren: 0.1 },
                },
                closed: {},
              }}
              className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 space-y-4"
            >
              {children}
            </motion.div>

            {/* Pinned Bottom CTA / Footer */}
            {footer && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
