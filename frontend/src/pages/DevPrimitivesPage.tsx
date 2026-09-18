import React, { useState } from 'react';
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

export const DevPrimitivesPage: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    <div className="max-w-xl mx-auto py-8 px-4 space-y-10 pb-28">
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
              className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl flex flex-col justify-between h-44"
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

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
