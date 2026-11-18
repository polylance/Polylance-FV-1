import React, { useState, useEffect, useRef, useId } from 'react';
import { Scale } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '../../media/useDataSaver';
import { EscrowRail, StepItem } from './EscrowRail';
import { EscrowDiagram } from './EscrowDiagram';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface EscrowStoryProps {
  className?: string;
}

const STANDARD_STEPS: StepItem[] = [
  {
    id: 1,
    actor: 'Client',
    title: 'Client posts the job',
    copy: 'Set the scope, deadline and budget. Nothing is charged yet.',
    technical: 'Job terms and milestone deliverables are registered on PolyLance factory.',
  },
  {
    id: 2,
    actor: 'Client',
    title: 'Client funds escrow',
    copy: 'The budget moves into the escrow smart contract, not into a PolyLance account.',
    technical: 'Non-custodial EIP-1167 isolated minimal proxy contract deployed on Polygon Mainnet locks collateral.',
  },
  {
    id: 3,
    actor: 'Freelancer',
    title: 'Freelancer delivers',
    copy: 'Work is submitted with a verifiable record, such as a file hash or link.',
    technical: 'Deliverable commit hash, IPFS CID, and timestamp recorded in immutable smart contract state.',
  },
  {
    id: 4,
    actor: 'Client',
    title: 'Client reviews',
    copy: 'Approve to release payment, or raise a dispute within the review window.',
    technical: 'Pre-configured review window with multi-signature arbitration state and autonomous timeout protection.',
  },
  {
    id: 5,
    actor: 'Contract',
    title: 'Payment is released',
    copy: 'The contract sends payment to the freelancer\'s wallet. The platform fee (2.5%) is deducted.',
    technical: 'Smart contract automatically transfers 487.50 USDC to freelancer and 12.50 USDC (2.5%) protocol fee.',
  },
  {
    id: 6,
    actor: 'Contract',
    title: 'Certificate minted',
    copy: 'A verified, non-transferable work certificate is minted to the freelancer\'s wallet.',
    technical: 'ERC-721 Soulbound attestation token minted to recipient address as permanent on-chain work record.',
  },
];

const DISPUTE_STEPS: StepItem[] = [
  {
    id: 1,
    actor: 'Client',
    title: 'Client posts the job',
    copy: 'Set the scope, deadline and budget. Nothing is charged yet.',
    technical: 'Job terms and milestone deliverables are registered.',
  },
  {
    id: 2,
    actor: 'Client',
    title: 'Client funds escrow',
    copy: 'The budget moves into the escrow smart contract, not into a PolyLance account.',
    technical: 'Collateral locked in isolated smart contract proxy.',
  },
  {
    id: 3,
    actor: 'Freelancer',
    title: 'Freelancer delivers',
    copy: 'Work is submitted with a verifiable record, such as a file hash or link.',
    technical: 'Submission commit hash recorded on-chain.',
  },
  {
    id: 4,
    actor: 'Client',
    title: 'Dispute raised & Evidence submitted',
    copy: 'If requirements are contested, either party triggers the dispute window and submits evidence.',
    technical: 'Dispute state activated; contract locks withdrawals until independent peer judges vote.',
  },
  {
    id: 5,
    actor: 'Judges',
    title: 'Judges review & Arbitrate',
    copy: 'Independent peer judges evaluate specifications and submitted evidence to issue an on-chain verdict.',
    technical: '3-of-3 decentralized judge consensus releases escrowed funds to the verified rightful party.',
  },
  {
    id: 6,
    actor: 'Contract',
    title: 'Verdict settled & Certified',
    copy: 'Payment settles based on the verdict, and resolution attestations are stored permanently on Polygon.',
    technical: 'Verdict finalized with transparent arbitration records logged on Polygonscan.',
  },
];

export const EscrowStory: React.FC<EscrowStoryProps> = ({ className = '' }) => {
  const reducedMotion = useReducedMotion();
  const [isDisputeView, setIsDisputeView] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0 to 5
  const [progress, setProgress] = useState(0); // 0.0 to 1.0

  const sectionRef = useRef<HTMLDivElement>(null);
  const pinnedWrapperRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const liveRegionId = useId();

  const steps = isDisputeView ? DISPUTE_STEPS : STANDARD_STEPS;
  const currentStep = steps[activeStep] || steps[0];

  // ── GSAP ScrollTrigger Pinning & Scrubbing Setup ──
  useEffect(() => {
    if (reducedMotion) return;

    const sectionEl = sectionRef.current;
    const pinnedWrapper = pinnedWrapperRef.current;
    if (!sectionEl || !pinnedWrapper) return;

    // Helper to read dynamic navbar height from CSS variable
    const getNavOffset = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      const navHStr = rootStyle.getPropertyValue('--nav-h').trim();
      const navH = parseInt(navHStr, 10) || 72;
      return navH + 24; // navbar height + 24px clearance
    };

    const mm = gsap.matchMedia();

    // Desktop (>= 1024px): Pin the whole two-column section and scrub across ~100vh per step
    mm.add('(min-width: 1024px)', () => {
      const st = ScrollTrigger.create({
        trigger: sectionEl,
        start: () => `top top+=${getNavOffset()}`,
        end: () => `+=${window.innerHeight * 4.5}`,
        pin: pinnedWrapper,
        pinSpacing: true,
        scrub: 0.4,
        snap: {
          snapTo: 1 / 5,
          duration: { min: 0.25, max: 0.45 },
          delay: 0.05,
          ease: 'power1.inOut',
        },
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          setProgress(p);

          // Compute activeStep with slight hysteresis deadband
          const raw = p * 5;
          let stepIdx = Math.round(raw);
          stepIdx = Math.min(5, Math.max(0, stepIdx));
          setActiveStep(stepIdx);
        },
      });

      scrollTriggerRef.current = st;

      return () => {
        st.kill();
      };
    });

    // Mobile / Tablet (< 1024px): No pinning! Compact responsive flow.
    mm.add('(max-width: 1023px)', () => {
      scrollTriggerRef.current = null;
      setProgress(0);
      setActiveStep(0);
    });

    return () => {
      mm.revert();
    };
  }, [reducedMotion, isDisputeView]);

  // Programmatic jump to a step: scroll page to the step's exact scroll position
  const handleScrollToStep = (index: number) => {
    const st = scrollTriggerRef.current;
    if (st && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const totalScroll = st.end - st.start;
      const targetScroll = st.start + (index / 5) * totalScroll;
      window.scrollTo({
        top: targetScroll,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    } else {
      setActiveStep(index);
      setProgress(index / 5);
    }
  };

  const handlePrev = () => {
    handleScrollToStep(Math.max(0, activeStep - 1));
  };

  const handleNext = () => {
    handleScrollToStep(Math.min(steps.length - 1, activeStep + 1));
  };

  // ── Reduced Motion Fallback Render ──
  if (reducedMotion) {
    return (
      <div className={`space-y-8 ${className}`}>
        {/* Toggle */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <span className="text-xs font-semibold text-[#0047AB] uppercase tracking-wider block">
              Escrow State Machine (Accessible View)
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0B0B0F] mt-0.5">
              {isDisputeView ? 'Arbitration & Dispute Resolution' : 'Milestone Escrow from Start to Finish'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsDisputeView(!isDisputeView);
              setActiveStep(0);
            }}
            className="text-xs font-semibold px-3.5 py-2 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#0047AB] text-[#0B0B0F] transition-colors cursor-pointer"
          >
            {isDisputeView ? '← View standard escrow' : 'What if there is a dispute? →'}
          </button>
        </div>

        {/* 6 Plain Stacked Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className="p-6 bg-white border border-[#E5E7EB] rounded-[14px] space-y-4 text-left shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-bold text-sm">
                  0{step.id}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#0047AB] border border-[#BFDBFE]">
                  Actor: {step.actor}
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0B0B0F]">{step.title}</h3>
                <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">{step.copy}</p>
              </div>
              <div className="pt-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
                <strong className="text-[#0B0B0F]">Smart contract:</strong> {step.technical}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className={`w-full relative ${className}`}>
      {/* Screen Reader Live Region for Active Step */}
      <div id={liveRegionId} aria-live="polite" className="sr-only">
        Step {currentStep.id} of {steps.length}: {currentStep.title}. Actor: {currentStep.actor}. {currentStep.copy}
      </div>

      {/* ── Section Header with Dispute Switch ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#E5E7EB] mb-8">
        <div className="text-left">
          <span className="text-xs font-semibold text-[#0047AB] uppercase tracking-wider block">
            Escrow State Machine
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-[#0B0B0F] mt-0.5">
            {isDisputeView ? 'Arbitration & Dispute Resolution' : 'Milestone Escrow from Start to Finish'}
          </h3>
        </div>

        {/* Dispute branch toggle button */}
        <button
          type="button"
          onClick={() => {
            setIsDisputeView(!isDisputeView);
            handleScrollToStep(0);
          }}
          className={`self-start sm:self-auto px-4 py-2 rounded-[8px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
            isDisputeView
              ? 'bg-[#EFF6FF] text-[#0047AB] border-[#0047AB]'
              : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:text-[#0B0B0F] hover:border-[#0047AB]'
          }`}
        >
          <Scale size={14} className={isDisputeView ? 'text-[#0047AB]' : 'text-[#6B7280]'} />
          <span>{isDisputeView ? 'Switch to Standard Escrow' : 'What if there is a dispute?'}</span>
        </button>
      </div>

      {/* ── Two-Column Wrapper (Pinned on Desktop) ── */}
      <div
        ref={pinnedWrapperRef}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative will-change-transform"
      >
        {/* LEFT COLUMN: 6 Step Cards with Continuous Vertical Progress Rail */}
        <div className="lg:col-span-6 w-full">
          <EscrowRail
            steps={steps}
            activeStep={activeStep}
            progress={progress}
            onSelectStep={handleScrollToStep}
          />
        </div>

        {/* RIGHT COLUMN: Interactive Diagram Panel */}
        <div className="lg:col-span-6 w-full lg:sticky lg:top-[calc(var(--nav-h,72px)+24px)] z-20">
          <EscrowDiagram
            currentStep={currentStep}
            activeStep={activeStep}
            totalSteps={steps.length}
            isDisputeView={isDisputeView}
            onPrev={handlePrev}
            onNext={handleNext}
            onSelectStep={handleScrollToStep}
          />
        </div>
      </div>
    </div>
  );
};

export default EscrowStory;
