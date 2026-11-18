import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  Award,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Scale,
  ExternalLink,
  PlusCircle,
  Search,
  Calculator,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { Seo } from '../components/seo/Seo';
import { FaqSection } from '../components/faq/FaqSection';
import {
  REVIEW_WINDOW_DAYS,
  PLATFORM_FEE_PERCENT,
  DISPUTE_PANEL_SIZE,
  DISPUTE_EVIDENCE_WINDOW_DAYS,
  MAINNET_CONTRACTS,
  POLYGONSCAN_BASE_URL,
} from '../seo/site.config';

interface StepItem {
  id: number;
  badge: string;
  title: string;
  lead: string;
  detail: string;
  highlight: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    badge: 'Step 1',
    title: 'Fund escrow',
    lead: 'Define milestones and commit funds into Polygon smart contracts.',
    detail: 'Before work starts, the client deposits project funds directly into an autonomous escrow vault on Polygon PoS. The freelancer verifies locked collateral on-chain before writing a line of code.',
    highlight: 'Funds locked in autonomous bytecode — no central custody.',
  },
  {
    id: 2,
    badge: 'Step 2',
    title: 'Private chat & deliver',
    lead: 'Coordinate in real time and submit verifiable deliverables.',
    detail: 'Communicate specifications using wallet-authenticated messaging. Freelancers submit deliverables, repository links, and commit hashes directly to the contract record.',
    highlight: 'Wallet signature login — no phone numbers or emails required.',
  },
  {
    id: 3,
    badge: 'Step 3',
    title: 'Inspect & release',
    lead: '7-day inspection window with one-click approval or auto-release.',
    detail: `The client reviews deliverables against agreed specifications. One click releases payment. If a client is unresponsive, the freelancer can claim auto-release after ${REVIEW_WINDOW_DAYS} days on-chain.`,
    highlight: `${REVIEW_WINDOW_DAYS}-day client inspection window with on-chain timeout protection.`,
  },
  {
    id: 4,
    badge: 'Step 4',
    title: 'Soulbound certificate',
    lead: 'Permanent work credential registered to the freelancer wallet.',
    detail: 'Upon approved payment release, an ERC-721 CertifiedPass credential is automatically minted to the freelancer’s address on Polygon, building a portable and verifiable work history.',
    highlight: 'Non-transferable on-chain proof of completed work.',
  },
];

export const HowItWorksPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#fund-escrow') {
      setActiveStep(1);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0B0B0F] font-sans pb-20">
      <Seo routeKey="/how-it-works" />

      {/* Top Breadcrumb & Return Header */}
      <div className="w-full bg-[#F6F7F9] border-b border-[#E5E7EB] py-3.5">
        <PageContainer noVerticalPadding>
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-medium">
              <Link to="/" className="hover:text-[#0047AB] transition-colors inline-flex items-center gap-1">
                <ChevronLeft size={14} />
                <span>Home</span>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-[#0B0B0F] font-semibold">How It Works</span>
            </nav>
            <div className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-[#4B5563]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Polygon PoS Mainnet</span>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Hero Header */}
      <header className="w-full bg-white border-b border-[#E5E7EB] pt-12 pb-14 sm:pt-16 sm:pb-18">
        <PageContainer noVerticalPadding>
          <div className="max-w-3xl space-y-4 text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
              Protocol Workflow
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B0B0F] tracking-tight">
              How PolyLance works
            </h1>
            <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed">
              Four steps from agreement to payout, with your funds protected at every stage.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#0047AB]">
              <Link
                to="/escrow-simulator"
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                <Calculator size={15} />
                <span>Try the Escrow Simulator</span>
              </Link>
              <span className="text-gray-300">·</span>
              <Link to="/fees" className="hover:underline">
                Transparent Fee Schedule (2.5% per side)
              </Link>
            </div>
          </div>
        </PageContainer>
      </header>

      {/* Main Content Area */}
      <main className="py-12 sm:py-16 space-y-16">
        <PageContainer noVerticalPadding>
          <div className="space-y-16 text-left">
            
            {/* 2-Column Interactive Step Walkthrough */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Interactive Step Navigation */}
              <div className="lg:col-span-5 space-y-3.5">
                {STEPS.map((step) => {
                  const isActive = activeStep === step.id;
                  return (
                    <button
                      key={step.id}
                      id={step.id === 1 ? 'fund-escrow' : undefined}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer scroll-mt-28 ${
                        isActive
                          ? 'bg-white border-[#0047AB] shadow-sm ring-1 ring-[#0047AB]'
                          : 'bg-[#F6F7F9] border-[#E5E7EB] hover:bg-white hover:border-[#D1D5DB]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
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

                      <h2 className="text-base font-bold text-[#0B0B0F] mt-2">
                        {step.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-[#4B5563] mt-1 leading-relaxed">
                        {step.lead}
                      </p>

                      {isActive && (
                        <p className="text-xs text-[#6B7280] mt-3 pt-3 border-t border-[#E5E7EB] leading-relaxed">
                          {step.detail}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Clean Schematic Illustration of Selected Step */}
              <div className="lg:col-span-7 bg-[#F6F7F9] border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6 lg:sticky lg:top-24 shadow-xs">
                
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                  <div>
                    <span className="text-xs font-semibold text-[#0047AB] uppercase tracking-wider block">
                      Stage {activeStep} of 4
                    </span>
                    <h3 className="text-lg font-bold text-[#0B0B0F] mt-0.5">
                      {STEPS[activeStep - 1].title}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#0047AB] shadow-2xs">
                    {activeStep === 1 && <Lock size={20} />}
                    {activeStep === 2 && <MessageSquare size={20} />}
                    {activeStep === 3 && <Clock size={20} />}
                    {activeStep === 4 && <Award size={20} />}
                  </div>
                </div>

                {/* Schematic Visual Box */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-2xs">
                  {activeStep === 1 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#6B7280]">
                          <span className="font-semibold text-[#0B0B0F]">Escrow Contract Deposit</span>
                          <span className="font-mono text-emerald-600 font-bold">LOCKED</span>
                        </div>
                        <div className="text-xl font-bold text-[#0B0B0F] tabular-nums">
                          1,000.00 USDC
                        </div>
                        <div className="text-xs text-[#4B5563]">
                          Collateral securely locked in non-custodial smart contract escrow
                        </div>
                      </div>
                      <ul className="space-y-2 text-xs text-[#4B5563]">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>Client commits funds before work commences</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>Freelancer verifies locked deposit on Polygonscan</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>Neither party can unilaterally withdraw without review</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-2">
                        <div className="text-xs font-semibold text-[#0B0B0F]">
                          Workspace Collaboration &amp; Submission
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-mono text-[#4B5563] flex items-center justify-between">
                            <span>GitHub PR: #42 (Milestone deliverable)</span>
                            <span className="text-[#0047AB] font-bold">Attached</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-xs font-mono text-[#4B5563] flex items-center justify-between">
                            <span>Evidence Submission Hash: 0x7f8a...c93b</span>
                            <span className="text-[#0047AB] font-bold">Recorded</span>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-2 text-xs text-[#4B5563]">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>Wallet-signed real-time chat with read receipts</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>Milestone deliverables submitted directly to contract record</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#6B7280]">
                          <span className="font-semibold text-[#0B0B0F]">Client Review Period</span>
                          <span className="font-semibold text-[#0047AB]">{REVIEW_WINDOW_DAYS} Days Active</span>
                        </div>
                        <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div className="bg-[#0047AB] h-full rounded-full" style={{ width: '60%' }} />
                        </div>
                        <div className="text-xs text-[#4B5563]">
                          Client inspects code deliverables. Approval dispatches funds instantly to freelancer. If unresponsive, auto-release activates after day 7.
                        </div>
                      </div>
                      <ul className="space-y-2 text-xs text-[#4B5563]">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>One-click approval dispatches payment in ~2 seconds</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>Guaranteed protection against indefinite client ghosting</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#EAF1FB] border border-[#D0DEF2] space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#0047AB] font-bold">
                          <span>CertifiedPass Credential Minted</span>
                          <span>ERC-721 Soulbound</span>
                        </div>
                        <div className="text-base font-bold text-[#0B0B0F]">
                          Polygon Mainnet On-Chain Proof
                        </div>
                        <div className="text-xs text-[#4B5563]">
                          Non-transferable reputation token bound permanently to the freelancer’s wallet address.
                        </div>
                      </div>
                      <ul className="space-y-2 text-xs text-[#4B5563]">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>Reputation remains portable across Web3</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[#0047AB] shrink-0" />
                          <span>Publicly verifiable by any employer on Polygonscan</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] space-y-1">
                  <div className="font-semibold text-[#0B0B0F] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#0047AB]" />
                    <span>Verified Mechanism</span>
                  </div>
                  <p className="leading-relaxed">
                    {STEPS[activeStep - 1].highlight}
                  </p>
                </div>

              </div>

            </div>

            {/* Dispute Resolution Section */}
            <div id="disputes" className="p-8 sm:p-10 rounded-2xl bg-[#F6F7F9] border border-[#E5E7EB] space-y-6 scroll-mt-28">
              <div className="max-w-2xl space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#0047AB] flex items-center gap-1.5">
                  <Scale size={14} />
                  <span>Decentralized Dispute Resolution</span>
                </div>
                <h3 className="text-2xl font-bold text-[#0B0B0F] tracking-tight">
                  What if deliverables are contested?
                </h3>
                <p className="text-sm text-[#4B5563] leading-relaxed">
                  Either client or freelancer can initiate arbitration before milestone release. A {DISPUTE_PANEL_SIZE}-judge peer panel is randomly selected via JudgeDAO on Polygon. Both parties submit evidence (chat history, code commits, requirements) during a {DISPUTE_EVIDENCE_WINDOW_DAYS}-day evidence submission window.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
                  <span className="text-xs font-semibold text-[#6B7280] block mb-1">Arbitration Panel</span>
                  <span className="text-lg font-bold text-[#0B0B0F]">{DISPUTE_PANEL_SIZE} Independent Judges</span>
                  <p className="text-xs text-[#4B5563] mt-1">Staked peer arbitrators without platform conflict of interest</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
                  <span className="text-xs font-semibold text-[#6B7280] block mb-1">Evidence Window</span>
                  <span className="text-lg font-bold text-[#0B0B0F]">{DISPUTE_EVIDENCE_WINDOW_DAYS} Days (72h)</span>
                  <p className="text-xs text-[#4B5563] mt-1">Both sides submit specifications and deliverables</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E5E7EB]">
                  <span className="text-xs font-semibold text-[#6B7280] block mb-1">Ruling Execution</span>
                  <span className="text-lg font-bold text-[#0047AB]">Smart Contract Executed</span>
                  <p className="text-xs text-[#4B5563] mt-1">Bytecode executes payment split directly on-chain</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/faq"
                  className="text-xs font-semibold text-[#0047AB] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Review frequently asked questions about arbitration &amp; disputes</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* FAQs */}
            <div className="pt-6">
              <FaqSection pageId="/how-it-works" />
            </div>

            {/* Bottom Actions CTA */}
            <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-[#0047AB] to-[#003882] text-white text-center space-y-6">
              <div className="max-w-2xl mx-auto space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Ready to start working with escrow protection?
                </h3>
                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                  Join verified clients and freelancers transacting safely on Polygon.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  as="Link"
                  to="/jobs"
                  variant="secondary"
                  size="lg"
                  leadingIcon={<Search size={16} />}
                  className="w-full sm:w-auto bg-white text-[#0047AB] hover:bg-gray-100"
                >
                  Find freelance work
                </Button>
                <Button
                  as="Link"
                  to="/jobs/post"
                  variant="primary"
                  size="lg"
                  leadingIcon={<PlusCircle size={16} />}
                  className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white border-transparent"
                >
                  Post a project
                </Button>
                <Button
                  as="Link"
                  to="/escrow-simulator"
                  variant="secondary"
                  size="lg"
                  leadingIcon={<Calculator size={16} />}
                  className="w-full sm:w-auto bg-transparent border-white/30 text-white hover:bg-white/10"
                >
                  Try the simulator
                </Button>
              </div>
            </div>

          </div>
        </PageContainer>
      </main>
    </div>
  );
};

export default HowItWorksPage;
