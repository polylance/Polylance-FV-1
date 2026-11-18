import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  Award,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { DeviceFrame } from '../video/DeviceFrame';
import { PolygonIcon } from '../TokenIcon';
import { REVIEW_WINDOW_DAYS, PLATFORM_FEE_PERCENT, MAINNET_CONTRACTS, POLYGONSCAN_BASE_URL } from '../../seo/site.config';
import { trackLandingEvent } from '../../utils/analytics';

type TourTabId = 'post' | 'chat' | 'release' | 'cert';

interface TourTab {
  id: TourTabId;
  label: string;
  headline: string;
  description: string;
}

const TABS: TourTab[] = [
  {
    id: 'post',
    label: '1. Fund Escrow',
    headline: 'Define milestones & lock budget on Polygon',
    description: 'Clients specify deliverables and commit funds into an autonomous smart contract before work starts.',
  },
  {
    id: 'chat',
    label: '2. Private Chat',
    headline: 'Encrypted discussions & deliverable submissions',
    description: 'Discuss technical requirements securely. Submit GitHub commits and milestone deliverables directly.',
  },
  {
    id: 'release',
    label: '3. Inspect & Release',
    headline: '7-day inspection window with instant release',
    description: `Clients review deliverables. One click releases escrowed funds directly to the freelancer's wallet.`,
  },
  {
    id: 'cert',
    label: '4. Verified Certificate',
    headline: 'Permanent ERC-721 Soulbound credential',
    description: 'Every completed project automatically mints a non-transferable certificate owned by your wallet.',
  },
];

export const ProductTour: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TourTabId>('post');

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleTabChange = (tabId: TourTabId) => {
    setActiveTab(tabId);
    trackLandingEvent('landing_tab_change', { tabId });
  };

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-16 sm:py-20 lg:py-24">
      <PageContainer noVerticalPadding>
        <div className="max-w-[1280px] mx-auto space-y-12 text-left">
          
          {/* Header */}
          <div className="max-w-2xl space-y-3">
            <div className="text-eyebrow text-[#0047AB]">Product Tour</div>
            <h2 className="text-landing-h2 text-[#0B0B0F]">
              How work gets done on PolyLance.
            </h2>
            <p className="text-lead text-[#4B5563]">
              From funded milestone escrow to Soulbound reputation credentials, explore the full project lifecycle.
            </p>
          </div>

          {/* Interactive Browser Frame with Tabs */}
          <div className="space-y-6">
            
            {/* Tab Buttons (role="tablist") */}
            <div
              role="tablist"
              aria-label="Product tour stages"
              className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] pb-3"
            >
              {TABS.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    id={`tour-tab-${tab.id}`}
                    aria-controls={`tour-panel-${tab.id}`}
                    aria-selected={isSelected}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-[8px] transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#0047AB] text-white shadow-xs font-bold'
                        : 'bg-[#F6F7F9] text-[#4B5563] hover:text-[#0B0B0F] hover:bg-[#E5E7EB]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Stage Description Bar */}
            <div className="bg-[#EAF1FB] border border-[#D0DEF2] rounded-[10px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div>
                <strong className="text-[#0B0B0F] block sm:inline mr-2">
                  {currentTab.headline}
                </strong>
                <span className="text-[#4B5563]">{currentTab.description}</span>
              </div>
              <span className="text-xs font-semibold text-[#0047AB] shrink-0">
                Polygon Mainnet
              </span>
            </div>

            {/* Interactive Browser Window */}
            <DeviceFrame
              title={`PolyLance Workspace — ${currentTab.headline}`}
              className="shadow-md"
            >
              <div
                role="tabpanel"
                id={`tour-panel-${activeTab}`}
                aria-labelledby={`tour-tab-${activeTab}`}
                className="p-5 sm:p-7 bg-white text-left font-sans select-none min-h-[340px] flex flex-col justify-between"
              >
                {/* 1. POST / FUND ESCROW TAB */}
                {activeTab === 'post' && (
                  <div className="space-y-5 my-auto max-w-2xl mx-auto w-full">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                      <div>
                        <div className="text-sm font-bold text-[#0B0B0F]">Escrow Configuration</div>
                        <div className="text-xs text-[#6B7280]">Contract deployed via JobFactory</div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EAF1FB] text-[#0047AB] text-xs font-bold">
                        <Lock size={12} />
                        <span>Ready to Fund</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#0B0B0F]">Milestone 1: Smart Contract Architecture</div>
                          <div className="text-[11px] text-[#6B7280]">Review window: {REVIEW_WINDOW_DAYS} days</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#0B0B0F]">1,000 USDC</div>
                          <div className="text-[10px] text-[#047857]">Protected in Escrow</div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#0B0B0F]">Milestone 2: Frontend Integration & Unit Tests</div>
                          <div className="text-[11px] text-[#6B7280]">Review window: {REVIEW_WINDOW_DAYS} days</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#0B0B0F]">1,500 USDC</div>
                          <div className="text-[10px] text-[#6B7280]">Pending Funding</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between text-xs text-[#166534]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} />
                        <span>Client fee: {PLATFORM_FEE_PERCENT}% • Freelancer fee: {PLATFORM_FEE_PERCENT}%</span>
                      </div>
                      <span className="font-bold">Autonomous Execution</span>
                    </div>
                  </div>
                )}

                {/* 2. PRIVATE CHAT TAB */}
                {activeTab === 'chat' && (
                  <div className="space-y-4 my-auto max-w-2xl mx-auto w-full">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#EAF1FB] text-[#0047AB] font-bold text-xs flex items-center justify-center">
                          C
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0B0B0F]">Client (0x7F2...8C1)</div>
                          <div className="text-[10px] text-[#6B7280]">Encrypted in Transit (TLS 1.3)</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#047857] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded">
                        Active Workspace
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="bg-[#F3F4F6] p-3 rounded-[8px] text-[#374151] max-w-[85%]">
                        "I've funded Milestone 1 in escrow. Please submit the repository link and commit hash when the test suite passes."
                      </div>
                      <div className="bg-[#0047AB] text-white p-3 rounded-[8px] max-w-[85%] ml-auto text-right">
                        "Milestone 1 is complete with 100% test coverage. Deliverables and git commit hash are submitted to the contract."
                      </div>
                    </div>

                    <div className="p-2.5 rounded-[8px] bg-[#F6F7F9] border border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                        <CheckCircle2 size={13} className="text-[#047857]" />
                        <span>Work deliverable registered on-chain</span>
                      </span>
                      <span className="text-[#0047AB] font-semibold">Inspect Code</span>
                    </div>
                  </div>
                )}

                {/* 3. INSPECT & RELEASE TAB */}
                {activeTab === 'release' && (
                  <div className="space-y-4 my-auto max-w-2xl mx-auto w-full">
                    <div className="p-4 rounded-[10px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-[#166534]">Milestone 1 Approved</div>
                        <div className="text-xs text-[#166534]/90">
                          Funds authorized for release by client
                        </div>
                      </div>
                      <span className="font-bold text-[#166534] text-base tabular-nums">
                        975.00 USDC Net
                      </span>
                    </div>

                    <div className="p-4 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#0B0B0F] font-bold">
                        <span>Autonomous Release Protocol</span>
                        <span className="text-[#0047AB]">Direct Transfer</span>
                      </div>
                      <p className="text-[#4B5563] leading-relaxed">
                        Funds move directly from the escrow smart contract into the freelancer's Polygon address without intermediaries or holding periods.
                      </p>
                      <div className="text-[11px] text-[#6B7280] flex items-center gap-1 pt-1">
                        <Clock size={12} />
                        <span>Client review window: {REVIEW_WINDOW_DAYS} days</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. VERIFIED CERTIFICATE TAB */}
                {activeTab === 'cert' && (
                  <div className="space-y-4 my-auto max-w-2xl mx-auto w-full">
                    <div className="p-5 rounded-[12px] bg-[#FFFFFF] border-2 border-[#0047AB]/20 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award size={20} className="text-[#0047AB]" />
                          <span className="text-sm font-bold text-[#0B0B0F]">
                            CertifiedPass Soulbound Credential
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#0047AB] bg-[#EAF1FB] px-2 py-0.5 rounded">
                          ERC-721 SBT
                        </span>
                      </div>

                      <div className="text-xs text-[#4B5563] leading-relaxed">
                        Verifiable on-chain proof of completed project deliverables. Non-transferable token permanently linked to the freelancer's cryptographic wallet.
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
                          <span>View Registry</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Frame Status Ribbon */}
                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#6B7280]">
                  <div className="flex items-center gap-1.5">
                    <PolygonIcon size={13} className="text-[#0047AB]" />
                    <span>Polygon Mainnet (Chain ID 137)</span>
                  </div>
                  <span className="font-semibold text-[#0047AB]">Verified Smart Contract</span>
                </div>

              </div>
            </DeviceFrame>

          </div>

        </div>
      </PageContainer>
    </section>
  );
};
