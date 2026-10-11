import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  ShieldCheck,
  Award,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Scale,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useReducedMotion } from '../../media/useDataSaver';

export interface EscrowFlowProps {
  className?: string;
  autoPlayOnView?: boolean;
  stepIndex?: number;
}

interface Step {
  id: number;
  title: string;
  desc: string;
  technicalDetails?: string;
  activeNodes: ('client' | 'escrow' | 'freelancer' | 'certificate')[];
}

const STANDARD_STEPS: Step[] = [
  {
    id: 1,
    title: 'Client funds escrow',
    desc: 'Project budget is transferred from the client wallet directly into a secure escrow smart contract on Polygon.',
    technicalDetails: 'EIP-1167 isolated minimal proxy contract on Polygon Mainnet.',
    activeNodes: ['client', 'escrow'],
  },
  {
    id: 2,
    title: 'Funds locked in smart contract',
    desc: 'Payment is securely held by the smart contract. Neither PolyLance nor unauthorized parties can access funds.',
    technicalDetails: 'Non-custodial smart contract escrow without private key access.',
    activeNodes: ['escrow'],
  },
  {
    id: 3,
    title: 'Freelancer delivers milestone',
    desc: 'The freelancer works with certainty of payment and submits verified milestone deliverables.',
    technicalDetails: 'Deliverable commit hash and timestamp recorded on-chain.',
    activeNodes: ['freelancer', 'escrow'],
  },
  {
    id: 4,
    title: 'Client reviews and approves',
    desc: 'Client inspects the deliverables against agreed specifications and signs approval with their wallet.',
    technicalDetails: 'Direct on-chain client signature transaction.',
    activeNodes: ['client', 'escrow'],
  },
  {
    id: 5,
    title: 'Payment releases instantly',
    desc: 'The smart contract automatically transfers milestone funds to the freelancer with sub-cent Polygon gas fees.',
    technicalDetails: 'Direct ERC-20 / Native token transfer event.',
    activeNodes: ['escrow', 'freelancer'],
  },
  {
    id: 6,
    title: 'Work certificate issued',
    desc: 'A permanent certificate is minted directly to the freelancer’s profile as verifiable proof of completed work.',
    technicalDetails: 'ERC-721 Soulbound attestation token minted to recipient wallet.',
    activeNodes: ['escrow', 'certificate', 'freelancer'],
  },
];

const DISPUTE_STEPS: Step[] = [
  {
    id: 1,
    title: 'Dispute initiated',
    desc: 'If milestone requirements are contested, either party can raise an on-chain dispute within the review period.',
    technicalDetails: 'Dispute window activates on-chain arbitration state.',
    activeNodes: ['client', 'escrow', 'freelancer'],
  },
  {
    id: 2,
    title: 'Vault remains frozen',
    desc: 'The smart contract immediately freezes funds in place so no unilateral withdrawals can occur.',
    technicalDetails: 'Autonomous re-entrancy guarded contract lock.',
    activeNodes: ['escrow'],
  },
  {
    id: 3,
    title: 'Independent judges review evidence',
    desc: 'Peer judges review contract specifications, deliverables, and communication records.',
    technicalDetails: 'Decentralized judge quorum evaluates evidence hashes.',
    activeNodes: ['escrow'],
  },
  {
    id: 4,
    title: 'Arbitration consensus reached',
    desc: 'Judges submit consensus votes on Polygon, releasing funds fairly according to the verdict.',
    technicalDetails: 'Multi-sig consensus execution trigger.',
    activeNodes: ['escrow', 'freelancer', 'client'],
  },
];

/**
 * <EscrowFlow>
 * Interactive and scroll-linked escrow lifecycle diagram.
 * Jargon-free labels with technical details in an expandable tooltip.
 * Uses black numbers in cobalt-outlined circles.
 */
export const EscrowFlow: React.FC<EscrowFlowProps> = ({
  className = '',
  autoPlayOnView = true,
  stepIndex,
}) => {
  const [isDisputePath, setIsDisputePath] = useState(false);
  const [internalStepIndex, setInternalStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const steps = isDisputePath ? DISPUTE_STEPS : STANDARD_STEPS;
  
  // If controlled stepIndex is provided, map it cleanly
  const currentStepIndex = stepIndex !== undefined 
    ? Math.min(Math.max(stepIndex, 0), steps.length - 1)
    : internalStepIndex;

  const currentStep = steps[currentStepIndex] || steps[0];

  // Step progression timer if not controlled and playing
  useEffect(() => {
    if (stepIndex !== undefined || !isPlaying || reducedMotion) return;

    const timer = setTimeout(() => {
      if (internalStepIndex < steps.length - 1) {
        setInternalStepIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [isPlaying, internalStepIndex, steps.length, reducedMotion, stepIndex]);

  const handleNext = () => {
    setIsPlaying(false);
    setInternalStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setInternalStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handlePathSwitch = (dispute: boolean) => {
    setIsDisputePath(dispute);
    setInternalStepIndex(0);
    setIsPlaying(false);
  };

  const isNodeActive = (node: 'client' | 'escrow' | 'freelancer' | 'certificate') => {
    return currentStep.activeNodes.includes(node);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white border border-[#E5E7EB] rounded-[12px] p-5 sm:p-6 space-y-6 text-left font-sans select-none ${className}`}
    >
      {/* Top Header & Path Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0047AB]" />
            <h3 className="text-sm font-semibold text-[#0B0B0F] tracking-tight">
              Smart Contract Escrow Lifecycle
            </h3>
            <span className="text-[11px] font-sans px-2 py-0.5 rounded-[4px] bg-[#E7EEF9] text-[#0047AB] font-medium border border-[#BFDBFE]">
              Polygon
            </span>
          </div>
          <p className="text-xs text-[#4B5563] mt-0.5">
            Funds remain in smart contract escrow until work is delivered and approved.
          </p>
        </div>

        {/* Path Switcher */}
        <div className="inline-flex p-1 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handlePathSwitch(false)}
            className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer ${
              !isDisputePath
                ? 'bg-white text-[#0047AB] font-semibold border border-[#E5E7EB]'
                : 'text-[#4B5563] hover:text-[#0B0B0F]'
            }`}
          >
            Milestone Escrow
          </button>
          <button
            type="button"
            onClick={() => handlePathSwitch(true)}
            className={`px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1 ${
              isDisputePath
                ? 'bg-white text-[#B45309] font-semibold border border-[#E5E7EB]'
                : 'text-[#4B5563] hover:text-[#0B0B0F]'
            }`}
          >
            <Scale size={12} />
            <span>Dispute Window</span>
          </button>
        </div>
      </div>

      {/* Visual Nodes Grid */}
      <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[10px] p-4 sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          
          {/* Node 1: Client */}
          <div
            className={`p-3.5 rounded-[8px] border transition-all duration-200 text-center flex flex-col items-center justify-center space-y-1.5 ${
              isNodeActive('client')
                ? 'bg-white border-[#0047AB]'
                : 'bg-white/80 border-[#E5E7EB] opacity-60'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isNodeActive('client') ? 'bg-[#0047AB] text-white' : 'bg-[#E5E7EB] text-[#4B5563]'
              }`}
            >
              <Wallet size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0B0B0F]">Client</div>
              <div className="text-[11px] text-[#4B5563]">Deposits Funds</div>
            </div>
          </div>

          {/* Node 2: Escrow Smart Contract */}
          <div
            className={`p-3.5 rounded-[8px] border transition-all duration-200 text-center flex flex-col items-center justify-center space-y-1.5 ${
              isNodeActive('escrow')
                ? isDisputePath
                  ? 'bg-white border-[#B45309]'
                  : 'bg-white border-[#0047AB]'
                : 'bg-white/80 border-[#E5E7EB] opacity-60'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isNodeActive('escrow')
                  ? isDisputePath
                    ? 'bg-[#B45309] text-white'
                    : 'bg-[#0047AB] text-white'
                  : 'bg-[#E5E7EB] text-[#4B5563]'
              }`}
            >
              {isDisputePath ? <Scale size={16} /> : <ShieldCheck size={16} />}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0B0B0F]">Smart Contract</div>
              <div className="text-[11px] text-[#4B5563]">Holds Escrow</div>
            </div>
          </div>

          {/* Node 3: Freelancer */}
          <div
            className={`p-3.5 rounded-[8px] border transition-all duration-200 text-center flex flex-col items-center justify-center space-y-1.5 ${
              isNodeActive('freelancer')
                ? 'bg-white border-[#0047AB]'
                : 'bg-white/80 border-[#E5E7EB] opacity-60'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isNodeActive('freelancer') ? 'bg-[#0047AB] text-white' : 'bg-[#E5E7EB] text-[#4B5563]'
              }`}
            >
              <Wallet size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0B0B0F]">Freelancer</div>
              <div className="text-[11px] text-[#4B5563]">Receives Payout</div>
            </div>
          </div>

          {/* Node 4: Certificate */}
          <div
            className={`p-3.5 rounded-[8px] border transition-all duration-200 text-center flex flex-col items-center justify-center space-y-1.5 ${
              isNodeActive('certificate')
                ? 'bg-white border-[#0047AB]'
                : 'bg-white/80 border-[#E5E7EB] opacity-60'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isNodeActive('certificate') ? 'bg-[#0047AB] text-white' : 'bg-[#E5E7EB] text-[#4B5563]'
              }`}
            >
              <Award size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#0B0B0F]">Work Certificate</div>
              <div className="text-[11px] text-[#4B5563]">On-Chain Record</div>
            </div>
          </div>

        </div>

        {/* State line */}
        <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#4B5563]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Step {currentStep.id} of {steps.length} active</span>
          </div>
          <span className="font-semibold text-[#0B0B0F]">
            {isDisputePath ? 'Arbitration Safeguard' : 'Milestone Protection'}
          </span>
        </div>
      </div>

      {/* Active Step Card */}
      <div className="p-4 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[10px] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Step number: black number in cobalt-outlined circle */}
            <div className="w-7 h-7 rounded-full border border-[#0047AB] text-[#0B0B0F] flex items-center justify-center font-semibold text-xs bg-white shrink-0">
              {currentStep.id}
            </div>
            <h4 className="text-sm font-semibold text-[#0B0B0F]">
              {currentStep.title}
            </h4>
          </div>

          {currentStep.technicalDetails && (
            <button
              type="button"
              onClick={() => setShowTechDetails((v) => !v)}
              className="text-[11px] text-[#0047AB] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              title="Toggle technical details"
            >
              <Info size={12} />
              <span>Technical details</span>
            </button>
          )}
        </div>

        <p className="text-xs text-[#374151] leading-relaxed pl-9">
          {currentStep.desc}
        </p>

        {showTechDetails && currentStep.technicalDetails && (
          <div className="mt-2 ml-9 p-2.5 rounded-[6px] bg-white border border-[#E5E7EB] text-[11px] font-sans text-[#4B5563]">
            <strong className="text-[#0B0B0F]">On-chain implementation:</strong> {currentStep.technicalDetails}
          </div>
        )}
      </div>

      {/* Manual Stepper Controls if not controlled externally */}
      {stepIndex === undefined && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={internalStepIndex === 0}
              className="px-2.5 py-1 text-xs font-medium text-[#4B5563] bg-white border border-[#E5E7EB] rounded-[6px] hover:bg-[#F6F7F9] disabled:opacity-40 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={internalStepIndex === steps.length - 1}
              className="px-2.5 py-1 text-xs font-semibold text-[#0047AB] bg-white border border-[#E5E7EB] rounded-[6px] hover:bg-[#F6F7F9] disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-1">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setInternalStepIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  currentStepIndex === idx ? 'bg-[#0047AB] w-4' : 'bg-[#D1D5DB]'
                }`}
                aria-label={`Jump to step ${s.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
