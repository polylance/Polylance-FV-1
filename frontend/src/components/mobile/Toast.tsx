import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type ToastType = 'success' | 'error' | 'info' | 'pending';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, defaults to 4000
}

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  className?: string;
}

export const ToastContainer: React.FC<ToastProps> = ({
  toasts,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className={`fixed z-50 bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 flex flex-col gap-2.5 pointer-events-none pb-safe ${className}`}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const duration = toast.duration ?? (toast.type === 'pending' ? 0 : 4000);

  useEffect(() => {
    if (duration === 0 || isPaused) return;

    timerRef.current = window.setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, duration, isPaused, onDismiss]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 60 || info.offset.y > 40) {
      onDismiss(toast.id);
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/95';
      case 'error':
        return 'border-rose-200 bg-rose-50/95';
      case 'pending':
        return 'border-blue-200 bg-blue-50/95';
      case 'info':
      default:
        return 'border-blue-100 bg-white/95';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ duration: prefersReducedMotion ? 0.05 : 0.2 }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className={`pointer-events-auto w-full p-4 rounded-2xl border shadow-lg backdrop-blur-md flex items-start gap-3 select-none touch-manipulation ${getBorderColor()}`}
    >
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 leading-tight">{toast.title}</div>
        {toast.message && (
          <div className="text-xs text-slate-600 mt-1 leading-normal break-words">{toast.message}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 -mr-1 -mt-1 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg active:bg-slate-200/50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};
