import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
  caption?: string;
}

export interface StepperProps {
  steps: StepItem[];
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, className = '' }) => {
  return (
    <nav aria-label="Progress Stepper" className={`w-full overflow-x-auto py-2 ${className}`}>
      <ol className="flex items-center min-w-max sm:min-w-0 w-full justify-between">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isComplete = step.status === 'complete';
          const isCurrent = step.status === 'current';

          return (
            <li key={step.id} className={`flex items-center ${isLast ? 'flex-shrink-0' : 'flex-1'}`}>
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors duration-150 ${
                    isComplete
                      ? 'bg-[#166534] text-white'
                      : isCurrent
                      ? 'bg-[#0047AB] text-white ring-4 ring-[#EFF6FF]'
                      : 'bg-[#F6F7F9] text-[#6B7280] border border-[#E5E7EB]'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? <Check size={13} strokeWidth={2.5} /> : index + 1}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-medium truncate ${
                      isCurrent
                        ? 'text-[#0B0B0F] font-semibold'
                        : isComplete
                        ? 'text-[#166534]'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.caption && (
                    <span className="text-[10px] text-[#9CA3AF] truncate">{step.caption}</span>
                  )}
                </div>
              </div>

              {!isLast && (
                <div
                  className={`h-[2px] flex-1 mx-3 transition-colors duration-150 ${
                    isComplete ? 'bg-[#166534]' : 'bg-[#E5E7EB]'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
