import React from 'react';
import { Check, AlertCircle, ArrowRight } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/* ==========================================================================
   WORKFLOW STEPPER (Reference Image 3)
   - 48px circles (24px compact)
   - 4px cobalt line (#0047AB) joining circles with 400ms transition
   - Last step: semantic green check labeled "Done"
   - Rounded 12px ActionBar below with gray status text (left) and cobalt action pill (right)
   ========================================================================== */

export type WorkflowStepStatus = 'upcoming' | 'current' | 'complete' | 'done' | 'error';

export interface WorkflowStep {
  id: string | number;
  label: string;
  description?: string;
  caption?: string;
  status?: WorkflowStepStatus;
  isFinal?: boolean;
}

export interface WorkflowAction {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

export interface WorkflowProps {
  steps: WorkflowStep[];
  currentIndex?: number;
  status?: string | React.ReactNode;
  actions?: WorkflowAction[] | React.ReactNode;
  variant?: 'horizontal' | 'compact' | 'vertical';
  className?: string;
  onStepClick?: (step: WorkflowStep, index: number) => void;
  ariaLabel?: string;
}

export const Workflow: React.FC<WorkflowProps> = ({
  steps,
  currentIndex = 0,
  status,
  actions,
  variant = 'horizontal',
  className = '',
  onStepClick,
  ariaLabel = 'Workflow progress',
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Helper to resolve status of a step based on currentIndex if not explicitly provided
  const getStepStatus = (step: WorkflowStep, index: number): WorkflowStepStatus => {
    if (step.status) return step.status;
    const isLast = index === steps.length - 1;
    if (index < currentIndex) {
      return isLast ? 'done' : 'complete';
    }
    if (index === currentIndex) {
      return isLast && step.isFinal ? 'done' : 'current';
    }
    return 'upcoming';
  };

  const isCompact = variant === 'compact';
  const isVertical = variant === 'vertical';

  const circleSizeClass = isCompact
    ? 'w-6 h-6 text-[11px]'
    : 'w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base';

  const checkSize = isCompact ? 13 : 18;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={`w-full ${className}`}
    >
      {/* Stepper Navigation */}
      <nav aria-label="Progress Stepper" className="w-full">
        {isVertical ? (
          <ol className="space-y-4">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const stepStatus = getStepStatus(step, index);
              const isDone = stepStatus === 'done' || (isLast && index <= currentIndex && step.isFinal);
              const isComplete = stepStatus === 'complete';
              const isCurrent = stepStatus === 'current';
              const isError = stepStatus === 'error';
              const isClickable = !!onStepClick;

              return (
                <li key={step.id} className="relative flex items-start gap-3.5">
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      disabled={!isClickable}
                      onClick={() => isClickable && onStepClick(step, index)}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`${circleSizeClass} rounded-full font-bold flex items-center justify-center shrink-0 transition-all ${
                        prefersReducedMotion ? '' : 'duration-300'
                      } ${
                        isDone
                          ? 'bg-[#0B7A55] text-white shadow-xs'
                          : isComplete
                          ? 'bg-[#0047AB] text-white shadow-xs'
                          : isCurrent
                          ? 'bg-[#0047AB] text-white ring-4 ring-[#EAF1FB] shadow-sm'
                          : isError
                          ? 'bg-[#DC2626] text-white ring-4 ring-[#FEE2E2]'
                          : 'bg-[#F5F6FA] text-[#6B7280] border border-[#E5E7EB]'
                      } ${isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                    >
                      {isDone || isComplete ? (
                        <Check size={checkSize} strokeWidth={2.5} />
                      ) : isError ? (
                        <AlertCircle size={checkSize} strokeWidth={2.5} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </button>
                    {!isLast && (
                      <div
                        className={`w-1 h-8 mt-1 transition-colors ${
                          prefersReducedMotion ? '' : 'duration-400'
                        } ${index < currentIndex ? 'bg-[#0047AB]' : 'bg-[#E5E7EB]'}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="pt-1">
                    <p
                      className={`text-sm font-semibold tracking-tight ${
                        isDone
                          ? 'text-[#0B7A55]'
                          : isCurrent
                          ? 'text-[#0B0B0F]'
                          : isComplete
                          ? 'text-[#0047AB]'
                          : 'text-[#6B7280]'
                      }`}
                    >
                      {isDone ? 'Done' : step.label}
                    </p>
                    {step.description && (
                      <p className="text-xs text-[#6B7280] mt-0.5">{step.description}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <ol className="flex items-start w-full justify-between relative">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const stepStatus = getStepStatus(step, index);
              const isDone = stepStatus === 'done' || (isLast && index <= currentIndex && step.isFinal);
              const isComplete = stepStatus === 'complete';
              const isCurrent = stepStatus === 'current';
              const isError = stepStatus === 'error';
              const isClickable = !!onStepClick;

              return (
                <li
                  key={step.id}
                  className="flex flex-col items-center flex-1 relative"
                >
                  {/* Step Connector Line */}
                  {!isLast && (
                    <div
                      className={`absolute ${
                        isCompact ? 'top-3.5 h-[3px]' : 'top-5 sm:top-6 h-[4px]'
                      } left-1/2 w-full -translate-y-1/2 z-0 transition-colors ${
                        prefersReducedMotion ? '' : 'duration-400'
                      } ${index < currentIndex ? 'bg-[#0047AB]' : 'bg-[#E5E7EB]'}`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Step Circle */}
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && onStepClick(step, index)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`${circleSizeClass} rounded-full font-bold flex items-center justify-center shrink-0 relative z-10 transition-all ${
                      prefersReducedMotion ? '' : 'duration-300'
                    } ${
                      isDone
                        ? 'bg-[#0B7A55] text-white shadow-xs'
                        : isComplete
                        ? 'bg-[#0047AB] text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#0047AB] text-white ring-4 ring-[#EAF1FB] shadow-sm'
                        : isError
                        ? 'bg-[#DC2626] text-white ring-4 ring-[#FEE2E2]'
                        : 'bg-[#F5F6FA] text-[#6B7280] border border-[#E5E7EB]'
                    } ${isClickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                  >
                    {isDone || isComplete ? (
                      <Check size={checkSize} strokeWidth={2.5} />
                    ) : isError ? (
                      <AlertCircle size={checkSize} strokeWidth={2.5} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>

                  {/* Step Label (Underneath) */}
                  <div className="mt-2.5 text-center px-1 max-w-[120px] sm:max-w-[160px]">
                    <span
                      className={`block text-xs sm:text-sm font-semibold tracking-tight transition-colors ${
                        isDone
                          ? 'text-[#0B7A55]'
                          : isCurrent
                          ? 'text-[#0B0B0F]'
                          : isComplete
                          ? 'text-[#0047AB]'
                          : 'text-[#6B7280]'
                      }`}
                    >
                      {isDone ? 'Done' : step.label}
                    </span>
                    {step.caption && (
                      <span className="block text-[10px] sm:text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">
                        {step.caption}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </nav>

      {/* Action Bar Underneath (Image 3 Reference) */}
      {(status || actions) && (
        <div className="rounded-[12px] bg-[#F5F6FA] border border-[#E5E7EB] p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6">
          {/* Left: Gray status text */}
          <div className="text-sm font-medium text-[#4B5563]">
            {typeof status === 'string' ? <span>{status}</span> : status}
          </div>

          {/* Right: Cobalt action pill or custom buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {Array.isArray(actions) ? (
              actions.map((act, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={act.disabled}
                  onClick={act.onClick}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    act.variant === 'secondary'
                      ? 'bg-white border border-[#E5E7EB] text-[#0B0B0F] hover:bg-[#F9FAFB]'
                      : act.variant === 'outline'
                      ? 'bg-transparent border border-[#0047AB] text-[#0047AB] hover:bg-[#EEF4FD]'
                      : 'bg-[#0047AB] hover:bg-[#00388A] text-white shadow-xs'
                  } ${act.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {act.label}
                  {act.icon || <ArrowRight size={13} />}
                </button>
              ))
            ) : (
              actions
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Workflow;
