import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { OverlayPortal } from './OverlayRoot';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  disableDismiss?: boolean;
  isPending?: boolean;
}

const maxWidthClassMap = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[520px]',
  lg: 'sm:max-w-[720px]',
  xl: 'sm:max-w-[960px]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  subtitle,
  children,
  footer,
  maxWidth,
  size = 'md',
  className = '',
  disableDismiss = false,
  isPending = false,
}) => {
  const effectiveMaxWidth = maxWidth || size || 'md';
  const effectiveDesc = subtitle || description;
  const titleId = useId();
  const descId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    // Background scroll lock without layout shift
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Auto-focus input field or container (never header close button)
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const autoFocused = modalRef.current.querySelector<HTMLElement>('[autofocus], [data-autofocus]');
        if (autoFocused) {
          autoFocused.focus();
          return;
        }

        const inputField = modalRef.current.querySelector<HTMLElement>(
          'textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled])'
        );
        if (inputField) {
          inputField.focus();
          return;
        }

        modalRef.current.focus();
      }
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!disableDismiss && !isPending) {
          e.preventDefault();
          onClose();
        }
      } else if (e.key === 'Tab') {
        // Trap focus inside modal
        if (!modalRef.current) return;
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === 'function') {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, onClose, disableDismiss, isPending]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disableDismiss && !isPending) {
      onClose();
    }
  };

  return (
    <OverlayPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className="fixed inset-0 z-[400] h-[100dvh] w-screen flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden"
      >
        {/* Flat backdrop (NO blur, rgba(11,11,15,0.48)) */}
        <div
          onClick={handleBackdropClick}
          aria-hidden="true"
          className="fixed inset-0 bg-[#0B0B0F]/48 transition-opacity cursor-pointer"
        />

        {/* Modal Dialog Card (Mobile Bottom Sheet / Desktop Centered) */}
        <div
          ref={modalRef}
          tabIndex={-1}
          data-lenis-prevent="true"
          className={`relative w-full ${maxWidthClassMap[effectiveMaxWidth]} bg-white rounded-t-[16px] sm:rounded-[16px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(11,11,15,0.12)] z-10 flex flex-col min-h-0 max-h-[90dvh] sm:max-h-[calc(100dvh-48px)] overflow-hidden outline-none animate-in fade-in-0 zoom-in-98 duration-200 ${className}`}
        >
          {/* Mobile Sheet Grab Handle */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
            <span className="w-10 h-1 rounded-full bg-[#E5E7EB]" />
          </div>

          {/* Sticky Header */}
          {(title || Boolean(onClose)) && (
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[16px] shrink-0">
              <div className="pr-3 min-w-0">
                {title && (
                  <h3
                    id={titleId}
                    className="text-lg font-semibold text-[#0B0B0F] tracking-tight leading-snug truncate"
                  >
                    {title}
                  </h3>
                )}
                {effectiveDesc && (
                  <div id={descId} className="text-xs text-[#6B7280] mt-0.5">
                    {effectiveDesc}
                  </div>
                )}
              </div>
              {onClose && !isPending && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-[8px] text-[#4B5563] hover:text-[#0B0B0F] hover:bg-[#F6F7F9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] shrink-0 cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Scrollable Body with overscroll containment */}
          <div
            data-lenis-prevent="true"
            className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 min-h-0 text-sm text-[#374151]"
          >
            {children}
          </div>

          {/* Optional Sticky Footer */}
          {footer && (
            <div className="sticky bottom-0 z-10 px-5 sm:px-6 py-3.5 border-t border-[#E5E7EB] bg-white rounded-b-[16px] flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}

          {isPending && (
            <div className="px-5 py-2 bg-[#F6F7F9] border-t border-[#E5E7EB] text-center text-xs text-[#0047AB] font-medium">
              Waiting for your wallet confirmation...
            </div>
          )}
        </div>
      </div>
    </OverlayPortal>
  );
};

export default Modal;
