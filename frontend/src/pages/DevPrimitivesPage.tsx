import React, { useState, useRef } from 'react';
import {
  BottomSheet,
  Drawer,
  Carousel,
  Accordion,
  Skeleton,
  ToastContainer,
  ToastMessage,
  PressableCard,
} from '../components/mobile';
import { Modal, Popover, ConfirmDialog, Sheet } from '../components/overlay';
import { Tooltip } from '../components/common/Tooltip';
import { ActionStatusModal } from '../components/ActionStatusModal';
import { TransactionTracker, TxTrackerStep } from '../components/common/TransactionTracker';

export const DevPrimitivesPage: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNestedConfirmOpen, setIsNestedConfirmOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isActionStatusOpen, setIsActionStatusOpen] = useState(false);
  const [isTxTrackerOpen, setIsTxTrackerOpen] = useState(false);
  const [txStep, setTxStep] = useState<TxTrackerStep>('WALLET_SIGN');
  const popoverBtnRef = useRef<HTMLButtonElement>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'pending') => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title: `${type.toUpperCase()} Notification`,
      message: `Tested mobile toast feedback at ${new Date().toLocaleTimeString()}.`,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const accordionItems = [
    {
      title: 'Smart Contract Escrows',
      content: 'Funds locked in immutable Polygon smart contracts until milestone conditions are mathematically met.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: 'GitHub Skill Attestations',
      content: 'Cryptographic proof of engineering competencies minted directly into soulbound ERC-5192 tokens.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Decentralized Arbitration',
      content: 'Crowd-staked judges resolve disputed deliverables with automated token slashing mechanics.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-10 pb-28">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          Mobile Primitives Test Harness
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Mobile UI Primitives</h1>
        <p className="text-sm text-slate-500 mt-1">
          Interactive showcase for all 7 Phase 2 mobile primitives.
        </p>
      </div>

      {/* 0. Unified Animated Popups & Overlays Test Suite */}
      <section className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Unified Animated Popup QA Suite</h2>
            <p className="text-xs text-slate-500">
              Test spring modals, mobile bottom sheets, popovers, nested dimming, status popups, and tooltips.
            </p>
          </div>
          <Tooltip content="Tooltip renders with smooth fade & 2px offset">
            <span className="text-xs font-mono font-bold text-[#0047AB] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg cursor-help">
              Hover Tooltip
            </span>
          </Tooltip>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            id="demo-modal-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2.5 bg-[#0047AB] hover:bg-[#003882] text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            Modal + Nested
          </button>

          <button
            ref={popoverBtnRef}
            type="button"
            id="demo-popover-btn"
            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            Toggle Popover
          </button>

          <button
            type="button"
            id="demo-status-btn"
            onClick={() => setIsActionStatusOpen(true)}
            className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            Status / Progress
          </button>

          <button
            type="button"
            id="demo-txtracker-btn"
            onClick={() => setIsTxTrackerOpen(true)}
            className="px-3 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer"
          >
            Tx Tracker States
          </button>
        </div>
      </section>

      {/* 1. BottomSheet & Drawer Triggers */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800">1 & 2. Overlays (BottomSheet & Drawer)</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="w-full min-h-[48px] px-4 py-3 bg-blue-600 active:bg-blue-700 text-white font-medium rounded-xl text-sm shadow-sm flex items-center justify-center gap-2"
          >
            <span>Open BottomSheet</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-full min-h-[48px] px-4 py-3 bg-slate-900 active:bg-slate-800 text-white font-medium rounded-xl text-sm shadow-sm flex items-center justify-center gap-2"
          >
            <span>Open Drawer</span>
          </button>
        </div>
      </section>

      {/* 3. Carousel */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-800">3. CSS Scroll-Snap Carousel</h2>
        <Carousel peek showDots>
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between h-44"
            >
              <div>
                <span className="text-xs font-bold text-blue-600">Card #{item}</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Milestone #{item} Escrow</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Card with scroll snap and dot indicators.
                </p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-blue-200/40">
                <span className="text-xs font-mono font-bold text-slate-900">500.00 POL</span>
                <span className="text-xs font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      {/* 4. Accordion */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-800">4. Accessible Accordion</h2>
        <Accordion items={accordionItems} defaultExpandedIndex={0} />
      </section>

      {/* 5. Skeletons */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-800">5. CLS-Free Skeletons</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="avatar" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="40%" height={12} />
            </div>
          </div>
          <Skeleton variant="card" />
        </div>
      </section>

      {/* 6. Toasts */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-800">6. Mobile Stacking Toasts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => addToast('success')}
            className="min-h-[44px] px-3 py-2 bg-emerald-100 text-emerald-800 font-medium text-xs rounded-xl"
          >
            + Success
          </button>
          <button
            type="button"
            onClick={() => addToast('error')}
            className="min-h-[44px] px-3 py-2 bg-rose-100 text-rose-800 font-medium text-xs rounded-xl"
          >
            + Error
          </button>
          <button
            type="button"
            onClick={() => addToast('pending')}
            className="min-h-[44px] px-3 py-2 bg-blue-100 text-blue-800 font-medium text-xs rounded-xl"
          >
            + Pending
          </button>
          <button
            type="button"
            onClick={() => addToast('info')}
            className="min-h-[44px] px-3 py-2 bg-slate-100 text-slate-800 font-medium text-xs rounded-xl"
          >
            + Info
          </button>
        </div>
      </section>

      {/* 7. PressableCard */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-800">7. PressableCard (Active Feedback)</h2>
        <PressableCard onClick={() => addToast('info')}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Tappable Escrow Card</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Press down to see tactile scale-down response.
              </p>
            </div>
            <span className="text-blue-600 text-xs font-semibold">Tap Me &rarr;</span>
          </div>
        </PressableCard>
      </section>

      {/* Overlay Instances */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Escrow Milestone Details"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            This bottom sheet slides up with spring physics, handles swipe gestures down to dismiss, locks background scrolling, and is padded for iPhone safe areas.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Deposited Amount:</span>
              <span className="font-bold text-slate-900">1,250.00 POL</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Smart Contract:</span>
              <span className="font-mono text-slate-700">0x742d...44e</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSheetOpen(false)}
            className="w-full min-h-[48px] bg-blue-600 text-white font-medium rounded-xl text-sm"
          >
            Confirm & Close
          </button>
        </div>
      </BottomSheet>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Protocol Navigation"
        footer={
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="w-full min-h-[48px] bg-blue-600 text-white font-medium rounded-xl text-sm"
          >
            Connect Wallet
          </button>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-900">
            Explore Jobs
          </div>
          <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-900">
            Escrow Dashboard
          </div>
          <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-900">
            Decentralized Arbitration
          </div>
          <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-900">
            Soulbound Reputation
          </div>
        </div>
      </Drawer>

      {/* Test Modal (Supports Desktop Centered / Mobile Bottom Sheet and Nested Modal Dimming) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Primary Animated Modal"
        subtitle="Desktop shows centered spring dialog; mobile (<640px) shows bottom sheet."
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              id="open-nested-confirm-btn"
              onClick={() => setIsNestedConfirmOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
            >
              Open Nested Confirm Dialog
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#0047AB] text-white text-xs font-bold hover:bg-[#003882] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This dialog animates with soft spring physics (stiffness 320, damping 30). Try rapid opening/closing or opening a nested confirm dialog to verify lower modal dimming and top-only Escape dismissal.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-mono text-slate-500">Auto-focus input check:</span>
            <input
              type="text"
              placeholder="Type test value here..."
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-[#0047AB]"
            />
          </div>
        </div>
      </Modal>

      {/* Nested Confirm Dialog */}
      <ConfirmDialog
        isOpen={isNestedConfirmOpen}
        onClose={() => setIsNestedConfirmOpen(false)}
        onConfirm={() => setIsNestedConfirmOpen(false)}
        title="Nested Confirmation Action"
        description="Notice how the parent modal underneath dims and scales to 0.98. Pressing Escape closes ONLY this confirm dialog, keeping the parent open."
        confirmLabel="Acknowledge"
        cancelLabel="Back"
        isDestructive={false}
      />

      {/* Popover anchored to trigger button */}
      <Popover
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        triggerRef={popoverBtnRef}
        width={320}
      >
        <div className="p-4 space-y-3">
          <div className="font-bold text-sm text-slate-900">Animated Popover Panel</div>
          <p className="text-xs text-slate-600">
            Scale (0.97 → 1) and translateY (4px → 0) with dynamic transform-origin anchored to the trigger position.
          </p>
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsPopoverOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      </Popover>

      {/* ActionStatusModal for 'Project Status Updated' test */}
      <ActionStatusModal
        isOpen={isActionStatusOpen}
        onClose={() => setIsActionStatusOpen(false)}
        title="Project Status Updated"
        subtitle='Milestone progress for "Polygon DeFi Architecture" has been updated to 100%.'
        icon="progress"
        badgeText="100% PROGRESS"
        details={[
          { label: 'PROGRESS PERCENTAGE', value: '100%', isBadge: true },
          { label: 'STATUS NOTE', value: 'Completed smart contract test suite and gas optimization benchmarks.' },
          { label: 'NEXT STEP', value: 'Waiting for the client to review your submission.' },
          { label: 'CONTRACT', value: '0x742d...44e', isMono: true },
        ]}
        primaryActionText="View Updates"
        onPrimaryAction={() => setIsActionStatusOpen(false)}
      />

      {/* Transaction Tracker modal test */}
      <Modal
        isOpen={isTxTrackerOpen}
        onClose={() => setIsTxTrackerOpen(false)}
        title="Polygon Escrow Transaction Tracker"
        subtitle="Test 160ms state transitions with zero container layout jumping."
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-1.5">
              {(['WALLET_SIGN', 'SUBMITTED', 'CONFIRMING', 'CONFIRMED'] as TxTrackerStep[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTxStep(s)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition ${
                    txStep === s ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsTxTrackerOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Done
            </button>
          </div>
        }
      >
        <TransactionTracker
          step={txStep}
          confirmations={txStep === 'CONFIRMED' ? 5 : txStep === 'CONFIRMING' ? 3 : 0}
          requiredConfirmations={5}
          type="FUND"
          amount="500"
          tokenSymbol="USDC"
          txHash="0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567"
        />
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
