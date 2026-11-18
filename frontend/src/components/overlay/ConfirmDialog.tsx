import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requiredTypedText?: string;
  isPending?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  requiredTypedText,
  isPending = false,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const dismiss = onCancel || onClose || (() => {});

  const canConfirm = !requiredTypedText || typedInput.trim() === requiredTypedText;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      setTypedInput('');
    }
  };

  const handleCancel = () => {
    setTypedInput('');
    dismiss();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      maxWidth="sm"
      isPending={isPending}
      footer={
        <div className="flex items-center gap-2.5 w-full justify-end">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            size="md"
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[#4B5563] leading-relaxed">{description}</p>

        {requiredTypedText && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs text-[#6B7280]">
              To confirm, type <strong className="font-semibold text-[#0B0B0F] select-all">{requiredTypedText}</strong> below:
            </label>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={`Type "${requiredTypedText}"`}
              className="w-full h-11 px-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm text-[#0B0B0F] focus:outline-none focus:border-[#0047AB] focus:ring-1 focus:ring-[#0047AB]"
              disabled={isPending}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
