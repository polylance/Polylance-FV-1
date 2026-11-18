import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { OverlayPortal } from './OverlayRoot';
import { pauseLenis, resumeLenis } from '../../hooks/useSmoothScroll';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  backdropVariants,
  bottomSheetVariants,
  sideDrawerVariants,
  reducedMotionVariants,
} from '../../styles/popupMotion';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  side?: 'bottom' | 'right';
  className?: string;
  onExitComplete?: () => void;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'bottom',
  className = '',
  onExitComplete,
}) => {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    pauseLenis();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      resumeLenis();
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus?.();
    };
  }, [isOpen, onClose]);

  const isBottom = side === 'bottom';
  const sheetVariants = prefersReducedMotion
    ? reducedMotionVariants
    : isBottom
    ? bottomSheetVariants
    : sideDrawerVariants(side as 'left' | 'right');

  return (
    <OverlayPortal>
      <AnimatePresence
        onExitComplete={() => {
          if (onExitComplete) onExitComplete();
        }}
      >
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[300] h-[100dvh] w-screen flex justify-end items-end overflow-hidden"
          >
            {/* Backdrop */}
            <motion.div
              variants={prefersReducedMotion ? reducedMotionVariants : backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={onClose}
              aria-hidden="true"
              className="fixed inset-0 bg-[#0B0B0F]/48 cursor-pointer"
            />

            {/* Sheet / Drawer Container */}
            <motion.div
              data-lenis-prevent="true"
              variants={sheetVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className={`relative z-10 bg-white flex flex-col min-h-0 overflow-hidden border-[#E5E7EB] shadow-[0_8px_24px_rgba(11,11,15,0.12)] ${
                isBottom
                  ? 'w-full max-h-[90dvh] rounded-t-[16px] border-t pb-[env(safe-area-inset-bottom,16px)]'
                  : 'w-full max-w-[420px] h-full rounded-l-[16px] border-l'
              } ${className}`}
            >
              {isBottom && (
                <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                  <span className="w-10 h-1 rounded-full bg-[#E5E7EB]" />
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] shrink-0">
                {title ? (
                  <h3 className="text-base font-semibold text-[#0B0B0F] tracking-tight">{title}</h3>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#4B5563] hover:text-[#0B0B0F] hover:bg-[#F6F7F9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] cursor-pointer"
                  aria-label="Close sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div
                data-lenis-prevent="true"
                className="p-5 overflow-y-auto overscroll-contain flex-1 min-h-0 text-sm text-[#374151] custom-scrollbar"
              >
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  );
};

export default Sheet;
