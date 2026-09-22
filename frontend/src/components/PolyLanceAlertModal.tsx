import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle, HelpCircle } from 'lucide-react';

export interface AlertModalOptions {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isDestructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface PolyLanceAlertModalProps {
  isOpen: boolean;
  options: AlertModalOptions | null;
  onClose: () => void;
}

export const PolyLanceAlertModal: React.FC<PolyLanceAlertModalProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (options?.onCancel) options.onCancel();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, options, onClose]);

  if (!isOpen || !options) return null;

  const type = options.type || 'info';

  const typeConfig = {
    error: {
      bgIcon: 'bg-rose-50 text-rose-600 border-rose-100',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
      icon: <AlertCircle size={22} />,
      title: options.title || 'Attention Required',
    },
    warning: {
      bgIcon: 'bg-amber-50 text-amber-600 border-amber-100',
      btn: options.isDestructive
        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
      icon: <AlertTriangle size={22} />,
      title: options.title || 'Confirm Action',
    },
    confirm: {
      bgIcon: options.isDestructive
        ? 'bg-rose-50 text-rose-600 border-rose-100'
        : 'bg-indigo-50 text-indigo-600 border-indigo-100',
      btn: options.isDestructive
        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
      icon: options.isDestructive ? <AlertTriangle size={22} /> : <HelpCircle size={22} />,
      title: options.title || 'Please Confirm',
    },
    success: {
      bgIcon: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      icon: <CheckCircle2 size={22} />,
      title: options.title || 'Success',
    },
    info: {
      bgIcon: 'bg-purple-50 text-purple-600 border-purple-100',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20',
      icon: <Info size={22} />,
      title: options.title || 'Information',
    },
  };

  const cfg = typeConfig[type];
  const isConfirmDialog = options.showCancel || type === 'confirm';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => {
            if (options.onCancel) options.onCancel();
            onClose();
          }}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${cfg.bgIcon}`}>
                {cfg.icon}
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-slate-900 leading-tight">
                  {cfg.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (options.onCancel) options.onCancel();
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pt-1">
            {options.message}
          </p>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            {isConfirmDialog && (
              <button
                type="button"
                onClick={() => {
                  if (options.onCancel) options.onCancel();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl font-bold font-sans text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                {options.cancelText || 'Cancel'}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (options.onConfirm) options.onConfirm();
                onClose();
              }}
              className={`px-5 py-2.5 rounded-xl font-bold font-sans text-xs transition-all shadow-md cursor-pointer ${cfg.btn}`}
            >
              {options.confirmText || (isConfirmDialog ? 'Confirm' : 'Got it')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
