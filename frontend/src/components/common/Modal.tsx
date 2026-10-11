import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
    >
      {/* Neutral backdrop */}
      <div
        className="fixed inset-0 bg-[#0B0B0F]/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Mobile Bottom Sheet / Desktop Centered) */}
      <div
        className={`relative w-full ${maxWidthMap[maxWidth]} bg-white rounded-t-[16px] sm:rounded-[12px] border-t sm:border border-[#E5E7EB] shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-10 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] ${className}`}
      >
        {(title || Boolean(onClose)) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] shrink-0">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-[#0B0B0F]">{title}</h3>
              )}
              {description && (
                <p className="text-xs text-[#4B5563] mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#4B5563] hover:text-[#0B0B0F] p-1.5 rounded-[8px] hover:bg-[#F6F7F9] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
