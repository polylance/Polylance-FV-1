import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

export interface StepItem {
  id: number;
  actor: 'Client' | 'Freelancer' | 'Contract' | 'Judges';
  title: string;
  copy: string;
  technical: string;
}

interface EscrowRailProps {
  steps: StepItem[];
  activeStep: number;
  progress: number; // 0.0 to 1.0 overall progress
  onSelectStep: (index: number) => void;
  className?: string;
}

export const EscrowRail: React.FC<EscrowRailProps> = ({
  steps,
  activeStep,
  progress,
  onSelectStep,
  className = '',
}) => {
  return (
    <div className={`space-y-6 sm:space-y-8 relative text-left select-none ${className}`}>
      {/* ── Continuous Vertical Progress Rail Line ── */}
      <div className="hidden sm:block absolute left-[19px] top-6 bottom-6 w-0.5 bg-[#E5E7EB] z-0">
        <div
          className="w-full bg-[#0047AB] transition-[height] duration-150 ease-out origin-top"
          style={{
            height: `${Math.min(100, Math.max(0, progress * 100))}%`,
          }}
        />
      </div>

      {/* ── 6 Step Cards ── */}
      {steps.map((step, idx) => {
        const isActive = activeStep === idx;
        const isCompleted = activeStep > idx;

        return (
          <div
            key={step.id}
            role="button"
            tabIndex={0}
            aria-current={isActive ? 'step' : undefined}
            aria-label={`Step ${step.id}: ${step.title}. Actor: ${step.actor}. ${step.copy}`}
            onClick={() => onSelectStep(idx)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectStep(idx);
              }
            }}
            className={`p-5 sm:p-6 sm:pl-14 rounded-[14px] border transition-all duration-300 cursor-pointer relative z-10 ${
              isActive
                ? 'bg-white border-[#0047AB] ring-2 ring-[#0047AB]/20 shadow-md opacity-100 scale-[1.01]'
                : isCompleted
                ? 'bg-white border-[#E5E7EB] opacity-80 hover:opacity-100 hover:border-[#BFDBFE]'
                : 'bg-[#F6F7F9] border-[#E5E7EB] opacity-50 hover:opacity-80'
            }`}
          >
            {/* Number / Status Node sitting directly on the rail */}
            <div
              className={`hidden sm:flex absolute left-0.5 top-6 w-9 h-9 rounded-full items-center justify-center font-bold text-xs transition-all duration-300 shrink-0 ${
                isActive
                  ? 'bg-[#0047AB] text-white shadow-md ring-4 ring-[#EFF6FF]'
                  : isCompleted
                  ? 'bg-[#EFF6FF] border-2 border-[#0047AB] text-[#0047AB]'
                  : 'bg-white border-2 border-[#D1D5DB] text-[#9CA3AF]'
              }`}
            >
              {isCompleted ? (
                <Check size={16} strokeWidth={2.8} className="text-[#0047AB]" />
              ) : (
                <span>0{step.id}</span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border transition-colors ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#0047AB] border-[#BFDBFE]'
                      : isCompleted
                      ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                      : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'
                  }`}
                >
                  Actor: {step.actor}
                </span>
                <span className="text-xs font-mono text-[#9CA3AF]">
                  0{step.id} / 0{steps.length}
                </span>
              </div>

              <h3
                className={`text-base sm:text-lg font-semibold transition-colors ${
                  isActive ? 'text-[#0B0B0F]' : 'text-[#374151]'
                }`}
              >
                {step.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                {step.copy}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EscrowRail;
