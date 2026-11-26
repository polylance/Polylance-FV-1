import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
  caption?: string;
  tooltip?: string;
}

export interface StepperProps {
  steps: StepItem[];
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, className = '' }) => {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const currentIdx = steps.findIndex((s) => s.status === 'current');
  const totalSegments = Math.max(1, steps.length - 1);
  const progressFraction =
    completedCount >= steps.length
      ? 1
      : Math.min(1, Math.max(0, (currentIdx >= 0 ? currentIdx : completedCount) / totalSegments));

  return (
    <nav aria-label="Progress Stepper" className={`w-full overflow-x-auto py-3 ${className}`}>
      <div className="relative min-w-[640px] sm:min-w-0">
        {/* Continuous Background & Animated Cobalt Track */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute top-[15px] left-5 right-5 h-[2px] bg-slate-200 rounded-full overflow-hidden z-0"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progressFraction }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full origin-left bg-gradient-to-r from-[#0A52B8] via-[#2563EB] to-[#60A5FA]"
          />
        </div>

        <ol className="relative z-10 grid grid-cols-5 gap-3 w-full">
          {steps.map((step, index) => {
            const isComplete = step.status === 'complete';
            const isCurrent = step.status === 'current';
            const showTooltip = Boolean(step.tooltip && hoveredId === step.id);

            return (
              <li
                key={step.id}
                onMouseEnter={() => setHoveredId(step.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex flex-col items-start sm:items-center text-left sm:text-center group"
              >
                {/* Hover Tooltip */}
                {showTooltip && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 px-2.5 py-1 rounded-lg bg-[#0F172A] text-white text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none">
                    {step.tooltip}
                  </div>
                )}

                <div className="relative flex items-center justify-center mb-2">
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -m-1 rounded-full bg-[#2563EB]/25 animate-ping"
                    />
                  )}
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.28, delay: index * 0.05 }}
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isComplete
                        ? 'bg-[#0A52B8] text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#2563EB] text-white ring-4 ring-[#EFF6FF] shadow-xs'
                        : 'bg-[#F8FAFC] text-slate-500 border border-slate-200'
                    }`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isComplete ? <Check size={14} strokeWidth={2.6} /> : index + 1}
                  </motion.div>
                </div>

                <span
                  className={`text-xs font-semibold leading-tight ${
                    isCurrent
                      ? 'text-[#0A52B8]'
                      : isComplete
                      ? 'text-[#0F172A]'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
                {step.caption && (
                  <span className="text-[10.5px] font-mono text-slate-500 mt-0.5 leading-tight">
                    {step.caption}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Stepper;
