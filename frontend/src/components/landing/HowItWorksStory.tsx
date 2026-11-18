import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { DeviceFrame } from '../video/DeviceFrame';
import { PolygonIcon } from '../TokenIcon';
import { REVIEW_WINDOW_DAYS, PLATFORM_FEE_PERCENT, MAINNET_CONTRACTS, POLYGONSCAN_BASE_URL } from '../../seo/site.config';
import { trackLandingEvent } from '../../utils/analytics';

interface StepItem {
  id: number;
  badge: string;
  title: string;
  lead: string;
  detail: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    badge: 'Step 1',
    title: 'Fund escrow',
    lead: 'Define milestones and commit funds into Polygon smart contracts.',
    detail: 'Before work starts, the client deposits project funds directly into an autonomous escrow vault. The freelancer sees verifiable collateral on-chain.',
  },
  {
    id: 2,
    badge: 'Step 2',
    title: 'Private chat & deliver',
    lead: 'Coordinate in real time and submit cryptographic deliverables.',
    detail: 'Discuss specs, share requirements, and register repository links and git commit hashes directly into the escrow contract record.',
  },
  {
    id: 3,
    badge: 'Step 3',
    title: 'Inspect & release',
    lead: '7-day inspection window with instant, one-click release.',
    detail: `The client reviews the deliverable against agreed specs. One click triggers autonomous payment. If unresponsive, freelancer claims release after ${REVIEW_WINDOW_DAYS} days.`,
  },
  {
    id: 4,
    badge: 'Step 4',
    title: 'Mint certificate',
    lead: 'Permanent Soulbound work credential registered to your wallet.',
    detail: 'Every completed project automatically mints a tamper-proof ERC-721 CertifiedPass credential verifying skills, volume, and client sign-off.',
  },
];

export const HowItWorksStory: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
    trackLandingEvent('landing_tab_change', { tabId: `step-${stepId}` });
  };

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-16 sm:py-20 lg:py-24">
      <PageContainer noVerticalPadding>
        <div className="space-y-12 text-left">
          
          {/* Header */}
          <div className="max-w-2xl space-y-3">
            <div className="text-eyebrow text-[#0047AB]">How It Works</div>
            <h2 className="text-landing-h2 text-[#0B0B0F]">
              The sovereign escrow lifecycle.
            </h2>
            <p className="text-lead text-[#4B5563]">
              Four deterministic steps protecting both parties from project kick-off to permanent proof of work.
            </p>
          </div>

          {/* 2-Column Pinned Story Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Interactive Step Selector */}
            <div className="lg:col-span-5 space-y-3">
              {STEPS.map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepClick(step.id)}
                    className={`w-full text-left p-5 rounded-[12px] border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white border-[#0047AB] shadow-sm ring-1 ring-[#0047AB]'
                        : 'bg-[#F6F7F9] border-[#E5E7EB] hover:bg-white hover:border-[#D1D5DB]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${
                          isActive
                            ? 'bg-[#EAF1FB] text-[#0047AB]'
                            : 'bg-white text-[#6B7280] border border-[#E5E7EB]'
                        }`}
                      >
                        {step.badge}
                      </span>
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${
                          isActive ? 'text-[#0047AB] translate-x-0.5' : 'text-[#9CA3AF]'
                        }`}
                      />
                    </div>

                    <h3 className="text-base font-bold text-[#0B0B0F] mt-2">
                      {step.title}
                    </h3>

                    <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                      {step.lead}
                    </p>

                    {isActive && (
                      <p className="text-xs text-[#6B7280] mt-2 pt-2 border-t border-[#E5E7EB] leading-relaxed">
                        {step.detail}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Column: Visual Stage with Realistic UI Mockup */}
            <div className="lg:col-span-7 lg:sticky lg:top-24">
              <DeviceFrame
                title={`PolyLance Protocol — Step ${activeStep} of 4`}
                className="shadow-md"
              >
                <div className="p-6 sm:p-8 bg-white text-left font-sans select-none min-h-[360px] flex flex-col justify-between relative">
                  
                  {/* "Example" Watermark Badge */}
                  <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-[10px] font-semibold text-[#6B7280]">
                    <span>Example simulation</span>
                  </div>

                  {/* Stage Content based on activeStep */}
                  {activeStep === 1 && (
                    <div className="space-y-4 my-auto w-full">
                      <div className="pb-3 border-b border-[#E5E7EB] space-y-1">
                        <div className="text-xs font-semibold text-[#0047AB] uppercase tracking-wider">
                          Escrow Contract Initialized
                        </div>
                        <div className="text-base font-bold text-[#0B0B0F]">
                          Full Stack Web3 dApp Development
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-3.5 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-[#0B0B0F]">Milestone 1: Smart Contract Architecture</div>
                            <div className="text-[11px] text-[#6B7280]">Review window: {REVIEW_WINDOW_DAYS} days</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#0B0B0F]">1,000.00 USDC</div>
                            <div className="text-[10px] text-[#047857] font-semibold">Protected in Escrow</div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-[#0B0B0F]">Milestone 2: Frontend & Integration Tests</div>
                            <div className="text-[11px] text-[#6B7280]">Review window: {REVIEW_WINDOW_DAYS} days</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#0B0B0F]">1,500.00 USDC</div>
                            <div className="text-[10px] text-[#6B7280] font-semibold">Scheduled Milestone</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs text-[#166534]">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} />
                          <span>Autonomous smart contract lock on Polygon Mainnet</span>
                        </div>
                        <span className="font-bold">Verified Lock</span>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-4 my-auto w-full">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#EAF1FB] text-[#0047AB] font-bold text-xs flex items-center justify-center">
                            C
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0B0B0F]">Client (Project Sponsor)</div>
                            <div className="text-[10px] text-[#6B7280]">Workspace Chat • TLS 1.3</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#047857] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded">
                          Active Workspace
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="bg-[#F3F4F6] p-3 rounded-[8px] text-[#374151] max-w-[85%]">
                          "I have locked Milestone 1 in escrow. Please submit the deliverable and commit hash when the test suite passes."
                        </div>
                        <div className="bg-[#0047AB] text-white p-3 rounded-[8px] max-w-[85%] ml-auto text-right">
                          "Milestone 1 delivered. Commit <code>9f8a2b1</code> passed all tests and is registered to the contract."
                        </div>
                      </div>

                      <div className="p-2.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between text-xs text-[#4B5563]">
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <CheckCircle2 size={13} className="text-[#047857]" />
                          <span>SHA-256 Commit Hash Attached</span>
                        </span>
                        <span className="text-[#0047AB] font-semibold">Inspect Submission</span>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-4 my-auto w-full">
                      <div className="p-4 rounded-[10px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold text-[#166534]">Milestone 1 Approved</div>
                          <div className="text-xs text-[#166534]/90">
                            Client authorized instant smart contract release
                          </div>
                        </div>
                        <span className="font-bold text-[#166534] text-base tabular-nums">
                          975.00 USDC Net
                        </span>
                      </div>

                      <div className="p-4 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[#0B0B0F] font-bold">
                          <span>Instant Transfer Protocol</span>
                          <span className="text-[#0047AB]">Sub-cent Gas</span>
                        </div>
                        <p className="text-[#4B5563] leading-relaxed">
                          Funds execute directly from the escrow vault to the freelancer wallet with zero withdrawal spreads and zero intermediary delays.
                        </p>
                        <div className="text-[11px] text-[#6B7280] flex items-center gap-1 pt-1">
                          <Clock size={12} />
                          <span>Built-in {REVIEW_WINDOW_DAYS}-day protection window</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="space-y-4 my-auto w-full">
                      <div className="p-5 rounded-[12px] bg-white border-2 border-[#0047AB]/20 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award size={20} className="text-[#0047AB]" />
                            <span className="text-sm font-bold text-[#0B0B0F]">
                              CertifiedPass Soulbound Credential
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[#0047AB] bg-[#EAF1FB] px-2 py-0.5 rounded font-semibold">
                            ERC-721 SBT
                          </span>
                        </div>

                        <div className="text-xs text-[#4B5563] leading-relaxed">
                          Permanent cryptographic proof of verified work. Non-transferable token bound to the freelancer wallet with milestone details and client sign-off.
                        </div>

                        <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-xs">
                          <span className="text-[#047857] font-semibold flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            <span>Polygon Mainnet Confirmed</span>
                          </span>
                          <a
                            href={`${POLYGONSCAN_BASE_URL}/address/${MAINNET_CONTRACTS.reputationSBT}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0047AB] hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <span>View on Polygonscan</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Ribbon */}
                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                    <div className="flex items-center gap-1.5">
                      <PolygonIcon size={13} className="text-[#0047AB]" />
                      <span>Polygon Mainnet (Chain ID 137)</span>
                    </div>
                    <span className="font-semibold text-[#0047AB]">2.5% fee per side (5% total)</span>
                  </div>

                </div>
              </DeviceFrame>
            </div>

          </div>

        </div>
      </PageContainer>
    </section>
  );
};
