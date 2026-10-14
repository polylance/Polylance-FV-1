import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, HelpCircle } from 'lucide-react';
import { scrollToSection } from '../utils/scroll';
import { Modal } from './overlay/Modal';
import { Button } from './common/Button';

export interface AlertModalOptions {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isDestructive?: boolean;
  targetSectionId?: string;
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
  if (!isOpen || !options) return null;

  const type = options.type || 'info';

  const typeConfig = {
    error: {
      icon: <AlertCircle size={18} className="text-[#991B1B]" />,
      title: options.title || 'Attention Required',
      btnVariant: 'danger' as const,
    },
    warning: {
      icon: <AlertTriangle size={18} className="text-[#0047AB]" />,
      title: options.title || 'Confirm Action',
      btnVariant: options.isDestructive ? ('danger' as const) : ('primary' as const),
    },
    confirm: {
      icon: options.isDestructive ? (
        <AlertTriangle size={18} className="text-[#991B1B]" />
      ) : (
        <HelpCircle size={18} className="text-[#0047AB]" />
      ),
      title: options.title || 'Please Confirm',
      btnVariant: options.isDestructive ? ('danger' as const) : ('primary' as const),
    },
    success: {
      icon: <CheckCircle2 size={18} className="text-[#0047AB]" />,
      title: options.title || 'Success',
      btnVariant: 'primary' as const,
    },
    info: {
      icon: <Info size={18} className="text-[#0047AB]" />,
      title: options.title || 'Information',
      btnVariant: 'primary' as const,
    },
  };

  const cfg = typeConfig[type];
  const isConfirmDialog = options.showCancel || type === 'confirm';

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    onClose();
  };

  const handleConfirm = () => {
    const targetId = options.targetSectionId;
    if (options.onConfirm) options.onConfirm();
    onClose();
    if (targetId) {
      scrollToSection(targetId, 160);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2">
          {cfg.icon}
          <span>{cfg.title}</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          {isConfirmDialog && (
            <Button variant="secondary" size="md" onClick={handleCancel}>
              {options.cancelText || 'Cancel'}
            </Button>
          )}
          <Button variant={cfg.btnVariant} size="md" onClick={handleConfirm}>
            {options.confirmText || (isConfirmDialog ? 'Confirm' : 'Got it')}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">
        {options.message}
      </div>
    </Modal>
  );
};

export default PolyLanceAlertModal;
