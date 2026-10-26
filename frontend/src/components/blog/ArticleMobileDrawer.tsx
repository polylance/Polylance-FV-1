import React, { useEffect, useRef } from 'react';
import { X, List } from 'lucide-react';
import { BlogToc } from './BlogToc';

interface ArticleMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articleRef: React.RefObject<HTMLElement | null>;
}

export const ArticleMobileDrawer: React.FC<ArticleMobileDrawerProps> = ({
  isOpen,
  onClose,
  articleRef,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Restore body scroll when closed or unmounted
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Focus close button on open
      setTimeout(() => closeButtonRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Table of contents"
      className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Card */}
      <div
        ref={drawerRef}
        className="relative bg-white rounded-t-3xl border-t border-[#E2E6EC] shadow-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 z-10"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <List size={16} className="text-[#0047AB]" />
            <h2 className="text-sm font-bold text-[#0B0B0F]">Table of Contents</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close table of contents drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="overflow-y-auto p-4 px-5">
          <BlogToc
            articleRef={articleRef}
            collapsible={false}
            hideBackToTop={true}
            onItemClick={() => onClose()}
            className="border-0 shadow-none p-0"
          />
        </div>
      </div>
    </div>
  );
};
