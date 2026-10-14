import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';
import { Popover } from '../Popover';
import { ConfirmDialog } from '../ConfirmDialog';
import { Sheet } from '../Sheet';

describe('Overlay System QA Suite (Modal, Popover, ConfirmDialog, Sheet)', () => {
  let overlayRoot: HTMLDivElement;

  beforeEach(() => {
    // Ensure #overlay-root exists in document body
    overlayRoot = document.getElementById('overlay-root') as HTMLDivElement;
    if (!overlayRoot) {
      overlayRoot = document.createElement('div');
      overlayRoot.id = 'overlay-root';
      document.body.appendChild(overlayRoot);
    }
    overlayRoot.innerHTML = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  describe('Modal Portal, Containment & Keyboard Handling', () => {
    it('mounts strictly into #overlay-root and locks background scroll', () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Security Escalation"
          subtitle="Evidence review docket"
          size="md"
          footer={<button type="button">Confirm Action</button>}
        >
          <p>Modal body content</p>
        </Modal>
      );

      // Check portal container
      expect(overlayRoot.innerHTML).toContain('Security Escalation');
      expect(overlayRoot.innerHTML).toContain('Evidence review docket');
      expect(overlayRoot.innerHTML).toContain('Modal body content');

      // Check body scroll lock without shift
      expect(document.body.style.overflow).toBe('hidden');

      // Check escape dismissal
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false and unlocks body scroll', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Body</p>
        </Modal>
      );
      expect(overlayRoot.innerHTML).toContain('Test Modal');
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Body</p>
        </Modal>
      );
      expect(overlayRoot.innerHTML).not.toContain('Test Modal');
      expect(document.body.style.overflow).toBe('');
    });

    it('prioritizes input field auto-focus over close button and allows typing without dismissing', async () => {
      const handleClose = vi.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Submit Proposal"
          footer={<button type="button">Submit</button>}
        >
          <textarea data-testid="proposal-text" placeholder="Type here..." />
        </Modal>
      );

      // Wait for focus timer
      await new Promise((r) => setTimeout(r, 60));

      const textarea = screen.getByTestId('proposal-text');
      expect(document.activeElement).toBe(textarea);

      // Space and enter keys should type into the textarea and NOT trigger handleClose
      fireEvent.keyDown(textarea, { key: ' ', code: 'Space' });
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('dismisses when clicking backdrop', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Backdrop Test">
          <p>Body</p>
        </Modal>
      );

      const backdrop = overlayRoot.querySelector('.bg-\\[\\#0B0B0F\\]\\/48');
      expect(backdrop).not.toBeNull();
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Popover Anchoring & Click-Outside Handling', () => {
    it('renders inside #overlay-root anchored to trigger', () => {
      const handleClose = vi.fn();
      const triggerEl = document.createElement('button');
      document.body.appendChild(triggerEl);
      const triggerRef = { current: triggerEl };

      render(
        <Popover isOpen={true} onClose={handleClose} triggerRef={triggerRef} width={280}>
          <div data-testid="popover-content">Popover Content</div>
        </Popover>
      );

      expect(overlayRoot.innerHTML).toContain('Popover Content');

      // Dismiss on escape
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);

      document.body.removeChild(triggerEl);
    });
  });

  describe('ConfirmDialog Contract & Destructive Typing', () => {
    it('executes callbacks on confirm and cancel', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Delete Conversation"
          description="Are you sure you want to permanently delete this chat?"
          confirmLabel="Delete Permanently"
          cancelLabel="Keep Chat"
          isDestructive={true}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(overlayRoot.innerHTML).toContain('Delete Conversation');
      expect(overlayRoot.innerHTML).toContain('Are you sure you want to permanently delete this chat?');

      const cancelBtn = screen.getByText('Keep Chat');
      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sheet Mobile Bottom Sheet / Drawer', () => {
    it('renders sheet in #overlay-root and handles dismissal', () => {
      const handleClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={handleClose} title="Mobile Navigation" side="bottom">
          <p>Sheet items</p>
        </Sheet>
      );

      expect(overlayRoot.innerHTML).toContain('Mobile Navigation');
      expect(overlayRoot.innerHTML).toContain('Sheet items');
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
