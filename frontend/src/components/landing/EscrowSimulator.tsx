import React, { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Scale,
  ArrowRight,
  ChevronDown,
  Info,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../common/Button';
import { PolygonIcon } from '../TokenIcon';
import { calculateLiveFees } from '../../utils/publicStatsMapper';
import {
  REVIEW_WINDOW_DAYS,
  DISPUTE_PANEL_SIZE,
  DISPUTE_EVIDENCE_WINDOW_DAYS,
  PLATFORM_FEE_PERCENT,
} from '../../seo/site.config';
import { trackLandingEvent } from '../../utils/analytics';
import { AudienceRole } from './LandingHero';

interface EscrowSimulatorProps {
  audience: AudienceRole;
  onAudienceChange?: (role: AudienceRole) => void;
}

export const EscrowSimulator: React.FC<EscrowSimulatorProps> = ({
  audience,
  onAudienceChange,
}) => {
  const [budget, setBudget] = useState<number>(1000);
  const [token, setToken] = useState<'POL' | 'USDC'>('USDC');
  const [milestonesCount, setMilestonesCount] = useState<number>(2);
  const [isDisputeExpanded, setIsDisputeExpanded] = useState<boolean>(false);

  const budgetInputId = useId();

  // Pure BigInt math via calculateLiveFees (enforces invariant clientDeposit = freelancerNet + platformTotal)
  const calculation = calculateLiveFees(budget, token);

  const presets = [500, 1000, 2500, 5000];

  const handleBudgetChange = (value: number) => {
    const safe = Math.max(10, Math.min(50000, value));
    setBudget(safe);
    trackLandingEvent('landing_simulator_calc', { budget: safe, token, milestones: milestonesCount });
  };

  const handleTokenChange = (selected: 'POL' | 'USDC') => {
    setToken(selected);
    trackLandingEvent('landing_simulator_calc', { budget, token: selected, milestones: milestonesCount });
  };

  const handleMilestonesChange = (count: number) => {
    const safe = Math.max(1, Math.min(5, count));
    setMilestonesCount(safe);
    trackLandingEvent('landing_simulator_calc', { budget, token, milestones: safe });
  };

  const toggleDispute = () => {
    const nextState = !isDisputeExpanded;
    setIsDisputeExpanded(nextState);
    if (nextState) {
      trackLandingEvent('landing_dispute_expand', { audience });
    }
  };

  // Milestone allocation formatted with thousands separators
  const perMilestoneBudget = (budget / milestonesCount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const freelancerNetNumber = parseFloat(calculation.freelancerReceives);
  const perMilestoneNet = (freelancerNetNumber / milestonesCount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-16 sm:py-20 lg:py-24">
      <PageContainer noVerticalPadding>
        <div className="space-y-12 text-left">
          
          {/* Header */}
          <div className="max-w-2xl space-y-3">
            <div className="text-eyebrow text-[#0047AB]">Interactive Escrow Simulator</div>
            <h2 className="text-landing-h2 text-[#0B0B0F]">
              See how escrow works before you start.
            </h2>
            <p className="text-lead text-[#4B5563]">
              Simulate any project budget and see the exact milestone breakdown, fee calculation, and security timeline.
            </p>
          </div>

          {/* Interactive Calculator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Inputs (5 Cols) */}
            <div className="lg:col-span-5 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[14px] p-6 sm:p-7 space-y-6">
              
              {/* Audience Selector inside Simulator */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                  Viewing As
                </label>
                <div
                  role="radiogroup"
                  aria-label="Simulator perspective"
                  className="grid grid-cols-2 gap-2 p-1 bg-white border border-[#E5E7EB] rounded-[8px]"
                >
                  <button
                    type="button"
                    onClick={() => onAudienceChange && onAudienceChange('freelancer')}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                      audience === 'freelancer'
                        ? 'bg-[#0047AB] text-white shadow-2xs'
                        : 'text-[#4B5563] hover:text-[#0B0B0F]'
                    }`}
                  >
                    Freelancer
                  </button>
                  <button
                    type="button"
                    onClick={() => onAudienceChange && onAudienceChange('client')}
                    className={`py-2 px-3 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                      audience === 'client'
                        ? 'bg-[#0047AB] text-white shadow-2xs'
                        : 'text-[#4B5563] hover:text-[#0B0B0F]'
                    }`}
                  >
                    Client
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                  Payment Currency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTokenChange('USDC')}
                    className={`p-3 rounded-[8px] border text-left flex items-center justify-between transition-all cursor-pointer ${
                      token === 'USDC'
                        ? 'bg-white border-[#0047AB] shadow-xs ring-1 ring-[#0047AB]'
                        : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[#0B0B0F]">USDC</div>
                      <div className="text-[11px] text-[#6B7280]">Dollar-pegged stablecoin</div>
                    </div>
                    {token === 'USDC' && <CheckCircle2 size={16} className="text-[#0047AB]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTokenChange('POL')}
                    className={`p-3 rounded-[8px] border text-left flex items-center justify-between transition-all cursor-pointer ${
                      token === 'POL'
                        ? 'bg-white border-[#0047AB] shadow-xs ring-1 ring-[#0047AB]'
                        : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[#0B0B0F] flex items-center gap-1.5">
                        <PolygonIcon size={14} className="text-[#0047AB]" />
                        <span>POL</span>
                      </div>
                      <div className="text-[11px] text-[#6B7280]">Polygon native token</div>
                    </div>
                    {token === 'POL' && <CheckCircle2 size={16} className="text-[#0047AB]" />}
                  </button>
                </div>
              </div>

              {/* Total Project Budget */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={budgetInputId} className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                    Total Project Budget
                  </label>
                  <span className="text-xs font-mono font-semibold text-[#0047AB]">
                    {budget.toLocaleString()} {token}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id={budgetInputId}
                    type="number"
                    min={10}
                    max={50000}
                    step={50}
                    value={budget}
                    onChange={(e) => handleBudgetChange(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-white border border-[#E5E7EB] text-[#0B0B0F] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B7280] pointer-events-none">
                    {token}
                  </span>
                </div>

                {/* Smooth Range Slider */}
                <div className="pt-1 space-y-1">
                  <input
                    type="range"
                    min={100}
                    max={10000}
                    step={50}
                    value={budget}
                    onChange={(e) => handleBudgetChange(Number(e.target.value) || 0)}
                    aria-label="Adjust project budget"
                    className="w-full h-1.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#0047AB]"
                  />
                  <div className="flex justify-between text-[10px] text-[#6B7280]">
                    <span>100 {token}</span>
                    <span>5,000 {token}</span>
                    <span>10,000 {token}</span>
                  </div>
                </div>

                {/* Preset Pills */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#6B7280] mr-1">Presets:</span>
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleBudgetChange(preset)}
                      className={`px-2.5 py-1 text-xs rounded-[6px] border font-medium transition-colors cursor-pointer ${
                        budget === preset
                          ? 'bg-[#EAF1FB] text-[#0047AB] border-[#0047AB]'
                          : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestones Stepper */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider">
                    Number of Milestones
                  </label>
                  <span className="text-xs font-semibold text-[#0047AB]">
                    {milestonesCount} {milestonesCount === 1 ? 'Milestone' : 'Milestones'}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleMilestonesChange(count)}
                      className={`py-2 text-center text-xs font-bold rounded-[6px] border transition-all cursor-pointer ${
                        milestonesCount === count
                          ? 'bg-[#0047AB] text-white border-[#0047AB]'
                          : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:border-[#D1D5DB]'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  Each milestone holds ~{perMilestoneBudget} {token} in escrow
                </div>
              </div>

              {/* Contextual CTA Button */}
              <div className="pt-2">
                <Button
                  as="Link"
                  to={
                    audience === 'freelancer'
                      ? `/jobs?token=${token}`
                      : `/jobs/post?budget=${budget}&token=${token}`
                  }
                  variant="primary"
                  size="lg"
                  trailingIcon={<ArrowRight size={16} />}
                  className="w-full justify-center"
                >
                  {audience === 'freelancer'
                    ? `Find jobs paying ${token}`
                    : `Post project with this budget`}
                </Button>
              </div>

            </div>

            {/* Right Column: Breakdown & Timeline (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Summary Card with exact fee breakdown & Autonomous Money Flow */}
              <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0047AB]">
                    Exact Fee Breakdown (Zero Hidden Spreads)
                  </span>
                  <span className="text-xs text-[#6B7280]">Polygon Mainnet</span>
                </div>

                {/* Visual Money-Flow Stage: Client Wallet -> Escrow Contract -> Freelancer Wallet */}
                <div className="p-4 rounded-[12px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                    Autonomous Value Flow
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center text-center">
                    {/* Stage 1: Client */}
                    <div className="p-2.5 rounded-[8px] bg-white border border-[#E5E7EB] shadow-2xs">
                      <div className="text-[10px] sm:text-xs font-semibold text-[#6B7280]">Client Wallet</div>
                      <div className="text-xs sm:text-sm font-bold text-[#0B0B0F] tabular-nums mt-0.5">
                        {calculation.clientPays} {token}
                      </div>
                      <div className="text-[10px] text-[#0047AB] font-medium">+2.5% protocol fee</div>
                    </div>

                    {/* Flow arrow -> Escrow */}
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-center text-[#0047AB]">
                        <span className="text-xs font-bold sm:hidden">→</span>
                        <div className="hidden sm:flex items-center w-full">
                          <div className="h-0.5 bg-[#0047AB]/30 flex-1" />
                          <Lock size={14} className="text-[#0047AB] shrink-0 mx-1" />
                          <div className="h-0.5 bg-[#0047AB]/30 flex-1" />
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#0047AB] mt-1">Locked in Escrow</span>
                    </div>

                    {/* Stage 3: Freelancer */}
                    <div className="p-2.5 rounded-[8px] bg-[#EAF1FB] border border-[#D0DEF2] shadow-2xs">
                      <div className="text-[10px] sm:text-xs font-semibold text-[#0047AB]">Freelancer Wallet</div>
                      <div className="text-xs sm:text-sm font-bold text-[#0047AB] tabular-nums mt-0.5">
                        {calculation.freelancerReceives} {token}
                      </div>
                      <div className="text-[10px] text-[#0047AB]/80 font-medium">-2.5% protocol fee</div>
                    </div>
                  </div>

                  {/* Stacked Fee Split Bar: 2.5% client + 2.5% freelancer = 5% protocol fee */}
                  <div className="pt-1 space-y-1">
                    <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden flex">
                      <div className="bg-[#0047AB] h-full" style={{ width: '95%' }} title="Freelancer Net" />
                      <div className="bg-[#00388A] h-full" style={{ width: '2.5%' }} title="Freelancer Fee 2.5%" />
                      <div className="bg-[#4B5563] h-full" style={{ width: '2.5%' }} title="Client Fee 2.5%" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0047AB]" />
                        Freelancer Net (97.5%)
                      </span>
                      <span className="flex items-center gap-1 font-medium text-[#0B0B0F]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00388A]" />
                        2.5% fee per side (5.0% total protocol fee)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                    <span className="text-xs text-[#6B7280] block">Client Deposits</span>
                    <span className="text-lg font-bold text-[#0B0B0F] tabular-nums">
                      {calculation.clientPays} {token}
                    </span>
                    <span className="text-[11px] text-[#4B5563] block">
                      Budget + 2.5% fee ({calculation.clientFee} {token})
                    </span>
                  </div>

                  <div className="p-3.5 rounded-[10px] bg-[#EAF1FB] border border-[#D0DEF2] space-y-1">
                    <span className="text-xs text-[#0047AB] font-semibold block">Freelancer Receives</span>
                    <span className="text-lg font-bold text-[#0047AB] tabular-nums">
                      {calculation.freelancerReceives} {token}
                    </span>
                    <span className="text-[11px] text-[#0047AB]/80 block">
                      Budget - 2.5% fee ({calculation.freelancerFee} {token})
                    </span>
                  </div>

                  <div className="p-3.5 rounded-[10px] bg-[#F6F7F9] border border-[#E5E7EB] space-y-1">
                    <span className="text-xs text-[#6B7280] block">Platform Fee Total</span>
                    <span className="text-lg font-bold text-[#0B0B0F] tabular-nums">
                      {calculation.totalFee} {token}
                    </span>
                    <span className="text-[11px] text-[#4B5563] block">
                      5.0% total protocol fee
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#6B7280] flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <Info size={13} className="text-[#0047AB]" />
                    <span>Estimated network gas: <strong>&lt; $0.005 on Polygon</strong></span>
                  </div>
                  <span>Zero withdrawal fees</span>
                </div>
              </div>

              {/* Visual Step-by-Step Security Timeline */}
              <div className="bg-[#F6F7F9] border border-[#E5E7EB] rounded-[14px] p-6 space-y-4">
                <h3 className="text-sm font-bold text-[#0B0B0F]">
                  Escrow Execution Lifecycle
                </h3>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-[#0B0B0F]">Deposit Locked in Escrow</div>
                      <p className="text-[#4B5563]">
                        Client deposits <strong>{calculation.clientPays} {token}</strong> into the autonomous Polygon smart contract. Freelancer sees locked collateral before starting work.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-[#0B0B0F]">Milestone Delivered</div>
                      <p className="text-[#4B5563]">
                        Freelancer submits deliverable code with SHA-256 commit hash verification directly through the workspace.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-[#0B0B0F]">
                        Client Review Window ({REVIEW_WINDOW_DAYS} Days)
                      </div>
                      <p className="text-[#4B5563]">
                        Client inspects deliverables. If satisfied, one click triggers payment. If client becomes unresponsive, freelancer can claim auto-release after {REVIEW_WINDOW_DAYS} days.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#047857] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      4
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-[#047857]">Instant Payment & Soulbound Certificate</div>
                      <p className="text-[#4B5563]">
                        Smart contract transfers <strong>{calculation.freelancerReceives} {token}</strong> directly to freelancer wallet and mints a permanent CertifiedPass credential.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expandable Dispute Resolution Branch */}
                <div className="pt-2 border-t border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={toggleDispute}
                    aria-expanded={isDisputeExpanded}
                    className="w-full flex items-center justify-between text-xs font-semibold text-[#0047AB] hover:underline cursor-pointer py-1.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <Scale size={14} />
                      <span>What if there is a disagreement during review?</span>
                    </span>
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${
                        isDisputeExpanded ? 'rotate-180 text-[#0047AB]' : 'text-[#6B7280]'
                      }`}
                    />
                  </button>

                  {isDisputeExpanded && (
                    <div className="mt-3 p-4 bg-white border border-[#E5E7EB] rounded-[10px] space-y-2 text-xs text-[#4B5563] animate-fadeIn">
                      <div className="font-bold text-[#0B0B0F] flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#0047AB]" />
                        <span>Decentralized Peer Arbitration</span>
                      </div>
                      <p>
                        Either party can initiate dispute resolution before milestone release. A {DISPUTE_PANEL_SIZE}-judge peer panel is selected via JudgeDAO on Polygon. Both parties have a {DISPUTE_EVIDENCE_WINDOW_DAYS}-day evidence submission window to submit specifications, repo logs, and messages.
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        The verdict triggers smart contract bytecode execution directly: full release, full refund, or a percentage split. PolyLance operators cannot unilaterally seize or redirect escrow funds.
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>
      </PageContainer>
    </section>
  );
};
