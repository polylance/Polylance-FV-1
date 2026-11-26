import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useReducedMotion } from '../../media/useDataSaver';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Pure CSS/WAAPI BottomSheet drawer for mobile workflows.
 * Zero framer-motion dependency, Escape dismissal, and reduced-motion compliant.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    const el = panelRef.current;
    if (el && !reducedMotion && typeof el.animate === 'function') {
      el.animate(
        [
          { opacity: 0, transform: 'translateY(16px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
      );
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, reducedMotion]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B0B0C]/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[600px] bg-white border-t-2 border-x-2 border-[#0B0B0C] rounded-t-[14px] max-h-[85dvh] flex flex-col overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E5EA] shrink-0">
          <div className="w-10 h-1 bg-[#E2E5EA] rounded-full sm:hidden mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
          <div className="text-[16px] font-bold text-[#0B0B0C]">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="w-9 h-9 rounded-[8px] border border-[#E2E5EA] flex items-center justify-center text-[#0B0B0C] hover:bg-[#F5F6F8] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
};

export default BottomSheet;
