import React, { useRef } from 'react';
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
  const lastOptionsRef = useRef<AlertModalOptions | null>(options);
  if (options) {
    lastOptionsRef.current = options;
  }
  const currentOptions = options || lastOptionsRef.current;
  if (!currentOptions) return null;

  const type = currentOptions.type || 'info';

  const typeConfig = {
    error: {
      icon: <AlertCircle size={18} className="text-[#991B1B]" />,
      title: currentOptions.title || 'Attention Required',
      btnVariant: 'danger' as const,
    },
    warning: {
      icon: <AlertTriangle size={18} className="text-[#0047AB]" />,
      title: currentOptions.title || 'Confirm Action',
      btnVariant: currentOptions.isDestructive ? ('danger' as const) : ('primary' as const),
    },
    confirm: {
      icon: currentOptions.isDestructive ? (
        <AlertTriangle size={18} className="text-[#991B1B]" />
      ) : (
        <HelpCircle size={18} className="text-[#0047AB]" />
      ),
      title: currentOptions.title || 'Please Confirm',
      btnVariant: currentOptions.isDestructive ? ('danger' as const) : ('primary' as const),
    },
    success: {
      icon: <CheckCircle2 size={18} className="text-[#0047AB]" />,
      title: currentOptions.title || 'Success',
      btnVariant: 'primary' as const,
    },
    info: {
      icon: <Info size={18} className="text-[#0047AB]" />,
      title: currentOptions.title || 'Information',
      btnVariant: 'primary' as const,
    },
  };

  const cfg = typeConfig[type];
  const isConfirmDialog = currentOptions.showCancel || type === 'confirm';

  const handleCancel = () => {
    if (currentOptions.onCancel) currentOptions.onCancel();
    onClose();
  };

  const handleConfirm = () => {
    const targetId = currentOptions.targetSectionId;
    if (currentOptions.onConfirm) currentOptions.onConfirm();
    onClose();
    if (targetId) {
      scrollToSection(targetId, 160);
    }
  };

  return (
    <Modal
      isOpen={isOpen && Boolean(options)}
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
              {currentOptions.cancelText || 'Cancel'}
            </Button>
          )}
          <Button variant={cfg.btnVariant} size="md" onClick={handleConfirm}>
            {currentOptions.confirmText || (isConfirmDialog ? 'Confirm' : 'Got it')}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">
        {currentOptions.message}
      </div>
    </Modal>
  );
};

export default PolyLanceAlertModal;
