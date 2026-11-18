import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDemoMode } from '../../context/DemoModeContext';
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface TourStepDef {
  step: number;
  title: string;
  description: string;
  route: string;
  targetSelector?: string;
  roleHint?: 'client' | 'freelancer' | 'both';
}

const TOUR_STEPS: TourStepDef[] = [
  {
    step: 1,
    title: '1. Dashboard Overview',
    description: 'Track your active contracts, pending milestones, on-chain balances, and verified reputation at a glance.',
    route: '/dashboard',
    targetSelector: '#dashboard-content, main',
    roleHint: 'both',
  },
  {
    step: 2,
    title: '2. Find Jobs & Filter by Verifiable Skills',
    description: 'Browse smart contract escrow opportunities. Filter by category, budget in POL or USDC, and required reputation score.',
    route: '/jobs',
    targetSelector: 'main',
    roleHint: 'freelancer',
  },
  {
    step: 3,
    title: '3. Job Detail & Escrow Timeline',
    description: 'Every job features a transparent 7-stage escrow timeline and on-chain verification links from creation to release.',
    route: '/jobs/sample-job-1',
    targetSelector: 'main',
    roleHint: 'both',
  },
  {
    step: 4,
    title: '4. Negotiate Terms & Milestones',
    description: 'Direct peer-to-peer discussions. Propose custom budgets and agree on deliverables before funding the vault.',
    route: '/chat',
    targetSelector: 'main',
    roleHint: 'both',
  },
  {
    step: 5,
    title: '5. Fund Non-Custodial Escrow',
    description: 'The client deposits funds into a smart contract vault. The money is securely locked and cannot be stolen or clawed back arbitrarily.',
    route: '/workspace',
    targetSelector: 'main',
    roleHint: 'client',
  },
  {
    step: 6,
    title: '6. Deliver & Verify Work',
    description: 'The freelancer submits verifiable deliverables and repository links directly to the milestone contract for client review.',
    route: '/workspace',
    targetSelector: 'main',
    roleHint: 'freelancer',
  },
  {
    step: 7,
    title: '7. Milestone Release & SBT Mint',
    description: 'When approved, funds are released instantly to the freelancer and a non-transferable Soulbound reputation certificate is minted on Polygon.',
    route: '/reputation',
    targetSelector: 'main',
    roleHint: 'both',
  },
  {
    step: 8,
    title: '8. Verifiable Profile & Reputation',
    description: 'Proof of work is anchored on-chain with verifiable GitHub attestation, completed contracts, and peer reviews.',
    route: '/profile/0x2222222222222222222222222222222222222222',
    targetSelector: 'main',
    roleHint: 'both',
  },
];

export const GuidedTour: React.FC = () => {
  const { isDemoMode, isTourActive, setIsTourActive, tourStep, setTourStep } = useDemoMode();
  const navigate = useNavigate();
  const location = useLocation();

  const currentStepDef = TOUR_STEPS[tourStep - 1] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;

  // Handle tour completion / dismissal
  const handleDismiss = useCallback(() => {
    setIsTourActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('polylance_tour_dismissed', 'true');
    }
  }, [setIsTourActive]);

  const handleNext = useCallback(() => {
    if (tourStep < totalSteps) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      const nextDef = TOUR_STEPS[nextStep - 1];
      if (nextDef && location.pathname !== nextDef.route) {
        navigate(nextDef.route);
      }
    } else {
      handleDismiss();
    }
  }, [tourStep, totalSteps, setTourStep, location.pathname, navigate, handleDismiss]);

  const handleBack = useCallback(() => {
    if (tourStep > 1) {
      const prevStep = tourStep - 1;
      setTourStep(prevStep);
      const prevDef = TOUR_STEPS[prevStep - 1];
      if (prevDef && location.pathname !== prevDef.route) {
        navigate(prevDef.route);
      }
    }
  }, [tourStep, setTourStep, location.pathname, navigate]);

  // Keyboard navigation: Left, Right, Escape
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, handleDismiss, handleNext, handleBack]);

  if (!isDemoMode || !isTourActive) return null;

  return (
    <>
      {/* Dim overlay with 2px flat border effect (no blur, no glow) */}
      <div
        className="fixed inset-0 z-[70] bg-black/40 pointer-events-none transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Floating Tour Card / Bottom-sheet on mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Product Tour Step ${tourStep} of ${totalSteps}: ${currentStepDef.title}`}
        className="fixed z-[75] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md bg-[#FFFFFF] border-2 border-[#0047AB] rounded-[12px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] text-[#0B0B0F] font-sans"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0047AB]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0047AB]">
              Interactive Tour — Step {tourStep} of {totalSteps}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Skip product tour"
            className="p-1 rounded-[6px] hover:bg-[#F6F7F9] text-[#6B7280] hover:text-[#0B0B0F] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="py-3.5 space-y-2">
          <h3 className="font-semibold text-base text-[#0B0B0F] tracking-tight">
            {currentStepDef.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
            {currentStepDef.description}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 py-2" aria-hidden="true">
          {TOUR_STEPS.map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                setTourStep(s.step);
                if (location.pathname !== s.route) navigate(s.route);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                s.step === tourStep
                  ? 'w-6 bg-[#0047AB]'
                  : s.step < tourStep
                  ? 'w-2 bg-[#0B0B0F]'
                  : 'w-2 bg-[#E5E7EB]'
              }`}
              title={`Go to step ${s.step}`}
            />
          ))}
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB] mt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs text-[#6B7280] hover:text-[#0B0B0F] underline cursor-pointer"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {tourStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F6F7F9] text-xs font-medium text-[#0B0B0F] cursor-pointer"
              >
                <ChevronLeft size={13} />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#0047AB] hover:bg-[#003884] text-xs font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer"
            >
              <span>{tourStep === totalSteps ? 'Finish tour' : 'Next step'}</span>
              {tourStep < totalSteps ? <ChevronRight size={13} /> : <CheckCircle2 size={13} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
