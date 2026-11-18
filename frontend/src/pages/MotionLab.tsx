import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import {
  Reveal,
  Stagger,
  CountUp,
  ProgressFill,
  DrawCheck,
  Skeleton,
} from '../components/common/MotionPrimitives';
import { TransactionStatus, TxStage } from '../components/common/TransactionStatus';
import { EscrowFlow } from '../components/escrow/EscrowFlow';
import { Sparkles, RefreshCw, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';

export const MotionLab: React.FC = () => {
  const [simulatedReducedMotion, setSimulatedReducedMotion] = useState(false);
  const [keyReset, setKeyReset] = useState(0);

  // Stepper state for TransactionStatus demonstration
  const [currentStage, setCurrentStage] = useState<TxStage>('submitting');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [progressPercent, setProgressPercent] = useState<number>(65);

  const handleResetAnimations = () => {
    setKeyReset((prev) => prev + 1);
  };

  return (
    <PageContainer className="space-y-12 py-8 text-[#0B0B0F]">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-[#E7EEF9] text-[#0047AB] text-xs font-mono font-medium mb-2">
            <Sparkles size={12} />
            DEV-ONLY MOTION LAB (PHASE 8)
          </div>
          <h1 className="font-sans font-semibold text-2xl sm:text-3xl text-[#0B0B0F] tracking-tight">
            Motion Primitives & Interaction QA
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Test harness for animations, accessibility fallbacks, transaction steppers, and escrow diagrams.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setSimulatedReducedMotion(!simulatedReducedMotion)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-colors cursor-pointer ${
              simulatedReducedMotion
                ? 'bg-[#0B0B0F] text-white border-[#0B0B0F]'
                : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:text-[#0B0B0F]'
            }`}
          >
            {simulatedReducedMotion ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{simulatedReducedMotion ? 'Reduced Motion: ON' : 'Reduced Motion: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetAnimations}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0047AB] text-white text-xs font-medium hover:bg-[#003884] transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Replay All</span>
          </button>
        </div>
      </div>

      <div key={keyReset} className={`space-y-12 ${simulatedReducedMotion ? 'reduce-motion-active' : ''}`}>
        {/* ── SECTION 1: REVEAL & STAGGER ─────────────────────────────────── */}
        <section className="space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-sans font-semibold text-base text-[#0B0B0F]">
              1. Reveal & Stagger Primitives
            </h2>
            <p className="text-xs text-[#6B7280]">
              Intersection-observed translate-Y (12px) and opacity fade over 250ms with 50ms stagger.
            </p>
          </div>

          <Stagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {['Card A (0ms)', 'Card B (+50ms)', 'Card C (+100ms)', 'Card D (+150ms)'].map((title, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 space-y-2 hover:border-[#0047AB] transition-colors"
              >
                <div className="w-6 h-6 rounded-[6px] bg-[#E7EEF9] text-[#0047AB] text-xs font-mono font-semibold flex items-center justify-center">
                  {idx + 1}
                </div>
                <h3 className="font-semibold text-sm text-[#0B0B0F]">{title}</h3>
                <p className="text-xs text-[#4B5563]">
                  Fade & slight lift primitive without layout shift.
                </p>
              </div>
            ))}
          </Stagger>
        </section>

        {/* ── SECTION 2: COUNT-UP NUMBERS ─────────────────────────────────── */}
        <section className="space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-sans font-semibold text-base text-[#0B0B0F]">
              2. CountUp Number Animation
            </h2>
            <p className="text-xs text-[#6B7280]">
              Animates smoothly from 0 to target over 800ms with cubic-bezier easing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 space-y-1">
              <span className="text-xs font-medium text-[#6B7280]">Settled Protocol Volume</span>
              <div className="text-2xl font-semibold text-[#0B0B0F]">
                <CountUp value={142500} prefix="$" />
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 space-y-1">
              <span className="text-xs font-medium text-[#6B7280]">Completed Milestone Contracts</span>
              <div className="text-2xl font-semibold text-[#0B0B0F]">
                <CountUp value={348} suffix=" Escrows" />
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 space-y-1">
              <span className="text-xs font-medium text-[#6B7280]">Average Dispute Resolution Time</span>
              <div className="text-2xl font-semibold text-[#0047AB]">
                <CountUp value={4.2} decimals={1} suffix=" Hours" />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: PROGRESS FILL & SKELETONS ──────────────────────────── */}
        <section className="space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-sans font-semibold text-base text-[#0B0B0F]">
              3. ProgressFill & Layout Skeletons
            </h2>
            <p className="text-xs text-[#6B7280]">
              Smooth width grow and subtle 1.6s opacity pulse for data-fetching states.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress Fill Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0B0B0F]">Profile Completeness</span>
                <span className="text-xs font-mono font-medium text-[#0047AB]">{progressPercent}%</span>
              </div>

              <ProgressFill percent={progressPercent} />

              <div className="flex items-center gap-2 pt-2">
                {[15, 45, 65, 85, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setProgressPercent(val)}
                    className={`px-2 py-1 rounded-[6px] text-xs font-mono cursor-pointer border ${
                      progressPercent === val
                        ? 'bg-[#0047AB] text-white border-[#0047AB]'
                        : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:text-[#0B0B0F]'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Skeleton Loaders Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 space-y-3">
              <span className="text-xs font-semibold text-[#0B0B0F]">Skeleton Mockup</span>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="w-3/4 h-3.5" />
                  <Skeleton className="w-1/2 h-3" />
                </div>
              </div>
              <Skeleton className="w-full h-8 rounded-[8px]" />
            </div>
          </div>
        </section>

        {/* ── SECTION 4: TRANSACTION STATUS STEPPER ───────────────────────── */}
        <section className="space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-sans font-semibold text-base text-[#0B0B0F]">
                4. Transaction Status Stepper (`&lt;TransactionStatus&gt;`)
              </h2>
              <p className="text-xs text-[#6B7280]">
                Accurate 3-stage flow (Confirm in wallet $\to$ Submitted $\to$ Confirmed) with zero fake progress.
              </p>
            </div>

            {/* Stepper controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setCurrentStage('wallet');
                  setErrorMessage(undefined);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F6F7F9] cursor-pointer"
              >
                Confirming
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStage('submitting');
                  setErrorMessage(undefined);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F6F7F9] cursor-pointer"
              >
                Submitted
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStage('confirmed');
                  setErrorMessage(undefined);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F6F7F9] cursor-pointer"
              >
                Confirmed
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStage('failed');
                  setErrorMessage('User rejected transaction in wallet');
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-[6px] border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
              >
                Simulate Error
              </button>
            </div>
          </div>

          <div className="max-w-xl mx-auto">
            <TransactionStatus
              stage={currentStage}
              txHash="0x892a78f3c42e41b714c8360dea81c4a9f3b37a0f329d50d32a4e21ecf5f3b37a"
              errorMessage={errorMessage}
              onRetry={() => {
                setCurrentStage('wallet');
                setErrorMessage(undefined);
              }}
              isSample={true}
            />
          </div>
        </section>

        {/* ── SECTION 5: ESCROW FLOW DIAGRAM ──────────────────────────────── */}
        <section className="space-y-4">
          <div className="border-b border-[#E5E7EB] pb-2">
            <h2 className="font-sans font-semibold text-base text-[#0B0B0F]">
              5. Escrow Flow SVG State Machine (`&lt;EscrowFlow&gt;`)
            </h2>
            <p className="text-xs text-[#6B7280]">
              6-step interactive escrow diagram with dispute resolution alternative branch.
            </p>
          </div>

          <EscrowFlow />
        </section>
      </div>
    </PageContainer>
  );
};

export default MotionLab;
